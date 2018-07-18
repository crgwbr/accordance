import colors = require('colors');


export const makeRed = function(txt: string) {
    return colors.red(txt);
};


export const makeGreen = function(txt: string) {
    return colors.green(txt);
};


/**
 * Register a cleanup function to be run when the process exits.
 */
export const registerCleanupFn = function(fn: () => void) {
    const buildHandler = function(exitCode: number | null = null) {
        return () => {
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
    process.on('uncaughtException', (err) => {
        console.error(err.stack);
        buildHandler(1)();
    });
};
