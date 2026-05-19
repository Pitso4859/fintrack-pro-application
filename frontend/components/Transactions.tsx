/**
 * Transactions.tsx
 *
 * Form to create new journal entries (INVOICE, EXPENSE, JOURNAL).
 * Now connected to the backend: posts the transaction and updates the list with the server response.
 */

import React, { useState, useMemo } from 'react';
import { Account, Transaction, Currency } from '../types.ts';
import { VAT_RATES } from '../constants.ts';
import { PlusCircle, Info, Calculator, ArrowRightLeft, RefreshCw, Tag, Loader2, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface TransactionsProps {
  transactions: Transaction[];
  accounts: Account[];
  onAdd: (tx: Transaction) => void;
  currency: Currency;
}

const COMMON_CATEGORIES = [
  'Office Supplies',
  'Travel',
  'Utilities',
  'Rent',
  'Salaries',
  'Marketing',
  'Consulting',
  'Equipment',
  'Software',
  'General',
  'Other',
];

// Helper to convert camelCase frontend transaction to snake_case for backend
const toSnakeCase = (tx: Partial<Transaction>) => ({
  transaction_date: tx.date,
  description: tx.description,
  amount: tx.amount,
  vat_amount: tx.vatAmount,
  vat_rate: tx.vatRate,
  from_account_id: tx.fromAccount,
  to_account_id: tx.toAccount,
  category: tx.category,
  type: tx.type,
  is_vat_claimed: tx.isVatClaimed ?? false,
  document_data: tx.documentData,
  bill_id: tx.billId,
});

// Helper to convert snake_case backend response to camelCase frontend Transaction
const toCamelCase = (data: any): Transaction => ({
  id: data.id,
  date: data.transaction_date,
  description: data.description,
  amount: data.amount,
  vatAmount: data.vat_amount,
  vatRate: data.vat_rate,
  fromAccount: data.from_account_id,
  toAccount: data.to_account_id,
  category: data.category,
  type: data.type,
  isVatClaimed: data.is_vat_claimed,
  documentData: data.document_data,
  billId: data.bill_id,
});

const Transactions: React.FC<TransactionsProps> = ({ transactions, accounts, onAdd, currency }) => {
  const [calculationMode, setCalculationMode] = useState<'NET' | 'GROSS'>('NET');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    inputValue: 0,
    vatRate: 0.15,
    fromAccount: '',
    toAccount: '',
    category: 'General',
    customCategory: '',
    type: 'INVOICE' as 'INVOICE' | 'EXPENSE' | 'JOURNAL',
  });

  // Helper for accounting-grade precision rounding
  const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  // Real-time calculations for the preview with support for back-calculating from Gross
  const vatCalculations = useMemo(() => {
    const val = formData.inputValue || 0;
    let net = 0;
    let vat = 0;
    let gross = 0;

    if (calculationMode === 'NET') {
      net = round(val);
      vat = round(net * formData.vatRate);
      gross = round(net + vat);
    } else {
      gross = round(val);
      net = round(gross / (1 + formData.vatRate));
      vat = round(gross - net);
    }

    return { net, vat, gross };
  }, [formData.inputValue, formData.vatRate, calculationMode]);

  // ------------------------------------------------------------------------
  // Submit handler – calls backend and then updates local state via onAdd
  // ------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalCategory = formData.category === 'Other' ? (formData.customCategory || 'Other') : formData.category;

    // Build payload (camelCase, then convert to snake_case for backend)
    const newTxPayload = {
      date: formData.date,
      description: formData.description,
      amount: vatCalculations.gross,
      vatAmount: vatCalculations.vat,
      vatRate: formData.vatRate,
      fromAccount: formData.fromAccount,
      toAccount: formData.toAccount,
      category: finalCategory,
      type: formData.type,
      isVatClaimed: false,
    };

    setIsSubmitting(true);
    try {
      const response = await api.post('/transactions', toSnakeCase(newTxPayload));
      const createdTx = toCamelCase(response.data);
      onAdd(createdTx); // add to parent state

      // Reset form
      setFormData(prev => ({
        ...prev,
        description: '',
        inputValue: 0,
        customCategory: '',
      }));
      setShowCustomCategory(false);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to create transaction.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, category: value });
    setShowCustomCategory(value === 'Other');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 sticky top-24">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 flex items-center">
              <PlusCircle className="mr-2 text-blue-500" size={18} />
              New Entry
            </h3>
            <button
              type="button"
              onClick={() => setCalculationMode(prev => (prev === 'NET' ? 'GROSS' : 'NET'))}
              className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors flex items-center"
              disabled={isSubmitting}
            >
              <RefreshCw size={12} className="mr-1.5" />
              Mode: {calculationMode}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-start text-rose-700 text-xs">
              <AlertCircle size={14} className="mr-2 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Transaction Class
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['INVOICE', 'EXPENSE', 'JOURNAL'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type as any })}
                    disabled={isSubmitting}
                    className={`py-2 text-[10px] font-black rounded-xl border transition-all ${
                      formData.type === type
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    } disabled:opacity-50`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Description
              </label>
              <input
                type="text"
                required
                placeholder="Business activity description..."
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium bg-slate-50/50 transition-all"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                Category
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <select
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold bg-slate-50/50 appearance-none cursor-pointer transition-all pr-10"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    disabled={isSubmitting}
                  >
                    {COMMON_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <Tag size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {showCustomCategory && (
                  <input
                    type="text"
                    placeholder="Enter custom category name..."
                    className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium bg-white transition-all animate-in slide-in-from-top-2"
                    value={formData.customCategory}
                    onChange={e => setFormData({ ...formData, customCategory: e.target.value })}
                    required={formData.category === 'Other'}
                    disabled={isSubmitting}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  {calculationMode === 'NET' ? 'Net Amount' : 'Total (Gross)'} ({currency.symbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold bg-white transition-all"
                  value={formData.inputValue || ''}
                  onChange={e => setFormData({ ...formData, inputValue: parseFloat(e.target.value) || 0 })}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  VAT Rate
                </label>
                <select
                  className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-bold bg-slate-50/50 appearance-none cursor-pointer transition-all"
                  value={formData.vatRate}
                  onChange={e => setFormData({ ...formData, vatRate: parseFloat(e.target.value) })}
                  disabled={isSubmitting}
                >
                  {VAT_RATES.map(rate => (
                    <option key={rate.value} value={rate.value}>
                      {rate.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Precision Preview Card */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-slate-200 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Calculator size={64} />
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <span>Verification</span>
                <span>ZAR Accuracy</span>
              </div>
              <div className="space-y-2 relative z-10">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Net Component</span>
                  <span className="font-mono">
                    {currency.symbol}
                    {vatCalculations.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">VAT ({(formData.vatRate * 100).toFixed(1)}%)</span>
                  <span className="font-mono text-blue-400">
                    +{currency.symbol}
                    {vatCalculations.vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between text-lg font-black italic">
                  <span>Gross Total</span>
                  <span className="text-emerald-400">
                    {currency.symbol}
                    {vatCalculations.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Double Entry Routing
              </label>
              <div className="p-4 bg-blue-50/30 border border-blue-100 rounded-2xl space-y-3">
                <div className="flex items-center text-xs">
                  <span className="w-20 font-black text-blue-600 uppercase tracking-tighter">Credit (From)</span>
                  <select
                    required
                    className="flex-1 bg-transparent outline-none font-bold text-slate-700 cursor-pointer"
                    value={formData.fromAccount}
                    onChange={e => setFormData({ ...formData, fromAccount: e.target.value })}
                    disabled={isSubmitting}
                  >
                    <option value="">Select Account</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center text-xs">
                  <span className="w-20 font-black text-indigo-600 uppercase tracking-tighter">Debit (To)</span>
                  <select
                    required
                    className="flex-1 bg-transparent outline-none font-bold text-slate-700 cursor-pointer"
                    value={formData.toAccount}
                    onChange={e => setFormData({ ...formData, toAccount: e.target.value })}
                    disabled={isSubmitting}
                  >
                    <option value="">Select Account</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-[0.98] flex items-center justify-center uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  POSTING...
                </>
              ) : (
                'Post to Audit Ledger'
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800">Ledger Activity</h3>
              <p className="text-xs text-slate-400">Chronological history of all financial movements</p>
            </div>
            <span className="text-[10px] font-black px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full flex items-center border border-emerald-200">
              <Info size={12} className="mr-1.5" /> RECONCILED
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Period / Ref</th>
                  <th className="px-6 py-5">Journal Narrative</th>
                  <th className="px-6 py-5 text-right">Net Component</th>
                  <th className="px-6 py-5 text-right">SARS VAT</th>
                  <th className="px-8 py-5 text-right">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center opacity-30">
                        <Calculator size={48} className="mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest">Awaiting First Entry</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="text-xs text-slate-900 font-bold mb-1">{tx.date}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                          {tx.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center mb-1.5">
                          <p className="text-sm font-bold text-slate-900 mr-2">{tx.description}</p>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-lg font-black border uppercase tracking-tighter ${
                              tx.type === 'INVOICE'
                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                : tx.type === 'EXPENSE'
                                ? 'bg-rose-50 text-rose-600 border-rose-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </div>
                        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          <ArrowRightLeft size={12} className="mr-1.5 text-blue-400" />
                          <span>
                            {accounts.find(a => a.id === tx.fromAccount)?.name}{' '}
                            <span className="mx-1 text-slate-300">➔</span>{' '}
                            {accounts.find(a => a.id === tx.toAccount)?.name}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center">
                          <Tag size={10} className="text-slate-400 mr-1" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {tx.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right text-xs font-bold text-slate-400">
                        {currency.symbol}
                        {(tx.amount - tx.vatAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-black text-blue-600">
                            {currency.symbol}
                            {tx.vatAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">
                            @{(tx.vatRate * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-sm font-black text-slate-900">
                          {currency.symbol}
                          {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transactions;