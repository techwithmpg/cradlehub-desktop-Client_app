# Stage 13 — Native App Identity & Notification Foundation

## Target, authority and reconciled baseline

- Target: CradleHub Desktop (`techwithmpg/cradlehub-desktop-Client_app`).
- Authorized branch: `stage/13-native-identity-notifications`.
- BASE_SHA: `0b369fc0ea0a1e1d931fa04514fb588191b687d0`.
- HOSTED_REFERENCE_SHA: `03242a0bfbcfe6c4b1b03ba624510004cae7cc6a` (`techwithmpg/Cradlehub`).
- HEAD_SHA: resolved after commit/push and reported in the final handoff; the commit cannot encode its own SHA. Resolve the evidence revision with `git log -1 --format=%H -- docs/30-delivery/STAGE_13_EVIDENCE.md`.
- Verification date: 2026-09-27.

**REPOSITORY-RECORDED PRODUCTION EVIDENCE:** Desktop main was fetched and verified clean at BASE_SHA. Hosted main was queried independently and exactly matched HOSTED_REFERENCE_SHA. Its existing read-only checkout supplied the verified canonical assets; hosted source was not changed. These facts establish repository content, not production runtime behavior.

The brief described window dimensions, an initial auth check and an opener plugin that differ from the accepted source. The owner explicitly selected preservation of the accepted source: 1100×760 default, 640×480 minimum; branded identity during the existing post-login context-resolution state, without auth/session restore; HTTP preserved without adding the absent opener plugin. No second window, timer, percentage or fake initialization phase was added. Auth services, session handling, role/branch resolution and business mutation contracts are unchanged.

## Canonical identity

Both hosted assets were inspected before copying:

| Hosted asset                   | Git blob SHA                               | Use                                           |
| ------------------------------ | ------------------------------------------ | --------------------------------------------- |
| `public/icon.png`              | `7e6542e44e30795b49c0fce740eee239cf7bef94` | Inspected reference                           |
| `public/manifest-icon-512.png` | `0e48eb7eb4d7ab67c0bfb9a762e2520b8269384a` | Copied canonical 512px native/frontend source |

- Local source: `src/assets/brand/cradlehub-icon.png`.
- Local SHA-256: `42eb8ba6583a74a4e8823cda756093c4e4cbb4791063c6310b33a2eade5863e1`.
- Local `git hash-object` equals the hosted blob `0e48eb7eb4d7ab67c0bfb9a762e2520b8269384a`: copied bytes are identical.
- Canonical source has a forest background and white hands/leaf mark. It was neither recreated nor redesigned.

The pinned Tauri CLI `2.11.4` was inspected with `pnpm tauri icon --help`, then `pnpm tauri icon src/assets/brand/cradlehub-icon.png` generated the native files below. All 52 generated/replaced outputs are retained as official platform assets; this adds no platform build target, installer or bundling configuration. Obsolete `src-tauri/icons/app-icon.svg` was removed. Existing active `icon.ico` was replaced.

Generated 32×32 and 128×128 PNGs were visually inspected: canonical proportions, padding, forest background, no stretch/crop or blue C. PNG dimensions were checked, and the ICO header/frame bounds contain 16, 24, 32, 48, 64 and 256px sizes. Actual Windows taskbar rendering remains unobserved.

Startup, Login and the existing sidebar import the same frontend asset. Adjacent application text names the decorative images accessibly. Startup uses existing Login surfaces, typography and tokens with a small reduced-motion-aware indicator and truthful `Checking secure access…` text. It appears only while the real staff/branch context request is pending and disappears when it resolves. Login remains mounted but hidden during checking to preserve entered credentials if context resolution fails. Real login validation, password semantics and error handling are preserved.

Product name and window title remain `CradleHub Desktop`. Identifier remains `com.techwithmpg.cradlehub.desktop`; version remains `0.0.0`. Window dimensions remain the accepted values above; `bundle.active` remains `false`. Tauri config, CSP and network origins are unchanged.

### Exact native generated/replaced outputs

