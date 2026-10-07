import type { Metadata } from 'next';
import Link from 'next/link';
import { X } from 'lucide-react';
import { query } from '@/lib/vendure/api';
import { readFragment } from '@/lib/vendure/graphql';
import {
  GetCatalogFacetsQuery,
  SearchCatalogQuery,
  SearchResultCardFragment,
} from '@/features/products/graphql';
import {
  DEFAULT_SORT,
  PAGE_SIZE,
  catalogHref,
  parseCatalogParams,
  selectedCount,
  totalPages,
  type CatalogParams,
  type RawSearchParams,
} from '@/features/products/catalog-params';
import { BookCard } from '@/features/products/components/book-card';
import { FacetSidebar } from '@/features/products/components/facet-sidebar';
import { Pagination } from '@/features/products/components/pagination';
import { SortSelect } from '@/features/products/components/sort-select';

export const metadata: Metadata = {
  title: 'All Books',
  description: 'Browse the full Meghana Book House catalogue.',
  alternates: { canonical: '/books' },
};

/** Maps the UI sort value onto Vendure's `SearchResultSortParameter`. */
function sortInput(sort: CatalogParams['sort']) {
  switch (sort) {
    case 'price-asc':
      return { price: 'ASC' as const };
    case 'price-desc':
      return { price: 'DESC' as const };
    case 'name-asc':
      return { name: 'ASC' as const };
    case 'name-desc':
      return { name: 'DESC' as const };
    default:
      return undefined;
  }
}

/**
 * Two queries, deliberately:
 *
 *  - `search` returns the page of results *and* facet counts — but those counts
 *    only describe the filtered set, so selecting one genre hides every other.
 *  - `facets` returns the complete, unfiltered list that keeps the sidebar
 *    stable. The counts are merged onto it by id.
 *
 * `search` is the only way to filter by facet or sort by price; the `products`
 * query supports neither.
 */
async function loadCatalog(params: CatalogParams) {
  const facetGroups = Object.values(params.selected).filter((ids) => ids.length > 0);

  const [catalog, facetList] = await Promise.all([
    query(
      SearchCatalogQuery,
      {
        input: {
          groupByProduct: true,
          take: PAGE_SIZE,
          skip: (params.page - 1) * PAGE_SIZE,
          term: params.term || undefined,
          sort: sortInput(params.sort),
          facetValueFilters:
            facetGroups.length > 0 ? facetGroups.map((ids) => ({ or: ids })) : undefined,
        },
      },
      { revalidate: 60, tags: ['products'] },
    ),
    query(GetCatalogFacetsQuery, {}, { revalidate: 300, tags: ['facets'] }),
  ]);

  return {
    items: catalog.data.search.items.map((item) =>
      readFragment(SearchResultCardFragment, item),
    ),
    totalItems: catalog.data.search.totalItems,
    counts: new Map(
      catalog.data.search.facetValues.map((entry) => [entry.facetValue.id, entry.count]),
    ),
    facets: facetList.data.facets.items,
  };
}

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = parseCatalogParams(await searchParams);

  let catalog: Awaited<ReturnType<typeof loadCatalog>> | null = null;

  try {
    catalog = await loadCatalog(params);
  } catch (error) {
    console.warn(
      '[storefront] Unable to load the catalogue:',
      error instanceof Error ? error.message : error,
    );
  }

  if (!catalog) {
    return (
      <div className="container-custom py-10 md:py-14">
        <PageHeader totalItems={null} term={params.term} />
        <Notice>
          The catalogue is unavailable right now. Make sure the Vendure server is running.
        </Notice>
      </div>
    );
  }

  const { items, totalItems, counts, facets } = catalog;
  const activeCount = selectedCount(params);

  // Lets the active-filter chips show names without a third request.
  const facetValueIndex = new Map(
    facets.flatMap((facet) =>
      facet.values.map(
        (value) =>
          [value.id, { name: value.name, facetName: facet.name }] as const,
      ),
    ),
  );

  return (
    <div className="container-custom py-10 md:py-14">
      <PageHeader totalItems={totalItems} term={params.term} />

      <form action="/books" method="get" role="search" className="mb-8 flex max-w-md gap-2">
        <input
          type="search"
          name="q"
          defaultValue={params.term}
          placeholder="Search titles, authors…"
          aria-label="Search books"
          className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
        />
        {/* Preserve the current facets when searching. */}
        {Object.entries(params.selected).map(([code, ids]) => (
          <input key={code} type="hidden" name={code} value={ids.join(',')} />
        ))}
        {params.sort !== DEFAULT_SORT && (
          <input type="hidden" name="sort" value={params.sort} />
        )}
        <button
          type="submit"
          className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Search
        </button>
      </form>

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        <div className="mb-8 lg:mb-0">
          <FacetSidebar params={params} facets={facets} counts={counts} />
        </div>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(params.selected).flatMap(([code, ids]) =>
                ids.map((id) => (
                  <Link
                    key={`${code}-${id}`}
                    href={catalogHref(params, {
                      toggleFacetValue: { facetCode: code, valueId: id },
                    })}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs text-foreground transition-colors hover:border-primary"
                  >
                    {facetValueIndex.get(id)?.name ?? `#${id}`}
                    <X className="h-3 w-3" aria-hidden="true" />
                    <span className="sr-only">Remove filter</span>
                  </Link>
                )),
              )}
              {activeCount === 0 && (
                <span className="text-sm text-muted-foreground">
                  {totalItems === 0
                    ? 'No titles match your search.'
                    : 'Showing the full catalogue.'}
                </span>
              )}
            </div>

            <SortSelect params={params} />
          </div>

          {items.length === 0 ? (
            <Notice>
              {params.term
                ? `No books match “${params.term}”.`
                : 'No books match these filters.'}{' '}
              <Link href="/books" className="font-medium text-primary hover:underline">
                Clear filters
              </Link>
            </Notice>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:gap-6">
              {items.map((item, index) => (
                <BookCard
                  key={item.productId}
                  title={item.productName}
                  slug={item.slug}
                  imageUrl={item.productAsset?.preview ?? null}
                  price={
                    item.priceWithTax.__typename === 'SinglePrice'
                      ? item.priceWithTax.value
                      : item.priceWithTax.min
                  }
                  currencyCode={item.currencyCode}
                  inStock={item.inStock}
                  priority={index < 4}
                />
              ))}
            </div>
          )}

          <Pagination params={params} totalItems={totalItems} />
        </div>
      </div>
    </div>
  );
}

function PageHeader({ totalItems, term }: { totalItems: number | null; term: string }) {
  return (
    <header className="mb-8">
      <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">All books</h1>
      <p className="mt-2 text-muted-foreground">
        {totalItems === null
          ? 'Catalogue unavailable.'
          : `${totalItems} title${totalItems === 1 ? '' : 's'}`}
        {term && totalItems !== null && <> matching “{term}”</>}
      </p>
    </header>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
