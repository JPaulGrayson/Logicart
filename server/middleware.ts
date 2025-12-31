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
  };
  iat: number;
  exp: number;
}

export function requireFounderTier(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = jwt.verify(token, VOYAI_PUBLIC_KEY, { 
      algorithms: ['RS256'] 
    }) as VoyaiTokenPayload;
    
    if (payload.appId !== 'logigo') {
      return res.status(403).json({ error: 'Invalid app ID' });
    }
    
    (req as any).user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Authentication error' });
  }
}
