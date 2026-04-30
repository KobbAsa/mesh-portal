import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFilePath = path.join(__dirname, 'mesh_audit.log');

export function logAudit(category, callsign, ip, details) {
    const timestamp = new Date().toISOString();

    const logEntryObj = {
        timestamp,
        category, // AUTH, FILE, CHAT, SYSTEM
        callsign: callsign || 'SYSTEM',
        ip: ip || 'LOCAL',
        ...details // Додаткові дані (розмір файлу, статус тощо)
    };

    const logString = JSON.stringify(logEntryObj) + '\n';

    console.log(`[${timestamp}] [${category}] ${callsign || 'SYSTEM'} (${ip || 'LOCAL'})`);

    fs.appendFile(logFilePath, logString, (err) => {
        if (err) console.error("[-] Помилка запису в Audit Log:", err);
    });
}