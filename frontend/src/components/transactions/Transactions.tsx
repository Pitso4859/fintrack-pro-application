import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';

// ---- Types ----
interface Transaction {
  id: string;
  type: string;
  amount: number;
  vatAmount: number;
  netAmount: number;
  currency: string;
  description: string;
  referenceNumber?: string;
  supplierName?: string;
  transactionDate: string;
  status: string;
}

const txTypes = ['INVOICE','EXPENSE','TRANSFER','JOURNAL','CREDIT_NOTE','DEBIT_NOTE'];

const createSchema = z.object({
  type:            z.enum(['INVOICE','EXPENSE','TRANSFER','JOURNAL','CREDIT_NOTE','DEBIT_NOTE']),
  description:     z.string().min(1,'Description required').max(500),
  amount:          z.coerce.number().positive('Must be greater than 0'),
  vatInclusive:    z.boolean().default(false),
  supplierName:    z.string().optional(),
  referenceNumber: z.string().optional(),
  transactionDate: z.string().optional(),
  currency:        z.string().default('ZAR'),
  notes:           z.string().optional(),
});
type CreateForm = z.infer<typeof createSchema>;

const fmt = (n: number, c = 'ZAR') =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: c }).format(n);

const typeColor: Record<string,string> = {
  INVOICE:'text-emerald-400', EXPENSE:'text-rose-400',
  TRANSFER:'text-blue-400', JOURNAL:'text-purple-400',
  CREDIT_NOTE:'text-cyan-400', DEBIT_NOTE:'text-orange-400',
};
const statusBadge: Record<string,string> = {
  APPROVED:'badge badge-green', PENDING:'badge badge-amber',
  REJECTED:'badge badge-red', RECONCILED:'badge badge-blue',
};

// ---- Modal ----
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [apiErr, setApiErr] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { currency: 'ZAR', vatInclusive: false, type: 'EXPENSE' },
  });

  const onSubmit = async (data: CreateForm) => {
    setApiErr('');
    try {
      await api.post('/transactions', data);
      onCreated();
      onClose();
    } catch (e: any) {
      setApiErr(e?.response?.data?.detail ?? 'Failed to create transaction');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-semibold text-slate-100">New Transaction</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {apiErr && (
            <div className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">{apiErr}</div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Type</label>
              <select {...register('type')} className="input-field text-sm">
                {txTypes.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Currency</label>
              <select {...register('currency')} className="input-field text-sm">
                {['ZAR','USD','EUR','GBP'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Description *</label>
            <input {...register('description')} placeholder="e.g. Office supplies from Makro" className={`input-field text-sm ${errors.description ? 'border-red-700' : ''}`} />
            {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Amount *</label>
              <input {...register('amount')} type="number" step="0.01" placeholder="0.00" className={`input-field text-sm ${errors.amount ? 'border-red-700' : ''}`} />
              {errors.amount && <p className="text-xs text-red-400 mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Date</label>
              <input {...register('transactionDate')} type="date" className="input-field text-sm" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input {...register('vatInclusive')} type="checkbox" id="vatInclusive" className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500" />
            <label htmlFor="vatInclusive" className="text-sm text-slate-300">Amount is VAT-inclusive (15%)</label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Supplier / Payee</label>
              <input {...register('supplierName')} placeholder="Company name" className="input-field text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Reference no.</label>
              <input {...register('referenceNumber')} placeholder="INV-001" className="input-field text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes</label>
            <textarea {...register('notes')} rows={2} placeholder="Optional notes…" className="input-field text-sm resize-none" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {isSubmitting ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : null}
              {isSubmitting ? 'Saving…' : 'Save transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal]   = useState(0);
  const [page, setPage]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: String(pageSize) });
      if (search)     params.set('search', search);
      if (typeFilter) params.set('type',   typeFilter);
      const { data } = await api.get(`/transactions?${params}`);
      setTransactions(data.content ?? []);
      setTotal(data.totalElements ?? 0);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-5 animate-fade-in">
      {showModal && <CreateModal onClose={() => setShowModal(false)} onCreated={load} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Transactions</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total.toLocaleString()} total records</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add transaction
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search transactions…"
            className="input-field pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
          className="input-field w-auto"
        >
          <option value="">All types</option>
          {txTypes.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                {['Date','Type','Description','Supplier','Amount','VAT','Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-800 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.5" className="mx-auto mb-3">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <p className="text-slate-500 text-sm">No transactions found</p>
                  </td>
                </tr>
              ) : transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap tabular-nums text-xs">
                    {new Date(tx.transactionDate).toLocaleDateString('en-ZA')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold ${typeColor[tx.type] ?? 'text-slate-400'}`}>
                      {tx.type.replace('_',' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-200 max-w-xs truncate">{tx.description}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{tx.supplierName ?? '—'}</td>
                  <td className="px-4 py-3 font-medium tabular-nums whitespace-nowrap">
                    <span className={tx.type === 'INVOICE' ? 'text-emerald-400' : 'text-slate-200'}>
                      {tx.type === 'EXPENSE' ? '-' : '+'}{fmt(tx.amount, tx.currency)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 tabular-nums text-xs">
                    {fmt(tx.vatAmount, tx.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge[tx.status] ?? 'badge badge-slate'}>{tx.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <p className="text-xs text-slate-500">
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
                Previous
              </button>
              <button disabled={(page + 1) * pageSize >= total} onClick={() => setPage(p => p + 1)} className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
