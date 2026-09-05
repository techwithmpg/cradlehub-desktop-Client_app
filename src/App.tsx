import { useState } from 'react';
import type { AuthContext, AuthStatus, DenialDetails } from './types/auth';
import { isSupabaseConfigured } from './lib/supabase';
import {
  authenticateWithPassword,
  resolveStaffAndBranchContext,
  signOutUser,
  AuthDenialError,
  InvalidCredentialsError,
  NetworkOrConfigError,
} from './lib/auth-service';
import { LoginView } from './components/LoginView';
import { AccessDeniedView } from './components/AccessDeniedView';
import { CanonicalShell } from './components/CanonicalShell';

export function App() {
  const [status, setStatus] = useState<AuthStatus>('idle');
  const [authContext, setAuthContext] = useState<AuthContext | null>(null);
  const [denialDetails, setDenialDetails] = useState<DenialDetails | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  const configured = isSupabaseConfigured();

  const handleLogin = async (email: string, pass: string) => {
    setErrorMessage(null);
    setDenialDetails(null);
    setStatus('authenticating');

    try {
      const user = await authenticateWithPassword(email, pass);
      setStatus('resolving_context');

      const context = await resolveStaffAndBranchContext(user);
      setAuthContext(context);
      setStatus('authenticated');
    } catch (err: unknown) {
      if (err instanceof AuthDenialError) {
        setDenialDetails({
          reason: err.denialReason,
          email: err.email,
          userId: err.userId,
          rawRole: err.rawRole,
        });
        setStatus('denied');
      } else if (
        err instanceof InvalidCredentialsError ||
        err instanceof NetworkOrConfigError
      ) {
        setErrorMessage(err.message);
        setStatus('idle');
      } else {
        const fallbackMsg =
          err instanceof Error
            ? err.message
            : 'An unexpected authentication error occurred.';
        setErrorMessage(fallbackMsg);
        setStatus('idle');
      }
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutUser();
    } finally {
      setAuthContext(null);
      setDenialDetails(null);
      setErrorMessage(null);
      setStatus('idle');
      setIsSigningOut(false);
    }
  };

  if (status === 'authenticated' && authContext) {
    return (
      <CanonicalShell
        authContext={authContext}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />
    );
  }

  if (status === 'denied' && denialDetails) {
    return (
      <AccessDeniedView
        denial={denialDetails}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />
    );
  }

  return (
    <LoginView
      onLogin={handleLogin}
      isLoading={status === 'authenticating' || status === 'resolving_context'}
      errorMessage={errorMessage}
      isConfigured={configured}
    />
  );
}
