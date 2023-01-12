#!/usr/bin/env node

import os = require("os");
import path = require("path");
import childProcess = require("child_process");
import readline = require("readline");
import { Command } from "commander";
import { ConnectConfig, Client, ClientChannel } from "ssh2";
import { FSWatcher } from "chokidar";
import { getPackageInfo, checkForUpdates } from "./utils/manifest";
import {
    IAccordanceConfig,
    readConfig,
    getAnyMatchIgnorePatterns,
    writeUnisonConfigFile,
} from "./utils/config";
import { makeRed, makeYellow, makeGreen, registerCleanupFn } from "./utils/cli";
import { ISyncQueueEntry, SyncQueue } from "./utils/queue";
import { buildWatcher } from "./utils/watch";
import { getConnection } from "./utils/remote";

const program = new Command();

class AccordCLI {
    /**
     * CLI argument string
     */
    private readonly argv: string[];

    /**
     * Queue of directories that need sync'd. Will be processed in FIFO order.
     */
    private readonly syncQueue = new SyncQueue(() => {
        this.runSync();
    });

    /**
     * True when unison sync process is running. Used to prevent multiple sync processes from running concurrently.
     */
    private syncIsRunning = false;

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
    constructor(argv: string[]) {
        this.argv = argv;
    }

    /**
     * Main entry point for the CLI program.
     *
     * Parses and validates command line options and then dispatches the appropriate action.
     */
    public async run() {
        const pkg = getPackageInfo();

        // Check for outdated pkg
        const updateInfo = await checkForUpdates();
        if (updateInfo.isOutdated) {
            console.warn(
                makeYellow(
                    `You have ${updateInfo.name} version ${updateInfo.current} installed. The latest is ${updateInfo.latest}.\n` +
                        `Run \`npm -g install ${updateInfo.name}\` to upgrade.\n`,
                ),
            );
        }

        // Setup basic CLI info
        program.version(pkg.version);

        // Setup initiator action. This watches local FSevents directly, connects to the remote host over SSH to watch
        // remote FSevents (by running another instance of itself, remotely, in watch more), and runs the actual
        // unison sync process when an FSevent is received.
        program
            .command("sync <configPath>")
            .description("Run bidirectional sync process with file watching.")
            .option(
                "--freq <seconds>",
                "How many seconds to wait between periodic full tree syncs",
                "30",
            )
            .action((configPath, options) => {
                const freq = parseInt(options.freq, 10);
                this.run__sync(configPath, freq);
            });

        // Setup remote watcher action. This command is ran over an SSH connection by the sync initiator. It doesn't
        // actually sync anything - it just watches the given directory and dumps FSevent notifications to stdout. The
        // sync initiator reacts to those events by running the sync process.
        program
            .command("watch <rootPath>")
            .option(
                "-i, --ignore <patterns>",
                "File patterns to ignore, separated by semicolons.",
            )
            .description("Run file watcher and dump changed files to stdout.")
            .action((rootPath, options) => {
                const ignorePatterns = options.ignore
                    ? (options.ignore as string).split(";")
                    : [];
                this.run__watch(rootPath, ignorePatterns);
            });

        // Setup catch-all action.
        program.command("*", "", { noHelp: true }).action((cmd) => {
            console.error(makeRed(`Unknown command was provided: "${cmd}"`));
            this.die();
        });

        // Parse and run
        program.parse(this.argv);
        if (program.args.length <= 0) {
            this.die();
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
    private async run__sync(configPath: string, periodicSyncInterval: number) {
        // Read the configuration file
        const config = readConfig(configPath);

        // Create unison configuration file
        writeUnisonConfigFile(config);

        // Run initial sync (and wait for it to finish before starting file watchers).
        await this.runSync({
            config: config,
            source: "local",
            eventType: "initial",
            directory: ".",
        });

        // Figure out which files to ignore
        const watchIgnorePatterns = this.getWatchIgnorePatterns(config);

        // Start local file watcher
        await this.watchLocal(config, watchIgnorePatterns);

        // Start remote file watcher
        this.watchRemote(config, watchIgnorePatterns);

        // Periodically trigger a full tree sync
        setInterval(() => {
            this.syncQueue.queue(config, "local", "periodic-sync", ".");
        }, periodicSyncInterval * 1000);

        // Make sure that file watchers are closed when the process exits
        registerCleanupFn(() => {
            console.log("Closing file watchers...");
            if (this.localWatcher) {
                this.localWatcher.close();
            }

            console.log("Closing SSH connection...");
            if (this.remoteWatcher) {
                this.remoteWatcher.write("\x03");
                this.remoteWatcher.close();
            }
            if (this.sshClient) {
                this.sshClient.end();
            }

            console.log("Done.");
        });
    }

    /**
     * Run the remote file watcher. Dumps FS events to stdout so they can be read over SSH.
     */
    private run__watch(rootPath: string, ignorePatterns: string[]) {
        const watcher = buildWatcher(rootPath, ignorePatterns);

        // Start remote file watcher
        watcher.on("ready", () => {
            const watches = watcher.getWatched();
            const dirs = Object.keys(watches);
            const fileCount = dirs.reduce((memo, dir) => {
                return memo + watches[dir].length;
            }, 0);
            process.stdout.write(
                `Finished initial scan. Watching ${fileCount} files in ${dirs.length} directories.\n`,
            );
        });

        // Dump change events to stdout
        watcher.on("all", (eventType: string, filePath: string) => {
            const relPath = path.relative(rootPath, filePath);
            const msg = JSON.stringify(["remote", eventType, relPath]);
            process.stdout.write(`CMD: ${msg}\n`);
        });

        // Make sure that file watchers are closed when the process exits
        registerCleanupFn(() => {
            process.stdout.write(`Closing remote file watchers...\n`);
            watcher.close();
            process.stdout.write(`Done.\n`);
        });
    }

    private async watchRemote(
        config: IAccordanceConfig,
        ignorePatterns: string[],
    ) {
        const sshAgentSock = process.env.SSH_AUTH_SOCK;
        const sshConfig: ConnectConfig = {
            host: config.remote.host,
            port: 22,
            username: config.remote.username || os.userInfo().username,
            agent: sshAgentSock,
        };
        const cmd = ["accordance", "watch", config.remote.root];
        if (ignorePatterns.length > 0) {
            cmd.push("-i");
            cmd.push(`'${ignorePatterns.join(";")}'`);
        }

        const handleRemoteOutputLine = (line: string) => {
            const command = line.match(/^CMD:\s(.+)$/);
            if (!command) {
                console.log(`REMOTE: ${line}`);
                return;
            }
            const [source, eventType, filePath] = JSON.parse(
                command[1],
            ) as string[];
            this.syncQueue.queue(config, source, eventType, filePath);
        };

        const conn = await getConnection(sshConfig);

        this.sshClient = conn;

        conn.exec(cmd.join(" "), { pty: true }, (err, stream) => {
            if (err) {
                throw err;
            }

            this.remoteWatcher = stream;

            // Buffer stdout and action on each line
            const stdoutBuffer = readline.createInterface({ input: stream });
            stdoutBuffer.on("line", (line: string) => {
                handleRemoteOutputLine(line);
            });

            // Buffer stderr and log each line
            const stderrBuffer = readline.createInterface({
                input: stream.stderr,
            });
            stderrBuffer.on("line", (line: string) => {
                console.log(makeRed(`REMOTE ERROR: ${line}`));
            });

            // Log connection close events
            stream.on("close", (code: number, signal: number) => {
                console.log(
                    makeRed(
                        `Connection to remote was closed with code ${code}, signal: ${signal}`,
                    ),
                );
                conn.end();
            });
        });

        conn.on("close", () => {
            console.log(makeRed(`Connection to remote was closed!`));
        });
        conn.on("end", () => {
            console.log(makeRed(`Connection to remote was ended!`));
        });
        conn.on("error", () => {
            console.log(makeRed(`Connection to remote encountered an error!`));
        });
    }

    private async watchLocal(
        config: IAccordanceConfig,
        ignorePatterns: string[],
    ) {
        return new Promise((resolve) => {
            console.log("Starting local file watchers...");

            const watcher = buildWatcher(config.local.root, ignorePatterns);
            watcher.on("ready", () => {
                const watches = watcher.getWatched();
                const dirs = Object.keys(watches);
                const fileCount = dirs.reduce((memo, dir) => {
                    return memo + watches[dir].length;
                }, 0);
                console.log(
                    `Finished initial scan. Watching ${fileCount} files in ${dirs.length} directories.`,
                );
                resolve(fileCount);
            });

            // React to FS changes
            watcher.on("all", (eventType: string, filePath: string) => {
                const relPath = path.relative(config.local.root, filePath);
                this.syncQueue.queue(config, "local", eventType, relPath);
            });

            this.localWatcher = watcher;
        });
    }

    private getWatchIgnorePatterns(config: IAccordanceConfig) {
        let watchIgnorePatterns: string[] = [];
        if (config.syncIgnore) {
            watchIgnorePatterns = watchIgnorePatterns.concat(
                getAnyMatchIgnorePatterns(config.local.root, config.syncIgnore),
            );
        }
        if (config.watchIgnore) {
            watchIgnorePatterns = watchIgnorePatterns.concat(
                getAnyMatchIgnorePatterns(
                    config.local.root,
                    config.watchIgnore,
                ),
            );
        }
        return watchIgnorePatterns;
    }

    private runSync(queueEntry?: ISyncQueueEntry) {
        return new Promise<void>((resolve) => {
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

            this.syncIsRunning = true;
            try {
                console.log(makeGreen(`SYNCING: ${queueEntry.directory}`));
                const child = childProcess.spawn("unison", [
                    queueEntry.config.name,
                    "-path",
                    queueEntry.directory,
                ]);

                const writeLines = function (
                    stream: NodeJS.WritableStream,
                    data: string | Buffer,
                ) {
                    const lines = data
                        .toString()
                        .split("\n")
                        .map((line) => {
                            if (!line || line === "\n" || line === "\r") {
                                return line;
                            }
                            if (line.indexOf("\r") !== -1) {
                                return `\rUNISON: ${line.replace("\r", "")}`;
                            }
                            return `UNISON: ${line}`;
                        })
                        .join("\n");
                    stream.write(lines);
                };

                // Pipe child process stdout to main process stdout
                if (child.stdout) {
                    child.stdout.on("data", (data) => {
                        writeLines(process.stdout, data);
                    });
                }

                // Pipe child process stderr to main process stderr
                if (child.stderr) {
                    child.stderr.on("data", (data) => {
                        writeLines(process.stdout, data);
                    });
                }

                // Handle sync finish
                child.on("close", (code) => {
                    // Unset sync locks
                    this.syncIsRunning = false;
                    // Log any errors
                    if (code !== 0) {
                        console.log(makeRed(`Unison exited with code ${code}`));
                        resolve();
                        return;
                    }
                    // If more sync actions were requested while this sync was running, run sync again.
                    if (this.syncQueue.size() > 0) {
                        setImmediate(() => {
                            this.runSync();
                        });
                    }
                    // Resolve
                    resolve();
                });
            } catch (e) {
                console.error(e);
                this.syncIsRunning = false;
                resolve();
            }
        });
    }
}

const main = async function (argv: string[]) {
    const cli = new AccordCLI(argv);
    return cli.run();
};

main(process.argv);
