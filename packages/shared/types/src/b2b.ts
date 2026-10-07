/**
 * B2B-specific types for institutional/school customers
 */

import type { Address, CurrencyCode } from './common';
import type { Customer, OrderSummary } from './customer';
import type { ProductVariant } from './product';

export interface Company {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL';
  parentCompanyId?: string;
  parentCompany?: Company;
  children: Company[];
  billingAddress: Address;
  shippingAddresses: Address[];
  users: CompanyUser[];
  creditLimit: number;
  availableCredit: number;
  paymentTerms: PaymentTerms;
  taxNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  customFields: {
    institutionType?: 'SCHOOL' | 'LIBRARY' | 'CORPORATE' | 'UNIVERSITY' | 'GOVERNMENT' | 'NON_PROFIT';
    affiliationNumber?: string;
    principalName?: string;
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
    purchaseOrderRequired: boolean;
    approvalRequiredAbove?: number;
  };
}

export interface CompanyUser {
  id: string;
  companyId: string;
  company?: Company;
  customerId: string;
  customer?: Customer;
  roles: CompanyRole[];
  permissions: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  lastLoginAt?: string;
}

export type CompanyRole = 
  | 'OWNER'
  | 'ADMIN'
  | 'PURCHASER'
  | 'APPROVER'
  | 'VIEWER'
  | 'ACCOUNTANT';

export interface CompanyAddress extends Address {
  isDefaultBilling: boolean;
  isDefaultShipping: boolean;
}

export interface Quote {
  id: string;
  code: string;
  companyId: string;
  company?: Company;
  customerId: string;
  customer?: Customer;
  status: QuoteStatus;
  version: number;
  items: QuoteItem[];
  subtotal: number;
  tax: number;
  total: number;
  currencyCode: CurrencyCode;
  validUntil: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  convertedToOrderId?: string;
  notes?: string;
  internalNotes?: string;
  approvals: QuoteApproval[];
  createdAt: string;
  updatedAt: string;
}

export type QuoteStatus = 
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CONVERTED'
  | 'WITHDRAWN';

export interface QuoteItem {
  id: string;
  quoteId: string;
  productVariantId: string;
  productVariant?: ProductVariant;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  unitPriceWithTax: number;
  totalPrice: number;
  totalPriceWithTax: number;
  discount: number;
  taxRate: number;
  notes?: string;
}

export interface QuoteApproval {
  id: string;
  quoteId: string;
  approverId: string;
  approver?: CompanyUser;
  role: CompanyRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comment?: string;
  actedAt?: string;
  level: number;
  required: boolean;
}

export interface ApprovalChain {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  rules: ApprovalRule[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRule {
  id: string;
  chainId: string;
  condition: ApprovalCondition;
  approvers: ApprovalRuleApprover[];
  level: number;
  isRequired: boolean;
  timeoutHours?: number;
  escalationApproverId?: string;
}

export interface ApprovalCondition {
  type: 'AMOUNT_GTE' | 'AMOUNT_LTE' | 'CATEGORY' | 'PAYMENT_TERMS' | 'CUSTOM';
  field?: string;
  operator?: 'GTE' | 'LTE' | 'EQ' | 'IN' | 'NOT_IN';
  value?: string | number;
  customExpression?: string;
}

export interface ApprovalRuleApprover {
  userId: string;
  user?: CompanyUser;
  role: CompanyRole;
  isPrimary: boolean;
}

export interface ShoppingList {
  id: string;
  companyId: string;
  company?: Company;
  createdById: string;
  createdBy?: CompanyUser;
  name: string;
  description?: string;
  items: ShoppingListItem[];
  isShared: boolean;
  sharedWith: CompanyUser[];
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: string;
  listId: string;
  productVariantId: string;
  productVariant?: ProductVariant;
  quantity: number;
  notes?: string;
  addedAt: string;
}

export interface QuickOrderItem {
  sku: string;
  quantity: number;
}

export interface QuickOrderRequest {
  items: QuickOrderItem[];
  shippingAddressId?: string;
  billingAddressId?: string;
  paymentTerms?: PaymentTerms;
  purchaseOrderNumber?: string;
  notes?: string;
}

export interface QuickOrderResult {
  success: boolean;
  order?: OrderSummary;
  errors: QuickOrderError[];
  warnings: QuickOrderWarning[];
  unavailableItems: UnavailableItem[];
  substitutedItems: SubstitutedItem[];
}

export interface QuickOrderError {
  sku: string;
  code: string;
  message: string;
}

export interface QuickOrderWarning {
  sku: string;
  code: string;
  message: string;
}

export interface UnavailableItem {
  sku: string;
  requestedQuantity: number;
  availableQuantity: number;
  reason: 'OUT_OF_STOCK' | 'DISCONTINUED' | 'RESTRICTED' | 'PRICE_CHANGED';
}

export interface SubstitutedItem {
  requestedSku: string;
  substitutedSku: string;
  reason: string;
  priceDifference: number;
}

export interface ContractPrice {
  id: string;
  companyId: string;
  productVariantId: string;
  productVariant?: ProductVariant;
  price: number;
  currencyCode: CurrencyCode;
  validFrom: string;
  validTo?: string;
  minQuantity?: number;
  maxQuantity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTerms {
  code: string;
  name: string;
  days: number;
  discountPercent?: number;
  discountDays?: number;
}

export interface CreditApplication {
  id: string;
  companyId: string;
  company?: Company;
  requestedLimit: number;
  approvedLimit?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUIRES_REVIEW';
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyStatement {
  companyId: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  invoices: CompanyInvoice[];
  payments: CompanyPayment[];
  creditNotes: CompanyCreditNote[];
  closingBalance: number;
  overdueAmount: number;
  currentAmount: number;
}

export interface CompanyInvoice {
  id: string;
  orderId: string;
  orderCode: string;
  date: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  balance: number;
  status: 'PAID' | 'PARTIAL' | 'OVERDUE' | 'PENDING';
}

export interface CompanyPayment {
  id: string;
  date: string;
  amount: number;
  method: string;
  reference?: string;
  allocatedInvoices: string[];
}

export interface CompanyCreditNote {
  id: string;
  orderId: string;
  date: string;
  amount: number;
  reason: string;
  status: 'ISSUED' | 'ALLOCATED' | 'EXPIRED';
}

export interface B2BCustomer extends Customer {
  companyId?: string;
  company?: Company;
  companyRoles?: CompanyRole[];
  companyPermissions?: string[];
}

export type PaymentTermsCode = 'NET_15' | 'NET_30' | 'NET_45' | 'NET_60' | 'COD' | 'PREPAID' | 'CUSTOM';