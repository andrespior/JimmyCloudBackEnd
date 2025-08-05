// backend/server.js
const express = require("express");
const multer = require('multer');
const fs = require("fs");
const getFtpClient = require('./ftpClient');
const path = require('path');
const ftp = require("basic-ftp");
const cors = require("cors");
const app = express();
const PORT = 3000;
//Token
const jwt = require('jsonwebtoken');
require('dotenv').config();
const SECRET_KEY = process.env.SECRET_KEY;
// Middleware para subir archivos
const upload = multer({ dest: 'uploads/' });
//AuthGuard
const authGuard = require('./authGuard');

app.use(cors());
app.use(express.json()); // para JSON
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    console.log(`Solicitud recibida: ${req.method} ${req.url}`);
    next();
});

// Ruta para obtener token (ejemplo básico)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    const client = await getFtpClient(username, password);
    try {
        // Crear payload para el token
        const payload = { username };
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        console.error("Error de Credenciales:", err);
        res.status(500).send("No se pudo conectar con el servidor.");
    } finally {
        client.close();
    }
});

//Listar Archivos
app.post("/ftp/list", authGuard, async (req, res) => {
    const { username, password } = req.body;
    console.log("list: ", username);

    const client = await getFtpClient(username, password);
    try {
        const list = await client.list();
        const files = list.map(file => ({
            name: file.name,
            size: file.size,
            type: file.type, // 'File' o 'Directory'
            modifiedAt: file.modifiedAt
        }));

        res.json(files);
    } catch (err) {
        console.error("Error al listar archivos:", err);
        res.status(500).send("No se pudo obtener la lista de archivos.");
    } finally {
        client.close();
    }
});

//Descargar Archivo
app.post('/ftp/download/:filename', authGuard, async (req, res) => {
    const { username, password } = req.body;
    console.log("download: ", username);

    const client = await getFtpClient(username, password);
    const { filename } = req.params;
    const localPath = path.join(__dirname, 'downloads', filename);
    try {
        await client.downloadTo(localPath, filename);
        res.download(localPath, () => {
            fs.unlinkSync(localPath); // Borrar el archivo después de enviar
        });
    } catch (err) {
        res.status(500).send('Error al descargar archivo');
    } finally {
        client.close();
    }
});

//Subir Archivo
app.post('/ftp/upload', authGuard, upload.single('file'), async (req, res) => {
    const { username, password } = req.body;
    console.log("updload: ", username);

    if (!username || !password) {
      return res.status(400).send("Credenciales faltantes");
    }

    if (!req.file) {
        return res.status(400).send("No se recibió ningún archivo.");
    }
    
    const client = await getFtpClient(username, password);
    const file = req.file;
    try {
        await client.uploadFrom(file.path, file.originalname);
        fs.unlinkSync(file.path);
        res.json({ message: 'Archivo subido con éxito' });
    } catch (err) {
        res.status(500).send('Error al subir archivo');
    } finally {
        client.close();
    }
});

//Borrar Archivo
app.delete('/ftp/delete/:filename', authGuard, async (req, res) => {
    const { username, password } = req.query;
    const { filename } = req.params;

    if (!username || !password) {
        return res.status(400).send('Faltan credenciales FTP');
    }

    const client = await getFtpClient(username, password);
    try {
        await client.remove(filename);
        res.json({ message: `Archivo "${filename}" eliminado correctamente` });
    } catch (err) {
        console.error("Error al eliminar archivo:", err.message);
        res.status(500).send(`Error al eliminar archivo "${filename}"`);
    } finally {
        client.close();
    }
});

//Inicio Servidor
app.listen(3000, () => console.log("Servidor corriendo en puerto 3000"));