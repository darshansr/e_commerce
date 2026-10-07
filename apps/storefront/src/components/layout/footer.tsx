'use client';

import * as React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin, Truck, RotateCcw, Shield, Headphones, Star } from 'lucide-react';
import { cn } from '@meghana/shared-utils';

const footerLinks = {
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Blog', href: '/blog' },
    { name: 'Affiliate Program', href: '/affiliate' },
  ],
  help: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'FAQs', href: '/faq' },
    { name: 'Shipping Info', href: '/shipping' },
    { name: 'Returns', href: '/returns' },
    { name: 'Track Order', href: '/track-order' },
  ],
  account: [
    { name: 'My Account', href: '/account' },
    { name: 'Order History', href: '/account/orders' },
    { name: 'Wishlist', href: '/wishlist' },
    { name: 'Addresses', href: '/account/addresses' },
    { name: 'Newsletter', href: '/newsletter' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Accessibility', href: '/accessibility' },
  ],
};

const socialLinks = [
  { name: 'Facebook', href: 'https://facebook.com/meghanabookhouse', icon: Facebook },
  { name: 'Twitter', href: 'https://twitter.com/meghanabookhouse', icon: Twitter },
  { name: 'Instagram', href: 'https://instagram.com/meghanabookhouse', icon: Instagram },
  { name: 'YouTube', href: 'https://youtube.com/meghanabookhouse', icon: Youtube },
];

const trustBadges = [
  { icon: Truck, text: 'Free Delivery', desc: 'On orders above ₹499' },
  { icon: RotateCcw, text: 'Easy Returns', desc: '7-day return policy' },
  { icon: Shield, text: 'Secure Payment', desc: '100% secure checkout' },
  { icon: Headphones, text: 'Support', desc: 'Mon-Sat 9AM-8PM' },
];

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      {/* Trust Badges */}
      <div className="border-b py-8 px-4">
        <div className="mx-auto max-w-7xl grid grid-cols-2 gap-6 md:grid-cols-4">
          {trustBadges.map((badge) => (
            <div key={badge.text} className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <badge.icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{badge.text}</p>
                <p className="text-sm text-gray-500">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="py-12 px-4">
        <div className="mx-auto max-w-7xl grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Company Info */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2" aria-label="Meghana Book House Home">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <svg className="h-6 w-6 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="font-heading text-xl font-bold text-gray-900">Meghana Book House</span>
            </Link>
            <p className="text-gray-600 max-w-xs">
              Your trusted destination for books since 1995. We bring you the best selection of fiction, non-fiction, academic texts, and children's books at unbeatable prices.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-primary transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
            <nav className="space-y-3">
              {footerLinks.company.map((link) => (
                <Link key={link.name} href={link.href} className="block text-sm text-gray-600 hover:text-primary transition-colors">
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Help */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Help & Support</h3>
            <nav className="space-y-3">
              {footerLinks.help.map((link) => (
                <Link key={link.name} href={link.href} className="block text-sm text-gray-600 hover:text-primary transition-colors">
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">My Account</h3>
            <nav className="space-y-3">
              {footerLinks.account.map((link) => (
                <Link key={link.name} href={link.href} className="block text-sm text-gray-600 hover:text-primary transition-colors">
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Contact Us</h3>
            <address className="not-italic space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 shrink-0 mt-0.5" />
                <span>123 Book Street, Literary Lane, Knowledge City - 560001</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400 shrink-0" />
                <a href="tel:+918001234567" className="hover:text-primary transition-colors">+91 800 123 4567</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400 shrink-0" />
                <a href="mailto:support@meghanabookhouse.com" className="hover:text-primary transition-colors">support@meghanabookhouse.com</a>
              </div>
            </address>

            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Newsletter</h4>
              <p className="text-sm text-gray-600 mb-3">Subscribe for updates & offers</p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Email address"
                />
                <button type="submit" className="h-10 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t py-6 px-4">
        <div className="mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Meghana Book House. All rights reserved.
          </p>
          <nav className="flex items-center gap-6 text-sm text-gray-500">
            {footerLinks.legal.map((link) => (
              <Link key={link.name} href={link.href} className="hover:text-primary transition-colors">
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <img src="/payment-methods.svg" alt="Accepted payment methods" className="h-6 opacity-60" />
          </div>
        </div>
      </div>
    </footer>
  );
}