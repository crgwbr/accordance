#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var os = require("os");
var path = require("path");
var childProcess = require("child_process");
var program = require("commander");
var readline = require("readline");
var manifest_1 = require("./utils/manifest");
var config_1 = require("./utils/config");
var cli_1 = require("./utils/cli");
var watch_1 = require("./utils/watch");
var remote_1 = require("./utils/remote");
var AccordCLI = /** @class */ (function () {
    /**
     * Constructor. Initialize the class with an argv string array.
     */
    function AccordCLI(argv) {
        /**
         * True when unison sync process is running. Used to prevent multiple sync processes from running concurrently.
         */
        this.syncIsRunning = false;
        /**
         * Queue of directories that need sync'd. Will be processed in FIFO order.
         */
        this.syncQueue = [];
        this.argv = argv;
    }
    /**
     * Main entry point for the CLI program.
     *
     * Parses and validates command line options and then dispatches the appropriate action.
     */
    AccordCLI.prototype.run = function () {
        var self = this;
        var pkg = manifest_1.getPackageInfo();
        // Setup basic CLI info
        program
            .version(pkg.version);
        // Setup initiator action. This watches local FSevents directly, connects to the remote host over SSH to watch
        // remote FSevents (by running another instance of itself, remotely, in watch more), and runs the actual
        // unison sync process when an FSevent is received.
        program
            .command('sync <configPath>')
            .description('Run bidirectional sync process with file watching.')
            .action(function (configPath) {
            self.run__sync(configPath);
        });
        // Setup remote watcher action. This command is ran over an SSH connection by the sync initiator. It doesn't
        // actually sync anything - it just watches the given directory and dumps FSevent notifications to stdout. The
        // sync initiator reacts to those events by running the sync process.
        program
            .command('watch <rootPath>')
            .option("-i, --ignore <patterns>", "File patterns to ignore, separated by semicolons.")
            .description('Run file watcher and dump changed files to stdout.')
            .action(function (rootPath, options) {
            var ignorePatterns = options.ignore
                ? options.ignore.split(';')
                : [];
            self.run__watch(rootPath, ignorePatterns);
        });
        // Setup catch-all action.
        program
            .command('*', '', { noHelp: true, })
            .action(function (cmd) {
            console.error(cli_1.makeRed("Unknown command was provided: \"" + cmd + "\""));
            self.die();
        });
        // Parse and run
        program.parse(this.argv);
        if (program.args.length <= 0) {
            self.die();
        }
    };
    /**
     * Output CLI command help and exit the process.
     */
    AccordCLI.prototype.die = function () {
        program.outputHelp(cli_1.makeRed);
        process.exit(1);
    };
    /**
     * Run the sync initiator process. This does 3 things:
     *
     * 1. Watch local FS (INOTIFY) events.
     * 2. Watch remote FS (INOTIFY) events over an SSH connection.
     * 3. Queue / run syncs whenever a change is detected.
     */
    AccordCLI.prototype.run__sync = function (configPath) {
        var self = this;
        // Read the configuration file
        var config = config_1.readConfig(configPath);
        // Create unison configuration file
        config_1.writeUnisonConfigFile(config);
        // Figure out which files to ignore
        var watchIgnorePatterns = this.getWatchIgnorePatterns(config);
        // Start local file watcher
        this.watchLocal(config, watchIgnorePatterns);
        // Start remote file watcher
        this.watchRemote(config, watchIgnorePatterns);
        // Make sure that file watchers are closed when the process exits
        cli_1.registerCleanupFn(function () {
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
    };
    /**
     * Run the remote file watcher. Dumps FS events to stdout so they can be read over SSH.
     */
    AccordCLI.prototype.run__watch = function (rootPath, ignorePatterns) {
        var watcher = watch_1.buildWatcher(rootPath, ignorePatterns);
        // Start remote file watcher
        watcher.on('ready', function () {
            var watches = watcher.getWatched();
            var dirs = Object.keys(watches);
            var fileCount = dirs.reduce(function (memo, dir) {
                return memo + watches[dir].length;
            }, 0);
            process.stdout.write("Finished initial scan. Watching " + fileCount + " files in " + dirs.length + " directories.\n");
        });
        // Dump change events to stdout
        watcher.on('all', function (eventType, filePath) {
            var relPath = path.relative(rootPath, filePath);
            var msg = JSON.stringify(['remote', eventType, relPath]);
            process.stdout.write("CMD: " + msg + "\n");
        });
        // Make sure that file watchers are closed when the process exits
        cli_1.registerCleanupFn(function () {
            process.stdout.write("Closing remote file watchers...\n");
            watcher.close();
            process.stdout.write("Done.\n");
        });
    };
    AccordCLI.prototype.watchRemote = function (config, ignorePatterns) {
        var self = this;
        var sshAgentSock = process.env.SSH_AUTH_SOCK;
        var sshConfig = {
            host: config.remote.host,
            port: 22,
            username: os.userInfo().username,
            agent: sshAgentSock,
        };
        var cmd = ['accordance', 'watch', config.remote.root];
        if (ignorePatterns.length > 0) {
            cmd.push('-i');
            cmd.push("'" + ignorePatterns.join(';') + "'");
        }
        var handleRemoteOutputLine = function (line) {
            var command = line.match(/^CMD:\s(.+)$/);
            if (!command) {
                console.log("REMOTE: " + line);
                return;
            }
            var _a = tslib_1.__read(JSON.parse(command[1]), 3), source = _a[0], eventType = _a[1], filePath = _a[2];
            self.queueSync(config, source, eventType, filePath);
        };
        remote_1.getConnection(sshConfig, function (conn) {
            self.sshClient = conn;
            conn.exec(cmd.join(' '), { pty: true }, function (err, stream) {
                if (err) {
                    throw err;
                }
                self.remoteWatcher = stream;
                // Buffer stdout and action on each line
                var stdoutBuffer = readline.createInterface({ input: stream, });
                stdoutBuffer.on('line', function (line) {
                    handleRemoteOutputLine(line);
                });
                // Buffer stderr and log each line
                var stderrBuffer = readline.createInterface({ input: stream.stderr, });
                stderrBuffer.on('line', function (line) {
                    console.log(cli_1.makeRed("REMOTE ERROR: " + line));
                });
                // Log connection close events
                stream.on('close', function (code, signal) {
                    console.log(cli_1.makeRed("Connection to remote was closed with code " + code + ", signal: " + signal));
                    conn.end();
                });
            });
        });
    };
    AccordCLI.prototype.watchLocal = function (config, ignorePatterns) {
        var self = this;
        console.log('Starting local file watchers...');
        var watcher = watch_1.buildWatcher(config.local.root, ignorePatterns);
        watcher.on('ready', function () {
            var watches = watcher.getWatched();
            var dirs = Object.keys(watches);
            var fileCount = dirs.reduce(function (memo, dir) {
                return memo + watches[dir].length;
            }, 0);
            console.log("Finished initial scan. Watching " + fileCount + " files in " + dirs.length + " directories.");
            // Run initial sync
            self.queueSync(config, 'local', 'initial', '.');
        });
        // React to FS changes
        watcher.on('all', function (eventType, filePath) {
            var relPath = path.relative(config.local.root, filePath);
            self.queueSync(config, 'local', eventType, relPath);
        });
        this.localWatcher = watcher;
    };
    AccordCLI.prototype.queueSync = function (config, source, eventType, filePath) {
        var dir = path.dirname(filePath);
        var existing = this.syncQueue
            .filter(function (e) {
            return e.directory === dir;
        });
        if (existing.length > 0) {
            return;
        }
        // If the sync queue if getting huge, wipe it a sync everything
        if (this.syncQueue.length > 50) {
            var msg = source.toUpperCase() + ": " + eventType + " " + filePath;
            console.log(cli_1.makeGreen(msg));
            this.syncQueue = [
                {
                    config: config,
                    source: source,
                    eventType: 'overflow',
                    directory: '.',
                }
            ];
            this.runSync();
        }
        // Otherwise, just queue the sync
        console.log(cli_1.makeGreen("QUEUE: Detected " + eventType + " to " + filePath + " on " + source));
        this.syncQueue.push({
            config: config,
            source: source,
            eventType: eventType,
            directory: dir,
        });
        this.runSync();
    };
    AccordCLI.prototype.getWatchIgnorePatterns = function (config) {
        var watchIgnorePatterns = [];
        if (config.syncIgnore) {
            watchIgnorePatterns = watchIgnorePatterns.concat(config_1.getAnyMatchIgnorePatterns(config.local.root, config.syncIgnore));
        }
        if (config.watchIgnore) {
            watchIgnorePatterns = watchIgnorePatterns.concat(config_1.getAnyMatchIgnorePatterns(config.local.root, config.watchIgnore));
        }
        return watchIgnorePatterns;
    };
    AccordCLI.prototype.runSync = function () {
        var self = this;
        // Use locking to make sure we only run one sync at a time
        if (this.syncIsRunning) {
            return;
        }
        // Figure out what to sync
        var queueEntry = this.syncQueue.shift();
        if (!queueEntry) {
            return;
        }
        // Run the sync
        this.syncIsRunning = true;
        try {
            console.log(cli_1.makeGreen("SYNCING: " + queueEntry.directory));
            var child = childProcess.spawn('unison', [queueEntry.config.name, '-path', queueEntry.directory]);
            var writeLines_1 = function (stream, data) {
                var lines = data
                    .toString()
                    .split('\n')
                    .map(function (line) {
                    if (!line || line === '\n' || line === '\r') {
                        return line;
                    }
                    if (line.indexOf('\r') !== -1) {
                        return "\rUNISON: " + line.replace('\r', '');
                    }
                    return "UNISON: " + line;
                })
                    .join('\n');
                stream.write(lines);
            };
            // Pipe child process stdout to main process stdout
            child.stdout.on('data', function (data) {
                writeLines_1(process.stdout, data);
            });
            // Pipe child process stderr to main process stderr
            child.stderr.on('data', function (data) {
                writeLines_1(process.stderr, data);
            });
            // Handle sync finish
            child.on('close', function (code) {
                // Unset sync locks
                self.syncIsRunning = false;
                // Log any errors
                if (code !== 0) {
                    console.log(cli_1.makeRed("Unison exited with code " + code));
                }
                // If more sync actions were requested while this sync was running, run sync again.
                if (self.syncQueue.length > 0) {
                    setImmediate(function () {
                        self.runSync();
                    });
                }
            });
        }
        catch (e) {
            console.error(e);
            self.syncIsRunning = false;
        }
    };
    return AccordCLI;
}());
var main = function (argv) {
    var cli = new AccordCLI(argv);
    cli.run();
};
main(process.argv);
//# sourceMappingURL=main.js.map