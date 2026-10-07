/**
 * Typed GraphQL client for the Vendure Shop API.
 *
 * Re-exported from the shared package so storefront code has a single import
 * path, mirroring `platform/vendure/graphql.ts` in the official
 * Vendure Next.js starter.
 *
 * The schema types are generated — see PROGRESS.md for the pipeline:
 *   apps/server graphql:schema  ->  shared-graphql-operations graphql:generate
 */
export { graphql, readFragment, maskFragments } from '@meghana/shared-graphql-operations';

export type {
  FragmentOf,
  ResultOf,
  VariablesOf,
  TadaDocumentNode,
} from '@meghana/shared-graphql-operations';
