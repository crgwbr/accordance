#!/usr/bin/env node

import os = require('os');
import path = require('path');
import childProcess = require( 'child_process' );
import program = require('commander');
import readline = require('readline');
import {ConnectConfig, Client, ClientChannel} from 'ssh2';
import {FSWatcher} from 'chokidar';
import {getPackageInfo, checkForUpdates} from './utils/manifest';
import {
    IAccordanceConfig,
    readConfig,
    getAnyMatchIgnorePatterns,
    writeUnisonConfigFile,
} from './utils/config';
import {
    makeRed,
    makeYellow,
    makeGreen,
    registerCleanupFn,
} from './utils/cli';
import {SyncQueue} from './utils/queue';
import {buildWatcher} from './utils/watch';
import {getConnection} from './utils/remote';


class AccordCLI {

    /**
     * CLI argument string
     */
    private readonly argv: string[];

    /**
     * Queue of directories that need sync'd. Will be processed in FIFO order.
     */
    private readonly syncQueue = new SyncQueue(() => { this.runSync(); });

    /**
     * True when unison sync process is running. Used to prevent multiple sync processes from running concurrently.
     */
    private syncIsRunning: boolean = false;

    /**
     * SSH connection to the remote host. Used to listen for remote INOTIFY events.
     */
    private sshClient: Client | undefined;

    /**
     * Input/Output stream from the SSH connection to the remote host.
     */
    private remoteWatcher: ClientChannel | undefined;

    /**
     * Local FSEvents / INOTIFY watcher.
     */
    private localWatcher: FSWatcher | undefined;


    /**
     * Constructor. Initialize the class with an argv string array.
     */
    constructor (argv: string[]) {
        this.argv = argv;
    }


    /**
     * Main entry point for the CLI program.
     *
     * Parses and validates command line options and then dispatches the appropriate action.
     */
    public async run() {
        const self = this;
        const pkg = getPackageInfo();

        // Check for outdated pkg
        const updateInfo = await checkForUpdates();
        if (updateInfo.isOutdated) {
            console.warn(makeYellow(
                `You have ${updateInfo.name} version ${updateInfo.current} installed. The latest is ${updateInfo.latest}.\n` +
                `Run \`npm -g install ${updateInfo.name}\` to upgrade.\n`
            ));
        }

        // Setup basic CLI info
        program
            .version(pkg.version);

        // Setup initiator action. This watches local FSevents directly, connects to the remote host over SSH to watch
        // remote FSevents (by running another instance of itself, remotely, in watch more), and runs the actual
        // unison sync process when an FSevent is received.
        program
            .command('sync <configPath>')
            .description('Run bidirectional sync process with file watching.')
            .action((configPath) => {
                self.run__sync(configPath);
            });

        // Setup remote watcher action. This command is ran over an SSH connection by the sync initiator. It doesn't
        // actually sync anything - it just watches the given directory and dumps FSevent notifications to stdout. The
        // sync initiator reacts to those events by running the sync process.
        program
            .command('watch <rootPath>')
            .option("-i, --ignore <patterns>", "File patterns to ignore, separated by semicolons.")
            .description('Run file watcher and dump changed files to stdout.')
            .action((rootPath, options) => {
                const ignorePatterns = options.ignore
                    ? (options.ignore as string).split(';')
                    : [];
                self.run__watch(rootPath, ignorePatterns);
            });

        // Setup catch-all action.
        program
            .command('*', '', { noHelp: true, })
            .action((cmd) => {
                console.error(makeRed(`Unknown command was provided: "${cmd}"`));
                self.die();
            });

        // Parse and run
        program.parse(this.argv);
        if (program.args.length <= 0) {
            self.die();
        }
    }


    /**
     * Output CLI command help and exit the process.
     */
    private die() {
        program.outputHelp(makeRed);
        process.exit(1);
    }


