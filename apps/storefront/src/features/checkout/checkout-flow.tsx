'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertCircle, Check, ShoppingBag } from 'lucide-react';
import { cn, formatCurrency } from '@meghana/shared-utils';
import {
  AddPaymentToOrderMutation,
  CheckoutOptionsQuery,
  SetCustomerForOrderMutation,
  SetOrderShippingAddressMutation,
  SetOrderShippingMethodMutation,
  TransitionOrderToStateMutation,
  readCartLines,
  readCheckoutLines,
  readCheckoutOrder,
  type AvailableCountry,
  type CheckoutOrder,
  type EligiblePaymentMethod,
  type EligibleShippingMethod,
} from '@meghana/shared-graphql-operations';
import { shopRequest, unwrapOrder } from '@/lib/vendure/client';
import { useCart } from '@/features/cart/cart-provider';

type Step = 'contact' | 'address' | 'delivery' | 'payment' | 'done';

const STEPS: Array<{ id: Step; label: string }> = [
  { id: 'contact', label: 'Contact' },
  { id: 'address', label: 'Address' },
  { id: 'delivery', label: 'Delivery' },
  { id: 'payment', label: 'Payment' },
];

const STEP_ORDER: Step[] = ['contact', 'address', 'delivery', 'payment', 'done'];

/** Line shape shared by the cart and checkout payloads. */
interface SummaryLine {
  id: string;
  title: string;
  quantity: number;
  total: number;
}

