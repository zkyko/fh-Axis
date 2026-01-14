# Security

## 1. Threat model (practical)

- renderer must not access secrets

- integration tokens must be encrypted at rest

- all external API calls originate from main process

- minimize storing sensitive evidence locally

## 2. Credential storage

Preferred (Windows):

- Electron safeStorage OR OS keychain (keytar)

- Store per workspace:

  - BrowserStack username/access_key

  - TM credentials if separate

  - Jira token (OAuth or API token)

  - Azure DevOps Personal Access Token (PAT) - stored in `electron-store` (OS-backed encryption)

### Azure DevOps PAT Security

- PAT is stored encrypted in main process only
- Never exposed to renderer process
- Automatically injected into Git URLs for authentication
- PAT is required for:
  - Cloning repositories
  - Pulling changes
  - Pushing commits
  - Fetching repository metadata

### Git Operations Security

- All Git operations execute in main process
- PAT is injected into Git URLs at runtime (never stored in Git config)
- Git commands use `child_process.exec` with proper sanitization
- Repository paths are validated before operations

## 3. Role-based access

Roles:

- QA_ADMIN

- QA_ENGINEER

- DEV

- VIEWER

Enforce:

- UI visibility in renderer

- IPC permission checks in main process (authoritative)

DEV role must not:

- create files

- modify repo

- stage/commit/push

### Git Operation Permissions (Future)

- Role-based access control for Git operations
- QA_ADMIN: Full access (clone, push, commit)
- QA_ENGINEER: Read and commit (no push to main branches)
- DEV: Read-only (view status, no commits)
- VIEWER: No Git access

## 4. Network

- Use HTTPS always

- Centralize HTTP client in main with sane timeouts/retries

- Log redaction for tokens

## 5. Audit log

Store local audit events:

- who created/linked Jira

- who changed triage label/owner

- who created a test template file

## 6. Data retention

- Cache only what you need

- Prefer storing links to BrowserStack evidence instead of downloading artifacts

