/**
 * Reports.tsx
 *
 * Displays financial reports: Profit & Loss, Balance Sheet, and Trial Balance.
 * All data is derived from the accounts and transactions props – no direct API calls.
 * The Print button triggers the browser's print dialog.
 */

import React, { useState, useMemo } from 'react';
import { Account, Transaction, AccountType, Currency } from '../types.ts';
import { FileText, Printer, CheckCircle2, AlertCircle, Scale, TrendingUp, Landmark } from 'lucide-react';

interface ReportsProps {
  accounts: Account[];
  transactions: Transaction[];
  currency: Currency;
}

type ReportType = 'PL' | 'BS' | 'TB';

const Reports: React.FC<ReportsProps> = ({ accounts, transactions, currency }) => {
  const [reportType, setReportType] = useState<ReportType>('PL');

  // ------------------------------------------------------------------------
  // Calculations for the reports
  // ------------------------------------------------------------------------
  const revenueAccs = accounts.filter(a => a.type === AccountType.REVENUE);
  const expenseAccs = accounts.filter(a => a.type === AccountType.EXPENSE);
  const totalRevenue = revenueAccs.reduce((sum, a) => sum + a.balance, 0);
  const totalExpenses = expenseAccs.reduce((sum, a) => sum + a.balance, 0);
  const netProfit = totalRevenue - totalExpenses;

  const assets = accounts.filter(a => a.type === AccountType.ASSET);
  const liabilities = accounts.filter(a => a.type === AccountType.LIABILITY);
  const equity = accounts.filter(a => a.type === AccountType.EQUITY);

  const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
  const totalLiabilities = liabilities.reduce((sum, a) => sum + a.balance, 0);
  const totalEquity = equity.reduce((sum, a) => sum + a.balance, 0) + netProfit; // include current year profit

  // Trial Balance
  const trialBalanceData = useMemo(() => {
    let totalDebits = 0;
    let totalCredits = 0;

    const rows = accounts.map(acc => {
      let debit = 0;
      let credit = 0;
      const bal = acc.balance;

      if (acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE) {
        if (bal >= 0) debit = bal; else credit = Math.abs(bal);
      } else {
        if (bal >= 0) credit = bal; else debit = Math.abs(bal);
      }

      totalDebits += debit;
      totalCredits += credit;

      return { ...acc, debit, credit };
    });

    return { rows, totalDebits, totalCredits };
  }, [accounts]);

  const isBalanced = Math.abs(trialBalanceData.totalDebits - trialBalanceData.totalCredits) < 0.01;

  // ------------------------------------------------------------------------
  // Print handler
  // ------------------------------------------------------------------------
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-20">
      {/* Report Selector */}
      <div className="flex flex-wrap items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div className="flex bg-slate-100 p-1 rounded-xl">
          {[
            { id: 'PL', label: 'Profit & Loss', icon: TrendingUp },
            { id: 'BS', label: 'Balance Sheet', icon: Landmark },
            { id: 'TB', label: 'Trial Balance', icon: Scale },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setReportType(type.id as ReportType)}
              className={`flex items-center px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                reportType === type.id
                  ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <type.icon size={14} className="mr-2" />
              {type.label}
            </button>
          ))}
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-lg active:scale-95"
        >
          <Printer size={16} className="mr-2" /> Print Statement
        </button>
      </div>

      {/* Actual Statement */}
      <div className="bg-white p-16 rounded-[3rem] shadow-2xl border border-slate-100 font-serif relative overflow-hidden print:shadow-none print:border-0">
        {/* Header Section */}
        <div className="text-center mb-16 border-b-2 border-slate-900 pb-12 relative z-10">
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">
            FinTrack <span className="text-blue-600">Pro</span>
          </h2>
          <p className="text-slate-500 text-sm italic font-medium">Official Financial Statement Transcript</p>
          <div className="mt-6 inline-flex flex-col items-center">
            <h3 className="text-xl font-bold text-slate-900 uppercase tracking-widest bg-slate-100 px-6 py-2 rounded-full mb-3">
              {reportType === 'PL'
                ? 'Income Statement'
                : reportType === 'BS'
                ? 'Statement of Financial Position'
                : 'Statement of Trial Balances'}
            </h3>
            <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.3em]">
              {currency.code} ({currency.symbol}) • PERIOD ENDED DEC 31, 2024
            </p>
          </div>
        </div>

        {/* Content Section */}
        <div className="relative z-10 min-h-[500px]">
          {reportType === 'PL' && (
            <div className="space-y-10">
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-blue-600">I. Operating Revenue</h4>
                  <div className="h-px bg-blue-100 flex-1 mx-4"></div>
                </div>
                <div className="space-y-3 px-4">
                  {revenueAccs.map(acc => (
                    <div key={acc.id} className="flex justify-between items-end border-b border-slate-50 pb-1">
                      <span className="text-sm text-slate-700 italic">{acc.name}</span>
                      <span className="font-mono text-sm font-bold text-slate-900">
                        {currency.symbol}
                        {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-4 font-black text-slate-900 uppercase text-sm border-t-2 border-slate-200">
                    <span>Total Revenue</span>
                    <span className="border-b-4 border-double border-slate-900">
                      {currency.symbol}
                      {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </section>

              <section>
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xs font-black uppercase tracking-widest text-rose-600">II. Operating Expenses</h4>
                  <div className="h-px bg-rose-100 flex-1 mx-4"></div>
                </div>
                <div className="space-y-3 px-4">
                  {expenseAccs.length > 0 ? (
                    expenseAccs.map(acc => (
                      <div key={acc.id} className="flex justify-between items-end border-b border-slate-50 pb-1">
                        <span className="text-sm text-slate-700 italic">{acc.name}</span>
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {currency.symbol}
                          {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No expense activity recorded in this period.</p>
                  )}
                  <div className="flex justify-between pt-4 font-black text-slate-900 uppercase text-sm border-t-2 border-slate-200">
                    <span>Total Operating Expenses</span>
                    <span>
                      ({currency.symbol}
                      {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                    </span>
                  </div>
                </div>
              </section>

              <section
                className={`mt-16 p-10 rounded-[2.5rem] flex justify-between items-center shadow-2xl ${
                  netProfit >= 0 ? 'bg-slate-900 text-white' : 'bg-rose-900 text-white'
                }`}
              >
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">
                    Net Income / (Loss)
                  </h5>
                  <p className="text-sm font-medium opacity-80 leading-tight max-w-xs italic">
                    Final result of all revenue and expense activities for the reporting period.
                  </p>
                </div>
                <span className="text-5xl font-black italic tracking-tighter">
                  {currency.symbol}
                  {Math.abs(netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </section>
            </div>
          )}

          {reportType === 'BS' && (
            <div className="space-y-12">
              {/* Assets */}
              <section>
                <h4 className="text-xs font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2 rounded-lg mb-6 inline-block">
                  ASSETS
                </h4>
                <div className="space-y-3 px-4 border-l-2 border-slate-100">
                  {assets.map(acc => (
                    <div key={acc.id} className="flex justify-between py-1 text-sm border-b border-slate-50">
                      <span className="text-slate-600 italic">{acc.name}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {currency.symbol}
                        {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-6 font-black text-slate-900 uppercase text-base border-t-2 border-slate-900">
                    <span>Total Assets</span>
                    <span className="border-b-4 border-double border-slate-900">
                      {currency.symbol}
                      {totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </section>

              {/* Liabilities */}
              <section>
                <h4 className="text-xs font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2 rounded-lg mb-6 inline-block">
                  LIABILITIES
                </h4>
                <div className="space-y-3 px-4 border-l-2 border-slate-100">
                  {liabilities.length > 0 ? (
                    liabilities.map(acc => (
                      <div key={acc.id} className="flex justify-between py-1 text-sm border-b border-slate-50">
                        <span className="text-slate-600 italic">{acc.name}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {currency.symbol}
                          {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No current liabilities detected.</p>
                  )}
                  <div className="flex justify-between pt-4 font-black text-slate-900 uppercase text-sm border-t border-slate-200">
                    <span>Total Liabilities</span>
                    <span>
                      {currency.symbol}
                      {totalLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </section>

              {/* Equity */}
              <section>
                <h4 className="text-xs font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2 rounded-lg mb-6 inline-block">
                  EQUITY
                </h4>
                <div className="space-y-3 px-4 border-l-2 border-slate-100">
                  {equity.map(acc => (
                    <div key={acc.id} className="flex justify-between py-1 text-sm border-b border-slate-50">
                      <span className="text-slate-600 italic">{acc.name}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {currency.symbol}
                        {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 text-sm border-b border-slate-50 bg-blue-50/50 -mx-2 px-2 rounded">
                    <span className="text-blue-700 italic font-medium">Retained Earnings (Current Year Profit)</span>
                    <span className="font-mono font-bold text-blue-700">
                      {currency.symbol}
                      {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between pt-4 font-black text-slate-900 uppercase text-sm border-t border-slate-200">
                    <span>Total Equity</span>
                    <span>
                      {currency.symbol}
                      {totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </section>

              {/* Balancing Equation Check */}
              <section className="pt-10 border-t-4 border-slate-900">
                <div className="flex justify-between items-center px-4">
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                      Total Liabilities & Equity
                    </p>
                    <p className="text-3xl font-black text-slate-900 italic tracking-tighter">
                      {currency.symbol}
                      {(totalLiabilities + totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? (
                    <div className="flex items-center text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 animate-in bounce duration-500">
                      <CheckCircle2 size={16} className="mr-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Statement Balanced</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-rose-600 bg-rose-50 px-4 py-2 rounded-full border border-rose-100">
                      <AlertCircle size={16} className="mr-2" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Out of Balance</span>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          {reportType === 'TB' && (
            <div className="space-y-8">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b-2 border-slate-900">
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="px-4 py-4 w-16">Code</th>
                      <th className="px-4 py-4">Account Description</th>
                      <th className="px-4 py-4 text-right">Debit ({currency.symbol})</th>
                      <th className="px-4 py-4 text-right">Credit ({currency.symbol})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {trialBalanceData.rows.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-slate-400">{row.code}</td>
                        <td className="px-4 py-3 text-sm font-bold text-slate-800 italic">{row.name}</td>
                        <td className="px-4 py-3 text-right font-mono text-sm">
                          {row.debit > 0 ? row.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm">
                          {row.credit > 0 ? row.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-900 bg-slate-900 text-white">
                    <tr className="font-black text-sm uppercase">
                      <td className="px-4 py-6" colSpan={2}>
                        Aggregate Totals
                      </td>
                      <td className="px-4 py-6 text-right font-mono border-b-4 border-double border-white/40">
                        {trialBalanceData.totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-6 text-right font-mono border-b-4 border-double border-white/40">
                        {trialBalanceData.totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {!isBalanced && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-[2rem] flex items-center text-rose-700">
                  <AlertCircle size={24} className="mr-4 shrink-0" />
                  <div>
                    <p className="font-bold text-sm uppercase tracking-tight">Ledger Discrepancy Detected</p>
                    <p className="text-xs opacity-80">
                      Total Debits and Credits do not match. Please verify the double‑entry routing in the journal
                      ledger.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-20 border-t border-slate-100 pt-8 flex justify-between items-end grayscale opacity-50">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            <p>Certified Document ID: {Math.random().toString(36).substr(2, 12).toUpperCase()}</p>
            <p>System Verifier: FinTrack Engine v4.0</p>
          </div>
          <div className="text-right">
            <Landmark size={48} className="inline-block text-slate-300" />
          </div>
        </div>

        {/* Watermark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[35deg] pointer-events-none opacity-[0.02] text-[15rem] font-black whitespace-nowrap select-none">
          PRO CERTIFIED
        </div>
      </div>
    </div>
  );
};

export default Reports;