# Current Task

Stage 03 — Customers: **ACCEPTED / MERGED / CLOSED**.

**STAGE 03 CUSTOMERS FAST-FORWARD MERGED INTO MAIN — AWAITING STAGE 04 OWNER AUTHORIZATION.**

- **Merged Main HEAD**: `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.
- **Accepted Stage 03 Implementation SHA**: `a17cd03e28d0fdc4b9d7757e502918dbc32af22a`.
- **Canonical Hosted Main SHA**: `653f4d0ba04f1af76a7006209a74e40022d7de84`.

Summary of Merged Scope:

1. **Customers Visual & Functional Vertical Slice**: Real Customers module, header refresh, KPI summary cards, customer list table, waitlist follow-up queue, customer detail & operational booking history inspector.
2. **Canonical Streaming JSON Body Reader**: `src/lib/hosted-json-response.ts` implementing `readResponseBodyText` and `readHostedJsonResponse` with chunk-by-chunk streaming UTF-8 decoding (`TextDecoder({ stream: true })`), 10 MB size limit, empty body detection, content-type inspection, and single-pass `JSON.parse`.
3. **Runtime Contract Validation**: Added type guards `isFetchCustomersSuccess`, `isFetchCustomerDetailSuccess`, and `isApiErrorEnvelope` preventing unvalidated payloads from being cast as valid success.
4. **Customer Boundary Consumers**: Integrated reader and validators in `fetchBranchCustomers`, `fetchCustomerDetail`, and `searchBranchCustomers`, adding `Accept: application/json` headers.
5. **False-Empty UI Prevention**: Hardened `CustomersView.tsx` against false-empty zero KPI states on unexpected/malformed responses.
6. **Next Gate**: Stop and await explicit owner authorization for Stage 04 (Staff). No new stage or branch started.
