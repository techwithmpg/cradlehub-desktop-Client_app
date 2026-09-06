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
  type LucideIcon,
} from 'lucide-react';
import { BookingsView } from './bookings/BookingsView';
import { CustomersView } from './customers/CustomersView';
import { StaffView } from './staff/StaffView';
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

  const ModuleIcon = ICON_MAP[activeModule] || Info;

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
      {/* Dark green sidebar navigation - product navigation only */}
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
                    <Icon size={16} className="nav-icon" aria-hidden="true" />
                    <span className="nav-label">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main operational workspace */}
      <div className="shell-workspace">
        {/* Slim Top Horizontal Global Header Bar (~50px) */}
        <header className="workspace-header">
          <div className="header-right">
            {/* Branch Context - Single Location */}
            <div
              className="top-branch-context"
              data-testid="top-branch-indicator"
              title={authContext.branchName}
            >
              <Building2
                size={14}
                className="top-branch-icon"
                aria-hidden="true"
              />
              <span className="top-branch-name" data-testid="top-branch-name">
                {authContext.branchName}
              </span>
            </div>

            <span className="header-divider" aria-hidden="true" />

            {/* Truthful Session Status (Session Active) */}
            <div
              className="top-session-status"
              data-testid="status-chip"
              title="Session is active in process memory"
            >
              <span className="session-status-dot" aria-hidden="true" />
              <span className="session-status-text">Session Active</span>
            </div>

            <span className="header-divider" aria-hidden="true" />

            {/* Notification Trigger & Popover */}
            <div className="relative-container" ref={notificationRef}>
              <button
                type="button"
                className={`header-ghost-btn ${isNotificationOpen ? 'header-ghost-btn-active' : ''}`}
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
                  </div>
                  <div className="notification-empty-state">
                    <div className="notification-empty-icon" aria-hidden="true">
                      <BellOff size={20} className="text-slate-400" />
                    </div>
                    <p className="notification-empty-title">No Notifications</p>
                    <p className="notification-empty-desc">
                      Desktop notifications are not yet available.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar Menu Trigger & Popover */}
            <div className="relative-container" ref={userMenuRef}>
              <button
                type="button"
                className={`avatar-menu-trigger ${isUserMenuOpen ? 'avatar-menu-trigger-active' : ''}`}
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsNotificationOpen(false);
                }}
                aria-label="User Account Menu"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                data-testid="user-menu-trigger"
              >
                <span className="avatar-circle" aria-hidden="true">
                  {userInitials}
                </span>
                <ChevronDown
                  size={12}
                  className={`avatar-chevron ${isUserMenuOpen ? 'avatar-chevron-rotated' : ''}`}
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
                      <p
                        className="user-dropdown-name"
                        data-testid="dropdown-user-name"
                      >
                        {authContext.fullName}
                      </p>
                      <p className="user-dropdown-email">{authContext.email}</p>
                      <span
                        className="user-dropdown-role-tag"
                        data-testid="dropdown-user-role"
                      >
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
                      <span className="user-detail-label">Branch</span>
                      <span
                        className="user-detail-value"
                        title={authContext.branchName}
                        data-testid="dropdown-branch-name"
                      >
                        {authContext.branchName}
                      </span>
                    </div>
                  </div>

                  {/* Dropdown Actions - Exclusive Sign Out location */}
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
                      <LogOut size={14} aria-hidden="true" />
                      <span>
                        {isSigningOut ? 'Signing out...' : 'Sign Out'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Sign Out Error Banner if sign-out fails */}
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

        {/* Operational Workspace Canvas */}
        <main id="main-content" className="workspace-content" tabIndex={-1}>
          <div
            className={`workspace-canvas ${activeModule === 'bookings' || activeModule === 'customers' || activeModule === 'staff' ? 'workspace-canvas-wide' : ''}`}
          >
            {activeModule === 'bookings' ? (
              <div className="bookings-module-wrapper">
                <div className="workspace-page-header visually-hidden-module-header">
                  <h1
                    className="workspace-page-title"
                    data-testid="active-module-title"
                  >
                    {currentNavConfig.label}
                  </h1>
                </div>
                <BookingsView authContext={authContext} />
              </div>
            ) : activeModule === 'customers' ? (
              <div className="bookings-module-wrapper customers-module-wrapper">
                <div className="workspace-page-header visually-hidden-module-header">
                  <h1
                    className="workspace-page-title"
                    data-testid="active-module-title"
                  >
                    {currentNavConfig.label}
                  </h1>
                </div>
                <CustomersView authContext={authContext} />
              </div>
            ) : activeModule === 'staff' ? (
              <div className="bookings-module-wrapper staff-module-wrapper">
                <div className="workspace-page-header visually-hidden-module-header">
                  <h1
                    className="workspace-page-title"
                    data-testid="active-module-title"
                  >
                    {currentNavConfig.label}
                  </h1>
                </div>
                <StaffView authContext={authContext} />
              </div>
            ) : (
              <>
                {/* Module Workspace Header */}
                <div className="workspace-page-header">
                  <h1
                    className="workspace-page-title"
                    data-testid="active-module-title"
                  >
                    {currentNavConfig.label}
                  </h1>
                </div>

                {/* Clean, quiet empty state placeholder */}
                <div
                  className="workspace-placeholder"
                  data-testid="module-unavailable-panel"
                >
                  <div className="placeholder-icon-wrapper" aria-hidden="true">
                    <ModuleIcon size={24} className="placeholder-icon" />
                  </div>
                  <h2 className="placeholder-title">
                    {currentNavConfig.label}
                  </h2>
                  <p className="placeholder-desc">
                    This module is not yet available in the desktop client.
                  </p>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
