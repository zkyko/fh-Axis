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

Purpose: repository management, commit tracking, code correlation, and **remote test execution**

**Important**: 
- QA Hub does NOT write or generate test scripts. Your team writes test scripts (for D365, web, etc.) using their preferred tools.
- QA Hub **CAN upload test scripts** - You can push test scripts (that your team has written) to Azure DevOps repositories using Git operations.
- QA Hub does NOT configure pipelines. Pipeline setup is done in Azure DevOps.
- QA Hub **CAN trigger pipeline executions** - You can execute test runs from QA Hub, which triggers Azure DevOps pipelines that run your test scripts on BrowserStack Automate.

### Implemented Features

- **Repository Management**
  - List repositories from Azure DevOps projects
  - Parse repository URLs (supports both `dev.azure.com` and `visualstudio.com` formats)
  - Support for multiple repositories per workspace
  - Default repository configuration (e.g., "Web Workspace")
  - Manage test script repositories that your team has already created

- **Commit Tracking**
  - Fetch commits from Azure Repos
  - Get commit details by hash
  - Branch information retrieval
  - Link commits to test results via correlation engine

- **Authentication**
  - Personal Access Token (PAT) based authentication
  - Secure token storage in main process
  - Automatic token injection for Git operations

- **Git Operations (Test Script Upload & Management)**
  - Clone test script repositories to default workspace
  - Pull latest changes from test script repositories
  - **Push test scripts to Azure DevOps** - Upload test scripts to remote repositories (stage, commit, push workflow)
  - Full Git workflow management (stage, unstage, commit) for managing test scripts
  - Pre-push safety checks (protected branch enforcement, commit message validation, branch naming rules)
  - Branch management (create, switch branches with `qa/` prefix enforcement)

- **Pipeline Execution (Remote Test Triggering)**
  - List available pipelines in Azure DevOps project
  - Trigger pipeline runs remotely with execution parameters:
    - **TEST_SCOPE**: Execution scope (`all`, `file`, `tag`, `grep`)
    - **TEST_FILE**: Specific test file path (when scope is `file`)
    - **TEST_TAG**: Test tag filter (when scope is `tag`)
    - **TEST_GREP**: Grep pattern filter (when scope is `grep`)
    - **ENV**: Environment variable (optional)
    - **CORRELATION_KEY**: Auto-generated key linking run to repo/branch/commit
  - Monitor pipeline run status and results
  - View pipeline run logs and build information
  - Automatic correlation of pipeline runs with test results and evidence

**How Remote Execution Works:**
1. Your team writes test scripts and stores them in Azure DevOps repositories
2. Pipelines are configured in Azure DevOps to run tests on BrowserStack Automate
3. QA Hub triggers pipeline runs with selected scope (all, file, tag, or grep)
4. Azure DevOps pipeline executes tests on BrowserStack Automate
5. QA Hub monitors the run and correlates results with evidence and commits

### Deep Links

- Repository URLs
- Commit links
- Branch links
- File path links (future)

### Pipeline Requirements

For QA Hub to trigger pipeline executions, your Azure DevOps pipelines must accept these template parameters:
- `TEST_SCOPE` - Execution scope (`all`, `file`, `tag`, `grep`)
- `TEST_FILE` - Test file path (when scope is `file`)
- `TEST_TAG` - Test tag (when scope is `tag`)
- `TEST_GREP` - Grep pattern (when scope is `grep`)
- `ENV` - Environment (optional)
- `TRIGGER_SOURCE` - Set to `qa-hub` to identify QA Hub-triggered runs
- `CORRELATION_KEY` - Format: `QAHub|adoRun=<RUN_ID>|repo=<REPO>|branch=<BRANCH>`

The pipeline should use the correlation key in BrowserStack build names to enable automatic correlation with test results.

### Optional (Future)

- Fetch build metadata (if needed to enrich runs)
- Work items / linking
- Pull request creation
- Branch protection rules

