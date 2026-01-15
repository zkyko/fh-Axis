# Dev Setup

## Prerequisites

- **Node.js LTS** (18+)
- **Git** installed (system git required for repo operations)
- **npm** or **yarn** package manager

## Tech Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool for renderer
- **TailwindCSS + DaisyUI** - Styling and components
- **Zustand** - State management
- **better-sqlite3** - Local database (SQLite)
- **electron-store** - Settings storage (OS-backed encryption)
- **axios** - HTTP client for API calls
- **child_process.exec** - Git operations (via execAsync)

## Project Structure

```
V2-Studio/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # Main entry point
│   │   ├── bridge.ts            # IPC handlers
│   │   ├── preload.ts           # Preload script
│   │   └── services/            # Backend services
│   │       ├── browserstack-automate.ts
│   │       ├── browserstack-tm.ts
│   │       ├── jira.ts
│   │       ├── azure-devops.ts  # Azure DevOps API client
│   │       ├── correlation-engine.ts
│   │       └── storage.ts       # SQLite database service
│   ├── types/                   # Shared TypeScript types
│   │   └── index.ts
│   └── ui/                      # React frontend
│       ├── src/
│       │   ├── components/      # UI components
│       │   ├── store/           # Zustand stores
│       │   ├── utils/           # Utilities
│       │   ├── ipc.ts           # IPC wrapper
│       │   ├── types/           # Type definitions
│       │   └── App.tsx          # Main app component
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       └── vite.config.ts
├── docs/                        # Documentation
└── package.json
```

## Installation

```bash
npm install
```

This will:
- Install all dependencies
- Run `electron-rebuild` to compile native modules (better-sqlite3)

## Development Scripts

```bash
# Start development (builds main process, starts Vite dev server, launches Electron)
npm run dev

# Build main process only
npm run build:main

# Build renderer only
npm run build:renderer

# Build everything for production
npm run build:app

# Create Windows installer
npm run build:win

# Run production build
npm start
```

## Local Configuration

### Database Storage

- **Location**: `{app.getPath('userData')}/qa-hub.db`
- **Tables**:
  - `correlations` - Links between test results, sessions, Jira issues, and Azure commits
  - `triage_metadata` - Workflow annotations (assignments, labels, notes)
  - `workflow_log` - Audit log of user actions
  - `local_repo_paths` - Tracks cloned repository paths
  - `app_settings` - Application settings (default workspace path)

### Settings Storage

- **Location**: OS-specific encrypted store (via `electron-store`)
- **Stores**:
  - BrowserStack Automate credentials
  - BrowserStack TM credentials
  - Jira credentials
  - Azure DevOps credentials (organization, project, PAT)

### Default Workspace

- **Default Location**: `~/Documents/QA-Studio-Workspace`
- **Auto-created**: On first repository clone
- **Stored in**: Database (`app_settings` table)
- **Configurable**: Via IPC handlers (future: Settings UI)

## Development Rules

### Security

- ✅ **No secrets in renderer** - All credentials stored in main process only
- ✅ **All API calls from main** - Renderer communicates via IPC
- ✅ **All filesystem/git from main** - No direct file system access from renderer
- ✅ **OS-backed encryption** - Integration secrets use `electron-store`

### IPC Communication

- All external API calls go through IPC handlers in `src/main/bridge.ts`
- Renderer uses typed wrappers in `src/ui/src/ipc.ts`
- Preload script exposes safe API in `src/main/preload.ts`

### Git Operations

- All Git operations use `child_process.exec` in main process
- Azure PAT is injected into Git URLs for authentication
- Default workspace is used for clones unless user specifies otherwise

### Database

- SQLite database is lazily initialized (after Electron app is ready)
- All database operations are synchronous (better-sqlite3)
- Migrations are handled via try-catch on ALTER TABLE statements

## Environment Variables

- `NODE_ENV=development` - Development mode
- `ELECTRON_IS_DEV=1` - Explicit dev mode flag
- `app.isPackaged` - Electron API to detect production build

## Troubleshooting

### Native Module Issues

If `better-sqlite3` fails to load:
```bash
npx electron-rebuild
```

### Git Not Found

Ensure Git is installed and available in PATH:
```bash
git --version
```

### Database Locked

If you see database locked errors:
- Close all instances of the app
- Check if another process is accessing `qa-hub.db`
- Delete the database file to reset (will be recreated)

### Vite Dev Server Not Starting

Check that port 5173 is available:
```bash
lsof -i :5173
```

