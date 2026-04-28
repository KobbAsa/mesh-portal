import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'mesh_data.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        sender TEXT,
        text TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        url TEXT,
        size INTEGER,
        uploader TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

export function runRotation() {
    const thirtyDaysAgo = "DATETIME('now', '-30 days')";

    console.log("[🛠️] Running data rotation...");

    db.all(`SELECT url FROM files WHERE timestamp < ${thirtyDaysAgo}`, [], (err, rows) => {
        if (err) return console.error(err.message);

        rows.forEach(file => {
            const filePath = path.join(__dirname, file.url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`[🗑️] Physical file deleted: ${file.url}`);
            }
        });

        db.run(`DELETE FROM messages WHERE timestamp < ${thirtyDaysAgo}`);
        db.run(`DELETE FROM files WHERE timestamp < ${thirtyDaysAgo}`);
    });
}

export default db;