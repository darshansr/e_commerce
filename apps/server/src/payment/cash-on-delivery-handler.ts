import {
  CreatePaymentResult,
  LanguageCode,
  PaymentMethodHandler,
  SettlePaymentResult,
} from '@vendure/core';

/**
 * Cash on delivery.
 *
 * Vendure ships **no** payment handler at all — `paymentOptions.paymentMethodHandlers`
 * defaults to `[]`, and without at least one registered handler you cannot create a
 * `PaymentMethod`, so `addPaymentToOrder` can never succeed and checkout cannot complete.
 *
 * `@vendure/payments-plugin` was deliberately not used: it carries `stripe`, `braintree`
 * and `@mollie/api-client` peers and does **not** export a dummy handler in 3.x, so it
 * would add three gateway dependencies for no benefit here.
 *
 * Two-step flow: `createPayment` authorises (nothing is collected at checkout) and
 * `settlePayment` reports success, which is what a courier taking cash on delivery
 * amounts to. That leaves the order in `PaymentAuthorized` rather than `PaymentSettled`,
 * which is the honest state for this method.
 *
 * Adding a real gateway later means registering that handler alongside this one —
 * nothing else in the checkout flow has to change.
 */
export const cashOnDeliveryHandler = new PaymentMethodHandler({
  code: 'cash-on-delivery',
  description: [{ languageCode: LanguageCode.en, value: 'Cash on delivery' }],
  args: {},
  createPayment: (ctx, order, amount, args, metadata): CreatePaymentResult => ({
    amount,
    state: 'Authorized',
    metadata: { ...metadata, note: 'Collected by the courier on delivery' },
  }),
  settlePayment: (): SettlePaymentResult => ({ success: true }),
});
