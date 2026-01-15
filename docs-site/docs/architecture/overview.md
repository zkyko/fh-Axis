# Architecture Overview

## High-Level Architecture

QA Hub is built as an **Electron application** with clear boundaries between the renderer (UI) and main process (backend).

## Process Separation

### Renderer Process (React UI)

The renderer process contains:
- **Pages and components** - React-based UI
- **View models and state management** - Zustand stores
- **No secrets** - Credentials never touch the renderer
- **No direct access** to:
  - OS-level APIs
  - Git operations
  - Filesystem operations (beyond user-initiated file dialogs)
  - External API calls (BrowserStack, Jira, Azure DevOps)

The renderer communicates with the main process via **IPC (Inter-Process Communication)** channels.

### Main Process (Trusted Backend)

The main process contains:
- **Integration services** - BrowserStack, Jira, Azure DevOps clients
- **Git operations** - Repository management, commits, branches
- **Filesystem operations** - Workspace management, file reading
- **Token storage and encryption** - Secure credential storage using OS-backed encryption
- **Background sync jobs** - Lightweight polling for updates

### Storage

QA Hub uses two storage mechanisms:

1. **SQLite Database** (`better-sqlite3`)
   - Local repository paths
   - Correlation data
   - Triage metadata
   - Workflow logs

2. **Electron Store** (OS-backed encryption)
   - Integration credentials (BrowserStack, Jira, Azure DevOps)
   - Application settings

## Services Pattern

The main process is organized around **service classes**:

- **BrowserStackAutomateService** - Fetches builds, sessions, and artifacts
- **BrowserStackTMService** - Fetches projects, runs, and test results
- **JiraService** - Creates, searches, and links issues
- **AzureDevOpsService** - Repository and commit management
- **AzurePipelinesService** - Pipeline runs and status
- **StorageService** - Database operations
- **CorrelationEngine** - Links test results to evidence and issues
- **WorkspaceService** - Manages the default workspace directory
- **RepoDiscoveryService** - Scans and detects cloned repositories
- **TestDiscoveryService** - Discovers test files in repositories
- **UpdaterService** - Handles application updates

## Why IPC Exists

IPC (Inter-Process Communication) is necessary because:

1. **Security** - The renderer process runs in a sandboxed environment and cannot access Node.js APIs directly
2. **Separation of concerns** - UI logic is separate from backend logic
3. **Resource management** - Main process manages system resources (network, filesystem, etc.)
4. **Credential protection** - Secrets remain in the main process

All communication between renderer and main process flows through IPC channels defined in:
- `src/main/bridge.ts` - IPC handlers (main process)
- `src/main/preload.ts` - IPC exposure (preload script)
- `src/ui/src/ipc.ts` - Type-safe IPC wrapper (renderer)

## Data Flow

1. **User interacts with UI** (renderer process)
2. **UI calls IPC method** (via `ipc` wrapper)
3. **Preload script forwards** to main process
4. **Main process handler** executes (bridge.ts)
5. **Service performs operation** (e.g., BrowserStack API call)
6. **Response flows back** through IPC
7. **UI updates** with results

For events (like updater progress), the flow is:
1. **Main process emits event** (service)
2. **Event forwarded via webContents.send** (bridge.ts)
3. **Preload script receives** via ipcRenderer.on
4. **Renderer subscribes** to events via exposed API
5. **UI updates** reactively

## Directory Structure

```
src/
├── main/                    # Electron main process
│   ├── index.ts            # Application entry point
│   ├── bridge.ts           # IPC handlers
│   ├── preload.ts          # Preload script (IPC exposure)
│   ├── services/           # Backend services
│   └── types.ts            # TypeScript types
├── ui/                     # React frontend
│   └── src/
│       ├── components/     # UI components
│       ├── store/          # Zustand state stores
│       ├── ipc.ts          # Type-safe IPC wrapper
│       └── types/          # TypeScript type definitions
└── shared/                 # Shared types (if needed)
```

## Security Considerations

- **Context isolation** is enabled (renderer cannot access Node.js)
- **Node integration** is disabled in renderer
- **Secrets stored securely** using OS-backed encryption (electron-store)
- **IPC channels** are explicitly defined (no wildcard access)
- **Preload script** acts as a controlled bridge between processes

## Key Design Decisions

1. **Service-oriented architecture** - Each integration/functionality is a service
2. **Lazy initialization** - Services are initialized when needed
3. **Type-safe IPC** - TypeScript ensures IPC contract correctness
4. **Event-driven updates** - Real-time updates via IPC events
5. **SQLite for structured data** - Simple, reliable local database
6. **Electron Store for credentials** - OS-backed secure storage

