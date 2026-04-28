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
import db, { runRotation } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error("❌ CRITICAL ERROR: JWT_SECRET is not defined in .env file");
    process.exit(1);
}

const PORT = process.env.PORT || 3000;

const app = express();

const allowedOrigins = [/^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.0\.\d+)(:\d+)?$/];
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const isAllowed = allowedOrigins.some(regex => regex.test(origin));
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Blocked by CORS policy'));
        }
    }
};

app.use(express.static(path.join(__dirname, 'dist')));
app.use(cors(corsOptions));
app.use(express.json());

const server = createServer(app);
const io = new Server(server, { cors: corsOptions });

setInterval(runRotation, 24 * 60 * 60 * 1000);
runRotation();

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safeName = encodeURIComponent(file.originalname.replace(/\s+/g, '_'));
        cb(null, Date.now() + '_' + safeName);
    }
});
const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));

let usersDB = [];
try {
    usersDB = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8'));
} catch (error) {
    console.error("❌ CRITICAL ERROR: Could not read or parse users.json", error.message);
    process.exit(1);
}

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    }
};

app.post('/api/login', async (req, res) => {
    try {
        const { callsign, password } = req.body;

        const user = usersDB.find(u => u.callsign.toLowerCase() === callsign.toLowerCase());
        if (!user) {
            return res.status(401).json({ error: 'Account not found' });
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Access denied: Invalid password' });
        }

        const token = jwt.sign({ callsign: user.callsign, role: user.role }, JWT_SECRET, { expiresIn: '12h' });

        console.log(`[+] Auth Success: ${user.callsign}`);
        res.json({ token, callsign: user.callsign });
    } catch (error) {
        console.error("[-] Login Error:", error);
        res.status(500).json({ error: 'Internal server error during authentication' });
    }
});

app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file received' });

    const fileData = {
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        size: req.file.size,
        uploader: req.user.callsign
    };

    db.run(`INSERT INTO files (name, url, size, uploader) VALUES (?, ?, ?, ?)`,
        [fileData.name, fileData.url, fileData.size, fileData.uploader],
        function(err) {
            if (err) return res.status(500).json({ error: "DB Error" });
            io.emit('new_file', fileData);
            res.status(200).json({ message: 'Success', file: fileData });
        }
    );
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
    console.log(`[+] Socket Connected: ${socket.id} (User: ${verifiedCallsign}, IP: ${clientIp})`);

    socket.on('join', (userData) => {
        const user = { name: verifiedCallsign, ip: clientIp, status: 'online' };
        onlineUsers[socket.id] = user;

        socket.emit('joined', user);
        io.emit('users_update', Object.values(onlineUsers));
        socket.broadcast.emit('message', { type: 'system', text: `Node ${user.name} (${user.ip}) has joined` });

        db.all(`SELECT sender, text, 'received' as type FROM messages ORDER BY timestamp DESC LIMIT 50`, [], (err, rows) => {
            if (!err) {
                socket.emit('history_messages', rows.reverse());
            } else {
                console.error("[-] DB Error (Read Messages):", err.message);
            }
        });

        db.all(`SELECT name, url, size FROM files ORDER BY timestamp DESC LIMIT 50`, [], (err, rows) => {
            if (!err) {
                socket.emit('history_files', rows.reverse());
            } else {
                console.error("[-] DB Error (Read Files):", err.message);
            }
        });
    });

    socket.on('send_message', (text) => {
        const sender = onlineUsers[socket.id];
        if (sender) {
            db.run(`INSERT INTO messages (type, sender, text) VALUES (?, ?, ?)`,
                ['received', sender.name, text],
                function(err) {
                    if (err) {
                        console.error("[-] DB Error (Write Message):", err.message);
                    } else {
                        io.emit('message', { type: 'received', sender: sender.name, text: text });
                    }
                }
            );
        }
    });

    socket.on('disconnect', () => {
        const user = onlineUsers[socket.id];
        if (user) {
            console.log(`[-] Socket Disconnected: ${user.name}`);
            delete onlineUsers[socket.id];
            io.emit('users_update', Object.values(onlineUsers));
            socket.broadcast.emit('message', { type: 'system', text: `Node ${user.name} went offline` });
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mesh Communication Server running on port ${PORT}`);
});