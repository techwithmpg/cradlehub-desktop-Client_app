import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import {
  checkDesktopNotificationPermission,
  requestDesktopNotificationPermission,
  sendDesktopTestNotification,
} from '../src/lib/desktop-notifications';
vi.mock('@tauri-apps/plugin-notification', () => ({
  isPermissionGranted: vi.fn(),
  requestPermission: vi.fn(),
  sendNotification: vi.fn(),
}));
beforeEach(() => {
  vi.resetAllMocks();
  Object.defineProperty(window, '__TAURI_INTERNALS__', {
    configurable: true,
    value: {},
  });
  vi.mocked(isPermissionGranted).mockResolvedValue(false);
});
afterEach(() => {
  Reflect.deleteProperty(window, '__TAURI_INTERNALS__');
});
describe('native notification boundary', () => {
  it.each([true, false])(
    'checks permission without requesting or sending: %s',
    async (granted) => {
      vi.mocked(isPermissionGranted).mockResolvedValue(granted);
      expect((await checkDesktopNotificationPermission()).permission).toBe(
        granted ? 'granted' : 'not-enabled',
      );
      expect(requestPermission).not.toHaveBeenCalled();
      expect(sendNotification).not.toHaveBeenCalled();
    },
  );
  it('never uses browser notifications when native API is absent', async () => {
    Reflect.deleteProperty(window, '__TAURI_INTERNALS__');
    expect((await checkDesktopNotificationPermission()).permission).toBe(
      'unavailable',
    );
    expect((await requestDesktopNotificationPermission()).permission).toBe(
      'unavailable',
    );
    expect((await sendDesktopTestNotification()).permission).toBe(
      'unavailable',
    );
    expect(isPermissionGranted).not.toHaveBeenCalled();
    expect(requestPermission).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });
  it('does not request already-granted permission', async () => {
    vi.mocked(isPermissionGranted).mockResolvedValue(true);
    expect((await requestDesktopNotificationPermission()).permission).toBe(
      'granted',
    );
    expect(requestPermission).not.toHaveBeenCalled();
  });
  it.each(['granted', 'denied', 'default'] as const)(
    'maps explicit request result %s',
    async (permission) => {
      vi.mocked(requestPermission).mockResolvedValue(permission);
      expect((await requestDesktopNotificationPermission()).permission).toBe(
        permission === 'default' ? 'not-enabled' : permission,
      );
      expect(requestPermission).toHaveBeenCalledOnce();
      expect(sendNotification).not.toHaveBeenCalled();
    },
  );
  it('contains permission-check errors and does not prompt/send', async () => {
    vi.mocked(isPermissionGranted).mockRejectedValue(
      new Error('private plugin internals'),
    );
    for (const operation of [
      checkDesktopNotificationPermission,
      requestDesktopNotificationPermission,
      sendDesktopTestNotification,
    ]) {
      const result = await operation();
      expect(result.permission).toBe('error');
      expect(result.message).not.toContain('private plugin internals');
    }
    expect(requestPermission).not.toHaveBeenCalled();
    expect(sendNotification).not.toHaveBeenCalled();
  });
  it('contains explicit permission request errors', async () => {
    vi.mocked(requestPermission).mockRejectedValue(
      new Error('private plugin internals'),
    );
    const result = await requestDesktopNotificationPermission();
    expect(result.permission).toBe('error');
    expect(result.message).not.toContain('private plugin internals');
  });
  it('sends only fixed diagnostic content after granted check, without delivery claim', async () => {
    vi.mocked(isPermissionGranted).mockResolvedValue(true);
    const result = await sendDesktopTestNotification();
    expect(sendNotification).toHaveBeenCalledWith({
      title: 'CradleHub Desktop — Test Notification',
      body: 'Desktop notifications are enabled on this device.',
    });
    expect(result.submitted).toBe(true);
    expect(result.message).toContain('Windows display is not confirmed');
    expect(requestPermission).not.toHaveBeenCalled();
  });
  it('does not send or request permission when permission is absent', async () => {
    expect((await sendDesktopTestNotification()).permission).toBe(
      'not-enabled',
    );
    expect(sendNotification).not.toHaveBeenCalled();
    expect(requestPermission).not.toHaveBeenCalled();
  });
  it('contains synchronous plugin send errors', async () => {
    vi.mocked(isPermissionGranted).mockResolvedValue(true);
    vi.mocked(sendNotification).mockImplementation(() => {
      throw new Error('private plugin internals');
    });
    const result = await sendDesktopTestNotification();
    expect(result.permission).toBe('error');
    expect(result.submitted).toBeUndefined();
    expect(result.message).not.toContain('private plugin internals');
  });
});
