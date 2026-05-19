/**
 * Author: Nkotolane Pitso (Software Developer Intern)
 * File: Register.tsx
 * Description: User registration page with form validation and account creation.
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './Authentication';
import {
  User,
  Mail,
  Lock,
  Building2,
  Phone,
  FileText,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
    taxNumber: '',
    phone: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Real-time password match validation
  useEffect(() => {
    if (currentStep === 1) {
      if (formData.password && formData.confirmPassword) {
        if (formData.password === formData.confirmPassword) {
          setValidationErrors(prev => ({ ...prev, confirmPassword: undefined }));
        } else {
          setValidationErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
        }
      }
    }
  }, [formData.password, formData.confirmPassword, currentStep]);

  const checkPasswordStrength = (password: string) => {
    const feedback = [];
    let score = 0;

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One uppercase letter');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One lowercase letter');
    }

    if (/[0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One number');
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One special character');
    }

    setPasswordStrength({ score, feedback });
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.email) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Email is invalid';
      }

      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (passwordStrength.score < 3) {
        errors.password = 'Password is too weak';
      }

      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    } else if (step === 2) {
      if (!formData.firstName) {
        errors.firstName = 'First name is required';
      }
      if (!formData.lastName) {
        errors.lastName = 'Last name is required';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setValidationErrors({});
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setValidationErrors({});
    setCurrentStep(prev => prev - 1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'password') {
      checkPasswordStrength(value);
    }

    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (error) clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(2)) return;

    const trimmedData = {
      email: formData.email.trim(),
      password: formData.password.trim(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      companyName: formData.companyName?.trim() || '',
    };

    try {
      await register(trimmedData);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return 'bg-rose-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-emerald-500';
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return 'Very Weak';
      case 2:
        return 'Weak';
      case 3:
        return 'Fair';
      case 4:
        return 'Good';
      case 5:
        return 'Strong';
      default:
        return '';
    }
  };

  const isStep1Valid = () => {
    return (
        formData.email &&
        !validationErrors.email &&
        formData.password &&
        !validationErrors.password &&
        formData.confirmPassword &&
        formData.password === formData.confirmPassword
    );
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>

        <div className="relative w-full max-w-2xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              {[1, 2].map(step => (
                  <div key={step} className="flex items-center">
                    <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${
                            currentStep >= step
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'bg-white/5 text-slate-500 border border-white/10'
                        }`}
                    >
                      {step}
                    </div>
                    {step < 2 && (
                        <div className={`w-20 h-1 mx-2 rounded ${
                            currentStep > step ? 'bg-blue-600' : 'bg-white/10'
                        }`} />
                    )}
                  </div>
              ))}
            </div>
          </div>

          {/* Registration Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-slate-400 text-sm mb-8">Join FinTrack Pro for SARS-compliant accounting</p>

              {error && currentStep === 1 && (
                  <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start text-rose-200 animate-in shake duration-300">
                    <AlertCircle size={18} className="mr-3 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Step 1 */}
                {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleChange}
                              placeholder="john.doe@company.co.za"
                              className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${
                                  validationErrors.email ? 'border-rose-500' : 'border-white/10'
                              } rounded-2xl text-white placeholder-slate-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`}
                          />
                        </div>
                        {validationErrors.email && (
                            <p className="mt-2 text-xs font-medium text-rose-400">{validationErrors.email}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              placeholder="Create a strong password"
                              className={`w-full pl-12 pr-12 py-4 bg-white/5 border ${
                                  validationErrors.password ? 'border-rose-500' : 'border-white/10'
                              } rounded-2xl text-white placeholder-slate-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`}
                          />
                          <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        {formData.password && (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden mr-3">
                                  <div
                                      className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-slate-400">
                            {getPasswordStrengthText()}
                          </span>
                              </div>
                              {passwordStrength.feedback.length > 0 && (
                                  <div className="grid grid-cols-2 gap-2">
                                    {passwordStrength.feedback.map((item, index) => (
                                        <div key={index} className="flex items-center text-xs text-slate-400">
                                          <XCircle size={12} className="mr-1 text-rose-400 flex-shrink-0" />
                                          <span>{item}</span>
                                        </div>
                                    ))}
                                  </div>
                              )}
                            </div>
                        )}
                        {validationErrors.password && (
                            <p className="mt-2 text-xs font-medium text-rose-400">{validationErrors.password}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              placeholder="Re-enter your password"
                              className={`w-full pl-12 pr-12 py-4 bg-white/5 border ${
                                  validationErrors.confirmPassword ? 'border-rose-500' : 'border-white/10'
                              } rounded-2xl text-white placeholder-slate-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`}
                          />
                          <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        {formData.password && formData.confirmPassword && (
                            <p className={`mt-2 text-xs font-medium flex items-center ${
                                formData.password === formData.confirmPassword
                                    ? 'text-emerald-400'
                                    : 'text-rose-400'
                            }`}>
                              {formData.password === formData.confirmPassword ? (
                                  <>
                                    <CheckCircle size={12} className="mr-1" />
                                    Passwords match
                                  </>
                              ) : (
                                  <>
                                    <XCircle size={12} className="mr-1" />
                                    Passwords do not match
                                  </>
                              )}
                            </p>
                        )}
                      </div>
                    </div>
                )}

                {/* Step 2 */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                            First Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="John"
                                className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${
                                    validationErrors.firstName ? 'border-rose-500' : 'border-white/10'
                                } rounded-2xl text-white placeholder-slate-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`}
                            />
                          </div>
                          {validationErrors.firstName && (
                              <p className="mt-2 text-xs font-medium text-rose-400">{validationErrors.firstName}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                            Last Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Doe"
                                className={`w-full pl-12 pr-4 py-4 bg-white/5 border ${
                                    validationErrors.lastName ? 'border-rose-500' : 'border-white/10'
                                } rounded-2xl text-white placeholder-slate-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all`}
                            />
                          </div>
                          {validationErrors.lastName && (
                              <p className="mt-2 text-xs font-medium text-rose-400">{validationErrors.lastName}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                          Company Name (Optional)
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                              type="text"
                              name="companyName"
                              value={formData.companyName}
                              onChange={handleChange}
                              placeholder="Your Business (Pty) Ltd"
                              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                          Tax Number (Optional)
                        </label>
                        <div className="relative">
                          <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                              type="text"
                              name="taxNumber"
                              value={formData.taxNumber}
                              onChange={handleChange}
                              placeholder="1234567890"
                              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                          Phone Number (Optional)
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="+27 12 345 6789"
                              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                          />
                        </div>
                      </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 flex space-x-4">
                  {currentStep > 1 && (
                      <button
                          type="button"
                          onClick={handlePrevStep}
                          className="flex-1 py-4 bg-white/5 text-white font-black rounded-2xl hover:bg-white/10 transition-all border border-white/10 active:scale-[0.98]"
                      >
                        Back
                      </button>
                  )}

                  {currentStep < 2 ? (
                      <button
                          type="button"
                          onClick={handleNextStep}
                          disabled={!isStep1Valid()}
                          className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        Next Step
                        <ArrowRight size={18} className="ml-2" />
                      </button>
                  ) : (
                      <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-black rounded-2xl hover:from-emerald-700 hover:to-green-700 transition-all shadow-xl shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isLoading ? (
                            <div className="flex items-center">
                              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                              Creating Account...
                            </div>
                        ) : (
                            <>
                              <CheckCircle size={18} className="mr-2" />
                              Create Account
                            </>
                        )}
                      </button>
                  )}
                </div>
              </form>

              <p className="mt-8 text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link
                    to="/login"
                    className="font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>

            <div className="px-8 py-4 bg-black/20 border-t border-white/5">
              <p className="text-[10px] text-center text-slate-500 font-medium uppercase tracking-widest">
                SARS COMPLIANT • AUDIT READY • ENTERPRISE SECURITY
              </p>
            </div>
          </div>
        </div>

        <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
      </div>
  );
};

export default Register;