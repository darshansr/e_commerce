/**
 * URL contract for the catalogue at `/books`.
 *
 * The URL is the single source of truth for catalogue state, so every view is
 * linkable, shareable and server-rendered:
 *
 *   /books?genre=1,2&language=6&sort=price-asc&page=2&q=palace
 *
 * `sort`, `page` and `q` are reserved. **Any other query parameter is treated as
 * a facet filter keyed by the facet `code`** (e.g. `genre`) holding a
 * comma-separated list of facet value ids — so adding a new facet in Vendure
 * needs no change here.
 *
 * Values within a single facet are OR'd together; different facets are AND'ed,
 * matching Vendure's `facetValueFilters` semantics.
 */
/**
 * Books per page. Kept below the seed catalogue size (12) so pagination is
 * actually exercised; the grid is 4 columns wide on desktop.
 */
export const PAGE_SIZE = 8;

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most relevant' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name-asc', label: 'Title: A to Z' },
  { value: 'name-desc', label: 'Title: Z to A' },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export const DEFAULT_SORT: SortValue = 'relevance';

export interface CatalogParams {
  term: string;
  /** facet code -> selected facet value ids, ascending by id */
  selected: Record<string, string[]>;
  sort: SortValue;
  page: number;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

const RESERVED = new Set(['sort', 'page', 'q']);

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isSortValue(value: string): value is SortValue {
  return SORT_OPTIONS.some((option) => option.value === value);
}

export function parseCatalogParams(raw: RawSearchParams): CatalogParams {
  const selected: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (RESERVED.has(key)) continue;

    const entries = Array.isArray(value) ? value : [value ?? ''];
    const ids = entries
      .flatMap((entry) => entry.split(','))
      .map((entry) => entry.trim())
      .filter((entry) => /^\d+$/.test(entry));

    if (ids.length > 0) {
      selected[key] = Array.from(new Set(ids)).sort((a, b) => Number(a) - Number(b));
    }
  }

  const sortParam = first(raw.sort);
  const pageParam = Number.parseInt(first(raw.page) ?? '1', 10);

  return {
    term: (first(raw.q) ?? '').trim(),
    selected,
    sort: sortParam && isSortValue(sortParam) ? sortParam : DEFAULT_SORT,
    page: Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1,
  };
}

export interface CatalogHrefOverrides {
  toggleFacetValue?: { facetCode: string; valueId: string };
  clearFacet?: string;
  clearAll?: boolean;
  sort?: SortValue;
  term?: string;
  page?: number;
}

/**
 * Builds a `/books` URL from the current state plus an override. Omitted values
 * keep the defaults out of the URL, so canonical URLs stay short.
 */
export function catalogHref(params: CatalogParams, overrides: CatalogHrefOverrides = {}): string {
  let selected: Record<string, string[]> = { ...params.selected };
  let sort = params.sort;
  let term = params.term;

  if (overrides.clearAll) {
    selected = {};
    sort = DEFAULT_SORT;
    term = '';
  }

  if (overrides.toggleFacetValue) {
    const { facetCode, valueId } = overrides.toggleFacetValue;
    const current = selected[facetCode] ?? [];
    const updated = current.includes(valueId)
      ? current.filter((id) => id !== valueId)
      : [...current, valueId].sort((a, b) => Number(a) - Number(b));

    selected = { ...selected };
    if (updated.length > 0) selected[facetCode] = updated;
    else delete selected[facetCode];
  }

  if (overrides.clearFacet) {
    selected = { ...selected };
    delete selected[overrides.clearFacet];
  }

  if (overrides.sort !== undefined) sort = overrides.sort;
  if (overrides.term !== undefined) term = overrides.term;

  // Any change other than paging invalidates the current page.
  const page = overrides.page ?? 1;

  const search = new URLSearchParams();
  if (term) search.set('q', term);
  for (const [code, ids] of Object.entries(selected)) {
    if (ids.length > 0) search.set(code, ids.join(','));
  }
  if (sort !== DEFAULT_SORT) search.set('sort', sort);
  if (page > 1) search.set('page', String(page));

  const query = search.toString();
  return query ? `/books?${query}` : '/books';
}

export function selectedCount(params: CatalogParams): number {
  return Object.values(params.selected).reduce((total, ids) => total + ids.length, 0);
}

export function totalPages(totalItems: number): number {
  return Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
}
