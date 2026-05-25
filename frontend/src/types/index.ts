// ============================================================
// FinTrack Pro — Shared TypeScript Types
// ============================================================

// ----------------------------------------------------------------
// AUTH
// ----------------------------------------------------------------
export interface UserInfo {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  taxNumber?: string;
  vatNumber?: string;
  role: 'ADMIN' | 'ACCOUNTANT' | 'VIEWER';
  defaultCurrency: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserInfo;
}

// ----------------------------------------------------------------
// TRANSACTIONS
// ----------------------------------------------------------------
export type TransactionType =
  | 'INVOICE'
  | 'EXPENSE'
  | 'TRANSFER'
  | 'JOURNAL'
  | 'CREDIT_NOTE'
  | 'DEBIT_NOTE';

export type TransactionStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'RECONCILED';

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  vatAmount: number;
  netAmount: number;
  currency: string;
  description: string;
  referenceNumber?: string;
  supplierName?: string;
  customerName?: string;
  accountId?: string;
  accountCode?: string;
  transactionDate: string;   // ISO date string "YYYY-MM-DD"
  status: TransactionStatus;
  invoiceImageUrl?: string;
  aiProcessed: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionPage {
  content: Transaction[];
  totalElements: number;
  totalPages: number;
  number: number;       // current page (0-indexed)
  size: number;
  last: boolean;
  first: boolean;
}

export interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalVat: number;
  periodStart: string;
  periodEnd: string;
}

export interface MonthlyChartPoint {
  month: string;
  revenue: number;
  expenses: number;
}

// ----------------------------------------------------------------
// ACCOUNTS (Chart of Accounts)
// ----------------------------------------------------------------
export type AccountType =
  | 'ASSET'
  | 'LIABILITY'
  | 'EQUITY'
  | 'REVENUE'
  | 'EXPENSE';

export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface Account {
  id: string;
  userId: string;
  code: string;
  name: string;
  type: AccountType;
  normalBalance: NormalBalance;
  balance: number;
  currency: string;
  description?: string;
  vatApplicable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ----------------------------------------------------------------
// AI
// ----------------------------------------------------------------
export interface AIAnalysisRequest {
  query: string;
}

export interface AIAnalysisResponse {
  result: string;
}

export interface InvoiceOCRResult {
  supplierName?: string;
  invoiceNumber?: string;
  date?: string;
  totalAmount?: number;
  totalVat?: number;
  vatRate?: number;
  currency?: string;
  lineItems?: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vatAmount: number;
}

export interface AccountSuggestion {
  type: AccountType;
  code: string;
  normalBalance: NormalBalance;
  vatApplicable: boolean;
  description: string;
}

// ----------------------------------------------------------------
// API — generic wrappers
// ----------------------------------------------------------------
export interface ApiError {
  title: string;
  detail: string;
  status: number;
  instance: string;
  timestamp: string;
  fieldErrors?: Record<string, string>;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

// ----------------------------------------------------------------
// REPORTS
// ----------------------------------------------------------------
export interface IncomeStatementRow {
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  amount: number;
  currency: string;
}

export interface IncomeStatement {
  periodStart: string;
  periodEnd: string;
  revenue: IncomeStatementRow[];
  expenses: IncomeStatementRow[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  vatCollected: number;
  vatPaid: number;
  netVat: number;
}

export interface VATReport {
  periodStart: string;
  periodEnd: string;
  outputVat: number;     // VAT on sales (invoices)
  inputVat: number;      // VAT on purchases (expenses)
  netVatPayable: number; // Output - Input
  currency: string;
}
