import { readFragment, type FragmentOf } from '@/lib/vendure/graphql';
import { ProductCardFragment } from '@/features/products/graphql';
import { isInStock } from '@/features/products/stock';
import { BookCard } from './book-card';

export interface ProductCardProps {
  product: FragmentOf<typeof ProductCardFragment>;
  priority?: boolean;
}

/**
 * Adapter that unmasks a `Product` fragment and hands plain values to
 * `BookCard`, which owns all the markup.
 *
 * `variants[0]` is used because every book in this catalogue has a single
 * variant. Note that `products` returns full entities, so `priceWithTax` is a
 * plain `Money` scalar here — unlike the `SinglePrice | PriceRange` union that
 * the `search` query returns.
 */
export function ProductCard({ product, priority = false }: ProductCardProps) {
  const book = readFragment(ProductCardFragment, product);
  const variant = book.variants[0];

  return (
    <BookCard
      title={book.name}
      slug={book.slug}
      imageUrl={book.featuredAsset?.preview ?? null}
      price={variant?.priceWithTax ?? 0}
      currencyCode={variant?.currencyCode ?? 'INR'}
      inStock={isInStock(variant?.stockLevel)}
      priority={priority}
    />
  );
}
