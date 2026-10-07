import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Truck, RotateCcw, ShieldCheck, Package } from 'lucide-react';
import { formatCurrency } from '@meghana/shared-utils';
import { query } from '@/lib/vendure/api';
import { readFragment } from '@/lib/vendure/graphql';
import {
  GetFeaturedProductsQuery,
  GetProductDetailQuery,
  ProductCardFragment,
} from '@/features/products/graphql';
import { ProductCard } from '@/features/products/components/product-card';
import { AddToCart } from '@/features/products/components/add-to-cart';
import { isInStock, stockQuantity } from '@/features/products/stock';

const RELATED_COUNT = 4;

async function getProduct(slug: string) {
  const result = await query(
    GetProductDetailQuery,
    { slug },
    { revalidate: 60, tags: ['products'] },
  );
  return result.data.product;
}

async function getRelated(excludeSlug: string) {
  const result = await query(
    GetFeaturedProductsQuery,
    { options: { take: RELATED_COUNT + 1 } },
    { revalidate: 60, tags: ['products'] },
  );
  return result.data.products.items
    .filter((item) => readFragment(ProductCardFragment, item).slug !== excludeSlug)
    .slice(0, RELATED_COUNT);
}

/** Pre-render every seeded book; fall back to on-demand if the API is down. */
export async function generateStaticParams() {
  try {
    const result = await query(
      GetFeaturedProductsQuery,
      { options: { take: 500 } },
      { revalidate: 60, tags: ['products'] },
    );
    return result.data.products.items.map((item) => ({
      slug: readFragment(ProductCardFragment, item).slug,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await getProduct(slug);
    if (!product) {
      return { title: 'Book not found' };
    }

    const description = product.description.slice(0, 160);
    return {
      title: product.name,
      description,
      alternates: { canonical: `/books/${product.slug}` },
      openGraph: {
        title: product.name,
        description,
        ...(product.featuredAsset ? { images: [{ url: product.featuredAsset.preview }] } : {}),
      },
    };
  } catch {
    return { title: 'Book' };
  }
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product: Awaited<ReturnType<typeof getProduct>> = null;
  let unavailable = false;

  try {
    product = await getProduct(slug);
  } catch (error) {
    unavailable = true;
    console.warn(
      '[storefront] Unable to load product:',
      error instanceof Error ? error.message : error,
    );
  }

  // A genuine miss is a 404; a backend failure is a recoverable state.
  if (!unavailable && !product) {
    notFound();
  }

  if (unavailable || !product) {
    return (
      <div className="container-custom py-16">
        <div className="rounded-lg border border-dashed border-border bg-muted/40 p-10 text-center text-sm text-muted-foreground">
          This book could not be loaded right now. Make sure the Vendure server is running.
        </div>
      </div>
    );
  }

  const variant = product.variants[0];
  const inStock = isInStock(variant?.stockLevel);
  const quantity = stockQuantity(variant?.stockLevel);
  const price = variant?.priceWithTax ?? 0;
  const currency = variant?.currencyCode ?? 'INR';

  const genre = product.facetValues.find((fv) => fv.facet.code === 'genre')?.name;
  const language = product.facetValues.find((fv) => fv.facet.code === 'language')?.name;

  const related = await getRelated(product.slug).catch(() => []);

  return (
    <div className="container-custom py-8 md:py-12">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <Link href="/books" className="hover:text-foreground">
          Books
        </Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="truncate font-medium text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-xl border border-border bg-muted">
          {product.featuredAsset ? (
            <Image
              src={product.featuredAsset.preview}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 480px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Package className="h-12 w-12" aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-2">
            {genre && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {genre}
              </span>
            )}
            {language && (
              <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                {language}
              </span>
            )}
          </div>

          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight md:text-4xl">
            {product.name}
          </h1>

          {variant?.sku && (
            <p className="mt-2 text-xs text-muted-foreground">SKU {variant.sku}</p>
          )}

          <p className="mt-5 text-3xl font-bold">{formatCurrency(price, currency)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>

          <p className="mt-3 text-sm">
            {!inStock ? (
              <span className="font-medium text-destructive">Out of stock</span>
            ) : quantity !== null && quantity <= 5 ? (
              <span className="font-medium text-amber-600">Only {quantity} left in stock</span>
            ) : (
              <span className="font-medium text-green-700">In stock</span>
            )}
          </p>

          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          {variant && (
            <div className="mt-8">
              <AddToCart variantId={variant.id} inStock={inStock} />
            </div>
          )}

          <ul className="mt-8 grid gap-3 border-t border-border pt-6 text-sm sm:grid-cols-2">
            <li className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Free delivery over ₹499
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <RotateCcw className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              7-day replacement
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Secure checkout
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              In-store pickup available
            </li>
          </ul>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-border pt-10 md:mt-20">
          <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            More from the shelves
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {related.map((item) => (
              <ProductCard key={readFragment(ProductCardFragment, item).id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
