# Axis Implementation Prompt for Cursor
**Goal:** Implement the next 3 foundational deliverables **now**:
1) **Electron auto-updater (Phase 1: updater-ready without hosting yet)**
2) **Docusaurus docs website (public docs, private source)**
3) **Azure DevOps pipeline to build installer + publish artifacts (no Blob required yet)**

This keeps the POC private, minimizes dependencies on other teams, and prepares us to “flip the switch” to real auto-updates later by only changing one URL.

---

## Why we’re doing this

### Electron Auto-Updater (Why)
Axis will be shipped as an internal desktop tool with version control. Users should never “reinstall manually.” We want:
- **Check for updates**
- **Download**
- **Restart to install**
This makes Axis feel like a real product and reduces support burden.

**Important constraint:** We do NOT have Azure Blob/static hosting yet.  
So in Phase 1 we implement updater plumbing + UI + build packaging. Updates will be “ready,” but the feed URL will be a placeholder until hosting exists.

### Docusaurus Docs Website (Why)
We are keeping the source code private, but we need a way for team members to:
- understand the **architecture**
- understand **core services + IPC**
- debug issues via a shared mental model
- follow workflows (Repo Companion → Automate → TM → Jira)

Docusaurus gives:
- clean navigation
- easy markdown authoring
- versioned docs later
- GitHub Pages hosting via a separate public repo (docs-only)

### Azure DevOps Pipeline (Why)
Even without hosting, we need consistent builds:
- generate `Axis Setup.exe` via CI
- publish it as a pipeline artifact
This provides reliable versioned installers and creates the foundation for later publishing to Blob.

---

## Deliverable 1: Electron Auto-Updater (Phase 1)

### Requirements
- Use `electron-updater` + `electron-builder`
- Add an updater service in main process
- Add IPC handlers + event push to renderer
- Add Settings UI section to control updates
- Do **NOT** auto-download updates on start (user-triggered only)
- Use **generic provider** with a placeholder URL for now:
  - `https://example.com/axis-updates` (TODO: replace later with Azure Blob static site URL)

### Implementation tasks

#### 1. Add dependencies
Add:
- `electron-updater`
- `electron-builder`

Ensure build scripts exist:
- `build`
- `dist` (electron-builder packaging)

#### 2. Create updater service
Create: `src/main/services/updater.ts`

Responsibilities:
- Wire electron-updater `autoUpdater`
- Expose methods:
  - `checkForUpdates()`
  - `downloadUpdate()`
  - `installUpdate()` → `autoUpdater.quitAndInstall()`
- Emit events:
  - checking-for-update
  - update-available
  - update-not-available
  - download-progress
  - update-downloaded
  - error
- Log all events clearly prefixed: `[Updater] ...`

#### 3. IPC handlers + event streaming
Modify: `src/main/bridge.ts`

Add IPC handlers:
- `updater:check`
- `updater:download`
- `updater:install`
- `app:getVersion` (so UI can show current version reliably)

Add an event push channel from main → renderer, e.g.:
- `updater:event` (payload includes event type + data)

Renderer subscribes and updates UI.

#### 4. Settings UI section
Modify: Settings screen component (wherever your Integrations/Settings live)

Add section:
- Current version: `vX.Y.Z`
- Button: “Check for updates”
- If update available: “Download update”
- Show download progress %
- If downloaded: “Restart to install”
- Show status messages and errors

#### 5. electron-builder publish config (placeholder)
Update `package.json` (or `electron-builder.yml`) to include publish:

```json
"build": {
  "appId": "com.fourhands.axis",
  "productName": "Axis",
  "win": { "target": "nsis" },
  "publish": [
    {
      "provider": "generic",
      "url": "https://example.com/axis-updates"
    }
  ]
}
NOTE: This URL is placeholder until we get Azure Blob (Phase 2).
App must handle “cannot reach feed” gracefully (show message, no crash).

Acceptance criteria
Axis launches normally

Settings shows version + updater controls

Clicking “Check for updates” triggers updater events (even if feed unreachable)

No crashes when feed is unreachable

Packaging produces an NSIS installer (Axis Setup.exe)

Deliverable 2: Docusaurus Docs Website
Requirements
Add a /docs-site folder OR create a separate repo later (fh-axis-docs)

For now, generate the Docusaurus scaffold with starter pages

Docs must explain:

what Axis is

architecture (main/renderer/services)

IPC contract overview

core workflows

troubleshooting basics

Include explicit note: “Docs are public, source is private. Do not include secrets.”

Implementation tasks
1. Create Docusaurus scaffold
At repo root (or docs-site/):

npx create-docusaurus@latest docs-site classic

npm install

npm run start

2. Add initial doc pages
Create the following pages:

docs/intro.md

What Axis is (structured QA workflow tool)

What it integrates with (BrowserStack Automate, TM, Jira, ADO)

What it does NOT do (no local execution, Automate only)

docs/architecture/overview.md

renderer vs main

services

why IPC exists

docs/architecture/ipc.md

list of important IPC channels (repo scan, automate, tm, jira, updater)

docs/workflows/jira-bug-creation.md

FailureContext → Draft → Create Issue

V1 scope (no stack parsing)

evidence links

docs/troubleshooting/common-errors.md

update feed unreachable

BrowserStack auth failures

Jira create failures

3. Configure nav
Update sidebars.js accordingly.

Acceptance criteria
npm run start runs docs locally

Docs have clean sidebar navigation

Docs include the “why” and the high-level architecture

Deliverable 3: Azure DevOps Pipeline (Build Installer Artifact Only)
Requirements
Add azure-pipelines.yml

Build Windows installer via electron-builder

Publish build output folder as pipeline artifact

No hosting/upload step yet (that’s Phase 2)

Implementation tasks
Create azure-pipelines.yml:

Node version: LTS (18 or 20)

Install deps (npm ci)

Build app

Run electron-builder for Windows (npm run dist or equivalent)

Publish artifact (the installer output dir)

Acceptance criteria
Pipeline produces an artifact containing the installer (.exe)

Build is reproducible

No secrets required

Non-goals (explicit)
No Azure Blob hosting yet

No code signing yet

No staged rollout yet

Final instruction to Cursor
Implement these 3 deliverables now with minimal disruption:

Introduce updater plumbing + UI (Phase 1 placeholder feed URL)

Add Docusaurus docs scaffold with starter pages and rationale

Add Azure DevOps pipeline YAML that builds installer + publishes artifact

Do not invent new architecture; integrate into existing structure and naming conventions.