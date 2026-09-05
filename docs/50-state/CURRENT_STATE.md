# Current State

Stage 00 is ACCEPTED / MERGED / CLOSED on main at `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Stage 01 — Real Authentication + Authorized Branch Context + Canonical Shell is **ACTIVE / UNACCEPTED** under the owner's explicit Stage 01 authorization.
Branch: `stage/01-auth-branch-shell`. BASE_SHA: `79ef30b9da7267b6f01a6bf9a462712a2b8cfc13`.
Fetched HOSTED_SHA: `feda4600f37e93084fdb672bd0c2612e9872bb43`; hosted tracked source remains read-only and clean.

First independent review returned CHANGES REQUIRED, and the owner authorized visual refinement of the canonical shell on the same `stage/01-auth-branch-shell` branch:

- Authoritative field `staff.system_role` (NOT `role`) used in staff queries, types, and role canonicalization, matching the hosted CradleHub authority contract.
- Focused contract-drift tests verifying that `system_role` is queried and required.
- Sign-out constrained to local desktop scope via `supabase.auth.signOut({ scope: 'local' })` to avoid terminating sessions on other devices.
- Non-swallowed sign-out failure with truthful retryable error presentation and context retention.
- Enabled in-memory token auto-refresh (`autoRefreshToken: true`, `persistSession: false`, `detectSessionInUrl: false`).
- Truthful error taxonomy distinguishing Invalid Credentials (`InvalidCredentialsError`), Network/Auth Service failure (`NetworkOrConfigError`), Context Load / Query failure (`ContextLoadError`), and proven Authorization Denial (`AuthDenialError`).
- Removed unsupported `"RLS Verified"` runtime claim; replaced with neutral, truthful `"In-memory session"`.
- Refined visual shell:
  - Polished dark green sidebar with gold active indicators and refined operator profile card.
  - Top horizontal bar with active branch badge, truthful "Session Active" status chip, notification trigger with truthful empty-state popover ("No Notifications"), and user avatar account dropdown menu with Sign Out action.
  - Refined module unavailable panels with clear Stage 01 scope labeling and responsive spacing across 1440, 1366, and 1024 viewports.
- 46 automated unit, component, and boundary tests passing across 4 test suites.

Status remains **ACTIVE / UNACCEPTED**.
Next action: Independent GitHub re-review, followed by owner native runtime verification if re-review is acceptable.
Product modules, hosted changes, schema/RLS mutations, merge to main, and Stage 02 remain unauthorized.
