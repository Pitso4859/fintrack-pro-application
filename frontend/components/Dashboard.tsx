/**
 * Dashboard.tsx
 *
 * Displays key financial metrics, a revenue vs expenses chart (now dynamic),
 * asset health bars, and recent transactions.
 */

import React, { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, PieChart as PieIcon, Activity, ArrowRight,
} from 'lucide-react';
import { Account, Transaction, AccountType, Currency } from '../types.ts';

interface DashboardProps {
  accounts: Account[];
  transactions: Transaction[];
  currency: Currency;
}

const Dashboard: React.FC<DashboardProps> = ({ accounts, transactions, currency }) => {
  // ------------------------------------------------------------------------
  // Helper: get balance for a specific account by code (fallback to name)
  // ------------------------------------------------------------------------
  const getAccountBalance = (code: string, fallbackName?: string): number => {
    const acc = accounts.find(a => a.code === code) ||
        (fallbackName ? accounts.find(a => a.name === fallbackName) : undefined);
    return acc?.balance || 0;
  };

  // ------------------------------------------------------------------------
  // Calculate total revenue from transactions (not account balances)
  // ------------------------------------------------------------------------
  const totalRevenueFromTx = useMemo(() => {
    return transactions
        .filter(tx => tx.type === 'INVOICE')
        .reduce((sum, tx) => sum + (tx.amount - tx.vatAmount), 0);
  }, [transactions]);

  // ------------------------------------------------------------------------
  // Calculate total expenses from transactions (not account balances)
  // ------------------------------------------------------------------------
  const totalExpensesFromTx = useMemo(() => {
    return transactions
        .filter(tx => tx.type === 'EXPENSE')
        .reduce((sum, tx) => sum + (tx.amount - tx.vatAmount), 0);
  }, [transactions]);

  // ------------------------------------------------------------------------
  // Stats cards – using transaction data for accurate totals
  // ------------------------------------------------------------------------
  const stats = [
    {
      title: 'Cash at Bank',
      value: getAccountBalance('1200', 'FNB Business Account'),
      icon: DollarSign,
      color: 'bg-blue-500',
      trend: '+12.5%',
    },
    {
      title: 'Total Revenue',
      value: totalRevenueFromTx,
      icon: TrendingUp,
      color: 'bg-emerald-500',
      trend: '+5.2%',
    },
    {
      title: 'Total Expenses',
      value: totalExpensesFromTx,
      icon: TrendingDown,
      color: 'bg-rose-500',
      trend: '-2.1%',
    },
    {
      title: 'VAT Liability',
      value: getAccountBalance('2200', 'SARS VAT Control'),
      icon: PieIcon,
      color: 'bg-amber-500',
      trend: '+0.5%',
    },
  ];

  // ------------------------------------------------------------------------
  // FIXED: Generate chart data from real transactions (last 6 months)
  // Fixed month calculation with year boundary handling
  // ------------------------------------------------------------------------
  const chartData = useMemo(() => {
    // Get last 6 months (including current)
    const months: { name: string; rev: number; exp: number }[] = [];
    const now = new Date();

    // Create array of last 6 months (oldest to newest)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      months.push({ name: monthName, rev: 0, exp: 0 });
    }

    // If no transactions, show demo data
    if (transactions.length === 0) {
      return months.map((month, index) => ({
        name: month.name,
        rev: 25000 + (index * 5000),
        exp: 18000 + (index * 3000),
      }));
    }

    // Aggregate transactions by month - FIXED calculation
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (isNaN(txDate.getTime())) return;

      // Calculate month difference considering year boundaries
      const monthDiff = (now.getFullYear() - txDate.getFullYear()) * 12 +
          (now.getMonth() - txDate.getMonth());

      // Only include transactions from last 6 months
      if (monthDiff >= 0 && monthDiff < 6) {
        const arrayIndex = 5 - monthDiff;
        const netAmount = tx.amount - tx.vatAmount;

        if (tx.type === 'INVOICE') {
          months[arrayIndex].rev += netAmount;
        } else if (tx.type === 'EXPENSE') {
          months[arrayIndex].exp += netAmount;
        }
      }
    });

    return months;
  }, [transactions]);

  // ------------------------------------------------------------------------
  // Find max value for chart scaling
  // ------------------------------------------------------------------------
  const maxChartValue = useMemo(() => {
    const allValues = [...chartData.flatMap(d => [d.rev, d.exp])];
    const max = Math.max(...allValues, 1000);
    return Math.ceil(max / 1000) * 1000;
  }, [chartData]);

  // ------------------------------------------------------------------------
  // Custom tooltip formatter
  // ------------------------------------------------------------------------
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
          <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100">
            <p className="text-xs font-bold text-slate-600 mb-2">{label}</p>
            {payload.map((p: any, idx: number) => (
                <p key={idx} className="text-sm" style={{ color: p.color }}>
                  {p.name}: {currency.symbol}{p.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
            ))}
          </div>
      );
    }
    return null;
  };

  // ------------------------------------------------------------------------
  // Calculate net profit margin
  // ------------------------------------------------------------------------
  const netProfit = totalRevenueFromTx - totalExpensesFromTx;
  const profitMargin = totalRevenueFromTx > 0 ? (netProfit / totalRevenueFromTx) * 100 : 0;

  // Check if chart has any data
  const hasChartData = chartData.some(d => d.rev > 0 || d.exp > 0);

  // FIXED: Sort recent transactions by date (newest first)
  const recentTransactions = useMemo(() => {
    return [...transactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
  }, [transactions]);

  return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
              <div
                  key={i}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {currency.symbol}
                    {Math.abs(stat.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </h3>
                  <div className="mt-2 flex items-center text-xs font-medium">
                <span className={stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}>
                  {stat.trend}
                </span>
                    <span className="text-slate-400 ml-1 text-[10px] uppercase font-bold">
                  VS LAST MONTH
                </span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg`}>
                  <stat.icon size={24} />
                </div>
              </div>
          ))}
        </div>

        {/* Revenue vs Expenses chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center">
                  <Activity className="mr-2 text-blue-500" size={18} />
                  Revenue vs Expenses (Last 6 Months)
                </h3>
                {totalRevenueFromTx > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Net Profit Margin: <span className={netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {profitMargin.toFixed(1)}%
                  </span>
                    </p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                  <span className="text-[10px] font-bold text-slate-500">Revenue</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-rose-500 rounded-full mr-1"></div>
                  <span className="text-[10px] font-bold text-slate-500">Expenses</span>
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              {!hasChartData && transactions.length > 0 ? (
                  <div className="h-full flex items-center justify-center flex-col">
                    <Activity className="text-slate-300 mb-4" size={48} />
                    <p className="text-slate-400 text-center">
                      No transactions in the last 6 months. Add more recent transactions to see the chart.
                    </p>
                  </div>
              ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#94a3b8' }}
                      />
                      <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#94a3b8' }}
                          domain={[0, maxChartValue]}
                          tickFormatter={(value) => `${currency.symbol}${value.toLocaleString()}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                          type="monotone"
                          dataKey="rev"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorRev)"
                          name="Revenue"
                      />
                      <Area
                          type="monotone"
                          dataKey="exp"
                          stroke="#f43f5e"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorExp)"
                          name="Expenses"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Asset Health (top 5 assets) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-6">Asset Health</h3>
            <div className="space-y-6">
              {accounts
                  .filter(a => a.type === AccountType.ASSET && a.balance > 0)
                  .sort((a, b) => b.balance - a.balance)
                  .slice(0, 5)
                  .map(acc => {
                    const maxBalance = Math.max(...accounts.filter(a => a.type === AccountType.ASSET).map(a => a.balance), 1);
                    const percentage = (acc.balance / maxBalance) * 100;
                    return (
                        <div key={acc.id}>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600 font-medium truncate max-w-[150px]">{acc.name}</span>
                            <span className="font-bold text-slate-900">
                        {currency.symbol}
                              {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                          </div>
                          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                            <div
                                className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, percentage)}%` }}
                            />
                          </div>
                        </div>
                    );
                  })}
              {accounts.filter(a => a.type === AccountType.ASSET && a.balance > 0).length === 0 && (
                  <p className="text-sm text-slate-400 italic">No asset accounts with balance found.</p>
              )}
            </div>
            {/* Quick Stats Summary */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Total Assets Value</span>
                <span className="font-bold text-slate-900">
                {currency.symbol}
                  {accounts
                      .filter(a => a.type === AccountType.ASSET)
                      .reduce((sum, a) => sum + a.balance, 0)
                      .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions - FIXED sorting */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recent Transactions</h3>
            <button
                onClick={() => window.location.href = '/ledger'}
                className="text-blue-600 text-sm font-semibold flex items-center hover:text-blue-700"
            >
              View All <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                      No transactions yet. Click "Capture Invoice" to get started.
                    </td>
                  </tr>
              ) : (
                  recentTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {tx.description}
                        </td>
                        <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase">
                        {tx.category}
                      </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                      <span className={`text-sm font-bold ${tx.type === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {tx.type === 'EXPENSE' ? '-' : ''}{currency.symbol}
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
  );
};

export default Dashboard;