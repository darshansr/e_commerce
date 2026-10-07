import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HeroSection } from '@/features/home/hero-section';
import {
  FeaturedProducts,
  FeaturedProductsSkeleton,
} from '@/features/products/featured-products';

export const metadata: Metadata = {
  title: 'Meghana Book House - Your Gateway to Knowledge',
  description:
    "Discover a world of books at Meghana Book House. Bestsellers, academic texts, children's books, and more. Fast delivery across India.",
  alternates: { canonical: '/' },
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <Suspense fallback={<FeaturedProductsSkeleton />}>
        <FeaturedProducts />
      </Suspense>
    </>
  );
}
