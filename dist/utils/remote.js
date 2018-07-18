"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ssh2 = require("ssh2");
exports.getConnection = function (connection, onReady) {
    var conn = new ssh2.Client();
    conn
        .on('ready', function () {
        onReady(conn);
    })
        .connect(connection);
};
//# sourceMappingURL=remote.js.map