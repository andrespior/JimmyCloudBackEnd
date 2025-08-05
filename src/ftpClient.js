require('dotenv').config();

const ftp = require("basic-ftp");

async function getFtpClient(user, password, secure = false) {
    const client = new ftp.Client();
    client.ftp.verbose = false;
    try {
        await client.access({
            host: process.env.FTP_HOST, //"127.0.0.1",
            user, //user: "Felipe",
            password, //password: "@Fpo_1989",
            secure //secure: false
        });
        return client;
    } catch (err) {
        console.error("Error al conectar con FTP:", err);
        throw err;
    }
}

module.exports = getFtpClient;