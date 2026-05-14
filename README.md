# NCCU Mathematical Sciences Undergraduate Degree Audit Reporting System for Academic Years 111-114

## Degree Audit Reporting System (DARS)

The Degree Audit Reporting System (DARS) is a computer generated report for undergraduate and associate level students that matches the requirements of a degree program with a student's course work taken. The audit identifies those graduation requirements that are completed as well as those requirements that still need to be completed.

## Introduction 

This repository is the final project for the **114-2 Database Systems** course.

The system allows students to import transcript JSON files downloaded from iNCCU and automatically evaluates whether the student satisfies the graduation requirements of the **NCCU Department of Mathematical Sciences undergraduate program**.

The current system focuses on the following modules:

- **Student Portal**
  - Import transcript JSON files
  - View imported course records
  - Run degree audits
  - View audit results and audit history

- **Admin Portal**
  - Review unresolved courses
  - Create manual course adjustments
  - Query course data
  - Query graduation rules
  - View student audit records

- **Backend**
  - Express API + Sequelize + MySQL
  - Handles transcript import, rule evaluation, audit result persistence, and administrative adjustments

- **Frontend**
  - React + Vite + TypeScript + Tailwind CSS
  - Provides the user interface for transcript import, degree audit execution, and result visualization

> **Security Notice.** Please do NOT upload real personal transcripts or sensitive academic records to the demo system. Future improvements will include backend authentication, JWT/session management, role-based access control, and stricter authorization checks.



## Technology Stack

```text
Frontend:   React + Vite + TypeScript + Tailwind CSS
Backend:    Node.js + Express + Sequelize
Database:   MySQL
Container:  Docker Compose
```



## Project Structure

```text
1142-nccu-database-systems/
├── backend/                # Express API, Sequelize models, audit engine
├── frontend/               # React + Vite frontend application
├── data/                   # Course Excel files and demo transcript JSON files
├── docs/                   # API docs, backend design, assumptions, performance reports
├── performance/            # k6 load testing scripts
├── docker-compose.yml      # Local Docker Compose setup: MySQL + backend
├── requirement.txt         # System requirements and functional requirements
└── README.md
```



## Frontend–Backend Integration

The frontend does not access the database directly.  
All data operations are performed through backend API endpoints.

```text
User interaction
    ↓
React page / component
    ↓
frontend/src/api/hooks.ts
    ↓
frontend/src/api/client.ts
    ↓
HTTP API request
    ↓
backend/src/routes/*
    ↓
backend/src/controllers/*
    ↓
backend/src/services/*
    ↓
Sequelize models
    ↓
MySQL
```

During local development, the frontend calls:

```text
http://localhost:3001/api/...
```

When exposing the system through Cloudflare Tunnel for demo purposes, the frontend calls relative paths:

```text
/api/...
```

These requests are then proxied by the Vite development server to:

```text
http://localhost:3001
```



## System Workflow

The system consists of two major workflows:

1. Students upload transcript JSON files downloaded from iNCCU and run a graduation audit.
2. Administrators review courses that cannot be automatically classified and create manual adjustments.



### Transcript JSON to Degree Audit

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#ffffff",
    "primaryTextColor": "#111111",
    "primaryBorderColor": "#111111",
    "lineColor": "#111111",
    "secondaryColor": "#f7f7f7",
    "tertiaryColor": "#ffffff",
    "fontFamily": "Arial, sans-serif"
  }
}}%%

flowchart LR
  A["Transcript<br/>JSON"] --> B["Import API<br/>POST /api/transcripts/import"]
  B --> C["Parse<br/>Student Profile / Course Records"]
  C --> D[("Database<br/>transcript_imports<br/>student_courses")]
  D --> E["Run Audit<br/>POST /api/audit/run"]
  E --> F["Rule Engine<br/>Required / PE / General Education / Electives"]
  F --> G["Audit Result"]
  G --> H["Frontend<br/>Display Result"]
  G --> I{"saveResult?"}
  I -->|true| J[("Database<br/>audit_results")]
  I -->|false| K["Return Only"]

  classDef node fill:#ffffff,stroke:#111111,stroke-width:1.4px,color:#111111;
  classDef api fill:#f7f7f7,stroke:#111111,stroke-width:1.4px,color:#111111;
  classDef db fill:#ffffff,stroke:#111111,stroke-width:2px,color:#111111;
  classDef decision fill:#ffffff,stroke:#111111,stroke-width:2px,color:#111111;

  class A,C,F,G,H,K node;
  class B,E api;
  class D,J db;
  class I decision;
