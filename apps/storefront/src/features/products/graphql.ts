import { graphql } from '@/lib/vendure/graphql';

/**
 * Card-level book fields.
 *
 * NOTE: `products` returns full `Product` entities, so `variants[].priceWithTax`
 * is a plain `Money` (Int) scalar in minor units — not the
 * `SinglePrice | PriceRange` union returned by the `search` query.
 */
export const ProductCardFragment = graphql(`
  fragment ProductCard on Product {
    id
    name
    slug
    featuredAsset {
      id
      preview
    }
    variants {
      id
      sku
      priceWithTax
      currencyCode
      stockLevel
    }
  }
`);

export const GetFeaturedProductsQuery = graphql(
  `
    query GetFeaturedProducts($options: ProductListOptions) {
      products(options: $options) {
        totalItems
        items {
          ...ProductCard
        }
      }
    }
  `,
  [ProductCardFragment],
);

/**
 * Product detail.
 *
 * Deliberately does not use a fragment, so the result is unmasked and can be
 * consumed directly by the page.
 *
 * Note `variants[].stockLevel` is a `String!` in the Shop API, and
 * `trackInventory` does not exist on `ProductVariant` here at all.
 */
export const GetProductDetailQuery = graphql(`
  query GetProductDetail($slug: String!) {
    product(slug: $slug) {
      id
      name
      slug
      description
      featuredAsset {
        id
        preview
      }
      facetValues {
        id
        name
        facet {
          id
          code
          name
        }
      }
      variants {
        id
        sku
        name
        priceWithTax
        currencyCode
        stockLevel
      }
    }
  }
`);

/**
 * Card-level fields for a catalogue search hit.
 *
 * The `search` query is the only way to filter by facet or sort by price:
 * `ProductFilterParameter` has no facet field, and `ProductSortParameter` has no
 * `price`. It requires `DefaultSearchPlugin` on the server, plus a reindex —
 * see `apps/server/src/vendure-config.ts` and the `search:reindex` script.
 *
 * NOTE: `priceWithTax` here is the `SinglePrice | PriceRange` union, unlike the
 * plain `Money` returned by `products`.
 */
export const SearchResultCardFragment = graphql(`
  fragment SearchResultCard on SearchResult {
    productId
    productName
    slug
    sku
    inStock
    currencyCode
    facetValueIds
    productAsset {
      id
      preview
    }
    priceWithTax {
      __typename
      ... on SinglePrice {
        value
      }
      ... on PriceRange {
        min
        max
      }
    }
  }
`);

export const SearchCatalogQuery = graphql(
  `
    query SearchCatalog($input: SearchInput!) {
      search(input: $input) {
        totalItems
        items {
          ...SearchResultCard
        }
        facetValues {
          count
          facetValue {
            id
          }
        }
      }
    }
  `,
  [SearchResultCardFragment],
);

/**
 * Every facet and facet value, for the filter sidebar.
 *
 * Deliberately separate from `SearchCatalogQuery`: the `facetValues` returned by
 * `search` only describe the *filtered* result set, so selecting one genre makes
 * every other genre vanish from the sidebar. This keeps the sidebar stable, and
 * the counts are merged in from the search response.
 */
export const GetCatalogFacetsQuery = graphql(`
  query GetCatalogFacets {
    facets {
      items {
        id
        code
        name
        values {
          id
          code
          name
        }
      }
    }
  }
`);
