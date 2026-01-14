---
slug: /
---

# Introduction

## What is Axis?

Axis is a desktop application that provides **unified test execution, failure analysis, and defect tracking** for QA and Development teams. It helps teams triage failures, correlate evidence, and manage workflows across multiple tools.

Axis is an Electron desktop application that serves as a central hub for:

- **BrowserStack Automate** - View builds, sessions, and execution evidence
- **BrowserStack Test Management (TM)** - Manage test cases, runs, and results
- **Jira** - Create and link defects to test failures
- **Azure DevOps** - Repository management, commit tracking, and code correlation

## Key Capabilities

Axis provides a structured workflow for QA teams:

1. **View test executions** from BrowserStack Automate
2. **Manage test cases and runs** from BrowserStack Test Management
3. **Create and link Jira defects** to test failures with structured, evidence-driven bug creation
4. **Manage repositories** and perform Git operations
5. **Correlate test results** with evidence, commits, and issues

## Core Philosophy

Axis is designed to **force structure in QA workflows**. Rather than just running tests, Axis enforces a structured approach: **understand failures → capture evidence → create actionable defects**. This ensures every test failure is properly analyzed, documented, and tracked through to resolution.

## What Axis Does NOT Do

It's important to understand what Axis is **not**:

- ❌ **Not a test runner** - Axis does not execute tests locally
- ❌ **Not a Playwright wrapper** - Axis does not wrap or generate Playwright code
- ❌ **Not a CI trigger system** - Axis focuses on triage and workflow management
- ❌ **Not a complete replacement** for BrowserStack UI when API gaps exist

**Execution remains in CI + BrowserStack.** Axis is a **triage and workflow management tool**, not an execution platform.

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

- Repository management (clone, pull, push)
- Commit tracking and branch management
- Code correlation with test results
- Git workflow operations (stage, commit, branch management)

## Workflows

Axis supports the following key workflows:

1. **Repo Companion → Automate → TM → Jira** - The complete workflow from test creation to defect tracking
2. **Failure Analysis** - View execution evidence, correlate with code changes, and create actionable defects
3. **Triage Workflow** - Assign, label, and comment on failures
4. **Correlation** - Link test results to sessions, Jira issues, and Azure commits

## Target Users

### QA Engineers

- Create tests (templates), manage repo state (git)
- Map tests to BrowserStack TM cases
- Triage failures, label, and create/link Jira defects

### Developers

- Find root cause quickly with build context and failure signatures
- Access BrowserStack video/logs/HAR evidence
- View linked Jira tickets and status
- Comment and collaborate on failures

