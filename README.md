# CARETAI

## Clinical Analysis for Responsive Evaluation & Tracking using AI

CARETAI is a frontend-focused healthcare demo application designed to help patients, caregivers, and doctors collect and organize care information in a structured way. The experience guides conversations, turns patient-reported details into organized visit information, and presents that information for clinician review. It does not independently diagnose conditions, prescribe medication, or replace clinical judgment. The AI component in this project is used to collect and organize information for doctor review; the final diagnosis, treatment decision, and prescribing authority remain with the doctor.

## 1. Project overview

CARETAI is a React + TypeScript + Vite application that demonstrates how patient and caregiver information can be gathered, structured, and reviewed in a healthcare context. The current repository is a frontend prototype and demo experience rather than a production medical system.

Intended users:
- Patients and caregivers recording symptoms or concerns
- Doctors reviewing organized patient visit information
- Admin users reviewing demo verification workflows

Important: this app is not a medical diagnostic tool and does not independently diagnose or prescribe medication.

## 2. Current project structure

### Root repository
The repository root contains the Git workspace and project configuration, including:
- `README.md` — project documentation
- `.gitignore` — ignore rules for `node_modules`, build output, logs, and temp files
- `.mise.toml` — toolchain configuration for Node.js and pnpm
- `.gitattributes` — Git attributes settings
- `AGENTS.md` — local project guidance and development notes

This repository is a Git project, and the app commands must be run from `frontend/` rather than the repository root.

### `frontend/`
`frontend/` is the active application directory. It contains the React, TypeScript, and Vite app along with project dependencies and build configuration.

Key files include:
- `frontend/package.json` — scripts and dependencies
- `frontend/package-lock.json` — npm lockfile currently committed to the repo
- `frontend/vite.config.ts` — Vite dev server and build config
- `frontend/tsconfig.json` — TypeScript config
- `frontend/index.html` — app entry shell
- `frontend/src/` — frontend source code

### `frontend/src/`
The source code is organized by feature area:
- `frontend/src/app/` — application router and top-level app shell
- `frontend/src/auth/` — sign-in, sign-up, registration, and demo auth flows
- `frontend/src/patient/` — patient/caregiver screens and related data
- `frontend/src/doctor/` — doctor dashboards and review workflows
- `frontend/src/admin/` — admin access and doctor-verification demo flows
- `frontend/src/landing/` — public landing page and marketing content
- `frontend/src/assets/` — frontend assets used by the app
- `frontend/src/index.css` — global styling entrypoint
- `frontend/src/main.tsx` — React application entry point

### `frontend/public/`
There is no `frontend/public/` directory in the current repository. The app does not currently rely on a checked-in static public-asset folder. The app shell is handled by `frontend/index.html`, and frontend assets are stored under `frontend/src/assets/`.

### `frontend/dist/`
`frontend/dist/` is the generated production build output directory. It is created when the Vite production build runs and is ignored by Git according to the repository `.gitignore`.

### `backend/`
`backend/` contains the FastAPI service, request/response schemas, conversation workflow, and local persistence layer. The conversation and report endpoints use SQLite by default; saved records live in `backend/data/caretai.sqlite3` (ignored by Git). Set `CARETAI_DB_PATH` to select another database file. Supabase hosting and authentication are not configured.

## 3. Prerequisites

Required tools:
- Node.js (includes `npm`)
- Git
- VS Code (recommended editor)

Supported Node.js version:
- The repository currently pins Node.js 22 in `.mise.toml`.
- Vite 8 is used in `frontend/package.json`, and Node 22 is the current project baseline for this repo.

Verify installations:
```powershell
node --version
npm.cmd --version
git --version
```

Windows PowerShell note:
- Use `npm.cmd` in PowerShell when needed.
- Run commands from `frontend/`, not from the repository root.

## 4. Installation

Important: run all installation commands from the `frontend` directory, not from the repository root.

```powershell
cd E:\Desktop\CaretAI\frontend
npm.cmd install
```

This installs the frontend dependencies declared in `frontend/package.json`.

Current package-manager status:
- The repo includes `frontend/package-lock.json`, so the current lockfile is npm-based.
- `.mise.toml` lists `pnpm`, but there is no `frontend/pnpm-lock.yaml` in the repository.
- Because the lockfile and package manager are inconsistent, the safest documented approach is to use npm for this repo until the toolchain is reconciled.

If you want the most reproducible install using the committed lockfile, use:
```powershell
cd E:\Desktop\CaretAI\frontend
npm.cmd ci
```

## 5. Run the development server

From the `frontend` directory:

```powershell
cd E:\Desktop\CaretAI\frontend
npm.cmd run dev
```

Vite prints the local URL in the terminal. Open the exact URL shown by Vite in your browser. The app is configured to host on `0.0.0.0` and use port `8443` in `frontend/vite.config.ts`, so the expected local dev URL is `http://localhost:8443` unless the port is changed by environment configuration.

Leave the terminal open while the development server is running. Use `Ctrl+C` to stop it.

## 6. Build and verify

Available scripts in `frontend/package.json`:
- `npm.cmd run dev` — starts the Vite development server
- `npm.cmd run build` — creates a production build
- `npm.cmd run preview` — serves the built app locally
- `npm.cmd run format` — runs the project formatter (`oxfmt`)

There is no dedicated TypeScript-check script in `package.json`. To run a TypeScript check manually:
```powershell
cd E:\Desktop\CaretAI\frontend
npx tsc --noEmit
```

