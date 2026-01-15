# UI Screens (MVP)

## Global

- Workspace selector

- Universal search (build id, jira key, test name, signature)

## 1) Runs

List of recent runs (from TM, optionally enriched)

Filters:

- status, date range, branch, environment

## 2) Run Detail

- run header: status, times, branch/commit, links

- failing tests list

- failure clusters by signature

## 3) Failure Detail (most important)

Layout:

- Left: error + stack excerpt + history trend

- Middle: BrowserStack session evidence

  - video

  - console logs

  - network HAR link

- Right: Jira panel

  - linked issue

  - create/link issue

  - status, assignee

Actions:

- set triage label (product/test/infra/flaky)

- assign owner

- add comment

## 4) Cases (TM)

- list cases

- open case detail

- see execution history

- mapping indicator to file path (if configured)

## 5) Repo Companion (QA-only)

### Repository Management

- **Detected Repositories Section**
  - Auto-detects all cloned repositories on app startup
  - Shows sync status for each repo:
    - "X behind" (warning) - needs pull
    - "X ahead" (info) - has unpushed commits
    - "Up to date" (success) - synced
  - Click to load repository
  - Refresh button to re-scan

- **Repository List**
  - Shows configured Azure DevOps repositories
  - Clone button for each repo
  - Default workspace directory display
  - Recent commits from Azure DevOps

### Git Workflow Management

- **Branch Management**
  - View all local branches
  - Current branch indicator
  - Create new branch (with validation)
  - Switch branches (with uncommitted changes protection)
  - Ahead/behind indicators

- **File Staging**
  - **Staged Changes** section (green) - files ready to commit
  - **Unstaged Changes** section (yellow) - modified files
  - **Untracked Files** section (blue) - new files
  - Individual stage/unstage buttons per file
  - "Stage All" button for bulk operations

- **Commit Workflow**
  - Commit message input with validation:
    - Minimum 10 characters required
    - Real-time character count
    - Cannot commit without staged files
  - Commit button (disabled until valid)
  - Success/error feedback

- **Push/Pull Operations**
  - Pull button (with status refresh)
  - Push button (validates commits exist)
  - Status messages for all operations

- **Commit History**
  - Toggle to show/hide recent commits
  - Shows last 10 commits with:
    - Commit hash (short)
    - Author name
    - Commit date
    - Commit message

### Local Repository Info

- **Local Path Display**
  - Shows full local repository path
  - "Open in VS Code" button
  - Monospace font for readability

- **Git Status**
  - Current branch name
  - Ahead/behind counts
  - File change summary
  - Clean working directory indicator

### Default Workspace

- Default location: `~/Documents/QA-Hub-Workspace`
- Auto-created on first use
- All clones go here by default (unless user selects different location)
- Stored in database for persistence

## 6) Admin (QA_ADMIN only)

- configure integrations

- configure repo roots

- configure correlation rules (naming conventions)

- manage roles