```text
src-tauri/icons/128x128.png
src-tauri/icons/128x128@2x.png
src-tauri/icons/32x32.png
src-tauri/icons/64x64.png
src-tauri/icons/Square107x107Logo.png
src-tauri/icons/Square142x142Logo.png
src-tauri/icons/Square150x150Logo.png
src-tauri/icons/Square284x284Logo.png
src-tauri/icons/Square30x30Logo.png
src-tauri/icons/Square310x310Logo.png
src-tauri/icons/Square44x44Logo.png
src-tauri/icons/Square71x71Logo.png
src-tauri/icons/Square89x89Logo.png
src-tauri/icons/StoreLogo.png
src-tauri/icons/android/mipmap-anydpi-v26/ic_launcher.xml
src-tauri/icons/android/mipmap-hdpi/ic_launcher.png
src-tauri/icons/android/mipmap-hdpi/ic_launcher_foreground.png
src-tauri/icons/android/mipmap-hdpi/ic_launcher_round.png
src-tauri/icons/android/mipmap-mdpi/ic_launcher.png
src-tauri/icons/android/mipmap-mdpi/ic_launcher_foreground.png
src-tauri/icons/android/mipmap-mdpi/ic_launcher_round.png
src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png
src-tauri/icons/android/mipmap-xhdpi/ic_launcher_foreground.png
src-tauri/icons/android/mipmap-xhdpi/ic_launcher_round.png
src-tauri/icons/android/mipmap-xxhdpi/ic_launcher.png
src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_foreground.png
src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_round.png
src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher.png
src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_foreground.png
src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_round.png
src-tauri/icons/android/values/ic_launcher_background.xml
src-tauri/icons/icon.icns
src-tauri/icons/icon.ico
src-tauri/icons/icon.png
src-tauri/icons/ios/AppIcon-20x20@1x.png
src-tauri/icons/ios/AppIcon-20x20@2x-1.png
src-tauri/icons/ios/AppIcon-20x20@2x.png
src-tauri/icons/ios/AppIcon-20x20@3x.png
src-tauri/icons/ios/AppIcon-29x29@1x.png
src-tauri/icons/ios/AppIcon-29x29@2x-1.png
src-tauri/icons/ios/AppIcon-29x29@2x.png
src-tauri/icons/ios/AppIcon-29x29@3x.png
src-tauri/icons/ios/AppIcon-40x40@1x.png
src-tauri/icons/ios/AppIcon-40x40@2x-1.png
src-tauri/icons/ios/AppIcon-40x40@2x.png
src-tauri/icons/ios/AppIcon-40x40@3x.png
src-tauri/icons/ios/AppIcon-512@2x.png
src-tauri/icons/ios/AppIcon-60x60@2x.png
src-tauri/icons/ios/AppIcon-60x60@3x.png
src-tauri/icons/ios/AppIcon-76x76@1x.png
src-tauri/icons/ios/AppIcon-76x76@2x.png
src-tauri/icons/ios/AppIcon-83.5x83.5@2x.png
```

## Native notification foundation

The official `pnpm tauri add notification` installer added dependencies, registration and its broad permission, then exited with a Windows command-wrapper error after setup. Its actual outputs were inspected; dependency versions were explicitly normalized and Rust formatting/compilation checked. An initial JS 2.5/Rust 2.4 mismatch was detected by native launch and corrected; final JS and Rust plugin versions both use **2.4.0** with exact pins and generated lockfiles. No version-mismatch override is used.

- JS dependency: `@tauri-apps/plugin-notification: 2.4.0`.
- Rust dependency: `tauri-plugin-notification = "=2.4.0"`.
- Exactly one `.plugin(tauri_plugin_notification::init())` registration.
- Existing HTTP registration retained; no opener registration existed at BASE_SHA.
- Exact capability additions, restricted to the existing main window:
  - `notification:allow-is-permission-granted`
  - `notification:allow-request-permission`
  - `notification:allow-notify`
- Broad `notification:default`: **ABSENT**.
- Existing HTTP scope remains exactly `https://www.cradlewellnessliving.com/api/desktop/v1/*`.

`src/lib/desktop-notifications.ts` is the sole notification boundary. It uses the official permission/check/send functions, guards native availability and exposes only a permission check, explicit permission request, and fixed diagnostic test. Plugin failures return concise safe messages; raw internals are not displayed. Initial false permission means not enabled, not denied. Denied is reported only from an explicit request result. Permission checks and test sends never request permission.

The existing shell bell/popover is reused. Opening it checks permission; the explicit Enable button requests permission, and only a granted state exposes Send Test Notification. Operations have a synchronous pending lock; repeat clicks cannot duplicate requests. Checking, not-enabled, granted, denial, error/retry and native-unavailable states are distinct. Semantic buttons, expanded state, dialog relation, outside-click close and Escape with focus restoration are retained or verified. No new notification center or Settings module was introduced.

Automatic permission prompt: **NO**. The accepted baseline bell already contained no unread dot/count; it remains absent, and no unread entries/history were added. Operational business notification feed: **NOT CONNECTED**. No accepted Desktop business-event notification contract was introduced/identified for this stage; no polling, Realtime, web push/service worker or business alert sourcing is wired.

The diagnostic content is fixed:

```text
Title: CradleHub Desktop — Test Notification
Body: Desktop notifications are enabled on this device.
```

