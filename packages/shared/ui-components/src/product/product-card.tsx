'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn, formatCurrency } from '@meghana/shared-utils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import type { Product, ProductVariant, Asset } from '@meghana/shared-types';

interface ProductCardProps {
  product: Product;
  variant?: ProductVariant;
  showAddToCart?: boolean;
  onAddToCart?: (variantId: string, quantity: number) => void;
  className?: string;
  priority?: boolean;
}

export function ProductCard({
  product,
  variant,
  showAddToCart = true,
  onAddToCart,
  className,
  priority = false,
}: ProductCardProps) {
  const displayVariant = variant || product.variants[0];
  const price = displayVariant?.priceWithTax || 0;
  const currency = displayVariant?.currencyCode || 'INR';
  const image = product.featuredAsset || displayVariant?.featuredAsset || product.assets[0] || displayVariant?.assets[0];
  const isOutOfStock = displayVariant?.stockLevel === 0 && displayVariant?.trackInventory;

  return (
    <article className={cn('group relative flex flex-col bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200', className)}>
      {/* Product Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {image ? (
          <Image
            src={image.preview}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.customFields?.isbn13 && (
            <Badge variant="outline" className="text-xs">
              ISBN
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="destructive" className="text-xs">
              Out of Stock
            </Badge>
          )}
          {displayVariant?.customFields?.condition && displayVariant.customFields.condition !== 'NEW' && (
            <Badge variant="secondary" className="text-xs capitalize">
              {displayVariant.customFields.condition.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white transition-colors"
            aria-label="Add to wishlist"
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          <button
            className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white transition-colors"
            aria-label="Quick view"
          >
            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category/Subject */}
        {product.customFields?.subject && (
          <span className="mb-1 text-xs text-gray-500 uppercase tracking-wide">
            {product.customFields.subject.name}
          </span>
        )}

        {/* Title */}
        <h3 className="mb-2 font-medium text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
          <a href={`/products/${product.slug}`}>
            {product.name}
          </a>
        </h3>

        {/* Author */}
        {product.customFields?.author && (
          <p className="mb-2 text-sm text-gray-500 line-clamp-1">
            by {product.customFields.author}
          </p>
        )}

        {/* Series */}
        {product.customFields?.series && (
          <p className="mb-2 text-sm text-primary font-medium">
            {product.customFields.series.name}
          </p>
        )}

        {/* Price & Stock */}
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(price, currency)}
            </span>
            {displayVariant?.priceWithTax && displayVariant.priceWithTax !== displayVariant.price && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(displayVariant.price, currency)}
              </span>
            )}
          </div>

          {/* Stock Indicator */}
          {displayVariant?.trackInventory && (
            <div className="flex items-center gap-1 text-sm">
              {displayVariant.stockLevel > 0 ? (
                <>
                  <span className={cn(
                    'inline-flex h-2 w-2 rounded-full',
                    displayVariant.stockLevel > 10 ? 'bg-green-500' : 'bg-yellow-500'
                  )} />
                  <span className={cn(
                    displayVariant.stockLevel > 10 ? 'text-green-600' : 'text-yellow-600'
                  )}>
                    {displayVariant.stockLevel > 10 ? 'In Stock' : `Only ${displayVariant.stockLevel} left`}
                  </span>
                </>
              ) : (
                <span className="text-red-600">Out of Stock</span>
              )}
            </div>
          )}

          {/* Add to Cart */}
          {showAddToCart && !isOutOfStock && onAddToCart && (
            <Button
              className="w-full"
              size="sm"
              onClick={() => onAddToCart(displayVariant!.id, 1)}
            >
              Add to Cart
            </Button>
          )}

          {showAddToCart && isOutOfStock && (
            <Button
              className="w-full"
              size="sm"
              variant="outline"
              disabled
            >
              Out of Stock
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  onAddToCart,
  className,
  columns = { base: 1, sm: 2, lg: 3, xl: 4 },
}: {
  products: Product[];
  onAddToCart?: (variantId: string, quantity: number) => void;
  className?: string;
  columns?: Record<string, number>;
}) {
  return (
    <div
      className={cn(
        'grid gap-6',
        'grid-cols-1',
        'sm:grid-cols-2',
        'lg:grid-cols-3',
        'xl:grid-cols-4',
        className
      )}
      role="list"
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          priority={products.indexOf(product) < 4}
        />
      ))}
    </div>
  );
}