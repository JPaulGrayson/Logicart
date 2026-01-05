import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const VOYAI_PUBLIC_KEY = process.env.VOYAI_PUBLIC_KEY || `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAs5IIaW4LRZ2FsutCP/LZ
Q2zEC8KS+y5kMqGMt8A4tRX7DWHAcfz4Yo+vgp3klufZMN5tW9mTFYpDTWjGO/b8
pNNSYFg8EYCX6tDmsLo1Svcz8ciAUvtQITF72pufSkuDAAeNemotjLFEM/zNidTK
khvavCdSAUfgsZNkrmzqlDYtEDZU1DfDgeiEJXIWEKGlOxH00C23dSg0JHuKXPft
hD9MZHt4AGW12AMtbbJTlDXp2th8xnxMJEK0Pc6TRiuUIlxTpScB8POO+rGLCyGB
PwCz+Z5KNKxgozCbEZk99lhr+jgCdHir6jzL4C5A/rXKYZdBLV51GhR6rK+UM+0M
6QIDAQAB
-----END PUBLIC KEY-----`;

export interface VoyaiTokenPayload {
  userId: string;
  email: string;
  appId: string;
  tier: string;
  features: {
    history_database?: boolean;
    rabbit_hole_rescue?: boolean;
    github_sync?: boolean;
    managed_allowance?: number;
  };
  iat: number;
  exp: number;
}

export function verifyTokenPublic(req: Request): VoyaiTokenPayload | null {
  return verifyToken(req);
}

const DEMO_USER_PAYLOAD: VoyaiTokenPayload = {
  userId: 'demo-user',
  email: 'demo@logigo.dev',
  appId: 'logigo',
  tier: 'founder',
  features: {
    history_database: true,
    rabbit_hole_rescue: true,
    github_sync: true,
    managed_allowance: 100,
  },
  iat: 0,
  exp: 0,
};

function verifyToken(req: Request): VoyaiTokenPayload | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  // Handle demo token
  if (token === 'demo-token') {
    return { ...DEMO_USER_PAYLOAD, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 };
  }
  
  try {
    const payload = jwt.verify(token, VOYAI_PUBLIC_KEY, { 
      algorithms: ['RS256'] 
    }) as VoyaiTokenPayload;
    
    if (payload.appId !== 'logigo') {
      return null;
    }
    
    return payload;
  } catch {
    return null;
  }
}

export function requireFounderTier(req: Request, res: Response, next: NextFunction) {
  const payload = verifyToken(req);
  
  if (!payload) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  
  if (payload.tier !== 'founder') {
    return res.status(403).json({ error: 'Founder tier required' });
  }
  
  (req as any).user = payload;
  next();
}

export function requireHistoryFeature(req: Request, res: Response, next: NextFunction) {
  const payload = verifyToken(req);
  
  if (!payload) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  
  if (!payload.features?.history_database) {
    return res.status(403).json({ error: 'Pro feature required: History Database' });
  }
  
  (req as any).user = payload;
  next();
}
