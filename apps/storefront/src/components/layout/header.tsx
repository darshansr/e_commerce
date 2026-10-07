'use client';

import * as React from 'react';
import Link from 'next/link';
import { useCart } from '@/features/cart/cart-provider';
import { useAuth } from '@/features/auth/auth-provider';
import { useLocale } from '@/components/locale-provider';
import { Button } from '@meghana/shared-ui-components/ui';
import { CartDrawer } from '@meghana/shared-ui-components/cart';
import { Search, Menu, X, User, ShoppingBag, Heart, Barcode, Globe, ChevronDown } from 'lucide-react';
import { cn } from '@meghana/shared-utils';

export function Header() {
  const {
    cart,
    error: cartError,
    isLoading: cartLoading,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCart();
  const { isAuthenticated, customer, logout, isLoading: authLoading } = useAuth();
  const { locale, setLocale } = useLocale();
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const cartCount = cart?.totalQuantity ?? 0;
  const cartTotal = cart?.totalWithTax ?? 0;

  const navigation = [
    { name: 'Books', href: '/books' },
    { name: 'Categories', href: '/categories' },
    { name: 'Bestsellers', href: '/bestsellers' },
    { name: 'New Arrivals', href: '/new-arrivals' },
    { name: 'Offers', href: '/offers' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      {/* Top Bar */}
      <div className="hidden lg:flex h-10 items-center justify-between border-b px-4 bg-gray-50">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Free delivery on orders above ₹499
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Easy 7-day returns
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as any)}
            className="bg-transparent border-none text-gray-600 focus:outline-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="mr">मराठी</option>
            <option value="gu">ગુજરાતી</option>
            <option value="ta">தமிழ்</option>
            <option value="te">తెలుగు</option>
            <option value="kn">ಕನ್ನಡ</option>
            <option value="ml">മലയാളം</option>
            <option value="bn">বাংলা</option>
            <option value="pa">ਪੰਜਾਬੀ</option>
            <option value="or">ଓଡ଼ିଆ</option>
            <option value="as">অসমীয়া</option>
          </select>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600">₹ INR</span>
        </div>
      </div>

      {/* Main Header */}
      <div className="flex h-16 lg:h-20 items-center justify-between px-4 lg:px-8">
        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Meghana Book House Home">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <svg className="h-6 w-6 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          {/* `hidden` must be undone explicitly: `lg:flex-1` only sets flex-grow,
              so without `lg:flex` the desktop search stayed display:none at every
              width and the header had no search field at all. */}
          <span className="hidden sm:inline font-heading text-xl font-bold text-gray-900">
            Meghana Book House
          </span>
        </Link>

        {/* Search */}
        <div className="hidden lg:flex lg:flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search books, authors, ISBN..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              autoComplete="off"
              onFocus={() => setIsSearchOpen(true)}
            />
          </div>
        </div>

        {/* Mobile Search. `min-w-0` lets this shrink: without it the logo and
            action icons overflowed the viewport on phones, pushing the cart
            button off-screen entirely. */}
        <div className="lg:hidden flex-1 min-w-0 px-2 sm:px-4">
          <button
            onClick={() => setIsSearchOpen(true)}
            aria-label="Open search"
            className="w-full h-10 flex items-center gap-2 pl-3 pr-3 sm:pr-4 rounded-lg border border-gray-300 bg-white text-gray-500"
          >
            <Search className="h-5 w-5 shrink-0" />
            <span className="hidden sm:inline">Search...</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Wishlist */}
          <Link href="/wishlist" className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors lg:p-3" aria-label="Wishlist">
            <Heart className="h-5 w-5 lg:h-6 lg:w-6 text-gray-600" />
            <span className="sr-only">Wishlist</span>
          </Link>

          {/* Cart */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors lg:p-3"
            aria-label={`Cart ${cartCount > 0 ? `with ${cartCount} items` : 'is empty'}`}
          >
            <ShoppingBag className="h-5 w-5 lg:h-6 lg:w-6 text-gray-600" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
            <span className="hidden lg:inline-flex flex-col text-right">
              <span className="text-xs text-gray-500">Cart</span>
              <span className="text-sm font-medium text-gray-900">{cartTotal > 0 ? `₹${(cartTotal / 100).toFixed(2)}` : 'Empty'}</span>
            </span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors lg:p-3"
              aria-label="Account"
              aria-expanded={isUserMenuOpen}
            >
              <User className="h-5 w-5 lg:h-6 lg:w-6 text-gray-600" />
              <span className="hidden lg:inline-block text-sm font-medium text-gray-900">
                {isAuthenticated ? customer?.firstName : 'Account'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500 lg:hidden" />
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setIsUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-200 focus:outline-none lg:absolute lg:right-0 lg:mt-2.5">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-3 border-b">
                        <p className="text-sm font-medium text-gray-900">{customer?.firstName} {customer?.lastName}</p>
                        <p className="text-sm text-gray-500 truncate">{customer?.emailAddress}</p>
                      </div>
                      <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Account</Link>
                      <Link href="/account/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Orders</Link>
                      <Link href="/account/addresses" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Addresses</Link>
                      <Link href="/account/wishlist" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Wishlist</Link>
                      <hr className="my-2 border-gray-100" />
                      <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Logout</button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Login</Link>
                      <Link href="/register" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Register</Link>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <nav className="px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href} className="block py-2 text-gray-700 hover:text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                {item.name}
              </Link>
            ))}
            <hr className="my-4" />
            <div className="flex items-center gap-4 px-2 py-2">
              <Link href="/wishlist" className="flex items-center gap-2 text-gray-700">
                <Heart className="h-5 w-5" />
                Wishlist
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 lg:hidden" onClick={() => setIsSearchOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-b-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="relative p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search books, authors, ISBN..."
                  className="w-full h-12 pl-10 pr-12 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                  autoComplete="off"
                />
                <button onClick={() => setIsSearchOpen(false)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        cart={cart}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onApplyCoupon={applyCoupon}
        onRemoveCoupon={removeCoupon}
        isLoading={cartLoading}
        error={cartError}
      />
    </header>
  );
}