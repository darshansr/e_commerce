/**
 * Canonical primitive types shared by every domain module.
 *
 * This is the single source of truth. Domain modules MUST import from here
 * instead of redeclaring local copies.
 *
 * Previously `Address`, `Asset`, `Country`, `CountryTranslation`,
 * `CurrencyCode` and `LanguageCode` were duplicated across `cart.ts`,
 * `customer.ts`, `product.ts`, `pos.ts` and `b2b.ts` with *divergent* shapes,
 * which produced TS2308 re-export collisions and silent type drift.
 * Where shapes differed, the fuller Vendure-shaped definition wins.
 */

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export type LanguageCode =
  | 'en'
  | 'hi'
  | 'mr'
  | 'gu'
  | 'ta'
  | 'te'
  | 'kn'
  | 'ml'
  | 'bn'
  | 'pa'
  | 'or'
  | 'as';

export interface Coordinate {
  x: number;
  y: number;
}

export interface Tag {
  id: string;
  value: string;
}

/**
 * Superset of the former per-module shapes
 * (customer: 3 fields, pos: 2 fields, product: 11 fields).
 */
export interface Asset {
  id: string;
  name: string;
  type: 'IMAGE' | 'VIDEO' | 'FILE' | 'OTHER';
  mimeType: string;
  source: string;
  preview: string;
  focalPoint?: Coordinate;
  width: number;
  height: number;
  fileSize: number;
  tags: Tag[];
  customFields: Record<string, any>;
}

export interface Country {
  id: string;
  code: string;
  name: string;
  enabled: boolean;
  translations: CountryTranslation[];
}

export interface CountryTranslation {
  id: string;
  languageCode: LanguageCode;
  name: string;
}

/**
 * Superset of the former shapes:
 *  - customer.ts included createdAt/updatedAt
 *  - cart.ts omitted them
 *  - pos.ts was a 5-field stub
 */
export interface Address {
  id: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
  company?: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  province?: string;
  postalCode: string;
  country: Country;
  phoneNumber?: string;
  defaultShippingAddress: boolean;
  defaultBillingAddress: boolean;
  customFields: Record<string, any>;
}
