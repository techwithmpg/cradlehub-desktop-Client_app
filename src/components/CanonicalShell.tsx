import { useState, useRef, useEffect } from 'react';
import {
  Building2,
  LogOut,
  Info,
  AlertCircle,
  CalendarDays,
  BookmarkCheck,
  UserCheck,
  Users,
  CalendarRange,
  Truck,
  UserCog,
  Settings,
  Bell,
  BellOff,
  ChevronDown,
  Radio,
  type LucideIcon,
} from 'lucide-react';
import type { AuthContext, NavModuleId } from '../types/auth';
import { formatRoleLabel } from '../lib/roles';
import { AUTHORIZED_NAV_ITEMS, type NavItemConfig } from '../lib/navigation';

interface CanonicalShellProps {
  authContext: AuthContext;
  onSignOut: () => Promise<void>;
  isSigningOut: boolean;
  signOutError?: string | null;
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
  signOutError,
}: CanonicalShellProps) {
  const [activeModule, setActiveModule] = useState<NavModuleId>('today');
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

  // Close popovers on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setIsNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsNotificationOpen(false);
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
              size={13}
              className="text-amber-400 shrink-0"
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
          <div className="branch-card-footer">
            <span className="branch-read-only-tag">Read-only Scope</span>
          </div>
        </div>

        {/* Exactly 8 Authorized Nav Items */}
        <nav className="sidebar-nav" aria-label="Main navigation">
          <div className="sidebar-section-header">
            <span className="sidebar-section-heading">WORKSPACE</span>
          </div>
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
                    {isActive && (
                      <span className="active-pill" aria-hidden="true" />
                    )}
                    <Icon size={17} className="nav-icon" aria-hidden="true" />
                    <span className="nav-label">{item.label}</span>
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
        {/* Top Horizontal Header Bar */}
        <header className="workspace-header">
          <div className="header-left">
            <div className="header-title-row">
              <h1 className="header-title" data-testid="active-module-title">
                {currentNavConfig.label}
              </h1>
            </div>
            <p className="header-subtitle">{currentNavConfig.description}</p>
          </div>

          <div className="header-right">
            {/* Top Branch Indicator Badge */}
            <div
              className="top-branch-indicator"
              data-testid="top-branch-indicator"
            >
              <Building2
                size={14}
                className="text-emerald-700 shrink-0"
                aria-hidden="true"
              />
              <span className="top-branch-val" title={authContext.branchName}>
                {authContext.branchName}
              </span>
            </div>

            {/* Truthful Status Chip (Session Active) */}
            <div
              className="top-status-chip"
              data-testid="status-chip"
              title="Session is active in process memory"
            >
              <span className="status-indicator-dot" aria-hidden="true" />
              <span className="status-chip-label">Session Active</span>
            </div>

            {/* Notification Trigger & Panel */}
            <div className="relative-container" ref={notificationRef}>
              <button
                type="button"
                className={`header-icon-button ${isNotificationOpen ? 'header-icon-button-active' : ''}`}
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setIsUserMenuOpen(false);
                }}
                aria-label="Notifications"
                aria-expanded={isNotificationOpen}
                aria-haspopup="dialog"
                data-testid="notification-trigger"
              >
                <Bell size={16} aria-hidden="true" />
              </button>

              {isNotificationOpen && (
                <div
                  className="popover-panel notification-popover"
                  role="dialog"
                  aria-label="Notifications Panel"
                  data-testid="notification-panel"
                >
                  <div className="popover-header">
                    <span className="popover-title">Notifications</span>
                    <span className="popover-badge">Stage 01</span>
                  </div>
                  <div className="notification-empty-state">
                    <div className="notification-empty-icon" aria-hidden="true">
                      <BellOff size={24} className="text-slate-400" />
                    </div>
                    <p className="notification-empty-title">No Notifications</p>
                    <p className="notification-empty-desc">
                      Desktop notifications are not yet available in this stage.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar Menu Trigger & Popover */}
            <div className="relative-container" ref={userMenuRef}>
              <button
                type="button"
                className={`user-menu-button ${isUserMenuOpen ? 'user-menu-button-active' : ''}`}
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsNotificationOpen(false);
                }}
                aria-label="User Account Menu"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                data-testid="user-menu-trigger"
              >
                <div className="top-avatar-circle" aria-hidden="true">
                  {userInitials}
                </div>
                <div className="top-avatar-info">
                  <span className="top-avatar-name">
                    {authContext.fullName}
                  </span>
                  <span className="top-avatar-role">
                    {formatRoleLabel(
                      authContext.canonicalRole,
                      authContext.rawRole,
                    )}
                  </span>
                </div>
                <ChevronDown
                  size={14}
                  className={`top-chevron ${isUserMenuOpen ? 'top-chevron-rotated' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {isUserMenuOpen && (
                <div
                  className="popover-panel user-dropdown-menu"
                  role="menu"
                  aria-label="User Account Actions"
                  data-testid="user-menu-dropdown"
                >
                  {/* Account Summary Header */}
                  <div className="user-dropdown-header">
                    <div className="user-dropdown-avatar" aria-hidden="true">
                      {userInitials}
                    </div>
                    <div className="user-dropdown-meta">
                      <p className="user-dropdown-name">
                        {authContext.fullName}
                      </p>
                      <p className="user-dropdown-email">{authContext.email}</p>
                      <span className="user-dropdown-role-tag">
                        {formatRoleLabel(
                          authContext.canonicalRole,
                          authContext.rawRole,
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Context Details */}
                  <div className="user-dropdown-details">
                    <div className="user-detail-row">
                      <span className="user-detail-label">Assigned Branch</span>
                      <span className="user-detail-value">
                        {authContext.branchName}
                      </span>
                    </div>
                    <div className="user-detail-row">
                      <span className="user-detail-label">
                        Session Authority
                      </span>
                      <span className="user-detail-value text-emerald-700 font-semibold">
                        In-Memory Active
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Actions */}
                  <div className="user-dropdown-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSignOut();
                      }}
                      disabled={isSigningOut}
                      className="user-dropdown-signout-btn"
                      role="menuitem"
                      data-testid="dropdown-signout-button"
                    >
                      <LogOut size={15} aria-hidden="true" />
                      <span>
                        {isSigningOut ? 'Signing out...' : 'Sign Out'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Header Sign Out Button */}
            <button
              type="button"
              onClick={onSignOut}
              disabled={isSigningOut}
              className="signout-button"
              aria-label="Sign Out"
              data-testid="signout-button"
            >
              <LogOut size={15} aria-hidden="true" />
              <span>{isSigningOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </header>

        {/* Sign Out Error Notification if failed */}
        {signOutError && (
          <div
            className="signout-error-banner"
            role="alert"
            data-testid="shell-signout-error"
          >
            <AlertCircle
              size={16}
              className="text-red-600"
              aria-hidden="true"
            />
            <span>{signOutError}</span>
          </div>
        )}

        {/* Operational Workspace Body */}
        <main id="main-content" className="workspace-content" tabIndex={-1}>
          <div
            className="module-unavailable-panel"
            data-testid="module-unavailable-panel"
          >
            <div className="unavailable-icon-wrapper" aria-hidden="true">
              <Info size={28} className="text-emerald-700" />
            </div>

            <div className="unavailable-content">
              <div className="unavailable-badge-row">
                <span className="unavailable-badge">Stage 01 Scope</span>
                <span className="unavailable-status-tag">
                  <Radio size={12} className="inline mr-1 text-emerald-600" />
                  Canonical Shell
                </span>
              </div>

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
                  <span
                    className="summary-card-meta"
                    data-testid="in-memory-session-badge"
                  >
                    In-memory session
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