Production build:
```powershell
cd E:\Desktop\CaretAI\frontend
npm.cmd run build
```

This generates the production output under `frontend/dist/`.

Local production preview:
```powershell
cd E:\Desktop\CaretAI\frontend
npm.cmd run preview
```

## 7. Troubleshooting

1. `ENOENT` for `package.json`
   - You are likely in the repository root instead of `frontend/`.
   - Fix:
     ```powershell
     cd E:\Desktop\CaretAI\frontend
     ```

2. `'vite' is not recognized`
   - The frontend dependencies were not installed, or the install was run from the wrong folder.
   - Fix:
     ```powershell
     cd E:\Desktop\CaretAI\frontend
     npm.cmd install
     ```
   - Confirm `frontend/node_modules/` exists before retrying.

3. Port already in use
   - Use the URL printed by Vite instead of assuming the default port.
   - The app is configured for port `8443` when available, but Vite’s output is authoritative.

4. PowerShell npm execution-policy problems
   - Use `npm.cmd` instead of `npm`.
   - Example:
     ```powershell
     npm.cmd --version
     npm.cmd install
     npm.cmd run dev
     ```

5. Vite configuration warnings
   - Nonfatal warnings are different from actual startup failures.
   - If the app does not start, read the terminal error, confirm dependencies are installed, and check whether the port is already in use.

Do not reinstall Node.js or npm as the first troubleshooting step.

## 8. Local backend and AI status

The React frontend does not currently read backend environment variables or call the new API; its existing demo screens still use their current local/static data. The backend is a separately runnable local FastAPI demo and stores visit conversations and doctor-review drafts in SQLite. Set `CARETAI_DB_PATH` to choose a different SQLite file. Do not use real patient information: the demo API has no authentication or authorization.

Run the backend from PowerShell:

```powershell
cd E:\Desktop\CaretAI\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs` to try the API. `POST /conversations` starts an intake with `main_concern`, optional `mode`, `language`, and `reporter`; send answers to `POST /conversations/{visit_id}/messages`. Completing the guided questions automatically saves a `Draft` report. `POST /conversations/{visit_id}/draft-report` saves an incomplete draft too, keeping unanswered and unknown details visible. `GET /conversations/{visit_id}` returns the saved visit and chronological transcript. Existing `/visits`, `/messages`, and `/reports` routes use the same SQLite store.

The summary is deterministic and based on submitted text; no AI model is called. It does not diagnose, prescribe, or make care decisions. The doctor remains responsible for clinical review and all care decisions. Supabase hosting, authentication, and speech-to-text are not configured.

## 9. Feature status

### Functional demo flows
The current app includes a working front-end demo experience with:
- landing page and marketing content for CARETAI
- sign-in and sign-up flows for patient, caregiver, and doctor roles
- demo email verification and session simulation
- patient and doctor dashboards routed through the app
- admin demo-access and verification flows

### Implemented integrations
The current code includes:
- browser session storage for demo authentication state
- role-based route protection for patient and doctor flows
- mock verification and review states for doctor onboarding
- a local FastAPI API for visits, messages, conversations, and saved draft reports
- SQLite persistence for the local backend demo
- structured patient/doctor UI modules with static data and frontend-only interactions

The React screens are not yet wired to the API. These remain demo workflows, not secure production healthcare integrations.

### Planned features
The following are not implemented in this snapshot:
- real authentication or authorization
- AI inference or LLM-backed processing
- Supabase/PostgreSQL hosting and production database controls
- speech transcription or voice workflows
- production deployment infrastructure

## 10. Development workflow

Recommended workflow:

1. Open the repository root.
2. Change into `frontend/` before running any app commands.
3. Install dependencies:
   ```powershell
   cd E:\Desktop\CaretAI\frontend
   npm.cmd install
   ```
4. Start the app:
   ```powershell
   cd E:\Desktop\CaretAI\frontend
   npm.cmd run dev
   ```
5. Make changes in `frontend/src/`.
6. Run a TypeScript check when needed:
   ```powershell
   cd E:\Desktop\CaretAI\frontend
   npx tsc --noEmit
   ```
7. Build for production:
   ```powershell
   cd E:\Desktop\CaretAI\frontend
   npm.cmd run build
   ```
8. Preview the production build:
   ```powershell
   cd E:\Desktop\CaretAI\frontend
   npm.cmd run preview
   ```
9. Check Git status without touching unrelated files:
   ```powershell
   git status --short
   git diff -- README.md
   git diff -- frontend
   ```

## 11. Summary

CARETAI includes a React + TypeScript frontend and a local FastAPI/SQLite demo backend. The backend can save patient/caregiver conversations and create source-preserving draft reports for doctor review, but the existing frontend is not wired to it. Authentication, cloud database hosting, AI inference, and production medical safeguards are not implemented. Run the frontend from `frontend/` and the backend from `backend/`.

## 12. Exact commands documented

```powershell
cd E:\Desktop\CaretAI\frontend
npm.cmd install
npm.cmd run dev
```

## 13. Unresolved package-manager inconsistency

The repository currently contains `frontend/package-lock.json`, but no `frontend/pnpm-lock.yaml`. `.mise.toml` lists `pnpm`, which creates a lockfile/tooling inconsistency. For this repo, npm is the safest documented package manager until the configuration is reconciled.