No customer, booking, staff or payment fields enter this helper. The official JS `sendNotification` API returns `void`; the UI reports `Test notification requested through the native plugin. Windows display is not confirmed.` after the call returns. It catches synchronous plugin errors but cannot certify asynchronous OS handling or delivery from this API. No delivered-success claim is made.

Official references: [Tauri notification setup and Windows development limitation](https://v2.tauri.app/plugin/notification/), [notification plugin source](https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/notification). Installed 2.4 source was inspected as the actual local API contract. Windows development toast identity can appear under PowerShell; final installed application name/icon is **NOT YET CERTIFIED — installer/release stage required**. No registration hack was added.

## Verification

Node `24.14.0`, pnpm `10.33.2`, repository-pinned Prettier `3.9.6`, cargo/rustc `1.98.0` were used. Test/lint/build configuration was not weakened.

| Command                                                                                                                                                                                                        | Result                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `pnpm exec vitest run tests/desktop-notifications.test.ts tests/native-identity.test.ts tests/native-identity-components.test.tsx tests/components.test.tsx tests/auth-service.test.ts tests/boundary.test.ts` | PASS: 69 tests, 6 files                               |
| `pnpm test`                                                                                                                                                                                                    | PASS: 701 tests, 26 files                             |
| `pnpm typecheck`                                                                                                                                                                                               | PASS                                                  |
| `pnpm lint`                                                                                                                                                                                                    | PASS, zero warnings                                   |
| `pnpm format:check`                                                                                                                                                                                            | PASS                                                  |
| `pnpm build`                                                                                                                                                                                                   | PASS: frontend TypeScript/Vite build, 1964 modules    |
| `cargo check --locked` in `src-tauri`                                                                                                                                                                          | PASS; final native plugin 2.4 compiled                |
| `cargo fmt --manifest-path src-tauri/Cargo.toml --check`                                                                                                                                                       | PASS                                                  |
| `pnpm tauri build --debug --no-bundle`                                                                                                                                                                         | PASS: isolated debug executable; no installer bundles |
| `git diff --check`                                                                                                                                                                                             | PASS                                                  |

The 26 added cases cover native-unavailable behavior, permission grant/absence/default/denial/errors, check/send never prompting, fixed diagnostic payload, synchronous send failure, real branded context resolution, retained credentials on context failure, Login identity, shell mounting/opening/loading, explicit actions, repeat-click protection, errors/retry, Escape focus, canonical asset integrity, exact native configuration/permissions/registration and absence of operational notification infrastructure. Prior auth and sensitive renderer mutation boundary regressions remain included. Tests use mocked plugin/auth boundaries and jsdom; they are not Windows toast or native viewport evidence.

Frontend build has the existing nonfatal >500KB chunk-size warning. No performance/configuration work or warning suppression is included. A shared native build lock initially delayed validation; an additional successful `cargo check --locked` used `CARGO_TARGET_DIR` in a temporary validation directory, without stopping the unknown process. The first native debug build could not replace the shared target executable because Windows held it in use. The final isolated debug build passed using that temporary target directory; no running process was stopped and no temporary build output is committed.

## Actual native runtime and limitations

After plugin version alignment, `pnpm tauri dev` compiled/started the debug executable, but its frontend before-dev command failed because port 1420 was occupied. The listener was identified as Node PID 23156, started at 11:39:30 before this session; it was not stopped. Process/compiler output is not evidence of rendered UI. Native UI control is unavailable to the implementation agent, and no authenticated business operation or native diagnostic click was performed.

| Observation                               | Result                                                         |
| ----------------------------------------- | -------------------------------------------------------------- |
| Native main-window UI                     | NOT OBSERVED; launch attempt blocked by existing port listener |
| 1440×900                                  | NOT OBSERVED; owner verification required                      |
| 1366×768                                  | NOT OBSERVED; owner verification required                      |
| 1024×768 degraded                         | NOT OBSERVED; owner verification required                      |
| Notification plugin invocation at runtime | NOT OBSERVED; only mocked invocation tested                    |
| OS toast                                  | NOT OBSERVED                                                   |
| Final installed Windows toast identity    | NOT YET CERTIFIED; installer/release stage required            |

Owner native inspection remains required before acceptance: startup and Login identity/layout, title/taskbar icon where development permits, bell/popover fit, explicit-only permission prompt and diagnostic notification behavior. No owner runtime evidence or native PASS is fabricated.

## Scope, security and data impact

- Service-role/privileged secret exposure: **NONE**; source/native configuration and generated bundle credential-marker scans found no credential/admin client.
- Capability widening outside notifications: **NONE**; no filesystem, shell, process, database, clipboard, shortcut, tray or autostart permissions added.
- CSP/network impact: **NONE**; unchanged Tauri config and exact hosted HTTP scope verified.
- Operational notification infrastructure, polling, Realtime, web push: **NONE ADDED**.
- Business authority/auth services/navigation contracts: **UNCHANGED**.
- Production business mutations: **NO**.
- Hosted source changes: **NONE**.
- Schema/migrations: **NONE**.
- Local DB/cache/offline queue/background sync: **NONE**.
- Installer/release/updater/tray/autostart: **NONE**.

### Exact changed files

```text
docs/30-delivery/STAGE_13_EVIDENCE.md
package.json
pnpm-lock.yaml
src-tauri/Cargo.lock
src-tauri/Cargo.toml
src-tauri/capabilities/desktop-api.json
src-tauri/icons/128x128.png
src-tauri/icons/128x128@2x.png
src-tauri/icons/32x32.png
src-tauri/icons/64x64.png
src-tauri/icons/Square107x107Logo.png
src-tauri/icons/Square142x142Logo.png
src-tauri/icons/Square150x150Logo.png
src-tauri/icons/Square284x284Logo.png
src-tauri/icons/Square30x30Logo.png
src-tauri/icons/Square310x310Logo.png
src-tauri/icons/Square44x44Logo.png
src-tauri/icons/Square71x71Logo.png
src-tauri/icons/Square89x89Logo.png
src-tauri/icons/StoreLogo.png
src-tauri/icons/android/mipmap-anydpi-v26/ic_launcher.xml
src-tauri/icons/android/mipmap-hdpi/ic_launcher.png
src-tauri/icons/android/mipmap-hdpi/ic_launcher_foreground.png
src-tauri/icons/android/mipmap-hdpi/ic_launcher_round.png
src-tauri/icons/android/mipmap-mdpi/ic_launcher.png
src-tauri/icons/android/mipmap-mdpi/ic_launcher_foreground.png
src-tauri/icons/android/mipmap-mdpi/ic_launcher_round.png
src-tauri/icons/android/mipmap-xhdpi/ic_launcher.png
src-tauri/icons/android/mipmap-xhdpi/ic_launcher_foreground.png
src-tauri/icons/android/mipmap-xhdpi/ic_launcher_round.png
src-tauri/icons/android/mipmap-xxhdpi/ic_launcher.png
src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_foreground.png
src-tauri/icons/android/mipmap-xxhdpi/ic_launcher_round.png
src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher.png
src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_foreground.png
src-tauri/icons/android/mipmap-xxxhdpi/ic_launcher_round.png
src-tauri/icons/android/values/ic_launcher_background.xml
src-tauri/icons/app-icon.svg
src-tauri/icons/icon.icns
src-tauri/icons/icon.ico
src-tauri/icons/icon.png
src-tauri/icons/ios/AppIcon-20x20@1x.png
src-tauri/icons/ios/AppIcon-20x20@2x-1.png
src-tauri/icons/ios/AppIcon-20x20@2x.png
src-tauri/icons/ios/AppIcon-20x20@3x.png
src-tauri/icons/ios/AppIcon-29x29@1x.png
src-tauri/icons/ios/AppIcon-29x29@2x-1.png
src-tauri/icons/ios/AppIcon-29x29@2x.png
src-tauri/icons/ios/AppIcon-29x29@3x.png
src-tauri/icons/ios/AppIcon-40x40@1x.png
src-tauri/icons/ios/AppIcon-40x40@2x-1.png
src-tauri/icons/ios/AppIcon-40x40@2x.png
src-tauri/icons/ios/AppIcon-40x40@3x.png
src-tauri/icons/ios/AppIcon-512@2x.png
src-tauri/icons/ios/AppIcon-60x60@2x.png
src-tauri/icons/ios/AppIcon-60x60@3x.png
src-tauri/icons/ios/AppIcon-76x76@1x.png
src-tauri/icons/ios/AppIcon-76x76@2x.png
src-tauri/icons/ios/AppIcon-83.5x83.5@2x.png
src-tauri/src/lib.rs
src/App.tsx
src/assets/brand/cradlehub-icon.png
src/components/CanonicalShell.tsx
src/components/LoginView.tsx
src/components/StartupIdentity.tsx
src/lib/desktop-notifications.ts
src/styles.css
tests/components.test.tsx
tests/desktop-notifications.test.ts
tests/native-identity-components.test.tsx
tests/native-identity.test.ts
```

## Rollback and review boundary

Rollback is a reviewed Git revert of the Stage 13 commit identified by the final HEAD_SHA. It restores previous assets/UI and removes the notification dependency, registration and granular permissions. There is no schema/data rollback. OS notification permission already chosen by an operator is platform state and is not undone by a Git revert.

Push only the authorized stage branch, verify local/remote equality and clean working tree, then stop for independent GitHub review and owner native-runtime confirmation. These results do not authorize merge or another stage.
