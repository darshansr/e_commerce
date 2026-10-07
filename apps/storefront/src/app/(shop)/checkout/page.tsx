import type { Metadata } from 'next';
import { CheckoutFlow } from '@/features/checkout/checkout-flow';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Complete your order from Meghana Book House.',
  // A session-specific flow has nothing to offer search engines.
  robots: { index: false, follow: false },
};

/**
 * Guest checkout.
 *
 * Kept as a server component for metadata; everything session-bound happens in
 * `CheckoutFlow`, because the cart session lives in a browser cookie.
 */
export default function CheckoutPage() {
  return (
    <div className="container-custom py-10 md:py-14">
      <h1 className="mb-8 font-heading text-3xl font-bold tracking-tight md:text-4xl">Checkout</h1>
      <CheckoutFlow />
    </div>
  );
}
