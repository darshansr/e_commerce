/**
 * Typed GraphQL client for the Vendure **Shop API**.
 *
 * The schema types are generated, never hand-written:
 *
 *   apps/server graphql:schema  ->  apps/server/src/schema-{shop,admin}.graphql
 *   graphql:generate            ->  src/gql.tada{,.admin}.ts
 *
 * Kept in its own module so `cart.ts` can use `graphql` without a circular
 * import back through `index.ts`.
 */
import { initGraphQLTada } from 'gql.tada';
import type { introspection } from './gql.tada';

export const graphql = initGraphQLTada<{
  introspection: typeof introspection;
  scalars: {
    DateTime: string;
    JSON: Record<string, unknown>;
    Money: number;
  };
}>();

export type {
  FragmentOf,
  ResultOf,
  VariablesOf,
  TadaDocumentNode,
  DocumentDecoration,
} from 'gql.tada';

export { readFragment, maskFragments } from 'gql.tada';
