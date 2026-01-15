# Roadmap

## ✅ Completed (v1.0)

### Azure DevOps Integration
- ✅ Repository listing and management
- ✅ Commit history and details
- ✅ Branch information
- ✅ URL parsing (multiple Azure DevOps formats)
- ✅ PAT-based authentication
- ✅ Multiple repository support

### Git Workflow Management
- ✅ Default workspace directory (`~/Documents/QA-Studio-Workspace`)
- ✅ Auto-detection of cloned repositories
- ✅ Sync status indicators (ahead/behind)
- ✅ Full Git operations (clone, pull, push)
- ✅ File staging/unstaging
- ✅ Commit with message validation
- ✅ Branch management (create, switch, view)
- ✅ Commit history viewer
- ✅ VS Code integration

### Repository Management
- ✅ Local repository path storage
- ✅ Persistent workspace configuration
- ✅ Auto-refresh on app startup
- ✅ Status badges for sync state

## 🚧 In Progress / Planned

## Phase 0: Foundation

- Electron app scaffold (main/renderer)

- IPC framework + permissions

- Workspace model + local storage

- HTTP client layer + logging

## Phase 1: BrowserStack Read

- Automate: builds/sessions/details

- TM: projects/runs/results

- Failure detail page with evidence links

## Phase 2: Jira Workflow

- search/create/link issue

- store links + annotations locally

- audit log

## Phase 3: Repo Companion ✅ COMPLETED

- ✅ detect repo (auto-detection on startup)
- ✅ git status + detailed file tracking (staged/unstaged/untracked)
- ✅ full git workflow (clone, pull, push, stage, commit)
- ✅ branch management (create, switch, view)
- ✅ commit history viewer
- ✅ open in VS Code
- ✅ default workspace management
- ✅ sync status indicators
- ⏳ templates for new test files (planned)
- ⏳ QA-only role enforcement (planned)

## Phase 4: Correlation + Intelligence

- signature clustering

- flakiness scoring

- better search

- optional TM writes (create run/add results) if needed

