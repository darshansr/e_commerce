import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001'),
  title: {
    default: 'Meghana Book House - Your Gateway to Knowledge',
    template: '%s | Meghana Book House',
  },
  description: 'Discover a world of books at Meghana Book House. Bestsellers, academic texts, children\'s books, and more. Fast delivery across India.',
  keywords: ['books', 'bookstore', 'online books', 'buy books India', 'academic books', 'children books'],
  authors: [{ name: 'Meghana Book House' }],
  creator: 'Meghana Book House',
  publisher: 'Meghana Book House',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://meghanabookhouse.com',
    siteName: 'Meghana Book House',
    title: 'Meghana Book House - Your Gateway to Knowledge',
    description: 'Discover a world of books at Meghana Book House. Bestsellers, academic texts, children\'s books, and more.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Meghana Book House',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meghana Book House',
    description: 'Discover a world of books at Meghana Book House.',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://meghanabookhouse.com" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}