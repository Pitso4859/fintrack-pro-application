/**
 * Author: Nkotolane Pitso (Software Developer Intern)
 * File: App.tsx
 * Description: Main application component with authentication and routing.
 */

import  { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Receipt,
  BarChart3,
  Sparkles,
  Menu,
  X,
  Globe,
  Settings,
  ShieldCheck,
  Mail,
  HardDrive,
  Loader2,
  LogOut,
} from 'lucide-react';

import { SUPPORTED_CURRENCIES } from './constants';
import { Account, Transaction, ViewState, AccountType, Currency, Bill, AssetRecord } from './types';
import { AuthProvider, useAuth } from './components/Authentication';

// Pages
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

// Components
import Dashboard from './components/Dashboard';
import Ledger from './components/Ledger';
import Transactions from './components/Transactions';
import Reports from './components/Reports';
import VATManager from './components/VATManager';
import AIInsights from './components/AIInsights';
import AccountManager from './components/AccountManager';
import VAT201Report from './components/VAT201Report';
import CITReturnReport from './components/CITReturnReport';
import InvoiceInbox from './components/InvoiceInbox';
import AssetRegister from './components/AssetRegister';

// Services
import api from './services/api';

// ============================================================================
// Protected Route Wrapper
// ============================================================================
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
              <ShieldCheck className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400" size={32} />
            </div>
            <p className="text-white font-medium text-lg">FinTrack<span className="text-blue-400">Pro</span></p>
            <p className="text-slate-400 text-sm mt-2">Loading your secure workspace...</p>
          </div>
        </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

