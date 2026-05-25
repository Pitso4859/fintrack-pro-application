import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  firstName:   z.string().min(1, 'First name is required').max(100),
  lastName:    z.string().min(1, 'Last name is required').max(100),
  email:       z.string().email('Enter a valid email address'),
  password:    z.string().min(8, 'Password must be at least 8 characters'),
  confirm:     z.string(),
  companyName: z.string().optional(),
  vatNumber:   z.string().optional(),
}).refine(d => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState('');
  const [showPw, setShowPw] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await authRegister({
        firstName:   data.firstName,
        lastName:    data.lastName,
        email:       data.email,
        password:    data.password,
        companyName: data.companyName,
        vatNumber:   data.vatNumber,
      });
      navigate('/dashboard');
    } catch (err: any) {
      setApiError(err?.response?.data?.detail ?? 'Registration failed. Please try again.');
    }
  };

  const Field = ({
    label, name, type = 'text', placeholder, hint,
  }: {
    label: string;
    name: keyof FormData;
    type?: string;
    placeholder?: string;
    hint?: string;
  }) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        className={`input-field ${errors[name] ? 'border-red-700 focus:ring-red-500' : ''}`}
      />
      {errors[name] && <p className="text-xs text-red-400 mt-1">{errors[name]?.message as string}</p>}
      {hint && !errors[name] && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span className="text-xl font-semibold text-slate-100">
              FinTrack<span className="text-blue-400">Pro</span>
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-slate-100">Create your account</h2>
          <p className="text-slate-400 text-sm mt-1">Start managing your finances in minutes</p>
        </div>

        {apiError && (
          <div className="mb-4 flex items-start gap-2.5 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2.5 text-sm text-red-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {apiError}
          </div>
        )}

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name" name="firstName" placeholder="Alice" />
              <Field label="Last name"  name="lastName"  placeholder="Smith" />
            </div>
            <Field label="Email address" name="email" type="email" placeholder="alice@company.co.za" />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  className={`input-field pr-10 ${errors.password ? 'border-red-700 focus:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPw
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                    }
                  </svg>
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <Field label="Confirm password" name="confirm" type="password" placeholder="Repeat password" />

            <div className="border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wide font-medium">Business details (optional)</p>
              <div className="space-y-3">
                <Field label="Company name" name="companyName" placeholder="ACME (Pty) Ltd" />
                <Field label="VAT number" name="vatNumber" placeholder="4123456789" hint="South African VAT registration number" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Creating account…
                </>
              ) : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
