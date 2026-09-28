# Local persistence foundation — Stage 15

**REPOSITORY-RECORDED PRODUCTION EVIDENCE.** Desktop baseline `5efd22c049d3c93307b3f852d81450dec91ae90a`; hosted authority reference `03242a0bfbcfe6c4b1b03ba624510004cae7cc6a`. This describes a Rust-only storage foundation, not an active CRM cache. The [accepted Stage 14 cache contract](LOCAL_DATA_CACHE_CONTRACT.md) still governs any future module integration. Hosted CradleHub remains the sole business authority.

The implementation pins `rusqlite = 0.40.2` with `default-features = false` and `bundled`, so SQLite is compiled into the native application rather than loaded from an arbitrary Windows DLL. `serde_json = 1.0.151` is a direct Rust dependency for syntactic JSON validation; it was already present transitively. No frontend SQL package, Tauri SQL plugin, renderer SQL handle, custom cache IPC command or webview capability was added.

At Tauri startup, the single builder calls `app.path().app_data_dir()` for bundle identifier `com.techwithmpg.cradlehub.desktop`, creates the directory if needed, and opens `cradlehub-cache.sqlite3` beneath it. The path is never sent to the renderer. The Rust-only `LocalCacheState` is managed as `Available(LocalCacheStore)` or `Unavailable(LocalCacheError)`; a recoverable path/open/configuration/migration failure logs only a safe error category and does **not** abort the CRM. Existing hosted online reads remain the application path. A `Mutex<rusqlite::Connection>` serializes store access; no connection is created by a React component.

## Physical v1 contract

`PRAGMA user_version` is the database schema version (`LOCAL_DB_SCHEMA_VERSION = 1`). Version 0 creates `cache_snapshots` and sets version 1 in one transaction. Version 1 validates that the expected table/columns remain accessible. A newer version fails closed, preserves the file and leaves the cache unavailable to this binary. Corruption or migration failure is not silently reset or deleted.

```sql
CREATE TABLE cache_snapshots (
    user_scope TEXT NOT NULL CHECK (length(user_scope) > 0),
    branch_scope TEXT NOT NULL CHECK (length(branch_scope) > 0),
    dataset TEXT NOT NULL CHECK (length(dataset) > 0),
    parameters_hash TEXT NOT NULL CHECK (length(parameters_hash) = 64),
    model_version INTEGER NOT NULL CHECK (model_version > 0),
    payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
    stored_at_ms INTEGER NOT NULL CHECK (stored_at_ms >= 0),
    validated_at_ms INTEGER NOT NULL CHECK (validated_at_ms >= stored_at_ms),
    PRIMARY KEY (user_scope, branch_scope, dataset, parameters_hash, model_version)
) WITHOUT ROWID;
```

The composite primary key supplies exact lookups and prefix scans for user and user+branch purges; no additional index is needed in v1. There are no credential columns or persisted freshness/authority booleans. A restored snapshot is **cached/stale**, never freshly server-verified just because `validated_at_ms` is recent.

Connection configuration: `foreign_keys = ON` prepares for referential checks if a later schema needs them (v1 has no foreign keys); a 5-second `busy_timeout` avoids immediate failure during a transient lock; `journal_mode = WAL` supports recoverable file-backed updates; `synchronous = NORMAL` is appropriate for regenerable cache snapshots and does not grant business authority. WAL mode is checked; initialization degrades safely if it is unavailable. Correct business behavior cannot depend on these PRAGMAs alone.

The Rust API has typed `put_snapshot`, `get_snapshot`, `delete_snapshot`, `purge_user_scope`, `purge_user_branch_scope` and row-count diagnostics. Upsert replaces only the exact composite key in one SQLite statement. Get requires user, branch, dataset, opaque parameter hash and model version; there is no cross-user or cross-branch fallback. An opaque parameter hash must be exactly 64 lowercase hexadecimal characters; Stage 15 intentionally does not implement query canonicalization or hashing, so raw customer searches, names, phone numbers and addresses cannot become physical keys. `SnapshotPayload` parses JSON before write; this is **syntax validation only**, not hosted response or branch-authority validation.

The dataset enum admits Today, Bookings list/options, Customers list/detail, Attendance workspace/history, Schedule daily/availability/staff-full, Home Service queue/drivers/detail/recommendations, and Staff roster/assignable services/onboarding requests. It intentionally has **no Staff schedule-week or Settings variant**. Staff schedule-week remains **CACHE BLOCKED — BRANCH ISOLATION REQUIRES RECONCILIATION** under Stage 14. SQLite never authorizes booking lifecycle actions, attendance corrections, staff capabilities/roles, onboarding approval, dispatch assignment, schedule mutation, authentication or branch permission.

## Stage boundary and limitations

No module service or React view reads or writes this store in Stage 15. Ordinary startup therefore creates **zero real business snapshot rows**; synthetic Rust tests use temporary directories and remove their files. No offline writes, background sync, polling, Realtime, mutation queue or performance improvement is claimed. Stage 14 authenticated pre-cache timing remains **NOT OBSERVED**.

Plain bundled SQLite is **not encrypted at rest**. **BUSINESS-DATA RETENTION / AT-REST POLICY: REQUIRED BEFORE FIRST MODULE CACHE INTEGRATION.** No real customer, booking, staff, applicant, attendance, schedule, address or location payload may be persisted until a later authorized stage defines privacy protection, retention, authenticated scope validation, payload validation, reconciliation and logout behavior. Stage 16 or later must establish those contracts before calling this Rust store from a module; Stage 15 does not choose them.

The project still declares `rust-version = 1.77.2`. The observed build toolchain is Rust 1.98.0; Rust 1.77.2 is not installed locally. `rusqlite` 0.40.2 and its bundled `libsqlite3-sys` dependency publish no `rust-version` metadata, so this stage does not assert a successful 1.77.2 compatibility build. No minimum version was silently changed; compatibility remains a documented verification limit.
