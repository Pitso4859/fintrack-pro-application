import api from './api';
import type {
  Transaction,
  TransactionPage,
  DashboardSummary,
  TransactionType,
  TransactionStatus,
} from '../types';

export interface TransactionFilter {
  type?: TransactionType;
  status?: TransactionStatus;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  size?: number;
}

export interface CreateTransactionPayload {
  type: TransactionType;
  description: string;
  amount: number;
  vatInclusive?: boolean;
  vatAmount?: number;
  supplierName?: string;
  customerName?: string;
  referenceNumber?: string;
  accountId?: string;
  accountCode?: string;
  currency?: string;
  transactionDate?: string;
  notes?: string;
}

export interface UpdateTransactionPayload {
  description?: string;
  amount?: number;
  vatAmount?: number;
  status?: TransactionStatus;
  transactionDate?: string;
  notes?: string;
}

const transactionService = {
  list(filter: TransactionFilter = {}): Promise<TransactionPage> {
    const params = new URLSearchParams();
    if (filter.type)      params.set('type',      filter.type);
    if (filter.status)    params.set('status',    filter.status);
    if (filter.fromDate)  params.set('fromDate',  filter.fromDate);
    if (filter.toDate)    params.set('toDate',    filter.toDate);
    if (filter.search)    params.set('search',    filter.search);
    params.set('page', String(filter.page ?? 0));
    params.set('size', String(filter.size ?? 20));
    return api.get<TransactionPage>(`/transactions?${params}`).then(r => r.data);
  },

  create(payload: CreateTransactionPayload): Promise<Transaction> {
    return api.post<Transaction>('/transactions', payload).then(r => r.data);
  },

  update(id: string, payload: UpdateTransactionPayload): Promise<Transaction> {
    return api.put<Transaction>(`/transactions/${id}`, payload).then(r => r.data);
  },

  delete(id: string): Promise<void> {
    return api.delete(`/transactions/${id}`).then(() => undefined);
  },

  getDashboardSummary(): Promise<DashboardSummary> {
    return api.get<DashboardSummary>('/transactions/summary').then(r => r.data);
  },

  /** Fetch all transactions (for AI analysis) */
  listAll(): Promise<Transaction[]> {
    return api
      .get<TransactionPage>('/transactions?page=0&size=200')
      .then(r => r.data.content);
  },
};

export default transactionService;
