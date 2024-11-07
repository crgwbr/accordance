import { Client, ConnectConfig } from "ssh2";

export const getConnection = async function (
    connection: ConnectConfig,
): Promise<Client> {
    return new Promise<Client>((resolve) => {
        const conn = new Client();
        const onReady = () => {
            resolve(conn);
        };
        conn.on("ready", onReady).connect(connection);
    });
};
