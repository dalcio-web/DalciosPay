import type { NextFunction, Request, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { verifyFirebaseIdToken } from './firebaseAdmin';

export interface AuthenticatedRequest extends Request {
  authUser?: DecodedIdToken;
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;

  const match = header.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] ?? null;
}

export async function getAuthenticatedUser(req: Request): Promise<DecodedIdToken | null> {
  const token = extractBearerToken(req);
  if (!token) return null;

  try {
    return await verifyFirebaseIdToken(token);
  } catch (error) {
    console.warn('[Auth] Token Firebase rejeitado.');
    return null;
  }
}

export async function requireFirebaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: 'Sessão inválida ou expirada.' });
    return;
  }

  req.authUser = user;
  next();
}
