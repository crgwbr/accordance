"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var chokidar = require("chokidar");
exports.buildWatcher = function (path, ignored) {
    var watcher = chokidar.watch(path, {
        persistent: true,
        ignored: ignored,
        ignoreInitial: true,
        ignorePermissionErrors: true,
    });
    return watcher;
};
//# sourceMappingURL=watch.js.map