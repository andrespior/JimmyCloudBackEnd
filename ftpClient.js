require('dotenv').config();

const ftp = require("basic-ftp");

async function getFtpClient(user, password, secure = false) {
    const client = new ftp.Client();
    client.ftp.verbose = false;
    try {
        await client.access({
            host: process.env.FTP_HOST, 
            user, 
            password, 
            secure 
        });
        return client;
    } catch (err) {
        console.error("Error al conectar con FTP:", err);
        throw err;
    }
}

module.exports = getFtpClient;