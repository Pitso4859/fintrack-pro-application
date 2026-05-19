/**
 * Author: Nkotolane Pitso (Software Developer Intern)
 * File: ForgotPassword.tsx
 * Description: Password reset request page where users enter their email to receive reset instructions.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/Authentication';
import { Mail, Loader2, AlertCircle, ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react';

const ForgotPassword: React.FC = () => {
  const { requestPasswordReset, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateEmail = (): boolean => {
    if (!email) {
      setValidationError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validateEmail()) return;
    
    try {
      await requestPasswordReset(email);
      setIsSubmitted(true);
    } catch (error) {
      // Error is handled in context
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (validationError) setValidationError('');
    if (error) clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl shadow-2xl mb-4 transform hover:scale-105 transition-transform duration-300">
            <ShieldCheck size={40} className="text-white" />
          </Link>
          <h1 className="text-3xl font-black text-white tracking-tight">
            FinTrack<span className="text-blue-400">Pro</span>
          </h1>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="p-8">
            {/* Back Button */}
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to login
            </Link>

            {!isSubmitted ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-slate-400 text-sm mb-8">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>

                {/* Error Message */}
                {(error || validationError) && (
                  <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start text-rose-200 animate-in shake duration-300">
                    <AlertCircle size={18} className="mr-3 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium">{error || validationError}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="john.doe@company.co.za"
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin mr-2" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Instructions'
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* Success State */
              <div className="text-center py-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                  <CheckCircle size={40} className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Check Your Email</h3>
                <p className="text-slate-400 text-sm mb-8">
                  We've sent password reset instructions to:<br />
                  <span className="text-blue-400 font-bold mt-2 block">{email}</span>
                </p>
                <div className="space-y-4">
                  <p className="text-xs text-slate-500">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="text-blue-400 hover:text-blue-300 font-bold"
                    >
                      try again
                    </button>
                  </p>
                  <Link
                    to="/login"
                    className="inline-block w-full py-4 bg-white/5 text-white font-black rounded-2xl hover:bg-white/10 transition-all border border-white/10"
                  >
                    Return to Login
                  </Link>
                </div>
              </div>
            )}

            {/* Security Note */}
            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <p className="text-xs text-blue-300 font-medium leading-relaxed">
                <span className="font-black uppercase tracking-widest block mb-1">🔒 Secure Reset</span>
                All password reset links are encrypted and expire after 1 hour for your security.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-black/20 border-t border-white/5">
            <p className="text-[10px] text-center text-slate-500 font-medium uppercase tracking-widest">
              SARS COMPLIANT • ENTERPRISE SECURITY
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;