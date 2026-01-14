# IPC Contract

## Overview

Axis uses **IPC (Inter-Process Communication)** to enable secure communication between the renderer (UI) and main process (backend). All IPC channels are explicitly defined and type-safe.

## IPC Channels

### BrowserStack Automate

- `bs-automate:get-projects` - Get list of projects
- `bs-automate:get-builds` - Get builds for a project
- `bs-automate:get-sessions` - Get sessions for a build
- `bs-automate:get-session-details` - Get detailed session information

### BrowserStack Test Management

- `bs-tm:get-projects` - Get list of TM projects
- `bs-tm:get-runs` - Get test runs for a project
- `bs-tm:get-results` - Get results for a test run
- `bs-tm:get-test-cases` - Get test cases for a project
- `bs-tm:create-test-case` - Create a new test case
- `bs-tm:update-test-case` - Update an existing test case
- `bs-tm:delete-test-case` - Delete a test case
- `bs-tm:bulk-update-test-cases` - Bulk update test cases
- `bs-tm:bulk-delete-test-cases` - Bulk delete test cases
- `bs-tm:get-test-case-history` - Get history for a test case
- `bs-tm:export-bdd-test-cases` - Export test cases as BDD
- `bs-tm:get-export-status` - Get export status
- `bs-tm:download-export` - Download exported test cases

### Jira

- `jira:test-connection` - Test Jira connection
- `jira:create-issue` - Create a new Jira issue
- `jira:get-issue` - Get issue details
- `jira:search-issues` - Search issues using JQL
- `jira:link-test-result` - Link a test result to a Jira issue
- `jira:prepare-bug-draft` - Prepare a bug draft from failure context
- `jira:create-issue-from-draft` - Create issue from prepared draft

### Azure DevOps

- `azure:parse-repo-url` - Parse Azure DevOps repository URL
- `azure:test-connection` - Test Azure DevOps connection
- `azure:get-repos` - Get list of repositories
- `azure:get-repo-by-name` - Get repository by name
- `azure:get-commits` - Get commits for a repository/branch
- `azure:get-commit` - Get commit details by hash
- `azure:get-branch-info` - Get branch information

### Azure Pipelines

- `azurePipelines:list` - List pipelines
- `azurePipelines:getPipeline` - Get pipeline details
- `azurePipelines:run` - Trigger a pipeline run
- `azurePipelines:getRun` - Get pipeline run details
- `azurePipelines:listRuns` - List pipeline runs

### Repository Operations

- `repo:git-status` - Get Git status for a repository
- `repo:clone` - Clone a repository
- `repo:pull` - Pull latest changes
- `repo:push` - Push commits to remote
- `repo:stage-file` - Stage a file
- `repo:unstage-file` - Unstage a file
- `repo:stage-all` - Stage all changes
- `repo:commit` - Create a commit
- `repo:get-branches` - Get branch list
- `repo:create-branch` - Create a new branch
- `repo:switch-branch` - Switch to a branch
- `repo:get-commit-history` - Get commit history
- `repo:list-test-files` - List test files in repository
- `repo:read-file` - Read file contents
- `repo:open-vscode` - Open repository in VS Code
- `repo:select-directory` - Select directory dialog
- `repo:get-local-path` - Get local repository path
- `repo:get-default-workspace` - Get default workspace path
- `repo:set-default-workspace` - Set default workspace path
- `repo:detect-all-cloned` - Detect all cloned repositories

### Settings

- `settings:get` - Get settings (all or by key)
- `settings:set` - Set a setting
- `settings:test-bs-automate` - Test BrowserStack Automate connection
- `settings:test-bs-tm` - Test BrowserStack TM connection
- `settings:test-jira` - Test Jira connection
- `settings:test-azure` - Test Azure DevOps connection

### Correlation

- `correlation:correlate` - Correlate test result with evidence
- `correlation:find-session` - Find session for test result
- `correlation:find-jira` - Find Jira issue for test result

### Triage

- `triage:save-metadata` - Save triage metadata
- `triage:get-metadata` - Get triage metadata

### Runs

- `runs:get` - Get run details
- `runs:getActive` - Get active runs
- `runs:getAll` - Get all runs
- `runs:updateStatus` - Update run status

### Rerun History

- `rerun:saveLink` - Save rerun link
- `rerun:getHistory` - Get rerun history
- `rerun:getByErrorSignature` - Get reruns by error signature

### Updater

- `updater:check` - Check for updates
- `updater:download` - Download update
- `updater:install` - Install update (restarts app)
- `app:getVersion` - Get application version

### Updater Events

- `updater:event` - Event stream for updater status (checking, available, downloading, downloaded, error)

## Implementation Details

### Main Process (bridge.ts)

IPC handlers are defined in `src/main/bridge.ts` using `ipcMain.handle()`:

```typescript
ipcMain.handle('channel-name', async (event, ...args) => {
  // Handler implementation
  return result;
});
```

### Preload Script (preload.ts)

The preload script exposes IPC channels to the renderer via `contextBridge.exposeInMainWorld()`:

```typescript
contextBridge.exposeInMainWorld('electronAPI', {
  'channel-name': (...args) => ipcRenderer.invoke('channel-name', ...args),
});
```

### Renderer (ipc.ts)

The renderer uses a type-safe wrapper in `src/ui/src/ipc.ts`:

```typescript
export const ipc = {
  channelName: (...args) => {
    const backend = getBackend();
    return backend?.['channel-name'](...args);
  },
};
```

## Event Handling

Some features use event-based communication (e.g., updater progress). Events are handled differently:

1. **Main process** emits events via `webContents.send()`
2. **Preload script** listens via `ipcRenderer.on()` and exposes to renderer
3. **Renderer** subscribes to events via exposed API

Example (updater events):
- Main: `mainWindow.webContents.send('updater:event', eventData)`
- Preload: `ipcRenderer.on('updater:event', (event, data) => callback(data))`
- Renderer: `window.updaterEvents.onEvent(callback)`

## Type Safety

All IPC channels are type-checked using TypeScript:
- `src/ui/src/types/electron.d.ts` - Defines the ElectronAPI interface
- `src/ui/src/ipc.ts` - Type-safe wrapper with proper return types
- `src/main/bridge.ts` - Handlers match the defined contract

## Security

- All IPC channels are **explicitly defined** - no wildcard access
- **Context isolation** prevents direct Node.js access from renderer
- **Preload script** acts as a controlled bridge
- **No secrets** are exposed to the renderer process

