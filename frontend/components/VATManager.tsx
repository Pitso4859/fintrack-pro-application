/**
 * VATManager.tsx
 *
 * SARS Compliance Center: displays VAT and CIT summaries, and allows claiming/unclaiming
 * input VAT on expense transactions. Now with loading state for claim actions.
 */

import React, { useState, useMemo } from 'react';
import { Transaction, Currency } from '../types';
import { SARS_CIT_RATE } from '../constants';
import {
  Percent,
  ShieldCheck,
  Landmark,
  Info,
  CheckCircle2,
  AlertCircle,
  Tag,
  Loader2,
} from 'lucide-react';
import api from '../services/api';

interface VATManagerProps {
  transactions: Transaction[];
  currency: Currency;
  onToggleVatClaim: (txIds: string[]) => void;
  onGenerateVAT201: () => void;
  onGenerateCIT: () => void;
}

const VATManager: React.FC<VATManagerProps> = ({
                                                 transactions,
                                                 currency,
                                                 onToggleVatClaim,
                                                 onGenerateVAT201,
                                                 onGenerateCIT,
                                               }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // VAT Calculations
  const outputVat = transactions
      .filter(t => t.type === 'INVOICE')
      .reduce((sum, t) => sum + t.vatAmount, 0);

  const claimedInputVat = transactions
      .filter(t => t.type === 'EXPENSE' && t.isVatClaimed)
      .reduce((sum, t) => sum + t.vatAmount, 0);

  const potentialUnclaimedVat = transactions
      .filter(t => t.type === 'EXPENSE' && !t.isVatClaimed && t.vatAmount > 0)
      .reduce((sum, t) => sum + t.vatAmount, 0);

  const netVatPayable = outputVat - claimedInputVat;

  // Category Breakdown for Claimed VAT
  const claimedVatByCategory = useMemo(() => {
    const breakdown: Record<string, number> = {};
    transactions
        .filter(t => t.type === 'EXPENSE' && t.isVatClaimed)
        .forEach(tx => {
          const cat = tx.category || 'Uncategorized';
          breakdown[cat] = (breakdown[cat] || 0) + tx.vatAmount;
        });
    return Object.entries(breakdown)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // Profit/CIT Estimate
  const totalRevenue = transactions
      .filter(t => t.type === 'INVOICE')
      .reduce((sum, t) => sum + (t.amount - t.vatAmount), 0);

  const totalExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + (t.amount - t.vatAmount), 0);

  const netProfit = Math.max(0, totalRevenue - totalExpenses);
  const citEstimate = netProfit * SARS_CIT_RATE;

  // Selection Logic
  const unclaimedExpenses = transactions.filter(
      t => t.type === 'EXPENSE' && !t.isVatClaimed && t.vatAmount > 0
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === unclaimedExpenses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(unclaimedExpenses.map(t => t.id));
    }
  };

  const handleClaim = async () => {
    if (selectedIds.length === 0) return;
    setIsClaiming(true);
    setError(null);
    try {
      // Update each transaction individually
      for (const id of selectedIds) {
        await api.put(`/transactions/${id}`, { is_vat_claimed: true });
      }
      onToggleVatClaim(selectedIds);
      setSelectedIds([]);
    } catch (error) {
      console.error('Claim failed', error);
      setError('Failed to claim VAT. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleUnclaim = async (id: string) => {
    setIsClaiming(true);
    setError(null);
    try {
      await api.put(`/transactions/${id}`, { is_vat_claimed: false });
      onToggleVatClaim([id]);
    } catch (error) {
      console.error('Unclaim failed', error);
      setError('Failed to unclaim VAT.');
    } finally {
      setIsClaiming(false);
    }
  };

  return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">
              SARS Compliance Center
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              Official Tax Reconciliations & Filing Estimators
            </p>
          </div>
          <div className="flex space-x-2">
          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black border border-blue-100 flex items-center">
            <Info size={12} className="mr-1" /> SARS-READY
          </span>
          </div>
        </div>

        {error && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start text-rose-700">
              <AlertCircle size={18} className="mr-3 mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
            <span className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Percent size={20} />
            </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              VAT (Standard 15%)
            </span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">
              {currency.symbol}
              {Math.abs(netVatPayable).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-tighter">
              {netVatPayable >= 0 ? 'Payable to SARS' : 'Reclaimable from SARS'}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-[10px] font-bold">
            <span className="text-emerald-600">
              CLAIMED: {currency.symbol}
              {claimedInputVat.toFixed(2)}
            </span>
              <span className="text-rose-600">
              OUTPUT: {currency.symbol}
                {outputVat.toFixed(2)}
            </span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
            <span className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Landmark size={20} />
            </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              CIT Provision (27%)
            </span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">
              {currency.symbol}
              {citEstimate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-tighter">
              EST. BASED ON {currency.symbol}
              {netProfit.toLocaleString()} PROFIT
            </p>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-[10px] text-slate-400">
              <Info size={12} className="mr-1" /> Provision for year-end assessment
            </div>
          </div>

          <div className="bg-emerald-50 p-8 rounded-[2rem] shadow-sm border border-emerald-100 group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
            <span className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
              <CheckCircle2 size={20} />
            </span>
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
              Potential Reclaims
            </span>
            </div>
            <h3 className="text-3xl font-bold text-emerald-900">
              {currency.symbol}
              {potentialUnclaimedVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-xs text-emerald-600 mt-2 font-bold uppercase tracking-tighter">
              UNCLAIMED VAT ON EXPENSES
            </p>
            <div className="mt-4 pt-4 border-t border-emerald-100 flex items-center text-[10px] text-emerald-500">
              <AlertCircle size={12} className="mr-1" /> Select items below to claim
            </div>
          </div>
        </div>

        {/* Claimed VAT Breakdown by Category */}
        {claimedVatByCategory.length > 0 && (
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
              <h4 className="font-bold text-slate-800 mb-6 flex items-center">
                <Tag size={18} className="mr-2 text-indigo-500" />
                Claimed VAT Breakdown by Category
              </h4>
              <div className="flex flex-wrap gap-4">
                {claimedVatByCategory.map(cat => (
                    <div
                        key={cat.name}
                        className="bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 flex flex-col min-w-[140px]"
                    >
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                  {cat.name}
                </span>
                      <span className="text-lg font-bold text-slate-900">
                  {currency.symbol}
                        {cat.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                      <div className="mt-2 w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                        <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(100, (cat.amount / claimedInputVat) * 100)}%`,
                            }}
                        />
                      </div>
                    </div>
                ))}
              </div>
            </div>
        )}

        {/* VAT Reclaim Queue */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800">VAT Reclaim Queue</h3>
              <p className="text-xs text-slate-400 font-medium">
                Flag expense transactions as having valid tax invoices for Input VAT claiming.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {selectedIds.length > 0 && (
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 animate-in zoom-in-95 duration-200">
                {selectedIds.length} items selected
              </span>
              )}
              <button
                  onClick={handleClaim}
                  disabled={selectedIds.length === 0 || isClaiming}
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition disabled:opacity-30 active:scale-95 shadow-lg shadow-slate-200 flex items-center"
              >
                {isClaiming ? (
                    <>
                      <Loader2 size={14} className="animate-spin mr-2" />
                      Processing...
                    </>
                ) : (
                    'Claim Selected VAT'
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-4 w-12">
                  <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={
                          unclaimedExpenses.length > 0 &&
                          selectedIds.length === unclaimedExpenses.length
                      }
                      onChange={selectAll}
                      disabled={isClaiming}
                  />
                </th>
                <th className="px-4 py-4">Date / Reference</th>
                <th className="px-4 py-4">Expense Description</th>
                <th className="px-4 py-4 text-right">Net</th>
                <th className="px-4 py-4 text-right">VAT Amount</th>
                <th className="px-8 py-4 text-right">Gross Total</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
              {unclaimedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center opacity-40">
                        <ShieldCheck size={48} className="text-slate-300 mb-4" />
                        <p className="text-sm font-medium text-slate-500">
                          No unclaimed VAT detected in your ledger.
                        </p>
                      </div>
                    </td>
                  </tr>
              ) : (
                  unclaimedExpenses.map(tx => (
                      <tr
                          key={tx.id}
                          className={`hover:bg-slate-50 transition-colors ${
                              selectedIds.includes(tx.id) ? 'bg-blue-50/30' : ''
                          }`}
                      >
                        <td className="px-8 py-4">
                          <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              checked={selectedIds.includes(tx.id)}
                              onChange={() => toggleSelect(tx.id)}
                              disabled={isClaiming}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-bold text-slate-900">{tx.date}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {tx.id.slice(0, 8)}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-semibold text-slate-700">
                            {tx.description}
                          </p>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-tighter">
                        {tx.category}
                      </span>
                        </td>
                        <td className="px-4 py-4 text-right text-xs font-medium text-slate-500">
                          {currency.symbol}
                          {(tx.amount - tx.vatAmount).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="text-sm font-bold text-rose-600">
                            {currency.symbol}
                            {tx.vatAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold">
                            @{(tx.vatRate * 100).toFixed(0)}%
                          </p>
                        </td>
                        <td className="px-8 py-4 text-right">
                      <span className="text-sm font-black text-slate-900">
                        {currency.symbol}
                        {tx.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                        </td>
                      </tr>
                  ))
              )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Claimed VAT History / Overview */}
        <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center">
            <CheckCircle2 size={18} className="mr-2 text-emerald-600" />
            Successfully Reconciled VAT Invoices
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {transactions
                .filter(t => t.type === 'EXPENSE' && t.isVatClaimed)
                .slice(0, 8)
                .map(tx => (
                    <div
                        key={tx.id}
                        className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between"
                    >
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">
                          {tx.date}
                        </p>
                        <p className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                          {tx.description}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-emerald-600">
                          {currency.symbol}
                          {tx.vatAmount.toFixed(2)}
                        </p>
                        <button
                            onClick={() => handleUnclaim(tx.id)}
                            disabled={isClaiming}
                            className="text-[9px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-tighter disabled:opacity-50"
                        >
                          Unclaim
                        </button>
                      </div>
                    </div>
                ))}
            {transactions.filter(t => t.type === 'EXPENSE' && t.isVatClaimed).length === 0 && (
                <div className="col-span-full py-4 text-center text-xs text-slate-400 italic">
                  No claimed VAT transactions found.
                </div>
            )}
          </div>
        </div>

        {/* Submission Card */}
        <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between overflow-hidden relative border border-slate-800">
          <div className="relative z-10 space-y-4 text-center md:text-left">
            <h3 className="text-3xl font-black tracking-tight leading-none">
              Automated Tax Filings
            </h3>
            <p className="text-slate-400 max-w-lg font-medium text-sm leading-relaxed">
              Your VAT201 figures are generated using AI-verified double-entry data. Flagging valid
              invoices ensures you maximize your legal reclaims while remaining audit-compliant.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                  onClick={onGenerateVAT201}
                  disabled={isClaiming}
                  className="bg-blue-600 text-white font-black px-8 py-3 rounded-2xl shadow-xl hover:bg-blue-500 transition-all uppercase tracking-tighter text-xs disabled:opacity-50"
              >
                Generate VAT201 Form
              </button>
              <button
                  onClick={onGenerateCIT}
                  disabled={isClaiming}
                  className="bg-white/10 text-white border border-white/20 font-black px-8 py-3 rounded-2xl hover:bg-white/20 transition-all uppercase tracking-tighter text-xs disabled:opacity-50"
              >
                CIT Provisional Return
              </button>
            </div>
          </div>
          <div className="mt-10 md:mt-0 relative">
            <ShieldCheck size={180} className="text-blue-500/20 rotate-12" />
            <div className="absolute inset-0 flex items-center justify-center">
            <span className="bg-blue-600 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest shadow-lg">
              Verified
            </span>
            </div>
          </div>
        </div>
      </div>
  );
};

export default VATManager;