# Current Task

Stage 03 — Customers: Native Body-Read & Contract Validation Correction.

**STAGE 03 NATIVE CUSTOMER RESPONSE CORRECTION PUSHED — STOPPED FOR INDEPENDENT REVIEW AND OWNER NATIVE RE-TEST — NO MERGE — STAGE 04 NOT STARTED.**

- **Branch**: `stage/03-customers`.
- **BASE_SHA**: `59f69fc7e321c32f040f6f9a79aca47e77547675`.
- **Preflight START_SHA**: `3c158fc7c3db5047cfc7447ce7eab255492999a1`.
- **Canonical Hosted Main SHA**: `653f4d0ba04f1af76a7006209a74e40022d7de84`.
- **Desktop Main**: `59f69fc7e321c32f040f6f9a79aca47e77547675`.

Correction Summary:

1. **Canonical Streaming JSON Body Reader**: Created `src/lib/hosted-json-response.ts` implementing `readResponseBodyText` and `readHostedJsonResponse` with chunk-by-chunk streaming UTF-8 decoding (`TextDecoder({ stream: true })`), 10 MB size limit, empty body detection, content-type inspection, and single-pass `JSON.parse`.
2. **Runtime Contract Validation**: Added type guards `isFetchCustomersSuccess`, `isFetchCustomerDetailSuccess`, and `isApiErrorEnvelope` to prevent unvalidated payloads from being cast as valid success.
3. **Customer Consumers Updated**: Applied the reader and validators to `fetchBranchCustomers`, `fetchCustomerDetail`, and `searchBranchCustomers`, adding `Accept: application/json` headers.
4. **False-Empty UI Prevention**: Hardened `CustomersView.tsx` so any non-ok, malformed, or missing message strictly renders `Customer Service Unavailable` and suppresses 0 KPIs or fake empty state.
5. **Verification**: 192/192 vitest tests passing across 11 test files, ESLint clean, TypeScript clean, Vite production build clean, Cargo clean.
6. **Next Gate**: Push `stage/03-customers` and stop for independent review and owner native Windows Desktop re-test. Stage 04 (Staff) remains unauthorized.
