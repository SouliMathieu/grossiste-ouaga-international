const ADMIN_CSRF_STORAGE_KEY =
  'goi_admin_csrf';

const ADMIN_CSRF_HEADER =
  'X-CSRF-Token';

const SAFE_METHODS = new Set([
  'GET',
  'HEAD',
  'OPTIONS',
]);

function getCsrfToken() {
  try {
    return sessionStorage.getItem(
      ADMIN_CSRF_STORAGE_KEY,
    );
  } catch {
    return null;
  }
}

function setCsrfToken(
  token: string,
) {
  try {
    sessionStorage.setItem(
      ADMIN_CSRF_STORAGE_KEY,
      token,
    );
  } catch {
    // Le cookie de session reste la source
    // d'authentification côté serveur.
  }
}

function clearCsrfToken() {
  try {
    sessionStorage.removeItem(
      ADMIN_CSRF_STORAGE_KEY,
    );
  } catch {
    // Aucun traitement nécessaire.
  }
}

function getRequestUrl(
  input: RequestInfo | URL,
) {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function getRequestMethod(
  input: RequestInfo | URL,
  init: RequestInit,
) {
  if (init.method) {
    return init.method.toUpperCase();
  }

  if (input instanceof Request) {
    return input.method.toUpperCase();
  }

  return 'GET';
}

export async function adminFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const method =
    getRequestMethod(input, init);

  const headers = new Headers(
    input instanceof Request
      ? input.headers
      : undefined,
  );

  new Headers(
    init.headers,
  ).forEach((value, key) => {
    headers.set(key, value);
  });

  if (!SAFE_METHODS.has(method)) {
    const csrfToken =
      getCsrfToken();

    if (csrfToken) {
      headers.set(
        ADMIN_CSRF_HEADER,
        csrfToken,
      );
    }
  }

  const response = await fetch(
    input,
    {
      ...init,
      credentials:
        init.credentials ??
        'include',
      headers,
    },
  );

  const responseCsrfToken =
    response.headers.get(
      ADMIN_CSRF_HEADER,
    );

  if (responseCsrfToken) {
    setCsrfToken(
      responseCsrfToken,
    );
  }

  const url =
    getRequestUrl(input);

  if (
    response.status === 401 ||
    (
      response.ok &&
      url.includes(
        '/api/admin/auth/logout',
      )
    )
  ) {
    clearCsrfToken();
  }

  return response;
}
