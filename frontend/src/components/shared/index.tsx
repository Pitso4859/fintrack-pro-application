import React from 'react';
import { clsx } from 'clsx';

// ----------------------------------------------------------------
// SPINNER
// ----------------------------------------------------------------
export const Spinner: React.FC<{ size?: number; className?: string }> = ({
  size = 16,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    className={clsx('animate-spin', className)}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

// ----------------------------------------------------------------
// BUTTON
// ----------------------------------------------------------------
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize    = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
}

const buttonClasses: Record<ButtonVariant, string> = {
  primary:   'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white focus:ring-blue-500',
  secondary: 'bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 focus:ring-slate-500',
  danger:    'bg-rose-700 hover:bg-rose-600 active:bg-rose-800 text-white focus:ring-rose-500',
  ghost:     'hover:bg-slate-800 text-slate-300 hover:text-slate-100 focus:ring-slate-500',
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-md',
  md: 'text-sm px-4 py-2.5 rounded-lg',
  lg: 'text-sm px-5 py-3 rounded-lg',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  children,
  disabled,
  className,
  ...props
}) => (
  <button
    {...props}
    disabled={disabled || loading}
    className={clsx(
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      buttonClasses[variant],
      buttonSizes[size],
      className
    )}
  >
    {loading ? <Spinner size={14} /> : leftIcon}
    {children}
  </button>
);

// ----------------------------------------------------------------
// INPUT
// ----------------------------------------------------------------
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftElement,
  className,
  ...props
}) => (
  <div>
    {label && (
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label}
        {props.required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
    )}
    <div className="relative">
      {leftElement && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          {leftElement}
        </div>
      )}
      <input
        {...props}
        className={clsx(
          'input-field',
          leftElement && 'pl-9',
          error && 'border-red-700 focus:ring-red-500',
          className
        )}
      />
    </div>
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    {hint && !error && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
  </div>
);

// ----------------------------------------------------------------
// SELECT
// ----------------------------------------------------------------
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  placeholder,
  className,
  ...props
}) => (
  <div>
    {label && (
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
    )}
    <select
      {...props}
      className={clsx(
        'input-field',
        error && 'border-red-700 focus:ring-red-500',
        className
      )}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

// ----------------------------------------------------------------
// BADGE
// ----------------------------------------------------------------
type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'purple' | 'slate';

const badgeClasses: Record<BadgeVariant, string> = {
  green:  'bg-emerald-950 text-emerald-400 border border-emerald-900',
  red:    'bg-red-950 text-red-400 border border-red-900',
  amber:  'bg-amber-950 text-amber-400 border border-amber-900',
  blue:   'bg-blue-950 text-blue-400 border border-blue-900',
  purple: 'bg-purple-950 text-purple-400 border border-purple-900',
  slate:  'bg-slate-800 text-slate-400 border border-slate-700',
};

export const Badge: React.FC<{
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}> = ({ variant = 'slate', children, className }) => (
  <span className={clsx('badge', badgeClasses[variant], className)}>
    {children}
  </span>
);

// ----------------------------------------------------------------
// CARD
// ----------------------------------------------------------------
export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}> = ({ children, className, noPadding }) => (
  <div className={clsx('card', noPadding && '!p-0 overflow-hidden', className)}>
    {children}
  </div>
);

// ----------------------------------------------------------------
// MODAL
// ----------------------------------------------------------------
export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ open, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={clsx(
          'bg-slate-900 border border-slate-700 rounded-2xl w-full shadow-2xl animate-slide-up',
          maxWidth
        )}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-semibold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6"  y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------
// EMPTY STATE
// ----------------------------------------------------------------
export const EmptyState: React.FC<{
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon && (
      <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-500">
        {icon}
      </div>
    )}
    <p className="text-slate-300 font-medium">{title}</p>
    {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ----------------------------------------------------------------
// SKELETON LOADER
// ----------------------------------------------------------------
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={clsx('bg-slate-800 rounded animate-pulse', className)} />
);

export const SkeletonCard: React.FC<{ rows?: number }> = ({ rows = 4 }) => (
  <div className="card space-y-3">
    {[...Array(rows)].map((_, i) => (
      <Skeleton key={i} className={clsx('h-4', i === 0 ? 'w-1/3' : i % 3 === 0 ? 'w-2/3' : 'w-full')} />
    ))}
  </div>
);

// ----------------------------------------------------------------
// STAT CARD
// ----------------------------------------------------------------
export const StatCard: React.FC<{
  label: string;
  value: string;
  change?: string;
  positive?: boolean | null;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  border?: string;
}> = ({ label, value, change, positive, icon, iconBg, iconColor, border }) => (
  <div className={clsx('stat-card border', border ?? 'border-slate-800')}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', iconBg, iconColor)}>
        {icon}
      </div>
    </div>
    <p className="text-xl font-semibold text-slate-100 tabular-nums">{value}</p>
    {change !== undefined && (
      <p className={clsx('text-xs mt-1', {
        'text-emerald-400': positive === true,
        'text-rose-400':    positive === false,
        'text-slate-500':   positive === null,
      })}>
        {change}
      </p>
    )}
  </div>
);
