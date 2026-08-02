import type { NextFunction, Request, Response } from 'express';
import { isDemoMode } from '../config/env';
import type { UserRole } from '../domain/user';
import { getFirebaseAdmin } from '../infrastructure/firebase/admin';
import { AppError } from './errorHandler';

/**
 * Verifies Firebase ID token. In DEMO_MODE, accepts:
 * Authorization: Bearer demo-<uid> or demo-admin-<uid>
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'Missing or invalid Authorization header', 'UNAUTHORIZED');
    }

    const token = header.slice('Bearer '.length).trim();

    if (isDemoMode && token.startsWith('demo-')) {
      const isAdmin = token.startsWith('demo-admin-');
      const uid = isAdmin ? token.replace('demo-admin-', '') : token.replace('demo-', '');
      req.user = {
        uid: uid || 'demo-user',
        email: `${uid || 'demo-user'}@demo.local`,
        role: isAdmin ? 'admin' : 'user',
      };
      next();
      return;
    }

    const admin = getFirebaseAdmin();
    if (!admin) {
      throw new AppError(503, 'Auth provider unavailable', 'AUTH_UNAVAILABLE');
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const role = ((decoded.role as UserRole) || 'user') as UserRole;
    req.user = {
      uid: decoded.uid,
      email: decoded.email || '',
      role,
    };
    next();
  } catch (err) {
    if (err instanceof AppError) {
      next(err);
      return;
    }
    next(new AppError(401, 'Invalid or expired token', 'UNAUTHORIZED'));
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(new AppError(403, 'Forbidden', 'FORBIDDEN'));
      return;
    }
    next();
  };
}
