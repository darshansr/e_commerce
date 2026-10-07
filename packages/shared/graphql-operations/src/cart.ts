/**
 * Cart / active-order operations, and the TypeScript types **derived** from them.
 *
 * These replace the hand-written `ActiveOrder` / `OrderLine` types that used to
 * live in `@meghana/shared-types`. Those were authored before the backend
 * existed and described a shape the Shop API does not have — e.g. they put
 * `product`, `items`, `adjustments` and `promotions` on `OrderLine`, and
 * `nextStates` / `modifications` on `Order`. Every cart query built on them was
 * therefore invalid.
 *
 * Deriving from the live schema means the types cannot drift again: if the
 * schema changes, `graphql:generate` fails the typecheck instead of silently
 * lying.
 */
import { graphql, readFragment, type FragmentOf, type ResultOf } from './client';

/** Line-level fields needed to render a cart line. */
export const CartLineFragment = graphql(`
  fragment CartLine on OrderLine {
    id
    quantity
    unitPriceWithTax
    linePriceWithTax
    discountedLinePriceWithTax
    featuredAsset {
      id
      preview
    }
    productVariant {
      id
      name
      sku
      product {
        id
        name
        slug
      }
    }
  }
`);

/** Order-level fields needed to render a cart. */
export const CartFragment = graphql(
  `
    fragment Cart on Order {
      id
      code
      state
      active
      totalQuantity
      currencyCode
      subTotalWithTax
      shippingWithTax
      totalWithTax
      couponCodes
      discounts {
        description
        amountWithTax
      }
      lines {
        ...CartLine
      }
    }
  `,
  [CartLineFragment],
);

export const GetActiveOrderQuery = graphql(
  `
    query GetActiveOrder {
      activeOrder {
        ...Cart
      }
    }
  `,
  [CartFragment],
);

export const AddItemToOrderMutation = graphql(
  `
    mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
      addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) {
        __typename
        ... on Order {
          ...Cart
        }
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `,
  [CartFragment],
);

export const AdjustOrderLineMutation = graphql(
  `
    mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
      adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) {
        __typename
        ... on Order {
          ...Cart
        }
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `,
  [CartFragment],
);

export const RemoveOrderLineMutation = graphql(
  `
    mutation RemoveOrderLine($orderLineId: ID!) {
      removeOrderLine(orderLineId: $orderLineId) {
        __typename
        ... on Order {
          ...Cart
        }
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `,
  [CartFragment],
);

export const ApplyCouponCodeMutation = graphql(
  `
    mutation ApplyCouponCodeToActiveOrder($couponCode: String!) {
      applyCouponCode(couponCode: $couponCode) {
        __typename
        ... on Order {
          ...Cart
        }
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `,
  [CartFragment],
);

export const RemoveCouponCodeMutation = graphql(
  `
    mutation RemoveCouponCodeFromActiveOrder($couponCode: String!) {
      removeCouponCode(couponCode: $couponCode) {
        ...Cart
      }
    }
  `,
  [CartFragment],
);

// ---------------------------------------------------------------------------
// Derived types — the single source of truth is the schema
// ---------------------------------------------------------------------------

/**
 * gql.tada masks fragment data: a fragment spread in a query result is a
 * *reference* (`{ [$tada.fragmentRefs]: ... }`) whose fields are not directly
 * readable. `readFragment` resolves it, so these readers are also the source of
 * the types below — `FragmentOf` alone would give you the masked reference.
 */
export function readCart(ref: FragmentOf<typeof CartFragment>) {
  return readFragment(CartFragment, ref);
}

export function readCartLine(ref: FragmentOf<typeof CartLineFragment>) {
  return readFragment(CartLineFragment, ref);
}

/**
 * `Order.lines` is typed by gql.tada as a masked reference *collection* whose
 * elements are index-signature objects rather than literal fragment references,
 * so it cannot be passed to `readCartLine` directly. This is the single place
 * where that gap is bridged, and the only cast in the cart module.
 */
export function readCartLines(lines: readonly unknown[]): CartLine[] {
  return lines.map((line) => readCartLine(line as CartLineRef));
}

/** Fully-typed, unmasked cart data. */
export type Cart = ReturnType<typeof readCart>;
export type CartLine = ReturnType<typeof readCartLine>;

/** Masked references — for props that receive values straight from a result. */
export type CartRef = FragmentOf<typeof CartFragment>;
export type CartLineRef = FragmentOf<typeof CartLineFragment>;

/**
 * Cart mutations each return a union of the updated `Order` or one or more
 * specific error results. Consumers narrow on `__typename === 'Order'`.
 */
export type AddItemResult = ResultOf<typeof AddItemToOrderMutation>['addItemToOrder'];
export type AdjustOrderLineResult = ResultOf<typeof AdjustOrderLineMutation>['adjustOrderLine'];
export type RemoveOrderLineResult = ResultOf<typeof RemoveOrderLineMutation>['removeOrderLine'];
export type ApplyCouponResult = ResultOf<typeof ApplyCouponCodeMutation>['applyCouponCode'];
