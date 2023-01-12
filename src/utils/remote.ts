import ssh2 = require("ssh2");
import { ConnectConfig } from "ssh2";

export const getConnection = async function (
    connection: ConnectConfig,
): Promise<ssh2.Client> {
    return new Promise<ssh2.Client>((resolve) => {
        const conn = new ssh2.Client();
        const onReady = () => {
            resolve(conn);
        };
        conn.on("ready", onReady).connect(connection);
    });
};
