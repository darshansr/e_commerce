/**
 * Customer-related types shared across all frontends
 */

import type {
  Address,
  Asset,
  Coordinate,
  Country,
  CountryTranslation,
  CurrencyCode,
  LanguageCode,
} from './common';
import type { OrderState, PaymentState } from './order';

export interface Customer {
  id: string;
  createdAt: string;
  updatedAt: string;
  emailAddress: string;
  title?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  emailAddressVerified: boolean;
  customFields: {
    loyaltyTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    loyaltyPoints: number;
    storeCredit: number;
    isInstitution?: boolean;
    institutionType?: 'SCHOOL' | 'LIBRARY' | 'CORPORATE' | 'UNIVERSITY' | 'GOVERNMENT';
    creditLimit?: number;
    paymentTerms?: 'NET_15' | 'NET_30' | 'NET_60' | 'COD' | 'PREPAID';
    gstNumber?: string;
    panNumber?: string;
  };
  addresses: Address[];
  orders: OrderList;
  historyEntries: HistoryEntryList;
  authenticationMethods: AuthenticationMethod[];
  externalAuthenticationMethods: ExternalAuthenticationMethod[];
  groups: CustomerGroup[];
}

export interface CustomerGroup {
  id: string;
  name: string;
  customers: Customer[];
}

export interface OrderList {
  items: OrderSummary[];
  totalItems: number;
}

export interface OrderSummary {
  id: string;
  code: string;
  state: OrderState;
  orderPlacedAt: string;
  total: number;
  totalWithTax: number;
  currencyCode: CurrencyCode;
  shippingAddress?: Address;
  billingAddress?: Address;
  lines: OrderLineSummary[];
  payments: PaymentSummary[];
  customFields: {
    posTerminalId?: string;
    isOfflineOrder?: boolean;
  };
}

export interface OrderLineSummary {
  id: string;
  productVariant: ProductVariantSummary;
  quantity: number;
  linePriceWithTax: number;
}

export interface ProductVariantSummary {
  id: string;
  sku: string;
  name: string;
  priceWithTax: number;
  featuredAsset?: Asset;
}

export interface PaymentSummary {
  id: string;
  method: string;
  amount: number;
  state: PaymentState;
  createdAt: string;
}

export interface HistoryEntryList {
  items: HistoryEntry[];
  totalItems: number;
}

export interface HistoryEntry {
  id: string;
  createdAt: string;
  type: string;
  isPublic: boolean;
  administrator?: Administrator;
  data: Record<string, any>;
}

export interface Administrator {
  id: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
}

export interface AuthenticationMethod {
  id: string;
  strategy: string;
  metadata: Record<string, string>;
}

export interface ExternalAuthenticationMethod {
  id: string;
  strategy: string;
  externalIdentifier: string;
}

export interface RegisterCustomerInput {
  emailAddress: string;
  password: string;
  title?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  customFields?: {
    loyaltyTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    isInstitution?: boolean;
    institutionType?: 'SCHOOL' | 'LIBRARY' | 'CORPORATE' | 'UNIVERSITY' | 'GOVERNMENT';
  };
}

export interface UpdateCustomerInput {
  title?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  customFields?: {
    loyaltyTier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
    isInstitution?: boolean;
    institutionType?: 'SCHOOL' | 'LIBRARY' | 'CORPORATE' | 'UNIVERSITY' | 'GOVERNMENT';
    creditLimit?: number;
    paymentTerms?: 'NET_15' | 'NET_30' | 'NET_60' | 'COD' | 'PREPAID';
    gstNumber?: string;
    panNumber?: string;
  };
}

export interface CreateAddressInput {
  fullName: string;
  company?: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  province?: string;
  postalCode: string;
  countryCode: string;
  phoneNumber?: string;
  defaultShippingAddress?: boolean;
  defaultBillingAddress?: boolean;
  customFields?: Record<string, any>;
}

export interface UpdateAddressInput {
  id: string;
  fullName?: string;
  company?: string;
  streetLine1?: string;
  streetLine2?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  countryCode?: string;
  phoneNumber?: string;
  defaultShippingAddress?: boolean;
  defaultBillingAddress?: boolean;
  customFields?: Record<string, any>;
}

export interface RequestPasswordResetInput {
  emailAddress: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface CustomerAuthState {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginInput {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResult {
  success: boolean;
  errorMessage?: string;
  currentUser?: CurrentUser;
}

export interface CurrentUser {
  id: string;
  identifier: string;
  channels: CurrentUserChannel[];
}

export interface CurrentUserChannel {
  id: string;
  token: string;
  code: string;
  permissions: string[];
}