    /**
     * Run the sync initiator process. This does 3 things:
     *
     * 1. Watch local FS (INOTIFY) events.
     * 2. Watch remote FS (INOTIFY) events over an SSH connection.
     * 3. Queue / run syncs whenever a change is detected.
     */
    private run__sync(configPath: string) {
        const self = this;

        // Read the configuration file
        const config = readConfig(configPath);

        // Create unison configuration file
        writeUnisonConfigFile(config);

        // Figure out which files to ignore
        const watchIgnorePatterns = this.getWatchIgnorePatterns(config);

        // Start local file watcher
        this.watchLocal(config, watchIgnorePatterns);

        // Start remote file watcher
        this.watchRemote(config, watchIgnorePatterns);

        // Make sure that file watchers are closed when the process exits
        registerCleanupFn(() => {
            console.log('Closing file watchers...');
            if (self.localWatcher) {
                self.localWatcher.close();
            }

            console.log('Closing SSH connection...');
            if (self.remoteWatcher) {
                self.remoteWatcher.write('\x03');
                self.remoteWatcher.close();
            }
            if (self.sshClient) {
                self.sshClient.end();
            }

            console.log('Done.');
        });
    }


    /**
     * Run the remote file watcher. Dumps FS events to stdout so they can be read over SSH.
     */
    private run__watch(rootPath: string, ignorePatterns: string[]) {
        const watcher = buildWatcher(rootPath, ignorePatterns);

        // Start remote file watcher
        watcher.on('ready', () => {
            const watches = watcher.getWatched();
            const dirs = Object.keys(watches);
            const fileCount = dirs.reduce((memo, dir) => {
                return memo + watches[dir].length;
            }, 0);
            process.stdout.write(`Finished initial scan. Watching ${fileCount} files in ${dirs.length} directories.\n`);
        });

        // Dump change events to stdout
        watcher.on('all', (eventType: string, filePath: string) => {
            const relPath = path.relative(rootPath, filePath);
            const msg = JSON.stringify(['remote', eventType, relPath]);
            process.stdout.write(`CMD: ${msg}\n`);
        });

        // Make sure that file watchers are closed when the process exits
        registerCleanupFn(() => {
            process.stdout.write(`Closing remote file watchers...\n`);
            watcher.close();
            process.stdout.write(`Done.\n`);
        });
    }


    private watchRemote (config: IAccordanceConfig, ignorePatterns: string[]) {
        const self = this;
        const sshAgentSock = process.env.SSH_AUTH_SOCK;
        const sshConfig: ConnectConfig = {
            host: config.remote.host,
            port: 22,
            username: config.remote.username || os.userInfo().username,
            agent: sshAgentSock,
        };
        const cmd = ['accordance', 'watch', config.remote.root];
        if (ignorePatterns.length > 0) {
            cmd.push('-i');
            cmd.push(`'${ignorePatterns.join(';')}'`);
        }

        const handleRemoteOutputLine = function(line: string) {
            const command = line.match(/^CMD:\s(.+)$/);
            if (!command) {
                console.log(`REMOTE: ${line}`);
                return;
            }
            const [source, eventType, filePath] = (JSON.parse(command[1]) as string[]);
            self.syncQueue.queue(config, source, eventType, filePath);
        };

        getConnection(sshConfig, (conn) => {
            self.sshClient = conn;
            conn.exec(cmd.join(' '), { pty: true }, (err, stream) => {
                if (err) {
                    throw err;
                }

                self.remoteWatcher = stream;

                // Buffer stdout and action on each line
                const stdoutBuffer = readline.createInterface({ input: stream, });
                stdoutBuffer.on('line', (line: string) => {
                    handleRemoteOutputLine(line);
                });

                // Buffer stderr and log each line
                const stderrBuffer = readline.createInterface({ input: stream.stderr, });
                stderrBuffer.on('line', (line: string) => {
                    console.log(makeRed(`REMOTE ERROR: ${line}`));
                });

                // Log connection close events
                stream.on('close', (code: number, signal: number) => {
                    console.log(makeRed(`Connection to remote was closed with code ${code}, signal: ${signal}`));
                    conn.end();
                });
            });
        });
    }


