import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { App } from '../src/App';
import { LoginView } from '../src/components/LoginView';
import { CanonicalShell } from '../src/components/CanonicalShell';
import * as auth from '../src/lib/auth-service';
import * as supabase from '../src/lib/supabase';
import type { AuthContext } from '../src/types/auth';
vi.mock('@tauri-apps/plugin-notification', () => ({
  isPermissionGranted: vi.fn(),
  requestPermission: vi.fn(),
  sendNotification: vi.fn(),
}));
vi.mock('../src/components/today/TodayView', () => ({
  TodayView: () => <div>Today workspace</div>,
}));
const context: AuthContext = {
  userId: 'user',
  email: 'user@example.com',
  staffId: 'staff',
  fullName: 'Operator',
  canonicalRole: 'manager',
  rawRole: 'manager',
  branchId: 'branch',
  branchName: 'Branch',
  isCrmEligible: true,
};
const user = {
  id: 'user',
  email: context.email,
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-09-27',
};
beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();
  Object.defineProperty(window, '__TAURI_INTERNALS__', {
    configurable: true,
    value: {},
  });
  vi.mocked(isPermissionGranted).mockResolvedValue(false);
  vi.spyOn(supabase, 'isSupabaseConfigured').mockReturnValue(true);
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, '__TAURI_INTERNALS__');
});
function mountShell() {
  return render(
    <CanonicalShell
      authContext={context}
      onSignOut={vi.fn()}
      isSigningOut={false}
    />,
  );
}
function openBell() {
  fireEvent.click(screen.getByTestId('notification-trigger'));
}
function login() {
  fireEvent.change(screen.getByLabelText('Email Address'), {
    target: { value: context.email },
  });
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'password' },
  });
  fireEvent.click(screen.getByTestId('submit-button'));
}
describe('Stage 13 identity and explicit notification UI', () => {
  it('Login keeps accessible fields and canonical identity without prompting', () => {
    render(
      <LoginView
        onLogin={vi.fn()}
        isLoading={false}
        errorMessage="Authentication failed."
        isConfigured
      />,
    );
    const view = screen.getByTestId('login-view');
    expect(view.querySelector('img')?.getAttribute('src')).toContain(
      'cradlehub-icon.png',
    );
    expect(screen.getByText('CradleHub Desktop')).toBeDefined();
    expect(screen.getByLabelText('Email Address')).toBeDefined();
    expect(screen.getByLabelText('Password')).toBeDefined();
    expect(screen.getByRole('alert').textContent).toContain(
      'Authentication failed',
    );
    expect(requestPermission).not.toHaveBeenCalled();
  });
  it('real access resolution shows branded checking state and immediately yields to authenticated shell', async () => {
    let resolve!: (value: AuthContext) => void;
    vi.spyOn(auth, 'authenticateWithPassword').mockResolvedValue(user);
    vi.spyOn(auth, 'resolveStaffAndBranchContext').mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    render(<App />);
    expect(requestPermission).not.toHaveBeenCalled();
    login();
    await waitFor(() =>
      expect(screen.getByTestId('startup-identity')).toBeDefined(),
    );
    const startup = screen.getByTestId('startup-identity');
    expect(startup.querySelector('img')?.getAttribute('src')).toContain(
      'cradlehub-icon.png',
    );
    expect(within(startup).getByRole('heading').textContent).toBe(
      'CradleHub Desktop',
    );
    expect(within(startup).getByRole('status').textContent).toContain(
      'Checking secure access',
    );
    expect(within(startup).queryByRole('progressbar')).toBeNull();
    expect(startup.textContent).not.toMatch(/\d+%/);
    expect(requestPermission).not.toHaveBeenCalled();
    resolve(context);
    await waitFor(() =>
      expect(screen.getByTestId('canonical-shell')).toBeDefined(),
    );
    expect(screen.queryByTestId('startup-identity')).toBeNull();
    expect(requestPermission).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });
  it('access resolution failure returns to Login with truthful error and no prompt', async () => {
    vi.spyOn(auth, 'authenticateWithPassword').mockResolvedValue(user);
    vi.spyOn(auth, 'resolveStaffAndBranchContext').mockRejectedValue(
      new auth.ContextLoadError('Could not load branch context.'),
    );
    render(<App />);
    login();
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Could not load branch context',
      ),
    );
    expect(screen.queryByTestId('startup-identity')).toBeNull();
    expect(screen.getByTestId('login-view')).toBeDefined();
    expect(
      (screen.getByLabelText('Email Address') as HTMLInputElement).value,
    ).toBe(context.email);
    expect((screen.getByLabelText('Password') as HTMLInputElement).value).toBe(
      'password',
    );
    expect(requestPermission).not.toHaveBeenCalled();
  });
  it('shell mount does not check or prompt; bell queries permission with truthful loading and closes accessibly', async () => {
    let resolve!: (value: boolean) => void;
    vi.mocked(isPermissionGranted).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    mountShell();
    expect(isPermissionGranted).not.toHaveBeenCalled();
    expect(requestPermission).not.toHaveBeenCalled();
    const trigger = screen.getByTestId('notification-trigger');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.querySelector('span')).toBeNull();
    openBell();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(trigger.getAttribute('aria-controls')).toBe(
      screen.getByTestId('notification-panel').id,
    );
    expect(screen.getByRole('status').textContent).toContain(
      'Checking notification permission',
    );
    expect(screen.queryByText('Enable Desktop Notifications')).toBeNull();
    expect(screen.queryByText('Send Test Notification')).toBeNull();
    resolve(false);
    await waitFor(() =>
      expect(screen.getByText('Enable Desktop Notifications')).toBeDefined(),
    );
    expect(screen.getByRole('status').textContent).toContain('not enabled');
    expect(screen.queryByText(/Permission denied/)).toBeNull();
    expect(
      screen.getByText(
        'Operational alerts are not connected to a desktop event feed.',
      ),
    ).toBeDefined();
    const enable = screen.getByRole('button', {
      name: 'Enable Desktop Notifications',
    });
    enable.focus();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('notification-panel')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(requestPermission).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });
  it('explicit Enable grants permission; explicit test click sends only diagnostic content', async () => {
    vi.mocked(requestPermission).mockResolvedValue('granted');
    mountShell();
    openBell();
    await waitFor(() =>
      expect(screen.getByText('Enable Desktop Notifications')).toBeDefined(),
    );
    expect(requestPermission).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Enable Desktop Notifications'));
    await waitFor(() =>
      expect(screen.getByText('Send Test Notification')).toBeDefined(),
    );
    expect(requestPermission).toHaveBeenCalledOnce();
    expect(screen.queryByText('Enable Desktop Notifications')).toBeNull();
    expect(sendNotification).not.toHaveBeenCalled();
    vi.mocked(isPermissionGranted).mockResolvedValue(true);
    fireEvent.click(screen.getByText('Send Test Notification'));
    await waitFor(() => expect(sendNotification).toHaveBeenCalledOnce());
    expect(sendNotification).toHaveBeenCalledWith({
      title: 'CradleHub Desktop — Test Notification',
      body: 'Desktop notifications are enabled on this device.',
    });
    expect(screen.getByRole('status').textContent).toContain(
      'Windows display is not confirmed',
    );
    openBell();
    expect(screen.queryByTestId('notification-panel')).toBeNull();
  });
  it('explicit denial is truthful and never automatically retried', async () => {
    vi.mocked(requestPermission).mockResolvedValue('denied');
    mountShell();
    openBell();
    await waitFor(() =>
      expect(screen.getByText('Enable Desktop Notifications')).toBeDefined(),
    );
    fireEvent.click(screen.getByText('Enable Desktop Notifications'));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Windows did not grant',
      ),
    );
    expect(requestPermission).toHaveBeenCalledOnce();
    expect(sendNotification).not.toHaveBeenCalled();
    expect(screen.queryByText('Send Test Notification')).toBeNull();
  });
  it('permission check error offers check retry without exposing raw plugin error or prompting', async () => {
    vi.mocked(isPermissionGranted)
      .mockRejectedValueOnce(new Error('secret internals'))
      .mockResolvedValue(true);
    mountShell();
    openBell();
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Could not check',
      ),
    );
    expect(screen.getByRole('alert').textContent).not.toContain(
      'secret internals',
    );
    fireEvent.click(screen.getByText('Retry Permission Check'));
    await waitFor(() =>
      expect(screen.getByText('Send Test Notification')).toBeDefined(),
    );
    expect(requestPermission).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });
  it('request failure is truthful and send failure never claims success', async () => {
    vi.mocked(requestPermission).mockRejectedValueOnce(
      new Error('raw internals'),
    );
    mountShell();
    openBell();
    await waitFor(() =>
      expect(screen.getByText('Enable Desktop Notifications')).toBeDefined(),
    );
    fireEvent.click(screen.getByText('Enable Desktop Notifications'));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Could not request desktop notification permission',
      ),
    );
    vi.mocked(isPermissionGranted).mockResolvedValue(true);
    fireEvent.click(screen.getByText('Retry Permission Check'));
    await waitFor(() =>
      expect(screen.getByText('Send Test Notification')).toBeDefined(),
    );
    vi.mocked(sendNotification).mockImplementation(() => {
      throw new Error('raw internals');
    });
    fireEvent.click(screen.getByText('Send Test Notification'));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain(
        'Could not request the test notification',
      ),
    );
    expect(screen.getByRole('alert').textContent).not.toContain(
      'raw internals',
    );
  });
  it('native-unavailable mode offers neither permission request nor test send', async () => {
    Reflect.deleteProperty(window, '__TAURI_INTERNALS__');
    mountShell();
    openBell();
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toContain(
        'only in the desktop app',
      ),
    );
    expect(screen.queryByText('Enable Desktop Notifications')).toBeNull();
    expect(screen.queryByText('Send Test Notification')).toBeNull();
    expect(requestPermission).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });
  it('pending explicit request cannot be duplicated by rapid clicks', async () => {
    let resolve!: (permission: NotificationPermission) => void;
    vi.mocked(requestPermission).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    mountShell();
    openBell();
    await waitFor(() =>
      expect(screen.getByText('Enable Desktop Notifications')).toBeDefined(),
    );
    const button = screen.getByText('Enable Desktop Notifications');
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(requestPermission).toHaveBeenCalledOnce());
    expect(screen.getByRole('status').textContent).toContain(
      'Working with native notifications',
    );
    resolve('granted');
    await waitFor(() =>
      expect(screen.getByText('Send Test Notification')).toBeDefined(),
    );
    expect(requestPermission).toHaveBeenCalledOnce();
  });
});
