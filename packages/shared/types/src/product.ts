/**
 * Product-related types shared across all frontends
 */

import type { Asset, Coordinate, LanguageCode, Tag } from './common';

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  price: number;
  priceWithTax: number;
  currencyCode: string;
  stockLevel: number;
  stockLevelIncludingReserved: number;
  trackInventory: boolean;
  outOfStockThreshold: number;
  useGlobalOutOfStockThreshold: boolean;
  featuredAsset?: Asset;
  assets: Asset[];
  options: ProductOption[];
  facetValues: FacetValue[];
  translations: ProductVariantTranslation[];
  customFields: {
    isbn13?: string;
    isbn10?: string;
    condition?: 'NEW' | 'USED_LIKE_NEW' | 'USED_GOOD' | 'USED_FAIR';
    barcode?: string;
  };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  featuredAsset?: Asset;
  assets: Asset[];
  variants: ProductVariant[];
  optionGroups: ProductOptionGroup[];
  facetValues: FacetValue[];
  translations: ProductTranslation[];
  collections: Collection[];
  customFields: {
    isbn13?: string;
    isbn10?: string;
    author?: string;
    publisher?: string;
    publishedDate?: string;
    edition?: string;
    language?: string;
    pageCount?: number;
    dimensions?: string;
    weight?: number;
    subject?: BookSubject;
    series?: BookSeries;
  };
}

export interface BookSubject {
  id: string;
  name: string;
  slug: string;
  parent?: BookSubject;
  children: BookSubject[];
  description?: string;
}

export interface BookSeries {
  id: string;
  name: string;
  slug: string;
  description?: string;
  products: Product[];
}

export interface ProductOptionGroup {
  id: string;
  name: string;
  code: string;
  options: ProductOption[];
}

export interface ProductOption {
  id: string;
  name: string;
  code: string;
  group: ProductOptionGroup;
}

export interface FacetValue {
  id: string;
  name: string;
  code: string;
  facet: Facet;
  translations: FacetValueTranslation[];
}

export interface Facet {
  id: string;
  name: string;
  code: string;
  isPrivate: boolean;
  values: FacetValue[];
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  featuredAsset?: Asset;
  breadcrumbs: CollectionBreadcrumb[];
  translations: CollectionTranslation[];
  productVariants: ProductVariant[];
  customFields: Record<string, any>;
}

export interface CollectionBreadcrumb {
  id: string;
  name: string;
  slug: string;
}

export interface ProductTranslation {
  id: string;
  languageCode: LanguageCode;
  name: string;
  slug: string;
  description: string;
}

export interface ProductVariantTranslation {
  id: string;
  languageCode: LanguageCode;
  name: string;
}

export interface FacetValueTranslation {
  id: string;
  languageCode: LanguageCode;
  name: string;
}

export interface CollectionTranslation {
  id: string;
  languageCode: LanguageCode;
  name: string;
  slug: string;
  description: string;
}

export interface ProductSearchResult {
  items: Product[];
  totalItems: number;
  facetValues: FacetValueResult[];
  collection?: Collection;
}

export interface FacetValueResult {
  facetValue: FacetValue;
  count: number;
}

export interface PaginatedProductList {
  items: Product[];
  totalItems: number;
}

export interface ProductFilters {
  term?: string;
  facetValueIds?: string[];
  collectionId?: string;
  collectionSlug?: string;
  take?: number;
  skip?: number;
  sort?: ProductSortParameter;
}

export type ProductSortParameter = 
  | 'name' 
  | 'price' 
  | 'rating' 
  | 'createdAt' 
  | 'updatedAt' 
  | 'popularity';

export interface ProductAvailability {
  productVariantId: string;
  inStock: boolean;
  stockLevel: number;
  stockLevelIncludingReserved: number;
  nextStockAvailability?: string;
  message?: string;
}