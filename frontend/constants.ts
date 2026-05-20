// constants.ts
import { Account, AccountType, Transaction, Currency } from './types.ts';

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
];

export const SARS_CIT_RATE = 0.27; // 27% Corporate Income Tax for SA companies

export const INITIAL_ACCOUNTS: Account[] = [
  { id: '1', name: 'FNB Business Account', code: '1200', type: AccountType.ASSET, balance: 150000 },
  { id: '2', name: 'Trade Debtors', code: '1100', type: AccountType.ASSET, balance: 25000 },
  { id: '3', name: 'Service Revenue', code: '4000', type: AccountType.REVENUE, balance: 0 },
  { id: '4', name: 'Operating Expenses', code: '5100', type: AccountType.EXPENSE, balance: 0 },
  { id: '5', name: 'SARS VAT Control', code: '2200', type: AccountType.LIABILITY, balance: 0 },
  { id: '6', name: 'SARS PAYE Liability', code: '2300', type: AccountType.LIABILITY, balance: 0 },
  { id: '7', name: 'SARS CIT Provision', code: '2400', type: AccountType.LIABILITY, balance: 0 },
  { id: '8', name: 'Equity Capital', code: '3000', type: AccountType.EQUITY, balance: 175000 },
  { id: '9', name: 'Trade Creditors', code: '2100', type: AccountType.LIABILITY, balance: 0 },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    date: '2024-01-01',
    description: 'Initial Business Capital',
    amount: 175000,
    vatAmount: 0,
    vatRate: 0,
    fromAccount: '8',
    toAccount: '1',
    category: 'Capital',
    type: 'JOURNAL'
  }
];

export const VAT_RATES = [
  { label: 'SARS Standard (15%)', value: 0.15 },
  { label: 'SARS Zero-rated (0%)', value: 0.0 },
  { label: 'Exempt', value: 0.0 }
];