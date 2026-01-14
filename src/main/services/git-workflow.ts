/**
 * Git Workflow Utilities
 * 
 * Implements the guided Git workflow rules from docs/git.md:
 * - Protected branch enforcement
 * - Branch naming validation
 * - Commit message formatting
 * - Pre-push safety checks
 */

export interface CommitContext {
  summary: string;
  why: string;
  riskLevel: 'low' | 'medium' | 'high';
  evidence?: string;
  reference?: string;
}

export interface PrePushCheckResult {
  canPush: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Default protected branch patterns
 * - main
 * - master
 * - release/* (optional)
 */
const DEFAULT_PROTECTED_PATTERNS = [
  /^main$/,
  /^master$/,
  /^release\/.*$/,
];

/**
 * Check if a branch name matches protected patterns
 */
export function isProtectedBranch(branchName: string, customPatterns?: RegExp[]): boolean {
  const patterns = customPatterns || DEFAULT_PROTECTED_PATTERNS;
  return patterns.some(pattern => pattern.test(branchName));
}

/**
 * Validate branch name follows qa/<short-description> template
 */
export function validateBranchName(branchName: string): { valid: boolean; error?: string } {
  if (!branchName || branchName.trim().length === 0) {
    return { valid: false, error: 'Branch name is required' };
  }

  // Check for spaces
  if (/\s/.test(branchName)) {
    return { valid: false, error: 'Branch name cannot contain spaces' };
  }

  // Check for special characters (allow hyphens and underscores)
  if (!/^[a-zA-Z0-9_/-]+$/.test(branchName)) {
    return { valid: false, error: 'Branch name can only contain letters, numbers, hyphens, underscores, and forward slashes' };
  }

  // Enforce qa/ prefix for feature branches
  if (!branchName.startsWith('qa/')) {
    return { valid: false, error: 'Feature branches must start with "qa/" prefix (e.g., qa/update-login-tests)' };
  }

  // Ensure there's a description after qa/
  const parts = branchName.split('/');
  if (parts.length < 2 || parts[1].trim().length === 0) {
    return { valid: false, error: 'Branch name must include a description after "qa/" (e.g., qa/update-login-tests)' };
  }

  return { valid: true };
}

/**
 * Generate branch name from short description
 */
export function generateBranchName(description: string): string {
  // Convert to lowercase, replace spaces with hyphens, remove special chars
  const sanitized = description
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `qa/${sanitized}`;
}

/**
 * Format commit message from context
 */
export function formatCommitMessage(context: CommitContext): string {
  let message = `qa: ${context.summary}\n\n`;
  message += `Why: ${context.why}\n`;
  message += `Risk: ${context.riskLevel}`;
  
  if (context.evidence) {
    message += `\nEvidence: ${context.evidence}`;
  }
  
  if (context.reference) {
    message += `\nRefs: ${context.reference}`;
  }
  
  return message;
}

/**
 * Validate commit context
 */
export function validateCommitContext(context: Partial<CommitContext>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!context.summary || context.summary.trim().length === 0) {
    errors.push('Summary is required');
  } else if (context.summary.trim().length < 3) {
    errors.push('Summary must be at least 3 characters long');
  }

  if (!context.why || context.why.trim().length === 0) {
    errors.push('Why field is required');
  } else if (context.why.trim().length < 10) {
    errors.push('Why field must be at least 10 characters long');
  }

  if (!context.riskLevel || !['low', 'medium', 'high'].includes(context.riskLevel)) {
    errors.push('Risk Level is required and must be low, medium, or high');
  }

  // Block low-quality commit messages
  const blockedPatterns = [
    /^wip$/i,
    /^test$/i,
    /^temp$/i,
    /^fix$/i,
    /^update$/i,
    /^changes$/i,
  ];

  if (context.summary) {
    const summary = context.summary.trim();
    if (blockedPatterns.some(pattern => pattern.test(summary))) {
      errors.push('Commit summary is too generic. Please provide a more descriptive summary.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if diff size requires higher risk level
 */
export async function checkDiffSizeRequiresRisk(repoRoot: string, maxLowRiskLines: number = 100): Promise<boolean> {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // Get diff stats
    const { stdout } = await execAsync('git diff --cached --stat', { cwd: repoRoot });
    
    // Parse total lines changed
    const linesMatch = stdout.match(/(\d+)\s+files? changed[,\s]+(\d+)\s+insertions?[,\s]+(\d+)\s+deletions?/);
    if (linesMatch) {
      const insertions = parseInt(linesMatch[2]) || 0;
      const deletions = parseInt(linesMatch[3]) || 0;
      const totalLines = insertions + deletions;
      return totalLines > maxLowRiskLines;
    }

    return false;
  } catch (error) {
    // If we can't check, don't block
    return false;
  }
}

/**
 * Pre-push safety checks
 */
export async function runPrePushChecks(
  repoRoot: string,
  branchName: string,
  commitContext?: CommitContext
): Promise<PrePushCheckResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    // 1. Check if branch is protected
    if (isProtectedBranch(branchName)) {
      errors.push(`Cannot push to protected branch "${branchName}". Create a feature branch first.`);
    }

    // 2. Check if there are commits to push
    const { stdout: statusOut } = await execAsync('git status --porcelain --branch', { cwd: repoRoot });
    const aheadMatch = statusOut.match(/\[ahead (\d+)\]/);
    const aheadCount = aheadMatch ? parseInt(aheadMatch[1]) : 0;

    if (aheadCount === 0) {
      errors.push('Nothing to push. Your branch is up to date.');
    }

    // 3. Check if commit context is provided (for guided workflow)
    if (!commitContext) {
      warnings.push('No commit context provided. Consider using the guided commit form.');
    } else {
      const validation = validateCommitContext(commitContext);
      if (!validation.valid) {
        errors.push(...validation.errors);
      }
    }

    // 4. Check for unstaged changes
    const { stdout: unstagedOut } = await execAsync('git diff --name-only', { cwd: repoRoot });
    if (unstagedOut.trim()) {
      warnings.push('You have unstaged changes. Consider staging all changes before pushing.');
    }

    // 5. Check for suspicious file types (optional - can be expanded)
    const { stdout: stagedFiles } = await execAsync('git diff --cached --name-only', { cwd: repoRoot });
    const suspiciousExtensions = ['.exe', '.dll', '.so', '.dylib', '.bin'];
    const stagedList = stagedFiles.trim().split('\n').filter((f: string) => f.trim());
    const suspiciousFiles = stagedList.filter((file: string) => 
      suspiciousExtensions.some(ext => file.toLowerCase().endsWith(ext))
    );
    
    if (suspiciousFiles.length > 0) {
      warnings.push(`Suspicious file types detected: ${suspiciousFiles.join(', ')}. Make sure these should be committed.`);
    }

  } catch (error: any) {
    errors.push(`Failed to run pre-push checks: ${error.message}`);
  }

  return {
    canPush: errors.length === 0,
    errors,
    warnings,
  };
}

