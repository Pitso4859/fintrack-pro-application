import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type FormData = z.infer<typeof schema>;

const EyeIcon = ({ show }: { show: boolean }) => show ? (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [showPw, setShowPw]   = useState(false);
  const [apiError, setApiError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError('');
    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setApiError(err?.response?.data?.detail ?? 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-r border-slate-800 flex-col justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="text-xl font-semibold text-slate-100">
            FinTrack<span className="text-blue-400">Pro</span>
          </span>
        </div>

        <div>
          <h1 className="text-3xl font-semibold text-slate-100 leading-snug mb-4">
            SARS-compliant accounting with AI-powered insights
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Manage transactions, track VAT, generate reports and get Gemini AI financial analysis — all in one place.
          </p>
          <div className="space-y-3">
            {[
              'Automated VAT 201 & CIT returns',
              'Gemini AI invoice OCR & analysis',
              'Real-time financial dashboard',
              'JWT-secured multi-user access',
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-slate-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-xs">Built for South African businesses · Powered by Spring Boot &amp; React</p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8">
            <div className="flex items-center gap-2.5 mb-6 lg:hidden">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span className="font-semibold text-slate-100">FinTrack<span className="text-blue-400">Pro</span></span>
            </div>
            <h2 className="text-2xl font-semibold text-slate-100">Welcome back</h2>
            <p className="text-slate-400 text-sm mt-1">Sign in to your account</p>
          </div>

          {apiError && (
            <div className="mb-4 flex items-start gap-2.5 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2.5 text-sm text-red-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@company.co.za"
                className={`input-field ${errors.email ? 'border-red-700 focus:ring-red-500' : ''}`}
              />
              {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-300">Password</label>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`input-field pr-10 ${errors.password ? 'border-red-700 focus:ring-red-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <EyeIcon show={showPw} />
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Signing in…
                </>
              ) : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
