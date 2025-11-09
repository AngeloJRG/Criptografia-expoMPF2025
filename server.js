const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let lastEncryptedMessage = null;

io.on('connection', (socket) => {
    console.log('Nuevo dispositivo conectado');

    if (lastEncryptedMessage) {
        socket.emit('newEncryptedMessage', lastEncryptedMessage);
    }

    socket.on('messageEncrypted', (data) => {
        console.log('Mensaje encriptado recibido:', data);
        lastEncryptedMessage = data;
        io.emit('newEncryptedMessage', data);
    });

    socket.on('disconnect', () => {
        console.log('Dispositivo desconectado');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor ejecutándose en puerto ${PORT}`);
});