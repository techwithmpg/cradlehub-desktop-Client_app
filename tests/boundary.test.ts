import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import config from '../src-tauri/tauri.conf.json';
import { AUTHORIZED_NAV_ITEMS } from '../src/lib/navigation';

describe('Stage 01/02 authority and security boundaries', () => {
  it('enforces least-privilege native capabilities and narrow CSP', () => {
    expect(config.app.security.capabilities).toEqual(['desktop-api']);
    // CSP must not contain broad wildcards
    expect(config.app.security.csp).not.toContain('connect-src *');
    expect(config.app.security.csp).not.toContain('connect-src https:');
    expect(config.app.security.csp).toMatch(
      /connect-src 'self' https:\/\/[a-zA-Z0-9.-]+\.supabase\.co/,
    );

    const rust = readFileSync('src-tauri/src/lib.rs', 'utf8');
    expect(rust).not.toMatch(/invoke_handler|#\[tauri::command\]/);
    expect(rust).toMatch(/tauri_plugin_http::init\(\)/);

    const capabilityJson = JSON.parse(
      readFileSync('src-tauri/capabilities/desktop-api.json', 'utf8'),
    );
    expect(capabilityJson.identifier).toBe('desktop-api');
    const permissions = capabilityJson.permissions;
    expect(Array.isArray(permissions)).toBe(true);

    const allowedUrls: string[] = [];
    for (const perm of permissions) {
      if (typeof perm === 'object' && perm.allow) {
        for (const rule of perm.allow) {
          if (rule.url) allowedUrls.push(rule.url);
        }
      }
    }

    expect(allowedUrls).toEqual([
      'https://www.cradlewellnessliving.com/api/desktop/v1/*',
    ]);
    for (const url of allowedUrls) {
      expect(url).not.toContain('*com');
      expect(url).not.toContain('*app');
      expect(url).not.toContain('*ph');
      expect(url).not.toContain('*.');
      expect(url).not.toContain('vercel.app');
      expect(url).not.toBe('https://*');
      expect(url).not.toBe('http://*');
      expect(url).not.toContain('http://');
    }
  });

  it('has no durable auth persistence in localStorage, sessionStorage, indexedDB, or SQLite', () => {
    function scanDir(dir: string): string[] {
      const entries = readdirSync(dir, { withFileTypes: true });
      let files: string[] = [];
      for (const entry of entries) {
        const fullPath = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
          files = files.concat(scanDir(fullPath));
        } else if (/\.tsx?$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const sourceFiles = scanDir('src');
    const combinedSources = sourceFiles
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');

    expect(combinedSources).not.toMatch(/localStorage/);
    expect(combinedSources).not.toMatch(/sessionStorage/);
    expect(combinedSources).not.toMatch(/indexedDB/);
    expect(combinedSources).not.toMatch(/sqlite/i);
    expect(combinedSources).not.toMatch(/console\.log\([^)]*password/i);
    expect(combinedSources).not.toMatch(/console\.log\([^)]*token/i);
  });

  it('contains no unsupported runtime claims or leaked developer terminology', () => {
    function scanDir(dir: string): string[] {
      const entries = readdirSync(dir, { withFileTypes: true });
      let files: string[] = [];
      for (const entry of entries) {
        const fullPath = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
          files = files.concat(scanDir(fullPath));
        } else if (/\.tsx?$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const sourceFiles = scanDir('src');
    const combinedSources = sourceFiles
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');

    expect(combinedSources).not.toMatch(/RLS Verified/i);
    expect(combinedSources).not.toMatch(/Production Verified/i);
    expect(combinedSources).not.toMatch(/Live Verified/i);
    expect(combinedSources).not.toMatch(/Sync Verified/i);
    expect(combinedSources).not.toMatch(/Stage 01 Scope/i);
    expect(combinedSources).not.toMatch(/Canonical Shell/i);
    expect(combinedSources).not.toMatch(/Session Authority/i);
    expect(combinedSources).not.toMatch(/Active Operator/i);
  });

  it('configures in-memory session with autoRefreshToken enabled and URL session detection disabled', () => {
    const supabaseSrc = readFileSync('src/lib/supabase.ts', 'utf8');
    expect(supabaseSrc).toMatch(/persistSession:\s*false/);
    expect(supabaseSrc).toMatch(/autoRefreshToken:\s*true/);
    expect(supabaseSrc).toMatch(/detectSessionInUrl:\s*false/);
  });

  it('preserves names-only .env.example without secrets', () => {
    const envExample = readFileSync('.env.example', 'utf8');
    expect(envExample).toMatch(/^VITE_SUPABASE_URL=\r?\n/m);
    expect(envExample).toMatch(/^VITE_SUPABASE_ANON_KEY=\r?\n/m);
    expect(envExample).toMatch(/^VITE_CRADLEHUB_API_URL=\r?\n?$/m);
  });

  it('contains exactly the eight authorized navigation items and excludes dormant modules', () => {
    const navIds = AUTHORIZED_NAV_ITEMS.map((item) => item.id);
    expect(navIds).toHaveLength(8);
    expect(navIds).toEqual([
      'today',
      'bookings',
      'attendance',
      'customers',
      'schedule',
      'home-service',
      'staff',
      'settings',
    ]);

    // Ensure dormant modules are NOT in navigation
    const dormant = [
      'owner',
      'payments',
      'finance',
      'reports',
      'reconciliation',
      'payroll',
      'marketing',
    ];
    for (const d of dormant) {
      expect(navIds).not.toContain(d);
    }
  });
});
