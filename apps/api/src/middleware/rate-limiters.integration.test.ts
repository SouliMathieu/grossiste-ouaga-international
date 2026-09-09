import type { AddressInfo } from 'node:net';
import express from 'express';
import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  contactMessageRateLimit,
} from './rate-limiters.js';

describe('rate limiting behavior', () => {
  it('returns 429 after the configured limit is exceeded', async () => {
    const app = express();

    app.get(
      '/limited',
      contactMessageRateLimit,
      (_request, response) => {
        response.json({
          ok: true,
        });
      },
    );

    const server = app.listen(
      0,
      '127.0.0.1',
    );

    await new Promise<void>(
      (resolve, reject) => {
        server.once(
          'listening',
          resolve,
        );

        server.once(
          'error',
          reject,
        );
      },
    );

    const address =
      server.address();

    if (
      !address ||
      typeof address === 'string'
    ) {
      server.close();

      throw new Error(
        'Adresse du serveur de test indisponible.',
      );
    }

    const port =
      (address as AddressInfo).port;

    const url =
      `http://127.0.0.1:${port}/limited`;

    try {
      for (
        let attempt = 1;
        attempt <= 10;
        attempt += 1
      ) {
        const response =
          await fetch(url);

        expect(
          response.status,
        ).toBe(200);

        await response.text();
      }

      const blocked =
        await fetch(url);

      expect(
        blocked.status,
      ).toBe(429);

      const body =
        await blocked.json() as {
          error?: string;
        };

      expect(
        body.error,
      ).toBe('RATE_LIMITED');
    } finally {
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
    }
  });
});
