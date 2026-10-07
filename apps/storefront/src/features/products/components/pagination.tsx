import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@meghana/shared-utils';
import { catalogHref, totalPages, type CatalogParams } from '../catalog-params';

export interface PaginationProps {
  params: CatalogParams;
  totalItems: number;
}

/** Pagination rendered as links, so paging works without JavaScript. */
export function Pagination({ params, totalItems }: PaginationProps) {
  const pages = totalPages(totalItems);
  if (pages <= 1) return null;

  const current = Math.min(params.page, pages);
  const numbers = Array.from({ length: pages }, (_, index) => index + 1);

  const base =
    'flex h-9 min-w-9 items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm transition-colors';
  const enabled = 'hover:border-primary hover:text-primary';

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      {current > 1 ? (
        <Link
          href={catalogHref(params, { page: current - 1 })}
          rel="prev"
          className={cn(base, enabled)}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Previous page</span>
        </Link>
      ) : (
        <span className={cn(base, 'cursor-not-allowed text-muted-foreground opacity-50')}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Previous page</span>
        </span>
      )}

      {numbers.map((page) =>
        page === current ? (
          <span
            key={page}
            aria-current="page"
            className={cn(base, 'border-primary bg-primary font-medium text-primary-foreground')}
          >
            {page}
          </span>
        ) : (
          <Link key={page} href={catalogHref(params, { page })} className={cn(base, enabled)}>
            {page}
          </Link>
        ),
      )}

      {current < pages ? (
        <Link
          href={catalogHref(params, { page: current + 1 })}
          rel="next"
          className={cn(base, enabled)}
        >
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Next page</span>
        </Link>
      ) : (
        <span className={cn(base, 'cursor-not-allowed text-muted-foreground opacity-50')}>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Next page</span>
        </span>
      )}
    </nav>
  );
}
