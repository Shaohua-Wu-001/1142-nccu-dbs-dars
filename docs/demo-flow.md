# Demo Flow

This document describes how to run the backend demo from a clean terminal.

Run commands from the project root.

## 1. Start Docker Services

Start MySQL and backend:

```bash
docker compose up -d --build
```

If Docker CLI is not on the shell path:

```bash
export PATH="$HOME/.local/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"
docker compose up -d --build
```

Expected services:

```text
nccu-ams-mysql     MySQL 8 database
nccu-ams-backend   Express backend on port 3001
```

Check status:

```bash
docker compose ps
```

Health check:

```bash
curl http://localhost:3001/api/health
```

Expected:

```json
{
  "status": "ok"
}
```

## 2. Seed Excel Data

Import `backend/data/courses.xlsx`:

```bash
docker compose exec backend npm run seed
```

This imports:

```text
courses sheet           course catalog
required_courses sheet  Applied Mathematics required rules
general_courses sheet   general education course labels
```

The current workbook has 517 general-education definitions. The backend stores one copy per academic year, so the clean seeded database has 2,068 `general_courses` rows for 111-114. This is intentional: the schema can represent year-specific category changes even though the current source workbook uses the same definitions for each year.

It also creates the demo user:

```text
student_number: DEMO001
username: demo001
password: demo1234
name: 示範使用者
admission_year: 111
```

Create the K6 test user:

```bash
docker compose exec backend npm run seed:k6-user
```

K6 full-flow writes to this separate user instead of polluting the presentation demo user.
Default credentials are `k6demo` / `k6demo1234`.

Create local tokens for protected API examples:

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"account":"demo001","password":"demo1234"}' \
  | node -e 'let data="";process.stdin.on("data",c=>data+=c);process.stdin.on("end",()=>console.log(JSON.parse(data).token));')

DEMO_USER_ID=$(curl -s http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  | node -e 'let data="";process.stdin.on("data",c=>data+=c);process.stdin.on("end",()=>console.log(JSON.parse(data).user.id));')

ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"account":"admin","password":"admin1234"}' \
  | node -e 'let data="";process.stdin.on("data",c=>data+=c);process.stdin.on("end",()=>console.log(JSON.parse(data).token));')
```

## 3. Import Demo Transcript

Import `backend/data/transcript.json`:

```bash
docker compose exec backend npm run seed:transcript
```

Expected summary:

```text
importedCourses: 71
passedCourses: 59
inProgressCourses: 9
withdrawnCourses: 3
unresolvedCourseCount: 5
```

Review unresolved transcript rows:

```bash
curl "http://localhost:3001/api/student-courses/unresolved?userId=${DEMO_USER_ID}" \
  -H "Authorization: Bearer $TOKEN"
```

These are transcript rows that could not be matched to `backend/data/courses.xlsx` and may need staff review.

## 4. Inspect Curriculum Requirements

Check 111 academic year requirements:

```bash
curl 'http://localhost:3001/api/curriculums/111/requirements'
```

Expected groups:

```text
TOTAL       128
REQUIRED    51
PE           4
GENERAL     28
ELECTIVE    45
```

## 5. Run Official Audit

Run official audit and store the saved audit id for later detail lookup:

```bash
AUDIT_ID=$(curl -s -X POST http://localhost:3001/api/audit/run \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"userId\":${DEMO_USER_ID},\"academicYear\":\"111\",\"includeInProgress\":false,\"saveResult\":true}" \
  | node -e 'let data="";process.stdin.on("data",c=>data+=c);process.stdin.on("end",()=>console.log(JSON.parse(data).auditId));')
```

Expected demo result:

```text
graduationEligible: false
total earned: 77 / 128
required: 9 / 51
PE: 4 / 4
general: 19 / 28
elective: 45 / 45
```

The demo student is not eligible because:

```text
Required Applied Mathematics credits are incomplete.
General education is missing foreign-language and natural-science credits.
```

## 6. Run Projected Audit

Run audit with in-progress courses included as a projection:

```bash
curl -X POST http://localhost:3001/api/audit/run \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"userId\":${DEMO_USER_ID},\"academicYear\":\"111\",\"includeInProgress\":true,\"saveResult\":false}"
```

Important distinction:

```text
mode = OFFICIAL
isProjected = false
graduationEligible uses PASSED courses only

projectedResult.mode = PROJECTED
projectedResult includes IN_PROGRESS courses for planning
```

## 7. Add A Manual Staff Adjustment

Example: add a manually recognized foreign-language credit.

```bash
curl -X POST http://localhost:3001/api/admin/manual-courses \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"userId\":${DEMO_USER_ID},\"courseCode\":\"MANUAL-FOREIGN-001\",\"courseName\":\"外文抵免\",\"credits\":3,\"department\":\"應用數學系\",\"courseCategory\":\"選修\",\"academicYear\":111,\"semester\":\"1\",\"academicYearSemester\":\"1111\",\"score\":\"MANUAL\",\"remark\":\"外文通\",\"recognitionType\":\"MANUAL_CREDIT\",\"approvalStatus\":\"APPROVED\",\"approvalSource\":\"系辦人工調整\",\"approvalNote\":\"外文通識抵免\"}"
```

Manual rows use:

```text
source = MANUAL
score = MANUAL
recognition_type = MANUAL_CREDIT or APPROVED_SUBSTITUTION
approval_status = APPROVED
```

Transcript rows use:

```text
source = TRANSCRIPT_JSON
```

Manual rows are preserved when transcript JSON is re-imported.

## 8. View Audit History

List recent audit summaries:

```bash
curl "http://localhost:3001/api/audit/history?userId=${DEMO_USER_ID}&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

Fetch one full audit result:

```bash
curl "http://localhost:3001/api/audit/history/${AUDIT_ID}" \
  -H "Authorization: Bearer $TOKEN"
```

## 9. Run Tests

Run backend tests locally:

```bash
cd backend
npm test
```

Expected:

```text
All backend tests pass.
```

## 10. Run K6 Performance Test

Run:

```bash
k6 run performance/k6-audit-test.js
```

The k6 script logs in before calling protected APIs and derives user ids from the login response. By default, `query_browsing` and `audit_checking` use `demo001` / `demo1234`, while `full_user_flow` uses `k6demo` / `k6demo1234`. Override with:

```bash
DEMO_ACCOUNT=demo001 DEMO_PASSWORD=demo1234 K6_ACCOUNT=k6demo K6_PASSWORD=k6demo1234 k6 run performance/k6-audit-test.js
```

The K6 test contains three scenarios:

```text
query_browsing
  30 VUs, 45s
  GET health, courses, requirements, history

audit_checking
  30 VUs, 45s
  POST audit/run with saveResult=false

full_user_flow
  1 VU, 20s, starts after 50s
  POST transcripts/import
  POST audit/run with saveResult=true
  GET audit/history
```

Why full flow is low-volume:

```text
Transcript import rewrites student transcript rows.
It is a heavier administrative workflow, not a high-frequency browsing action.
High concurrency is reserved for query and audit endpoints.
```

After K6, reset the demo state:

```bash
docker compose exec backend npm run reset:demo
```

Expected reset state:

```text
demo001: transcript_imports = 1, audit_results = 0
k6demo: available for future performance tests
```

## 11. Stop Services

```bash
docker compose down
```

To also remove database volume:

```bash
docker compose down -v
```

Only use `-v` when you intentionally want to remove MySQL data.