```



### Administrative Manual Adjustment Workflow

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#ffffff",
    "primaryTextColor": "#111111",
    "primaryBorderColor": "#111111",
    "lineColor": "#111111",
    "secondaryColor": "#f7f7f7",
    "tertiaryColor": "#ffffff",
    "fontFamily": "Arial, sans-serif"
  }
}}%%

flowchart LR
  A["Unresolved Courses<br/>GET /api/student-courses/unresolved"]
  A --> B{"Can the course<br/>be manually recognized?"}
  B -->|No| C["Mark as Not Counted<br/>or Add Notes"]
  B -->|Yes| D["Manual Adjustment Form"]
  D --> E["Create Manual Course<br/>POST /api/admin/manual-courses"]
  E --> F[("Database<br/>MANUAL student_course")]
  F --> G["Re-run Audit"]
  G --> H["Review Updated Result"]

  classDef node fill:#ffffff,stroke:#111111,stroke-width:1.4px,color:#111111;
  classDef api fill:#f7f7f7,stroke:#111111,stroke-width:1.4px,color:#111111;
  classDef db fill:#ffffff,stroke:#111111,stroke-width:2px,color:#111111;
  classDef decision fill:#ffffff,stroke:#111111,stroke-width:2px,color:#111111;

  class C,D,G,H node;
  class A,E api;
  class F db;
  class B decision;
```



## Graduation Requirement Model

The current system adopts a 128-credit graduation structure and evaluates credits according to course categories.

### Credit Structure

| Category | Credits | Description |
|---|---:|---|
| Department Required Courses | 51 | Evaluated according to the NCCU Applied Mathematics undergraduate curriculum |
| Required Physical Education | 4 | Checks whether the required PE credits have been completed |
| General Education | 28 | Evaluates language, core, humanities, social science, natural science, information literacy, and college-level requirements |
| Other Electives | 45 | Remaining countable credits after required courses, PE, and general education credits |
| **Total** | **128** | Minimum graduation credit requirement |


### General Education Requirements

The system checks the following general education categories:

```text
Chinese Language General Education
Foreign Language General Education
Humanities General Education
Social Science General Education
Natural Science General Education
Information Literacy General Education
College General Education
Core General Education
```

For **Core General Education**, the system explicitly lists the core-domain courses that the student has passed, making it easier to verify whether the student satisfies the graduation requirement.



## Environment Requirements

| Tool | Recommended Version |
|---|---|
| Docker Desktop | 4.0+ |
| Node.js | 18.0.0+ |
| npm | 9.0+ |
| cloudflared | Optional; only required for Cloudflare Tunnel demos |



## Quick Start

### 1. Create Backend Environment Variables

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and configure the actual database username and password.

Also make sure the MySQL configuration in `docker-compose.yml` is consistent with `backend/.env`.



### 2. Start Backend and MySQL

Run the following command from the project root:

```bash
docker compose up -d --build
```

Check container status:

```bash
docker compose ps
```

Expected output:

```text
nccu-ams-mysql     Up / healthy
nccu-ams-backend   Up
```

Check backend health:

```bash
curl http://localhost:3001/api/health
```

Expected response:

```json
{"status":"ok"}
```



### 3. Seed Initial Data

After the database is created for the first time, import course data, demo transcript data, and test users.

```bash
docker compose exec backend npm run seed
docker compose exec backend npm run seed:transcript
docker compose exec backend npm run seed:k6-user
```

To reset demo data:

```bash
docker compose exec backend npm run reset:demo
```



