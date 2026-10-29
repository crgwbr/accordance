import path from "node:path";

import chokidar from "chokidar";

export const buildWatcher = function (rootPath: string, ignored: string[]) {
    // chokidar 6 resolves ignore strings to absolute paths but matches them against paths built from the root as given.
    const watcher = chokidar.watch(path.resolve(rootPath), {
        persistent: true,
        ignored: ignored,
        ignoreInitial: true,
        ignorePermissionErrors: true,
    });
    return watcher;
};
