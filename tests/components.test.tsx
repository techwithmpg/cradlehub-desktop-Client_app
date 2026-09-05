import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthContext, DenialDetails } from '../src/types/auth';
import { LoginView } from '../src/components/LoginView';
import { AccessDeniedView } from '../src/components/AccessDeniedView';
import { CanonicalShell } from '../src/components/CanonicalShell';
import { App } from '../src/App';
import * as authService from '../src/lib/auth-service';
import * as supabaseLib from '../src/lib/supabase';

describe('Stage 01 UI Components', () => {
  describe('LoginView', () => {
    it('renders the accessible login form with email and password inputs', () => {
      render(
        <LoginView
          onLogin={vi.fn()}
          isLoading={false}
          errorMessage={null}
          isConfigured={true}
        />,
      );

      expect(screen.getByTestId('login-view')).toBeDefined();
      expect(screen.getByLabelText(/email address/i)).toBeDefined();
      expect(screen.getByLabelText(/^password$/i)).toBeDefined();
      expect(
        screen.getByRole('button', { name: /sign in to crm/i }),
      ).toBeDefined();
    });

    it('toggles password visibility when clicking toggle button', async () => {
      const user = userEvent.setup();
      render(
        <LoginView
          onLogin={vi.fn()}
          isLoading={false}
          errorMessage={null}
          isConfigured={true}
        />,
      );

      const passwordInput = screen.getByTestId(
        'password-input',
      ) as HTMLInputElement;
      const toggleBtn = screen.getByTestId('password-toggle');

      expect(passwordInput.type).toBe('password');
      await user.click(toggleBtn);
      expect(passwordInput.type).toBe('text');
      await user.click(toggleBtn);
      expect(passwordInput.type).toBe('password');
    });

    it('displays error banner when errorMessage is provided', () => {
      render(
        <LoginView
          onLogin={vi.fn()}
          isLoading={false}
          errorMessage="Invalid login credentials"
          isConfigured={true}
        />,
      );

      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Invalid login credentials');
    });

    it('disables input and shows loading indicator while submitting', () => {
      render(
        <LoginView
          onLogin={vi.fn()}
          isLoading={true}
          errorMessage={null}
          isConfigured={true}
        />,
      );

      expect(
        (screen.getByTestId('email-input') as HTMLInputElement).disabled,
      ).toBe(true);
      expect(
        (screen.getByTestId('password-input') as HTMLInputElement).disabled,
      ).toBe(true);
      expect(
        (screen.getByTestId('submit-button') as HTMLButtonElement).disabled,
      ).toBe(true);
      expect(screen.getByText(/verifying credentials/i)).toBeDefined();
    });

    it('calls onLogin with trimmed email and password upon submission', async () => {
      const handleLogin = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(
        <LoginView
          onLogin={handleLogin}
          isLoading={false}
          errorMessage={null}
          isConfigured={true}
        />,
      );

      await user.type(
        screen.getByTestId('email-input'),
        '  staff@example.com  ',
      );
      await user.type(screen.getByTestId('password-input'), 'secret123');
      await user.click(screen.getByTestId('submit-button'));

      expect(handleLogin).toHaveBeenCalledWith(
        'staff@example.com',
        'secret123',
      );
    });
  });

  describe('AccessDeniedView', () => {
    const mockDenial: DenialDetails = {
      reason: 'No active staff profile found for this account.',
      email: 'test@example.com',
      userId: 'usr-1',
      rawRole: 'guest',
    };

    it('renders denial reason and context with Sign Out option', () => {
      render(
        <AccessDeniedView
          denial={mockDenial}
          onSignOut={vi.fn()}
          isSigningOut={false}
        />,
      );

      expect(screen.getByTestId('access-denied-view')).toBeDefined();
      expect(screen.getByTestId('denial-reason').textContent).toContain(
        mockDenial.reason,
      );
      expect(screen.getByText('test@example.com')).toBeDefined();
      expect(screen.getByText('guest')).toBeDefined();
      expect(
        screen.getByRole('button', { name: /sign out to return/i }),
      ).toBeDefined();
    });

    it('calls onSignOut when clicking Sign Out button', async () => {
      const handleSignOut = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(
        <AccessDeniedView
          denial={mockDenial}
          onSignOut={handleSignOut}
          isSigningOut={false}
        />,
      );

      await user.click(screen.getByTestId('denied-signout-btn'));
      expect(handleSignOut).toHaveBeenCalled();
    });
  });

  describe('CanonicalShell', () => {
    const mockAuthContext: AuthContext = {
      userId: 'usr-100',
      email: 'maria@cradlehub.com',
      staffId: 'staff-100',
      fullName: 'Maria Santos',
      canonicalRole: 'crm',
      rawRole: 'csr_staff',
      branchId: 'branch-10',
      branchName: 'Makati Central Branch',
      isCrmEligible: true,
    };

    it('renders all 8 authorized navigation items and active branch context', () => {
      render(
        <CanonicalShell
          authContext={mockAuthContext}
          onSignOut={vi.fn()}
          isSigningOut={false}
        />,
      );

      expect(screen.getByTestId('canonical-shell')).toBeDefined();
      expect(screen.getByTestId('active-branch-name').textContent).toBe(
        'Makati Central Branch',
      );
      expect(screen.getByTestId('operator-name').textContent).toBe(
        'Maria Santos',
      );
      expect(screen.getByTestId('operator-role').textContent).toBe(
        'Front Desk (CRM)',
      );

      const expectedNav = [
        'today',
        'bookings',
        'attendance',
        'customers',
        'schedule',
        'home-service',
        'staff',
        'settings',
      ];

      for (const navId of expectedNav) {
        expect(screen.getByTestId(`nav-item-${navId}`)).toBeDefined();
      }
    });

    it('switches active module and shows truthful unavailable state', async () => {
      const user = userEvent.setup();
      render(
        <CanonicalShell
          authContext={mockAuthContext}
          onSignOut={vi.fn()}
          isSigningOut={false}
        />,
      );

      // Default is Today
      expect(screen.getByTestId('active-module-title').textContent).toBe(
        'Today',
      );
      expect(screen.getByTestId('module-unavailable-panel')).toBeDefined();
      expect(
        screen.getByText(/Today is not yet available in the desktop client/i),
      ).toBeDefined();

      // Click Bookings
      await user.click(screen.getByTestId('nav-item-bookings'));
      expect(screen.getByTestId('active-module-title').textContent).toBe(
        'Bookings',
      );
      expect(
        screen.getByText(
          /Bookings is not yet available in the desktop client/i,
        ),
      ).toBeDefined();

      // Click Customers
      await user.click(screen.getByTestId('nav-item-customers'));
      expect(screen.getByTestId('active-module-title').textContent).toBe(
        'Customers',
      );
      expect(
        screen.getByText(
          /Customers is not yet available in the desktop client/i,
        ),
      ).toBeDefined();
    });

    it('triggers real sign-out when clicking Sign Out in the header', async () => {
      const handleSignOut = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(
        <CanonicalShell
          authContext={mockAuthContext}
          onSignOut={handleSignOut}
          isSigningOut={false}
        />,
      );

      await user.click(screen.getByTestId('signout-button'));
      expect(handleSignOut).toHaveBeenCalled();
    });
  });

  describe('App integration flows', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      vi.spyOn(supabaseLib, 'isSupabaseConfigured').mockReturnValue(true);
    });

    it('transitions from Login to CanonicalShell on successful authentication and context resolution', async () => {
      const mockUser = {
        id: 'usr-1',
        email: 'user@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2026-01-01',
      };
      const mockContext: AuthContext = {
        userId: 'usr-1',
        email: 'user@example.com',
        staffId: 'staff-1',
        fullName: 'Alex Reyes',
        canonicalRole: 'manager',
        rawRole: 'manager',
        branchId: 'b-1',
        branchName: 'Cebu Branch',
        isCrmEligible: true,
      };

      vi.spyOn(authService, 'authenticateWithPassword').mockResolvedValue(
        mockUser,
      );
      vi.spyOn(authService, 'resolveStaffAndBranchContext').mockResolvedValue(
        mockContext,
      );
      vi.spyOn(authService, 'signOutUser').mockResolvedValue(undefined);

      render(<App />);

      expect(screen.getByTestId('login-view')).toBeDefined();

      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'user@example.com' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('canonical-shell')).toBeDefined();
      });

      expect(screen.getByTestId('active-branch-name').textContent).toBe(
        'Cebu Branch',
      );
      expect(screen.getByTestId('operator-name').textContent).toBe(
        'Alex Reyes',
      );

      // Click Sign Out
      fireEvent.click(screen.getByTestId('signout-button'));

      await waitFor(() => {
        expect(screen.getByTestId('login-view')).toBeDefined();
      });
    });

    it('transitions to AccessDeniedView if context resolution denies access, and returns to login on sign-out', async () => {
      const mockUser = {
        id: 'usr-2',
        email: 'denied@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2026-01-01',
      };

      vi.spyOn(authService, 'authenticateWithPassword').mockResolvedValue(
        mockUser,
      );
      vi.spyOn(authService, 'resolveStaffAndBranchContext').mockRejectedValue(
        new authService.AuthDenialError(
          'Your staff account is marked inactive.',
          {
            email: 'denied@example.com',
            userId: 'usr-2',
          },
        ),
      );
      vi.spyOn(authService, 'signOutUser').mockResolvedValue(undefined);

      render(<App />);

      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'denied@example.com' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('access-denied-view')).toBeDefined();
      });

      expect(screen.getByTestId('denial-reason').textContent).toContain(
        'marked inactive',
      );

      // Click Sign Out on denial view
      fireEvent.click(screen.getByTestId('denied-signout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('login-view')).toBeDefined();
      });
    });
  });
});
