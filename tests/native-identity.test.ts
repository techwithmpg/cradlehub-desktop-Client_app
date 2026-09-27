import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';

describe('Stage 13 native identity and capability boundaries', () => {
  it('preserves accepted product/window/network configuration and disabled bundling', () => {
    const config = JSON.parse(
      readFileSync('src-tauri/tauri.conf.json', 'utf8'),
    );
    expect(config.productName).toBe('CradleHub Desktop');
    expect(config.identifier).toBe('com.techwithmpg.cradlehub.desktop');
    expect(config.version).toBe('0.0.0');
    expect(config.bundle.active).toBe(false);
    expect(config.app.windows).toEqual([
      {
        label: 'main',
        title: 'CradleHub Desktop',
        width: 1100,
        height: 760,
        minWidth: 640,
        minHeight: 480,
      },
    ]);
    const capability = JSON.parse(
      readFileSync('src-tauri/capabilities/desktop-api.json', 'utf8'),
    );
    expect(capability.windows).toEqual(['main']);
    expect(capability.permissions).toEqual([
      {
        identifier: 'http:default',
        allow: [
          { url: 'https://www.cradlewellnessliving.com/api/desktop/v1/*' },
        ],
      },
      'notification:allow-is-permission-granted',
      'notification:allow-request-permission',
      'notification:allow-notify',
    ]);
  });
  it('registers exactly one notification plugin and preserves HTTP', () => {
    const rust = readFileSync('src-tauri/src/lib.rs', 'utf8');
    expect(
      rust.match(/\.plugin\(tauri_plugin_notification::init\(\)\)/g),
    ).toHaveLength(1);
    expect(rust.match(/\.plugin\(tauri_plugin_http::init\(\)\)/g)).toHaveLength(
      1,
    );
    expect(rust).not.toMatch(/tray|autostart|shell|sql/);
  });
  it('copies the canonical source byte for byte and removes obsolete placeholder', () => {
    const source = readFileSync('src/assets/brand/cradlehub-icon.png');
    expect(createHash('sha256').update(source).digest('hex')).toBe(
      '42eb8ba6583a74a4e8823cda756093c4e4cbb4791063c6310b33a2eade5863e1',
    );
    expect(existsSync('src-tauri/icons/app-icon.svg')).toBe(false);
    for (const name of [
      '32x32.png',
      '128x128.png',
      '128x128@2x.png',
      'icon.ico',
      'icon.icns',
    ])
      expect(existsSync(`src-tauri/icons/${name}`)).toBe(true);
  });
  it('introduces no operational alert feed, web push or polling in the notification helper', () => {
    const service = readFileSync('src/lib/desktop-notifications.ts', 'utf8');
    expect(service).not.toMatch(
      /supabase|setInterval|serviceWorker|PushManager|WebSocket|addPluginListener|onNotification/i,
    );
    expect(service).not.toMatch(/export.*sendNotification/);
    expect(service).toContain('sendDesktopTestNotification()');
  });
});
