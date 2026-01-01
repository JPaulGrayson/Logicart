import { Router } from 'express';
import crypto from 'crypto';
import { db } from '../db';
import { shares } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

export const shareRouter = Router();

// Create a new share
shareRouter.post('/', async (req, res) => {
    try {
        const { code, title, description } = req.body;

        if (!code || typeof code !== 'string') {
            return res.status(400).json({ error: 'Code is required' });
        }

        const id = crypto.randomBytes(4).toString('hex');

        await db.insert(shares).values({
            id,
            code,
            title: title || null,
            description: description || null,
        });

        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const url = `${baseUrl}/s/${id}`;

        res.json({ id, url });
    } catch (error) {
        console.error('[Share] Error creating share:', error);
        res.status(500).json({ error: 'Failed to create share' });
    }
});

// Get share by ID (API)
shareRouter.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.select().from(shares).where(eq(shares.id, id));

        if (result.length === 0) {
            return res.status(404).json({ error: 'Share not found' });
        }

        res.json(result[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch share' });
    }
});

// View share (redirects to app with code)
export async function handleShareView(req: any, res: any) {
    try {
        const { id } = req.params;

        const result = await db.select().from(shares).where(eq(shares.id, id));

        if (result.length === 0) {
            return res.status(404).send('Share not found');
        }

        await db.update(shares)
            .set({ views: sql`${shares.views} + 1` })
            .where(eq(shares.id, id));

        const share = result[0];
        const encoded = Buffer.from(share.code).toString('base64');
        const titleParam = share.title ? `&title=${encodeURIComponent(share.title)}` : '';

        res.redirect(`/?code=${encodeURIComponent(encoded)}${titleParam}`);
    } catch (error) {
        console.error('[Share] Error fetching share:', error);
        res.status(500).send('Error loading share');
    }
}
