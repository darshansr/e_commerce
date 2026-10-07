import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency } from '@meghana/shared-utils';

/**
 * Presentational book card.
 *
 * Takes plain values rather than a GraphQL fragment so the same markup can
 * render both a `Product` (home page, related books) and a `SearchResult`
 * (catalogue search) without knowing about either type. `ProductCard` is the
 * fragment adapter.
 */
export interface BookCardProps {
  title: string;
  slug: string;
  imageUrl: string | null;
  price: number;
  currencyCode: string;
  inStock: boolean;
  priority?: boolean;
}

export function BookCard({
  title,
  slug,
  imageUrl,
  price,
  currencyCode,
  inStock,
  priority = false,
}: BookCardProps) {
  const href = `/books/${slug}`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
      <Link href={href} className="relative block aspect-[3/4] overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <svg
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
        )}

        {!inStock && (
          <span className="absolute left-2 top-2 rounded-full bg-destructive px-2.5 py-1 text-xs font-medium text-destructive-foreground">
            Out of stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          <Link href={href} className="hover:text-primary">
            {title}
          </Link>
        </h3>

        <p className="mt-auto text-base font-bold text-foreground">
          {formatCurrency(price, currencyCode)}
        </p>
      </div>
    </article>
  );
}
