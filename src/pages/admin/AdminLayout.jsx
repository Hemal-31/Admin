import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom';
import '../../components/common/Sidebar.css';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  CreditCard,
  ShieldCheck,
  Calendar,
  QrCode,
  Users2,
  Settings,
  LogOut,
  Menu,
  X,
  UserCog,
  Mail,
  ExternalLink,
  Diamond,
} from 'lucide-react';

export default function AdminLayout() {
  const { adminProfile, adminSession, isAdminLoading, adminLogout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-[#060814] flex items-center justify-center text-brand-cyan font-heading text-lg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-cyan border-t-transparent rounded-full animate-spin"></div>
          <span>Authenticating CyberSentinel Admin...</span>
        </div>
      </div>
    );
  }

  if (!adminSession || !adminProfile || adminProfile.role !== 'ADMIN') {
    return <Navigate to="/admin/login" replace />;
  }

  async function handleLogout() {
    await adminLogout();
    navigate('/admin/login');
  }

  const navItems = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/participants', label: 'Participants', icon: Users },
    { to: '/admin/payments', label: 'Payments', icon: CreditCard },
    { to: '/admin/events', label: 'Events', icon: Calendar },
    { to: '/admin/main-attendance', label: 'QR Codes', icon: QrCode },
    { to: '/admin/teams', label: 'Teams', icon: Users2 },
    { to: '/admin/coordinators', label: 'Coordinators', icon: UserCog },
    { to: '/admin/emails', label: 'Emails', icon: Mail },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const adminName = adminProfile.name || adminProfile.email?.split('@')[0] || 'Admin';
  const initial = adminName.charAt(0).toUpperCase();

  return (
    <div className="cs-shell bg-[#060814] text-slate-100 font-sans">
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="cs-drawer-backdrop lg:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`cs-sidebar cs-sidebar-drawer ${sidebarOpen ? 'cs-drawer-open' : ''} fixed top-0 bottom-0 left-0 z-50 backdrop-blur-2xl flex flex-col`}
        aria-label="Admin navigation"
      >
        <div className="cs-brand">
          <Link to="/admin/dashboard" className="cs-brand-link group">
            <div className="cs-brand-logo">
              <img src="/assets/cybersentinel_crest_logo.jpg" alt="Cyber Sentinel 2K26" />
            </div>

            <div className="cs-brand-text">
              <span className="cs-brand-name">CYBERSENTINEL</span>
              <span className="cs-brand-role">ADMIN</span>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden cs-icon-button"
            style={{ width: '36px', height: '36px', flexShrink: 0 }}
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="cs-sidebar-nav cs-sidebar-pattern">
          <div className="cs-sidebar-nav-group">Command Deck</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `cs-sidebar-nav-item cs-nav-module ${isActive ? 'active' : ''}`}
              >
                <Icon className="cs-nav-icon" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        <div className="cs-sidebar-footer">
          <div className="cs-coord-id cs-nav-module">
            <span className="cs-coord-avatar">{initial}</span>
            <span className="cs-coord-meta">
              <span className="cs-coord-name">{adminName}</span>
              <span className="cs-coord-role">Administrator</span>
            </span>
          </div>

          <Link to="/" target="_blank" className="cs-sidebar-nav-item cs-nav-module w-full">
            <ExternalLink className="cs-nav-icon" />
            <span>Public Portal</span>
          </Link>

          <button onClick={handleLogout} className="cs-sidebar-nav-item cs-nav-module cs-nav-danger w-full">
            <LogOut className="cs-nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="cs-main">
        <header className="cs-topbar">
          <div className="cs-topbar-left">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden cs-icon-button"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="cs-command-node">
              <span className="cs-pulse-dot" aria-hidden="true"></span>
              <span className="cs-command-label">
                <span className="cs-command-prefix">CYBERSENTINEL // </span>COMMAND NODE
              </span>
            </div>
          </div>

          <div className="cs-topbar-center">
            <div className="cs-event-title" title="Admin control console">
              <span className="cs-event-rule" aria-hidden="true"></span>
              <Diamond className="cs-event-diamond w-3.5 h-3.5" aria-hidden="true" />
              <span className="cs-event-title-text">Admin Control Console</span>
              <Diamond className="cs-event-diamond w-3.5 h-3.5" aria-hidden="true" />
              <span className="cs-event-rule cs-event-rule-right" aria-hidden="true"></span>
            </div>
          </div>

          <div className="cs-topbar-right">
            <span className="cs-secure-badge">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure Root</span>
            </span>
          </div>
        </header>

        <main className="cs-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
