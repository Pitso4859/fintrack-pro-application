import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';
import api from '../../services/api';
import type { DashboardSummary } from '../../types';
import { formatCurrency, getYearRange, getSARSFiscalYear } from '../../utils';
import { Skeleton } from '../shared';

type Period = 'month' | 'year' | 'fiscal';

const CHART_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface TypeBreakdown {
  name: string;
  amount: number;
}

export default function Reports() {
  const [period, setPeriod]     = useState<Period>('year');
  const [summary, setSummary]   = useState<DashboardSummary | null>(null);
  const [monthly, setMonthly]   = useState<MonthlyData[]>([]);
  const [expBreak, setExpBreak] = useState<TypeBreakdown[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const summaryRes = await api.get<DashboardSummary>('/transactions/summary');
        setSummary(summaryRes.data);

        // Build mock monthly breakdown from summary
        // In production this would be a dedicated /reports/monthly endpoint
        const now = new Date();
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const rev  = summaryRes.data.totalRevenue;
        const exp  = summaryRes.data.totalExpenses;
        const data: MonthlyData[] = months.slice(0, now.getMonth() + 1).map(m => {
          const r = Math.round(rev * (0.7 + Math.random() * 0.6) / (now.getMonth() + 1));
          const e = Math.round(exp * (0.7 + Math.random() * 0.6) / (now.getMonth() + 1));
          return { month: m, revenue: r, expenses: e, profit: r - e };
        });
        setMonthly(data);

        setExpBreak([
          { name: 'Salaries',    amount: exp * 0.42 },
          { name: 'Rent',        amount: exp * 0.18 },
          { name: 'Marketing',   amount: exp * 0.12 },
          { name: 'IT & SaaS',   amount: exp * 0.10 },
          { name: 'Travel',      amount: exp * 0.08 },
          { name: 'Other',       amount: exp * 0.10 },
        ]);
      } catch {
        setSummary({ totalRevenue: 287500, totalExpenses: 143200, netProfit: 144300, totalVat: 37453, periodStart: '', periodEnd: '' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  const exportCSV = () => {
    const rows = [
      ['Period', 'Revenue', 'Expenses', 'Net Profit', 'VAT'],
      ['Current', summary?.totalRevenue, summary?.totalExpenses, summary?.netProfit, summary?.totalVat],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'fintrack-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const netVat   = summary ? summary.totalVat * 0.65 : 0; // mock: 65% output VAT
  const inputVat = summary ? summary.totalVat * 0.35 : 0; // mock: 35% input VAT

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_,i)=><Skeleton key={i} className="h-24"/>)}</div>
        <Skeleton className="h-72 rounded-xl" />
        <div className="grid grid-cols-2 gap-4">{[...Array(2)].map((_,i)=><Skeleton key={i} className="h-56"/>)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Financial Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">Income statement, VAT 201 &amp; expense analysis</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period picker */}
          <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
            {(['month','year','fiscal'] as Period[]).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  period === p ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p === 'month' ? 'This month' : p === 'year' ? 'This year' : 'Fiscal year'}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="btn-secondary text-sm flex items-center gap-2">
            <DownloadIcon /> Export CSV
          </button>
        </div>
      </div>

      {/* KPI cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:'Total Revenue',   value: formatCurrency(summary.totalRevenue),  color:'text-emerald-400', border:'border-emerald-900/40' },
            { label:'Total Expenses',  value: formatCurrency(summary.totalExpenses), color:'text-rose-400',    border:'border-rose-900/40' },
            { label:'Net Profit',      value: formatCurrency(summary.netProfit),     color:'text-blue-400',    border:'border-blue-900/40' },
            { label:'VAT Liability',   value: formatCurrency(summary.totalVat),      color:'text-amber-400',   border:'border-amber-900/40' },
          ].map(c => (
            <div key={c.label} className={`stat-card border ${c.border}`}>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{c.label}</p>
              <p className={`text-xl font-semibold tabular-nums ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Monthly revenue vs expenses */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-medium text-slate-200">Monthly Performance</h2>
            <p className="text-xs text-slate-500 mt-0.5">Revenue, expenses and net profit by month</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="month" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `R${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor:'#0f172a', border:'1px solid #1e293b', borderRadius:8, fontSize:12 }}
              formatter={(v:number,n:string) => [formatCurrency(v), n.charAt(0).toUpperCase()+n.slice(1)]}
            />
            <Legend wrapperStyle={{ fontSize:12, color:'#64748b' }} />
            <Bar dataKey="revenue"  name="Revenue"  fill="#10b981" radius={[3,3,0,0]} />
            <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[3,3,0,0]} />
            <Bar dataKey="profit"   name="Profit"   fill="#3b82f6" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Expense breakdown pie */}
        <div className="card">
          <h2 className="font-medium text-slate-200 mb-5">Expense Breakdown</h2>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie data={expBreak} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                  dataKey="amount" paddingAngle={3}>
                  {expBreak.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor:'#0f172a', border:'1px solid #1e293b', borderRadius:8, fontSize:12 }}
                  formatter={(v:number) => [formatCurrency(v)]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {expBreak.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-slate-400">{item.name}</span>
                  </div>
                  <span className="text-slate-200 font-medium tabular-nums">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* VAT 201 Summary */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <h2 className="font-medium text-slate-200">SARS VAT 201 Summary</h2>
            <span className="badge badge-amber text-xs">15% VAT</span>
          </div>

          <div className="space-y-3">
            {[
              { label:'Output VAT (on sales)',     value: netVat,          note:'Field 11 — Collected from customers', color:'text-emerald-400' },
              { label:'Input VAT (on purchases)',  value: inputVat,        note:'Field 16 — Paid to suppliers',        color:'text-rose-400' },
              { label:'Net VAT payable to SARS',   value: netVat - inputVat, note:'Field 20 — Due by due date',        color:'text-amber-400' },
            ].map(row => (
              <div key={row.label} className="bg-slate-800/50 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300">{row.label}</span>
                  <span className={`font-semibold tabular-nums ${row.color}`}>
                    {formatCurrency(row.value)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{row.note}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2.5 bg-blue-950/30 border border-blue-900/50 rounded-xl px-4 py-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="text-xs text-blue-300 leading-relaxed">
              South African VAT returns (VAT 201) are due by the last business day of the month following your tax period.
              Submit via <strong>SARS eFiling</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Income statement table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800">
          <h2 className="font-medium text-slate-200">Income Statement</h2>
          <p className="text-xs text-slate-500 mt-0.5">Profit &amp; Loss for the selected period</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              {['Category','Description','Amount'].map(h => (
                <th key={h} className="text-left text-xs font-medium text-slate-500 px-5 py-3 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            <tr className="bg-emerald-950/20">
              <td className="px-5 py-3 text-emerald-400 font-medium text-xs uppercase tracking-wide">Revenue</td>
              <td className="px-5 py-3 text-slate-300">Total revenue (ex VAT)</td>
              <td className="px-5 py-3 text-emerald-400 font-medium tabular-nums">
                {summary && formatCurrency(summary.totalRevenue)}
              </td>
            </tr>
            <tr>
              <td className="px-5 py-3 text-rose-400 font-medium text-xs uppercase tracking-wide">Expenses</td>
              <td className="px-5 py-3 text-slate-300">Total expenses (ex VAT)</td>
              <td className="px-5 py-3 text-rose-400 font-medium tabular-nums">
                ({summary && formatCurrency(summary.totalExpenses)})
              </td>
            </tr>
            <tr className="bg-blue-950/20 border-t-2 border-blue-900/50">
              <td className="px-5 py-3 text-blue-400 font-semibold text-xs uppercase tracking-wide">Net Profit</td>
              <td className="px-5 py-3 text-slate-200 font-medium">Profit / (Loss) before tax</td>
              <td className="px-5 py-3 text-blue-400 font-semibold tabular-nums">
                {summary && formatCurrency(summary.netProfit)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
