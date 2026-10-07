'use client';

import * as React from 'react';
import {
  AddItemToOrderMutation,
  AdjustOrderLineMutation,
  ApplyCouponCodeMutation,
  GetActiveOrderQuery,
  readCart,
  RemoveCouponCodeMutation,
  RemoveOrderLineMutation,
  type Cart,
} from '@meghana/shared-graphql-operations';
import { shopRequest, unwrapOrder } from '@/lib/vendure/client';

/**
 * Cart state for the storefront.
 *
 * Requests go through `@/lib/vendure/client`, which targets the **same-origin**
 * `/shop-api` so the session cookie is sent.
 *
 * Types come from the generated schema via `@meghana/shared-graphql-operations`
 * (see `cart.ts` there), so they cannot drift from the API.
 */

export interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  addItem: (productVariantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (orderLineId: string, quantity: number) => Promise<void>;
  removeItem: (orderLineId: string) => Promise<void>;
  applyCoupon: (couponCode: string) => Promise<void>;
  removeCoupon: (couponCode: string) => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = React.createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = React.useState<Cart | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refreshCart = React.useCallback(async () => {
    try {
      const data = await shopRequest(GetActiveOrderQuery, {});
      setCart(data.activeOrder ? readCart(data.activeOrder) : null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your cart');
    }
  }, []);

  React.useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  /**
   * Cart mutations return the updated Order, so there is no need to re-fetch
   * afterwards — which also removes a round trip per interaction.
   */
  const run = React.useCallback(
    async (operation: () => Promise<Cart | null>) => {
      setIsLoading(true);
      setError(null);
      try {
        setCart(await operation());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'The cart could not be updated';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const addItem = React.useCallback<CartContextType['addItem']>(
    (productVariantId, quantity = 1) =>
      run(async () => {
        const data = await shopRequest(AddItemToOrderMutation, { productVariantId, quantity });
        return readCart(unwrapOrder(data.addItemToOrder));
      }),
    [run],
  );

  const updateQuantity = React.useCallback<CartContextType['updateQuantity']>(
    (orderLineId, quantity) =>
      run(async () => {
        const data = await shopRequest(AdjustOrderLineMutation, { orderLineId, quantity });
        return readCart(unwrapOrder(data.adjustOrderLine));
      }),
    [run],
  );

  const removeItem = React.useCallback<CartContextType['removeItem']>(
    (orderLineId) =>
      run(async () => {
        const data = await shopRequest(RemoveOrderLineMutation, { orderLineId });
        return readCart(unwrapOrder(data.removeOrderLine));
      }),
    [run],
  );

  const applyCoupon = React.useCallback<CartContextType['applyCoupon']>(
    (couponCode) =>
      run(async () => {
        const data = await shopRequest(ApplyCouponCodeMutation, { couponCode });
        return readCart(unwrapOrder(data.applyCouponCode));
      }),
    [run],
  );

  const removeCoupon = React.useCallback<CartContextType['removeCoupon']>(
    (couponCode) =>
      run(async () => {
        const data = await shopRequest(RemoveCouponCodeMutation, { couponCode });
        // `removeCouponCode` is nullable — it returns null with no active order.
        return data.removeCouponCode ? readCart(data.removeCouponCode) : null;
      }),
    [run],
  );

  const value = React.useMemo<CartContextType>(
    () => ({
      cart,
      isLoading,
      error,
      addItem,
      updateQuantity,
      removeItem,
      applyCoupon,
      removeCoupon,
      refreshCart,
    }),
    [cart, isLoading, error, addItem, updateQuantity, removeItem, applyCoupon, removeCoupon, refreshCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
