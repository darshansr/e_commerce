'use client';

import * as React from 'react';
import { Minus, Plus, ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { useCart } from '@/features/cart/cart-provider';

interface AddToCartProps {
  variantId: string;
  inStock: boolean;
}

type Status = 'idle' | 'adding' | 'added' | 'error';

export function AddToCart({ variantId, inStock }: AddToCartProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = React.useState(1);
  const [status, setStatus] = React.useState<Status>('idle');
  const [message, setMessage] = React.useState<string | null>(null);

  const disabled = !inStock || status === 'adding';

  const handleAdd = async () => {
    setStatus('adding');
    setMessage(null);
    try {
      await addItem(variantId, quantity);
      setStatus('added');
      window.setTimeout(() => setStatus('idle'), 2500);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Could not add this item to your cart.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={disabled || quantity <= 1}
            aria-label="Decrease quantity"
            className="flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span
            aria-live="polite"
            className="w-10 text-center text-sm font-medium tabular-nums"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            disabled={disabled}
            aria-label="Increase quantity"
            className="flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'adding' ? (
            'Adding…'
          ) : status === 'added' ? (
            <>
              <Check className="h-4 w-4" /> Added to cart
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              {inStock ? 'Add to cart' : 'Out of stock'}
            </>
          )}
        </button>
      </div>

      {message && (
        <p className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {message}
        </p>
      )}
    </div>
  );
}
