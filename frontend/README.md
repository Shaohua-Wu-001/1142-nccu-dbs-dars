# 畢業審核系統前端

React + Vite + TypeScript frontend for the NCCU Applied Mathematics graduation audit system.

## Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Default URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:3001
```

## Current Auth Scope

The frontend uses backend auth endpoints for login, registration, profile updates, password changes, forgot-password, and reset-password flows. The API client stores the JWT in localStorage and sends it as a Bearer token on API requests.

Student and admin navigation is controlled in frontend state for routing, but backend authorization is enforced by JWT validation plus database role and owner checks.

## Main Flows

- Student: login/register, import transcript JSON, view courses, run audit, view results, rename/delete own visible audit history, and update profile/password.
- Admin: inspect students and upload status, inspect unresolved courses, create/edit/delete manual adjustments, query courses, query requirements, inspect audit history, and update profile/password.

## Verification

```bash
npm test
npm run build
```
