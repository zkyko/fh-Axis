# Architecture

## 1. Goals

- Provide a single hub to view:

  - BrowserStack Automate builds/sessions + artifacts

  - BrowserStack Test Management projects/cases/runs/results

  - Jira defect status + creation/linking

- Provide multi-user collaboration workflows (triage/assign/labels) without owning execution

- Provide QA-only repo companion features (create test template, git state, open IDE)

- Package reliably as a Windows EXE (no Playwright binaries)

## 2. Non-Goals

- Not a test runner

- Not Playwright wrapper/codegen

- Not CI trigger system (may be optional later)

- Not a complete replacement of BrowserStack UI when API gaps exist

## 3. Topology

Electron app with clear boundaries:

### Renderer (React UI)

- pages, components, view models

- no secrets

- no direct access to OS, git, filesystem, or external APIs

### Main Process (Trusted Backend)

- integrations (BrowserStack/Jira/ADO)

- git + filesystem operations

- token storage + encryption

- background sync jobs (lightweight)

### Storage

- Local storage for config + caches + workflow metadata

- Prefer SQLite (simple) OR JSON for v0

- All integration secrets live in encrypted store (OS-backed)

## 4. Data flow

1. User opens workspace

2. Main process fetches:

   - TM runs/results

   - Automate builds/sessions

   - Jira issues (linked)

3. Main correlates objects into unified "Failure Narrative"

4. Renderer displays:

   - Runs → Run Detail → Failure Detail

   - Evidence viewer + Jira panel

5. Optional: user creates/links Jira, adds annotations (stored locally)

## 5. Key subsystems

### 5.1 Integrations Layer

- **BrowserStack Automate client** - Fetches builds, sessions, and artifacts
- **BrowserStack TM client** - Fetches projects, runs, and test results
- **Jira client** - Creates, searches, and links issues
- **Azure DevOps client** - Full repository management:
  - Repository listing and details
  - Commit history and details
  - Branch information
  - URL parsing (supports multiple Azure DevOps URL formats)
  - PAT-based authentication for Git operations

All clients return normalized objects and handle authentication securely in the main process.

### 5.2 Correlation Engine

Joins:

- TM TestResult ↔ Automate Session (by correlation keys)

- TestResult ↔ Jira Defect (by stored links or signature search)

- TestResult ↔ Azure Commit/Branch (by metadata or stored correlations)

- Run ↔ Commit/Branch (ADO metadata / git)

The correlation engine now includes Azure DevOps service integration to link test results to specific commits and branches, enabling traceability from test failures to code changes.

### 5.3 Workflow Layer

Stored locally:

- assignment

- triage labels (product/test/infra/flaky)

- comments

- audit log (who did what)

### 5.4 Repo Companion (QA-only)

- **Default Workspace Management**
  - Default directory: `~/Documents/QA-Studio-Workspace`
  - Auto-created on first use
  - Persistent storage in database

- **Repository Detection**
  - Auto-detects cloned repos on app startup
  - Scans default workspace directory
  - Checks git sync status (ahead/behind)
  - Shows status indicators in UI

- **Git Operations**
  - Full Git workflow:
    - Clone repositories (with Azure PAT authentication)
    - Pull/Push operations
    - File staging/unstaging
    - Commit with message validation
    - Branch management (create, switch, view)
  - Git status tracking:
    - Staged files
    - Unstaged files
    - Untracked files
    - Branch information
    - Ahead/behind counts

- **Commit Management**
  - Commit history viewer
  - Commit message validation (min 10 chars)
  - Guardrails to prevent empty commits

- **IDE Integration**
  - Open repository in VS Code
  - Local path display and management

- **Future Features**
  - Test template generation
  - Git diff viewer
  - File comparison

## 6. API-gap strategy

If BrowserStack AI features are not exposed via public API:

- show in-app where possible

- otherwise provide deep-links to BrowserStack pages

- never block core triage experience on UI-only features

## 7. Packaging strategy

- Avoid Playwright runtime

- Minimize native modules

- Keep credentials out of renderer

- Prefer calling system git via execa

## 8. Observability

- structured logs in main process

- optional local log file

- error boundary in renderer

