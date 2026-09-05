# Stage 00 desktop boundary

Status: implemented for independent review; not an accepted ADR or owner-accepted gate.

One Windows Tauri 2 application hosts one static Vite/React/TypeScript renderer. Rust only starts the native runtime. React only renders initialization and unavailable authentication/connection states. No module navigation, forms, data client, business records, auth transport, command handlers, plugins, durable store, worker, polling, or synchronization is introduced.

The production renderer CSP has connect-src 'none'. Tauri security.capabilities is an explicit empty array; no capability files grant APIs. No privileged renderer commands exist. Native decorated window controls are handled by the window manager. Future additions require explicit stage scope and least-privilege capabilities.

pnpm 10.33.2 is the sole package manager. Exact direct dependencies and pnpm-lock.yaml are committed; Cargo.lock pins Rust resolution. Node 25.2.0 is the actual checked host; engines permit >=24 <26. TypeScript 6.0.3 was selected within typescript-eslint 8.69.0's supported peer range after latest resolved to unsupported TypeScript 7.0.2. ESLint 10 replaces the deprecated initial ESLint 9 resolution. These are scaffold choices, not hosted tooling changes.

Vite binds only 127.0.0.1:1420 with a strict port, serves the static renderer, and excludes src-tauri from file watching. Tauri uses ../dist for built assets. Development CSP permits only local Vite/HMR needs; production blocks network connections. Debug facilities are for local verification. Installer bundling/signing/update distribution remain unconfigured and unverified.

Reference documentation consulted: [Tauri Vite integration](https://v2.tauri.app/start/frontend/vite/), [Tauri capabilities](https://v2.tauri.app/security/capabilities/), [Vite guide](https://vite.dev/guide/), [Tailwind Vite installation](https://tailwindcss.com/docs/installation/using-vite). Repository configuration and actual checks are the evidence for this scaffold.
