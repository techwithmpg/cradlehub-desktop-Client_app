import React, { useState } from 'react';
import { LockKeyhole, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
  isConfigured: boolean;
}

export function LoginView({
  onLogin,
  isLoading,
  errorMessage,
  isConfigured,
}: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localValidation, setLocalValidation] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalValidation(null);

    if (!isConfigured) {
      setLocalValidation(
        'Authentication service is not configured. Missing environment keys.',
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setLocalValidation('Please enter both email and password.');
      return;
    }

    await onLogin(trimmedEmail, password);
  };

  const activeError = localValidation || errorMessage;

  return (
    <div className="login-container" data-testid="login-view">
      <div className="login-card">
        <header className="login-header">
          <div className="login-logo" aria-hidden="true">
            <LockKeyhole
              size={28}
              className="text-emerald-700"
              strokeWidth={2}
            />
          </div>
          <p className="login-eyebrow">CradleHub Desktop Client</p>
          <h1 className="login-title">Sign In</h1>
          <p className="login-subtitle">
            Enter your staff credentials to access the CRM operational shell.
          </p>
        </header>

        {activeError && (
          <div
            className="login-error-banner"
            role="alert"
            aria-live="polite"
            data-testid="login-error-banner"
          >
            <AlertCircle
              size={18}
              className="login-error-icon"
              aria-hidden="true"
            />
            <span className="login-error-text">{activeError}</span>
          </div>
        )}

        {!isConfigured && !activeError && (
          <div className="login-warning-banner" role="status">
            <AlertCircle
              size={18}
              className="login-warning-icon"
              aria-hidden="true"
            />
            <span className="login-warning-text">
              Public client configuration is missing. Please provide
              VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-field">
            <label htmlFor="email" className="field-label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (localValidation) setLocalValidation(null);
              }}
              placeholder="staff@cradlehub.com"
              className="field-input"
              data-testid="email-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (localValidation) setLocalValidation(null);
                }}
                placeholder="••••••••"
                className="field-input password-input"
                data-testid="password-input"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                data-testid="password-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !isConfigured}
            className="login-submit-btn"
            data-testid="submit-button"
          >
            {isLoading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                  aria-hidden="true"
                />
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Sign In to CRM</span>
            )}
          </button>
        </form>

        <footer className="login-footer">
          <p className="login-note">
            Authorized branch access for CradleHub staff
          </p>
        </footer>
      </div>
    </div>
  );
}
