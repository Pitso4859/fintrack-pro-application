import api from './api';
import { Account } from '../types';

export const accountService = {
    async getAll(): Promise<Account[]> {
        const response = await api.get('/accounts');
        return response.data;
    },

    async getById(id: string): Promise<Account> {
        const response = await api.get(`/accounts/${id}`);
        return response.data;
    },

    async create(account: Partial<Account>): Promise<Account> {
        const response = await api.post('/accounts', account);
        return response.data;
    },

    async update(id: string, account: Partial<Account>): Promise<Account> {
        const response = await api.put(`/accounts/${id}`, account);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/accounts/${id}`);
    },

    async getSummary(): Promise<any> {
        const response = await api.get('/accounts/summary');
        return response.data;
    }
};