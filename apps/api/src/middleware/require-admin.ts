import {
  createHash,
  createHmac,
  timingSafeEqual,
} from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

export const ADMIN_SESSION_COOKIE = 'goi_admin_session';
export const ADMIN_CSRF_HEADER = 'X-CSRF-Token';

const SAFE_ADMIN_METHODS = new Set([
  'GET',
  'HEAD',
  'OPTIONS',
]);

export function createAdminCsrfToken(
  sessionToken: string,
) {
  return createHmac(
    'sha256',
    sessionToken,
  )
    .update('goi-admin-csrf-v1')
    .digest('hex');
}

export function isValidAdminCsrfToken(
  sessionToken: string,
  candidate: string,
) {
  const expected =
    createAdminCsrfToken(sessionToken);

  const expectedBuffer =
    Buffer.from(expected, 'utf8');

  const candidateBuffer =
    Buffer.from(candidate, 'utf8');

  return (
    expectedBuffer.length ===
      candidateBuffer.length &&
    timingSafeEqual(
      expectedBuffer,
      candidateBuffer,
    )
  );
}

export function requireAdminCsrf(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (
    SAFE_ADMIN_METHODS.has(
      request.method.toUpperCase(),
    )
  ) {
    return next();
  }

  if (
    request.method.toUpperCase() ===
      'POST' &&
    request.path === '/auth/login'
  ) {
    return next();
  }

  const sessionToken =
    request.cookies?.[
      ADMIN_SESSION_COOKIE
    ];

  /*
   * Sans cookie, laissons requireAdmin
   * produire le 401 normal.
   */
  if (
    !sessionToken ||
    typeof sessionToken !== 'string'
  ) {
    return next();
  }

  const candidate =
    request
      .get(ADMIN_CSRF_HEADER)
      ?.trim();

  if (
    !candidate ||
    candidate.length > 128 ||
    !isValidAdminCsrfToken(
      sessionToken,
      candidate,
    )
  ) {
    return response.status(403).json({
      error: 'INVALID_CSRF_TOKEN',
      message:
        'La requête de sécurité est invalide ou expirée.',
    });
  }

  return next();
}

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

    response.setHeader(
      ADMIN_CSRF_HEADER,
      createAdminCsrfToken(token),
    );

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
