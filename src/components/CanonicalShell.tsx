import { useState } from 'react';
import {
  Building2,
  LogOut,
  Info,
  ShieldCheck,
  CalendarDays,
  BookmarkCheck,
  UserCheck,
  Users,
  CalendarRange,
  Truck,
  UserCog,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { AuthContext, NavModuleId } from '../types/auth';
import { formatRoleLabel } from '../lib/roles';
import { AUTHORIZED_NAV_ITEMS, type NavItemConfig } from '../lib/navigation';

interface CanonicalShellProps {
  authContext: AuthContext;
  onSignOut: () => Promise<void>;
  isSigningOut: boolean;
}

const ICON_MAP: Record<NavModuleId, LucideIcon> = {
  today: CalendarDays,
  bookings: BookmarkCheck,
  attendance: UserCheck,
  customers: Users,
  schedule: CalendarRange,
  'home-service': Truck,
  staff: UserCog,
  settings: Settings,
};

export function CanonicalShell({
  authContext,
  onSignOut,
  isSigningOut,
}: CanonicalShellProps) {
  const [activeModule, setActiveModule] = useState<NavModuleId>('today');

  const currentNavConfig =
    AUTHORIZED_NAV_ITEMS.find((item) => item.id === activeModule) ||
    AUTHORIZED_NAV_ITEMS[0];

  const userInitials =
    authContext.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'ST';

  return (
    <div className="shell-root" data-testid="canonical-shell">
      {/* Dark green sidebar navigation */}
      <aside className="shell-sidebar" aria-label="Sidebar navigation">
        {/* Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-mark" aria-hidden="true">
            <span className="brand-letter">C</span>
          </div>
          <div className="brand-text">
            <span className="brand-name">CradleHub</span>
            <span className="brand-badge">Desktop CRM</span>
          </div>
        </div>

        {/* Read-only Branch Context Card */}
        <div
          className="sidebar-branch-card"
          data-testid="sidebar-branch-context"
        >
          <div className="branch-card-header">
            <Building2
              size={14}
              className="text-amber-400"
              aria-hidden="true"
            />
            <span className="branch-card-label">Active Branch</span>
          </div>
          <p
            className="branch-card-name"
            title={authContext.branchName}
            data-testid="active-branch-name"
          >
            {authContext.branchName}
          </p>
          <span className="branch-read-only-tag">Read-only Scope</span>
        </div>

        {/* Exactly 8 Authorized Nav Items */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          <p className="sidebar-section-heading">WORKSPACE</p>
          <ul className="sidebar-nav-list" role="list">
            {AUTHORIZED_NAV_ITEMS.map((item: NavItemConfig) => {
              const Icon = ICON_MAP[item.id] || Info;
              const isActive = item.id === activeModule;

              return (
                <li key={item.id} className="sidebar-nav-item">
                  <button
                    type="button"
                    className={`nav-button ${isActive ? 'nav-button-active' : ''}`}
                    onClick={() => setActiveModule(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    data-testid={`nav-item-${item.id}`}
                  >
                    <Icon size={18} className="nav-icon" aria-hidden="true" />
                    <span className="nav-label">{item.label}</span>
                    {isActive && (
                      <span className="active-pill" aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sidebar Footer with Operator Info */}
        <div className="sidebar-footer">
          <div className="operator-profile">
            <div className="operator-avatar" aria-hidden="true">
              {userInitials}
            </div>
            <div className="operator-details">
              <p
                className="operator-name"
                title={authContext.fullName}
                data-testid="operator-name"
              >
                {authContext.fullName}
              </p>
              <p className="operator-role" data-testid="operator-role">
                {formatRoleLabel(
                  authContext.canonicalRole,
                  authContext.rawRole,
                )}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main operational workspace */}
      <div className="shell-workspace">
        {/* Top Operational Bar */}
        <header className="workspace-header">
          <div className="header-left">
            <h1 className="header-title" data-testid="active-module-title">
              {currentNavConfig.label}
            </h1>
            <p className="header-subtitle">{currentNavConfig.description}</p>
          </div>

          <div className="header-right">
            {/* Top Branch Indicator */}
            <div
              className="top-branch-indicator"
              data-testid="top-branch-indicator"
            >
              <Building2
                size={16}
                className="text-emerald-700"
                aria-hidden="true"
              />
              <div className="top-branch-text">
                <span className="top-branch-label">Branch</span>
                <span className="top-branch-val">{authContext.branchName}</span>
              </div>
            </div>

            {/* Operator Badge */}
            <div className="top-operator-badge">
              <ShieldCheck
                size={16}
                className="text-emerald-700"
                aria-hidden="true"
              />
              <span>
                {formatRoleLabel(
                  authContext.canonicalRole,
                  authContext.rawRole,
                )}
              </span>
            </div>

            {/* Real Sign Out Button */}
            <button
              type="button"
              onClick={onSignOut}
              disabled={isSigningOut}
              className="signout-button"
              aria-label="Sign Out"
              data-testid="signout-button"
            >
              <LogOut size={16} aria-hidden="true" />
              <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </header>

        {/* Operational Workspace Body */}
        <main id="main-content" className="workspace-content" tabIndex={-1}>
          <div
            className="module-unavailable-panel"
            data-testid="module-unavailable-panel"
          >
            <div className="unavailable-icon-wrapper" aria-hidden="true">
              <Info size={32} className="text-emerald-700" />
            </div>

            <div className="unavailable-content">
              <span className="unavailable-badge">Stage 01 Scope</span>
              <h2 className="unavailable-title">
                {currentNavConfig.label} is not yet available in the desktop
                client.
              </h2>
              <p className="unavailable-description">
                Operational module implementations are scheduled for subsequent
                authorized stages. Stage 01 establishes authenticated session
                management, authoritative branch context, and the canonical
                desktop shell.
              </p>

              <div className="unavailable-summary-grid">
                <div className="summary-card">
                  <span className="summary-card-label">Assigned Branch</span>
                  <span
                    className="summary-card-value"
                    data-testid="module-branch-val"
                  >
                    {authContext.branchName}
                  </span>
                  <span className="summary-card-meta">Read-only context</span>
                </div>

                <div className="summary-card">
                  <span className="summary-card-label">Active Operator</span>
                  <span className="summary-card-value">
                    {authContext.fullName}
                  </span>
                  <span className="summary-card-meta">
                    {formatRoleLabel(
                      authContext.canonicalRole,
                      authContext.rawRole,
                    )}
                  </span>
                </div>

                <div className="summary-card">
                  <span className="summary-card-label">Session Authority</span>
                  <span className="summary-card-value text-emerald-800">
                    In-Memory Active
                  </span>
                  <span className="summary-card-meta">RLS Verified</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
