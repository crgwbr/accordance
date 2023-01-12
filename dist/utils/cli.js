"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCleanupFn = exports.makeGreen = exports.makeYellow = exports.makeRed = void 0;
const colors = require("colors");
const makeRed = function (txt) {
    return colors.red(txt);
};
exports.makeRed = makeRed;
const makeYellow = function (txt) {
    return colors.yellow(txt);
};
exports.makeYellow = makeYellow;
const makeGreen = function (txt) {
    return colors.green(txt);
};
exports.makeGreen = makeGreen;
/**
 * Register a cleanup function to be run when the process exits.
 */
const registerCleanupFn = function (fn) {
    const buildHandler = function (exitCode = null) {
        return () => {
            fn();
            if (exitCode !== null) {
                process.exit(exitCode);
            }
        };
    };
    // Run when process is closing
    process.on("exit", buildHandler());
    // Catches ctrl+c event
    process.on("SIGINT", buildHandler(0));
    // Catches "kill pid"
    process.on("SIGUSR1", buildHandler(0));
    process.on("SIGUSR2", buildHandler(0));
    // Catches uncaught exceptions
    process.on("uncaughtException", (err) => {
        console.error(err.stack);
        buildHandler(1)();
    });
};
exports.registerCleanupFn = registerCleanupFn;
//# sourceMappingURL=cli.js.map