# IPC Contract (Renderer ↔ Main)

## Rule

Renderer never talks to external APIs or filesystem directly.

All calls go through IPC, with permission checks in main.

## Namespaces

### auth/*

- auth.getCurrentUser()

- auth.logout()

### workspace/*

- workspace.list()

- workspace.open(workspaceId)

- workspace.getActive()

### integrations/*

- integrations.testConnection(type)

- integrations.saveCredentials(type, payload)  (QA_ADMIN only)

- integrations.getStatus()

### bsAutomate/*

- bsAutomate.listBuilds(params)

- bsAutomate.getBuild(buildId)

- bsAutomate.listSessions(buildId)

- bsAutomate.getSession(sessionId)

- bsAutomate.getArtifacts(sessionId)

### bsTM/*

- bsTM.listProjects()

- bsTM.listRuns(projectId, filters)

- bsTM.getRun(runId)

- bsTM.listResults(runId)

- bsTM.listCases(projectId, filters)

### jira/*

- jira.searchIssues(jql)

- jira.createIssue(payload)

- jira.linkIssue(entityRef, issueKey)

### repo/*  (QA-only)

#### Repository Detection & Management

- `repo:detect-all-cloned` - Detect all previously cloned repositories and their sync status
- `repo:get-local-path(repoId?, repoName?)` - Get local path for a repository
- `repo:get-default-workspace` - Get default workspace directory path
- `repo:set-default-workspace(workspacePath)` - Set default workspace directory

#### Git Operations

- `repo:git-status(repoRoot)` - Get detailed git status (staged, unstaged, untracked, branch, ahead/behind)
- `repo:clone(repoUrl, targetDir?, repoName?, repoId?)` - Clone repository (uses default workspace if targetDir not provided)
- `repo:pull(repoRoot)` - Pull latest changes from remote
- `repo:push(repoRoot, branch?)` - Push commits to remote (with validation)
- `repo:stage-file(repoRoot, filePath)` - Stage a single file
- `repo:unstage-file(repoRoot, filePath)` - Unstage a single file
- `repo:stage-all(repoRoot)` - Stage all changes
- `repo:commit(repoRoot, message)` - Commit staged changes (with message validation)

#### Branch Management

- `repo:get-branches(repoRoot)` - Get all local and remote branches
- `repo:create-branch(repoRoot, branchName)` - Create and checkout new branch
- `repo:switch-branch(repoRoot, branchName)` - Switch to existing branch (with uncommitted changes check)

#### History & Navigation

- `repo:get-commit-history(repoRoot, limit?)` - Get commit history
- `repo:open-vscode(repoRoot)` - Open repository in VS Code
- `repo:select-directory()` - Show directory picker dialog

#### Templates (Future)

- `repo:create-template(repoRoot, templateId, params)` - Create test from template

### azure/*

#### Azure DevOps Integration

- `azure:parse-repo-url(url)` - Parse Azure DevOps repository URL
- `azure:test-connection()` - Test Azure DevOps connection
- `azure:get-repos()` - Get all repositories from configured project
- `azure:get-repo-by-name(repoName)` - Get repository by name
- `azure:get-commits(repoId, branch, limit?)` - Get commits from repository
- `azure:get-commit(repoId, commitHash)` - Get commit details
- `azure:get-branch-info(repoId, branch)` - Get branch information

### workflow/*

- workflow.setLabel(entityRef, label)

- workflow.assign(entityRef, userId)

- workflow.addComment(entityRef, text)

- workflow.getAnnotations(entityRef)

## Permission enforcement

Main process must validate role on each call.

