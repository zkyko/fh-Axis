# QA Hub Application - Comprehensive Test Documentation

**Note**: This documentation is for **testing the QA Hub application itself**. It provides test cases and procedures for verifying that QA Hub works correctly. This is NOT documentation for using QA Hub to test other applications or systems.

## Table of Contents

1. [Introduction & Prerequisites](#introduction--prerequisites)
2. [Setup & Configuration Testing](#setup--configuration-testing)
3. [End-to-End Functional Test Cases](#end-to-end-functional-test-cases)
4. [Integration Testing](#integration-testing)
5. [UI/UX Testing](#uiux-testing)
6. [Data Validation Testing](#data-validation-testing)
7. [Edge Cases & Error Scenarios](#edge-cases--error-scenarios)
8. [Test Data Requirements](#test-data-requirements)

---

## Introduction & Prerequisites

**Purpose of This Document**: This document provides comprehensive test cases and procedures for **testing the QA Hub desktop application**. Use this document to verify that QA Hub's features, integrations, and workflows function correctly.

### What is QA Hub?

QA Hub is a desktop Electron application that provides unified test execution, failure analysis, and defect tracking. It integrates with BrowserStack Automate, BrowserStack Test Management, Jira, and Azure DevOps to help QA and Development teams triage failures, correlate evidence, and manage workflows.

**Core Philosophy**: QA Hub is designed as a system that forces structure in QA workflows. Rather than just running tests, QA Hub enforces a structured approach: **understand failures → capture evidence → create actionable defects**. This ensures every test failure is properly analyzed, documented, and tracked through to resolution.

**Key Capabilities:**
- View and analyze test executions from BrowserStack Automate
- Manage test cases and runs from BrowserStack Test Management
- Create and link Jira defects to test failures (with structured, evidence-driven bug creation)
- Manage repositories and perform Git operations
- Correlate test results with evidence, commits, and issues

### System Requirements

- **Operating System**: Windows, macOS, or Linux
- **Node.js**: Not required for compiled application (only for development)
- **Git**: Must be installed and available in system PATH (for repository operations)
- **Internet Connection**: Required for API integrations
- **Disk Space**: ~500MB for application and data storage

### Prerequisites for Testing QA Hub

Before testing the QA Hub application, you should have access to:

1. **BrowserStack Account**
   - BrowserStack Automate account with username and access key
   - BrowserStack Test Management account (can use same credentials as Automate)
   - At least one project with test builds/sessions
   - At least one TM project with test cases/runs

2. **Jira Account**
   - Jira instance URL (e.g., `https://your-company.atlassian.net`)
   - Email address associated with Jira account
   - API Token (generate from Jira account settings)
   - Access to at least one project for creating/linking issues

3. **Azure DevOps Account**
   - Organization name
   - Project name
   - Personal Access Token (PAT) with Git read/write permissions
   - At least one repository for testing Git operations

4. **VS Code** (Optional but Recommended)
   - For testing IDE integration features

---

## Quick Start for Testing QA Hub

**Welcome!** This guide will help you **test the QA Hub application** systematically. Follow these steps to get started:

**Important**: You are testing QA Hub itself, not using QA Hub to test other applications.

### Step 1: Install and Launch

1. **Install the Application**
   - Install the provided executable file
   - Ensure Git is installed on your system (required for repository operations)
   - Launch the QA Hub application

2. **First Launch Verification**
   - Application should open without errors
   - Dashboard should be displayed
   - Sidebar navigation should be visible

### Step 2: Configure Integrations

Before testing features, you'll need to configure integrations in Settings:

1. Navigate to **Settings** (sidebar → TOOLS section)
2. Configure each integration:
   - **Azure DevOps**: Organization, Project, and PAT
   - **BrowserStack Automate**: Credentials (may be pre-configured)
   - **BrowserStack TM**: Credentials (may be pre-configured)
   - **Jira**: Base URL, Email, and API Token
3. Test each connection to verify credentials work

### Step 3: Testing Approach

**Recommended Testing Order:**

1. **Start with Setup & Configuration** (Test Cases 1.1 - 1.8)
   - Verify app launches correctly
   - Configure all integrations
   - Verify settings are saved

2. **Core Functionality** (Workflows 1-5)
   - View test execution data
   - Analyze failures
   - Create Jira bugs
   - Test repository management
   - Verify correlations

3. **Integration Testing** (Test Cases 7.1 - 7.5)
   - Verify all APIs connect successfully
   - Test database operations

4. **UI/UX and Edge Cases** (Test Cases 8.1 - 10.8)
   - Test user experience
   - Verify error handling

### Step 4: Document Your Findings

As you test, use the **Test Execution Checklist** at the end of this document to track your progress. For any issues found:

- Reference the specific test case number
- Document steps to reproduce
- Note expected vs. actual results
- Take screenshots if applicable
- Report using the format in the "Reporting Issues" section

### Additional Resources

**Documentation Site**: [Link to Docusaurus documentation site - provided separately]

**Key Documentation Topics:**
- **Architecture**: System design, main/renderer separation, services
- **Integrations**: BrowserStack Automate, BrowserStack TM, Jira, Azure DevOps API details
- **Data Model**: Data structures, correlations, workflow metadata
- **UI Screens**: Screen specifications and layouts
- **IPC Contract**: Inter-process communication channels
- **Workflows**: Step-by-step workflow guides (e.g., Jira bug creation)
- **Troubleshooting**: Common errors and solutions

**Note**: The documentation site provides detailed technical information. This test document focuses on practical testing procedures.

---

## Setup & Configuration Testing

### Test Case 1.1: Initial Application Launch

**Objective**: Verify the application launches successfully and displays the main interface.

**Steps**:
1. Launch the compiled QA Hub application
2. Wait for the application window to appear
3. Observe the initial screen

**Expected Results**:
- ✅ Application window opens without errors
- ✅ Sidebar navigation is visible on the left
- ✅ Main content area is visible
- ✅ Dashboard is the default landing page
- ✅ No console errors or crash dialogs

**Pass Criteria**: Application launches successfully and displays the main interface.

---

### Test Case 1.2: Navigation Structure Verification

**Objective**: Verify all navigation items are accessible and properly organized.

**Steps**:
1. Examine the sidebar navigation
2. Verify all sections are present:
   - WORKSPACE: Dashboard
   - EXECUTION: BrowserStack Automate, Test Management, Remote Execution
   - QUALITY & INSIGHTS: Correlation View, Jira Defects
   - TOOLS: Repo Companion, Test Script Viewer, Settings, Diagnostics

**Expected Results**:
- ✅ All navigation sections are visible
- ✅ Icons are displayed correctly
- ✅ Navigation items are properly grouped
- ✅ Current page indicator (active state) works

**Pass Criteria**: All navigation items are present and properly organized.

---

### Test Case 1.3: Settings Screen Access

**Objective**: Verify Settings screen is accessible and displays correctly.

**Steps**:
1. Click on "Settings" in the sidebar (TOOLS section)
2. Observe the Settings screen

**Expected Results**:
- ✅ Settings screen loads
- ✅ Multiple tabs are visible (Azure, BrowserStack Automate, BrowserStack TM, Jira)
- ✅ Input fields are present for configuration
- ✅ Save/Test buttons are visible

**Pass Criteria**: Settings screen is accessible and displays configuration options.

---

### Test Case 1.4: Azure DevOps Configuration

**Objective**: Configure Azure DevOps integration and verify connectivity.

**Steps**:
1. Navigate to Settings
2. Click on "Azure" tab
3. Enter the following:
   - Organization: `[Your Azure DevOps Organization]`
   - Project: `[Your Project Name]`
   - Personal Access Token: `[Your PAT]`
4. Click "Test Connection" or "Save"
5. Verify the connection status

**Expected Results**:
- ✅ Settings are saved successfully
- ✅ Connection test passes (if available)
- ✅ No error messages displayed
- ✅ Repository list is populated (if repositories are configured)

**Pass Criteria**: Azure DevOps configuration is saved and connection is verified.

---

### Test Case 1.5: BrowserStack Automate Configuration

**Objective**: Configure BrowserStack Automate integration.

**Steps**:
1. Navigate to Settings
2. Click on "BrowserStack Automate" tab
3. Verify credentials are pre-filled (hardcoded for testing)
4. Click "Test Connection" (if available)
5. Verify the connection status

**Expected Results**:
- ✅ Credentials are displayed (may be pre-filled)
- ✅ Connection test passes
- ✅ No error messages

**Pass Criteria**: BrowserStack Automate configuration is validated.

---

### Test Case 1.6: BrowserStack TM Configuration

**Objective**: Configure BrowserStack Test Management integration.

**Steps**:
1. Navigate to Settings
2. Click on "BrowserStack TM" tab
3. Verify credentials are pre-filled
4. Click "Test Connection" (if available)
5. Verify the connection status

**Expected Results**:
- ✅ Credentials are displayed
- ✅ Connection test passes
- ✅ No error messages

**Pass Criteria**: BrowserStack TM configuration is validated.

---

### Test Case 1.7: Jira Configuration

**Objective**: Configure Jira integration and verify connectivity.

**Steps**:
1. Navigate to Settings
2. Click on "Jira" tab
3. Enter the following:
   - Base URL: `https://[your-instance].atlassian.net`
   - Email: `[Your Jira Email]`
   - API Token: `[Your Jira API Token]`
4. Click "Test Connection" or "Save"
5. Verify the connection status

**Expected Results**:
- ✅ Settings are saved successfully
- ✅ Connection test passes
- ✅ No error messages displayed

**Pass Criteria**: Jira configuration is saved and connection is verified.

---

### Test Case 1.8: Default Workspace Verification

**Objective**: Verify default workspace is created and accessible.

**Steps**:
1. Navigate to Repo Companion screen
2. Observe the default workspace path displayed
3. Verify the path exists (should be `~/Documents/QA-Hub-Workspace` on macOS/Linux, or `Documents\QA-Hub-Workspace` on Windows)

**Expected Results**:
- ✅ Default workspace path is displayed
- ✅ Workspace directory exists or will be created on first clone
- ✅ Path is correct for the operating system

**Pass Criteria**: Default workspace path is correctly configured.

---

## End-to-End Functional Test Cases

### Workflow 1: View Test Execution Data

#### Test Case 2.1: Dashboard Overview

**Objective**: Verify Dashboard displays metrics and recent activity.

**Steps**:
1. Navigate to Dashboard (should be default landing page)
2. Wait for data to load
3. Observe the metrics cards
4. Review recent builds and runs sections

**Expected Results**:
- ✅ Dashboard loads without errors
- ✅ Metrics cards display:
  - BrowserStack Automate builds count
  - Test Management runs count
  - Failed tests count
  - Linked Jira issues count
- ✅ Recent builds section shows latest BrowserStack builds
- ✅ Recent runs section shows latest TM test cases
- ✅ Loading states are displayed while fetching data
- ✅ Empty states are shown if no data is available

**Pass Criteria**: Dashboard displays metrics and recent activity correctly.

---

#### Test Case 2.2: BrowserStack Automate - View Builds

**Objective**: Navigate through BrowserStack Automate builds and sessions.

**Steps**:
1. Click "BrowserStack Automate" in the sidebar (EXECUTION section)
2. Wait for builds list to load
3. Observe the builds displayed
4. Click on a build to view details
5. View sessions within the build
6. Click on a session to view session details

**Expected Results**:
- ✅ Builds list loads successfully
- ✅ Builds are displayed with:
  - Build name
  - Status (passed/failed/running)
  - Creation date
  - Duration
- ✅ Build details page shows:
  - Build information
  - List of sessions
  - Status indicators
- ✅ Session details show:
  - Session information
  - Browser/OS details
  - Links to evidence (video, logs, HAR)
  - Session status

**Pass Criteria**: User can navigate through builds and sessions successfully.

---

#### Test Case 2.3: BrowserStack Automate - View Session Evidence

**Objective**: Access and view session evidence (video, logs, network).

**Steps**:
1. Navigate to BrowserStack Automate
2. Select a build
3. Select a session
4. Look for evidence links (video, console logs, network logs/HAR)
5. Click on video link (should open in browser)
6. Click on console logs link
7. Click on network/HAR link

**Expected Results**:
- ✅ Session details page displays evidence links
- ✅ Video link opens in default browser
- ✅ Console logs are accessible (may open in browser or display inline)
- ✅ Network/HAR logs are accessible
- ✅ Links are valid and functional
- ✅ Error handling for missing evidence

**Pass Criteria**: All evidence links are accessible and functional.

---

#### Test Case 2.4: Test Management - View Projects

**Objective**: Navigate through BrowserStack Test Management projects.

**Steps**:
1. Click "Test Management" in the sidebar (EXECUTION section)
2. Wait for projects list to load
3. Observe the projects displayed
4. Click on a project to view test cases

**Expected Results**:
- ✅ Projects list loads successfully
- ✅ Projects are displayed with:
  - Project name
  - Project ID
  - Additional metadata if available
- ✅ Clicking a project navigates to test cases view
- ✅ Loading indicators are shown during data fetch

**Pass Criteria**: User can view and navigate through TM projects.

---

#### Test Case 2.5: Test Management - View Test Cases

**Objective**: View test cases within a TM project.

**Steps**:
1. Navigate to Test Management
2. Select a project
3. Wait for test cases to load
4. Observe the test cases list
5. Use filters/search if available
6. Click on a test case to view details (if applicable)

**Expected Results**:
- ✅ Test cases list loads successfully
- ✅ Test cases display:
  - Test case identifier
  - Title/name
  - Status
  - Priority
  - Last updated date
  - Tags (if available)
- ✅ Filters/search work correctly
- ✅ Test case details are accessible
- ✅ Actions are available (Edit, History, Create Jira Bug, Delete)

**Pass Criteria**: Test cases are displayed and navigable.

---

#### Test Case 2.6: Test Management - View Test Runs

**Objective**: View test runs and results within a TM project.

**Steps**:
1. Navigate to Test Management
2. Select a project
3. Navigate to runs view (if available)
4. Select a test run
5. View test results within the run

**Expected Results**:
- ✅ Test runs list loads successfully
- ✅ Runs display:
  - Run name/ID
  - Status
  - Execution date
  - Results summary (passed/failed/skipped)
- ✅ Test results are viewable:
  - Test name
  - Status
  - Duration
  - Error messages (if failed)
- ✅ Navigation between runs and results works

**Pass Criteria**: Test runs and results are viewable and navigable.

---

### Workflow 2: Failure Analysis & Triage

#### Test Case 3.1: Identify Failing Tests

**Objective**: Identify and view failing tests from test runs.

**Steps**:
1. Navigate to Test Management
2. Select a project with test runs
3. View a test run that has failures
4. Identify failed test results
5. Click on a failed test result

**Expected Results**:
- ✅ Failed tests are clearly identified (status indicators, color coding)
- ✅ Failed test results show:
  - Test name
  - Error message
  - Stack trace (if available)
  - Execution details
- ✅ Failed tests can be selected for detailed view
- ✅ "Create Jira Bug" button is available for failed tests

**Pass Criteria**: Failing tests are clearly identifiable and accessible.

---

#### Test Case 3.2: View Failure Evidence from BrowserStack Session

**Objective**: Access BrowserStack session evidence for a failed test.

**Steps**:
1. Identify a failed test result
2. View the test result details
3. Look for correlated BrowserStack session (may be in Correlation View)
4. Access session evidence:
   - Video playback
   - Console logs
   - Network logs (HAR)
   - Screenshots (if available)

**Expected Results**:
- ✅ Session evidence is accessible for failed tests
- ✅ Video can be viewed (opens in browser)
- ✅ Console logs show error messages and console output
- ✅ Network logs (HAR) are accessible
- ✅ Evidence links are valid and functional
- ✅ Correlation between test result and session is visible

**Pass Criteria**: All evidence is accessible for failure analysis.

---

#### Test Case 3.3: Correlation View - View Linked Data

**Objective**: View correlated test results, sessions, Jira issues, and commits.

**Steps**:
1. Navigate to "Correlation View" in the sidebar (QUALITY & INSIGHTS section)
2. If a test result is linked, view the correlation details
3. Verify linked data is displayed:
   - Test result information
   - BrowserStack session (if linked)
   - Jira issue (if linked)
   - Azure commit (if linked)

**Expected Results**:
- ✅ Correlation View loads
- ✅ Linked test results are displayed
- ✅ Correlated BrowserStack sessions are shown
- ✅ Correlated Jira issues are shown
- ✅ Correlated Azure commits are shown
- ✅ Links between entities are clear
- ✅ "Rerun This Test" button is available (if applicable)

**Pass Criteria**: Correlation data is correctly displayed and navigable.

---

### Workflow 3: Bug Management (Jira)

**Jira Bug Creation Overview (QA Hub V1)**

This workflow aligns Jira bug creation with QA Hub's core philosophy: structured QA workflows driven by evidence and traceability.

**Implemented Capabilities:**

- Jira bugs can be created directly from:
  - BrowserStack Automate builds
  - BrowserStack Automate sessions
  - Test Management failed test cases
  - Correlation View

- Failures are normalized into a single FailureContext object that serves as the source of truth

- Jira drafts are auto-generated using:
  - Test metadata (name, ID, file path, tags)
  - BrowserStack build/session links
  - Environment details (browser, OS, device)
  - Evidence availability indicators (video, logs, network, screenshots)
  - Azure DevOps pipeline links (when available)

- Jira defaults are settings-driven:
  - Default project key
  - Issue type (Bug)
  - Labels
  - Component auto-mapping rules

- Users can preview and edit Jira drafts before creation

- Build-based bug creation supports session selection when multiple sessions fail

**V1 Scope Clarifications:**

- Stack trace parsing is intentionally out of scope
- Jira descriptions include links to evidence, not parsed error output
- All data enrichment is best-effort and degrades gracefully if integrations are unavailable

This implementation provides a strong foundation for consistent defect creation while keeping the system simple, predictable, and extensible.

---

#### Test Case 4.1: Create Jira Bug from Test Failure

**Objective**: Create a Jira bug directly from a test failure.

**Steps**:
1. Navigate to Test Management
2. Select a project
3. Find a failed test case or test result
4. Click the "Create Jira Bug" button (Bug icon)
5. Wait for bug creation modal to load
6. Review the auto-generated bug draft:
   - Summary
   - Description
   - Labels
7. Select session (if multiple sessions are available)
8. Edit the draft if needed
9. Fill in additional fields:
   - Project Key (may be pre-filled)
   - Issue Type (Bug)
   - Priority (optional)
   - Assignee (optional)
   - Component (optional)
10. Click "Create Issue"
11. Verify the issue is created

**Expected Results**:
- ✅ Bug creation modal opens
- ✅ Auto-generated draft is populated with:
  - Test failure details (test name, ID, file path, tags)
  - BrowserStack session/build links (not parsed stack traces)
  - Environment details (browser, OS, device)
  - Evidence links (video, logs, network/HAR, screenshots)
  - Azure DevOps pipeline links (if available)
- ✅ Draft description includes links to evidence, not parsed error output
- ✅ Draft can be edited before creation
- ✅ Session selection works (if multiple sessions available)
- ✅ Jira defaults are applied (project key, issue type, labels, component rules)
- ✅ Issue is created successfully in Jira
- ✅ Success message displays with issue key and link
- ✅ Modal can be closed
- ✅ Created issue is accessible in Jira

**Pass Criteria**: Jira bug is created successfully from test failure.

---

#### Test Case 4.2: Create Jira Bug from BrowserStack Build

**Objective**: Create a Jira bug from a BrowserStack Automate build.

**Steps**:
1. Navigate to BrowserStack Automate
2. Select a build (preferably one with failures)
3. Look for "Create Jira Bug" button or action
4. Click to open bug creation modal
5. Follow steps similar to Test Case 4.1

**Expected Results**:
- ✅ Bug creation is available from build view
- ✅ Bug draft is populated with build information
- ✅ Session selection is available (when multiple sessions fail)
- ✅ Draft includes evidence links and environment details
- ✅ Bug is created successfully

**Pass Criteria**: Jira bug can be created from BrowserStack build.

---

#### Test Case 4.3: Create Jira Bug from BrowserStack Session

**Objective**: Create a Jira bug from a BrowserStack session.

**Steps**:
1. Navigate to BrowserStack Automate
2. Select a build
3. Select a session (preferably a failed session)
4. Look for "Create Jira Bug" button
5. Click to open bug creation modal
6. Follow steps similar to Test Case 4.1

**Expected Results**:
- ✅ Bug creation is available from session view
- ✅ Bug draft includes session-specific information
- ✅ Evidence links are included in description (video, logs, network/HAR)
- ✅ Environment details are included (browser, OS, device)
- ✅ Bug is created successfully

**Pass Criteria**: Jira bug can be created from BrowserStack session.

---

#### Test Case 4.4: View Jira Issues

**Objective**: View Jira issues in the application.

**Steps**:
1. Navigate to "Jira Defects" in the sidebar (QUALITY & INSIGHTS section)
2. Wait for issues to load
3. Observe the issues list
4. Use search/filter if available
5. Click on an issue to view details

**Expected Results**:
- ✅ Jira screen loads
- ✅ Issues list is displayed (if implemented)
- ✅ Issues show:
  - Issue key
  - Summary
  - Status
  - Assignee
  - Priority
- ✅ Search/filter functionality works
- ✅ Issue details are accessible
- ✅ Links to Jira are functional

**Pass Criteria**: Jira issues are viewable in the application.

---

#### Test Case 4.5: Link Existing Jira Issue to Test Result

**Objective**: Link an existing Jira issue to a test result.

**Steps**:
1. Navigate to a test result or failure
2. Look for "Link Jira Issue" or similar option
3. Search for an existing Jira issue
4. Select the issue to link
5. Confirm the linkage
6. Verify the link is established

**Expected Results**:
- ✅ Link option is available
- ✅ Jira issue search works
- ✅ Issue can be selected
- ✅ Link is created successfully
- ✅ Linked issue is displayed in correlation view
- ✅ Link persists after app restart

**Pass Criteria**: Existing Jira issue can be linked to test results.

---

### Workflow 4: Repository Management (QA Engineers)

#### Test Case 5.1: View Repository List

**Objective**: View configured Azure DevOps repositories.

**Steps**:
1. Navigate to "Repo Companion" in the sidebar (TOOLS section)
2. Observe the repository list section
3. Verify repositories are displayed

**Expected Results**:
- ✅ Repo Companion screen loads
- ✅ Repository list section is visible
- ✅ Configured repositories are displayed with:
  - Repository name
  - Repository URL
  - Clone status
- ✅ "Clone" button is available for uncloned repos
- ✅ Default workspace path is displayed

**Pass Criteria**: Repository list is displayed correctly.

---

#### Test Case 5.2: Detect Cloned Repositories

**Objective**: Verify auto-detection of cloned repositories.

**Steps**:
1. Navigate to Repo Companion
2. Observe the "Detected Repositories" section
3. Verify repositories cloned in the default workspace are detected
4. Check sync status indicators

**Expected Results**:
- ✅ Detected Repositories section is visible
- ✅ Repositories in default workspace are auto-detected
- ✅ Sync status is displayed:
  - "X behind" (warning) - needs pull
  - "X ahead" (info) - has unpushed commits
  - "Up to date" (success) - synced
- ✅ Refresh button works to re-scan
- ✅ Clicking a detected repo loads it

**Pass Criteria**: Cloned repositories are auto-detected with correct status.

---

#### Test Case 5.3: Clone Repository

**Objective**: Clone a repository from Azure DevOps.

**Steps**:
1. Navigate to Repo Companion
2. Find a repository in the list that is not cloned
3. Click "Clone" button
4. Wait for clone operation to complete
5. Verify the repository appears in Detected Repositories
6. Verify the repository is cloned to default workspace

**Expected Results**:
- ✅ Clone button is clickable
- ✅ Clone operation starts (loading indicator)
- ✅ Repository is cloned successfully
- ✅ Repository appears in Detected Repositories
- ✅ Repository files exist in default workspace directory
- ✅ No error messages
- ✅ Success message is displayed

**Pass Criteria**: Repository is cloned successfully to default workspace.

---

#### Test Case 5.4: View Git Status

**Objective**: View Git status for a repository.

**Steps**:
1. Navigate to Repo Companion
2. Select a cloned repository (click on it in Detected Repositories)
3. Wait for repository to load
4. Observe the Git status section

**Expected Results**:
- ✅ Repository loads successfully
- ✅ Git status displays:
  - Current branch name
  - Ahead/behind counts
  - Staged files count
  - Unstaged files count
  - Untracked files count
- ✅ File changes are categorized:
  - Staged Changes (green section)
  - Unstaged Changes (yellow section)
  - Untracked Files (blue section)
- ✅ Individual files are listed with paths

**Pass Criteria**: Git status is displayed accurately.

---

#### Test Case 5.5: Stage and Unstage Files

**Objective**: Stage and unstage files for commit.

**Steps**:
1. Load a repository with uncommitted changes
2. View the Git status
3. In "Unstaged Changes" section, click "Stage" on a file
4. Verify the file moves to "Staged Changes"
5. Click "Unstage" on a staged file
6. Verify the file moves back to "Unstaged Changes"
7. Test "Stage All" button if available

**Expected Results**:
- ✅ Stage button works for individual files
- ✅ File moves to Staged Changes section
- ✅ Unstage button works for individual files
- ✅ File moves back to Unstaged Changes section
- ✅ "Stage All" button stages all unstaged files
- ✅ Git status updates correctly after each operation
- ✅ Visual indicators (colors) are correct

**Pass Criteria**: Files can be staged and unstaged correctly.

---

#### Test Case 5.6: Create Commit

**Objective**: Create a commit with staged changes.

**Steps**:
1. Load a repository
2. Stage some files (follow Test Case 5.5)
3. Enter a commit message in the commit message input
   - Test with valid message (>= 10 characters)
   - Test with invalid message (< 10 characters)
4. Click "Commit" button
5. Verify the commit is created
6. Verify Git status updates

**Expected Results**:
- ✅ Commit message input is available
- ✅ Commit button is disabled when:
  - No files are staged
  - Commit message is less than 10 characters
- ✅ Commit button is enabled when:
  - Files are staged
  - Commit message is >= 10 characters
- ✅ Commit is created successfully
- ✅ Success message is displayed
- ✅ Git status updates (staged files cleared)
- ✅ Commit appears in commit history
- ✅ Error handling for empty commits

**Pass Criteria**: Commits can be created with proper validation.

---

#### Test Case 5.7: View Commit History

**Objective**: View recent commit history for a repository.

**Steps**:
1. Load a repository
2. Look for "Commit History" section or toggle
3. Expand/toggle commit history
4. Observe the commits displayed

**Expected Results**:
- ✅ Commit history section is available
- ✅ Toggle/expand button works
- ✅ Recent commits (last 10) are displayed
- ✅ Each commit shows:
  - Commit hash (short)
  - Author name
  - Commit date
  - Commit message
- ✅ Commits are listed in chronological order (newest first)

**Pass Criteria**: Commit history is displayed correctly.

---

#### Test Case 5.8: Branch Management - View Branches

**Objective**: View local and remote branches.

**Steps**:
1. Load a repository
2. Look for branch management section
3. Observe the branches displayed
4. Verify current branch is indicated

**Expected Results**:
- ✅ Branch section is visible
- ✅ Local branches are listed
- ✅ Current branch is highlighted/indicated
- ✅ Branch names are displayed correctly
- ✅ Remote branches may be shown (if implemented)

**Pass Criteria**: Branches are viewable with current branch indicated.

---

#### Test Case 5.9: Branch Management - Create Branch

**Objective**: Create a new branch.

**Steps**:
1. Load a repository
2. Navigate to branch management
3. Click "Create Branch" or similar button
4. Enter a new branch name
5. Click "Create" or confirm
6. Verify the branch is created
7. Verify the branch becomes the current branch

**Expected Results**:
- ✅ Create branch option is available
- ✅ Branch name input is available
- ✅ Branch is created successfully
- ✅ New branch becomes current branch
- ✅ Branch appears in branch list
- ✅ Error handling for invalid branch names
- ✅ Error handling for duplicate branch names

**Pass Criteria**: New branches can be created successfully.

---

#### Test Case 5.10: Branch Management - Switch Branches

**Objective**: Switch between branches.

**Steps**:
1. Load a repository with multiple branches
2. View the branch list
3. Select a different branch to switch to
4. Confirm the switch (if confirmation is required)
5. Verify the branch switch is successful

**Expected Results**:
- ✅ Branch switching is available
- ✅ Current branch indicator updates
- ✅ Working directory updates to selected branch
- ✅ Git status refreshes
- ✅ Protection against switching with uncommitted changes (if implemented)
- ✅ Confirmation dialog for uncommitted changes (if applicable)

**Pass Criteria**: Branch switching works correctly with proper safeguards.

---

#### Test Case 5.11: Pull Changes

**Objective**: Pull latest changes from remote repository.

**Steps**:
1. Load a repository
2. Check if repository is behind remote (should show "X behind")
3. Click "Pull" button
4. Wait for pull operation to complete
5. Verify the pull is successful
6. Verify Git status updates

**Expected Results**:
- ✅ Pull button is available
- ✅ Pull operation starts (loading indicator)
- ✅ Pull completes successfully
- ✅ Success message is displayed
- ✅ Git status updates (behind count decreases/clears)
- ✅ Local repository is up to date
- ✅ Error handling for merge conflicts (if applicable)
- ✅ Error handling for network issues

**Pass Criteria**: Pull operation works correctly.

---

#### Test Case 5.12: Push Changes

**Objective**: Push commits to remote repository.

**Steps**:
1. Load a repository
2. Create a commit (follow Test Case 5.6)
3. Verify repository shows "X ahead"
4. Click "Push" button
5. Wait for push operation to complete
6. Verify the push is successful

**Expected Results**:
- ✅ Push button is available
- ✅ Push button is disabled if no commits to push
- ✅ Push operation starts (loading indicator)
- ✅ Push completes successfully
- ✅ Success message is displayed
- ✅ Git status updates (ahead count decreases/clears)
- ✅ Error handling for authentication issues
- ✅ Error handling for permission issues
- ✅ Error handling for network issues

**Pass Criteria**: Push operation works correctly.

---

#### Test Case 5.13: Open Repository in VS Code

**Objective**: Open repository in Visual Studio Code.

**Steps**:
1. Load a repository
2. Find "Open in VS Code" button
3. Click the button
4. Verify VS Code opens with the repository

**Expected Results**:
- ✅ "Open in VS Code" button is available
- ✅ Button is clickable
- ✅ VS Code opens (if installed)
- ✅ Repository root is opened in VS Code
- ✅ Error message if VS Code is not installed (if applicable)

**Pass Criteria**: Repository opens in VS Code successfully.

---

### Workflow 5: Correlation & Analysis

#### Test Case 6.1: View Test Result Correlations

**Objective**: View all correlations for a test result.

**Steps**:
1. Navigate to a test result (from Test Management or Correlation View)
2. View correlation information
3. Verify linked data is displayed:
   - BrowserStack session
   - Jira issue
   - Azure commit

**Expected Results**:
- ✅ Correlation data is displayed
- ✅ Linked BrowserStack session is shown with link
- ✅ Linked Jira issue is shown with link
- ✅ Linked Azure commit is shown with link
- ✅ All links are functional
- ✅ Correlation timestamps are displayed (if available)

**Pass Criteria**: Correlations are displayed and accessible.

---

#### Test Case 6.2: Correlation Persistence

**Objective**: Verify correlations persist after app restart.

**Steps**:
1. Create/link a correlation (Jira issue, session, commit)
2. Close the application
3. Restart the application
4. Navigate to the same test result
5. Verify correlations are still present

**Expected Results**:
- ✅ Correlations are saved to database
- ✅ Correlations persist after app restart
- ✅ All linked data is still accessible
- ✅ Links are functional

**Pass Criteria**: Correlations persist correctly.

---

## Integration Testing

### Test Case 7.1: BrowserStack Automate API Connectivity

**Objective**: Verify BrowserStack Automate API calls are successful.

**Steps**:
1. Configure BrowserStack Automate credentials (if not already done)
2. Navigate to BrowserStack Automate screen
3. Verify builds are fetched
4. Verify sessions are fetched
5. Verify session details are fetched
6. Check for API errors in console/logs

**Expected Results**:
- ✅ API calls are successful
- ✅ Data is returned correctly
- ✅ No authentication errors
- ✅ No network errors
- ✅ Error handling for API failures works
- ✅ Loading states are displayed during API calls

**Pass Criteria**: All BrowserStack Automate API calls are successful.

---

### Test Case 7.2: BrowserStack TM API Connectivity

**Objective**: Verify BrowserStack Test Management API calls are successful.

**Steps**:
1. Configure BrowserStack TM credentials (if not already done)
2. Navigate to Test Management screen
3. Verify projects are fetched
4. Verify test cases are fetched
5. Verify test runs are fetched (if applicable)
6. Check for API errors

**Expected Results**:
- ✅ API calls are successful
- ✅ Data is returned correctly
- ✅ No authentication errors
- ✅ No network errors
- ✅ Error handling works
- ✅ Loading states are displayed

**Pass Criteria**: All BrowserStack TM API calls are successful.

---

### Test Case 7.3: Jira API Connectivity

**Objective**: Verify Jira API calls are successful.

**Steps**:
1. Configure Jira credentials (if not already done)
2. Navigate to Jira screen or create a bug
3. Verify issue search works (if implemented)
4. Verify issue creation works
5. Verify issue retrieval works
6. Check for API errors

**Expected Results**:
- ✅ API calls are successful
- ✅ Authentication works
- ✅ Issue creation works
- ✅ Issue retrieval works
- ✅ Error handling works
- ✅ Proper error messages for invalid credentials

**Pass Criteria**: All Jira API calls are successful.

---

### Test Case 7.4: Azure DevOps API Connectivity

**Objective**: Verify Azure DevOps API calls are successful.

**Steps**:
1. Configure Azure DevOps credentials (if not already done)
2. Navigate to Repo Companion
3. Verify repositories are fetched
4. Verify commits are fetched (if applicable)
5. Verify Git operations use Azure DevOps PAT
6. Check for API errors

**Expected Results**:
- ✅ API calls are successful
- ✅ Repository list is fetched
- ✅ Authentication works (PAT)
- ✅ Git operations authenticate correctly
- ✅ Error handling works
- ✅ Proper error messages for invalid PAT

**Pass Criteria**: All Azure DevOps API calls are successful.

---

### Test Case 7.5: Database Operations

**Objective**: Verify database operations work correctly.

**Steps**:
1. Create a correlation (link test result to Jira issue)
2. Verify correlation is saved
3. Restart application
4. Verify correlation is loaded from database
5. Verify settings are persisted
6. Verify repository paths are persisted

**Expected Results**:
- ✅ Database file is created (qa-hub.db)
- ✅ Correlations are saved
- ✅ Correlations are loaded correctly
- ✅ Settings are persisted
- ✅ Repository paths are persisted
- ✅ No database errors
- ✅ Database operations are fast

**Pass Criteria**: All database operations work correctly.

---

## UI/UX Testing

### Test Case 8.1: Navigation and Routing

**Objective**: Verify navigation works correctly throughout the application.

**Steps**:
1. Navigate to each screen via sidebar
2. Verify URLs update correctly
3. Use browser back/forward (if applicable)
4. Test direct URL navigation
5. Verify active state highlighting in sidebar

**Expected Results**:
- ✅ All navigation links work
- ✅ URLs are correct for each screen
- ✅ Active state is highlighted in sidebar
- ✅ Navigation is smooth (no flickering)
- ✅ Page titles update correctly (if implemented)
- ✅ No broken routes

**Pass Criteria**: Navigation works correctly throughout the application.

---

### Test Case 8.2: Theme Switching

**Objective**: Verify theme switching works.

**Steps**:
1. Look for theme toggle (usually in top toolbar)
2. Click to switch theme (light/dark)
3. Verify theme changes
4. Restart application
5. Verify theme preference persists

**Expected Results**:
- ✅ Theme toggle is visible
- ✅ Theme switches immediately
- ✅ All UI elements adapt to theme
- ✅ Theme preference is saved
- ✅ Theme persists after restart
- ✅ No visual glitches during theme switch

**Pass Criteria**: Theme switching works correctly and persists.

---

### Test Case 8.3: Loading States

**Objective**: Verify loading indicators are displayed during data fetching.

**Steps**:
1. Navigate to Dashboard
2. Observe loading states
3. Navigate to BrowserStack Automate
4. Observe loading states
5. Navigate to Test Management
6. Observe loading states
7. Perform Git operations
8. Observe loading states

**Expected Results**:
- ✅ Loading indicators are displayed during data fetch
- ✅ Skeleton loaders or spinners are shown
- ✅ Loading states are clear and visible
- ✅ No blank screens during loading
- ✅ Loading completes successfully

**Pass Criteria**: Loading states are displayed appropriately.

---

### Test Case 8.4: Error Handling and Display

**Objective**: Verify error messages are displayed correctly.

**Steps**:
1. Test with invalid credentials (temporarily)
2. Test with network disconnected
3. Test with invalid input (e.g., short commit message)
4. Observe error messages displayed
5. Verify error messages are clear and actionable

**Expected Results**:
- ✅ Error messages are displayed
- ✅ Error messages are clear and understandable
- ✅ Error messages appear in appropriate locations (alerts, modals, inline)
- ✅ Error states don't crash the application
- ✅ Users can recover from errors
- ✅ Network errors are handled gracefully

**Pass Criteria**: Error handling is appropriate and user-friendly.

---

### Test Case 8.5: Responsive Layout

**Objective**: Verify layout works at different window sizes.

**Steps**:
1. Resize application window to different sizes
2. Verify sidebar remains accessible
3. Verify content is readable
4. Verify tables/lists adapt (if applicable)
5. Verify modals are accessible

**Expected Results**:
- ✅ Layout adapts to window size
- ✅ Sidebar is always accessible (may collapse on small screens)
- ✅ Content remains readable
- ✅ No horizontal scrolling (unless necessary)
- ✅ Modals are centered and accessible
- ✅ Tables scroll horizontally if needed

**Pass Criteria**: Layout works well at different window sizes.

---

### Test Case 8.6: Empty States

**Objective**: Verify empty states are displayed when no data is available.

**Steps**:
1. Navigate to screens with no data
2. Verify empty states are displayed
3. Check empty state messages are helpful
4. Verify empty states have appropriate icons

**Expected Results**:
- ✅ Empty states are displayed when appropriate
- ✅ Empty state messages are clear
- ✅ Empty state icons are appropriate
- ✅ Empty states don't show errors
- ✅ Empty states guide users on next steps

**Pass Criteria**: Empty states are displayed appropriately.

---

## Data Validation Testing

### Test Case 9.1: Settings Persistence

**Objective**: Verify settings are saved and persist correctly.

**Steps**:
1. Configure all integrations (Azure, BrowserStack, Jira)
2. Save settings
3. Close application
4. Restart application
5. Navigate to Settings
6. Verify all settings are still configured

**Expected Results**:
- ✅ Settings are saved
- ✅ Settings persist after restart
- ✅ All configured values are displayed correctly
- ✅ Credentials are stored securely (encrypted)
- ✅ No settings are lost

**Pass Criteria**: Settings persist correctly.

---

### Test Case 9.2: Correlation Data Persistence

**Objective**: Verify correlation data is saved and persists.

**Steps**:
1. Create correlations (link test results to sessions/issues/commits)
2. Verify correlations are saved
3. Restart application
4. Verify correlations are still present
5. Verify correlation data is accurate

**Expected Results**:
- ✅ Correlations are saved to database
- ✅ Correlations persist after restart
- ✅ Correlation data is accurate
- ✅ Links are functional
- ✅ No data corruption

**Pass Criteria**: Correlation data persists correctly.

---

### Test Case 9.3: Repository Path Persistence

**Objective**: Verify repository paths are saved and persist.

**Steps**:
1. Clone a repository
2. Verify repository path is saved
3. Restart application
4. Navigate to Repo Companion
5. Verify repository is detected
6. Verify repository path is correct

**Expected Results**:
- ✅ Repository paths are saved to database
- ✅ Repository paths persist after restart
- ✅ Detected repositories are loaded correctly
- ✅ Paths are valid and accessible

**Pass Criteria**: Repository paths persist correctly.

---

### Test Case 9.4: Default Workspace Persistence

**Objective**: Verify default workspace path persists.

**Steps**:
1. Navigate to Repo Companion
2. Note the default workspace path
3. Close application
4. Restart application
5. Navigate to Repo Companion
6. Verify default workspace path is the same

**Expected Results**:
- ✅ Default workspace path is saved
- ✅ Default workspace path persists after restart
- ✅ Path is correct for the operating system

**Pass Criteria**: Default workspace path persists correctly.

---

### Test Case 9.5: Settings Encryption

**Objective**: Verify credentials are stored securely.

**Steps**:
1. Configure integrations with credentials
2. Save settings
3. Verify credentials are not stored in plain text
4. Verify credentials are accessible only through the application

**Expected Results**:
- ✅ Credentials are encrypted at rest
- ✅ Credentials are not visible in database files (if accessible)
- ✅ Credentials are stored using OS-backed encryption (electron-store)
- ✅ Credentials are not exposed to renderer process

**Pass Criteria**: Credentials are stored securely.

---

## Edge Cases & Error Scenarios

### Test Case 10.1: Network Failure Handling

**Objective**: Verify application handles network failures gracefully.

**Steps**:
1. Disconnect from network
2. Attempt to fetch data from BrowserStack Automate
3. Attempt to fetch data from Test Management
4. Attempt to create Jira issue
5. Attempt Git operations (pull/push)
6. Observe error handling

**Expected Results**:
- ✅ Network errors are caught and handled
- ✅ Clear error messages are displayed
- ✅ Application doesn't crash
- ✅ Users can retry operations
- ✅ Partial data is handled gracefully
- ✅ Offline functionality works (for local operations)

**Pass Criteria**: Network failures are handled gracefully.

---

### Test Case 10.2: Invalid Credentials Handling

**Objective**: Verify application handles invalid credentials correctly.

**Steps**:
1. Enter invalid BrowserStack credentials
2. Test connection or attempt to fetch data
3. Enter invalid Jira credentials
4. Test connection or attempt to create issue
5. Enter invalid Azure DevOps PAT
6. Attempt Git operations
7. Observe error messages

**Expected Results**:
- ✅ Invalid credentials are detected
- ✅ Clear error messages are displayed
- ✅ Error messages indicate authentication failure
- ✅ Users can correct credentials
- ✅ Application doesn't crash
- ✅ No credentials are exposed in error messages

**Pass Criteria**: Invalid credentials are handled appropriately.

---

### Test Case 10.3: Missing Data Handling

**Objective**: Verify application handles missing data gracefully.

**Steps**:
1. Navigate to screens with no data
2. Attempt to view details of non-existent items
3. Attempt to access deleted resources
4. Observe empty states and error handling

**Expected Results**:
- ✅ Empty states are displayed for missing data
- ✅ Error messages are shown for non-existent items
- ✅ Application doesn't crash
- ✅ Users can navigate away from error states
- ✅ 404-style errors are handled

**Pass Criteria**: Missing data is handled gracefully.

---

### Test Case 10.4: API Rate Limiting

**Objective**: Verify application handles API rate limiting.

**Steps**:
1. Perform many API calls in quick succession
2. Observe if rate limiting errors occur
3. Verify error handling for rate limits
4. Verify retry logic (if implemented)

**Expected Results**:
- ✅ Rate limiting errors are handled
- ✅ Error messages are clear
- ✅ Retry logic works (if implemented)
- ✅ Application doesn't crash
- ✅ Users are informed of rate limits

**Pass Criteria**: API rate limiting is handled appropriately.

---

### Test Case 10.5: Large Dataset Handling

**Objective**: Verify application handles large datasets.

**Steps**:
1. Navigate to screens with large datasets (many builds, test cases, etc.)
2. Verify pagination works (if implemented)
3. Verify performance is acceptable
4. Verify UI remains responsive

**Expected Results**:
- ✅ Large datasets are handled without crashes
- ✅ Pagination works (if implemented)
- ✅ Performance is acceptable (no significant lag)
- ✅ UI remains responsive
- ✅ Loading states are shown for large data fetches

**Pass Criteria**: Large datasets are handled appropriately.

---

### Test Case 10.6: Concurrent Operations

**Objective**: Verify application handles concurrent operations.

**Steps**:
1. Perform multiple operations simultaneously:
   - Fetch data from multiple screens
   - Perform Git operations while fetching data
   - Create Jira issue while performing other operations
2. Verify operations complete successfully
3. Verify no conflicts or errors

**Expected Results**:
- ✅ Concurrent operations work correctly
- ✅ No conflicts between operations
- ✅ All operations complete successfully
- ✅ Application remains stable
- ✅ No data corruption

**Pass Criteria**: Concurrent operations work correctly.

---

### Test Case 10.7: Git Conflict Handling

**Objective**: Verify Git conflict handling (if applicable).

**Steps**:
1. Create a situation with Git merge conflicts
2. Attempt to pull changes
3. Observe conflict handling
4. Verify error messages are clear

**Expected Results**:
- ✅ Merge conflicts are detected
- ✅ Clear error messages are displayed
- ✅ Users are informed about conflicts
- ✅ Application doesn't crash
- ✅ Users can resolve conflicts externally (if needed)

**Pass Criteria**: Git conflicts are handled appropriately.

---

### Test Case 10.8: Invalid Input Validation

**Objective**: Verify input validation works correctly.

**Steps**:
1. Test commit message validation (too short)
2. Test branch name validation (invalid characters)
3. Test URL validation (invalid Jira URL)
4. Test email validation (invalid email format)
5. Verify validation errors are displayed

**Expected Results**:
- ✅ Input validation works
- ✅ Validation errors are displayed
- ✅ Invalid inputs are rejected
- ✅ Error messages are clear
- ✅ Users can correct invalid inputs

**Pass Criteria**: Input validation works correctly.

---

## Test Data Requirements

### BrowserStack Test Data

To properly test the application, you should have:

1. **BrowserStack Automate**:
   - At least 2-3 builds (some passed, some failed)
   - At least 5-10 sessions (mix of passed/failed)
   - Sessions with evidence (video, logs, HAR)
   - Different browsers/OS combinations

2. **BrowserStack Test Management**:
   - At least 1-2 projects
   - At least 10-20 test cases
   - At least 2-3 test runs
   - Mix of passed/failed test results
   - Test cases with different priorities and tags

### Jira Test Data

1. **Jira Instance**:
   - Access to a project (e.g., project key "QST" or similar)
   - Permission to create issues
   - At least 2-3 existing issues for linking tests
   - Different issue types (Bug, Task, etc.)

### Azure DevOps Test Data

1. **Azure DevOps**:
   - At least 1-2 repositories
   - Repository with multiple branches
   - Repository with commit history
   - Permission to clone and push

### Git Test Scenarios

For comprehensive Git testing, prepare:

1. **Repository States**:
   - Clean repository (no changes)
   - Repository with unstaged changes
   - Repository with staged changes
   - Repository behind remote (needs pull)
   - Repository ahead of remote (needs push)
   - Repository with multiple branches

2. **Test Files**:
   - Create test files for staging/unstaging
   - Create test files for commits
   - Have files ready for branch testing

---

## Test Execution Checklist

Use this checklist to track your testing progress. Mark each item as:
- ✅ Passed
- ❌ Failed (report as issue)
- ⚠️ Blocked
- ⏭️ Skipped
- 🔄 In Progress

**Tester Name**: _________________  
**Testing Date**: _________________  
**App Version**: _________________

### Setup & Configuration
- [ ] Initial application launch
- [ ] Navigation structure
- [ ] Settings screen access
- [ ] Azure DevOps configuration
- [ ] BrowserStack Automate configuration
- [ ] BrowserStack TM configuration
- [ ] Jira configuration
- [ ] Default workspace verification

### View Test Execution Data
- [ ] Dashboard overview
- [ ] BrowserStack Automate - View builds
- [ ] BrowserStack Automate - View session evidence
- [ ] Test Management - View projects
- [ ] Test Management - View test cases
- [ ] Test Management - View test runs

### Failure Analysis & Triage
- [ ] Identify failing tests
- [ ] View failure evidence
- [ ] Correlation view

### Bug Management (Jira)
- [ ] Create Jira bug from test failure
- [ ] Create Jira bug from build
- [ ] Create Jira bug from session
- [ ] View Jira issues
- [ ] Link existing Jira issue

### Repository Management
- [ ] View repository list
- [ ] Detect cloned repositories
- [ ] Clone repository
- [ ] View Git status
- [ ] Stage and unstage files
- [ ] Create commit
- [ ] View commit history
- [ ] Branch management - View branches
- [ ] Branch management - Create branch
- [ ] Branch management - Switch branches
- [ ] Pull changes
- [ ] Push changes
- [ ] Open in VS Code

### Correlation & Analysis
- [ ] View test result correlations
- [ ] Correlation persistence

### Integration Testing
- [ ] BrowserStack Automate API connectivity
- [ ] BrowserStack TM API connectivity
- [ ] Jira API connectivity
- [ ] Azure DevOps API connectivity
- [ ] Database operations

### UI/UX Testing
- [ ] Navigation and routing
- [ ] Theme switching
- [ ] Loading states
- [ ] Error handling and display
- [ ] Responsive layout
- [ ] Empty states

### Data Validation
- [ ] Settings persistence
- [ ] Correlation data persistence
- [ ] Repository path persistence
- [ ] Default workspace persistence
- [ ] Settings encryption

### Edge Cases & Error Scenarios
- [ ] Network failure handling
- [ ] Invalid credentials handling
- [ ] Missing data handling
- [ ] API rate limiting
- [ ] Large dataset handling
- [ ] Concurrent operations
- [ ] Git conflict handling
- [ ] Invalid input validation

---

## Testing Notes

### Environment Setup

1. **Clean Testing Environment**: For accurate testing, consider testing in a clean environment or resetting the database between major test cycles.

2. **Test Accounts**: Use dedicated test accounts for integrations to avoid affecting production data.

3. **Test Data Backup**: Before extensive testing, consider backing up any important test data.

### Reporting Issues

When you encounter bugs or issues during testing, please report them using the following format:

**Issue Report Template:**

```
**Test Case Number**: [e.g., Test Case 4.1]
**Feature/Workflow**: [e.g., Bug Management (Jira)]
**Severity**: [Critical / High / Medium / Low]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**:
[What should have happened according to the test case]

**Actual Result**:
[What actually happened]

**Environment Details**:
- OS: [Windows/macOS/Linux and version]
- App Version: [If available]
- Integration Status: [Which integrations are configured]

**Error Messages**:
[Any error messages, console output, or stack traces]

**Screenshots/Attachments**:
[Attach screenshots or logs if applicable]

**Additional Notes**:
[Any other relevant information]
```

**Severity Guidelines:**
- **Critical**: Application crashes, data loss, security issues, prevents core workflows
- **High**: Major feature broken, incorrect data displayed, prevents completion of workflow
- **Medium**: Feature works but with issues, UI problems, minor data inconsistencies
- **Low**: Cosmetic issues, minor UI inconsistencies, enhancement suggestions

**Where to Report:**
- [Specify where issues should be reported - GitHub issues, Jira, email, etc.]

### Test Completion Status

Track your testing progress using the Test Execution Checklist below. Mark each test case as:
- ✅ **Passed**: Test case passed as expected
- ❌ **Failed**: Test case failed (report as issue)
- ⚠️ **Blocked**: Cannot test due to missing prerequisites or blocked by another issue
- ⏭️ **Skipped**: Intentionally skipped (note reason)
- 🔄 **In Progress**: Currently testing

### Test Priority

Focus testing in this order:

1. **Critical**: Setup, configuration, core workflows (viewing data, creating bugs)
2. **High**: Repository management, correlation, API connectivity
3. **Medium**: UI/UX, edge cases, error handling
4. **Low**: Performance, large datasets, advanced features

---

## Appendix: Quick Reference

### Default Paths

- **Database**: `{userData}/qa-hub.db` (OS-specific userData directory)
- **Default Workspace**: `~/Documents/QA-Hub-Workspace` (macOS/Linux) or `Documents\QA-Hub-Workspace` (Windows)
- **Settings Storage**: OS-backed encrypted store (electron-store)

### Key Keyboard Shortcuts

- (Document if any keyboard shortcuts are implemented)

### Common Error Messages

- (Document common error messages and their meanings)

### Support Contacts

- (Add support contact information if available)

---

**Document Version**: 1.0  
**Last Updated**: [Date]  
**Application Version**: 1.0.0

