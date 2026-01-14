# Axis

**Unified test execution, failure analysis, and defect tracking** — a desktop application for QA + Dev teams to triage failures, correlate evidence, and manage workflow.

## What it is

Axis is an Electron desktop app that:

- Pulls **Builds/Sessions** from **BrowserStack Automate**

- Pulls **Cases/Runs/Results** from **BrowserStack Test Management**

- Pulls and updates **Defects** from **Jira**

- Is **repo-aware** for QA engineers (git status, templates, open in Visual Studio)

- Is **dev-friendly** for debugging (build → failure → evidence → Jira)

## What it is NOT

- ❌ does not run Playwright

- ❌ does not trigger CI by default

- ❌ does not generate tests via Playwright codegen

- ❌ does not wrap Playwright runtime

Execution remains in CI + BrowserStack.

## Personas

### QA Engineers

- Create tests (templates), manage repo state (git)

- Map tests ↔ BrowserStack TM cases

- Triage, label, create/link Jira

### Developers

- Find root cause fast:

  - build context + failure signature

  - BrowserStack video/logs/HAR

  - linked Jira ticket & status

- Comment/collab, but no test-authoring UI

## Docs

- [ARCHITECTURE](./docs/ARCHITECTURE.md)

- [INTEGRATIONS](./docs/INTEGRATIONS.md)

- [DATA MODEL](./docs/DATA_MODEL.md)

- [SECURITY](./docs/SECURITY.md)

- [UI SCREENS](./docs/UI_SCREENS.md)

- [IPC CONTRACT](./docs/IPC_CONTRACT.md)

- [ROADMAP](./docs/ROADMAP.md)

- [DEV SETUP](./docs/DEV_SETUP.md)

- [CODING STANDARDS](./docs/CODING_STANDARDS.md)

## Quick Start

### Prerequisites

- Node.js LTS (18+)
- Git installed (for repo companion features)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will:
1. Build the Electron main process
2. Start the Vite dev server for the React UI
3. Launch the Electron app

### Building

```bash
# Build for production
npm run build:app

# Create Windows installer
npm run build:win
```

## Tech Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **TypeScript** - Type safety
- **TailwindCSS + DaisyUI** - Styling and components
- **Zustand** - State management
- **Vite** - Build tool
- **better-sqlite3** - Local database
- **axios** - HTTP client

## Project Structure

```
V2-Studio/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # Main entry point
│   │   ├── bridge.ts      # IPC handlers
│   │   ├── preload.ts     # Preload script
│   │   └── services/      # Backend services
│   ├── types/             # Shared TypeScript types
│   └── ui/                # React frontend
│       ├── src/
│       │   ├── components/  # UI components
│       │   ├── store/       # Zustand stores
│       │   ├── utils/       # Utilities
│       │   └── App.tsx      # Main app component
│       ├── tailwind.config.js
│       └── postcss.config.js
├── docs/                  # Documentation
└── package.json
```

## Features

### Core Integrations

- **BrowserStack Automate Integration** - View builds, sessions, and evidence
- **BrowserStack Test Management** - View test runs and results
- **Jira Integration** - Create and link defects
- **Azure DevOps Integration** - Repository management, commit tracking, and code correlation

### Workflow & Analysis

- **Correlation Engine** - Link test results to sessions, Jira issues, and Azure commits
- **Triage Workflow** - Assign, label, and comment on failures
- **Commit History** - Track code changes linked to test results

### Repository Management

- **Default Workspace** - Centralized directory for all cloned repositories (`~/Documents/QA-Studio-Workspace`)
- **Auto-Detection** - Automatically detects cloned repos on app startup
- **Sync Status** - Shows which repos need updates (ahead/behind indicators)
- **Full Git Workflow** - Complete Git operations without command line:
  - Clone repositories (with Azure PAT authentication)
  - Pull/Push operations
  - File staging/unstaging
  - Commit with message validation (min 10 chars)
  - Branch management (create, switch, view)
  - Commit history viewer
- **IDE Integration** - Open repositories in VS Code with one click

## Configuration

### Settings Storage

- **Application Settings** - Stored in SQLite database (`qa-hub.db` in app userData directory)
  - Default workspace path
  - Local repository paths
  - Correlation data
  - Triage metadata
  - Workflow logs

- **Integration Credentials** - Stored using `electron-store` (OS-backed encryption)
  - BrowserStack Automate (username, access key)
  - BrowserStack Test Management (token)
  - Jira (base URL, email, API token)
  - Azure DevOps (organization, project, PAT)

### First-Time Setup

1. Configure Azure DevOps in Settings:
   - Organization (e.g., `fourhands`)
   - Project (e.g., `QA Automation`)
   - Personal Access Token (PAT) with Git read/write permissions
   - Add repositories (default: "Web Workspace" repo is pre-configured)

2. Default workspace is automatically created at `~/Documents/QA-Studio-Workspace`

3. Clone repositories using the "Clone" button - they'll be saved to the default workspace

4. The app will automatically detect all cloned repos on next startup

See [DEV SETUP](./docs/DEV_SETUP.md) for detailed setup instructions.

