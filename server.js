import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("❌ КРИТИЧНА ПОМИЛКА: Не задано JWT_SECRET у файлі .env");
    process.exit(1);
}

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.static(path.join(__dirname, 'dist')));
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));

const usersDB = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));

app.post('/api/login', async (req, res) => {
    const { callsign, password } = req.body;

    const user = usersDB.find(u => u.callsign.toLowerCase() === callsign.toLowerCase());
    if (!user) {
        return res.status(401).json({ error: 'Обліковий запис не знайдено' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);

    if (!validPassword) {
        return res.status(401).json({ error: 'Відмова у доступі: Невірний пароль' });
    }

    const token = jwt.sign({ callsign: user.callsign, role: user.role }, JWT_SECRET, { expiresIn: '12h' });

    console.log(`[+] Успішна авторизація: ${user.callsign}`);
    res.json({ token, callsign: user.callsign });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Файл не отримано' });
    const fileData = {
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        size: req.file.size
    };
    io.emit('new_file', fileData);
    res.status(200).json({ message: 'Ок', file: fileData });
});

let onlineUsers = {};

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return next(new Error('Authentication error'));
        socket.decodedUser = decoded;
        next();
    });
});

io.on('connection', (socket) => {
    let clientIp = socket.handshake.address;
    if (clientIp.includes('::ffff:')) clientIp = clientIp.split('::ffff:')[1];
    if (clientIp === '::1') clientIp = '127.0.0.1';

    const verifiedCallsign = socket.decodedUser.callsign;
    console.log(`[+] Підключення Socket: ${socket.id} (Юзер: ${verifiedCallsign}, IP: ${clientIp})`);

    socket.on('join', (userData) => {
        const user = { name: verifiedCallsign, ip: clientIp, status: 'online' };
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

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mesh сервер зв'язку запущено на порту ${PORT}`);
});