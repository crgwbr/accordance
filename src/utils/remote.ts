import ssh2 = require('ssh2');
import {ConnectConfig} from 'ssh2';


export const getConnection = function(connection: ConnectConfig, onReady: (conn: ssh2.Client) => void) {
    const conn = new ssh2.Client();
    conn
        .on('ready', () => {
            onReady(conn);
        })
        .connect(connection);
};
