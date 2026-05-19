/**
 * geminiService.ts
 *
 * This service now acts as a client to our backend AI endpoints.
 */

import api from './api';
import { Transaction, Account, AccountType } from '../types';

export const analyzeFinances = async (
    transactions: Transaction[],
    accounts: Account[],
    query?: string
): Promise<string> => {
  try {
    const response = await api.post('/ai/analyze', {
      query: query || "Provide a comprehensive audit of my current financial position.",
    });
    return response.data.result;
  } catch (error) {
    console.error('AI analysis error:', error);
    return 'The SARS AI module is currently experiencing technical difficulties. Please try again later.';
  }
};

export const suggestAccountDetails = async (
    accountName: string
): Promise<{ code: string; type: AccountType; reasoning: string } | null> => {
  try {
    const response = await api.post('/ai/suggest-account', { accountName });
    return response.data;
  } catch (error) {
    console.error('AI suggestion error:', error);
    return null;
  }
};

export const processInvoiceDocument = async (base64Image: string): Promise<any | null> => {
  // This endpoint is not available on the backend yet
  // Return null to trigger manual entry
  return null;
};