    private watchLocal (config: IAccordanceConfig, ignorePatterns: string[]) {
        const self = this;

        console.log('Starting local file watchers...');

        const watcher = buildWatcher(config.local.root, ignorePatterns);
        watcher.on('ready', () => {
            const watches = watcher.getWatched();
            const dirs = Object.keys(watches);
            const fileCount = dirs.reduce((memo, dir) => {
                return memo + watches[dir].length;
            }, 0);
            console.log(`Finished initial scan. Watching ${fileCount} files in ${dirs.length} directories.`);

            // Run initial sync
            self.syncQueue.queue(config, 'local', 'initial', '.');
        });

        // React to FS changes
        watcher.on('all', (eventType: string, filePath: string) => {
            const relPath = path.relative(config.local.root, filePath);
            self.syncQueue.queue(config, 'local', eventType, relPath);
        });

        this.localWatcher = watcher;
    }


    private getWatchIgnorePatterns (config: IAccordanceConfig) {
        let watchIgnorePatterns: string[] = [];
        if (config.syncIgnore) {
            watchIgnorePatterns = watchIgnorePatterns.concat(getAnyMatchIgnorePatterns(config.local.root, config.syncIgnore));
        }
        if (config.watchIgnore) {
            watchIgnorePatterns = watchIgnorePatterns.concat(getAnyMatchIgnorePatterns(config.local.root, config.watchIgnore));
        }
        return watchIgnorePatterns;
    }


    private runSync (queueEntry?: ISyncQueueEntry) {
        const self = this;
        return new Promise<void>((resolve, reject) => {
            // Use locking to make sure we only run one sync at a time
            if (this.syncIsRunning) {
                return;
            }

            // Figure out what to sync
            if (!queueEntry) {
                queueEntry = this.syncQueue.dequeue();
            }
            if (!queueEntry) {
                return;
            }

            self.syncIsRunning = true;
            try {
                console.log(makeGreen(`SYNCING: ${queueEntry.directory}`));
                const child = childProcess.spawn('unison', [queueEntry.config.name, '-path', queueEntry.directory]);

                const writeLines = function(stream: NodeJS.WritableStream, data: string | Buffer) {
                    const lines = data
                        .toString()
                        .split('\n')
                        .map((line) => {
                            if (!line || line === '\n' || line === '\r') {
                                return line;
                            }
                            if (line.indexOf('\r') !== -1) {
                                return `\rUNISON: ${line.replace('\r', '')}`;
                            }
                            return `UNISON: ${line}`;
                        })
                        .join('\n');
                    stream.write(lines);
                };

                // Pipe child process stdout to main process stdout
                child.stdout.on('data', (data) => {
                    writeLines(process.stdout, data);
                });

                // Pipe child process stderr to main process stderr
                child.stderr.on('data', (data) => {
                    writeLines(process.stderr, data);
                });

                // Handle sync finish
                child.on('close', (code) => {
                    // Unset sync locks
                    self.syncIsRunning = false;
                    // Log any errors
                    if (code !== 0) {
                        console.log(makeRed(`Unison exited with code ${code}`));
                        reject(new Error(`Unison exited with code ${code}`));
                        return;
                    }
                    // If more sync actions were requested while this sync was running, run sync again.
                    if (self.syncQueue.size() > 0) {
                        setImmediate(() => {
                            self.runSync();
                        });
                    }
                    // Resolve
                    resolve();
                });
            } catch (e) {
                console.error(e);
                self.syncIsRunning = false;
                reject(e);
            }
        });
    }
}


const main = async function(argv: string[]) {
    const cli = new AccordCLI(argv);
    return cli.run();
};


main(process.argv);
