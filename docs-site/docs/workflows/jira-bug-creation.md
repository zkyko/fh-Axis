# Jira Bug Creation Workflow

## Overview

QA Hub provides a structured workflow for creating Jira defects from test failures. The workflow ensures that every defect includes relevant evidence and context.

## Workflow Steps

### 1. Failure Context

When a test fails, QA Hub builds a **FailureContext** that includes:

- **Test information** - Test name, project, run details
- **Execution evidence** - BrowserStack session links, artifacts (videos, logs, screenshots)
- **Correlation data** - Related commits, branches, previous failures
- **Error details** - Error message, stack trace (if available)

### 2. Draft Preparation

The `jira:prepare-bug-draft` IPC channel creates a structured draft from the failure context:

- **Summary** - Auto-generated from test name and error
- **Description** - Structured format with:
  - Test details
  - Error information
  - Evidence links (BrowserStack session, videos, logs)
  - Related commits (if available)
- **Labels** - Auto-suggested labels (e.g., `axis`, `automation`, `browserstack`)

### 3. Review and Edit

The draft is presented in the UI where you can:
- Review the auto-generated content
- Edit summary and description
- Add or remove labels
- Select additional evidence (if multiple sessions are available)

### 4. Create Issue

Once the draft is finalized, use `jira:create-issue-from-draft` to create the Jira issue with:

- **Project key** - Target Jira project
- **Issue type** - Typically "Bug"
- **Summary** - From the draft
- **Description** - From the draft (includes evidence links)
- **Labels** - From the draft
- **Priority** - Optional
- **Assignee** - Optional
- **Component** - Optional (can be auto-filled based on rules)

### 5. Link to Test Result

After creation, the issue is automatically linked to the test result for future correlation.

## V1 Scope Limitations

**Note:** The initial version (V1) has the following limitations:

- **No stack parsing** - Stack traces are included as-is, not parsed or formatted
- **Basic evidence links** - Links to BrowserStack sessions and artifacts, but no inline screenshots
- **Simple correlation** - Links to commits are included, but no deep code analysis

Future versions may include:
- Stack trace parsing and formatting
- Inline evidence (embedded screenshots, formatted logs)
- Code change analysis
- Similar issue detection

## Evidence Links

The bug description includes links to:

1. **BrowserStack Session** - Direct link to the session in BrowserStack Automate
2. **Video Recording** - Link to session video (if available)
3. **Console Logs** - Link to console output
4. **Network Logs (HAR)** - Link to network request log (if available)
5. **Screenshots** - Links to failure screenshots (if available)
6. **Azure Commits** - Links to related commits (if correlated)

## Example Draft Structure

```
Summary: [Test Name] failed: [Error Message]

Description:

## Test Details
- **Test:** [Test Name]
- **Project:** [Project Name]
- **Run:** [Run Name/ID]
- **Status:** Failed

## Error Information
[Error Message]

[Stack Trace - if available]

## Evidence
- **BrowserStack Session:** [Session Link]
- **Video:** [Video Link]
- **Console Logs:** [Logs Link]

## Related Information
- **Commit:** [Commit Hash] - [Commit Message]
- **Branch:** [Branch Name]

## Labels
axis, automation, browserstack
```

## Best Practices

1. **Review the draft** - Always review auto-generated content before creating the issue
2. **Add context** - Include any additional context that might help developers debug
3. **Select relevant evidence** - If multiple sessions are available, select the most relevant one
4. **Use consistent labels** - Follow team labeling conventions
5. **Link to commits** - If the failure is related to recent code changes, ensure commits are linked

## Troubleshooting

### Draft Generation Fails

- Check that BrowserStack Automate credentials are configured
- Verify that the session ID is valid
- Ensure test result data is available

### Issue Creation Fails

- Verify Jira credentials are configured correctly
- Check that the project key exists
- Ensure you have permission to create issues in the project
- Verify that required fields are provided

### Evidence Links Don't Work

- Check that BrowserStack session is still accessible
- Verify that artifacts are available (some may expire)
- Ensure you have access to the BrowserStack session

