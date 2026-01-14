# Data Model (Normalized)

## Principle

Do NOT mirror entire vendor data.

Store only:

- normalized metadata

- correlation links

- workflow state (assignments/labels/comments)

- cached snapshots for performance

## Entities

### Workspace

- id

- name

- integrations (refs)

- repoRoots[]

- roleAssignments[]

### Run

Represents a logical execution run.

- id

- source (TM run id / CI run id / custom)

- createdAt, completedAt

- status

- branch, commitSha (optional)

- environment (optional)

- externalLinks { browserstackRunUrl?, adoBuildUrl? }

### TestResult

- id

- runId

- testName

- status (pass/fail/skipped)

- durationMs

- errorMessage

- errorSignature (hash)

- metadata { tags?, filePath?, tmCaseId? }

### Session (Automate)

- id (browserstack session id)

- runId (optional)

- buildId

- name

- status

- browser/caps

- links { video, console, network, logs, bsSessionUrl }

### TestCase (TM)

- id

- projectId

- title

- priority

- tags

- filePathMapping? (optional)

### Defect (Jira)

- key

- summary

- status

- assignee

- priority

- url

### Link (generic)

- fromType/fromId

- toType/toId

- linkType (e.g., RESULT_TO_SESSION, RESULT_TO_DEFECT, CASE_TO_FILE)

- createdBy

- createdAt

### WorkflowAnnotation

- entityType/entityId (often TestResult or errorSignature cluster)

- triageLabel (product/test/infra/flaky)

- ownerUserId

- comments[]

- auditLog[]

### LocalRepositoryPath

Tracks locally cloned repositories.

- repo_id (PRIMARY KEY)
- repo_name
- local_path
- cloned_at

### AppSettings

Application-level settings.

- key (PRIMARY KEY)
- value

Currently stores:
- `default_workspace_path` - Default directory for cloning repositories

## Indexes (if SQLite)

- TestResult(errorSignature)
- Link(fromType,fromId)
- Link(toType,toId)
- Run(createdAt)
- correlations(automate_session_id)
- correlations(jira_issue_key)
- correlations(azure_commit_hash)
- workflow_log(timestamp)

