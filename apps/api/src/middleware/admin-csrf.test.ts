import type {
  NextFunction,
  Request,
  Response,
} from 'express';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  ADMIN_CSRF_HEADER,
  ADMIN_SESSION_COOKIE,
  createAdminCsrfToken,
  requireAdminCsrf,
} from './require-admin.js';

function createRequest(
  method: string,
  options?: {
    path?: string;
    sessionToken?: string;
    csrfToken?: string;
  },
) {
  return {
    method,
    path:
      options?.path ??
      '/content/services/1',
    cookies: options?.sessionToken
      ? {
          [ADMIN_SESSION_COOKIE]:
            options.sessionToken,
        }
      : {},
    get(name: string) {
      if (
        name.toLowerCase() ===
        ADMIN_CSRF_HEADER.toLowerCase()
      ) {
        return options?.csrfToken;
      }

      return undefined;
    },
  } as unknown as Request;
}

function createResponse() {
  const state: {
    statusCode: number;
    body: unknown;
  } = {
    statusCode: 200,
    body: null,
  };

  const response = {
    status(code: number) {
      state.statusCode = code;
      return response;
    },
    json(body: unknown) {
      state.body = body;
      return response;
    },
  } as unknown as Response;

  return {
    response,
    state,
  };
}

describe('admin CSRF protection', () => {
  it('does not block safe GET requests', () => {
    const next = vi.fn();

    const { response } =
      createResponse();

    requireAdminCsrf(
      createRequest('GET', {
        sessionToken:
          'session-token-test',
      }),
      response,
      next as NextFunction,
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it('does not block the login endpoint', () => {
    const next = vi.fn();

    const { response } =
      createResponse();

    requireAdminCsrf(
      createRequest('POST', {
        path: '/auth/login',
      }),
      response,
      next as NextFunction,
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it('lets authentication handle a missing session', () => {
    const next = vi.fn();

    const { response } =
      createResponse();

    requireAdminCsrf(
      createRequest('PATCH'),
      response,
      next as NextFunction,
    );

    expect(next).toHaveBeenCalledOnce();
  });

  it('rejects a mutation without CSRF token', () => {
    const next = vi.fn();

    const { response, state } =
      createResponse();

    requireAdminCsrf(
      createRequest('PATCH', {
        sessionToken:
          'session-token-test',
      }),
      response,
      next as NextFunction,
    );

    expect(next).not.toHaveBeenCalled();
    expect(state.statusCode).toBe(403);

    expect(state.body).toEqual(
      expect.objectContaining({
        error:
          'INVALID_CSRF_TOKEN',
      }),
    );
  });

  it('rejects an invalid CSRF token', () => {
    const next = vi.fn();

    const { response, state } =
      createResponse();

    requireAdminCsrf(
      createRequest('DELETE', {
        sessionToken:
          'session-token-test',
        csrfToken:
          'invalid-token',
      }),
      response,
      next as NextFunction,
    );

    expect(next).not.toHaveBeenCalled();
    expect(state.statusCode).toBe(403);
  });

  it('accepts a token bound to the session', () => {
    const next = vi.fn();

    const sessionToken =
      'session-token-test';

    const { response } =
      createResponse();

    requireAdminCsrf(
      createRequest('PUT', {
        sessionToken,
        csrfToken:
          createAdminCsrfToken(
            sessionToken,
          ),
      }),
      response,
      next as NextFunction,
    );

    expect(next).toHaveBeenCalledOnce();
  });
});
