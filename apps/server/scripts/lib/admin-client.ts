/**
 * Minimal Vendure Admin API client shared by the maintenance scripts
 * (`seed.ts`, `seed-covers.ts`, `reindex.ts`).
 *
 * Two behaviours matter and are easy to get wrong:
 *
 *   1. Vendure **rotates the session token on every request** and returns the
 *      new value in the `vendure-auth-token` response header, so the token must
 *      be read from the response rather than the body.
 *   2. When posting `FormData` (asset uploads) the `Content-Type` header must be
 *      left unset, otherwise the multipart boundary is not generated and the
 *      request is rejected.
 */
const ADMIN_API_URL = process.env.VENDURE_ADMIN_API_URL ?? 'http://localhost:3000/admin-api';
const USERNAME = process.env.SUPERADMIN_USERNAME ?? 'superadmin';
const PASSWORD = process.env.SUPERADMIN_PASSWORD ?? 'superadmin';

const AUTH_TOKEN_HEADER = 'vendure-auth-token';

interface GraphQLResponseBody<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

let authToken: string | undefined;

export { ADMIN_API_URL };

export async function admin<T>(
  query: string,
  variables?: Record<string, unknown>,
  init?: { form?: FormData },
): Promise<T> {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  if (!init?.form) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(ADMIN_API_URL, {
    method: 'POST',
    headers,
    body: init?.form ? init.form : JSON.stringify({ query, variables }),
  });

  const rotated = response.headers.get(AUTH_TOKEN_HEADER);
  if (rotated) {
    authToken = rotated;
  }

  if (!response.ok) {
    throw new Error(`Admin API HTTP ${response.status}: ${await response.text()}`);
  }

  const body = (await response.json()) as GraphQLResponseBody<T>;
  if (body.errors?.length) {
    throw new Error(`GraphQL error: ${body.errors.map((e) => e.message).join('; ')}`);
  }
  if (!body.data) {
    throw new Error('Admin API returned no data');
  }
  return body.data;
}

export async function login(): Promise<void> {
  const data = await admin<{
    login: { __typename: string; identifier?: string; errorCode?: string; message?: string };
  }>(
    `
      mutation ScriptLogin($username: String!, $password: String!) {
        login(username: $username, password: $password) {
          __typename
          ... on CurrentUser {
            id
            identifier
          }
          ... on ErrorResult {
            errorCode
            message
          }
        }
      }
    `,
    { username: USERNAME, password: PASSWORD },
  );

  if (data.login.__typename !== 'CurrentUser') {
    throw new Error(
      `Login failed: ${data.login.errorCode ?? ''} ${data.login.message ?? ''}`.trim(),
    );
  }
  if (!authToken) {
    throw new Error(`Login succeeded but no "${AUTH_TOKEN_HEADER}" response header was returned`);
  }
  console.log(`✓ logged in as ${data.login.identifier}`);
}
