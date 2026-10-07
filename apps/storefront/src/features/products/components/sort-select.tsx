'use client';

import { useRouter } from 'next/navigation';
import { SORT_OPTIONS, catalogHref, type CatalogParams, type SortValue } from '../catalog-params';

/**
 * Sort control.
 *
 * The only interactive control on the catalogue: it needs `useRouter` to push a
 * new URL, whereas faceting and paging are plain links.
 */
export function SortSelect({ params }: { params: CatalogParams }) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Sort by</span>
      <select
        value={params.sort}
        onChange={(event) => {
          router.push(catalogHref(params, { sort: event.target.value as SortValue }));
        }}
        className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground focus:border-primary focus:outline-none"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
