---
slug: /
---

# Introduction

## What is QA Hub?

QA Hub is a desktop application that provides **unified test execution, failure analysis, and defect tracking** for QA and Development teams. It helps teams triage failures, correlate evidence, and manage workflows across multiple tools.

QA Hub is an Electron desktop application that serves as a central hub for:

- **BrowserStack Automate** - View builds, sessions, and execution evidence
- **BrowserStack Test Management (TM)** - Manage test cases, runs, and results
- **Jira** - Create and link defects to test failures
- **Azure DevOps** - Repository management, commit tracking, and code correlation

## Key Capabilities

QA Hub provides a structured workflow for QA teams:

1. **Trigger test executions** - Execute test runs remotely via Azure DevOps pipelines (tests run on BrowserStack Automate)
2. **View test executions** - View builds, sessions, and execution evidence from BrowserStack Automate
3. **Manage test cases and runs** - Manage test cases and runs from BrowserStack Test Management
4. **Create and link Jira defects** - Create and link defects to test failures with structured, evidence-driven bug creation
5. **Manage repositories** - Perform Git operations (clone, pull, push, commit) on test script repositories
6. **Correlate test results** - Link test results with evidence, commits, and issues

## Core Philosophy

QA Hub is designed to **force structure in QA workflows**. Rather than just running tests, QA Hub enforces a structured approach: **understand failures → capture evidence → create actionable defects**. This ensures every test failure is properly analyzed, documented, and tracked through to resolution.

## What QA Hub DOES

QA Hub provides the following capabilities with their underlying logic:

### ✅ **Trigger Remote Pipeline Execution**

**How it works:**
1. **Pipeline Selection** - QA Hub lists available Azure DevOps pipelines from your configured project
2. **Execution Scope Configuration** - You select how to execute tests:
   - **All tests** - Run all tests in the repository
   - **Specific file** - Run tests in a selected test file
   - **Tag-based** - Run tests matching a specific tag
   - **Grep pattern** - Run tests matching a grep pattern
3. **Correlation Key Generation** - QA Hub automatically generates a correlation key (`QAHub|adoRun=<RUN_ID>|repo=<REPO>|branch=<BRANCH>`) that links the pipeline run to:
   - The Azure DevOps run ID
   - The repository name
   - The branch being tested
4. **Pipeline Trigger** - QA Hub sends execution parameters to Azure DevOps API:
   - `TEST_SCOPE` - The execution scope (all/file/tag/grep)
   - `TEST_FILE` / `TEST_TAG` / `TEST_GREP` - Scope-specific parameters
   - `ENV` - Optional environment variable
   - `TRIGGER_SOURCE` - Set to `qa-hub` to identify QA Hub-triggered runs
   - `CORRELATION_KEY` - The generated correlation key
5. **Run Monitoring** - QA Hub polls Azure DevOps every 10 seconds to track run status (queued → running → completed/failed)
6. **Automatic Correlation** - Once the pipeline completes, QA Hub:
   - Searches BrowserStack Automate for builds matching the correlation key
   - Links test results to BrowserStack sessions and evidence
   - Correlates with commits and branches

**Result**: Your test scripts (already stored in Azure DevOps) are executed remotely on BrowserStack Automate via the triggered pipeline, and QA Hub automatically tracks and correlates the results.

### ✅ **BrowserStack Automate Integration**

