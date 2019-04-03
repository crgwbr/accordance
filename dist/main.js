#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var os = require("os");
var path = require("path");
var childProcess = require("child_process");
var program = require("commander");
var readline = require("readline");
var manifest_1 = require("./utils/manifest");
var config_1 = require("./utils/config");
var cli_1 = require("./utils/cli");
var queue_1 = require("./utils/queue");
var watch_1 = require("./utils/watch");
var remote_1 = require("./utils/remote");
var AccordCLI = /** @class */ (function () {
    /**
     * Constructor. Initialize the class with an argv string array.
     */
    function AccordCLI(argv) {
        var _this = this;
        /**
         * Queue of directories that need sync'd. Will be processed in FIFO order.
         */
        this.syncQueue = new queue_1.SyncQueue(function () { _this.runSync(); });
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
    AccordCLI.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var self, pkg, updateInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        self = this;
                        pkg = manifest_1.getPackageInfo();
                        return [4 /*yield*/, manifest_1.checkForUpdates()];
                    case 1:
                        updateInfo = _a.sent();
                        if (updateInfo.isOutdated) {
                            console.warn(cli_1.makeYellow("You have " + updateInfo.name + " version " + updateInfo.current + " installed. The latest is " + updateInfo.latest + ".\n" +
                                ("Run `npm -g install " + updateInfo.name + "` to upgrade.\n")));
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
                            .option("--freq <seconds>", "How many seconds to wait between periodic full tree syncs", 30)
                            .action(function (configPath, options) {
                            var freq = parseInt(options.freq, 10);
                            self.run__sync(configPath, freq);
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
                        return [2 /*return*/];
                }
            });
        });
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
    AccordCLI.prototype.run__sync = function (configPath, periodicSyncInterval) {
        return __awaiter(this, void 0, void 0, function () {
            var self, config, watchIgnorePatterns;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        self = this;
                        config = config_1.readConfig(configPath);
                        // Create unison configuration file
                        config_1.writeUnisonConfigFile(config);
                        // Run initial sync (and wait for it to finish before starting file watchers).
                        return [4 /*yield*/, this.runSync({
                                config: config,
                                source: 'local',
                                eventType: 'initial',
                                directory: '.',
                            })];
                    case 1:
                        // Run initial sync (and wait for it to finish before starting file watchers).
                        _a.sent();
                        watchIgnorePatterns = this.getWatchIgnorePatterns(config);
                        // Start local file watcher
                        return [4 /*yield*/, this.watchLocal(config, watchIgnorePatterns)];
                    case 2:
                        // Start local file watcher
                        _a.sent();
                        // Start remote file watcher
                        this.watchRemote(config, watchIgnorePatterns);
                        // Periodically trigger a full tree sync
                        setInterval(function () {
                            self.syncQueue.queue(config, 'local', 'periodic-sync', '.');
                        }, periodicSyncInterval * 1000);
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
                        return [2 /*return*/];
                }
            });
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
        return __awaiter(this, void 0, void 0, function () {
            var self, sshAgentSock, sshConfig, cmd, handleRemoteOutputLine, conn;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        self = this;
                        sshAgentSock = process.env.SSH_AUTH_SOCK;
                        sshConfig = {
                            host: config.remote.host,
                            port: 22,
                            username: config.remote.username || os.userInfo().username,
                            agent: sshAgentSock,
                        };
                        cmd = ['accordance', 'watch', config.remote.root];
                        if (ignorePatterns.length > 0) {
                            cmd.push('-i');
                            cmd.push("'" + ignorePatterns.join(';') + "'");
                        }
                        handleRemoteOutputLine = function (line) {
                            var command = line.match(/^CMD:\s(.+)$/);
                            if (!command) {
                                console.log("REMOTE: " + line);
                                return;
                            }
                            var _a = __read(JSON.parse(command[1]), 3), source = _a[0], eventType = _a[1], filePath = _a[2];
                            self.syncQueue.queue(config, source, eventType, filePath);
                        };
                        return [4 /*yield*/, remote_1.getConnection(sshConfig)];
                    case 1:
                        conn = _a.sent();
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
                        conn.on('close', function () {
                            console.log(cli_1.makeRed("Connection to remote was closed!"));
                        });
                        conn.on('end', function () {
                            console.log(cli_1.makeRed("Connection to remote was ended!"));
                        });
                        conn.on('error', function () {
                            console.log(cli_1.makeRed("Connection to remote encountered an error!"));
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    AccordCLI.prototype.watchLocal = function (config, ignorePatterns) {
        return __awaiter(this, void 0, void 0, function () {
            var self;
            var _this = this;
            return __generator(this, function (_a) {
                self = this;
                return [2 /*return*/, new Promise(function (resolve) {
                        console.log('Starting local file watchers...');
                        var watcher = watch_1.buildWatcher(config.local.root, ignorePatterns);
                        watcher.on('ready', function () {
                            var watches = watcher.getWatched();
                            var dirs = Object.keys(watches);
                            var fileCount = dirs.reduce(function (memo, dir) {
                                return memo + watches[dir].length;
                            }, 0);
                            console.log("Finished initial scan. Watching " + fileCount + " files in " + dirs.length + " directories.");
                            resolve(fileCount);
                        });
                        // React to FS changes
                        watcher.on('all', function (eventType, filePath) {
                            var relPath = path.relative(config.local.root, filePath);
                            self.syncQueue.queue(config, 'local', eventType, relPath);
                        });
                        _this.localWatcher = watcher;
                    })];
            });
        });
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
    AccordCLI.prototype.runSync = function (queueEntry) {
        var _this = this;
        var self = this;
        return new Promise(function (resolve) {
            // Use locking to make sure we only run one sync at a time
            if (_this.syncIsRunning) {
                return;
            }
            // Figure out what to sync
            if (!queueEntry) {
                queueEntry = _this.syncQueue.dequeue();
            }
            if (!queueEntry) {
                return;
            }
            self.syncIsRunning = true;
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
                if (child.stdout) {
                    child.stdout.on('data', function (data) {
                        writeLines_1(process.stdout, data);
                    });
                }
                // Pipe child process stderr to main process stderr
                if (child.stderr) {
                    child.stderr.on('data', function (data) {
                        writeLines_1(process.stdout, data);
                    });
                }
                // Handle sync finish
                child.on('close', function (code) {
                    // Unset sync locks
                    self.syncIsRunning = false;
                    // Log any errors
                    if (code !== 0) {
                        console.log(cli_1.makeRed("Unison exited with code " + code));
                        resolve();
                        return;
                    }
                    // If more sync actions were requested while this sync was running, run sync again.
                    if (self.syncQueue.size() > 0) {
                        setImmediate(function () {
                            self.runSync();
                        });
                    }
                    // Resolve
                    resolve();
                });
            }
            catch (e) {
                console.error(e);
                self.syncIsRunning = false;
                resolve();
            }
        });
    };
    return AccordCLI;
}());
var main = function (argv) {
    return __awaiter(this, void 0, void 0, function () {
        var cli;
        return __generator(this, function (_a) {
            cli = new AccordCLI(argv);
            return [2 /*return*/, cli.run()];
        });
    });
};
main(process.argv);
//# sourceMappingURL=main.js.map