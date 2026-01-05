// GitHub Sync Routes for LogiGo
import { Router, Request, Response } from 'express';
import { requireHistoryFeature, verifyTokenPublic } from '../middleware';
import { syncFlowchartToGitHub, listUserRepos, getGitHubUser } from '../github';

export const githubSyncRouter = Router();

// Check if GitHub is connected and get user info
githubSyncRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const result = await getGitHubUser();
    if (result.success) {
      res.json({ connected: true, user: result.user });
    } else {
      res.json({ connected: false, error: result.error });
    }
  } catch (error: any) {
    res.json({ connected: false, error: error.message });
  }
});

// List user's repositories
githubSyncRouter.get('/repos', async (req: Request, res: Response) => {
  try {
    // Verify user has git sync feature
    const user = verifyTokenPublic(req);
    if (!user || !user.features?.github_sync) {
      return res.status(403).json({ success: false, error: 'GitHub Sync requires Pro tier' });
    }

    const result = await listUserRepos();
    if (result.success) {
      res.json({ success: true, repos: result.repos });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Sync flowchart to GitHub
githubSyncRouter.post('/sync', async (req: Request, res: Response) => {
  try {
    // Verify user has git sync feature
    const user = verifyTokenPublic(req);
    if (!user || !user.features?.github_sync) {
      return res.status(403).json({ success: false, error: 'GitHub Sync requires Pro tier' });
    }

    const { owner, repo, filename, code, flowchartData } = req.body;

    if (!owner || !repo || !code) {
      return res.status(400).json({ success: false, error: 'Missing required fields: owner, repo, code' });
    }

    // Generate filename from code function name or use default
    const safeName = filename || 'flowchart';
    const sanitizedName = safeName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);
    const path = `logigo/${sanitizedName}_${timestamp}.json`;

    // Create the sync content
    const syncContent = JSON.stringify({
      _meta: {
        generator: 'LogiGo',
        version: '1.0',
        syncedAt: new Date().toISOString(),
        userId: user.userId,
      },
      code,
      flowchart: flowchartData,
    }, null, 2);

    const result = await syncFlowchartToGitHub({
      owner,
      repo,
      path,
      content: syncContent,
      message: `[LogiGo] Sync flowchart: ${sanitizedName}`,
    });

    if (result.success) {
      res.json({ 
        success: true, 
        url: result.url,
        path,
        message: 'Flowchart synced to GitHub successfully'
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error('[GitHub Sync] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
