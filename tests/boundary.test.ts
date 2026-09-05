import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { App } from '../src/App';
import config from '../src-tauri/tauri.conf.json';
describe('Stage 00 authority boundary', () => {
  it('presents unavailable identity and connection without operational actions', () => {
    const html = renderToStaticMarkup(createElement(App));
    expect(html).toContain('Not authenticated');
    expect(html).toContain('Not established');
    expect(html).not.toMatch(/<(button|input|form|table|nav)\b/);
  });
  it('grants no renderer native capabilities or production network access', () => {
    expect(config.app.security.capabilities).toEqual([]);
    expect(config.app.security.csp).toContain("connect-src 'none'");
    const rust = readFileSync('src-tauri/src/lib.rs', 'utf8');
    expect(rust).not.toMatch(/invoke_handler|#\[tauri::command\]|\.plugin\(/);
  });
  it('has no durable state or network clients in renderer sources', () => {
    const sources = readdirSync('src')
      .filter((f) => /\.tsx?$/.test(f))
      .map((f) => readFileSync('src/' + f, 'utf8'))
      .join('\n');
    expect(sources).not.toMatch(
      /localStorage|sessionStorage|indexedDB|fetch\(|WebSocket|setInterval|supabase|invoke\(/,
    );
  });
});
