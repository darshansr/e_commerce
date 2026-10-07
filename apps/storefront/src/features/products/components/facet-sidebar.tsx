import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@meghana/shared-utils';
import { catalogHref, selectedCount, type CatalogParams } from '../catalog-params';

export interface FacetSidebarFacet {
  id: string;
  code: string;
  name: string;
  values: Array<{ id: string; name: string }>;
}

export interface FacetSidebarProps {
  params: CatalogParams;
  facets: FacetSidebarFacet[];
  /** facet value id -> matching book count in the current result set */
  counts: Map<string, number>;
}

/**
 * Facet filters rendered as plain links, so filtering works without JavaScript
 * and every filtered view is linkable and crawlable.
 *
 * Counts come from the search response, which only describes the *filtered*
 * result set. Values missing from it are therefore shown as 0 rather than being
 * hidden — otherwise picking one genre would remove every other genre from the
 * sidebar and make it impossible to switch.
 */
export function FacetSidebar({ params, facets, counts }: FacetSidebarProps) {
  const usable = facets.filter((facet) => facet.values.length > 0);
  if (usable.length === 0) return null;

  const activeCount = selectedCount(params);

  return (
    <aside aria-label="Filter books" className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Filters
        </h2>
        {activeCount > 0 && (
          <Link
            href={catalogHref(params, { clearAll: true })}
            className="text-xs font-medium text-primary hover:underline"
          >
            Clear all
          </Link>
        )}
      </div>

      {usable.map((facet) => {
        const active = params.selected[facet.code] ?? [];

        return (
          <fieldset key={facet.id} className="border-t border-border pt-4">
            <legend className="text-sm font-semibold text-foreground">{facet.name}</legend>
            <ul className="mt-3 space-y-2">
              {facet.values.map((value) => {
                const isActive = active.includes(value.id);
                const count = counts.get(value.id) ?? 0;

                return (
                  <li key={value.id}>
                    <Link
                      href={catalogHref(params, {
                        toggleFacetValue: { facetCode: facet.code, valueId: value.id },
                      })}
                      aria-pressed={isActive}
                      className="flex items-center gap-2.5 text-sm text-foreground/90 hover:text-primary"
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                          isActive
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-input bg-background',
                        )}
                      >
                        {isActive && <Check className="h-3 w-3" aria-hidden="true" />}
                      </span>
                      <span className="flex-1">{value.name}</span>
                      <span className="tabular-nums text-xs text-muted-foreground">{count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        );
      })}
    </aside>
  );
}