// ============================================================================
// Main App Content (Authenticated)
// ============================================================================
const AuthenticatedApp: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // View state - which screen is currently active
  const [view, setView] = useState<ViewState>('DASHBOARD');

  // Data states - keep the data as is from the backend
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  // UI states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currency, setCurrency] = useState<Currency>(SUPPORTED_CURRENCIES[0]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ------------------------------------------------------------------
  // 1. Fetch all data from the backend when the app starts
  // ------------------------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [accRes, txRes, billsRes, assetsRes] = await Promise.all([
          api.get('/accounts', { headers }),
          api.get('/transactions', { headers }),
          api.get('/bills', { headers }),
          api.get('/assets', { headers }),
        ]);

        console.log('Fetched accounts from backend:', accRes.data);

        setAccounts(accRes.data || []);
        setTransactions(txRes.data || []);
        setBills(billsRes.data || []);
        setAssets(assetsRes.data || []);

        // Fetch dashboard stats separately
        try {
          const statsRes = await api.get('/dashboard/stats', { headers });
          setDashboardStats(statsRes.data);
          console.log('Dashboard stats:', statsRes.data);
        } catch (statsErr) {
          console.error('Failed to fetch dashboard stats:', statsErr);
        }

      } catch (err) {
        console.error('Failed to fetch data', err);
        setError('Could not load data from the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ------------------------------------------------------------------
  // 2. Mutation functions
  // ------------------------------------------------------------------
  const addTransaction = (tx: Transaction) => {
    setTransactions(prev => [tx, ...prev]);
    // Also update the affected account balances locally
    setAccounts(prev => prev.map(acc => {
      if (acc.id === tx.fromAccount) {
        return { ...acc, balance: acc.balance - tx.amount };
      }
      if (acc.id === tx.toAccount) {
        return { ...acc, balance: acc.balance + tx.amount };
      }
      return acc;
    }));
  };

  const toggleVatClaim = async (txIds: string[]) => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers = { Authorization: `Bearer ${token}` };

      await Promise.all(
          txIds.map(async (id) => {
            const tx = transactions.find(t => t.id === id);
            if (!tx) return;
            await api.put(`/transactions/${id}`, { is_vat_claimed: !tx.isVatClaimed }, { headers });
          })
      );
      setTransactions(prev =>
          prev.map(tx =>
              txIds.includes(tx.id) ? { ...tx, isVatClaimed: !tx.isVatClaimed } : tx
          )
      );
    } catch (err) {
      console.error('Failed to update VAT claim', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  // ------------------------------------------------------------------
  // 3. Navigation menu items
  // ------------------------------------------------------------------
  const menuItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'INVOICE_INBOX', label: 'Smart Inbox', icon: Mail },
    { id: 'ASSET_REGISTER', label: 'Asset Register', icon: HardDrive },
    { id: 'TRANSACTIONS', label: 'Tax Invoices & Receipts', icon: Receipt },
    { id: 'LEDGER', label: 'Audit Ledger', icon: BookOpen },
    { id: 'REPORTS', label: 'Financial Statements', icon: BarChart3 },
    { id: 'VAT', label: 'SARS Compliance', icon: ShieldCheck },
    { id: 'ACCOUNT_MANAGEMENT', label: 'Chart of Accounts', icon: Settings },
    { id: 'AI_INSIGHTS', label: 'SARS AI Auditor', icon: Sparkles },
  ];

  // Debug logging for reports
  useEffect(() => {
    console.log('=== Current Account Balances ===');
    accounts.forEach(acc => {
      console.log(`${acc.name} (${acc.type}): ${currency.symbol}${acc.balance}`);
    });
  }, [accounts, currency]);

  // ------------------------------------------------------------------
  // 4. Render view based on state
  // ------------------------------------------------------------------
  const renderView = () => {
    switch (view) {
      case 'DASHBOARD':
        return <Dashboard accounts={accounts} transactions={transactions} currency={currency} />;
      case 'LEDGER':
        return <Ledger transactions={transactions} accounts={accounts} currency={currency} />;
      case 'TRANSACTIONS':
        return (
            <Transactions
                transactions={transactions}
                accounts={accounts}
                onAdd={addTransaction}
                currency={currency}
            />
        );
      case 'REPORTS':
        console.log('Rendering Reports with accounts:', accounts);
        return <Reports accounts={accounts} transactions={transactions} currency={currency} />;
      case 'VAT':
        return (
            <VATManager
                transactions={transactions}
                currency={currency}
                onToggleVatClaim={toggleVatClaim}
                onGenerateVAT201={() => setView('VAT201')}
                onGenerateCIT={() => setView('CIT_RETURN')}
            />
        );
      case 'VAT201':
        return <VAT201Report transactions={transactions} currency={currency} onBack={() => setView('VAT')} />;
      case 'CIT_RETURN':
        return <CITReturnReport transactions={transactions} currency={currency} onBack={() => setView('VAT')} />;
      case 'ACCOUNT_MANAGEMENT':
        return (
            <AccountManager
                accounts={accounts}
                setAccounts={setAccounts}
                transactions={transactions}
                currency={currency}
            />
        );
      case 'AI_INSIGHTS':
        return <AIInsights accounts={accounts} transactions={transactions} />;
      case 'INVOICE_INBOX':
        return (
            <InvoiceInbox
                bills={bills}
                setBills={setBills}
                accounts={accounts}
                onAddTransaction={addTransaction}
                currency={currency}
            />
        );
      case 'ASSET_REGISTER':
        return (
            <AssetRegister
                assets={assets}
                setAssets={setAssets}
                transactions={transactions}
                currency={currency}
            />
        );
      default:
        return <Dashboard accounts={accounts} transactions={transactions} currency={currency} />;
    }
  };

  // Loading screen
  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-center">
            <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} />
            <p className="text-white font-medium">Loading your financial data...</p>
            <p className="text-slate-400 text-sm mt-2">Please wait while we secure your workspace</p>
          </div>
        </div>
    );
  }

  // Error screen
  if (error) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="text-center max-w-md p-8 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10">
            <ShieldCheck className="text-rose-500 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold text-white mb-2">Connection Error</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
    );
  }

  // Main app layout
  return (
      <div className="min-h-screen flex bg-slate-50 overflow-hidden text-slate-900">
        {/* Sidebar */}
        <aside
            className={`bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 z-50 ${
                isSidebarOpen ? 'w-64' : 'w-20'
            } flex flex-col shadow-2xl`}
        >
          {/* Logo */}
          <div className="p-6 flex items-center justify-between">
            {isSidebarOpen && (
                <span className="font-black text-xl tracking-tight whitespace-nowrap bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              FinTrack<span className="text-blue-400">Pro</span>
            </span>
            )}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 mt-6 px-3 space-y-1">
            {menuItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => setView(item.id as ViewState)}
                    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
                        view === item.id ||
                        ((view === 'VAT201' || view === 'CIT_RETURN') && item.id === 'VAT')
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                            : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <item.icon
                      size={20}
                      className={`${isSidebarOpen ? 'mr-3' : 'mx-auto'} transition-transform group-hover:scale-110`}
                  />
                  {isSidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                  {!isSidebarOpen &&
                      item.id === 'INVOICE_INBOX' &&
                      bills.filter(b => b.status === 'PENDING').length > 0 && (
                          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-slate-900"></span>
                      )}
                </button>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/10 relative">
            <div className="relative">
              <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`w-full flex items-center ${isSidebarOpen ? 'space-x-3' : 'justify-center'} hover:bg-white/10 rounded-xl p-2 transition-colors`}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
                  {user?.firstName?.[0] || user?.email?.[0] || 'U'}
                </div>
                {isSidebarOpen && (
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-white truncate">
                        {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.email}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                )}
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 rounded-xl border border-white/10 shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                    <div className="p-3 border-b border-white/10">
                      <p className="text-xs font-medium text-slate-400">Signed in as</p>
                      <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-rose-400 hover:bg-white/10 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Sign Out</span>
                    </button>
                  </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative h-screen bg-slate-50">
          {/* Header */}
          <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 px-8 py-4 flex justify-between items-center shadow-sm">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-slate-800">
                {view === 'VAT201'
                    ? 'VAT201 Declaration'
                    : view === 'CIT_RETURN'
                        ? 'IRP6 Provisional Return'
                        : menuItems.find(m => m.id === view)?.label || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-6">
              {/* Currency Selector */}
              <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <Globe size={14} className="text-slate-400" />
                <select
                    className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
                    value={currency.code}
                    onChange={e => {
                      const selected = SUPPORTED_CURRENCIES.find(c => c.code === e.target.value);
                      if (selected) setCurrency(selected);
                    }}
                >
                  {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol})
                      </option>
                  ))}
                </select>
              </div>

              {/* SARS Badge */}
              <span className="text-xs text-slate-500 hidden sm:inline font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100">
              SARS COMPLIANT
            </span>

              {/* Quick Action */}
              <button
                  className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-tighter hover:bg-slate-800 transition shadow-md active:scale-95 flex items-center space-x-2"
                  onClick={() => setView('INVOICE_INBOX')}
              >
                <Mail size={16} />
                <span>Capture Invoice</span>
              </button>
            </div>
          </header>

          {/* Content */}
          <div className="p-8 max-w-7xl mx-auto">{renderView()}</div>
        </main>
      </div>
  );
};

// ============================================================================
// Main App Component with Router
// ============================================================================
const App: React.FC = () => {
  return (
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected Routes */}
            <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <AuthenticatedApp />
                  </ProtectedRoute>
                }
            />
            <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AuthenticatedApp />
                  </ProtectedRoute>
                }
            />

            {/* Catch all - redirect to dashboard or login */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
  );
};

export default App;