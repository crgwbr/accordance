"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var colors = require("colors");
exports.makeRed = function (txt) {
    return colors.red(txt);
};
exports.makeGreen = function (txt) {
    return colors.green(txt);
};
/**
 * Register a cleanup function to be run when the process exits.
 */
exports.registerCleanupFn = function (fn) {
    var buildHandler = function (exitCode) {
        if (exitCode === void 0) { exitCode = null; }
        return function () {
            fn();
            if (exitCode !== null) {
                process.exit(exitCode);
            }
        };
    };
    // Run when process is closing
    process.on('exit', buildHandler());
    // Catches ctrl+c event
    process.on('SIGINT', buildHandler(0));
    // Catches "kill pid"
    process.on('SIGUSR1', buildHandler(0));
    process.on('SIGUSR2', buildHandler(0));
    // Catches uncaught exceptions
    process.on('uncaughtException', function (err) {
        console.error(err.stack);
        buildHandler(1)();
    });
};
//# sourceMappingURL=cli.js.map