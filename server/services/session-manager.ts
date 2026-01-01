import type { Response } from 'express';
import type { WebSocket } from 'ws';
import crypto from 'crypto';

export interface Checkpoint {
    id: string;
    label?: string;
    variables: Record<string, any>;
    line?: number;
    timestamp: number;
}

export interface RemoteSession {
    id: string;
    name?: string;
    code?: string;
    checkpoints: Checkpoint[];
    sseClients: Response[];
    studioWsClients: Set<WebSocket>;
    remoteWsClients: Set<WebSocket>;
    createdAt: Date;
    lastActivity: Date;
}

const SESSION_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const MAX_SESSIONS = 100;
const MAX_QUEUE_DEPTH = 1000;

class SessionManager {
    private sessions = new Map<string, RemoteSession>();

    constructor() {
        // Cleanup expired sessions every minute
        setInterval(() => this.cleanupExpiredSessions(), 60 * 1000);
    }

    private cleanupExpiredSessions() {
        const now = Date.now();
        for (const [id, session] of this.sessions) {
            if (now - session.lastActivity.getTime() > SESSION_TIMEOUT_MS) {
                session.sseClients.forEach((client) => client.end());
                this.sessions.delete(id);
            }
        }
    }

    createSession(name?: string, code?: string): { sessionId: string; session: RemoteSession } {
        if (this.sessions.size >= MAX_SESSIONS) {
            throw new Error('Maximum sessions reached');
        }

        const sessionId = crypto.randomUUID();
        const session: RemoteSession = {
            id: sessionId,
            name: name || 'Remote Session',
            code: code || undefined,
            checkpoints: [],
            sseClients: [],
            studioWsClients: new Set(),
            remoteWsClients: new Set(),
            createdAt: new Date(),
            lastActivity: new Date(),
        };

        this.sessions.set(sessionId, session);
        return { sessionId, session };
    }

    getSession(sessionId: string): RemoteSession | undefined {
        return this.sessions.get(sessionId);
    }

    addCheckpoint(sessionId: string, checkpoint: Partial<Checkpoint>): Checkpoint {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        const checkpointData: Checkpoint = {
            id: checkpoint.id || `checkpoint-${session.checkpoints.length}`,
            label: checkpoint.label,
            variables: checkpoint.variables || {},
            line: checkpoint.line,
            timestamp: Date.now(),
        };

        // Apply queue depth limit (drop oldest if exceeded)
        if (session.checkpoints.length >= MAX_QUEUE_DEPTH) {
            session.checkpoints.shift();
        }

        session.checkpoints.push(checkpointData);
        session.lastActivity = new Date();

        // Broadcast to all SSE clients
        const eventData = JSON.stringify(checkpointData);
        session.sseClients.forEach((client) => {
            client.write(`event: checkpoint\ndata: ${eventData}\n\n`);
        });

        return checkpointData;
    }

    updateCode(sessionId: string, code: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        session.code = code;
        session.lastActivity = new Date();

        // Notify SSE clients about the code update
        session.sseClients.forEach((client) => {
            client.write(`event: code_update\ndata: ${JSON.stringify({ code })}\n\n`);
        });
    }

    endSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        // Notify all clients session ended
        session.sseClients.forEach((client) => {
            client.write(`event: session_end\ndata: {}\n\n`);
            client.end();
        });

        this.sessions.delete(sessionId);
    }

    addSSEClient(sessionId: string, client: Response): void {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        session.sseClients.push(client);
    }

    removeSSEClient(sessionId: string, client: Response): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        const index = session.sseClients.indexOf(client);
        if (index > -1) {
            session.sseClients.splice(index, 1);
        }
    }

    getSessionInfo(sessionId: string) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }

        return {
            id: session.id,
            name: session.name,
            code: session.code,
            checkpointCount: session.checkpoints.length,
            viewerCount: session.sseClients.length,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity,
        };
    }
}

export const sessionManager = new SessionManager();
