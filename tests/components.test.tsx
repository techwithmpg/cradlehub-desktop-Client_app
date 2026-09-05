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
          errorMessage="Invalid email or password."
          isConfigured={true}
        />,
      );

      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Invalid email or password.');
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
          signOutError={null}
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

    it('renders sign-out error banner if sign-out fails', () => {
      render(
        <AccessDeniedView
          denial={mockDenial}
          onSignOut={vi.fn()}
          isSigningOut={false}
          signOutError="Sign-out network error. Please retry."
        />,
      );

      expect(screen.getByTestId('denied-signout-error').textContent).toContain(
        'Sign-out network error. Please retry.',
      );
    });

    it('calls onSignOut when clicking Sign Out button', async () => {
      const handleSignOut = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(
        <AccessDeniedView
          denial={mockDenial}
          onSignOut={handleSignOut}
          isSigningOut={false}
          signOutError={null}
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

    it('renders all 8 authorized navigation items without duplicating branch or operator in sidebar', () => {
      render(
        <CanonicalShell
          authContext={mockAuthContext}
          onSignOut={vi.fn()}
          isSigningOut={false}
          signOutError={null}
        />,
      );

      expect(screen.getByTestId('canonical-shell')).toBeDefined();

      // Exactly 8 navigation items
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

      // Sidebar must NOT duplicate branch or operator
      expect(screen.queryByTestId('sidebar-branch-context')).toBeNull();
      expect(screen.queryByTestId('active-branch-name')).toBeNull();
      expect(screen.queryByTestId('operator-name')).toBeNull();
      expect(screen.queryByTestId('operator-role')).toBeNull();
    });

    it('renders branch context and truthful session status in the top bar, without module title or direct sign-out', () => {
      render(
        <CanonicalShell
          authContext={mockAuthContext}
          onSignOut={vi.fn()}
          isSigningOut={false}
          signOutError={null}
        />,
      );

      // Single location for branch in top bar
      expect(screen.getByTestId('top-branch-indicator')).toBeDefined();
      expect(screen.getByTestId('top-branch-name').textContent).toBe(
        'Makati Central Branch',
      );

      // Truthful session status
      expect(screen.getByTestId('status-chip').textContent).toContain(
        'Session Active',
      );

      // Top bar must not have direct Sign Out button
      expect(screen.queryByTestId('signout-button')).toBeNull();

      // Module title is in workspace canvas, not top bar
      const moduleTitle = screen.getByTestId('active-module-title');
      expect(moduleTitle.textContent).toBe('Today');
      expect(moduleTitle.closest('header')).toBeNull();
      expect(moduleTitle.closest('main')).toBeDefined();
    });

    it('contains no developer or engineering terminology in normal runtime', () => {
      const { container } = render(
        <CanonicalShell
          authContext={mockAuthContext}
          onSignOut={vi.fn()}
          isSigningOut={false}
          signOutError={null}
        />,
      );

      const text = container.textContent || '';
      expect(text).not.toMatch(/Stage 01 Scope/i);
      expect(text).not.toMatch(/Canonical Shell/i);
      expect(text).not.toMatch(/Session Authority/i);
      expect(text).not.toMatch(/RLS Verified/i);
      expect(text).not.toMatch(/Active Operator/i);
      expect(text).not.toMatch(/In-Memory Active/i);
    });

    it('renders sign-out error banner if sign-out fails in shell', () => {
      render(
        <CanonicalShell
          authContext={mockAuthContext}
          onSignOut={vi.fn()}
          isSigningOut={false}
          signOutError="Sign-out network timeout"
        />,
      );

      expect(screen.getByTestId('shell-signout-error').textContent).toContain(
        'Sign-out network timeout',
      );
    });

    it('switches active module and shows truthful unavailable state in module canvas', async () => {
      const user = userEvent.setup();
      render(
        <CanonicalShell
          authContext={mockAuthContext}
          onSignOut={vi.fn()}
          isSigningOut={false}
          signOutError={null}
        />,
      );

      // Default is Today
      expect(screen.getByTestId('active-module-title').textContent).toBe(
        'Today',
      );
      expect(screen.getByTestId('module-unavailable-panel')).toBeDefined();
      expect(
        screen.getByText(
          /This module is not yet available in the desktop client/i,
        ),
      ).toBeDefined();

      // Click Bookings
      await user.click(screen.getByTestId('nav-item-bookings'));
      expect(screen.getByTestId('active-module-title').textContent).toBe(
        'Bookings',
      );

      // Click Customers
      await user.click(screen.getByTestId('nav-item-customers'));
      expect(screen.getByTestId('active-module-title').textContent).toBe(
        'Customers',
      );
    });

    it('toggles notification popover with truthful empty state and no stage badges', async () => {
      const user = userEvent.setup();
      render(
        <CanonicalShell
          authContext={mockAuthContext}
          onSignOut={vi.fn()}
          isSigningOut={false}
          signOutError={null}
        />,
      );

      expect(screen.queryByTestId('notification-panel')).toBeNull();

      // Open notification panel
      await user.click(screen.getByTestId('notification-trigger'));
      expect(screen.getByTestId('notification-panel')).toBeDefined();
      expect(screen.getByText('No Notifications')).toBeDefined();
      expect(
        screen.getByText(/Desktop notifications are not yet available/i),
      ).toBeDefined();
      expect(screen.queryByText(/Stage 01/i)).toBeNull();

      // Close notification panel by clicking trigger again
      await user.click(screen.getByTestId('notification-trigger'));
      expect(screen.queryByTestId('notification-panel')).toBeNull();
    });

    it('opens user avatar dropdown menu and supports dropdown sign-out as exclusive sign-out point', async () => {
      const handleSignOut = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(
        <CanonicalShell
          authContext={mockAuthContext}
          onSignOut={handleSignOut}
          isSigningOut={false}
          signOutError={null}
        />,
      );

      expect(screen.queryByTestId('user-menu-dropdown')).toBeNull();

      // Click avatar button to open dropdown
      await user.click(screen.getByTestId('user-menu-trigger'));
      expect(screen.getByTestId('user-menu-dropdown')).toBeDefined();
      expect(screen.getByTestId('dropdown-user-name').textContent).toBe(
        'Maria Santos',
      );
      expect(screen.getByText('maria@cradlehub.com')).toBeDefined();
      expect(screen.getByTestId('dropdown-user-role').textContent).toBe(
        'Front Desk (CRM)',
      );
      expect(screen.getByTestId('dropdown-branch-name').textContent).toBe(
        'Makati Central Branch',
      );

      // Click sign out inside dropdown
      await user.click(screen.getByTestId('dropdown-signout-button'));
      expect(handleSignOut).toHaveBeenCalled();
    });
  });

  describe('App integration flows', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
      vi.spyOn(supabaseLib, 'isSupabaseConfigured').mockReturnValue(true);
    });

    it('transitions from Login to CanonicalShell on successful authentication and context resolution, and signs out via avatar menu', async () => {
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

      expect(screen.getByTestId('top-branch-name').textContent).toBe(
        'Cebu Branch',
      );

      // Open avatar menu to sign out
      fireEvent.click(screen.getByTestId('user-menu-trigger'));
      await waitFor(() => {
        expect(screen.getByTestId('dropdown-signout-button')).toBeDefined();
      });

      fireEvent.click(screen.getByTestId('dropdown-signout-button'));

      await waitFor(() => {
        expect(screen.getByTestId('login-view')).toBeDefined();
      });
    });

    it('retains CanonicalShell and displays truthful retryable error if sign-out fails', async () => {
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
      vi.spyOn(authService, 'signOutUser').mockRejectedValue(
        new Error('Failed to reach authentication server for sign-out'),
      );

      render(<App />);

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

      // Open avatar menu and click Sign Out which will fail
      fireEvent.click(screen.getByTestId('user-menu-trigger'));
      await waitFor(() => {
        expect(screen.getByTestId('dropdown-signout-button')).toBeDefined();
      });
      fireEvent.click(screen.getByTestId('dropdown-signout-button'));

      await waitFor(() => {
        expect(screen.getByTestId('shell-signout-error')).toBeDefined();
      });

      expect(screen.getByTestId('shell-signout-error').textContent).toContain(
        'Failed to reach authentication server for sign-out',
      );
      // User must remain on protected CanonicalShell, not falsely returned to LoginView
      expect(screen.getByTestId('canonical-shell')).toBeDefined();
      expect(screen.queryByTestId('login-view')).toBeNull();
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

    it('displays ContextLoadError truthfully on LoginView when context loading fails', async () => {
      const mockUser = {
        id: 'usr-3',
        email: 'error@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2026-01-01',
      };

      vi.spyOn(authService, 'authenticateWithPassword').mockResolvedValue(
        mockUser,
      );
      vi.spyOn(authService, 'resolveStaffAndBranchContext').mockRejectedValue(
        new authService.ContextLoadError(
          'Database query timeout while loading staff profile.',
        ),
      );

      render(<App />);

      fireEvent.change(screen.getByTestId('email-input'), {
        target: { value: 'error@example.com' },
      });
      fireEvent.change(screen.getByTestId('password-input'), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByTestId('submit-button'));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeDefined();
      });

      expect(screen.getByRole('alert').textContent).toContain(
        'Database query timeout while loading staff profile.',
      );
      expect(screen.getByTestId('login-view')).toBeDefined();
      expect(screen.queryByTestId('access-denied-view')).toBeNull();
    });
  });
});
