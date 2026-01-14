# Guided Git Workflow (QA Hub)

This document defines the **beginner-safe Git workflow** enforced by QA Hub when team members clone, edit, and push automation scripts from Azure DevOps repositories.

QA Hub does **not** replace Git.
It acts as a **guided safety layer** on top of Git to prevent mistakes, standardize contributions, and make automation development safer for users who are not Git experts.

---

## Design Principles

1. **Safe by default**
   - Main branches are always protected
   - Destructive actions are blocked automatically
2. **Guided, not restrictive**
   - Users are led through correct steps instead of raw Git commands
3. **Beginner-friendly**
   - UI avoids advanced Git terminology where possible
4. **Authoritative enforcement**
   - All rules are enforced in the Electron **main process**
5. **Traceability**
   - Every commit must include context explaining *why* a change was made

---

## Important Concept: There Is No “Pull a File”

QA Hub intentionally does **not** support the idea of “pulling a single file”.

Git works at the **repository level**, not the file level.

Correct mental model (which QA Hub enforces):

1. Clone repository (one-time)
2. Sync repository (pull latest changes)
3. Create a feature branch
4. Edit files locally
5. Commit changes with context
6. Push branch
7. Open a Pull Request in Azure DevOps

The QA Hub UI language reflects this model intentionally.

---

## Current Permissions Model (No Accounts Yet)

QA Hub **does not currently implement user accounts or role-based access control**.

All safeguards described in this document are applied **globally** for anyone using the app.

This is intentional:
- The goal is safety and consistency first
- Roles and accounts can be added later without changing the workflow rules

---

## Protected Branch Rules

Certain branches are treated as **protected** and are never writable directly from QA Hub.

### Default protected branches
- `main`
- `master`
- `release/*` (optional)

### Enforcement
- ❌ Commits on protected branches → BLOCKED
- ❌ Pushes to protected branches → BLOCKED
- ✅ Read-only operations (clone, pull, view) are allowed

These rules are enforced **in the main process**, not just in the UI.

---

## Guided Workflow (Step-by-Step)

### Step 1 — Sync Repository
User clicks **Sync Repo**.

QA Hub:
- fetches latest changes
- checks local vs remote status

UI shows:
- Up to date
- Behind (needs pull)
- Ahead (has unpushed commits)

---

### Step 2 — Create Feature Branch (Required)

Users **must** create a branch before editing files.

QA Hub will block edits and commits on protected branches.

#### Branch naming
QA Hub generates branch names automatically using a safe template:

qa/<short-description>

makefile
Copy code

Examples:
qa/update-login-tests
qa/fix-flaky-checkout

yaml
Copy code

Rules:
- No spaces
- No special characters
- Cannot already exist

---

### Step 3 — Edit Files

Users edit files using their local editor.

QA Hub:
- opens the repository in VS Code
- does not modify files directly

All edits happen locally.

---

### Step 4 — Review Changes

QA Hub displays:
- Modified files
- New files
- Deleted files

Users must explicitly choose which files to stage.

Nothing is committed automatically.

---

### Step 5 — Commit (With Required Context)

Commits **cannot be created** without filling out the commit form.

#### Required commit fields
| Field        | Required | Description |
|-------------|----------|-------------|
| Summary     | ✅       | Short description of change |
| Why         | ✅       | Reason for the change |
| Risk Level  | ✅       | low / medium / high |
| Evidence    | ❌       | Optional (pipeline run, logs, etc.) |
| Reference   | ❌       | Jira / ADO ticket (if available) |

#### Generated commit message format
qa: <summary>

Why: <why>
Risk: <risk>
Evidence: <evidence>
Refs: <reference>

yaml
Copy code

#### Validation rules
- Minimum length enforced
- Common low-quality messages blocked (`wip`, `test`, `temp`, etc.)
- Large diffs require `Risk` ≠ `low`

---

### Step 6 — Pre-Push Safety Check

Before pushing, QA Hub runs a **preflight check**.

#### Preflight rules
1. ❌ Branch is protected → BLOCK
2. ❌ No commits to push → BLOCK
3. ❌ Commit context missing → BLOCK
4. ⚠️ Unstaged changes → WARNING
5. ⚠️ Suspicious file types detected → WARNING

Push is enabled **only** if all blocking checks pass.

---

### Step 7 — Push Branch

QA Hub:
- pushes the feature branch to Azure DevOps
- shows clear success or failure feedback
- logs the operation locally

---

### Step 8 — Create Pull Request

After a successful push:
- QA Hub shows a **Create Pull Request** button
- Clicking it opens Azure DevOps with:
  - source branch pre-selected
  - target branch = `main`
  - commit summary pre-filled

QA Hub does **not** merge branches directly.

---

## Guided Mode

QA Hub uses a **guided mode** by default.

In guided mode:
- Raw Git commands are hidden
- Users follow a clear step-by-step flow
- Required context is enforced

This makes QA Hub safe for users who:
- are new to Git
- primarily write automation scripts
- should not worry about Git internals

Advanced/manual Git controls may be added later as an optional mode.

---

## Enforcement Model (Implementation Notes)

All rules are enforced in the **Electron main process**.

The renderer:
- cannot bypass safeguards
- cannot push or commit directly
- cannot modify protected branches

This ensures consistency and safety even if the UI changes.

---

## Data Stored Locally

QA Hub stores minimal metadata locally:

- Protected branch patterns
- Branch naming templates
- Commit context metadata (optional)
- Audit log of Git actions

No credentials or secrets are stored in the renderer.

---

## Why This Matters

This workflow:
- Prevents accidental damage to main branches
- Teaches correct Git habits implicitly
- Improves commit quality and traceability
- Makes automation development safer for non-Git experts
- Scales cleanly across teams

QA Hub becomes both:
- a **tool**
- and a **workflow standard**

---

## Future Enhancements (Out of Scope for Now)

- User accounts and role-based permissions
- Automatic PR creation via Azure DevOps API
- Required reviewers based on file paths
- Commit linting policies per workspace
- Policy export / import

---

## Summary

This document defines how QA Hub turns Git into a **safe, guided experience** without assuming user accounts, roles, or deep Git knowledge.

The focus is:
**safety, clarity, and consistency first**.