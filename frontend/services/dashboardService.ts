import api from './api';

export const dashboardService = {
    async getStats(): Promise<any> {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },

    async getProfitAndLoss(year: number): Promise<any> {
        const response = await api.get(`/reports/pnl/${year}`);
        return response.data;
    },

    async getVAT201(): Promise<any> {
        const response = await api.get('/reports/vat201');
        return response.data;
    },

    async getTrialBalance(): Promise<any> {
        const response = await api.get('/reports/trial-balance');
        return response.data;
    }
};