import React, { useState } from 'react';
import { Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages
import LoginPage    from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import Dashboard    from './components/dashboard/Dashboard';
import Transactions from './components/transactions/Transactions';
import Accounts     from './components/accounts/Accounts';
import Reports      from './components/reports/Reports';
import AIInsights   from './components/ai/AIInsights';

// SVG Icon components (no emoji)
const IconDashboard = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
);
const IconTransactions = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
);
const IconAI = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V12h2a2 2 0 0 1 2 2v1a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5v-1a2 2 0 0 1 2-2h2V9.5C8.8 8.8 8 7.5 8 6a4 4 0 0 1 4-4z"/>
        <circle cx="9" cy="17" r="1"/><circle cx="15" cy="17" r="1"/>
    </svg>
);
const IconReports = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
);
const IconAccounts = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
);
const IconLogout = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
);
const IconMenu = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
);
const IconX = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);
const IconShield = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
);

// ----------------------------------------------------------------
// Protected Route
// ----------------------------------------------------------------
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center animate-fade-in">
                    <div className="relative w-16 h-16 mx-auto mb-4">
                        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center text-blue-400">
                            <IconShield />
                        </div>
                    </div>
                    <p className="text-slate-400 text-sm">Verifying session…</p>
                </div>
            </div>
        );
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// ----------------------------------------------------------------
// Sidebar navigation
// ----------------------------------------------------------------
const navLinks = [
    { to: '/dashboard',    label: 'Dashboard',    icon: <IconDashboard /> },
    { to: '/transactions', label: 'Transactions', icon: <IconTransactions /> },
    { to: '/accounts',     label: 'Accounts',     icon: <IconAccounts /> },
    { to: '/reports',      label: 'Reports',      icon: <IconReports /> },
    { to: '/ai-insights',  label: 'AI Insights',  icon: <IconAI /> },
];

// ----------------------------------------------------------------
// App Shell with Sidebar
// ----------------------------------------------------------------
const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const initials = user
        ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
        : '?';

    return (
        <div className="min-h-screen bg-slate-950 flex">

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-20 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-30 w-60 bg-slate-900 border-r border-slate-800
        flex flex-col transform transition-transform duration-300
        lg:translate-x-0 lg:static lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                        </div>
                        <span className="font-semibold text-slate-100">
              FinTrack<span className="text-blue-400">Pro</span>
            </span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-slate-500 hover:text-slate-300"
                    >
                        <IconX />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    {navLinks.map(({ to, label, icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `sidebar-link ${isActive ? 'active' : ''}`
                            }
                        >
                            {icon}
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User section */}
                <div className="px-3 py-4 border-t border-slate-800 shrink-0">
                    <div className="flex items-center gap-3 px-3 py-2 mb-1">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">
                                {user?.firstName} {user?.lastName}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="sidebar-link w-full text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 mt-1"
                    >
                        <IconLogout />
                        <span>Sign out</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Topbar (mobile) */}
                <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center px-4 lg:hidden shrink-0">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-slate-400 hover:text-slate-200 mr-3"
                    >
                        <IconMenu />
                    </button>
                    <span className="font-semibold text-slate-100">
            FinTrack<span className="text-blue-400">Pro</span>
          </span>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------
// App Routes
// ----------------------------------------------------------------
export default function App() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected */}
            <Route path="/*" element={
                <ProtectedRoute>
                    <AppShell>
                        <Routes>
                            <Route index element={<Navigate to="/dashboard" replace />} />
                            <Route path="dashboard"    element={<Dashboard />} />
                            <Route path="transactions" element={<Transactions />} />
                            <Route path="accounts"     element={<Accounts />} />
                            <Route path="reports"      element={<Reports />} />
                            <Route path="ai-insights"  element={<AIInsights />} />
                            <Route path="*"            element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </AppShell>
                </ProtectedRoute>
            } />
        </Routes>
    );
}