function toSummaryLines(
  lines: ReadonlyArray<{
    id: string;
    quantity: number;
    linePriceWithTax: number;
    discountedLinePriceWithTax: number;
    productVariant: { product: { name: string } };
  }>,
): SummaryLine[] {
  return lines.map((line) => ({
    id: line.id,
    title: line.productVariant.product.name,
    quantity: line.quantity,
    total: line.discountedLinePriceWithTax ?? line.linePriceWithTax,
  }));
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

/**
 * Guest checkout, driven by Vendure's order state machine.
 *
 * Each step is a precondition for the next, so the order of these mutations is
 * not cosmetic: `setOrderShippingMethod` only accepts a method that is eligible
 * for the *current* address, and `addPaymentToOrder` is rejected unless the order
 * has already been transitioned to `ArrangingPayment`.
 */
export function CheckoutFlow() {
  const { cart, isLoading: cartLoading, refreshCart } = useCart();

  const [step, setStep] = React.useState<Step>('contact');
  const [order, setOrder] = React.useState<CheckoutOrder | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [contact, setContact] = React.useState({
    emailAddress: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  });

  const [address, setAddress] = React.useState({
    fullName: '',
    streetLine1: '',
    streetLine2: '',
    city: '',
    province: '',
    postalCode: '',
    phoneNumber: '',
    countryCode: 'IN',
  });

  const [shippingMethods, setShippingMethods] = React.useState<EligibleShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = React.useState<EligiblePaymentMethod[]>([]);
  const [countries, setCountries] = React.useState<AvailableCountry[]>([]);
  const [shippingMethodId, setShippingMethodId] = React.useState<string | null>(null);
  const [paymentMethodCode, setPaymentMethodCode] = React.useState<string | null>(null);

  /**
   * Re-fetched after the address step: `eligibleShippingMethods` is empty until
   * the order has a shipping address.
   */
  const loadOptions = React.useCallback(async () => {
    const data = await shopRequest(CheckoutOptionsQuery, {});
    const eligiblePayments = data.eligiblePaymentMethods.filter((method) => method.isEligible);

    setShippingMethods(data.eligibleShippingMethods);
    setPaymentMethods(eligiblePayments);
    setCountries(data.availableCountries);
    setShippingMethodId((current) => current ?? data.eligibleShippingMethods[0]?.id ?? null);
    setPaymentMethodCode((current) => current ?? eligiblePayments[0]?.code ?? null);
  }, []);

  React.useEffect(() => {
    // Countries are available immediately; the method lists fill in later.
    void loadOptions().catch(() => {});
  }, [loadOptions]);

  const run = async (operation: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await operation();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  const submitContact = (event: React.FormEvent) =>
    run(async () => {
      event.preventDefault();
      const data = await shopRequest(SetCustomerForOrderMutation, {
        input: {
          emailAddress: contact.emailAddress,
          firstName: contact.firstName,
          lastName: contact.lastName,
          phoneNumber: contact.phoneNumber || undefined,
        },
      });
      setOrder(
        readCheckoutOrder(unwrapOrder(data.setCustomerForOrder, 'Could not save your details')),
      );
      setStep('address');
    });

  const submitAddress = (event: React.FormEvent) =>
    run(async () => {
      event.preventDefault();
      const data = await shopRequest(SetOrderShippingAddressMutation, {
        input: {
          fullName: address.fullName,
          streetLine1: address.streetLine1,
          streetLine2: address.streetLine2 || undefined,
          city: address.city,
          province: address.province || undefined,
          postalCode: address.postalCode,
          phoneNumber: address.phoneNumber || undefined,
          countryCode: address.countryCode,
        },
      });
      setOrder(
        readCheckoutOrder(unwrapOrder(data.setOrderShippingAddress, 'Could not save your address')),
      );
      await loadOptions();
      setStep('delivery');
    });

  const submitShippingMethod = (event: React.FormEvent) =>
    run(async () => {
      event.preventDefault();
      if (!shippingMethodId) throw new Error('Please choose a delivery option.');

      const data = await shopRequest(SetOrderShippingMethodMutation, { id: [shippingMethodId] });
      setOrder(
        readCheckoutOrder(
          unwrapOrder(data.setOrderShippingMethod, 'Could not set the delivery option'),
        ),
      );
      setStep('payment');
    });

  const placeOrder = (event: React.FormEvent) =>
    run(async () => {
      event.preventDefault();
      if (!paymentMethodCode) throw new Error('Please choose a payment method.');

      // Required before a payment can be attached.
      const transition = await shopRequest(TransitionOrderToStateMutation, {
        state: 'ArrangingPayment',
      });
      const transitioned = transition.transitionOrderToState;
      if (!transitioned || transitioned.__typename !== 'Order') {
        throw new Error(transitioned?.message ?? 'The order could not be started.');
      }

      const data = await shopRequest(AddPaymentToOrderMutation, {
        input: { method: paymentMethodCode, metadata: {} },
      });
      setOrder(readCheckoutOrder(unwrapOrder(data.addPaymentToOrder, 'Payment could not be taken')));
      setStep('done');
      // The order is no longer the active cart.
      await refreshCart();
    });

  const summaryLines: SummaryLine[] = order
    ? toSummaryLines(readCheckoutLines(order.lines))
    : cart
      ? // Cart lines are masked with `CartLineFragment`, so they must be read with
        // the matching reader — the two fragments only happen to overlap today.
        toSummaryLines(readCartLines(cart.lines))
      : [];

  const currency = order?.currencyCode ?? cart?.currencyCode ?? 'INR';
  const subtotal = order?.subTotalWithTax ?? cart?.subTotalWithTax ?? 0;
  const shipping = order?.shippingWithTax ?? cart?.shippingWithTax ?? 0;
  const total = order?.totalWithTax ?? cart?.totalWithTax ?? 0;

  if (step === 'done' && order) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <Check className="h-7 w-7 text-green-600" aria-hidden="true" />
        </div>
        <h2 className="mt-6 font-heading text-3xl font-bold tracking-tight">Order placed</h2>
        <p className="mt-2 text-muted-foreground">
          Thank you. Your order reference is{' '}
          <span className="font-mono font-medium text-foreground">{order.code}</span>.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-card p-6 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Order total</span>
            <span className="font-semibold">{formatCurrency(total, currency)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium">{order.state}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Payment</span>
            <span className="font-medium">Cash on delivery</span>
          </div>
          <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
            Please have {formatCurrency(total, currency)} ready for the courier. Quote your order
            reference if you get in touch about this order.
          </p>
        </div>

        <Link
          href="/books"
          className="mt-8 inline-flex h-11 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  if (!cartLoading && (!cart || cart.totalQuantity === 0)) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-dashed border-border bg-muted/40 p-10 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <h2 className="mt-4 font-heading text-xl font-semibold">Your cart is empty</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Add a book before checking out.
        </p>
        <Link
          href="/books"
          className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Browse books
        </Link>
      </div>
    );
  }

  const currentIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-12">
      <div>
        <ol className="mb-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          {STEPS.map((entry, index) => {
            const stepIndex = STEP_ORDER.indexOf(entry.id);
            const isCurrent = step === entry.id;
            const isDone = currentIndex > stepIndex;

            return (
              <li key={entry.id} className="flex items-center gap-3">
                {index > 0 && <span className="text-muted-foreground">/</span>}
                <span
                  className={cn(
                    'flex items-center gap-2',
                    isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border text-xs',
                      isDone
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isCurrent
                          ? 'border-primary text-primary'
                          : 'border-border',
                    )}
                  >
                    {isDone ? <Check className="h-3 w-3" aria-hidden="true" /> : index + 1}
                  </span>
                  {entry.label}
                </span>
              </li>
            );
          })}
        </ol>

        {error && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {step === 'contact' && (
          <form onSubmit={submitContact} className="space-y-4">
            <h2 className="font-heading text-xl font-semibold">Contact details</h2>
            <Field label="Email" required>
              <input
                type="email"
                required
                value={contact.emailAddress}
                onChange={(e) => setContact({ ...contact, emailAddress: e.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" required>
                <input
                  required
                  value={contact.firstName}
                  onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Last name" required>
                <input
                  required
                  value={contact.lastName}
                  onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Phone">
              <input
                type="tel"
                value={contact.phoneNumber}
                onChange={(e) => setContact({ ...contact, phoneNumber: e.target.value })}
                className={inputClass}
              />
            </Field>
            <SubmitButton busy={busy}>Continue to address</SubmitButton>
          </form>
        )}

        {step === 'address' && (
          <form onSubmit={submitAddress} className="space-y-4">
            <h2 className="font-heading text-xl font-semibold">Delivery address</h2>
            <Field label="Full name" required>
              <input
                required
                value={address.fullName}
                onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Address" required>
              <input
                required
                value={address.streetLine1}
                onChange={(e) => setAddress({ ...address, streetLine1: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Apartment, landmark (optional)">
              <input
                value={address.streetLine2}
                onChange={(e) => setAddress({ ...address, streetLine2: e.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City" required>
                <input
                  required
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="State (optional)">
                <input
                  value={address.province}
                  onChange={(e) => setAddress({ ...address, province: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="PIN code" required>
                <input
                  required
                  value={address.postalCode}
                  onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Country" required>
                <select
                  required
                  value={address.countryCode}
                  onChange={(e) => setAddress({ ...address, countryCode: e.target.value })}
                  className={inputClass}
                >
                  {countries.map((country) => (
                    <option key={country.id} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Phone">
              <input
                type="tel"
                value={address.phoneNumber}
                onChange={(e) => setAddress({ ...address, phoneNumber: e.target.value })}
                className={inputClass}
              />
            </Field>
            <SubmitButton busy={busy}>Continue to delivery</SubmitButton>
          </form>
        )}

        {step === 'delivery' && (
          <form onSubmit={submitShippingMethod} className="space-y-4">
            <h2 className="font-heading text-xl font-semibold">Delivery option</h2>
            {shippingMethods.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                No delivery options are available for this address.
              </p>
            ) : (
              <ul className="space-y-3">
                {shippingMethods.map((method) => (
                  <li key={method.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                        shippingMethodId === method.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50',
                      )}
                    >
                      <input
                        type="radio"
                        name="shippingMethod"
                        value={method.id}
                        checked={shippingMethodId === method.id}
                        onChange={() => setShippingMethodId(method.id)}
                        className="mt-1"
                      />
                      <span className="flex-1">
                        <span className="block font-medium">{method.name}</span>
                        {method.description && (
                          <span className="mt-0.5 block text-sm text-muted-foreground">
                            {method.description}
                          </span>
                        )}
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(method.priceWithTax, currency)}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <SubmitButton busy={busy} disabled={shippingMethods.length === 0}>
              Continue to payment
            </SubmitButton>
          </form>
        )}

        {step === 'payment' && (
          <form onSubmit={placeOrder} className="space-y-4">
            <h2 className="font-heading text-xl font-semibold">Payment</h2>
            {paymentMethods.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/40 p-6 text-sm text-muted-foreground">
                No payment methods are available.
              </p>
            ) : (
              <ul className="space-y-3">
                {paymentMethods.map((method) => (
                  <li key={method.code}>
                    <label
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                        paymentMethodCode === method.code
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50',
                      )}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.code}
                        checked={paymentMethodCode === method.code}
                        onChange={() => setPaymentMethodCode(method.code)}
                        className="mt-1"
                      />
                      <span className="flex-1">
                        <span className="block font-medium">{method.name}</span>
                        {method.description && (
                          <span className="mt-0.5 block text-sm text-muted-foreground">
                            {method.description}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <SubmitButton busy={busy} disabled={paymentMethods.length === 0}>
              Place order — {formatCurrency(total, currency)}
            </SubmitButton>
            <p className="text-xs text-muted-foreground">
              Nothing is charged now. You pay the courier when your books arrive.
            </p>
          </form>
        )}
      </div>

      <aside aria-label="Order summary" className="mt-10 lg:mt-0">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg font-semibold">Order summary</h2>

          <ul className="mt-4 space-y-3">
            {summaryLines.map((line) => (
              <li key={line.id} className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">
                  {line.title} <span className="text-foreground">× {line.quantity}</span>
                </span>
                <span className="shrink-0 font-medium">{formatCurrency(line.total, currency)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatCurrency(subtotal, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>{shipping > 0 ? formatCurrency(shipping, currency) : 'Free'}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatCurrency(total, currency)}</dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}

const inputClass =
  'h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}

function SubmitButton({
  busy,
  disabled,
  children,
}: {
  busy: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={busy || disabled}
      className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {busy ? 'Please wait…' : children}
    </button>
  );
}
