# Integrations

## 1. BrowserStack Automate

Purpose: execution evidence (builds/sessions/artifacts)

### Data we need

- builds list + details

- sessions list + details

- artifacts links:

  - video

  - console logs

  - network logs (HAR)

  - screenshots (if available)

### Notes

- Use one workspace-level integration identity.

- Store auth in main process only.

## 2. BrowserStack Test Management (TM)

Purpose: planning + runs + results

### Data we need

- projects

- test cases

- test plans (optional v1)

- test runs

- test results (read + optional write)

### Write capabilities (v1 optional)

- create run

- add results to run

- update statuses if supported

## 3. Jira

Purpose: defects

### Must-have

- search issues (JQL)

- create issue

- link issue to failure narrative

- display status/assignee/priority

### Optional

- add comments from app

- attach evidence (or store links in description)

## 4. Azure DevOps

Purpose: repository management, commit tracking, and code correlation

### Implemented Features

- **Repository Management**
  - List repositories from Azure DevOps projects
  - Parse repository URLs (supports both `dev.azure.com` and `visualstudio.com` formats)
  - Support for multiple repositories per workspace
  - Default repository configuration (e.g., "Web Workspace")

- **Commit Tracking**
  - Fetch commits from Azure Repos
  - Get commit details by hash
  - Branch information retrieval
  - Link commits to test results via correlation engine

- **Authentication**
  - Personal Access Token (PAT) based authentication
  - Secure token storage in main process
  - Automatic token injection for Git operations

- **Git Operations**
  - Clone repositories to default workspace
  - Pull latest changes
  - Push commits to remote
  - Full Git workflow management (stage, unstage, commit)

### Deep Links

- Repository URLs
- Commit links
- Branch links
- File path links (future)

### Optional (Future)

- Fetch build metadata (if needed to enrich runs)
- Work items / linking
- Pull request creation
- Branch protection rules

