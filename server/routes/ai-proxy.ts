import { Router, Request, Response } from 'express';
import { db } from '../db';
import { userUsage } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { verifyTokenPublic, VoyaiTokenPayload } from '../middleware';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';

const router = Router();

const DEFAULT_MANAGED_ALLOWANCE = 50;

function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() && 
         date1.getMonth() === date2.getMonth();
}

async function getUserUsage(userId: string) {
  const existing = await db.select().from(userUsage).where(eq(userUsage.voyaiUserId, userId));
  
  if (existing.length === 0) {
    const now = new Date();
    await db.insert(userUsage).values({
      voyaiUserId: userId,
      currentUsage: 0,
      lastResetDate: now,
    });
    return { currentUsage: 0, lastResetDate: now };
  }
  
  const record = existing[0];
  const now = new Date();
  
  if (!isSameMonth(new Date(record.lastResetDate), now)) {
    await db.update(userUsage)
      .set({ currentUsage: 0, lastResetDate: now })
      .where(eq(userUsage.voyaiUserId, userId));
    return { currentUsage: 0, lastResetDate: now };
  }
  
  return { currentUsage: record.currentUsage, lastResetDate: record.lastResetDate };
}

async function incrementUsage(userId: string): Promise<number> {
  const { currentUsage } = await getUserUsage(userId);
  const newUsage = currentUsage + 1;
  
  await db.update(userUsage)
    .set({ currentUsage: newUsage })
    .where(eq(userUsage.voyaiUserId, userId));
  
  return newUsage;
}

router.get('/usage', async (req: Request, res: Response) => {
  try {
    const user = verifyTokenPublic(req);
    if (!user) {
      return res.status(401).json({ error: 'Authorization required' });
    }
    
    const { currentUsage } = await getUserUsage(user.userId);
    const managedAllowance = user.features?.managed_allowance ?? DEFAULT_MANAGED_ALLOWANCE;
    
    return res.json({
      currentUsage,
      managedAllowance,
      remaining: Math.max(0, managedAllowance - currentUsage),
    });
  } catch (error) {
    console.error('[AI Proxy] Error fetching usage:', error);
    return res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

router.post('/proxy', async (req: Request, res: Response) => {
  try {
    const user = verifyTokenPublic(req);
    if (!user) {
      return res.status(401).json({ error: 'Authorization required' });
    }
    
    const { currentUsage } = await getUserUsage(user.userId);
    const managedAllowance = user.features?.managed_allowance ?? DEFAULT_MANAGED_ALLOWANCE;
    
    if (currentUsage >= managedAllowance) {
      return res.status(402).json({ 
        error: 'Monthly credits exhausted',
        currentUsage,
        managedAllowance,
        message: 'Please enter your own API key to continue using AI features.'
      });
    }
    
    const { provider, prompt, mode } = req.body;
    
    if (!provider || !prompt) {
      return res.status(400).json({ error: 'Provider and prompt are required' });
    }
    
    let result: { content: string; error?: string } = { content: '' };
    
    const systemPrompt = mode === 'debug' 
      ? 'You are a debugging assistant. Analyze the code and error, explain the issue, and provide a fix.'
      : 'You are a code generation assistant. Generate clean, well-structured JavaScript code.';
    
    switch (provider) {
      case 'openai': {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
          return res.status(500).json({ error: 'OpenAI API key not configured on server' });
        }
        const client = new OpenAI({ apiKey });
        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2048
        });
        result.content = response.choices[0]?.message?.content || '';
        break;
      }
      
      case 'gemini': {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          return res.status(500).json({ error: 'Gemini API key not configured on server' });
        }
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          config: { systemInstruction: systemPrompt },
          contents: prompt
        });
        result.content = response.text || '';
        break;
      }
      
      case 'anthropic': {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          return res.status(500).json({ error: 'Anthropic API key not configured on server' });
        }
        const client = new Anthropic({ apiKey });
        const response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2048,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }]
        });
        const textContent = response.content.find((c) => c.type === 'text');
        result.content = textContent?.text || '';
        break;
      }
      
      case 'xai': {
        const apiKey = process.env.XAI_API_KEY;
        if (!apiKey) {
          return res.status(500).json({ error: 'xAI API key not configured on server' });
        }
        const client = new OpenAI({ baseURL: 'https://api.x.ai/v1', apiKey });
        const response = await client.chat.completions.create({
          model: 'grok-3',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2048
        });
        result.content = response.choices[0]?.message?.content || '';
        break;
      }
      
      default:
        return res.status(400).json({ error: `Unknown provider: ${provider}` });
    }
    
    const newUsage = await incrementUsage(user.userId);
    
    return res.json({
      content: result.content,
      currentUsage: newUsage,
      managedAllowance,
      remaining: Math.max(0, managedAllowance - newUsage),
    });
    
  } catch (error: any) {
    console.error('[AI Proxy] Error:', error);
    return res.status(500).json({ error: error.message || 'AI request failed' });
  }
});

export { router as aiProxyRouter };
