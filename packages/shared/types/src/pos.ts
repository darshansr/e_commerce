/**
 * POS-specific types for offline-first terminal operations
 */

import type { Address, Asset, CurrencyCode } from './common';
import type { Customer } from './customer';
import type { TaxLine } from './order';
import type { ProductVariant } from './product';

export interface PosTerminal {
  id: string;
  name: string;
  code: string;
  location: PosLocation;
  configuration: PosTerminalConfiguration;
  status: 'ONLINE' | 'OFFLINE' | 'SYNCING' | 'ERROR';
  lastSyncAt?: string;
  currentShift?: PosShift;
}

export interface PosLocation {
  id: string;
  name: string;
  code: string;
  address: Address;
  timezone: string;
  currencyCode: CurrencyCode;
  taxIncluded: boolean;
}

export interface PosTerminalConfiguration {
  receiptPrinter?: HardwareDevice;
  cashDrawer?: HardwareDevice;
  barcodeScanner?: HardwareDevice;
  paymentTerminal?: PaymentTerminalConfig;
  defaultCustomerId?: string;
  allowAnonymousSales: boolean;
  requireCustomerForReturns: boolean;
  maxCashRefundAmount: number;
  enabledPaymentMethods: PaymentMethodType[];
  offlineEnabled: boolean;
  offlineMaxOrders: number;
  offlineMaxAgeHours: number;
}

export interface HardwareDevice {
  id: string;
  type: 'RECEIPT_PRINTER' | 'CASH_DRAWER' | 'BARCODE_SCANNER' | 'CUSTOMER_DISPLAY' | 'SCALE';
  name: string;
  connectionType: 'USB' | 'BLUETOOTH' | 'NETWORK' | 'SERIAL';
  connectionConfig: Record<string, string>;
  driver: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastHeartbeat?: string;
}

export interface PaymentTerminalConfig {
  provider: 'STRIPE_TERMINAL' | 'ADYEN' | 'RAZORPAY' | 'CUSTOM';
  terminalId: string;
  locationId: string;
  config: Record<string, string>;
}

export type PaymentMethodType = 
  | 'CASH'
  | 'CARD'
  | 'UPI'
  | 'WALLET'
  | 'STORE_CREDIT'
  | 'GIFT_CARD'
  | 'LOYALTY_POINTS'
  | 'SPLIT_TENDER';

export interface PosShift {
  id: string;
  terminalId: string;
  cashierId: string;
  openedAt: string;
  closedAt?: string;
  openingFloat: CashDenomination[];
  closingFloat?: CashDenomination[];
  expectedCash: number;
  actualCash?: number;
  variance?: number;
  salesSummary: PosSalesSummary;
  status: 'OPEN' | 'CLOSED' | 'RECONCILED';
}

export interface CashDenomination {
  denomination: number;
  count: number;
  total: number;
}

export interface PosSalesSummary {
  totalSales: number;
  totalTransactions: number;
  totalItemsSold: number;
  cashSales: number;
  cardSales: number;
  upiSales: number;
  walletSales: number;
  storeCreditSales: number;
  giftCardSales: number;
  refunds: number;
  refundCount: number;
  discounts: number;
  taxCollected: number;
  averageTransactionValue: number;
}

export interface OfflineOrder {
  id: string;
  localId: string;
  terminalId: string;
  cashierId: string;
  createdAt: string;
  updatedAt: string;
  items: OfflineOrderItem[];
  customerId?: string;
  payments: OfflinePayment[];
  status: 'PENDING_SYNC' | 'SYNCING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
  syncAttempts: number;
  lastSyncAttempt?: string;
  syncError?: string;
  serverOrderId?: string;
  serverOrderCode?: string;
}

export interface OfflineOrderItem {
  id: string;
  productVariantId: string;
  productVariantSku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitPriceWithTax: number;
  totalPrice: number;
  totalPriceWithTax: number;
  discounts: OfflineDiscount[];
  taxLines: TaxLine[];
  customFields: Record<string, any>;
}

export interface OfflinePayment {
  id: string;
  method: PaymentMethodType;
  amount: number;
  reference?: string;
  metadata: Record<string, string>;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface OfflineDiscount {
  type: 'PROMOTION' | 'MANUAL' | 'LOYALTY' | 'STAFF';
  description: string;
  amount: number;
  amountWithTax: number;
  promotionId?: string;
}

export interface SyncResult {
  success: boolean;
  syncedOrders: number;
  failedOrders: number;
  conflicts: SyncConflict[];
  errors: SyncError[];
}

export interface SyncConflict {
  localOrderId: string;
  serverOrderId: string;
  conflictType: 'VERSION_MISMATCH' | 'STOCK_UNAVAILABLE' | 'PRICE_CHANGED' | 'CUSTOMER_MERGED' | 'PAYMENT_FAILED';
  localData: any;
  serverData: any;
  resolution: 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGE' | 'MANUAL';
  resolvedData?: any;
}

export interface SyncError {
  localOrderId: string;
  error: string;
  code: string;
  retryable: boolean;
}

export interface PosCart {
  id: string;
  items: PosCartItem[];
  customer?: Customer;
  subtotal: number;
  subtotalWithTax: number;
  tax: number;
  total: number;
  totalWithTax: number;
  discounts: OfflineDiscount[];
  appliedCoupons: string[];
  loyaltyPointsUsed: number;
  storeCreditUsed: number;
  payments: PosPayment[];
  changeDue: number;
  isComplete: boolean;
}

export interface PosCartItem {
  id: string;
  productVariant: ProductVariant;
  quantity: number;
  unitPrice: number;
  unitPriceWithTax: number;
  totalPrice: number;
  totalPriceWithTax: number;
  discounts: OfflineDiscount[];
  notes?: string;
}

export interface PosPayment {
  id: string;
  method: PaymentMethodType;
  amount: number;
  reference?: string;
  metadata: Record<string, string>;
  status: 'PENDING' | 'AUTHORIZED' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  terminalTransactionId?: string;
}

export interface ScanResult {
  type: 'PRODUCT' | 'CUSTOMER' | 'COUPON' | 'GIFT_CARD' | 'LOYALTY_CARD' | 'UNKNOWN';
  value: string;
  data?: any;
}

export interface BarcodeScanEvent {
  barcode: string;
  timestamp: number;
  source: 'CAMERA' | 'HARDWARE_SCANNER' | 'MANUAL_ENTRY';
}

export interface PosReceipt {
  orderId: string;
  orderCode: string;
  terminalId: string;
  terminalName: string;
  locationName: string;
  cashierName: string;
  createdAt: string;
  items: PosReceiptItem[];
  payments: PosReceiptPayment[];
  subtotal: number;
  tax: number;
  total: number;
  changeDue: number;
  loyaltyPointsEarned: number;
  loyaltyPointsBalance: number;
  storeCreditBalance: number;
  returnPolicy?: string;
  qrCode?: string;
}

export interface PosReceiptItem {
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitPriceWithTax: number;
  totalPrice: number;
  totalPriceWithTax: number;
  discounts: OfflineDiscount[];
}

export interface PosReceiptPayment {
  method: PaymentMethodType;
  amount: number;
  reference?: string;
}