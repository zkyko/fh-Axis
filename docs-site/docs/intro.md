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

1. **View test executions** from BrowserStack Automate
2. **Manage test cases and runs** from BrowserStack Test Management
3. **Create and link Jira defects** to test failures with structured, evidence-driven bug creation
4. **Manage repositories** and perform Git operations
5. **Correlate test results** with evidence, commits, and issues

## Core Philosophy

QA Hub is designed to **force structure in QA workflows**. Rather than just running tests, QA Hub enforces a structured approach: **understand failures → capture evidence → create actionable defects**. This ensures every test failure is properly analyzed, documented, and tracked through to resolution.

## What QA Hub Does NOT Do

It's important to understand what QA Hub is **not**:

- ❌ **Not a test script generator** - QA Hub does NOT generate or create test scripts. Your team writes test scripts manually (e.g., for D365 and web applications) using their preferred tools and frameworks.
- ❌ **Not a test runner** - QA Hub does not execute tests locally
- ❌ **Not a Playwright wrapper** - QA Hub does not wrap or generate Playwright code
- ❌ **Not a CI trigger system** - QA Hub focuses on triage and workflow management
- ❌ **Not a pipeline upload tool** - QA Hub does not upload test scripts to Azure DevOps pipelines. Your team manages test scripts in Azure DevOps repositories and uploads them to pipelines through Azure DevOps.
- ❌ **Not a complete replacement** for BrowserStack UI when API gaps exist

**Test Script Workflow:**
- Your team **codes test scripts** for D365 and web applications
- Test scripts are **managed and uploaded to Azure DevOps pipelines** (outside of QA Hub)
- QA Hub helps **organize and manage the workflow** around these existing test scripts:
  - **Git operations**: push, pull, commit test scripts
  - **Repository management**: organize and track test script repositories
  - **Workflow organization**: manage the workflow around test execution and failure analysis

**Execution remains in CI + BrowserStack.** QA Hub is a **triage and workflow management tool**, not an execution platform or test script generator.

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
- **Pipeline integration** - View pipeline runs and build information (test scripts are uploaded to pipelines via Azure DevOps, not through QA Hub)

**Important**: QA Hub does NOT upload test scripts to pipelines. Your team manages test scripts in Azure DevOps repositories and uploads them to pipelines through Azure DevOps. QA Hub helps organize the workflow around these repositories and correlates test execution results with commits and branches.

## Workflows

QA Hub supports the following key workflows:

1. **Repository Management → Test Execution → Failure Analysis → Defect Tracking** - The complete workflow from managing test script repositories to defect tracking
2. **Failure Analysis** - View execution evidence, correlate with code changes, and create actionable defects
3. **Triage Workflow** - Assign, label, and comment on failures
4. **Correlation** - Link test results to sessions, Jira issues, and Azure commits

## Target Users

### QA Engineers

- **Manage test script repositories** - Use Git operations (push, pull, commit) to organize test scripts that your team has already written
- **Organize workflow** - Manage the workflow around test execution, failure analysis, and defect tracking
- **Map tests to BrowserStack TM cases** - Link existing test scripts to BrowserStack Test Management cases
- **Triage failures** - Analyze test failures, label, and create/link Jira defects

**Note**: QA Hub does NOT generate test scripts. Your team writes test scripts (for D365, web, etc.) and manages them through Azure DevOps. QA Hub helps organize the workflow around these existing test scripts.

### Developers

- Find root cause quickly with build context and failure signatures
- Access BrowserStack video/logs/HAR evidence
- View linked Jira tickets and status
- Comment and collaborate on failures

