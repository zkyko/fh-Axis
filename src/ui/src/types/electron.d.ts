// Type definitions for Electron API exposed via preload

export interface ElectronAPI {
  // BrowserStack Automate
  'bs-automate:get-projects': () => Promise<any[]>;
  'bs-automate:get-builds': (projectId: string) => Promise<any[]>;
  'bs-automate:get-sessions': (buildId: string) => Promise<any[]>;
  'bs-automate:get-session-details': (sessionId: string) => Promise<any>;

  // BrowserStack TM
  'bs-tm:get-projects': () => Promise<any[]>;
  'bs-tm:get-runs': (projectId: string, filters?: any) => Promise<any[]>;
  'bs-tm:get-results': (runId: string) => Promise<any[]>;
  'bs-tm:get-test-cases': (projectId: string, options?: any) => Promise<any>;
  'bs-tm:create-test-case': (projectId: string, folderId: string, payload: any) => Promise<any>;
  'bs-tm:update-test-case': (projectId: string, testCaseId: string, payload: any) => Promise<any>;
  'bs-tm:bulk-update-test-cases': (projectId: string, testCaseIds: string[], payload: any, useOperations?: boolean) => Promise<any>;
  'bs-tm:delete-test-case': (projectId: string, testCaseId: string) => Promise<any>;
  'bs-tm:bulk-delete-test-cases': (projectId: string, testCaseIds: string[]) => Promise<any>;
  'bs-tm:get-test-case-history': (projectId: string, testCaseId: string) => Promise<any>;
  'bs-tm:export-bdd-test-cases': (projectId: string, testCaseIds: string[], options?: any) => Promise<any>;
  'bs-tm:get-export-status': (exportId: number) => Promise<any>;
  'bs-tm:download-export': (exportId: number) => Promise<any>;

  // Jira
  'jira:test-connection': () => Promise<boolean>;
  'jira:create-issue': (data: any) => Promise<any>;
  'jira:get-issue': (issueKey: string) => Promise<any>;
  'jira:search-issues': (jql: string) => Promise<any[]>;
  'jira:link-test-result': (issueKey: string, testResultId: string) => Promise<void>;
  'jira:prepare-bug-draft': (args: { failureInput: { type: 'build' | 'session' | 'tm'; id: string; projectId?: string }; preferredSessionId?: string }) => Promise<{ ctx: any; draft: { summary: string; description: string; labels: string[] }; sessionChoices?: Array<{ label: string; sessionId: string; sessionUrl?: string; status?: string }> }>;
  'jira:create-issue-from-draft': (args: { draft: { summary: string; description: string; labels: string[] }; fields?: { projectKey: string; issueType?: string; priority?: string; assignee?: string; component?: string } }) => Promise<{ key: string; url: string }>;

  // Correlation
  'correlation:correlate': (testResultId: string) => Promise<any>;
  'correlation:find-session': (testResultId: string) => Promise<any | null>;
  'correlation:find-jira': (testResultId: string) => Promise<any | null>;

  // Triage
  'triage:save-metadata': (testId: string, metadata: any) => Promise<void>;
  'triage:get-metadata': (testId: string) => Promise<any>;

  // Settings
  'settings:get': (key?: string) => Promise<any>;
  'settings:set': (key: string, value: any) => Promise<void>;
  'settings:test-bs-automate': () => Promise<boolean>;
  'settings:test-bs-tm': () => Promise<boolean>;
  'settings:test-jira': () => Promise<boolean>;
  'settings:test-azure': () => Promise<boolean>;

  // Azure DevOps
  'azure:parse-repo-url': (url: string) => Promise<any>;
  'azure:test-connection': () => Promise<boolean>;
  'azure:get-repos': () => Promise<any[]>;
  'azure:get-repo-by-name': (repoName: string) => Promise<any | null>;
  'azure:get-commits': (repoId: string, branch: string, limit?: number) => Promise<any[]>;
  'azure:get-commit': (repoId: string, commitHash: string) => Promise<any | null>;
  'azure:get-branch-info': (repoId: string, branch: string) => Promise<any | null>;

  // Repo
  'repo:git-status': (repoRoot: string) => Promise<any>;
  'repo:open-vscode': (repoRoot: string) => Promise<void>;
  'repo:create-template': (repoRoot: string, templateId: string, params: any) => Promise<any>;
  'repo:clone': (repoUrl: string, targetDir: string, repoName?: string, repoId?: string) => Promise<{ success: boolean; message?: string; error?: string; output?: string; stderr?: string; path?: string }>;
  'repo:pull': (repoRoot: string) => Promise<{ success: boolean; message?: string; error?: string; output?: string; stderr?: string }>;
  'repo:push': (repoRoot: string, branch?: string) => Promise<{ success: boolean; message?: string; error?: string; output?: string; stderr?: string }>;
  'repo:select-directory': () => Promise<string | null>;
  'repo:get-local-path': (repoId?: string, repoName?: string) => Promise<string | null>;
  'repo:get-default-workspace': () => Promise<string | null>;
  'repo:set-default-workspace': (workspacePath: string) => Promise<{ success: boolean; error?: string }>;
  'repo:detect-all-cloned': () => Promise<Array<{ repoId: string; repoName: string; localPath: string; status: { ahead: number; behind: number; needsUpdate: boolean; hasUnpushedCommits: boolean } }>>;
  'repo:stage-file': (repoRoot: string, filePath: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  'repo:unstage-file': (repoRoot: string, filePath: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  'repo:stage-all': (repoRoot: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  'repo:commit': (repoRoot: string, message: string) => Promise<{ success: boolean; message?: string; error?: string; output?: string; stderr?: string }>;
  'repo:get-branches': (repoRoot: string) => Promise<{ local: string[]; remote: string[]; current: string }>;
  'repo:create-branch': (repoRoot: string, branchName: string) => Promise<{ success: boolean; message?: string; error?: string; output?: string; stderr?: string }>;
  'repo:switch-branch': (repoRoot: string, branchName: string) => Promise<{ success: boolean; message?: string; error?: string; output?: string; stderr?: string }>;
  'repo:get-commit-history': (repoRoot: string, limit?: number) => Promise<Array<{ hash: string; author: string; email: string; date: string; message: string }>>;

  // Updater
  'updater:check': () => Promise<void>;
  'updater:download': () => Promise<void>;
  'updater:install': () => Promise<void>;
  'app:getVersion': () => Promise<string>;
}

export interface UpdaterEventsAPI {
  onEvent: (callback: (event: { type: string; data?: any }) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    updaterEvents?: UpdaterEventsAPI;
  }
}
