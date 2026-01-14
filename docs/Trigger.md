```md
# QA Hub (V2-Studio) — Remote Test Triage + ADO Remote Runner

QA Hub is a **desktop triage/control-plane** for QA engineers that unifies:

- **BrowserStack Automate** evidence (builds/sessions/artifacts)
- **BrowserStack Test Management (TM)** runs/results/cases
- **Jira** defect workflow (search/create/link)
- **Azure DevOps** repo companion + **remote execution** (trigger pipelines that run tests on BrowserStack Automate)

✅ **Key principle:** QA Hub does **not** execute tests locally.  
All test execution is performed by **Azure DevOps Pipelines** (remote runner) targeting **BrowserStack Automate**.

---

## Why this exists

Most teams have execution (CI/BrowserStack) and tracking (Jira), but the painful middle layer is missing:

- “Why did it fail?”
- “Who owns it?”
- “What changed?”
- “Where is the evidence?”
- “Can I rerun only this test quickly?”

QA Hub solves that by correlating results, evidence, and workflow state into a single Failure Narrative.

---

## Goals

- One hub to view:
  - BrowserStack Automate builds/sessions/artifacts
  - BrowserStack TM projects/cases/runs/results
  - Jira defect status + creation/linking
- Multi-user collaboration workflows (triage/assign/labels) without owning execution
- QA-only repo companion features (clone/pull/status, open in IDE)
- **Remote execution trigger** via Azure DevOps Pipelines (no local runner)
- Package reliably as a Windows EXE

---

## Non-goals

- Not a test runner running on your machine
- Not Playwright codegen / recorder
- Not a CI orchestrator (beyond “trigger pipeline run”)

---

## Architecture (High level)

Electron application with strict boundaries:

### Renderer (React UI)
- Pages/components/view models
- **No secrets**
- **No filesystem / git / external APIs**

### Main Process (Trusted backend)
- Integrations: BrowserStack / Jira / Azure DevOps
- Git + filesystem operations
- Credential storage + encryption
- Background sync jobs (polling ADO + BrowserStack)

### Storage
- Local SQLite (better-sqlite3) for:
  - correlations
  - workflow annotations
  - audit log
  - cached snapshots
  - local repo paths
  - app settings

---

## Execution model (Remote runner)

### The big idea
QA Hub triggers **Azure DevOps pipeline runs**, and those pipelines execute tests against **BrowserStack Automate**.

QA Hub:
1. Lets you browse/view tests locally (read-only)
2. Lets you select tests (all / file / tag / grep)
3. Triggers an Azure DevOps pipeline with those parameters
4. Correlates:
   - ADO run → BrowserStack build/session → artifacts → Jira defects

### Correlation key
To reliably map an Azure pipeline run to BrowserStack sessions, we embed a correlation string into the BrowserStack build name:

`QAHub|adoRun=<RUN_ID>|repo=<REPO>|branch=<BRANCH>`

The pipeline is responsible for setting the BrowserStack build/session metadata accordingly.

---

## Features

### 1) Runs + Failures (Triage hub)
- List runs (from TM, optionally enriched)
- Run Detail:
  - failing tests list
  - failure clusters by signature
- Failure Detail:
  - error + stack excerpt
  - BrowserStack evidence links (video, logs, HAR)
  - Jira panel (link/create/search)
  - triage label + owner + comments + audit log

### 2) Repo Companion (QA-only)
- Default workspace: `~/Documents/QA-Studio-Workspace`
- Auto-detect cloned repos on startup
- Git status: staged/unstaged/untracked, branch, ahead/behind
- Clone/Pull/Push, stage/unstage, commit (with validation)
- Branch management (create/switch, uncommitted changes protection)
- Open in VS Code

### 3) Test Script Viewer (New)
- File tree discovery (globs or config-based)
- Read-only script view (Monaco editor recommended)
- Open file/repo in VS Code

### 4) Remote Execution Trigger (New)
- Execute **All**
- Execute by **File**
- Execute by **Tag**
- Execute by **Grep/TestName**
- Live run status:
  - queued → running → completed
- Deep links:
  - Azure pipeline run URL
  - BrowserStack build/session URL(s)

---

## Tech stack

- Electron
- React + Vite
- TypeScript (strict)
- TailwindCSS + DaisyUI
- Zustand
- better-sqlite3 (SQLite)
- electron-store (OS-backed encryption)
- axios (HTTP)
- child_process.exec (system git)

---

## Repo structure

```

