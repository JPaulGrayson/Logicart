import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FLOWCHART_FILE_PATH = path.join(__dirname, '..', 'data', 'flowchart.json');

export const fileSyncRouter = Router();

// Get file status (for polling)
fileSyncRouter.get('/status', (req, res) => {
    try {
        if (!fs.existsSync(FLOWCHART_FILE_PATH)) {
            return res.json({ lastModified: 0, exists: false });
        }
        const stats = fs.statSync(FLOWCHART_FILE_PATH);
        res.json({ lastModified: stats.mtimeMs, exists: true });
    } catch (error) {
        console.error('[File Sync] Status error:', error);
        res.status(500).json({ error: 'Failed to get file status' });
    }
});

// Load flowchart from file
fileSyncRouter.get('/load', (req, res) => {
    try {
        if (!fs.existsSync(FLOWCHART_FILE_PATH)) {
            return res.json({ success: true, data: { nodes: [], edges: [], code: '' } });
        }
        const content = fs.readFileSync(FLOWCHART_FILE_PATH, 'utf-8');
        const data = JSON.parse(content);
        res.json({ success: true, data });
    } catch (error) {
        console.error('[File Sync] Load error:', error);
        res.status(500).json({ error: 'Failed to load flowchart' });
    }
});

// Save flowchart to file
fileSyncRouter.post('/save', (req, res) => {
    try {
        const data = req.body;
        fs.writeFileSync(FLOWCHART_FILE_PATH, JSON.stringify(data, null, 2));
        res.json({ success: true, lastModified: Date.now() });
    } catch (error) {
        console.error('[File Sync] Save error:', error);
        res.status(500).json({ error: 'Failed to save flowchart' });
    }
});
