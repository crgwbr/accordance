#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const path = require("path");
const childProcess = require("child_process");
const readline = require("readline");
const commander_1 = require("commander");
const manifest_1 = require("./utils/manifest");
const config_1 = require("./utils/config");
const cli_1 = require("./utils/cli");
const queue_1 = require("./utils/queue");
const watch_1 = require("./utils/watch");
const remote_1 = require("./utils/remote");
const program = new commander_1.Command();
class AccordCLI {
    /**
     * Constructor. Initialize the class with an argv string array.
     */
    constructor(argv) {
        /**
         * Queue of directories that need sync'd. Will be processed in FIFO order.
         */
        this.syncQueue = new queue_1.SyncQueue(() => {
            this.runSync();
        });
        /**
         * True when unison sync process is running. Used to prevent multiple sync processes from running concurrently.
         */
        this.syncIsRunning = false;
        this.argv = argv;
    }
    /**
     * Main entry point for the CLI program.
     *
     * Parses and validates command line options and then dispatches the appropriate action.
     */
    async run() {
        const pkg = (0, manifest_1.getPackageInfo)();
        // Check for outdated pkg
        const updateInfo = await (0, manifest_1.checkForUpdates)();
        if (updateInfo.isOutdated) {
            console.warn((0, cli_1.makeYellow)(`You have ${updateInfo.name} version ${updateInfo.current} installed. The latest is ${updateInfo.latest}.\n` +
                `Run \`npm -g install ${updateInfo.name}\` to upgrade.\n`));
        }
        // Setup basic CLI info
        program.version(pkg.version);
        // Setup initiator action. This watches local FSevents directly, connects to the remote host over SSH to watch
        // remote FSevents (by running another instance of itself, remotely, in watch more), and runs the actual
        // unison sync process when an FSevent is received.
        program
            .command("sync <configPath>")
            .description("Run bidirectional sync process with file watching.")
            .option("--freq <seconds>", "How many seconds to wait between periodic full tree syncs", "30")
            .action((configPath, options) => {
            const freq = parseInt(options.freq, 10);
            this.run__sync(configPath, freq);
        });
        // Setup remote watcher action. This command is ran over an SSH connection by the sync initiator. It doesn't
        // actually sync anything - it just watches the given directory and dumps FSevent notifications to stdout. The
        // sync initiator reacts to those events by running the sync process.
        program
            .command("watch <rootPath>")
            .option("-i, --ignore <patterns>", "File patterns to ignore, separated by semicolons.")
            .description("Run file watcher and dump changed files to stdout.")
            .action((rootPath, options) => {
            const ignorePatterns = options.ignore
                ? options.ignore.split(";")
                : [];
            this.run__watch(rootPath, ignorePatterns);
        });
        // Setup catch-all action.
        program.command("*", "", { noHelp: true }).action((cmd) => {
            console.error((0, cli_1.makeRed)(`Unknown command was provided: "${cmd}"`));
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
    die() {
        program.outputHelp(cli_1.makeRed);
        process.exit(1);
    }
    /**
     * Run the sync initiator process. This does 3 things:
     *
     * 1. Watch local FS (INOTIFY) events.
     * 2. Watch remote FS (INOTIFY) events over an SSH connection.
     * 3. Queue / run syncs whenever a change is detected.
     */
    async run__sync(configPath, periodicSyncInterval) {
        // Read the configuration file
        const config = (0, config_1.readConfig)(configPath);
        // Create unison configuration file
        (0, config_1.writeUnisonConfigFile)(config);
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
        (0, cli_1.registerCleanupFn)(() => {
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
    run__watch(rootPath, ignorePatterns) {
        const watcher = (0, watch_1.buildWatcher)(rootPath, ignorePatterns);
        // Start remote file watcher
        watcher.on("ready", () => {
            const watches = watcher.getWatched();
            const dirs = Object.keys(watches);
            const fileCount = dirs.reduce((memo, dir) => {
                return memo + watches[dir].length;
            }, 0);
            process.stdout.write(`Finished initial scan. Watching ${fileCount} files in ${dirs.length} directories.\n`);
        });
        // Dump change events to stdout
        watcher.on("all", (eventType, filePath) => {
            const relPath = path.relative(rootPath, filePath);
            const msg = JSON.stringify(["remote", eventType, relPath]);
            process.stdout.write(`CMD: ${msg}\n`);
        });
        // Make sure that file watchers are closed when the process exits
        (0, cli_1.registerCleanupFn)(() => {
            process.stdout.write(`Closing remote file watchers...\n`);
            watcher.close();
            process.stdout.write(`Done.\n`);
        });
    }
    async watchRemote(config, ignorePatterns) {
        const sshAgentSock = process.env.SSH_AUTH_SOCK;
        const sshConfig = {
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
        const handleRemoteOutputLine = (line) => {
            const command = line.match(/^CMD:\s(.+)$/);
            if (!command) {
                console.log(`REMOTE: ${line}`);
                return;
            }
            const [source, eventType, filePath] = JSON.parse(command[1]);
            this.syncQueue.queue(config, source, eventType, filePath);
        };
        const conn = await (0, remote_1.getConnection)(sshConfig);
        this.sshClient = conn;
        conn.exec(cmd.join(" "), { pty: true }, (err, stream) => {
            if (err) {
                throw err;
            }
            this.remoteWatcher = stream;
            // Buffer stdout and action on each line
            const stdoutBuffer = readline.createInterface({ input: stream });
            stdoutBuffer.on("line", (line) => {
                handleRemoteOutputLine(line);
            });
            // Buffer stderr and log each line
            const stderrBuffer = readline.createInterface({
                input: stream.stderr,
            });
            stderrBuffer.on("line", (line) => {
                console.log((0, cli_1.makeRed)(`REMOTE ERROR: ${line}`));
            });
            // Log connection close events
            stream.on("close", (code, signal) => {
                console.log((0, cli_1.makeRed)(`Connection to remote was closed with code ${code}, signal: ${signal}`));
                conn.end();
            });
        });
        conn.on("close", () => {
            console.log((0, cli_1.makeRed)(`Connection to remote was closed!`));
        });
        conn.on("end", () => {
            console.log((0, cli_1.makeRed)(`Connection to remote was ended!`));
        });
        conn.on("error", () => {
            console.log((0, cli_1.makeRed)(`Connection to remote encountered an error!`));
        });
    }
    async watchLocal(config, ignorePatterns) {
        return new Promise((resolve) => {
            console.log("Starting local file watchers...");
            const watcher = (0, watch_1.buildWatcher)(config.local.root, ignorePatterns);
            watcher.on("ready", () => {
                const watches = watcher.getWatched();
                const dirs = Object.keys(watches);
                const fileCount = dirs.reduce((memo, dir) => {
                    return memo + watches[dir].length;
                }, 0);
                console.log(`Finished initial scan. Watching ${fileCount} files in ${dirs.length} directories.`);
                resolve(fileCount);
            });
            // React to FS changes
            watcher.on("all", (eventType, filePath) => {
                const relPath = path.relative(config.local.root, filePath);
                this.syncQueue.queue(config, "local", eventType, relPath);
            });
            this.localWatcher = watcher;
        });
    }
    getWatchIgnorePatterns(config) {
        let watchIgnorePatterns = [];
        if (config.syncIgnore) {
            watchIgnorePatterns = watchIgnorePatterns.concat((0, config_1.getAnyMatchIgnorePatterns)(config.local.root, config.syncIgnore));
        }
        if (config.watchIgnore) {
            watchIgnorePatterns = watchIgnorePatterns.concat((0, config_1.getAnyMatchIgnorePatterns)(config.local.root, config.watchIgnore));
        }
        return watchIgnorePatterns;
    }
    runSync(queueEntry) {
        return new Promise((resolve) => {
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
                console.log((0, cli_1.makeGreen)(`SYNCING: ${queueEntry.directory}`));
                const child = childProcess.spawn("unison", [
                    queueEntry.config.name,
                    "-path",
                    queueEntry.directory,
                ]);
                const writeLines = function (stream, data) {
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
                        console.log((0, cli_1.makeRed)(`Unison exited with code ${code}`));
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
            }
            catch (e) {
                console.error(e);
                this.syncIsRunning = false;
                resolve();
            }
        });
    }
}
const main = async function (argv) {
    const cli = new AccordCLI(argv);
    return cli.run();
};
main(process.argv);
//# sourceMappingURL=main.js.map