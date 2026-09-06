# Current Task

Stage 03 — Customers: Response Diagnosis & Error Presentation Correction.

**STAGE 03 CUSTOMER RESPONSE CORRECTION PUSHED — STOPPED FOR INDEPENDENT REVIEW AND OWNER VISUAL RE-TEST — NO MERGE — STAGE 04 NOT STARTED.**

- **Branch**: `stage/03-customers`.
- **BASE_SHA**: `59f69fc7e321c32f040f6f9a79aca47e77547675`.
- **Pre-implementation Audit HEAD**: `ec87769bba591d87f98a04640004f35c71086d80`.
- **Original Implementation HEAD**: `be90ae22fba092b602a0af9db5daa6f96a1e4f13`.
- **Original Evidence HEAD**: `a29bbe1021e369314611195696bdaa1f7d034e36`.
- **First Runtime Correction HEAD**: `91697fdf6c533c3c3833e8bf3e271a90079b336f`.
- **First Correction Evidence HEAD**: `bf9535961c47ea88e5e66d2f8b6347d00c412c3e`.
- **Diagnostic Implementation HEAD**: `3930100aa0515b2547052cc026dcc27bcd37efa3`.
- **Canonical Hosted Main SHA**: `653f4d0ba04f1af76a7006209a74e40022d7de84`.
- **Desktop Main**: `59f69fc7e321c32f040f6f9a79aca47e77547675`.

Diagnostic & Correction Summary:

1. **Production Endpoint Probing**: Verified unauthenticated production endpoints returning structured JSON 401 on `https://www.cradlewellnessliving.com/api/desktop/v1/customers` and `bookings` control.
2. **Safe Response Handling**: Added status and Content-Type inspection in `src/lib/customers-service.ts` (`fetchBranchCustomers`, `fetchCustomerDetail`) and `src/lib/bookings-service.ts` (`searchBranchCustomers`) to report specific, truthful error messages instead of generic parse failures.
3. **Single Unavailable Presentation**: Cleaned up `CustomersView.tsx` to display exactly one canonical `workspace-placeholder` card upon authoritative error (no duplicate top red banner).
4. **Hosted Source**: Zero modifications to `E:\cradlehub`.
5. **Quality & Validation**: 171 vitest tests passing (10 test files), ESLint 0 warnings, TypeScript clean, Vite production build clean, Prettier clean.
6. **Next Gate**: Push `stage/03-customers` and stop for independent review and owner visual re-test on live Windows Desktop. Stage 04 (Staff) remains unauthorized.
