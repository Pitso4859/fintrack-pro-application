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
  // Stats cards – now using account codes for reliability
  // ------------------------------------------------------------------------
  const stats = [
    {
      title: 'Cash at Bank',
      value: getAccountBalance('1200', 'FNB Business Account'),
      icon: DollarSign,
      color: 'bg-blue-500',
      trend: '+12.5%', // still static – could compute from previous month if needed
    },
    {
      title: 'Total Revenue',
      value: accounts
        .filter(a => a.type === AccountType.REVENUE)
        .reduce((sum, a) => sum + a.balance, 0),
      icon: TrendingUp,
      color: 'bg-emerald-500',
      trend: '+5.2%',
    },
    {
      title: 'Total Expenses',
      value: accounts
        .filter(a => a.type === AccountType.EXPENSE)
        .reduce((sum, a) => sum + a.balance, 0),
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
  // Generate chart data from real transactions (last 6 months)
  // ------------------------------------------------------------------------
  const chartData = useMemo(() => {
    // Get last 6 months (including current)
    const months: { name: string; rev: number; exp: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleString('default', { month: 'short' });
      months.push({ name: monthName, rev: 0, exp: 0 });
    }

    // Aggregate transactions by month
    transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      const monthIndex = (txDate.getMonth() - now.getMonth() + 12) % 12; // 0 = current month, 1 = previous, etc.
      const arrayIndex = 5 - monthIndex; // because we built array from oldest to newest
      if (arrayIndex >= 0 && arrayIndex < 6) {
        const net = tx.amount - tx.vatAmount; // revenue/expense exclusive of VAT
        if (tx.type === 'INVOICE') {
          months[arrayIndex].rev += net;
        } else if (tx.type === 'EXPENSE') {
          months[arrayIndex].exp += net;
        }
      }
    });

    return months;
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
            <h3 className="font-bold text-slate-800 flex items-center">
              <Activity className="mr-2 text-blue-500" size={18} />
              Revenue vs Expenses (Last 6 Months)
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number) => [
                    `${currency.symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    '',
                  ]}
                />
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
                  fill="transparent"
                  name="Expenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Asset Health (top 5 assets) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6">Asset Health</h3>
          <div className="space-y-6">
            {accounts
              .filter(a => a.type === AccountType.ASSET)
              .slice(0, 5)
              .map(acc => (
                <div key={acc.id}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600 font-medium">{acc.name}</span>
                    <span className="font-bold text-slate-900">
                      {currency.symbol}
                      {acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, (acc.balance / (Math.max(...accounts.filter(a => a.type === AccountType.ASSET).map(a => a.balance), 1))) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            {accounts.filter(a => a.type === AccountType.ASSET).length === 0 && (
              <p className="text-sm text-slate-400 italic">No asset accounts found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Recent Transactions</h3>
          <button
            onClick={() => (window.location.href = '/ledger')} // optional: navigate
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
              {transactions.slice(0, 5).map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">{tx.date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {tx.description}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md uppercase">
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-slate-900">
                    {currency.symbol}
                    {tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                    No transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;