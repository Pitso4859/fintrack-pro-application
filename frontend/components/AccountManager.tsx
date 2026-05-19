/**
 * AccountManager.tsx
 * 
 * Manages the Chart of Accounts: view, create, edit, delete accounts.
 * Features:
 * - Display accounts grouped by type (Assets, Liabilities, Equity, Revenue, Expenses)
 * - Create new accounts with name, code, type, and initial balance
 * - Edit existing accounts
 * - Delete accounts (with transaction validation)
 * - AI-powered account suggestions using Gemini
 * - Dynamic currency symbol from parent component
 * 
 * @component
 */

import React, { useState } from 'react';
import { Account, AccountType, Transaction, Currency } from '../types';
import { suggestAccountDetails } from '../services/geminiService';
import api from '../services/api';
import {
  Plus, Trash2, Edit2, ShieldAlert, Check, X,
  AlertCircle, Sparkles, Loader2
} from 'lucide-react';

interface AccountManagerProps {
  /** List of all accounts from parent state */
  accounts: Account[];
  /** Function to update accounts in parent state */
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  /** List of all transactions for validation (prevent deletion of accounts with transactions) */
  transactions: Transaction[];
  /** Current currency settings (code, symbol, name) */
  currency: Currency;
}

const AccountManager: React.FC<AccountManagerProps> = ({ 
  accounts, 
  setAccounts, 
  transactions, 
  currency 
}) => {
  // State for editing mode
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // AI suggestion states
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiGuidance, setAiGuidance] = useState<string | null>(null);
  
  // Form state for new/edit account
  const [formData, setFormData] = useState<Partial<Account>>({
    name: '',
    code: '',
    type: AccountType.ASSET,
    balance: 0, // Initial balance field
  });
  
  // UI states
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle edit button click - populate form with account data
   * @param account - The account to edit
   */
  const handleEdit = (account: Account) => {
    setEditingId(account.id);
    setFormData({
      name: account.name,
      code: account.code,
      type: account.type,
      balance: account.balance,
    });
    setError(null);
    setAiGuidance(null);
  };

  /**
   * Cancel editing - reset form to empty state
   */
  const handleCancel = () => {
    setEditingId(null);
    setFormData({ name: '', code: '', type: AccountType.ASSET, balance: 0 });
    setError(null);
    setAiGuidance(null);
  };

  /**
   * Handle account deletion with validation
   * Prevents deletion if account has any linked transactions
   * @param id - ID of account to delete
   */
  const handleDelete = async (id: string) => {
    // Check if account is used in any transactions
    const hasTransactions = transactions.some(t => t.fromAccount === id || t.toAccount === id);
    if (hasTransactions) {
      setError("Cannot delete account with existing transactions. Please reassign transactions first.");
      return;
    }
    
    // Confirm with user before deletion
    if (!confirm("Are you sure you want to delete this account? This cannot be undone.")) return;

    try {
      // Call backend API to delete
      await api.delete(`/accounts/${id}`);
      // Update local state after successful deletion
      setAccounts(prev => prev.filter(a => a.id !== id));
      setError(null);
    } catch (err) {
      setError("Failed to delete account. Please try again.");
      console.error(err);
    }
  };

  /**
   * Get AI suggestion for account code and type based on name
   * Uses Gemini API through backend proxy
   */
  const handleAiSuggest = async () => {
    if (!formData.name || formData.name.length < 3) {
      setError("Please enter a descriptive account name first.");
      return;
    }

    setIsAiLoading(true);
    setError(null);

    try {
      const suggestion = await suggestAccountDetails(formData.name);
      if (suggestion) {
        setFormData(prev => ({
          ...prev,
          code: suggestion.code,
          type: suggestion.type as AccountType,
        }));
        setAiGuidance(suggestion.reasoning);
      } else {
        setError("AI could not generate a suggestion. Please enter details manually.");
      }
    } catch (e) {
      setError("AI guidance is currently unavailable.");
    } finally {
      setIsAiLoading(false);
    }
  };

  /**
   * Handle form submission for create/update
   * Validates input, checks for duplicate codes, and calls appropriate API
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!formData.name || !formData.code || !formData.type) {
      setError("All fields are required.");
      return;
    }

    // Prepare payload with balance (default to 0 if not provided)
    const payload = {
      ...formData,
      balance: formData.balance ?? 0,
    };

    // Check for duplicate account code
    const isDuplicateCode = accounts.some(a => a.code === formData.code && a.id !== editingId);
    if (isDuplicateCode) {
      setError("Account code must be unique.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        // UPDATE existing account
        const { data } = await api.put(`/accounts/${editingId}`, payload);
        setAccounts(prev => prev.map(a => (a.id === editingId ? data : a)));
        setEditingId(null);
      } else {
        // CREATE new account
        const { data } = await api.post('/accounts', payload);
        setAccounts(prev => [...prev, data]);
      }

      // Reset form after successful operation
      setFormData({ name: '', code: '', type: AccountType.ASSET, balance: 0 });
      setAiGuidance(null);
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to save account. Please check your input.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Group accounts by their type for organized display
   */
  const groupedAccounts = accounts.reduce((acc, curr) => {
    if (!acc[curr.type]) acc[curr.type] = [];
    acc[curr.type].push(curr);
    return acc;
  }, {} as Record<AccountType, Account[]>);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Left column - Account list */}
      <div className="lg:col-span-2 space-y-6">
        {/* Error message display */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start text-rose-700 animate-in shake duration-300">
            <AlertCircle size={18} className="mr-3 mt-0.5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Accounts list container */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Chart of Accounts</h3>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {accounts.length} Active Accounts
            </span>
          </div>

          {/* Grouped accounts by type */}
          <div className="divide-y divide-slate-100">
            {(Object.keys(groupedAccounts) as AccountType[]).map(type => (
              <div key={type} className="px-8 py-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 mb-4 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                  {type}s
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedAccounts[type].map(account => (
                    <div
                      key={account.id}
                      className={`group p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                        editingId === account.id
                          ? 'border-blue-500 bg-blue-50/30'
                          : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        {/* Account code badge */}
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center font-mono text-[10px] font-black text-slate-400">
                          {account.code}
                        </div>
                        <div>
                          {/* Account name */}
                          <p className="text-sm font-bold text-slate-800 leading-tight">{account.name}</p>
                          {/* Account balance with dynamic currency symbol */}
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                            Balance: {currency.symbol}{account.balance.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {/* Action buttons (edit/delete) - visible on hover */}
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(account)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit account"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete account"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column - Create/Edit Form */}
      <div className="lg:col-span-1">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 sticky top-24">
          {/* Form header */}
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center">
              {editingId ? (
                <>
                  <Edit2 className="mr-3 text-blue-600" size={18} />
                  Edit Account
                </>
              ) : (
                <>
                  <Plus className="mr-3 text-emerald-600" size={20} />
                  New Account
                </>
              )}
            </h3>
            {editingId && (
              <button
                onClick={handleCancel}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Cancel editing"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Account form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Name field with AI suggestion button */}
            <div className="relative">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Account Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. PayPal Balance"
                  className="flex-1 px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium bg-slate-50/30 transition-all"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  disabled={isSubmitting}
                />
                {/* AI suggestion button (only for new accounts, not edit) */}
                {!editingId && (
                  <button
                    type="button"
                    onClick={handleAiSuggest}
                    disabled={isAiLoading || !formData.name || isSubmitting}
                    className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all disabled:opacity-30 group relative"
                    title="Get AI Suggestion"
                  >
                    {isAiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  </button>
                )}
              </div>
            </div>

            {/* AI Guidance message */}
            {aiGuidance && (
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl animate-in fade-in zoom-in-95 duration-300">
                <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-1 flex items-center">
                  <Sparkles size={10} className="mr-1.5" /> AI Recommendation
                </p>
                <p className="text-[11px] text-indigo-600 leading-relaxed italic">{aiGuidance}</p>
              </div>
            )}

            {/* Account Code field */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Account Code
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1250"
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-mono font-bold bg-slate-50/30 transition-all"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                disabled={isSubmitting}
              />
              <p className="mt-2 text-[10px] text-slate-400 flex items-center">
                <ShieldAlert size={10} className="mr-1" /> Use unique codes for reporting
              </p>
            </div>

            {/* Account Type/Classification dropdown */}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                Classification
              </label>
              <select
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold bg-slate-50/30 transition-all appearance-none cursor-pointer"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as AccountType })}
                disabled={isSubmitting}
              >
                {Object.values(AccountType).map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

           {/* 👇 Initial Balance field with dynamic currency symbol */}
<div>
  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
    Initial Balance ({currency.symbol})
  </label>
  <div className="relative">
    
    {/* Dynamic currency symbol instead of hardcoded $ */}
    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
      {currency.symbol}
    </span>
    <input
      type="number"
      step="0.01"
      placeholder="0.00"
      className="w-full pl-10 pr-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold bg-slate-50/30 transition-all"
      //Use empty string when value is 0 to allow clean typing
      value={formData.balance === 0 ? '' : formData.balance}
      onChange={e => {
        // Allow empty input (treat as 0 when saving)
        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
        setFormData({ ...formData, balance: value });
      }}
      disabled={isSubmitting}
    />
  </div>
  <p className="mt-1 text-[9px] text-slate-400">
    This balance will be overwritten by transaction history unless this account is excluded from auto‑calculation.
  </p>
</div>            
            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center ${
                editingId
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                  : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : editingId ? (
                <Check size={16} className="mr-2" />
              ) : (
                <Plus size={16} className="mr-2" />
              )}
              {editingId ? 'Update Account' : 'Create Account'}
            </button>
          </form>

          {/* Pro Tip section - only show when not editing and no AI guidance */}
          {!editingId && !aiGuidance && (
            <div className="mt-12 p-6 bg-amber-50 rounded-2xl border border-amber-100">
              <h4 className="text-[10px] font-black uppercase text-amber-700 mb-2 flex items-center">
                <AlertCircle size={12} className="mr-1.5" /> Pro Tip
              </h4>
              <p className="text-[11px] text-amber-600 leading-relaxed font-medium">
                Standard codes: Assets (1xxx), Liabilities (2xxx), Equity (3xxx), Revenue (4xxx), Expenses (5xxx+).
                Use the balance field to set an opening balance when creating an account.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountManager;