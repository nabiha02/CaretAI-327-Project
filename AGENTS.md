# CARETAI — Agent Instructions

## 1. Project Overview

CARETAI (Clinical Analysis for Responsive Evaluation & Tracking using AI) is a CSE327 project.

The application collects patient or caregiver information, organizes evidence, and prepares structured reports for doctors to review. AI supports information collection and summarization; it must not diagnose patients or prescribe medication.

The frontend is an existing React + TypeScript application. Backend, database, and AI integration must be developed incrementally without breaking working frontend functionality.

## 2. Mandatory Rules

- Inspect relevant existing files before editing anything.
- Follow the actual repository structure and existing coding conventions. Never assume a file exists because it appears in an example or an older guide.
- Make the smallest change that fully satisfies the task.
- Do not rewrite, reorganize, or refactor unrelated code.
- Do not create unnecessary files, duplicate implementations, or speculative features.
- Do not create `.txt`, `.md`, documentation, report, summary, changelog, plan, or notes files unless explicitly requested or required for the task.
- Do not create additional instruction files such as `AGENTS.md` in subdirectories unless explicitly approved.
- Do not install packages or introduce dependencies unless necessary. Explain why a new dependency is needed.
- Never silently delete, rename, overwrite, or move existing files.
- Never replace working implementations with placeholders or mock data unless the task specifically requires it.
- Do not claim a feature works unless you have verified it appropriately.
- Never expose secrets, API keys, passwords, access tokens, or private environment-variable values.

## 3. Workflow Before Editing

For every task:

1. Read this file and the relevant existing source files.
2. Identify the exact files that need changes.
3. Check existing imports, routes, dependencies, and conventions before designing a solution.
4. For a task involving multiple files, architecture changes, dependencies, or potentially destructive changes, present a short plan and wait for approval before editing.
5. For a small, clearly specified change, proceed without unnecessary planning or questions.
6. Implement only the approved scope.
7. Run appropriate checks and report the actual results.

If an expected file is missing, search the real project structure before proceeding. Do not repeatedly attempt to read a nonexistent path.

## 4. File Creation and Documentation

- Every new file must have a clear purpose directly related to the requested task.
- Prefer extending an existing relevant file over creating another file with overlapping responsibilities.
- Do not generate explanatory `.txt` files or save terminal output to files.
- Do not create documentation merely to describe changes made during a task.
- Update existing documentation only when requested or when the task requires documentation to remain accurate.
- Keep `README.md`, dependency files, configuration files, and this `AGENTS.md` intact unless the task requires changes to them.
- Before adding a file, explain its purpose when presenting a multi-file plan.
- After completing a task, summarize changes in the response rather than creating a separate report file.

## 5. Frontend Rules

Location: `frontend/`

Technology:
- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router

Important locations:
- `frontend/src/main.tsx` — application entry point
- `frontend/src/app/` — application shell and routing
- `frontend/src/index.css` — global styles and design tokens
- `frontend/src/auth/` — authentication-related UI
- `frontend/src/patient/` — patient-facing features
- `frontend/src/doctor/` — doctor-facing features
- `frontend/src/admin/` — administration features
- `frontend/src/landing/` — landing pages

These are known locations, not permission to assume every file exists. Inspect the current tree when necessary.

Frontend requirements:
- Preserve the existing patient, doctor, and admin workflows.
- Preserve the current design system, responsive layouts, and Bangla/English support.
- Follow existing component, routing, naming, and export conventions.
- Avoid giant components and unnecessary duplication.
- Keep patient, doctor, admin, authentication, and shared application concerns logically separated.
- Do not introduce a new state-management library or UI framework without approval.
- Do not replace real implementations with hardcoded demo data.
- Do not break existing routes, session behavior, or navigation when making unrelated changes.
- Do not make unrelated visual redesigns.

## 6. Backend Rules

Location: `backend/`

Technology planned:
- Python
- FastAPI
- PostgreSQL through Supabase

Requirements:
- Inspect the existing backend before creating files.
- Keep API routes, configuration, schemas, services, and database access separated when appropriate.
- Use environment variables for configuration and secrets.
- Keep dependencies in the appropriate existing dependency file. Use `backend/requirements.txt` if that is the approved project convention.
- Do not commit `.env` files containing secrets.
- Configure CORS for the actual frontend origin rather than allowing every origin indiscriminately.
- Validate incoming data and handle errors clearly.
- Never trust frontend-only role checks as backend authorization.
- Do not claim authentication, persistence, or API integration is complete until implemented and tested.

## 7. Database and AI Safety

- Use real database persistence only when the database integration has been implemented.
- Do not invent database records or claim mock records are real patient data.
- Keep patient information private and restrict access according to user roles.
- Do not expose sensitive patient information in logs or error messages.
- AI-generated content must be distinguishable from patient-reported facts.
- Preserve evidence, source attribution, and uncertainty in clinical summaries.
- AI must not provide a diagnosis or prescribe medication.
- Emergency situations must follow the project's defined emergency-response behavior.
- Never use real patient information for testing unless explicitly authorized and appropriately protected.

## 8. Testing and Verification

After a change:

- Run the most relevant available checks, such as the frontend build, TypeScript checks, or backend tests.
- Test affected routes and workflows when feasible.
- Inspect errors and warnings caused by the change.
- Do not claim a check passed if it was not run.
- If a check cannot run, state why.
- Do not suppress errors or weaken TypeScript settings just to make a build pass.
- Do not modify unrelated files merely to clean up warnings.

Before and after substantial changes, inspect `git status` and review the diff when Git is available.

Never run destructive Git commands, discard user changes, or perform broad cleanup without explicit approval.

## 9. Dependencies and Commands

- Inspect the existing `package.json`, lockfiles, Python version, and installed dependencies before suggesting installation commands.
- Use the package manager already established by the repository; do not create a second lockfile.
- Do not upgrade major dependencies unless requested and justified.
- Do not change the Node.js or Python version without explaining the compatibility reason.
- Do not start duplicate development servers if the required server is already running.
- Never assume a command succeeded; check its output.

## 10. Completion Report

When a task is complete, respond briefly with:

1. What changed.
2. Which existing files were modified and which new files were created.
3. What tests or checks were run and their actual results.
4. Any remaining issues or manual steps.

Do not create a separate report file.

## 11. Scope and Approval

The user's explicit request defines the task scope.

If a requested change requires unrelated modifications, destructive actions, significant architectural decisions, or additional dependencies, explain the reason and request approval first.

Do not continue expanding the task just because additional improvements are possible.

Prioritize correctness, maintainability, minimal changes, patient safety, and preservation of working functionality.