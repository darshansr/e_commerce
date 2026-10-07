/**
 * Order lifecycle types shared by storefront, POS and B2B.
 *
 * These previously lived in both `cart.ts` and `customer.ts` (identical but
 * colliding), while `TaxLine` was duplicated between `cart.ts` and `pos.ts`
 * with different fields.
 */

export type OrderState =
  | 'AddingItems'
  | 'ArrangingPayment'
  | 'PaymentAuthorized'
  | 'PaymentSettled'
  | 'PartiallyShipped'
  | 'Shipped'
  | 'PartiallyDelivered'
  | 'Delivered'
  | 'Cancelled'
  | 'Modifying'
  | 'Refunding'
  | 'Refunded';

export type PaymentState =
  | 'Authorized'
  | 'Settled'
  | 'Declined'
  | 'Cancelled'
  | 'Refunded'
  | 'PartiallyRefunded';

export type RefundState = 'Pending' | 'Succeeded' | 'Failed';

export type TransactionKind = 'Authorize' | 'Capture' | 'Refund' | 'Cancel';

export type TransactionState = 'Authorized' | 'Settled' | 'Failed' | 'Cancelled';

export type FulfillmentState =
  | 'Pending'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled'
  | 'Refunded';

/**
 * `taxAmount` is optional because the Vendure Shop API returns only
 * description + taxRate, while POS receipts carry the computed amount.
 */
export interface TaxLine {
  description: string;
  taxRate: number;
  taxAmount?: number;
}
