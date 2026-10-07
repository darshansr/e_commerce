import { graphql, readFragment, type FragmentOf, type ResultOf } from './client';

/**
 * Checkout operations.
 *
 * Vendure's order state machine drives the whole flow, and the steps must happen
 * in this order — each is a precondition for the next:
 *
 *   setCustomerForOrder       (guest checkout; no login required)
 *   setOrderShippingAddress
 *   setOrderShippingMethod    (from `eligibleShippingMethods`)
 *   transitionOrderToState('ArrangingPayment')
 *   addPaymentToOrder         (from `eligiblePaymentMethods`)
 *
 * `addPaymentToOrder` is rejected with `ORDER_PAYMENT_STATE_ERROR` unless the
 * order is in `ArrangingPayment`, which is why the explicit transition is needed
 * rather than a single "place order" call.
 */

export const CheckoutLineFragment = graphql(`
  fragment CheckoutLine on OrderLine {
    id
    quantity
    linePriceWithTax
    discountedLinePriceWithTax
    featuredAsset {
      id
      preview
    }
    productVariant {
      id
      name
      product {
        id
        name
        slug
      }
    }
  }
`);

/**
 * Deliberately self-contained rather than spreading `CartFragment`: a spread
 * would nest a masked ref inside a masked ref, so the review step would need two
 * rounds of `readFragment` to read a single price.
 */
export const CheckoutOrderFragment = graphql(
  `
    fragment CheckoutOrder on Order {
      id
      code
      state
      currencyCode
      subTotalWithTax
      shippingWithTax
      totalWithTax
      customer {
        id
        emailAddress
        firstName
        lastName
      }
      shippingAddress {
        fullName
        streetLine1
        streetLine2
        city
        province
        postalCode
        phoneNumber
        countryCode
      }
      shippingLines {
        shippingMethod {
          id
          name
          code
        }
        priceWithTax
      }
      lines {
        ...CheckoutLine
      }
    }
  `,
  [CheckoutLineFragment],
);

export const SetCustomerForOrderMutation = graphql(
  `
    mutation SetCustomerForOrder($input: CreateCustomerInput!) {
      setCustomerForOrder(input: $input) {
        __typename
        ... on Order {
          ...CheckoutOrder
        }
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `,
  [CheckoutOrderFragment],
);

export const SetOrderShippingAddressMutation = graphql(
  `
    mutation SetOrderShippingAddress($input: CreateAddressInput!) {
      setOrderShippingAddress(input: $input) {
        __typename
        ... on Order {
          ...CheckoutOrder
        }
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `,
  [CheckoutOrderFragment],
);

export const SetOrderShippingMethodMutation = graphql(
  `
    mutation SetOrderShippingMethod($id: [ID!]!) {
      setOrderShippingMethod(shippingMethodId: $id) {
        __typename
        ... on Order {
          ...CheckoutOrder
        }
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `,
  [CheckoutOrderFragment],
);

export const TransitionOrderToStateMutation = graphql(`
  mutation TransitionOrderToState($state: String!) {
    transitionOrderToState(state: $state) {
      __typename
      ... on Order {
        id
        state
      }
      ... on OrderStateTransitionError {
        errorCode
        message
      }
    }
  }
`);

export const AddPaymentToOrderMutation = graphql(
  `
    mutation AddPaymentToOrder($input: PaymentInput!) {
      addPaymentToOrder(input: $input) {
        __typename
        ... on Order {
          ...CheckoutOrder
          payments {
            id
            method
            state
            amount
          }
        }
        ... on ErrorResult {
          errorCode
          message
        }
      }
    }
  `,
  [CheckoutOrderFragment],
);

/**
 * Everything the checkout form needs, in one round trip.
 *
 * `eligibleShippingMethods` is empty until a shipping address has been set, so
 * this is re-fetched after the address step rather than once at the start.
 */
export const CheckoutOptionsQuery = graphql(`
  query CheckoutOptions {
    eligibleShippingMethods {
      id
      name
      code
      description
      price
      priceWithTax
    }
    eligiblePaymentMethods {
      id
      code
      name
      description
      isEligible
      eligibilityMessage
    }
    availableCountries {
      id
      code
      name
    }
  }
`);

// ---------------------------------------------------------------------------
// Derived types and readers
// ---------------------------------------------------------------------------

export function readCheckoutOrder(ref: FragmentOf<typeof CheckoutOrderFragment>) {
  return readFragment(CheckoutOrderFragment, ref);
}

export function readCheckoutLine(ref: FragmentOf<typeof CheckoutLineFragment>) {
  return readFragment(CheckoutLineFragment, ref);
}

/**
 * `Order.lines` is typed as a masked reference *collection* rather than an array
 * of literal fragment refs, so it cannot be passed to `readCheckoutLine`
 * directly. Same one-cast bridge as `readCartLines` in `cart.ts`.
 */
export function readCheckoutLines(lines: readonly unknown[]): CheckoutLine[] {
  return lines.map((line) => readCheckoutLine(line as CheckoutLineRef));
}

export type CheckoutOrder = ReturnType<typeof readCheckoutOrder>;
export type CheckoutLine = ReturnType<typeof readCheckoutLine>;
export type CheckoutLineRef = FragmentOf<typeof CheckoutLineFragment>;

export type EligibleShippingMethod =
  ResultOf<typeof CheckoutOptionsQuery>['eligibleShippingMethods'][number];
export type EligiblePaymentMethod =
  ResultOf<typeof CheckoutOptionsQuery>['eligiblePaymentMethods'][number];
export type AvailableCountry = ResultOf<typeof CheckoutOptionsQuery>['availableCountries'][number];
