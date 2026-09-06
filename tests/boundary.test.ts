import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import config from '../src-tauri/tauri.conf.json';
import { AUTHORIZED_NAV_ITEMS } from '../src/lib/navigation';

describe('Stage 01 authority and security boundaries', () => {
  it('grants no renderer native capabilities and enforces narrow CSP', () => {
    expect(config.app.security.capabilities).toEqual([]);
    // CSP must not contain broad wildcards
    expect(config.app.security.csp).not.toContain('connect-src *');
    expect(config.app.security.csp).not.toContain('connect-src https:');
    expect(config.app.security.csp).toMatch(
      /connect-src 'self' https:\/\/[a-zA-Z0-9.-]+\.supabase\.co/,
    );

    const rust = readFileSync('src-tauri/src/lib.rs', 'utf8');
    expect(rust).not.toMatch(/invoke_handler|#\[tauri::command\]|\.plugin\(/);
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
