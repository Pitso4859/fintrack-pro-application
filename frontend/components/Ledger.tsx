/**
 * Ledger.tsx
 *
 * Displays the double‑entry ledger with search and CSV export.
 */

import React, { useState, useMemo } from 'react';
import { Transaction, Account, Currency } from '../types.ts';
import { Search, Filter, Download } from 'lucide-react';

interface LedgerProps {
  transactions: Transaction[];
  accounts: Account[];
  currency: Currency;
}

const Ledger: React.FC<LedgerProps> = ({ transactions, accounts, currency }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter transactions based on search query
  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const query = searchQuery.toLowerCase();
    return transactions.filter(tx => {
      const fromAcc = accounts.find(a => a.id === tx.fromAccount);
      const toAcc = accounts.find(a => a.id === tx.toAccount);
      return (
        tx.id.toLowerCase().includes(query) ||
        tx.description.toLowerCase().includes(query) ||
        fromAcc?.name.toLowerCase().includes(query) ||
        toAcc?.name.toLowerCase().includes(query)
      );
    });
  }, [transactions, accounts, searchQuery]);

  // Export filtered transactions as CSV
  const exportCSV = () => {
    const headers = ['Transaction ID', 'Date', 'Description', 'From Account', 'To Account', 'Amount', 'VAT', 'Category', 'Type'];
    const rows = filteredTransactions.map(tx => {
      const fromAcc = accounts.find(a => a.id === tx.fromAccount)?.name || '';
      const toAcc = accounts.find(a => a.id === tx.toAccount)?.name || '';
      return [
        tx.id,
        tx.date,
        tx.description,
        fromAcc,
        toAcc,
        tx.amount.toFixed(2),
        tx.vatAmount.toFixed(2),
        tx.category,
        tx.type,
      ];
    });

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `ledger_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by transaction ID, description, or account name..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex space-x-3">
          <button
            className="flex items-center px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition shadow-sm active:scale-95"
          >
            <Filter size={18} className="mr-2" /> Filter
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold text-sm hover:bg-slate-50 transition shadow-sm active:scale-95"
          >
            <Download size={18} className="mr-2" /> Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-slate-300 text-[10px] font-bold uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Transaction ID</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Journal Entry Details</th>
              <th className="px-6 py-4">Debit ({currency.symbol})</th>
              <th className="px-6 py-4">Credit ({currency.symbol})</th>
              <th className="px-6 py-4">Balance ({currency.symbol})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                  No transactions found.
                </td>
              </tr>
            ) : (
              filteredTransactions.map((tx) => {
                const fromAcc = accounts.find(a => a.id === tx.fromAccount);
                const toAcc = accounts.find(a => a.id === tx.toAccount);

                return (
                  <React.Fragment key={tx.id}>
                    {/* Debit Part */}
                    <tr className="bg-blue-50/20">
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">
                        {tx.id.slice(0, 12)}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600 font-medium">{tx.date}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{toAcc?.name}</p>
                        <p className="text-[11px] text-slate-500 italic mt-0.5">{tx.description}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                        {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-slate-300">—</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-400 italic">Auto</td>
                    </tr>
                    {/* Credit Part */}
                    <tr>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4"></td>
                      <td className="px-6 py-4 pl-12">
                        <p className="text-sm font-bold text-slate-700">{fromAcc?.name}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-300">—</td>
                      <td className="px-6 py-4 text-sm font-bold text-rose-600">
                        {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4"></td>
                    </tr>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Ledger;