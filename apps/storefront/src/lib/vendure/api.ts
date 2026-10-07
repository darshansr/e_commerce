import { print } from 'graphql';
import type { TadaDocumentNode } from 'gql.tada';

/**
 * Server-side Vendure Shop API client.
 *
 * Modelled on `platform/vendure/api.ts` from the official
 * Vendure Next.js starter, adapted to this monorepo.
 */

const SHOP_API_URL =
  process.env.VENDURE_SHOP_API_URL ??
  process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL ??
  'http://localhost:3000/shop-api';

const DEFAULT_CHANNEL_TOKEN = '__default_channel__';

const CHANNEL_TOKEN_HEADER = process.env.VENDURE_CHANNEL_TOKEN_HEADER ?? 'vendure-token';
const AUTH_TOKEN_HEADER = process.env.VENDURE_AUTH_TOKEN_HEADER ?? 'vendure-auth-token';

export interface VendureRequestOptions {
  /** Explicit channel token; defaults to the `__default_channel__` channel. */
  channelToken?: string;
  languageCode?: string;
  currencyCode?: string;
  /** Bearer token for authenticated requests. */
  token?: string;
  /** Next.js cache tags, for granular `revalidateTag` invalidation. */
  tags?: string[];
  /** Next.js revalidation window in seconds. */
  revalidate?: number;
}

export interface VendureResult<T> {
  data: T;
  /** New auth token if the server rotated it (Vendure sends this on login). */
  token?: string;
}

interface VendureResponseBody<T> {
  data?: T;
  errors?: Array<{ message: string; [key: string]: unknown }>;
}

export async function query<TResult, TVariables>(
  document: TadaDocumentNode<TResult, TVariables>,
  variables: TVariables,
  options: VendureRequestOptions = {},
): Promise<VendureResult<TResult>> {
  const url = new URL(SHOP_API_URL);
  if (options.languageCode) {
    url.searchParams.set('languageCode', options.languageCode);
  }
  if (options.currencyCode) {
    url.searchParams.set('currencyCode', options.currencyCode);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    [CHANNEL_TOKEN_HEADER]: options.channelToken ?? DEFAULT_CHANNEL_TOKEN,
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const init: RequestInit & { next?: { tags?: string[]; revalidate?: number } } = {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: print(document), variables: variables ?? {} }),
  };
  if (options.tags || options.revalidate !== undefined) {
    init.next = { tags: options.tags, revalidate: options.revalidate };
  }

  const response = await fetch(url.toString(), init);

  if (!response.ok) {
    throw new Error(`Vendure Shop API responded HTTP ${response.status} (${url.pathname})`);
  }

  const body = (await response.json()) as VendureResponseBody<TResult>;

  if (body.errors?.length) {
    throw new Error(`Vendure GraphQL error: ${body.errors.map((e) => e.message).join('; ')}`);
  }
  if (!body.data) {
    throw new Error('Vendure Shop API returned no data');
  }

  const rotatedToken = response.headers.get(AUTH_TOKEN_HEADER);

  return {
    data: body.data,
    ...(rotatedToken ? { token: rotatedToken } : {}),
  };
}
