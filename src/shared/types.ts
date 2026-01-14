// Shared types between main and renderer

export type UserRole = 'QA_ADMIN' | 'QA_ENGINEER' | 'DEV' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Workspace {
  id: string;
  name: string;
  integrations: IntegrationRef[];
  repoRoots: string[];
  roleAssignments: RoleAssignment[];
}

export interface IntegrationRef {
  type: 'browserstack' | 'jira' | 'ado';
  id: string;
}

export interface RoleAssignment {
  userId: string;
  role: UserRole;
}

export interface Run {
  id: string;
  source?: string; // Legacy field, kept for compatibility
  adoPipelineId?: string;
  adoRunId?: string;
  adoRunUrl?: string;
  correlationKey?: string;
  requestedScope?: 'all' | 'file' | 'tag' | 'grep';
  testFile?: string;
  testTag?: string;
  testGrep?: string;
  repoId?: string;
  createdAt: string;
  completedAt?: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  branch?: string;
  commitSha?: string;
  environment?: string;
  externalLinks?: {
    browserstackRunUrl?: string;
    adoBuildUrl?: string;
  };
}

export interface TestResult {
  id: string;
  runId: string;
  testName: string;
  status: 'pass' | 'fail' | 'skipped';
  durationMs: number;
  errorMessage?: string;
  errorSignature?: string;
  metadata?: {
    tags?: string[];
    filePath?: string;
    tmCaseId?: string;
  };
}

export interface Session {
  id: string;
  runId?: string;
  buildId: string;
  name: string;
  status: string;
  browser?: string;
  caps?: Record<string, any>;
  links?: {
    video?: string;
    console?: string;
    network?: string;
    logs?: string;
    bsSessionUrl?: string;
  };
}

export interface TestCase {
  id: string;
  projectId: string;
  title: string;
  priority?: string;
  tags?: string[];
  filePathMapping?: string;
}

export interface Defect {
  key: string;
  summary: string;
  status: string;
  assignee?: string;
  priority?: string;
  url: string;
}

export type TriageLabel = 'product' | 'test' | 'infra' | 'flaky';

export interface WorkflowAnnotation {
  entityType: string;
  entityId: string;
  triageLabel?: TriageLabel;
  ownerUserId?: string;
  comments: Comment[];
  auditLog: AuditLogEntry[];
}

export interface Comment {
  id: string;
  text: string;
  userId: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  userId: string;
  timestamp: string;
  details?: Record<string, any>;
}

// Jira Bug Creation Types
export type FailureContextInput =
  | { type: 'build'; id: string }
  | { type: 'session'; id: string }
  | { type: 'tm'; projectId: string; id: string };

export interface SessionChoice {
  label: string;
  sessionId: string;
  sessionUrl?: string;
  status?: string;
}

export interface FailureContext {
  source: 'automate' | 'tm';
  createdAt: string; // ISO
  axisRunId?: string;

  test?: {
    name?: string;
    id?: string;
    filePath?: string;
    tags?: string[];
  };

  automate?: {
    buildName?: string;
    buildHashedId?: string;
    buildUrl?: string;

    sessionName?: string;
    sessionHashedId?: string;
    sessionUrl?: string;

    status?: string;
    durationSec?: number;

    caps?: {
      os?: string;
      osVersion?: string;
      browser?: string;
      browserVersion?: string;
      device?: string;
      realMobile?: boolean;
    };

    artifacts?: {
      videoUrl?: string;
      logsUrl?: string;
      consoleUrl?: string;
      networkUrl?: string; // HAR if available
      screenshotUrl?: string;
    };

    evidenceFlags?: {
      hasVideo: boolean;
      hasLogs: boolean;
      hasConsole: boolean;
      hasNetwork: boolean;
      hasScreenshot: boolean;
    };

    error?: {
      message?: string;
      stack?: string;
    };
  };

  ado?: {
    pipelineRunId?: string;
    pipelineRunUrl?: string;
    repo?: string;
    branch?: string;
    commit?: string;
  };
}

export interface JiraDraft {
  summary: string;
  description: string;
  labels: string[];
}

