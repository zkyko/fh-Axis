/**
 * Type-safe IPC wrapper for Axis
 */
import { getBackend } from './ipc-backend';

export const ipc = {
  // BrowserStack Automate
  bsAutomate: {
    getProjects: (): Promise<any[]> => {
      const backend = getBackend();
      return backend?.['bs-automate:get-projects']() || Promise.resolve([]);
    },
    getBuilds: (projectId?: string): Promise<any[]> => {
      const backend = getBackend();
      return backend?.['bs-automate:get-builds'](projectId) || Promise.resolve([]);
    },
    getSessions: (buildId: string): Promise<any[]> => {
      const backend = getBackend();
      return backend?.['bs-automate:get-sessions'](buildId) || Promise.resolve([]);
    },
    getSessionDetails: (sessionId: string): Promise<any> => {
      const backend = getBackend();
      return backend?.['bs-automate:get-session-details'](sessionId) || Promise.resolve(null);
    },
  },

  // BrowserStack TM
  bsTM: {
    getProjects: (): Promise<any[]> => {
      const backend = getBackend();
      return backend?.['bs-tm:get-projects']() || Promise.resolve([]);
    },
    getRuns: (projectId: string, filters?: any): Promise<any[]> => {
      const backend = getBackend();
      return backend?.['bs-tm:get-runs'](projectId, filters) || Promise.resolve([]);
    },
    getResults: (runId: string): Promise<any[]> => {
      const backend = getBackend();
      return backend?.['bs-tm:get-results'](runId) || Promise.resolve([]);
    },
    getTestCases: (projectId: string, options?: any): Promise<any> => {
      const backend = getBackend();
      return backend?.['bs-tm:get-test-cases'](projectId, options) || Promise.resolve({ success: false, test_cases: [], info: {} });
    },
    createTestCase: (projectId: string, folderId: string, payload: any): Promise<any> => {
      const backend = getBackend();
      return backend?.['bs-tm:create-test-case'](projectId, folderId, payload) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    updateTestCase: (projectId: string, testCaseId: string, payload: any): Promise<any> => {
      const backend = getBackend();
      return backend?.['bs-tm:update-test-case'](projectId, testCaseId, payload) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    bulkUpdateTestCases: (projectId: string, testCaseIds: string[], payload: any, useOperations?: boolean): Promise<any> => {
      const backend = getBackend();
      return backend?.['bs-tm:bulk-update-test-cases'](projectId, testCaseIds, payload, useOperations) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    deleteTestCase: (projectId: string, testCaseId: string): Promise<any> => {
      const backend = getBackend();
      return backend?.['bs-tm:delete-test-case'](projectId, testCaseId) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    bulkDeleteTestCases: (projectId: string, testCaseIds: string[]): Promise<any> => {
      const backend = getBackend();
      return backend?.['bs-tm:bulk-delete-test-cases'](projectId, testCaseIds) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    getTestCaseHistory: (projectId: string, testCaseId: string): Promise<any> => {
      const backend = getBackend();
      return backend?.['bs-tm:get-test-case-history'](projectId, testCaseId) || Promise.resolve({ history: [], info: {} });
    },
    exportBDDTestCases: (projectId: string, testCaseIds: string[], options?: any): Promise<any> => {
      const backend = getBackend();
      return backend?.['bs-tm:export-bdd-test-cases'](projectId, testCaseIds, options) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    getExportStatus: (exportId: number): Promise<any> => {
      const backend = getBackend();
      return backend?.['bs-tm:get-export-status'](exportId) || Promise.resolve({ success: false, status: 'failed' });
    },
    downloadExport: (exportId: number): Promise<any> => {
      const backend = getBackend();
      return backend?.['bs-tm:download-export'](exportId) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
  },

  // Jira
  jira: {
    testConnection: (): Promise<boolean> => {
      const backend = getBackend();
      return backend?.['jira:test-connection']() || Promise.resolve(false);
    },
    createIssue: (data: any): Promise<any> => {
      const backend = getBackend();
      return backend?.['jira:create-issue'](data) || Promise.resolve(null);
    },
    getIssue: (issueKey: string): Promise<any> => {
      const backend = getBackend();
      return backend?.['jira:get-issue'](issueKey) || Promise.resolve(null);
    },
    searchIssues: (jql: string): Promise<any[]> => {
      const backend = getBackend();
      return backend?.['jira:search-issues'](jql) || Promise.resolve([]);
    },
    linkTestResult: (issueKey: string, testResultId: string): Promise<void> => {
      const backend = getBackend();
      return backend?.['jira:link-test-result'](issueKey, testResultId) || Promise.resolve();
    },
    prepareBugDraft: (args: { failureInput: { type: 'build' | 'session' | 'tm'; id: string; projectId?: string }; preferredSessionId?: string }): Promise<{ ctx: any; draft: { summary: string; description: string; labels: string[] }; sessionChoices?: Array<{ label: string; sessionId: string; sessionUrl?: string; status?: string }> }> => {
      const backend = getBackend();
      return backend?.['jira:prepare-bug-draft'](args) || Promise.reject(new Error('Backend not available'));
    },
    createIssueFromDraft: (args: { draft: { summary: string; description: string; labels: string[] }; fields?: { projectKey: string; issueType?: string; priority?: string; assignee?: string; component?: string } }): Promise<{ key: string; url: string }> => {
      const backend = getBackend();
      return backend?.['jira:create-issue-from-draft'](args) || Promise.reject(new Error('Backend not available'));
    },
  },

  // Correlation
  correlation: {
    correlate: (testResultId: string): Promise<any> => {
      const backend = getBackend();
      return backend?.['correlation:correlate'](testResultId) || Promise.resolve(null);
    },
    findSession: (testResultId: string): Promise<any | null> => {
      const backend = getBackend();
      return backend?.['correlation:find-session'](testResultId) || Promise.resolve(null);
    },
    findJira: (testResultId: string): Promise<any | null> => {
      const backend = getBackend();
      return backend?.['correlation:find-jira'](testResultId) || Promise.resolve(null);
    },
  },

  // Triage
  triage: {
    saveMetadata: (testId: string, metadata: any): Promise<void> => {
      const backend = getBackend();
      return backend?.['triage:save-metadata'](testId, metadata) || Promise.resolve();
    },
    getMetadata: (testId: string): Promise<any> => {
      const backend = getBackend();
      return backend?.['triage:get-metadata'](testId) || Promise.resolve(null);
    },
  },

  // Settings
  settings: {
    get: (key?: string): Promise<any> => {
      const backend = getBackend();
      return backend?.['settings:get'](key) || Promise.resolve(null);
    },
    set: (key: string, value: any): Promise<void> => {
      const backend = getBackend();
      return backend?.['settings:set'](key, value) || Promise.resolve();
    },
    testBSAutomate: (): Promise<boolean> => {
      const backend = getBackend();
      return backend?.['settings:test-bs-automate']() || Promise.resolve(false);
    },
    testBSTM: (): Promise<boolean> => {
      const backend = getBackend();
      return backend?.['settings:test-bs-tm']() || Promise.resolve(false);
    },
    testJira: (): Promise<boolean> => {
      const backend = getBackend();
      return backend?.['settings:test-jira']() || Promise.resolve(false);
    },
    testAzure: (): Promise<boolean> => {
      const backend = getBackend();
      return backend?.['settings:test-azure']() || Promise.resolve(false);
    },
  },

  // Azure DevOps
  azure: {
    parseRepoUrl: (url: string): Promise<any> => {
      const backend = getBackend();
      return backend?.['azure:parse-repo-url'](url) || Promise.resolve(null);
    },
    testConnection: (): Promise<boolean> => {
      const backend = getBackend();
      return backend?.['azure:test-connection']() || Promise.resolve(false);
    },
    getRepos: (): Promise<any[]> => {
      const backend = getBackend();
      return backend?.['azure:get-repos']() || Promise.resolve([]);
    },
    getRepoByName: (repoName: string): Promise<any | null> => {
      const backend = getBackend();
      return backend?.['azure:get-repo-by-name'](repoName) || Promise.resolve(null);
    },
    getCommits: (repoId: string, branch: string, limit?: number): Promise<any[]> => {
      const backend = getBackend();
      return backend?.['azure:get-commits'](repoId, branch, limit) || Promise.resolve([]);
    },
    getCommit: (repoId: string, commitHash: string): Promise<any | null> => {
      const backend = getBackend();
      return backend?.['azure:get-commit'](repoId, commitHash) || Promise.resolve(null);
    },
    getBranchInfo: (repoId: string, branch: string): Promise<any | null> => {
      const backend = getBackend();
      return backend?.['azure:get-branch-info'](repoId, branch) || Promise.resolve(null);
    },
  },

  // Repo
  repo: {
    gitStatus: (repoRoot: string): Promise<any> => {
      const backend = getBackend();
      return backend?.['repo:git-status'](repoRoot) || Promise.resolve(null);
    },
    openVSCode: (repoRoot: string): Promise<void> => {
      const backend = getBackend();
      return backend?.['repo:open-vscode'](repoRoot) || Promise.resolve();
    },
    createTemplate: (repoRoot: string, templateId: string, params: any): Promise<any> => {
      const backend = getBackend();
      return backend?.['repo:create-template'](repoRoot, templateId, params) || Promise.resolve(null);
    },
    clone: (repoUrl: string, targetDir: string, repoName?: string, repoId?: string): Promise<{ success: boolean; message?: string; error?: string; output?: string; stderr?: string; path?: string }> => {
      const backend = getBackend();
      return backend?.['repo:clone'](repoUrl, targetDir, repoName, repoId) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    pull: (repoRoot: string): Promise<{ success: boolean; message?: string; error?: string; output?: string; stderr?: string }> => {
      const backend = getBackend();
      return backend?.['repo:pull'](repoRoot) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    push: (repoRoot: string, branch?: string, commitContext?: any): Promise<{ success: boolean; message?: string; error?: string; output?: string; stderr?: string; warnings?: string[] }> => {
      const backend = getBackend();
      return backend?.['repo:push'](repoRoot, branch, commitContext) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    selectDirectory: (): Promise<string | null> => {
      const backend = getBackend();
      return backend?.['repo:select-directory']() || Promise.resolve(null);
    },
    getLocalPath: (repoId?: string, repoName?: string): Promise<string | null> => {
      const backend = getBackend();
      return backend?.['repo:get-local-path'](repoId, repoName) || Promise.resolve(null);
    },
    getDefaultWorkspace: (): Promise<string | null> => {
      const backend = getBackend();
      return backend?.['repo:get-default-workspace']() || Promise.resolve(null);
    },
    setDefaultWorkspace: (workspacePath: string): Promise<{ success: boolean; error?: string }> => {
      const backend = getBackend();
      return backend?.['repo:set-default-workspace'](workspacePath) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    detectAllCloned: (): Promise<Array<{ repoId: string; repoName: string; localPath: string; status: { ahead: number; behind: number; needsUpdate: boolean; hasUnpushedCommits: boolean } }>> => {
      const backend = getBackend();
      return backend?.['repo:detect-all-cloned']() || Promise.resolve([]);
    },
    stageFile: (repoRoot: string, filePath: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      const backend = getBackend();
      return backend?.['repo:stage-file'](repoRoot, filePath) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    unstageFile: (repoRoot: string, filePath: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      const backend = getBackend();
      return backend?.['repo:unstage-file'](repoRoot, filePath) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    stageAll: (repoRoot: string): Promise<{ success: boolean; message?: string; error?: string }> => {
      const backend = getBackend();
      return backend?.['repo:stage-all'](repoRoot) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    commit: (repoRoot: string, messageOrContext: string | any): Promise<{ success: boolean; message?: string; error?: string; output?: string; stderr?: string; errors?: string[] }> => {
      const backend = getBackend();
      return backend?.['repo:commit'](repoRoot, messageOrContext) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    getBranches: (repoRoot: string): Promise<{ local: string[]; remote: string[]; current: string }> => {
      const backend = getBackend();
      return backend?.['repo:get-branches'](repoRoot) || Promise.resolve({ local: [], remote: [], current: '' });
    },
    createBranch: (repoRoot: string, branchName: string, description?: string): Promise<{ success: boolean; message?: string; error?: string; output?: string; stderr?: string }> => {
      const backend = getBackend();
      return backend?.['repo:create-branch'](repoRoot, branchName, description) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    isProtectedBranch: (branchName: string): Promise<{ isProtected: boolean }> => {
      const backend = getBackend();
      return backend?.['repo:is-protected-branch'](branchName) || Promise.resolve({ isProtected: false });
    },
    validateBranchName: (branchName: string): Promise<{ valid: boolean; error?: string }> => {
      const backend = getBackend();
      return backend?.['repo:validate-branch-name'](branchName) || Promise.resolve({ valid: false, error: 'Backend not available' });
    },
    generateBranchName: (description: string): Promise<{ branchName: string }> => {
      const backend = getBackend();
      return backend?.['repo:generate-branch-name'](description) || Promise.resolve({ branchName: '' });
    },
    switchBranch: (repoRoot: string, branchName: string): Promise<{ success: boolean; message?: string; error?: string; output?: string; stderr?: string }> => {
      const backend = getBackend();
      return backend?.['repo:switch-branch'](repoRoot, branchName) || Promise.resolve({ success: false, error: 'Backend not available' });
    },
    getCommitHistory: (repoRoot: string, limit?: number): Promise<Array<{ hash: string; author: string; email: string; date: string; message: string }>> => {
      const backend = getBackend();
      return backend?.['repo:get-commit-history'](repoRoot, limit) || Promise.resolve([]);
    },
    listTestFiles: (repoRoot: string, patterns?: string[]): Promise<Array<{ path: string; relativePath: string; name: string; size: number }>> => {
      const backend = getBackend();
      return backend?.['repo:list-test-files'](repoRoot, patterns) || Promise.resolve([]);
    },
    readFile: (repoRoot: string, filePath: string): Promise<string> => {
      const backend = getBackend();
      return backend?.['repo:read-file'](repoRoot, filePath) || Promise.resolve('');
    },
  },

  // Azure Pipelines
  azurePipelines: {
    list: (): Promise<Array<{ id: number; name: string; folder?: string; url: string; revision?: number }>> => {
      const backend = getBackend();
      return backend?.['azurePipelines:list']() || Promise.resolve([]);
    },
    getPipeline: (pipelineId: number): Promise<{ id: number; name: string; folder?: string; url: string; revision?: number } | null> => {
      const backend = getBackend();
      return backend?.['azurePipelines:getPipeline'](pipelineId) || Promise.resolve(null);
    },
    run: (pipelineId: number, refName: string, runParams: any): Promise<any> => {
      const backend = getBackend();
      return backend?.['azurePipelines:run'](pipelineId, refName, runParams) || Promise.resolve(null);
    },
    getRun: (pipelineId: number, runId: number): Promise<any> => {
      const backend = getBackend();
      return backend?.['azurePipelines:getRun'](pipelineId, runId) || Promise.resolve(null);
    },
    listRuns: (pipelineId?: number, filters?: any): Promise<any[]> => {
      const backend = getBackend();
      return backend?.['azurePipelines:listRuns'](pipelineId, filters) || Promise.resolve([]);
    },
  },

  // Runs
  runs: {
    get: (runId: string): Promise<any> => {
      const backend = getBackend();
      return backend?.['runs:get'](runId) || Promise.resolve(null);
    },
    getActive: (): Promise<any[]> => {
      const backend = getBackend();
      return backend?.['runs:getActive']() || Promise.resolve([]);
    },
    getAll: (limit?: number): Promise<any[]> => {
      const backend = getBackend();
      return backend?.['runs:getAll'](limit) || Promise.resolve([]);
    },
    updateStatus: (runId: string, status: string, completedAt?: string): Promise<{ success: boolean; error?: string }> => {
      const backend = getBackend();
      return backend?.['runs:updateStatus'](runId, status, completedAt) || Promise.resolve({ success: false });
    },
  },

  // Rerun history
  rerun: {
    saveLink: (link: any): Promise<{ success: boolean; error?: string }> => {
      const backend = getBackend();
      return backend?.['rerun:saveLink'](link) || Promise.resolve({ success: false });
    },
    getHistory: (originalRunId: string): Promise<any[]> => {
      const backend = getBackend();
      return backend?.['rerun:getHistory'](originalRunId) || Promise.resolve([]);
    },
    getByErrorSignature: (errorSignature: string): Promise<any[]> => {
      const backend = getBackend();
      return backend?.['rerun:getByErrorSignature'](errorSignature) || Promise.resolve([]);
    },
  },

  // Updater
  updater: {
    check: (): Promise<void> => {
      const backend = getBackend();
      return backend?.['updater:check']() || Promise.resolve();
    },
    download: (): Promise<void> => {
      const backend = getBackend();
      return backend?.['updater:download']() || Promise.resolve();
    },
    install: (): Promise<void> => {
      const backend = getBackend();
      return backend?.['updater:install']() || Promise.resolve();
    },
  },

  // App
  app: {
    getVersion: (): Promise<string> => {
      const backend = getBackend();
      return backend?.['app:getVersion']() || Promise.resolve('1.0.0');
    },
  },
};

