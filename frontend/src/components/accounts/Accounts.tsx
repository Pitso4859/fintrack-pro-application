import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import type { Account, AccountType } from '../../types';
import { ACCOUNT_TYPE_LABELS, formatCurrency } from '../../utils';
import { Button, Modal, EmptyState, Skeleton, Badge } from '../shared';
import type { BadgeVariant } from '../shared';

const ACCOUNT_TYPES: AccountType[] = ['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE'];

const TYPE_VARIANT: Record<AccountType, BadgeVariant> = {
  ASSET:     'blue',
  LIABILITY: 'red',
  EQUITY:    'purple',
  REVENUE:   'green',
  EXPENSE:   'amber',
};

const createSchema = z.object({
  code:         z.string().min(1,'Code is required').max(20),
  name:         z.string().min(1,'Name is required').max(255),
  type:         z.enum(['ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE']),
  description:  z.string().max(500).optional(),
  vatApplicable: z.boolean().default(false),
  currency:     z.string().default('ZAR'),
});
type CreateForm = z.infer<typeof createSchema>;

// ---- SVGs ----
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const BuildingIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const SparkleIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>
  </svg>
);

// ---- Create / Edit Modal ----
function AccountModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [apiErr, setApiErr] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { type: 'EXPENSE', currency: 'ZAR', vatApplicable: false },
  });

  const accountName = watch('name');

  const suggestWithAI = async () => {
    if (!accountName?.trim()) return;
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/suggest-account', { accountName });
      if (data.type)         setValue('type',          data.type);
      if (data.code)         setValue('code',          data.code);
      if (data.description)  setValue('description',   data.description);
      if (data.vatApplicable !== undefined) setValue('vatApplicable', data.vatApplicable);
    } catch {
      // silently ignore AI errors
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmit = async (data: CreateForm) => {
    setApiErr('');
    try {
      await api.post('/accounts', data);
      onSaved();
      onClose();
    } catch (e: any) {
      setApiErr(e?.response?.data?.detail ?? 'Failed to create account');
    }
  };

  return (
    <Modal open onClose={onClose} title="New Account">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {apiErr && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            {apiErr}
          </div>
        )}

        {/* Name + AI suggest */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Account name *
          </label>
          <div className="flex gap-2">
            <input
              {...register('name')}
              placeholder="e.g. Office Supplies"
              className={`input-field text-sm flex-1 ${errors.name ? 'border-red-700' : ''}`}
            />
            <button
              type="button"
              onClick={suggestWithAI}
              disabled={aiLoading || !accountName?.trim()}
              title="Auto-fill with Gemini AI"
              className="btn-secondary px-3 flex items-center gap-1.5 text-purple-400 border-purple-900/50 hover:border-purple-700 disabled:opacity-40"
            >
              {aiLoading ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : <SparkleIcon />}
              <span className="text-xs">AI fill</span>
            </button>
          </div>
          {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Account code *</label>
            <input
              {...register('code')}
              placeholder="e.g. 6200"
              className={`input-field text-sm ${errors.code ? 'border-red-700' : ''}`}
            />
            {errors.code && <p className="text-xs text-red-400 mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Type *</label>
            <select {...register('type')} className="input-field text-sm">
              {ACCOUNT_TYPES.map(t => (
                <option key={t} value={t}>{ACCOUNT_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
          <textarea
            {...register('description')}
            rows={2}
            placeholder="Optional description…"
            className="input-field text-sm resize-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            {...register('vatApplicable')}
            type="checkbox"
            id="vatApplicable"
            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500"
          />
          <label htmlFor="vatApplicable" className="text-sm text-slate-300">
            VAT applicable (15% SARS)
          </label>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <Button type="submit" loading={isSubmitting} className="flex-1">
            Save account
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---- Main Page ----
export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<AccountType | ''>('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Account[]>('/accounts');
      setAccounts(data);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const grouped = ACCOUNT_TYPES.reduce<Record<AccountType, Account[]>>(
    (acc, type) => {
      acc[type] = accounts.filter(a =>
        a.type === type && (filterType === '' || a.type === filterType)
      );
      return acc;
    },
    {} as Record<AccountType, Account[]>
  );

  const visibleTypes = filterType ? [filterType as AccountType] : ACCOUNT_TYPES;
  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      {showModal && (
        <AccountModal onClose={() => setShowModal(false)} onSaved={load} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Chart of Accounts</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {accounts.length} accounts · Total balance{' '}
            <span className="text-slate-300">{formatCurrency(totalBalance)}</span>
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          leftIcon={<PlusIcon />}
        >
          New account
        </Button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType('')}
          className={`badge cursor-pointer transition-colors ${filterType === '' ? 'badge-blue' : 'badge-slate hover:bg-slate-700'}`}
        >
          All
        </button>
        {ACCOUNT_TYPES.map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`badge cursor-pointer transition-colors ${
              filterType === t ? `badge-${TYPE_VARIANT[t]}` : 'badge-slate hover:bg-slate-700'
            }`}
          >
            {ACCOUNT_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Account groups */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card space-y-3">
              <Skeleton className="h-5 w-32" />
              {[...Array(3)].map((_, j) => <Skeleton key={j} className="h-10 w-full" />)}
            </div>
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<BuildingIcon />}
            title="No accounts yet"
            description="Add your first account to build your chart of accounts"
            action={
              <Button onClick={() => setShowModal(true)} leftIcon={<PlusIcon />} size="sm">
                Add account
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {visibleTypes.map(type => {
            const accs = grouped[type];
            if (!accs.length) return null;
            const typeTotal = accs.reduce((sum, a) => sum + a.balance, 0);

            return (
              <div key={type} className="card p-0 overflow-hidden">
                {/* Section header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <Badge variant={TYPE_VARIANT[type]}>{ACCOUNT_TYPE_LABELS[type]}</Badge>
                    <span className="text-xs text-slate-500">{accs.length} accounts</span>
                  </div>
                  <span className="text-sm font-medium text-slate-300 tabular-nums">
                    {formatCurrency(typeTotal)}
                  </span>
                </div>

                {/* Rows */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      {['Code','Account name','Currency','Balance','VAT','Status'].map(h => (
                        <th key={h} className="text-left text-xs font-medium text-slate-500 px-5 py-2.5 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {accs.map(acc => (
                      <tr key={acc.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="px-5 py-3 font-mono text-xs text-slate-400">{acc.code}</td>
                        <td className="px-5 py-3">
                          <p className="text-slate-200 font-medium">{acc.name}</p>
                          {acc.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{acc.description}</p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-400 text-xs">{acc.currency}</td>
                        <td className="px-5 py-3 font-medium tabular-nums text-slate-200">
                          {formatCurrency(acc.balance, acc.currency)}
                        </td>
                        <td className="px-5 py-3">
                          {acc.vatApplicable
                            ? <Badge variant="green">VAT</Badge>
                            : <span className="text-slate-600 text-xs">—</span>
                          }
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={acc.isActive ? 'green' : 'slate'}>
                            {acc.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
