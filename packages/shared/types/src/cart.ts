/**
 * Cart-related types shared across storefront and POS
 */

import type {
  Address,
  Asset,
  Country,
  CountryTranslation,
  CurrencyCode,
  LanguageCode,
} from './common';
import type {
  FulfillmentState,
  OrderState,
  PaymentState,
  RefundState,
  TaxLine,
  TransactionKind,
  TransactionState,
} from './order';
import type { Customer } from './customer';
import type { Product, ProductVariant } from './product';

export interface ActiveOrder {
  id: string;
  code: string;
  state: OrderState;
  active: boolean;
  orderPlacedAt?: string;
  nextStates: OrderState[];
  modifications: OrderModification[];
  lines: OrderLine[];
  shippingAddress?: Address;
  billingAddress?: Address;
  customer?: Customer;
  shippingLines: ShippingLine[];
  payments: Payment[];
  surcharges: Surcharge[];
  promotions: Promotion[];
  coupons: Coupon[];
  subTotal: number;
  subTotalWithTax: number;
  shipping: number;
  shippingWithTax: number;
  total: number;
  totalWithTax: number;
  totalQuantity: number;
  currencyCode: CurrencyCode;
  discounts: Discount[];
  taxSummary: TaxSummary[];
  shippingMethod?: ShippingMethod;
  customFields: {
    posTerminalId?: string;
    cashierId?: string;
    isOfflineOrder?: boolean;
    offlineSyncId?: string;
  };
}

export interface OrderLine {
  id: string;
  productVariant: ProductVariant;
  product: Product;
  unitPrice: number;
  unitPriceWithTax: number;
  discountedUnitPrice: number;
  discountedUnitPriceWithTax: number;
  quantity: number;
  linePrice: number;
  linePriceWithTax: number;
  discountedLinePrice: number;
  discountedLinePriceWithTax: number;
  items: OrderItem[];
  featuredAsset?: Asset;
  adjustments: Adjustment[];
  taxLines: TaxLine[];
  discounts: Discount[];
  promotions: Promotion[];
  customFields: {
    loyaltyPointsEarned?: number;
  };
}

export interface OrderItem {
  id: string;
  cancelled: boolean;
  fulfilment?: Fulfillment;
  refundId?: string;
  adjustments: Adjustment[];
}

export interface Adjustment {
  adjustmentSource: string;
  type: 'PROMOTION' | 'DISTRIBUTED_ORDER_PROMOTION' | 'SURCHARGE' | 'TAX' | 'MANUAL';
  description: string;
  amount: number;
  amountWithTax: number;
}

export interface OrderModification {
  id: string;
  createdAt: string;
  updatedAt: string;
  note: string;
  surcharges: Surcharge[];
  orderItems: OrderItem[];
}

export interface ShippingLine {
  id: string;
  shippingMethod: ShippingMethod;
  price: number;
  priceWithTax: number;
  discountedPrice: number;
  discountedPriceWithTax: number;
  taxLines: TaxLine[];
  discounts: Discount[];
}

export interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  description: string;
  fulfillmentHandlerCode: string;
  checker: ShippingEligibilityChecker;
  calculator: ShippingCalculator;
  translations: ShippingMethodTranslation[];
  customFields: Record<string, any>;
}

export interface ShippingEligibilityChecker {
  code: string;
  arguments: ShippingCheckerArgument[];
}

export interface ShippingCheckerArgument {
  name: string;
  value: string;
  description: string;
}

export interface ShippingCalculator {
  code: string;
  arguments: ShippingCalculatorArgument[];
}

export interface ShippingCalculatorArgument {
  name: string;
  value: string;
  description: string;
}

export interface ShippingMethodTranslation {
  id: string;
  languageCode: LanguageCode;
  name: string;
  description: string;
}

export interface Payment {
  id: string;
  createdAt: string;
  updatedAt: string;
  method: string;
  amount: number;
  state: PaymentState;
  metadata: Record<string, string>;
  refunds: Refund[];
  transactions: Transaction[];
}

export interface Refund {
  id: string;
  createdAt: string;
  updatedAt: string;
  amount: number;
  state: RefundState;
  reason: string;
  paymentId: string;
  items: RefundItem[];
  shipping: number;
  adjustment: number;
  transactionId?: string;
}

export interface RefundItem {
  id: string;
  orderLine: OrderLine;
  quantity: number;
}

export interface Transaction {
  id: string;
  createdAt: string;
  updatedAt: string;
  amount: number;
  state: TransactionState;
  kind: TransactionKind;
  metadata: Record<string, string>;
}

export interface Surcharge {
  id: string;
  description: string;
  price: number;
  priceWithTax: number;
  taxLines: TaxLine[];
  taxRate: number;
}

export interface Promotion {
  id: string;
  couponCode?: string;
  name: string;
  enabled: boolean;
  startsAt?: string;
  endsAt?: string;
  promotionConditions: PromotionCondition[];
  promotionActions: PromotionAction[];
}

export interface PromotionCondition {
  id: string;
  code: string;
  args: PromotionConditionArgument[];
}

export interface PromotionConditionArgument {
  name: string;
  value: string;
}

export interface PromotionAction {
  id: string;
  code: string;
  args: PromotionActionArgument[];
}

export interface PromotionActionArgument {
  name: string;
  value: string;
}

export interface Coupon {
  code: string;
  promotions: Promotion[];
}

export interface Discount {
  adjustmentSource: string;
  type: 'PROMOTION' | 'DISTRIBUTED_ORDER_PROMOTION' | 'SURCHARGE' | 'TAX' | 'MANUAL';
  description: string;
  amount: number;
  amountWithTax: number;
}

export interface TaxSummary {
  description: string;
  taxRate: number;
  taxTotal: number;
  netTotal: number;
}

export interface Fulfillment {
  id: string;
  createdAt: string;
  updatedAt: string;
  state: FulfillmentState;
  nextStates: FulfillmentState[];
  method: string;
  trackingCode?: string;
  trackingUrl?: string;
  lines: FulfillmentLine[];
}

export interface FulfillmentLine {
  orderLine: OrderLine;
  quantity: number;
}

export interface CartState {
  order: ActiveOrder | null;
  isLoading: boolean;
  error: string | null;
}

export interface AddItemToCartInput {
  productVariantId: string;
  quantity: number;
  customFields?: Record<string, any>;
}

export interface UpdateCartItemInput {
  orderLineId: string;
  quantity: number;
}

export interface RemoveItemFromCartInput {
  orderLineId: string;
}

export interface ApplyCouponInput {
  couponCode: string;
}

export interface RemoveCouponInput {
  couponCode: string;
}

export interface TransitionOrderStateInput {
  state: OrderState;
}

export interface SetShippingAddressInput {
  address: AddressInput;
}

export interface SetBillingAddressInput {
  address: AddressInput;
}

export interface SetShippingMethodInput {
  shippingMethodId: string;
}

export interface AddPaymentToOrderInput {
  method: string;
  metadata?: Record<string, string>;
}

export interface AddressInput {
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