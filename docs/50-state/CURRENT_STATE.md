# Current State

Stage 00 is ACCEPTED / MERGED / CLOSED on main at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 — Real Authentication + Authorized Branch Context + Canonical Shell is **ACTIVE / UNACCEPTED** under the owner's explicit Stage 01 authorization.
Branch: `stage/01-auth-branch-shell`. BASE_SHA: `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Fetched HOSTED_SHA: `feda4600f37e93084fdb672bd0c2612e9872bb43`; hosted tracked source remains read-only and clean.

Owner visual feedback on initial visual pass identified shell hierarchy redundancy and leaking engineering terminology. Applied **OWNER-REQUESTED VISUAL CORRECTION — canonical shell hierarchy/density** on the same `stage/01-auth-branch-shell` branch:

- **Correct Shell Hierarchy**:
  - **Sidebar**: Product navigation only (~224px width). Contains CradleHub brand and exactly 8 authorized nav destinations (`Today`, `Bookings`, `Attendance`, `Customers`, `Schedule`, `Home Service`, `Staff`, `Settings`). Removed redundant Active Branch card, Read-only Scope tag, and bottom operator profile card.
  - **Global Top App Bar**: Slim (~50px height) horizontal bar for global app controls only (`[ Branch Context ] [ ● Session Active ] [ Bell ] [ Avatar ]`). Compact ghost/text styling without individual large bordered card boxes. Module title and direct Sign Out removed from top bar.
  - **User Menu**: Avatar trigger (circular initials + small chevron) opens account dropdown containing user name, email, canonical role label, assigned branch, and exclusive Sign Out action.
  - **Module Workspace Canvas**: Owns module page title and clean, elegant empty-state placeholder (`This module is not yet available in the desktop client.`). Leaked developer phrases (`Stage 01 Scope`, `Canonical Shell`, `Session Authority`, `Active Operator`, `In-Memory Active summary cards`) eliminated from normal user runtime.
- **Contracts Preserved**: Authoritative field `staff.system_role`, local-scoped sign out via `supabase.auth.signOut({ scope: 'local' })`, in-memory token refresh, 4-category error taxonomy, fail-closed access control.
- **Verification**: 45 automated unit, component, and boundary tests passing across 4 test suites. All web and Rust checks pass.

Status remains **ACTIVE / UNACCEPTED**.
Next action: Owner native runtime verification and visual review.
Product modules, hosted changes, schema/RLS mutations, merge to main, and Stage 02 remain unauthorized.
