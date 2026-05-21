# Backend API Spec

Base URL:

```text
http://localhost:3001
```

This backend is scoped to NCCU Applied Mathematics major graduation audit for academic years 111-114.

## Authentication

Public endpoints:

```text
GET  /api/health
GET  /api/courses
GET  /api/courses/:id
GET  /api/curriculums
GET  /api/curriculums/:year
GET  /api/curriculums/:year/requirements
POST /api/auth/register
POST /api/auth/register-admin
POST /api/auth/login
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

All transcript, student-course, audit, admin, profile, and password endpoints require:

```http
Authorization: Bearer <JWT>
```

Login example:

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"account":"demo001","password":"demo1234"}' \
  | node -e 'let data="";process.stdin.on("data",c=>data+=c);process.stdin.on("end",()=>console.log(JSON.parse(data).token));')

DEMO_USER_ID=$(curl -s http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  | node -e 'let data="";process.stdin.on("data",c=>data+=c);process.stdin.on("end",()=>console.log(JSON.parse(data).user.id));')
```

Admin login example:

```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"account":"admin","password":"admin1234"}' \
  | node -e 'let data="";process.stdin.on("data",c=>data+=c);process.stdin.on("end",()=>console.log(JSON.parse(data).token));')
```

## Auth

### GET `/api/auth/me`

Returns the authenticated user's profile. Requires a Bearer token.

### PATCH `/api/auth/profile`

Updates the authenticated user's `name` and `email`. Requires a Bearer token.

Request:

```json
{
  "name": "示範使用者",
  "email": "demo@nccu.edu.tw"
}
```

### PATCH `/api/auth/password`

Changes the authenticated user's password. Requires a Bearer token.

Request:

```json
{
  "currentPassword": "demo1234",
  "newPassword": "new-demo-password"
}
```

## Health

### GET `/api/health`

Checks whether the backend server is running.

Response:

```json
{
  "status": "ok"
}
```

## Courses

### GET `/api/courses`

Lists imported course catalog rows from `data/courses.xlsx`.

Query parameters:

```text
year        optional, example: 111
semester    optional
department  optional, partial match
category    optional
keyword     optional, searches course code and course name
limit       optional, default 50, max 200
offset      optional, default 0
```

Example:

```bash
curl 'http://localhost:3001/api/courses?year=111&keyword=線性代數&limit=10'
```

Response shape:

```json
{
  "count": 2,
  "rows": [
    {
      "id": 1,
      "academic_year": 111,
      "semester": "111-1",
      "course_code": "701002001",
      "course_name": "線性代數",
      "credits": "4.0",
      "department": "應用數學系",
      "level": "...",
      "category": "..."
    }
  ]
}
```

### GET `/api/courses/:id`

Fetches one course row by database id.

## Curriculums And Requirements

### GET `/api/curriculums`

Lists seeded Applied Mathematics curriculums.

### GET `/api/curriculums/:year`

Fetches the Applied Mathematics curriculum for one academic year.

Example:

```bash
curl 'http://localhost:3001/api/curriculums/111'
```

### GET `/api/curriculums/:year/requirements`

Fetches curriculum groups and requirement rules.

Example:

```bash
curl 'http://localhost:3001/api/curriculums/113/requirements'
```

Important groups:

```text
TOTAL       128 total graduation credits
REQUIRED    51 Applied Mathematics required credits
PE           4 required PE credits
GENERAL     28 general education credits
ELECTIVE    45 other elective credits
```

## Transcript Import

### POST `/api/transcripts/import`

Imports NCCU transcript JSON into `student_courses`.

Requires a student owner token or an admin token. For student tokens, the backend uses the authenticated user id even if a different `userId` is sent.

Request:

```json
{
  "userId": 3,
  "sourceFilename": "transcript.json",
  "transcript": {}
}
```

Behavior:

```text
1. Reads 課業學習.aboutMe.
2. Reads 課業學習.coursePlan.
3. Reads gradeRecordList.
4. Creates one transcript_imports row.
5. Replaces previous TRANSCRIPT_JSON student_courses for the user.
6. Preserves MANUAL student_courses.
```