V2-Studio/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # Main entry
│   │   ├── bridge.ts            # IPC handlers
│   │   ├── preload.ts           # Secure preload
│   │   └── services/
│   │       ├── browserstack-automate.ts
│   │       ├── browserstack-tm.ts
│   │       ├── jira.ts
│   │       ├── azure-devops.ts
│   │       ├── azure-pipelines.ts        # (NEW) pipeline runner trigger
│   │       ├── correlation-engine.ts
│   │       └── storage.ts
│   ├── types/                   # Shared TS types
│   └── ui/                      # Renderer
│       ├── src/
│       │   ├── components/
│       │   ├── store/
│       │   ├── ipc.ts           # Typed IPC wrapper
│       │   └── App.tsx
├── docs/
└── package.json

````

---

## IPC contract (Renderer ↔ Main)

**Rule:** Renderer never talks to external APIs or filesystem directly.

New namespaces (planned):

### `repo/*`
- `repo:read-file(repoRoot, filePath)` → file contents for script viewer
- `repo:list-test-files(repoRoot, globs?)` → test discovery
- (existing git ops remain)

### `azurePipelines/*` (NEW)
- `azurePipelines:list()`
- `azurePipelines:run(pipelineId, refName, runParams)`
- `azurePipelines:getRun(pipelineId, runId)`
- `azurePipelines:listRuns(pipelineId, filters)`

### `runner/*` (optional abstraction)
- `runner:execute(scope, selection, branch, env)` → returns `runId`

---

## Data model (Normalized)

We store only what we need:

- normalized metadata
- correlation links
- workflow state
- cached snapshots

Key entities:
- Workspace
- Run (now includes `adoPipelineId`, `adoRunId`, `requestedScope`, `correlationKey`)
- TestResult (includes errorSignature hash)
- Session (BrowserStack Automate session evidence links)
- Defect (Jira)
- Link (generic many-to-many)
- WorkflowAnnotation (triage label, owner, comments, audit log)
- LocalRepositoryPath
- AppSettings

---

## Security

- No secrets in renderer
- All external API calls originate in main
- Credentials stored encrypted at rest (OS-backed)
- Tokens redacted in logs
- Prefer storing evidence links over downloading artifacts

Role-based access (planned):
- QA_ADMIN / QA_ENGINEER can configure and execute
- DEV / VIEWER can view only

---

## Azure DevOps Pipeline Requirements (Remote Runner Contract)

To support remote execution, the pipeline must:

### Inputs (variables or template parameters)
- `TEST_SCOPE` = `all | file | tag | grep`
- `TEST_FILE` (scope=file)
- `TEST_TAG` (scope=tag)
- `TEST_GREP` (scope=grep)
- `ENV` (optional)
- `TRIGGER_SOURCE=qa-hub` (constant)
- `CORRELATION_KEY` = `QAHub|adoRun=<RUN_ID>|repo=<REPO>|branch=<BRANCH>`

### Behavior
- Checkout repo at requested branch/ref
- Execute tests on BrowserStack Automate
- Set BrowserStack build/session metadata:
  - build name includes `CORRELATION_KEY`
  - session names include test identifiers when possible

### Outputs
- ADO run status and logs
- BrowserStack builds/sessions with evidence artifacts

---

## Background sync

Main process runs lightweight polling jobs:

- Poll Azure DevOps run status for active runs
- Once running, search BrowserStack builds by correlation key
- Fetch sessions + artifact links for the build
- Persist normalized session objects + links
- Update UI via store refresh

---

## Getting started (Dev)

### Prerequisites
- Node.js LTS (18+)
- Git (system git required)

### Install
```bash
npm install
````

### Run in dev

```bash
npm run dev
```

### Build

```bash
npm run build:app
```

### Windows installer

```bash
npm run build:win
```

---

## Implementation plan (Cursor instructions)

If you’re using Cursor to build this, implement in this order:

### Phase 1 — Test Viewer + Remote Run Trigger (MVP)

1. Repo test discovery (globs) + file tree UI
2. Read-only script viewer via IPC (`repo:read-file`)
3. Azure pipelines service + IPC (`azurePipelines:run`)
4. Execute UI:

   * Run All
   * Run File
5. Persist `Run` with `adoRunId`, `adoRunUrl`, `requestedScope`, `correlationKey`

### Phase 2 — Status + Correlation

6. Poll ADO run status and show in UI
7. BrowserStack build/session lookup by correlation key
8. Show evidence links for the triggered run

### Phase 3 — Granular selection + triage loop

9. Run by tag/grep
10. “Rerun this failure” from Failure Detail
11. Rerun history per errorSignature cluster

---

## Contribution guidelines

* Renderer = UI only
* Main = integrations + OS access
* Shared = types + normalization
* TypeScript strict
* No `any` for API payloads; define DTOs
* Main returns typed errors over IPC
* Redact tokens in logs

---

## Roadmap

* Signature clustering + flakiness scoring
* Better search (build id, jira key, test name, signature)
* Optional TM writes (create run/add results)
* Repo templates (create new test files from templates)
* Role enforcement for Git operations

---

## License

TBD

```
::contentReference[oaicite:0]{index=0}
```