### 4. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The services will be available at:

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:3001` |


## Free Online Demo with Cloudflare Tunnel

This project supports Cloudflare Tunnel for exposing the locally running system through a temporary public URL.

This is useful for course presentations, demos, and remote testing.



### 1. Ensure the Backend Is Running

```bash
docker compose up -d
curl http://localhost:3001/api/health
```



### 2. Start the Frontend in Tunnel Mode

```bash
cd frontend
npm run dev -- --mode tunnel --host 0.0.0.0
```



### 3. Start Cloudflare Tunnel

```bash
cloudflared tunnel --url http://localhost:5173
```

If `cloudflared` was installed through Homebrew, you may also run:

```bash
/opt/homebrew/opt/cloudflared/bin/cloudflared tunnel --url http://localhost:5173
```

After the tunnel starts successfully, Cloudflare will provide a URL similar to:

```text
https://xxxx.trycloudflare.com
```

> **Note**  
> Cloudflare Quick Tunnel provides a free temporary public URL.  
> The URL is not guaranteed to be permanent.  
> Each tunnel restart may generate a different URL.  
> During the demo, the local machine, Docker containers, Vite development server, and `cloudflared` process must remain running.



## Common API Endpoints

### Health Check

```bash
curl http://localhost:3001/api/health
```



### Import Transcript JSON

```http
POST /api/transcripts/import
```

Purpose:

```text
Imports transcript data exported from iNCCU,
then creates records in transcript_imports and student_courses.
```



### Run Degree Audit

```bash
curl -X POST http://localhost:3001/api/audit/run \
  -H 'Content-Type: application/json' \
  -d '{"userId":1,"academicYear":"111","includeInProgress":false,"saveResult":true}'
```

| Parameter | Type | Description |
|---|---|---|
| `userId` | number | Student user ID to audit |
| `academicYear` | string | Applicable academic year, for example `111` |
| `includeInProgress` | boolean | Whether to include currently enrolled courses in the projected result |
| `saveResult` | boolean | Whether to persist the audit result into `audit_results` |


### Query Audit History

```http
GET /api/audit/history?userId=1&limit=20
```



### Query Unresolved Courses

```http
GET /api/student-courses/unresolved?userId=1
```



### Create Manual Course Adjustment

```http
POST /api/admin/manual-courses
```

Purpose:

```text
Allows administrators to create manually recognized, waived, transferred,
or approved substitute course records.
```



## Frontend Routes

### Student Portal

| Route | Description |
|---|---|
| `/student` | Student dashboard |
| `/student/import` | Import transcript JSON |
| `/student/courses` | View imported courses |
| `/student/audit/run` | Run degree audit |
| `/student/audit/result` | View audit result |
| `/student/audit/history` | View audit history |



### Admin Portal

| Route | Description |
|---|---|
| `/admin` | Admin dashboard |
| `/admin/unresolved` | Review unresolved courses |
| `/admin/manual-courses` | Create manual course adjustments |
| `/admin/courses` | Manage course data |
| `/admin/requirements` | Manage graduation requirements |
| `/admin/audit-history` | View audit records |


## Testing and Validation

### Backend Tests

```bash
cd backend
npm test
```



### Frontend Tests

```bash
cd frontend
npm test
```



### Frontend Production Build

```bash
cd frontend
npm run build
```



### Docker and API Checks

```bash
docker compose ps
curl http://localhost:3001/api/health
curl 'http://localhost:3001/api/courses?year=111&limit=3'
curl 'http://localhost:3001/api/curriculums/113/requirements'
```



### Load Testing

```bash
k6 run performance/k6-audit-test.js
```



## Command Reference

| Task | Command |
|---|---|
| Start Docker services | `docker compose up -d --build` |
| Check container status | `docker compose ps` |
| Seed course data | `docker compose exec backend npm run seed` |
| Seed demo transcript | `docker compose exec backend npm run seed:transcript` |
| Create k6 test user | `docker compose exec backend npm run seed:k6-user` |
| Reset demo data | `docker compose exec backend npm run reset:demo` |
| Start frontend | `cd frontend && npm run dev` |
| Run backend tests | `cd backend && npm test` |
| Run frontend tests | `cd frontend && npm test` |
| Build frontend | `cd frontend && npm run build` |
| Run load test | `k6 run performance/k6-audit-test.js` |


## License

This project is developed as a course final project and is intended for academic demonstration and learning purposes only.

---

# 111~114學年度 政大應數系 學士班畢業審核系統

- 此份專案為 114-2 資料庫系統期末專案
- 此份系統可以讓學生匯入 iNCCU 下載的成績 JSON 檔案，依照畢業規則計算是否符合畢業資格。

目前專案重點是：
- 學生端：匯入成績 JSON、查看修課資料、執行畢業審核、查看審核結果與歷史紀錄。
- 管理員端：查看待確認課程、建立人工調整、查課程資料、查畢業規則、看學生審核紀錄。
- 後端：Express API + Sequelize + MySQL，負責資料匯入、規則計算、審核結果儲存。
- 前端：React + Vite + TypeScript + Tailwind CSS，負責操作介面與結果呈現。

> 注意：目前登入/註冊是前端展示流程，不是正式帳號認證系統，請勿輕易上傳個人成績單上去，以免個資洩漏。本團隊未來會再補後端 auth、JWT/session、角色權限檢查。

## 技術架構

```text
Frontend：React + Vite + TypeScript + Tailwind CSS

