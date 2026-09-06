# Current Task

Stage 03 — Customers: Owner-Runtime Correction.

**STAGE 03 CUSTOMERS RUNTIME CORRECTION PUSHED — STOPPED FOR INDEPENDENT REVIEW AND OWNER VISUAL RE-TEST — NO MERGE — STAGE 04 NOT STARTED.**

- **Branch**: `stage/03-customers`.
- **BASE_SHA**: `59f69fc7e321c32f040f6f9a79aca47e77547675`.
- **Pre-implementation Audit HEAD**: `ec87769bba591d87f98a04640004f35c71086d80`.
- **Original Implementation HEAD**: `be90ae22fba092b602a0af9db5daa6f96a1e4f13`.
- **Original Evidence HEAD**: `a29bbe1021e369314611195696bdaa1f7d034e36`.
- **Correction Implementation HEAD**: `91697fdf6c533c3c3833e8bf3e271a90079b336f`.
- **Canonical Hosted Main SHA**: `653f4d0ba04f1af76a7006209a74e40022d7de84`.
- **Desktop Main**: `59f69fc7e321c32f040f6f9a79aca47e77547675`.

Correction Execution Summary:

1. **Two-Column Layout**: Switched root workspace grid to `bookings-main-grid` with `bookings-list-column` and `bookings-inspector-column` (`minmax(0, 1fr) 360px`).
2. **5-Column KPI Strip**: Scoped modifier `bookings-kpi-grid customers-kpi-grid` (`repeat(5, minmax(0, 1fr))`) preventing empty 6th slot.
3. **DataGrid & Pagination**: Replaced non-canonical classes with `bookings-datagrid-wrapper`, canonical empty state family, customer avatar cell hierarchy, and Bookings table footer/pagination classes.
4. **API Base URL Fallback**: `getHostedApiBaseUrl()` defaults to `EXPECTED_HOSTED_API_ORIGIN` (`https://www.cradlewellnessliving.com`) when `VITE_CRADLEHUB_API_URL` is missing/blank, fixing native runtime config error without secret exposure or broadening permissions.
5. **Authoritative Error Handling**: `listError` suppresses normal KPI/list surfaces and displays truthful error state with retry. Clears stale customer and detail data on failure.
6. **Contract & Search Copy**: Fixed `searchBranchCustomers` to parse top-level `body.data` array. Updated search placeholders to accurately state name/phone search (no email/service search claims). Truthful KPI subtext. Cleaned up DTO fields.
7. **Quality & Validation**: 166 vitest tests passing (10 test files), ESLint 0 warnings, TypeScript clean, Vite production build clean, Prettier clean.
8. **Next Gate**: Push `stage/03-customers` and stop for independent review and owner visual re-test on live Windows Desktop. Stage 04 (Staff) remains unauthorized.
