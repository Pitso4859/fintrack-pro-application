import api from './api';
import type { Account, AccountType, AccountSuggestion } from '../types';

export interface CreateAccountPayload {
  code: string;
  name: string;
  type: AccountType;
  description?: string;
  vatApplicable?: boolean;
  currency?: string;
}

export interface UpdateAccountPayload {
  name?: string;
  description?: string;
  vatApplicable?: boolean;
  isActive?: boolean;
}

const accountService = {
  list(): Promise<Account[]> {
    return api.get<Account[]>('/accounts').then(r => r.data);
  },

  listByType(type: AccountType): Promise<Account[]> {
    return api.get<Account[]>(`/accounts?type=${type}`).then(r => r.data);
  },

  create(payload: CreateAccountPayload): Promise<Account> {
    return api.post<Account>('/accounts', payload).then(r => r.data);
  },

  update(id: string, payload: UpdateAccountPayload): Promise<Account> {
    return api.put<Account>(`/accounts/${id}`, payload).then(r => r.data);
  },

  delete(id: string): Promise<void> {
    return api.delete(`/accounts/${id}`).then(() => undefined);
  },

  suggest(accountName: string): Promise<AccountSuggestion> {
    return api
      .post<AccountSuggestion>('/ai/suggest-account', { accountName })
      .then(r => r.data);
  },
};

export default accountService;
