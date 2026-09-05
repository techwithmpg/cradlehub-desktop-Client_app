import { ShieldAlert, LogOut, UserX, AlertCircle } from 'lucide-react';
import type { DenialDetails } from '../types/auth';

interface AccessDeniedViewProps {
  denial: DenialDetails;
  onSignOut: () => Promise<void>;
  isSigningOut: boolean;
  signOutError?: string | null;
}

export function AccessDeniedView({
  denial,
  onSignOut,
  isSigningOut,
  signOutError,
}: AccessDeniedViewProps) {
  return (
    <div className="denied-container" data-testid="access-denied-view">
      <div className="denied-card">
        <header className="denied-header">
          <div className="denied-icon-badge" aria-hidden="true">
            <ShieldAlert size={32} className="text-amber-600" />
          </div>
          <p className="denied-eyebrow">Access Verification Failed</p>
          <h1 className="denied-title">CRM Access Denied</h1>
        </header>

        <section className="denied-body">
          <p className="denied-reason-text" data-testid="denial-reason">
            {denial.reason}
          </p>

          <div className="denied-context-box">
            <div className="denied-context-row">
              <span className="denied-context-label">
                Authenticated Account:
              </span>
              <span className="denied-context-value">
                {denial.email || 'Unknown Email'}
              </span>
            </div>
            {denial.rawRole && (
              <div className="denied-context-row">
                <span className="denied-context-label">Assigned Role:</span>
                <span className="denied-context-value">{denial.rawRole}</span>
              </div>
            )}
            <div className="denied-context-row">
              <span className="denied-context-label">Requirement:</span>
              <span className="denied-context-value">
                Active staff profile with authorized CRM role
              </span>
            </div>
          </div>

          <div className="denied-help-note">
            <UserX
              size={16}
              className="inline mr-1 text-slate-500"
              aria-hidden="true"
            />
            <span>
              If you believe this is an error, please contact your branch
              manager or system administrator to update your staff profile and
              permissions.
            </span>
          </div>

          {signOutError && (
            <div
              className="login-error-banner"
              role="alert"
              data-testid="denied-signout-error"
            >
              <AlertCircle
                size={18}
                className="login-error-icon"
                aria-hidden="true"
              />
              <span className="login-error-text">{signOutError}</span>
            </div>
          )}
        </section>

        <footer className="denied-footer">
          <button
            type="button"
            onClick={onSignOut}
            disabled={isSigningOut}
            className="denied-signout-btn"
            data-testid="denied-signout-btn"
          >
            <LogOut size={16} aria-hidden="true" />
            <span>
              {isSigningOut ? 'Signing Out...' : 'Sign Out to Return'}
            </span>
          </button>
        </footer>
      </div>
    </div>
  );
}