Score status mapping:

```text
score >= 60              PASSED
score < 60               FAILED
MANUAL                   PASSED
停修                     WITHDRAWN
成績未到或無成績 / empty  IN_PROGRESS
```

Response:

```json
{
  "importId": 1,
  "userId": 3,
  "studentNumber": "DEMO001",
  "studentName": "示範使用者",
  "coursePlanYear": "111",
  "importedCourses": 71,
  "passedCourses": 59,
  "failedCourses": 0,
  "inProgressCourses": 9,
  "withdrawnCourses": 3,
  "unresolvedCourseCount": 5,
  "unresolvedCourses": []
}
```

## Student Courses

### GET `/api/student-courses?userId=<studentUserId>`

Lists a user's imported and manual student-course rows.

Requires the owner token or an admin token.

### GET `/api/student-courses/unresolved?userId=<studentUserId>`

Lists imported courses that could not be matched back to `data/courses.xlsx` by academic year, semester, and course code.

These rows have missing `department` or `course_category` and should be reviewed before official use.

Example:

```bash
curl "http://localhost:3001/api/student-courses/unresolved?userId=${DEMO_USER_ID}" \
  -H "Authorization: Bearer $TOKEN"
```

Response shape:

```json
{
  "count": 5,
  "rows": [
    {
      "course_code": "997093001",
      "course_name": "體育[男女合班]－綜合體適能",
      "department": null,
      "course_category": null
    }
  ],
  "note": "These transcript rows could not be matched to data/courses.xlsx by academic year, semester, and course code. Staff should review them before official use."
}
```

### POST `/api/student-courses`

Creates a manual student-course row. This endpoint requires an admin token. Staff-approved adjustments should normally use `/api/admin/manual-courses`.

Request:

```json
{
  "userId": 3,
  "courseCode": "MANUAL-FOREIGN-001",
  "courseName": "外文抵免",
  "credits": 3,
  "department": "應用數學系",
  "courseCategory": "選修",
  "academicYear": 111,
  "semester": "1",
  "academicYearSemester": "1111",
  "score": "MANUAL",
  "remark": "外文通",
  "recognitionType": "MANUAL_CREDIT",
  "approvalStatus": "APPROVED",
  "approvalSource": "系辦人工調整",
  "approvalNote": "外文通識抵免"
}
```

### DELETE `/api/student-courses/:id`

Deletes one student-course row by id. This endpoint requires an admin token.

## Admin Students

### GET `/api/admin/students`

Lists student accounts for the admin student-management page, including latest transcript upload status and unresolved-course counts. Requires an admin token.

Example:

```bash
curl http://localhost:3001/api/admin/students \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Response shape:

```json
{
  "rows": [
    {
      "userId": 3,
      "studentNumber": "DEMO001",
      "studentName": "示範使用者",
      "email": "demo@nccu.edu.tw",
      "admissionYear": 111,
      "latestUploadAt": "2026-05-20T00:00:00.000Z",
      "hasTranscript": true,
      "unresolvedCount": 5
    }
  ]
}
```

## Admin Manual Adjustments

Manual adjustment rows use `source = MANUAL` and are preserved across transcript re-imports.
`score = MANUAL` is treated as `PASSED`, meaning the row represents a staff-approved adjustment that should be counted by the official audit.
For required-course substitutions, set `recognitionType = APPROVED_SUBSTITUTION`, `approvalStatus = APPROVED`, and `substitutionForCourseCode` to the required Applied Mathematics course code being replaced.

Use cases:

```text
foreign-language exemption
ETP substitution
staff-recognized general education credits
special corrections approved by staff
```

### POST `/api/admin/manual-courses`

Creates or updates a manual row for the same user, course code, semester, and source.

Requires an admin token.

Example:

```bash
curl -X POST http://localhost:3001/api/admin/manual-courses \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "userId": 3,
    "courseCode": "MANUAL-FOREIGN-001",
    "courseName": "外文抵免",
    "credits": 3,
    "department": "應用數學系",
    "courseCategory": "選修",
    "academicYear": 111,
    "semester": "1",
    "academicYearSemester": "1111",
    "score": "MANUAL",
    "remark": "外文通",
    "recognitionType": "MANUAL_CREDIT",
    "approvalStatus": "APPROVED",
    "approvalSource": "系辦人工調整",
    "approvalNote": "外文通識抵免"
  }'
