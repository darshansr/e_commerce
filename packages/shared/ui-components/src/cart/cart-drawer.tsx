'use client';

import * as React from 'react';
import Link from 'next/link';
import { Minus, Plus, Trash2, Tag, Truck, X, ShoppingBag } from 'lucide-react';
import { cn, formatCurrency } from '@meghana/shared-utils';
import { readCartLines, type Cart, type CartLine } from '@meghana/shared-graphql-operations';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

/**
 * Cart drawer.
 *
 * Data comes from the schema-derived `Cart` type (see
 * `@meghana/shared-graphql-operations/cart`), not from hand-written types.
 * Two API details are worth knowing:
 *   - an `OrderLine` has no `product` field; the product is reached via
 *     `line.productVariant.product`
 *   - applied coupons are `Order.couponCodes: [String!]!`, not `coupons`
 */
export interface CartDrawerProps {
  cart: Cart | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateQuantity: (orderLineId: string, quantity: number) => Promise<unknown> | void;
  onRemoveItem: (orderLineId: string) => Promise<unknown> | void;
  onApplyCoupon: (code: string) => Promise<unknown> | void;
  onRemoveCoupon: (code: string) => Promise<unknown> | void;
  isLoading?: boolean;
  /** Last cart error, e.g. an invalid coupon. Reported through state, not a throw. */
  error?: string | null;
}

/**
 * Cart methods reject so callers such as `AddToCart` can react to failures. The
 * drawer reports them through the `error` prop instead, so the rejection still
 * has to be handled here — otherwise it surfaces as an unhandled rejection.
 */
function settle(result: Promise<unknown> | void) {
  if (result instanceof Promise) void result.catch(() => {});
}

export function CartDrawer({
  cart,
  isOpen,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onApplyCoupon,
  onRemoveCoupon,
  isLoading = false,
  error,
}: CartDrawerProps) {
  const [couponCode, setCouponCode] = React.useState('');

  if (!isOpen) return null;

  // Lines arrive as masked fragment references — resolve them to real data.
  const lines = readCartLines(cart?.lines ?? []);
  const couponCodes = cart?.couponCodes ?? [];
  const discounts = cart?.discounts ?? [];
  const currency = cart?.currencyCode ?? 'INR';
  const subtotal = cart?.subTotalWithTax ?? 0;
  const shipping = cart?.shippingWithTax ?? 0;
  const total = cart?.totalWithTax ?? 0;

  const applyCoupon = () => {
    const code = couponCode.trim();
    if (!code) return;
    settle(onApplyCoupon(code));
    setCouponCode('');
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" />

      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            Shopping Cart
            {cart && cart.totalQuantity > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({cart.totalQuantity})
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {lines.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
              <ShoppingBag className="mb-4 h-14 w-14 text-gray-300" aria-hidden="true" />
              <p className="text-center">Your cart is empty</p>
              <Button variant="ghost" className="mt-4" onClick={onClose} asChild>
                <Link href="/books">Browse books</Link>
              </Button>
            </div>
          ) : (
            <>
              {lines.map((line) => (
                <CartItemRow
                  key={line.id}
                  line={line}
                  currency={currency}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemoveItem={onRemoveItem}
                />
              ))}

              <div className="border-t pt-4">
                <h3 className="mb-3 text-sm font-medium">Promo code</h3>

                {couponCodes.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {couponCodes.map((code) => (
                      <span
                        key={code}
                        className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs text-green-700"
                      >
                        {code}
                        <button
                          onClick={() => settle(onRemoveCoupon(code))}
                          className="hover:text-green-900"
                          aria-label={`Remove coupon ${code}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Promo code"
                    onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                    aria-label="Promo code"
                  />
                  <Button size="sm" onClick={applyCoupon} disabled={!couponCode.trim()}>
                    Apply
                  </Button>
                </div>
              </div>

              {discounts.length > 0 && (
                <div className="space-y-1 text-sm text-green-600">
                  {discounts.map((discount, index) => (
                    <div key={`${discount.description}-${index}`} className="flex justify-between">
                      <span>{discount.description}</span>
                      <span>-{formatCurrency(discount.amountWithTax, currency)}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-3 border-t p-4">
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal, currency)}</span>
          </div>

          {shipping > 0 && (
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-1">
                <Truck className="h-4 w-4" aria-hidden="true" />
                Shipping
              </span>
              <span>{formatCurrency(shipping, currency)}</span>
            </div>
          )}

          {discounts.length > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center gap-1">
                <Tag className="h-4 w-4" aria-hidden="true" />
                Discounts
              </span>
              <span>
                -{formatCurrency(
                  discounts.reduce((sum, d) => sum + d.amountWithTax, 0),
                  currency,
                )}
              </span>
            </div>
          )}

          <div className="flex justify-between border-t pt-3 text-lg font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total, currency)}</span>
          </div>

          {lines.length === 0 ? (
            <Button className="w-full" size="lg" disabled>
              Proceed to Checkout
            </Button>
          ) : (
            <Button className="w-full" size="lg" asChild>
              <Link href="/checkout" onClick={onClose}>
                Proceed to Checkout
              </Link>
            </Button>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Payment collected on delivery
            <Truck className="ml-1 inline h-3 w-3" aria-hidden="true" />
          </p>
        </div>
      </aside>
    </>
  );
}

function CartItemRow({
  line,
  currency,
  onUpdateQuantity,
  onRemoveItem,
}: {
  line: CartLine;
  currency: string;
  onUpdateQuantity: (orderLineId: string, quantity: number) => Promise<unknown> | void;
  onRemoveItem: (orderLineId: string) => Promise<unknown> | void;
}) {
  const { quantity, productVariant, featuredAsset } = line;
  const product = productVariant.product;
  const image = featuredAsset?.preview;
  const lineTotal = line.discountedLinePriceWithTax ?? line.linePriceWithTax;

  return (
    <div className="flex gap-3">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <ShoppingBag className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h4 className="truncate font-medium text-gray-900">
            <Link href={`/books/${product.slug}`} className="hover:text-primary">
              {product.name}
            </Link>
          </h4>
          <p className="truncate text-sm text-gray-500">{productVariant.name}</p>
          <p className="mt-1 font-medium text-gray-900">{formatCurrency(lineTotal, currency)}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center overflow-hidden rounded-lg border">
            <button
              onClick={() => settle(onUpdateQuantity(line.id, quantity - 1))}
              disabled={quantity <= 1}
              className="p-2 transition-colors hover:bg-gray-100 disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="px-3 text-sm font-medium tabular-nums">{quantity}</span>
            <button
              onClick={() => settle(onUpdateQuantity(line.id, quantity + 1))}
              className="p-2 transition-colors hover:bg-gray-100"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={() => settle(onRemoveItem(line.id))}
            className={cn('p-2 text-gray-400 transition-colors hover:text-destructive')}
            aria-label={`Remove ${product.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
