import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import cookieParser from 'cookie-parser';
import express from 'express';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

const mocks = vi.hoisted(() => ({
  sessionFindUnique: vi.fn(),
  sessionUpdateMany: vi.fn(),
  adminFindUnique: vi.fn(),
  adminUpdate: vi.fn(),
  bcryptCompare: vi.fn(),
  bcryptHash: vi.fn(),
}));

vi.mock('../lib/prisma.js', () => ({
  prisma: {
    adminSession: {
      findUnique:
        mocks.sessionFindUnique,
      updateMany:
        mocks.sessionUpdateMany,
    },
    adminUser: {
      findUnique:
        mocks.adminFindUnique,
      update:
        mocks.adminUpdate,
    },
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: mocks.bcryptCompare,
    hash: mocks.bcryptHash,
  },
}));

import { adminRouter } from './admin.js';

describe('PUT /api/admin/auth/account', () => {
  let server: Server;
  let baseUrl = '';

  const currentAdmin = {
    id: 7,
    email: 'admin@example.com',
    fullName: 'Admin GOI',
    passwordHash: 'existing-hash',
    active: true,
    role: 'ADMIN',
  };

  beforeAll(async () => {
    const app = express();

    app.use(express.json());
    app.use(cookieParser());

    app.use(
      '/api/admin',
      adminRouter,
    );

    await new Promise<void>(
      (resolve) => {
        server = app.listen(
          0,
          '127.0.0.1',
          () => resolve(),
        );
      },
    );

    const address =
      server.address() as AddressInfo;

    baseUrl =
      `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>(
      (resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      },
    );
  });

  beforeEach(() => {
    vi.resetAllMocks();

    mocks.sessionFindUnique
      .mockResolvedValue({
        id: 41,
        revokedAt: null,
        expiresAt: new Date(
          Date.now() + 60_000,
        ),
        adminUser: {
          id: currentAdmin.id,
          email:
            currentAdmin.email,
          fullName:
            currentAdmin.fullName,
          role:
            currentAdmin.role,
          active: true,
        },
      });

    mocks.adminFindUnique
      .mockResolvedValue(
        currentAdmin,
      );

    mocks.adminUpdate
      .mockResolvedValue(
        currentAdmin,
      );

    mocks.sessionUpdateMany
      .mockResolvedValue({
        count: 0,
      });

    mocks.bcryptCompare
      .mockResolvedValue(true);

    mocks.bcryptHash
      .mockResolvedValue(
        'new-password-hash',
      );
  });

  async function updateAccount(
    body: Record<string, unknown>,
  ) {
    const response = await fetch(
      `${baseUrl}/api/admin/auth/account`,
      {
        method: 'PUT',
        headers: {
          'Content-Type':
            'application/json',
          Cookie:
            'goi_admin_session=session-token-test',
        },
        body: JSON.stringify(body),
      },
    );

    const payload =
      (await response.json()) as {
        error?: string;
        message?: string;
        data?: {
          id: number;
          email: string;
          fullName: string;
          role: string;
        };
      };

    return {
      response,
      payload,
    };
  }

  it(
    'refuse un mot de passe actuel incorrect',
    async () => {
      mocks.bcryptCompare
        .mockResolvedValue(false);

      const {
        response,
        payload,
      } = await updateAccount({
        fullName: 'Admin GOI',
        email:
          'admin@example.com',
        currentPassword:
          'wrong-password',
        newPassword: '',
        newPasswordConfirm: '',
      });

      expect(
        response.status,
      ).toBe(401);

      expect(
        payload.error,
      ).toBe(
        'INVALID_CURRENT_PASSWORD',
      );

      expect(
        mocks.adminUpdate,
      ).not.toHaveBeenCalled();
    },
  );

  it(
    'refuse une confirmation de mot de passe différente',
    async () => {
      const {
        response,
        payload,
      } = await updateAccount({
        fullName: 'Admin GOI',
        email:
          'admin@example.com',
        currentPassword:
          'current-password',
        newPassword:
          'new-password-123',
        newPasswordConfirm:
          'different-password',
      });

      expect(
        response.status,
      ).toBe(400);

      expect(
        payload.error,
      ).toBe(
        'VALIDATION_ERROR',
      );

      expect(
        mocks.bcryptCompare,
      ).not.toHaveBeenCalled();

      expect(
        mocks.adminUpdate,
      ).not.toHaveBeenCalled();
    },
  );

  it(
    'modifie le nom sans changer le mot de passe ni révoquer les sessions',
    async () => {
      mocks.adminUpdate
        .mockResolvedValue({
          ...currentAdmin,
          fullName:
            'Nouvel Admin GOI',
        });

      const {
        response,
        payload,
      } = await updateAccount({
        fullName:
          'Nouvel Admin GOI',
        email:
          'admin@example.com',
        currentPassword:
          'current-password',
        newPassword: '',
        newPasswordConfirm: '',
      });

      expect(
        response.status,
      ).toBe(200);

      expect(
        payload.data?.fullName,
      ).toBe(
        'Nouvel Admin GOI',
      );

      expect(
        mocks.bcryptHash,
      ).not.toHaveBeenCalled();

      expect(
        mocks.sessionUpdateMany,
      ).not.toHaveBeenCalled();

      expect(
        mocks.adminUpdate,
      ).toHaveBeenCalledWith({
        where: {
          id: 7,
        },
        data: {
          fullName:
            'Nouvel Admin GOI',
          email:
            'admin@example.com',
          passwordHash:
            'existing-hash',
        },
      });
    },
  );

  it(
    'rehash le mot de passe et conserve uniquement la session courante',
    async () => {
      mocks.adminUpdate
        .mockResolvedValue({
          ...currentAdmin,
          passwordHash:
            'new-password-hash',
        });

      const {
        response,
      } = await updateAccount({
        fullName: 'Admin GOI',
        email:
          'admin@example.com',
        currentPassword:
          'current-password',
        newPassword:
          'new-password-123',
        newPasswordConfirm:
          'new-password-123',
      });

      expect(
        response.status,
      ).toBe(200);

      expect(
        mocks.bcryptHash,
      ).toHaveBeenCalledWith(
        'new-password-123',
        12,
      );

      expect(
        mocks.adminUpdate,
      ).toHaveBeenCalledWith({
        where: {
          id: 7,
        },
        data: {
          fullName:
            'Admin GOI',
          email:
            'admin@example.com',
          passwordHash:
            'new-password-hash',
        },
      });

      expect(
        mocks.sessionUpdateMany,
      ).toHaveBeenCalledWith({
        where: {
          adminUserId: 7,
          id: {
            not: 41,
          },
          revokedAt: null,
        },
        data: {
          revokedAt:
            expect.any(Date),
        },
      });
    },
  );
});
