"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildWatcher = void 0;
const chokidar = require("chokidar");
const buildWatcher = function (path, ignored) {
    const watcher = chokidar.watch(path, {
        persistent: true,
        ignored: ignored,
        ignoreInitial: true,
        ignorePermissionErrors: true,
    });
    return watcher;
};
exports.buildWatcher = buildWatcher;
//# sourceMappingURL=watch.js.map