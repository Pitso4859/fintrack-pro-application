/**
 * geminiService.ts
 *
 * This service now acts as a client to our backend AI endpoints.
 */

import api from './api';
import { Transaction, Account, AccountType } from '../types';

/**
 * Sends financial data to the backend for a strategic audit.
 * The backend forwards the request to Gemini and returns a Markdown report.
 */
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

/**
 * Asks the AI to suggest an account code and type based on a descriptive name.
 */
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

/**
 * Process an invoice document using the backend AI endpoint.
 * Sends a base64 image to the backend for extraction.
 */
export const processInvoiceDocument = async (
    base64Image: string
): Promise<any | null> => {
  try {
    const response = await api.post('/ai/process-invoice', { base64Image });
    return response.data;
  } catch (error) {
    console.error('Invoice processing error:', error);
    return null;
  }
};