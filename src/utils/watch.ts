import chokidar = require('chokidar');


export const buildWatcher = function(path: string, ignored: string[]) {
    const watcher = chokidar.watch(path, {
        persistent: true,
        ignored: ignored,
        ignoreInitial: true,
        ignorePermissionErrors: true,
    });
    return watcher;
};
