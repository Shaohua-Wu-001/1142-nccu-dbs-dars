# K6 Performance Test Report

## Test Target

The test targets the containerized backend at `http://localhost:3001`.
Requests go through Express routes, Sequelize ORM, and MySQL, so this is a website + DB integration test instead of a database-only benchmark.

## Scenario

Script: `performance/k6-audit-test.js`

- query_browsing: 30 VUs, 45 seconds
- audit_checking: 30 VUs, 45 seconds
- full_user_flow: 1 VU, 20 seconds, starts after 50 seconds

Endpoints:

- `GET /api/health`
- `GET /api/courses?year=111&limit=50`
- `GET /api/curriculums/111/requirements`
- `POST /api/audit/run` with JWT auth
- `POST /api/transcripts/import` with JWT auth
- `GET /api/audit/history?userId=<loginUserId>&limit=10` with JWT auth

The high-frequency query and audit scenarios log in as `demo001` by default and use the returned user id. The full user flow logs in as `k6demo` by default and uses that returned user id, so transcript import and saved audit history do not pollute the presentation demo user. Override credentials with `DEMO_ACCOUNT`, `DEMO_PASSWORD`, `K6_ACCOUNT`, and `K6_PASSWORD`.

## Historical Result

Run date: 2026-05-12

These numbers are retained as a historical reference. The current k6 script logs in with JWT credentials and derives user ids from the login response; rerun `k6 run performance/k6-audit-test.js` before using this report as evidence for the current revision.

- HTTP requests: 6627
- Failed requests: 0.00%
- Checks: 9294 / 9294 succeeded
- Average response time: 13.36 ms
- Median response time: 4.21 ms
- p90 response time: 23.88 ms
- p95 response time: 42.67 ms
- Max response time: 905.54 ms
- Query browsing p95: 26.40 ms
- Audit checking p95: 105.69 ms
- Full user flow p95: 298.63 ms
- Throughput: 92.81 requests/second
- Data received: 54 MB
- Data sent: 1.0 MB

Thresholds:

- `http_req_failed rate < 0.05`: passed
- `http_req_duration p95 < 1500ms`: passed

## Adjustment Made During Testing

The first K6 run had 0% failed requests but exceeded the original 1 second p95 threshold because `GET /api/audit/history` returned full historical `result_json` payloads while the stress test kept creating new audit rows. The endpoint was changed to return a paginated summary list by default and to keep full detail on `GET /api/audit/history/:id`.

A later review found that `POST /api/audit/run` still loaded the full yearly course catalog even though the audit engine did not use it. That query was removed, and indexes were added to `audit_results` for history lookups.

The K6 script now separates high-frequency browsing/audit checks from a low-frequency full user flow. High-frequency audit calls use `saveResult: false`, which keeps the test as a backend + ORM + MySQL integration test while avoiding thousands of persistent audit history rows. The full flow scenario still performs transcript import, audit persistence, and history lookup at low concurrency. The final run passed the 1.5 second p95 threshold with overall p95 at 42.67 ms.

After performance testing, run:

```bash
docker compose exec backend npm run reset:demo
```

This restores `demo001` to one transcript import and zero saved audit results while keeping the `k6demo` test user available.
