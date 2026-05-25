// ============================================================
// FinTrack Pro — Utility Functions
// ============================================================

// ----------------------------------------------------------------
// CURRENCY
// ----------------------------------------------------------------
export function formatCurrency(
  amount: number,
  currency = 'ZAR',
  locale = 'en-ZA'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCompact(amount: number, currency = 'ZAR'): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${currency} ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${currency} ${(amount / 1_000).toFixed(1)}k`;
  }
  return formatCurrency(amount, currency);
}

// ----------------------------------------------------------------
// VAT (South African 15%)
// ----------------------------------------------------------------
const VAT_RATE = 0.15;

export function calculateVatFromInclusive(amount: number): number {
  return parseFloat((amount * VAT_RATE / (1 + VAT_RATE)).toFixed(2));
}

export function calculateVatFromExclusive(amount: number): number {
  return parseFloat((amount * VAT_RATE).toFixed(2));
}

export function addVat(amount: number): number {
  return parseFloat((amount * (1 + VAT_RATE)).toFixed(2));
}

// ----------------------------------------------------------------
// DATES
// ----------------------------------------------------------------
export function formatDate(
  dateStr: string | Date,
  locale = 'en-ZA',
  options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString(locale, options);
}

export function formatDateTime(dateStr: string | Date): string {
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  return d.toLocaleString('en-ZA', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getMonthRange(date = new Date()): { from: string; to: string } {
  const from = new Date(date.getFullYear(), date.getMonth(), 1);
  const to   = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { from: toISODate(from), to: toISODate(to) };
}

export function getYearRange(date = new Date()): { from: string; to: string } {
  const from = new Date(date.getFullYear(), 0, 1);
  const to   = new Date(date.getFullYear(), 11, 31);
  return { from: toISODate(from), to: toISODate(to) };
}

/** South African fiscal year: 1 Mar – 28/29 Feb */
export function getSARSFiscalYear(date = new Date()): { from: string; to: string } {
  const year = date.getMonth() >= 2 ? date.getFullYear() : date.getFullYear() - 1;
  return {
    from: `${year}-03-01`,
    to:   `${year + 1}-02-28`,
  };
}

// ----------------------------------------------------------------
// NUMBERS
// ----------------------------------------------------------------
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return parseFloat(((current - previous) / Math.abs(previous) * 100).toFixed(1));
}

// ----------------------------------------------------------------
// STRINGS
// ----------------------------------------------------------------
export function truncate(str: string, maxLength = 40): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

export function initials(firstName?: string, lastName?: string): string {
  return `${(firstName?.[0] ?? '').toUpperCase()}${(lastName?.[0] ?? '').toUpperCase()}`;
}

// ----------------------------------------------------------------
// TRANSACTION TYPE HELPERS
// ----------------------------------------------------------------
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INVOICE:     'Invoice',
  EXPENSE:     'Expense',
  TRANSFER:    'Transfer',
  JOURNAL:     'Journal Entry',
  CREDIT_NOTE: 'Credit Note',
  DEBIT_NOTE:  'Debit Note',
};

export const TRANSACTION_TYPE_COLORS: Record<string, string> = {
  INVOICE:     'text-emerald-400',
  EXPENSE:     'text-rose-400',
  TRANSFER:    'text-blue-400',
  JOURNAL:     'text-purple-400',
  CREDIT_NOTE: 'text-cyan-400',
  DEBIT_NOTE:  'text-orange-400',
};

export const STATUS_BADGE_CLASS: Record<string, string> = {
  APPROVED:   'badge badge-green',
  PENDING:    'badge badge-amber',
  REJECTED:   'badge badge-red',
  RECONCILED: 'badge badge-blue',
};

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  ASSET:     'Asset',
  LIABILITY: 'Liability',
  EQUITY:    'Equity',
  REVENUE:   'Revenue',
  EXPENSE:   'Expense',
};
