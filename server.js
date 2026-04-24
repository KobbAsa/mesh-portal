import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        cb(null, Date.now() + '_' + file.originalname);
    }
});
const upload = multer({ storage });

app.use('/uploads', express.static(uploadDir));

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Файл не отримано' });
    }

    const fileData = {
        name: req.file.originalname,
        url: `http://${req.hostname}:3000/uploads/${req.file.filename}`,
        size: req.file.size
    };

    io.emit('new_file', fileData);

    res.status(200).json({ message: 'Ок', file: fileData });
});

let onlineUsers = {};

io.on('connection', (socket) => {
    let clientIp = socket.handshake.address;
    if (clientIp.includes('::ffff:')) {
        clientIp = clientIp.split('::ffff:')[1];
    }
    if (clientIp === '::1') clientIp = '127.0.0.1';

    console.log(`[+] Підключення: ${socket.id} (IP: ${clientIp})`);

    socket.on('join', (user) => {
        user.ip = clientIp;
        onlineUsers[socket.id] = user;

        socket.emit('joined', user);

        io.emit('users_update', Object.values(onlineUsers));
        socket.broadcast.emit('message', { type: 'system', text: `Вузол ${user.name} (${user.ip}) в мережі` });
    });

    socket.on('send_message', (text) => {
        const sender = onlineUsers[socket.id];
        if (sender) {
            io.emit('message', { type: 'received', sender: sender.name, text: text });
        }
    });

    socket.on('disconnect', () => {
        const user = onlineUsers[socket.id];
        if (user) {
            console.log(`[-] Відключення: ${user.name}`);
            delete onlineUsers[socket.id];
            io.emit('users_update', Object.values(onlineUsers));
            socket.broadcast.emit('message', { type: 'system', text: `Вузол ${user.name} відключився` });
        }
    });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mesh сервер зв'язку запущено на порту ${PORT}`);
});