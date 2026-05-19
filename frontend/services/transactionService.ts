import api from './api';
import { Transaction } from '../types';

export const transactionService = {
    async getAll(): Promise<Transaction[]> {
        const response = await api.get('/transactions');
        return response.data;
    },

    async getById(id: string): Promise<Transaction> {
        const response = await api.get(`/transactions/${id}`);
        return response.data;
    },

    async create(transaction: Partial<Transaction>): Promise<Transaction> {
        const response = await api.post('/transactions', transaction);
        return response.data;
    },

    async updateVatClaim(id: string, isVatClaimed: boolean): Promise<Transaction> {
        const response = await api.put(`/transactions/${id}`, { isVatClaimed });
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await api.delete(`/transactions/${id}`);
    }
};