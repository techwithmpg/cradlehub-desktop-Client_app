import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

export type DesktopNotificationPermission =
  'granted' | 'not-enabled' | 'denied' | 'unavailable' | 'error';
export interface DesktopNotificationResult {
  permission: DesktopNotificationPermission;
  message: string;
  submitted?: boolean;
}

const unavailable: DesktopNotificationResult = {
  permission: 'unavailable',
  message: 'Native notifications are available only in the desktop app.',
};
const granted: DesktopNotificationResult = {
  permission: 'granted',
  message: 'Desktop notification permission is granted on this device.',
};
const notEnabled: DesktopNotificationResult = {
  permission: 'not-enabled',
  message: 'Desktop notifications are not enabled on this device.',
};
function nativeAvailable() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export async function checkDesktopNotificationPermission(): Promise<DesktopNotificationResult> {
  if (!nativeAvailable()) return unavailable;
  try {
    return (await isPermissionGranted()) ? granted : notEnabled;
  } catch {
    return {
      permission: 'error',
      message:
        'Could not check desktop notification permission. Please try again.',
    };
  }
}

// Called only by the explicit Enable action; checks and sends never prompt.
export async function requestDesktopNotificationPermission(): Promise<DesktopNotificationResult> {
  const current = await checkDesktopNotificationPermission();
  if (current.permission !== 'not-enabled') return current;
  try {
    const permission = await requestPermission();
    if (permission === 'granted') return granted;
    if (permission === 'denied')
      return {
        permission: 'denied',
        message:
          'Windows did not grant notification permission. You can continue using CradleHub without desktop notifications.',
      };
    return notEnabled;
  } catch {
    return {
      permission: 'error',
      message:
        'Could not request desktop notification permission. Please try again.',
    };
  }
}

export async function sendDesktopTestNotification(): Promise<DesktopNotificationResult> {
  const current = await checkDesktopNotificationPermission();
  if (current.permission !== 'granted') return current;
  try {
    // The official API returns void; it does not acknowledge OS display or delivery.
    sendNotification({
      title: 'CradleHub Desktop — Test Notification',
      body: 'Desktop notifications are enabled on this device.',
    });
    return {
      ...granted,
      submitted: true,
      message:
        'Test notification requested through the native plugin. Windows display is not confirmed.',
    };
  } catch {
    return {
      permission: 'error',
      message: 'Could not request the test notification. Please try again.',
    };
  }
}
