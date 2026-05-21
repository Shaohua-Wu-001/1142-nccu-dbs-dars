# Backend Design

## Borrowed Ideas

From the earlier DBS prototype, this backend borrows the simple course/student/audit API flow and Excel-based data import idea.

From the earlier graduation-audit prototype, this backend borrows the degree-audit concept: requirements are modeled as reusable rules, and the audit engine evaluates student courses against those rules.

## Architecture

```text
Express routes
  -> controllers
  -> importers / seeders / services
  -> Sequelize models
  -> MySQL
```

Backend source folders:

```text
src/controllers/        HTTP request/response handling
src/routes/             Express route definitions
src/models/             Sequelize models and associations
src/importers/          Excel and transcript import workflows
src/seeders/            Curriculum/rule construction helpers
src/services/audit/     Graduation audit engine
src/scripts/            CLI entrypoints for migrate/seed/import
src/utils/              Shared normalization and parsing helpers
```

## Core Flow

1. `seedFromExcel.js` imports `courses.xlsx`.
2. `seedDemoUser.js` creates a demo Applied Mathematics student.
3. `importDemoTranscript.js` imports NCCU transcript JSON into `student_courses`.
4. `POST /api/audit/run` loads the curriculum, requirement rules, and student courses.
5. `services/audit/auditEngine.service.js` evaluates total credits as the confirmed category sum: 51 required + 4 PE + 28 general education + 45 other electives.
6. The result is saved to `audit_results`.

Excel seeding and transcript import run inside Sequelize transactions. Re-importing a transcript replaces prior `TRANSCRIPT_JSON` rows for that user while preserving manual rows.

Manual and transcript course rows can coexist for the same user, course code, and semester because `student_courses` uniqueness includes `source`. This protects staff adjustments from being overwritten by a later transcript import.

Transcript import enriches `student_courses` from the yearly course catalog when possible. The row stores the actual opening department, course category, recognition type, approval status, substitution target, approval source, and approval note. This lets the audit engine distinguish original Applied Mathematics required courses from staff-approved substitutions.

## Requirement Modeling

Supported rule types:

```text
TOTAL_CREDITS
COURSE_REQUIRED
ANY_OF
CREDIT_MINIMUM
```

Equivalent course codes are modeled through `ANY_OF`, for example:

```text
線性代數上學期: 701002001 or 701002011
線性代數下學期: 701002002 or 701002012
```

For 113-114, Linear Algebra rules apply a 3-credit cap per semester.

## Confirmed Graduation Credit Structure

Graduation credits are evaluated as:

```text
128 total
= 51 required credits
+ 4 required PE credits
+ 28 general education credits
+ 45 other elective credits
```

The official transcript total is retained as a reference value. It is not used directly as graduation-audit credit because the audit must enforce category caps and missing category requirements.

Official audit results always use passed courses only. If `includeInProgress` is requested, the API returns a separate `projectedResult` while keeping the official `graduationEligible` value based only on passed courses.

## General Education Rules

The backend imports `general_courses` from `data/courses.xlsx` and stores one version per academic year. The current source workbook has 517 general-course definitions, which become 2,068 SQL rows for years 111-114. This avoids assuming that one course code must always have the same general-education category across all years.

The audit engine evaluates these NCCU general education constraints:

- General education total: 28 credits.
- General education credits above 28 are not counted toward graduation credits.
- Chinese language general education: 3-6 credits.
- Foreign language general education: 6 credits.
- Humanities: 3-7 credits.
- Social science: 3-7 credits.
- Natural science: 3-7 credits.
- Information: 0-3 credits for Applied Mathematics students because the department is exempt from the information general education minimum.
- College general education: 0-3 credits.
- Core courses: at least two distinct domains among humanities, social science, and natural science.

Each bucket has a max-credit cap. Credits above a bucket cap are reported in `uncountedCourses` and excluded from the 28 general education credits.

Cross-domain general education courses are assigned by the audit engine to the best supported bucket. The optimizer prioritizes completing minimum bucket requirements, then core requirements, then total counted credits.

Foreign language recognition currently supports:

- courses listed as foreign language general education in `general_courses`;
- transcript/manual remarks that explicitly classify a course as foreign language general education.

Course names alone are not used to classify foreign language credits. English exemption or ETP substitution cases should be represented through `general_courses`, transcript remarks, or a manual student-course adjustment by staff.

## PE And Defense Rules

PE is evaluated as four distinct required PE courses, with each course counting as one credit. A course must have a distinct course code and name to count as another required PE course.

PE elective courses and national defense / military training courses are not part of the required 4 PE credits. They may count toward the 45 other elective credits with separate caps:

- PE elective courses: up to 4 credits.
- National defense / military training courses: up to 4 credits.

These caps do not add credits beyond the 128-credit graduation requirement. They only limit how many of these courses can be counted inside the 45 other elective credits.

## Other Elective Rules

Other elective credits are courses that are not counted as:

- required Applied Mathematics courses;
- required PE courses;
- general education courses.

The other elective requirement is 45 credits. Courses above 45 are reported in `uncountedCourses` and not counted toward the 128 graduation credits.

## Audit Persistence

`POST /api/audit/run` saves results to `audit_results` by default. For load testing or temporary checks, clients may send:

```json
{
  "saveResult": false
}
```

This returns the audit result without creating a history row.

See `docs/api-spec.md` for request/response examples and `docs/demo-flow.md` for the full demo procedure.

## Migration Strategy

The backend uses a versioned migration runner:

```text
src/scripts/migrate.js
src/migrations/001-create-core-schema.js
```

Applied migrations are recorded in `schema_migrations`. The runner is idempotent: already-applied migrations are skipped on later container starts.

The migration script also retains a small cleanup step for legacy duplicate unique indexes created by the earlier demo `sync({ alter: true })` approach. It no longer uses `sequelize.sync({ alter: true })` for normal schema creation.

Future schema changes should be added as new files, for example:

```text
008-add-unresolved-course-review-fields.js
009-add-additional-audit-fields.js
```

Authentication-related migrations already exist in `002-add-auth-fields.js`, `003-add-username.js`, and `004-add-reset-token.js`.

## Manual Adjustments

Transcript imports use `source = TRANSCRIPT_JSON`. Staff adjustments use `source = MANUAL`.
Manual rows with `score = MANUAL` are treated as passed courses because they represent staff-approved recognition or correction.

Manual adjustment endpoints:

```text
POST   /api/admin/manual-courses
PATCH  /api/admin/manual-courses/:id
DELETE /api/admin/manual-courses/:id
```

These endpoints are intended for cases such as foreign-language exemption, ETP substitution, manually recognized general education credits, or other staff-approved corrections. Manual rows are stored separately from transcript rows and are preserved across transcript re-imports.