```

### PATCH `/api/admin/manual-courses/:id`

Updates a manual row. Transcript rows cannot be updated through this endpoint.

Request can include any of:

```json
{
  "courseName": "外文抵免：大學英文（一）",
  "credits": 3,
  "remark": "外文通"
}
```

### DELETE `/api/admin/manual-courses/:id`

Deletes a manual row. Transcript rows cannot be deleted through this endpoint.

## Audit

### POST `/api/audit/run`

Runs the graduation audit.

Requires the owner token or an admin token. Saved results are marked as `STUDENT` or `ADMIN` based on the authenticated user's current database role.

Request:

```json
{
  "userId": 3,
  "academicYear": "111",
  "includeInProgress": false,
  "saveResult": true
}
```

Fields:

```text
userId             required
academicYear       required, 111-114
includeInProgress  optional, default false
saveResult         optional, default true
```

Official behavior:

```text
Only PASSED courses count toward official graduation eligibility.
WITHDRAWN, FAILED, and IN_PROGRESS do not count.
```

Projected behavior:

```text
If includeInProgress is true, the response includes projectedResult.
projectedResult may count IN_PROGRESS courses for planning.
The official graduationEligible field still uses only PASSED courses.
```

Persistence behavior:

```text
saveResult=true   saves one audit_results row and returns 201
saveResult=false  does not save history and returns 200
```

Example:

```bash
curl -X POST http://localhost:3001/api/audit/run \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"userId\":${DEMO_USER_ID},\"academicYear\":\"111\",\"includeInProgress\":false,\"saveResult\":true}"
```

Response excerpt:

```json
{
  "auditId": 1,
  "saved": true,
  "academicYear": "111",
  "programType": "MAJOR",
  "department": "應用數學系",
  "mode": "OFFICIAL",
  "isProjected": false,
  "progressPercentage": 60.16,
  "graduationEligible": false,
  "totalCredits": {
    "earned": 77,
    "required": 128,
    "missing": 51,
    "source": "CATEGORY_SUM_51_4_28_45",
    "structure": {
      "required": 51,
      "physicalEducation": 4,
      "generalEducation": 28,
      "elective": 45
    }
  },
  "groups": []
}
```

## Audit History

### GET `/api/audit/history?userId=<studentUserId>&limit=20&offset=0`

Returns paginated audit history summaries. It excludes full `result_json` for performance.

Student users only receive `STUDENT` audit history rows. Admin users receive all rows unless `visibleToStudent=true` or `auditSource=STUDENT` is supplied.

### GET `/api/audit/latest?userId=<studentUserId>`

Returns the latest saved audit result for the user, including admin-saved results. The frontend result page uses this endpoint so students can see the latest approved/admin-adjusted result without exposing admin history rows in their history list.

### GET `/api/audit/history/:id`

Returns one full audit result, including `result_json`.

### PATCH `/api/audit/history/:id`

Renames an audit history row with `{ "auditName": "..." }`. Student users can only rename their own `STUDENT` audit rows; admins can rename accessible rows.

### DELETE `/api/audit/history/:id`

Deletes an audit history row. Student users can only delete their own `STUDENT` audit rows; admins can delete accessible rows.

## Graduation Rule Summary

The audit engine evaluates:

```text
128 total
= 51 required credits
+ 4 required PE credits
+ 28 general education credits
+ 45 other elective credits
```

The result is for project demonstration and planning. It does not replace official NCCU graduation review.
