import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

// SVG Icon atoms
const Icon = {
  TrendUp: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  TrendDown: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>
    </svg>
  ),
  Wallet: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>
    </svg>
  ),
  Receipt: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/>
      <line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="14" y2="13"/>
    </svg>
  ),
};

interface Summary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalVat: number;
  periodStart: string;
  periodEnd: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  transactionDate: string;
  status: string;
  currency: string;
}

const fmt = (n: number, currency = 'ZAR') =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    APPROVED: 'badge badge-green',
    PENDING:  'badge badge-amber',
    REJECTED: 'badge badge-red',
    RECONCILED: 'badge badge-blue',
  };
  return map[status] ?? 'badge badge-slate';
};

const typeBadge = (type: string) => {
  const map: Record<string, string> = {
    INVOICE:    'text-emerald-400',
    EXPENSE:    'text-rose-400',
    TRANSFER:   'text-blue-400',
    JOURNAL:    'text-purple-400',
  };
  return map[type] ?? 'text-slate-400';
};

// Mocked monthly chart data (replace with real API call in production)
const buildChartData = (revenue: number, expenses: number) => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months.slice(0, new Date().getMonth() + 1).map((m, i) => ({
    month: m,
    revenue:  Math.round(revenue  * (0.6 + Math.random() * 0.8) * (i < new Date().getMonth() ? 0.9 : 1)),
    expenses: Math.round(expenses * (0.6 + Math.random() * 0.8) * (i < new Date().getMonth() ? 0.9 : 1)),
  }));
};

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [recent, setRecent]     = useState<Transaction[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryRes, txRes] = await Promise.all([
          api.get('/transactions/summary'),
          api.get('/transactions?size=8&page=0'),
        ]);
        setSummary(summaryRes.data);
        setRecent(txRes.data.content ?? []);
      } catch {
        // Use mock data for demo if API isn't running
        setSummary({ totalRevenue: 287500, totalExpenses: 143200, netProfit: 144300, totalVat: 37453, periodStart: '', periodEnd: '' });
        setRecent([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chartData = summary ? buildChartData(summary.totalRevenue, summary.totalExpenses) : [];

  const statCards = summary ? [
    {
      label:   'Total Revenue',
      value:   fmt(summary.totalRevenue),
      icon:    <Icon.TrendUp />,
      color:   'text-emerald-400',
      bg:      'bg-emerald-950/30',
      border:  'border-emerald-900/50',
      change:  '+12.4%',
      positive: true,
    },
    {
      label:   'Total Expenses',
      value:   fmt(summary.totalExpenses),
      icon:    <Icon.TrendDown />,
      color:   'text-rose-400',
      bg:      'bg-rose-950/30',
      border:  'border-rose-900/50',
      change:  '+3.1%',
      positive: false,
    },
    {
      label:   'Net Profit',
      value:   fmt(summary.netProfit),
      icon:    <Icon.Wallet />,
      color:   'text-blue-400',
      bg:      'bg-blue-950/30',
      border:  'border-blue-900/50',
      change:  '+18.7%',
      positive: true,
    },
    {
      label:   'VAT Liability',
      value:   fmt(summary.totalVat),
      icon:    <Icon.Receipt />,
      color:   'text-amber-400',
      bg:      'bg-amber-950/30',
      border:  'border-amber-900/50',
      change:  'Current period',
      positive: null,
    },
  ] : [];

  if (loading) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-8 bg-slate-800 rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-800 rounded-xl" />)}
        </div>
        <div className="h-64 bg-slate-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-100">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.firstName}
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Here's your financial overview for {new Date().toLocaleString('en-ZA', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className={`stat-card border ${card.border}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</span>
              <div className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center ${card.color}`}>
                {card.icon}
              </div>
            </div>
            <p className="text-xl font-semibold text-slate-100">{card.value}</p>
            <p className={`text-xs mt-1 ${
              card.positive === null ? 'text-slate-500'
              : card.positive ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {card.change} {card.positive !== null ? 'vs last month' : ''}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue vs Expenses chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-medium text-slate-200">Revenue vs Expenses</h2>
            <p className="text-xs text-slate-500 mt-0.5">Year to date</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              Revenue
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              Expenses
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `R${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#94a3b8' }}
              formatter={(v: number) => [fmt(v), '']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2}
              fill="url(#colorRevenue)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
            <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2}
              fill="url(#colorExpenses)" dot={false} activeDot={{ r: 4, fill: '#f43f5e' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-slate-200">Recent Transactions</h2>
          <a href="/transactions" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            View all
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>

        {recent.length === 0 ? (
          <div className="text-center py-12">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" className="mx-auto mb-3">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
            </svg>
            <p className="text-slate-500 text-sm">No transactions yet</p>
            <p className="text-slate-600 text-xs mt-1">Add your first transaction to get started</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-slate-800">
            {recent.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded-md ${typeBadge(tx.type)} bg-slate-800/80`}>
                    {tx.type}
                  </div>
                  <p className="text-sm text-slate-300 truncate">{tx.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className={statusBadge(tx.status)}>{tx.status}</span>
                  <span className={`text-sm font-medium tabular-nums ${
                    tx.type === 'INVOICE' ? 'text-emerald-400' : 'text-slate-200'
                  }`}>
                    {tx.type === 'EXPENSE' ? '-' : '+'}{fmt(tx.amount, tx.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
