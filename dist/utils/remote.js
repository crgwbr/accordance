"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnection = void 0;
const ssh2 = require("ssh2");
const getConnection = async function (connection) {
    return new Promise((resolve) => {
        const conn = new ssh2.Client();
        const onReady = () => {
            resolve(conn);
        };
        conn.on("ready", onReady).connect(connection);
    });
};
exports.getConnection = getConnection;
//# sourceMappingURL=remote.js.map