Backend：Node.js + Express + Sequelize

Database：MySQL

Container：Docker Compose
```
專案架構：

```text
1142-nccu-database-systems/
├── backend/                # Express API、Sequelize models、audit engine
├── frontend/               # React + Vite 前端
├── data/                   # 課程 Excel、demo transcript JSON
├── docs/                   # API、後端設計、假設、效能報告
├── performance/            # k6 壓測腳本
├── docker-compose.yml      # 本機 Docker Compose：MySQL + backend
├── requirement.txt         # 系統需求與功能需求清單
└── README.md
```

## 前後端串接

前端不直接碰資料庫，只呼叫後端 API。

```text
使用者操作前端
    ↓
React page / component
    ↓
frontend/src/api/hooks.ts
    ↓
frontend/src/api/client.ts
    ↓
HTTP API request
    ↓
backend/src/routes/*
    ↓
backend/src/controllers/*
    ↓
backend/src/services/*
    ↓
Sequelize models
    ↓
MySQL
```

本機開發時，前端預設呼叫：

```text
http://localhost:3001/api/...
```

如果用 Cloudflare Tunnel 對外 demo，前端會改成呼叫相對路徑：

```text
/api/...
```

再由 Vite dev server proxy 到：

```text
http://localhost:3001
```
## 系統流程圖

本系統流程分成兩部分：
- 學生上傳 iNCCU 下載好的個人成績 JSON 檔案後執行畢業審核
- 管理員針對無法自動認列的課程進行人工調整

### 從 Transcript JSON 到畢業審核

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#ffffff",
    "primaryTextColor": "#111111",
    "primaryBorderColor": "#111111",
    "lineColor": "#111111",
    "secondaryColor": "#f7f7f7",
    "tertiaryColor": "#ffffff",
    "fontFamily": "Arial, sans-serif"
  }
}}%%

flowchart LR
  A["Transcript<br/>JSON"] --> B["Import API<br/>POST /api/transcripts/import"]
  B --> C["Parse<br/>學生資料 / 修課紀錄"]
  C --> D[("Database<br/>transcript_imports<br/>student_courses")]
  D --> E["Run Audit<br/>POST /api/audit/run"]
  E --> F["Rule Engine<br/>必修 / 體育 / 通識 / 選修"]
  F --> G["Audit Result"]
  G --> H["Frontend<br/>顯示結果"]
  G --> I{"saveResult?"}
  I -->|true| J[("Database<br/>audit_results")]
  I -->|false| K["Return Only"]

  classDef node fill:#ffffff,stroke:#111111,stroke-width:1.4px,color:#111111;
  classDef api fill:#f7f7f7,stroke:#111111,stroke-width:1.4px,color:#111111;
  classDef db fill:#ffffff,stroke:#111111,stroke-width:2px,color:#111111;
  classDef decision fill:#ffffff,stroke:#111111,stroke-width:2px,color:#111111;

  class A,C,F,G,H,K node;
  class B,E api;
  class D,J db;
  class I decision;
```

### 管理員人工調整流程

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#ffffff",
    "primaryTextColor": "#111111",
    "primaryBorderColor": "#111111",
    "lineColor": "#111111",
    "secondaryColor": "#f7f7f7",
    "tertiaryColor": "#ffffff",
    "fontFamily": "Arial, sans-serif"
  }
}}%%

flowchart LR
  A["Unresolved Courses<br/>GET /api/student-courses/unresolved"]
  A --> B{"可人工認列??"}
  B -->|否| C["標記未採計<br/>或補充備註"]
  B -->|是| D["Manual Form"]
  D --> E["Create Manual Course<br/>POST /api/admin/manual-courses"]
  E --> F[("Database<br/>MANUAL student_course")]
  F --> G["Re-run Audit"]
  G --> H["Review Result"]

  classDef node fill:#ffffff,stroke:#111111,stroke-width:1.4px,color:#111111;
  classDef api fill:#f7f7f7,stroke:#111111,stroke-width:1.4px,color:#111111;
  classDef db fill:#ffffff,stroke:#111111,stroke-width:2px,color:#111111;
  classDef decision fill:#ffffff,stroke:#111111,stroke-width:2px,color:#111111;

  class C,D,G,H node;
  class A,E api;
  class F db;
  class B decision;
```
## 畢業規則概要

本系統目前採用 **128 學分畢業結構**，並依照課程類型進行自動檢核。

### 學分結構

| 類別 | 學分數 | 說明 |
|---|---:|---|
| 系必修 | 51 | 依政大應數系學士班課程規則檢核 |
| 體育必修 | 4 | 檢查體育必修學分是否完成 |
| 通識 | 28 | 檢查語文、核心、自然、社會、人文等通識要求 |
| 其他選修 | 45 | 扣除必修、體育、通識後，其餘可採計選修學分 |
| **合計** | **128** | 畢業最低學分門檻 |

### 通識規則

系統會檢查以下通識類型：

```text
中國語文通識課程
外國語文通識課程
人文學通識
社會科學通識
自然科學通識
資訊通識
書院通識
核心通識
```

其中，核心通識會明確列出學生已通過的核心領域課程，方便確認是否符合畢業要求。

## 環境需求

| 工具 | 建議版本 |
|---|---|
| Docker Desktop | 4.0+ |
| Node.js | 18.0.0+ |
| npm | 9.0+ |
| cloudflared | 選用，僅 Cloudflare Tunnel demo 需要 |

## 快速啟動

### 1. 建立後端環境變數

```bash
cp backend/.env.example backend/.env
```

請開啟 `backend/.env`，填入實際資料庫帳號與密碼。

同時確認 `docker-compose.yml` 中的 MySQL 設定與 `.env` 一致。

### 2. 啟動後端與 MySQL

在專案根目錄執行：

```bash
docker compose up -d --build
```

確認 container 狀態：

```bash
docker compose ps
```

正常情況會看到：

```text
nccu-ams-mysql     Up / healthy
nccu-ams-backend   Up
```

確認後端健康狀態：

```bash
curl http://localhost:3001/api/health
```

正常回應：

```json
{"status":"ok"}
```

### 3. 匯入基礎資料

資料庫第一次建立後，需要匯入課程、demo transcript 與測試使用者資料。

```bash
docker compose exec backend npm run seed
docker compose exec backend npm run seed:transcript
docker compose exec backend npm run seed:k6-user
```

若需要重設 demo 資料：

```bash
docker compose exec backend npm run reset:demo
```

### 4. 啟動前端

另開一個 terminal：

```bash
cd frontend
npm install
npm run dev
```

啟動後可開啟：

| 服務 | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:3001` |

## 免費線上 Demo：Cloudflare Tunnel

本專案支援透過 Cloudflare Tunnel 建立臨時公開網址，方便展示本機執行中的系統。

### 1. 確認後端已啟動

```bash
docker compose up -d
curl http://localhost:3001/api/health
```

### 2. 以 tunnel 模式啟動前端

```bash
cd frontend
npm run dev -- --mode tunnel --host 0.0.0.0
```

### 3. 啟動 Cloudflare Tunnel

```bash
cloudflared tunnel --url http://localhost:5173
```

如果使用 Homebrew 安裝 `cloudflared`，也可以執行：

```bash
/opt/homebrew/opt/cloudflared/bin/cloudflared tunnel --url http://localhost:5173
```

成功後會得到類似以下的網址：

```text
https://xxxx.trycloudflare.com
```

> 注意：Cloudflare Quick Tunnel 是免費臨時網址，不保證永久有效。  
> 每次重新啟動 tunnel，網址可能會更換。  
> 展示期間需保持電腦、Docker、Vite 與 cloudflared 持續執行。

## 常用 API

### 基礎檢查

```bash
curl http://localhost:3001/api/health
```

### 匯入 transcript JSON

```http
POST /api/transcripts/import
```

用途：

```text
將 iNCCU 全人系統匯出的成績資料 JSON 匯入資料庫，
並建立 transcript_imports 與 student_courses 紀錄。
```

### 執行畢業審核

```bash
curl -X POST http://localhost:3001/api/audit/run \
  -H 'Content-Type: application/json' \
  -d '{"userId":1,"academicYear":"111","includeInProgress":false,"saveResult":true}'
```

| 參數 | 型別 | 說明 |
|---|---|---|
| `userId` | number | 要審核的學生 ID |
| `academicYear` | string | 適用學年度，例如 `111` |
| `includeInProgress` | boolean | 是否將修課中課程納入預估結果 |
| `saveResult` | boolean | 是否將審核結果儲存至 `audit_results` |

### 查詢審核歷史

```http
GET /api/audit/history?userId=1&limit=20
```
### 查詢待確認課程

```http
GET /api/student-courses/unresolved?userId=1
```

### 建立人工調整

```http
POST /api/admin/manual-courses
```

用途：

```text
讓管理員新增人工認列、抵免或核准替代課程。
```
## 前端頁面

### 學生端

| 頁面 | 說明 |
|---|---|
| `/student` | 學生首頁 |
| `/student/import` | 匯入 transcript JSON |
| `/student/courses` | 查看已匯入課程 |
| `/student/audit/run` | 執行畢業審核 |
| `/student/audit/result` | 查看審核結果 |
| `/student/audit/history` | 查看歷史審核紀錄 |

### 管理員端

| 頁面 | 說明 |
|---|---|
| `/admin` | 管理員首頁 |
| `/admin/unresolved` | 查看待確認課程 |
| `/admin/manual-courses` | 建立人工調整課程 |
| `/admin/courses` | 管理課程資料 |
| `/admin/requirements` | 管理畢業規則 |
| `/admin/audit-history` | 查看審核紀錄 |

## 測試與驗證

### 後端測試

```bash
cd backend
npm test
```

### 前端測試

```bash
cd frontend
npm test
```

### 前端 build

```bash
cd frontend
npm run build
```

### Docker / API 檢查

```bash
docker compose ps
curl http://localhost:3001/api/health
curl 'http://localhost:3001/api/courses?year=111&limit=3'
curl 'http://localhost:3001/api/curriculums/113/requirements'
```

### 壓力測試

```bash
k6 run performance/k6-audit-test.js
```

## 專案啟動指令總覽

| 任務 | 指令 |
|---|---|
| 啟動 Docker services | `docker compose up -d --build` |
| 查看 container 狀態 | `docker compose ps` |
| 匯入基礎課程資料 | `docker compose exec backend npm run seed` |
| 匯入 demo transcript | `docker compose exec backend npm run seed:transcript` |
| 建立 k6 測試使用者 | `docker compose exec backend npm run seed:k6-user` |
| 重設 demo 資料 | `docker compose exec backend npm run reset:demo` |
| 啟動前端 | `cd frontend && npm run dev` |
| 後端測試 | `cd backend && npm test` |
| 前端測試 | `cd frontend && npm test` |
| 前端 build | `cd frontend && npm run build` |
| 壓力測試 | `k6 run performance/k6-audit-test.js` |

## Licence

- 本專案為課程期末專案，僅供學術展示與學習使用。