**How it works:**
1. **Authentication** - Uses BrowserStack username and access key (stored securely in main process)
2. **Project Discovery** - Fetches builds from BrowserStack API and extracts unique projects (BrowserStack doesn't have a direct projects endpoint)
3. **Build & Session Fetching** - Retrieves builds and sessions for selected projects with pagination support
4. **Evidence Collection** - Fetches execution artifacts:
   - Video recordings
   - Console logs
   - Network logs (HAR)
   - Screenshots
   - Session details (browser, OS, device capabilities)
5. **Correlation Logic** - Links BrowserStack sessions to test results by:
   - Checking correlation keys in build names (matches `QAHub|adoRun=...` pattern)
   - Using stored correlation mappings from database
   - Matching session metadata with test result identifiers
6. **Real-time Updates** - Background polling automatically discovers new builds and sessions that match correlation keys from active pipeline runs

**Result**: QA Hub provides a unified view of test execution evidence from BrowserStack Automate, automatically linked to pipeline runs and test results.

### ✅ **BrowserStack Test Management (TM) Integration**

**How it works:**
1. **Authentication** - Uses BrowserStack TM credentials (can be same as Automate)
2. **Project & Test Case Fetching** - Retrieves projects, test cases, test runs, and results
3. **Test Mapping** - Links test cases to test files in repositories
4. **Result Correlation** - Correlates TM test results with:
   - BrowserStack Automate sessions (execution evidence)
   - Jira issues (defects)
   - Azure commits (code changes)

**Result**: QA Hub bridges the gap between test planning (TM) and test execution (Automate), providing end-to-end visibility.

### ✅ **Jira Integration**

**How it works:**
1. **Authentication** - Uses Jira base URL, email, and API token (stored securely)
2. **Issue Search** - Performs JQL (Jira Query Language) searches to find existing issues
3. **Structured Bug Creation** - When creating defects from test failures:
   - **Failure Context Building** - QA Hub builds a comprehensive failure context including:
     - Test information (name, project, run details)
     - Execution evidence links (BrowserStack session, videos, logs)
     - Error details (message, stack trace if available)
     - Correlation data (related commits, branches)
   - **Description Formatting** - Converts plain text descriptions to Jira ADF (Atlassian Document Format):
     - Headings (`##`) become heading nodes
     - URLs become clickable links
     - Paragraphs are properly structured
   - **Auto-generated Content** - Creates structured summaries and descriptions with evidence links
4. **Issue Linking** - Automatically links created issues to test results in QA Hub's database for future correlation
5. **Status Tracking** - Fetches and displays issue status, assignee, and priority

**Result**: QA Hub creates well-structured, evidence-rich Jira defects automatically, ensuring every test failure is properly documented and tracked.

### ✅ **Azure DevOps Repository Management**

**How it works:**
1. **Repository Discovery** - Lists repositories from Azure DevOps projects using PAT authentication
2. **Git Operations** - Performs Git operations (clone, pull, push, commit, branch management) using system Git
3. **Commit Tracking** - Fetches commit history and details, linking commits to test results
4. **Correlation** - Uses commit hashes and branch information to correlate code changes with test failures

**Result**: QA Hub helps manage test script repositories and provides traceability between code changes and test results.

## What QA Hub Does NOT Do

It's important to understand what QA Hub is **not**:

- ❌ **Not a test script generator** - QA Hub does NOT generate or create test scripts. Your team writes test scripts manually (e.g., for D365 and web applications) using their preferred tools and frameworks.
- ❌ **Not a test runner** - QA Hub does not execute tests locally
- ❌ **Not a Playwright wrapper** - QA Hub does not wrap or generate Playwright code
- ❌ **Not a local test runner** - QA Hub does not execute tests locally on your machine
- ❌ **Not a pipeline upload tool** - QA Hub does not upload test scripts to Azure DevOps pipelines. Your team manages test scripts in Azure DevOps repositories and uploads them to pipelines through Azure DevOps.
- ❌ **Not a complete replacement** for BrowserStack UI when API gaps exist

**Test Script Workflow:**
- Your team **codes test scripts** for D365 and web applications
- Test scripts are **stored in Azure DevOps repositories** (managed through Azure DevOps)
- Test scripts are **configured in Azure DevOps pipelines** (pipeline setup done in Azure DevOps)
- QA Hub **triggers pipeline executions** remotely - you can execute test runs from QA Hub, which triggers Azure DevOps pipelines that run tests on BrowserStack Automate
- QA Hub helps **organize and manage the workflow** around test execution:
  - **Remote execution**: Trigger pipeline runs with different scopes (all tests, specific file, tag, or grep pattern)
  - **Git operations**: Push, pull, commit test scripts in repositories
  - **Repository management**: Organize and track test script repositories
  - **Workflow organization**: Manage the workflow around test execution and failure analysis

**Execution Model:** QA Hub triggers remote execution via Azure DevOps pipelines. The pipelines run tests on BrowserStack Automate (not locally). QA Hub is a **triage, workflow management, and remote execution control tool**, not a local test runner or test script generator.

## Integrations

### BrowserStack Automate

- View builds and sessions
- Access execution artifacts (videos, logs, screenshots)
- Link sessions to test failures

### BrowserStack Test Management

- View projects, test cases, and test runs
- View test results and statuses
- Correlate results with execution evidence

### Jira

- Search for existing issues
- Create new defects with structured, evidence-driven content
- Link issues to test failures and execution evidence
- View issue status, assignee, and priority

### Azure DevOps

- **Repository management** - Clone, pull, push test script repositories
- **Git workflow operations** - Stage, commit, and manage branches for test scripts
- **Commit tracking** - Track commits and correlate with test results
- **Pipeline execution** - **Trigger and execute pipeline runs remotely** with different scopes:
  - Execute all tests
  - Execute tests in a specific file
  - Execute tests matching a tag
  - Execute tests matching a grep pattern
- **Pipeline monitoring** - View pipeline run status, logs, and build information

**Important**: 
- QA Hub does NOT write or generate test scripts. Your team writes test scripts (for D365, web, etc.) and stores them in Azure DevOps repositories.
- QA Hub does NOT configure pipelines. Pipeline setup and configuration is done in Azure DevOps.
- QA Hub **CAN trigger pipeline executions** - You can execute test runs from QA Hub, which triggers Azure DevOps pipelines that run your test scripts on BrowserStack Automate.
- QA Hub helps organize the workflow around test execution and correlates test execution results with commits and branches.

## Workflows

QA Hub supports the following key workflows:

1. **Remote Test Execution → Failure Analysis → Defect Tracking** - Trigger test runs via Azure DevOps pipelines, analyze failures, and create defects
2. **Repository Management → Test Execution** - Manage test script repositories, trigger pipeline executions with different scopes
3. **Failure Analysis** - View execution evidence, correlate with code changes, and create actionable defects
4. **Triage Workflow** - Assign, label, and comment on failures
5. **Correlation** - Link test results to sessions, Jira issues, and Azure commits

## Target Users

### QA Engineers

- **Trigger test executions** - Execute test runs remotely via Azure DevOps pipelines (select scope: all, file, tag, or grep)
- **Manage test script repositories** - Use Git operations (push, pull, commit) to organize test scripts that your team has already written
- **Organize workflow** - Manage the workflow around test execution, failure analysis, and defect tracking
- **Map tests to BrowserStack TM cases** - Link existing test scripts to BrowserStack Test Management cases
- **Triage failures** - Analyze test failures, label, and create/link Jira defects

**Note**: QA Hub does NOT generate test scripts. Your team writes test scripts (for D365, web, etc.) and stores them in Azure DevOps repositories. QA Hub can trigger pipeline executions to run those test scripts remotely on BrowserStack Automate.

### Developers

- Find root cause quickly with build context and failure signatures
- Access BrowserStack video/logs/HAR evidence
- View linked Jira tickets and status
- Comment and collaborate on failures

