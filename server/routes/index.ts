import type { Express } from 'express';
import { createServer, type Server } from 'http';
import { fileSyncRouter } from './routes/file-sync';
import { shareRouter, handleShareView } from './routes/share';
import { remoteRouter } from './routes/remote';
import { registerAIRoutes } from './ai';
import { registerArenaRoutes } from './arena';

/**
 * Register all application routes
 * 
 * This is the main entry point for route registration.
 * Routes are organized into logical modules:
 * - /api/file/* - File sync (bi-directional sync)
 * - /api/share/* - Flowchart sharing
 * - /api/remote/* - Remote mode (external app integration)
 * - /api/ai/* - AI services
 * - /arena/* - Model arena
 */
export async function registerModularRoutes(app: Express): Promise<Server> {
    // File sync routes
    app.use('/api/file', fileSyncRouter);

    // Share routes
    app.use('/api/share', shareRouter);
    app.get('/s/:id', handleShareView);

    // Remote mode routes
    app.use('/api/remote', remoteRouter);

    // AI and Arena routes (already modular)
    registerAIRoutes(app);
    registerArenaRoutes(app);

    // Create HTTP server
    const server = createServer(app);

    return server;
}
