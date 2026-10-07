import { print } from 'graphql';
import type { TadaDocumentNode } from '@meghana/shared-graphql-operations';

/**
 * Browser-side Vendure Shop API client.
 *
 * Requests go to the **same-origin** `/shop-api`, which `next.config.js` rewrites
 * to the Vendure server. That matters: the session lives in a cookie, and a
 * cross-origin call from :3001 to :3000 would not send a `SameSite=Lax` cookie,
 * so the cart and the checkout session would not be found.
 *
 * Module is for client components only — it must not be imported into a server
 * component, which should use `@/lib/vendure/api` instead.
 */
const SHOP_API_URL = process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL ?? '/shop-api';

interface ShopResponseBody<TData> {
  data?: TData;
  errors?: Array<{ message: string }>;
}

export async function shopRequest<TResult, TVariables>(
  document: TadaDocumentNode<TResult, TVariables>,
  variables: TVariables,
): Promise<TResult> {
  const response = await fetch(SHOP_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ query: print(document), variables: variables ?? {} }),
  });

  if (!response.ok) {
    throw new Error(`Shop API request failed (HTTP ${response.status})`);
  }

  const body = (await response.json()) as ShopResponseBody<TResult>;

  if (body.errors?.length) {
    throw new Error(body.errors.map((e) => e.message).join('; '));
  }
  if (!body.data) {
    throw new Error('Shop API request returned no data');
  }
  return body.data;
}

/**
 * Narrows a mutation payload that is `Order | <specific error results>`.
 *
 * Vendure returns business failures as union members with a 200 response, so
 * they have to be unwrapped rather than caught.
 */
export function unwrapOrder<
  T extends { __typename: string; message?: string; errorCode?: string },
>(payload: T, fallback = 'The operation could not be completed'): Extract<T, { __typename: 'Order' }> {
  if (payload.__typename !== 'Order') {
    throw new Error(payload.message ?? payload.errorCode ?? fallback);
  }
  return payload as Extract<T, { __typename: 'Order' }>;
}
