import Link from 'next/link';
import { query } from '@/lib/vendure/api';
import { readFragment } from '@/lib/vendure/graphql';
import { GetFeaturedProductsQuery, ProductCardFragment } from './graphql';
import { ProductCard } from './components/product-card';

const FEATURED_COUNT = 8;

async function fetchFeaturedProducts() {
  const result = await query(
    GetFeaturedProductsQuery,
    { options: { take: FEATURED_COUNT } },
    { revalidate: 60, tags: ['products'] },
  );
  return result.data.products.items;
}

/**
 * Server Component: fetches on the server and streams into the page.
 *
 * Deliberately resilient — if the Vendure server is not reachable (for example
 * during a CI build with no backend running) this renders an explanatory state
 * rather than failing the whole build.
 */
export async function FeaturedProducts() {
  let products: Awaited<ReturnType<typeof fetchFeaturedProducts>>;

  try {
    products = await fetchFeaturedProducts();
  } catch (error) {
    console.warn(
      '[storefront] Unable to load featured products:',
      error instanceof Error ? error.message : error,
    );
    return (
      <Section>
        <Notice>
          The book catalogue is unavailable right now. Make sure the Vendure server is running
          (<code className="text-xs">pnpm --filter @meghana/server dev</code>).
        </Notice>
      </Section>
    );
  }

  if (products.length === 0) {
    return (
      <Section>
        <Notice>
          No books have been added yet — the catalogue is empty. Seed some products in Vendure and
          they will appear here.
        </Notice>
      </Section>
    );
  }

  return (
    <Section>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {products.map((product, index) => (
          <ProductCard
            key={readFragment(ProductCardFragment, product).id}
            product={product}
            priority={index < 4}
          />
        ))}
      </div>
    </Section>
  );
}

export function FeaturedProductsSkeleton() {
  return (
    <Section>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
        {Array.from({ length: FEATURED_COUNT }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="aspect-[3/4] animate-pulse bg-muted" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
              <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section id="featured" className="container-custom py-16 md:py-20">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
            Featured books
          </h2>
          <p className="mt-2 text-muted-foreground">
            Hand-picked titles from across the shelves.
          </p>
        </div>
        <Link
          href="/books"
          className="hidden shrink-0 text-sm font-medium text-primary hover:underline sm:block"
        >
          View all books →
        </Link>
      </div>
      {children}
    </section>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}
