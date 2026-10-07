/**
 * Shared GraphQL layer for the Vendure Shop API.
 *
 * - `./client` — the typed `graphql` client and gql.tada helpers
 * - `./cart`   — cart operations plus the cart types derived from them
 *
 * Entity types are derived from the schema rather than hand-written. See
 * `./cart.ts` for why that distinction matters.
 */
export * from './client';
export * from './cart';
export * from './checkout';

