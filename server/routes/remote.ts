import { Router } from 'express';
import { sessionManager } from '../services/session-manager';

export const remoteRouter = Router();

// CORS middleware for remote API
remoteRouter.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Create a new remote session
remoteRouter.post('/session', (req, res) => {
    try {
        const { code, name } = req.body;
        const { sessionId } = sessionManager.createSession(name, code);

        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const host = req.headers.host || 'localhost:5000';
        const baseUrl = `${protocol}://${host}`;
        const connectUrl = `${baseUrl}/remote/${sessionId}`;
        const studioUrl = `${baseUrl}/?session=${sessionId}`;

        res.json({
            sessionId,
            connectUrl,
            studioUrl,
            message: 'Session created. Open studioUrl to view flowchart.',
        });
    } catch (error: any) {
        console.error('Session creation error:', error);
        if (error.message === 'Maximum sessions reached') {
            return res.status(503).json({ error: 'Maximum sessions reached. Try again later.' });
        }
        res.status(500).json({ error: 'Failed to create session' });
    }
});

// Send a checkpoint to a session
remoteRouter.post('/checkpoint', (req, res) => {
    try {
        const { sessionId, checkpoint } = req.body;

        if (!sessionId || !checkpoint) {
            return res.status(400).json({ error: 'Missing sessionId or checkpoint' });
        }

        const checkpointData = sessionManager.addCheckpoint(sessionId, checkpoint);

        const session = sessionManager.getSession(sessionId);
        res.json({ success: true, checkpointCount: session?.checkpoints.length || 0 });
    } catch (error: any) {
        console.error('Checkpoint error:', error);
        if (error.message === 'Session not found') {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.status(500).json({ error: 'Failed to process checkpoint' });
    }
});

// End a session
remoteRouter.post('/session/end', (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'Missing sessionId' });
        }

        sessionManager.endSession(sessionId);
        res.json({ ended: true });
    } catch (error: any) {
        console.error('Session end error:', error);
        if (error.message === 'Session not found') {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.status(500).json({ error: 'Failed to end session' });
    }
});

// SSE stream for real-time checkpoint updates
remoteRouter.get('/stream/:sessionId', (req, res) => {
    const { sessionId } = req.params;

    try {
        const session = sessionManager.getSession(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Set up SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.flushHeaders();

        // Send initial session info
        res.write(
            `event: session_info\ndata: ${JSON.stringify({
                id: session.id,
                name: session.name,
                code: session.code,
                checkpointCount: session.checkpoints.length,
            })}\n\n`
        );

        // Send existing checkpoints
        session.checkpoints.forEach((cp) => {
            res.write(`event: checkpoint\ndata: ${JSON.stringify(cp)}\n\n`);
        });

        // Add client to session
        sessionManager.addSSEClient(sessionId, res);

        // Remove client on disconnect
        req.on('close', () => {
            sessionManager.removeSSEClient(sessionId, res);
        });
    } catch (error) {
        console.error('SSE stream error:', error);
        res.status(500).json({ error: 'Failed to establish stream' });
    }
});

// Register code for a session (for flowchart visualization)
remoteRouter.post('/code', (req, res) => {
    try {
        const { sessionId, code } = req.body;

        if (!sessionId || !code) {
            return res.status(400).json({ error: 'Missing sessionId or code' });
        }

        sessionManager.updateCode(sessionId, code);
        res.json({ success: true, message: 'Code registered for flowchart visualization' });
    } catch (error: any) {
        console.error('Code registration error:', error);
        if (error.message === 'Session not found') {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.status(500).json({ error: 'Failed to register code' });
    }
});

// Get session info (for debugging/testing)
remoteRouter.get('/session/:sessionId', (req, res) => {
    const { sessionId } = req.params;

    try {
        const info = sessionManager.getSessionInfo(sessionId);
        res.json(info);
    } catch (error: any) {
        if (error.message === 'Session not found') {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.status(500).json({ error: 'Failed to get session info' });
    }
});
