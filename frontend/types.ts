/**
 * Author: Nkotolane Pitso (Software Developer Intern)
 * File: types.ts
 * Description: TypeScript type definitions for the FinTrack Pro application
 */

/**
 * Account types based on standard accounting principles
 */
export enum AccountType {
  ASSET = 'Asset',
  LIABILITY = 'Liability',
  EQUITY = 'Equity',
  REVENUE = 'Revenue',
  EXPENSE = 'Expense'
}

/**
 * Currency configuration for multi-currency support
 */
export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

/**
 * Account model
 */
export interface Account {
  id: string;
  name: string;
  code: string;
  type: AccountType;
  balance: number;
  userId?: string;
  createdAt?: string;
}

/**
 * Line item in an invoice/bill
 */
export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vatAmount: number;
}

/**
 * Bill model
 */
export interface Bill {
  id: string;
  supplierName: string;
  invoiceNumber: string;
  date: string;
  lineItems: LineItem[];
  totalAmount: number;
  totalVat: number;
  currency: string;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
  documentData?: string;
  depositRequired?: number;
  userId?: string;
}

/**
 * Asset record
 */
export interface AssetRecord {
  id: string;
  name: string;
  category: string;
  purchaseDate: string;
  purchasePrice: number;
  supplierName: string;
  warrantyExpiry?: string;
  serialNumber?: string;
  location?: string;
  status: 'ACTIVE' | 'DISPOSED' | 'MAINTENANCE';
  documentData?: string;
  transactionId?: string;
  userId?: string;
}

/**
 * Transaction model
 */
export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  vatAmount: number;
  vatRate: number;
  fromAccount: string;
  toAccount: string;
  category: string;
  type: 'INVOICE' | 'EXPENSE' | 'JOURNAL';
  isVatClaimed?: boolean;
  documentData?: string;
  billId?: string;
  userId?: string;
  createdAt?: string;
}

/**
 * Financial report summary
 */
export interface FinancialReport {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  vatOwed: number;
  vatClaimable: number;
  cashInHand: number;
}

/**
 * View states for navigation
 */
export type ViewState =
    | 'DASHBOARD'
    | 'LEDGER'
    | 'TRANSACTIONS'
    | 'REPORTS'
    | 'VAT'
    | 'AI_INSIGHTS'
    | 'ACCOUNT_MANAGEMENT'
    | 'VAT201'
    | 'CIT_RETURN'
    | 'INVOICE_INBOX'
    | 'ASSET_REGISTER';

/**
 * User model
 */
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

/**
 * User Settings
 */
export interface UserSettings {
  preferredCurrency: string;
  dateFormat: string;
  emailNotifications: boolean;
  twoFactorEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

/**
 * Authentication State
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Login Credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Register Credentials
 */
export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword?: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  taxNumber?: string;
  phone?: string;
}

/**
 * Password Reset Types
 */
export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}