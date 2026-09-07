import { createHash } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const ADMIN_SESSION_COOKIE = 'goi_admin_session';

export function hashAdminSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function requireAdmin(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const token = request.cookies?.[ADMIN_SESSION_COOKIE];

  if (!token || typeof token !== 'string') {
    return response.status(401).json({
      error: 'ADMIN_AUTH_REQUIRED',
      message: 'Authentification administrateur requise.',
    });
  }

  const tokenHash = hashAdminSessionToken(token);

  try {
    const session = await prisma.adminSession.findUnique({
      where: {
        tokenHash,
      },
      include: {
        adminUser: true,
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      !session.adminUser.active
    ) {
      return response.status(401).json({
        error: 'INVALID_ADMIN_SESSION',
        message: 'La session administrateur est invalide ou expirée.',
      });
    }

    response.locals.admin = {
      id: session.adminUser.id,
      email: session.adminUser.email,
      fullName: session.adminUser.fullName,
      role: session.adminUser.role,
      sessionId: session.id,
    };

    next();
  } catch (error) {
    console.error('Erreur vérification session admin :', error);

    return response.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Impossible de vérifier la session administrateur.',
    });
  }
}
