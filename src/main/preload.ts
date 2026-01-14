import { contextBridge, ipcRenderer } from 'electron';

// Expose IPC methods to renderer matching the new IPC contract
contextBridge.exposeInMainWorld('electronAPI', {
  // BrowserStack Automate
  'bs-automate:get-projects': () => ipcRenderer.invoke('bs-automate:get-projects'),
  'bs-automate:get-builds': (projectId: string) => ipcRenderer.invoke('bs-automate:get-builds', projectId),
  'bs-automate:get-sessions': (buildId: string) => ipcRenderer.invoke('bs-automate:get-sessions', buildId),
  'bs-automate:get-session-details': (sessionId: string) => ipcRenderer.invoke('bs-automate:get-session-details', sessionId),

  // BrowserStack TM
  'bs-tm:get-projects': () => ipcRenderer.invoke('bs-tm:get-projects'),
  'bs-tm:get-runs': (projectId: string, filters?: any) => ipcRenderer.invoke('bs-tm:get-runs', projectId, filters),
  'bs-tm:get-results': (runId: string) => ipcRenderer.invoke('bs-tm:get-results', runId),
  'bs-tm:get-test-cases': (projectId: string, options?: any) => ipcRenderer.invoke('bs-tm:get-test-cases', projectId, options),
  'bs-tm:create-test-case': (projectId: string, folderId: string, payload: any) => ipcRenderer.invoke('bs-tm:create-test-case', projectId, folderId, payload),
  'bs-tm:update-test-case': (projectId: string, testCaseId: string, payload: any) => ipcRenderer.invoke('bs-tm:update-test-case', projectId, testCaseId, payload),
  'bs-tm:bulk-update-test-cases': (projectId: string, testCaseIds: string[], payload: any, useOperations?: boolean) => ipcRenderer.invoke('bs-tm:bulk-update-test-cases', projectId, testCaseIds, payload, useOperations),
  'bs-tm:delete-test-case': (projectId: string, testCaseId: string) => ipcRenderer.invoke('bs-tm:delete-test-case', projectId, testCaseId),
  'bs-tm:bulk-delete-test-cases': (projectId: string, testCaseIds: string[]) => ipcRenderer.invoke('bs-tm:bulk-delete-test-cases', projectId, testCaseIds),
  'bs-tm:get-test-case-history': (projectId: string, testCaseId: string) => ipcRenderer.invoke('bs-tm:get-test-case-history', projectId, testCaseId),
  'bs-tm:export-bdd-test-cases': (projectId: string, testCaseIds: string[], options?: any) => ipcRenderer.invoke('bs-tm:export-bdd-test-cases', projectId, testCaseIds, options),
  'bs-tm:get-export-status': (exportId: number) => ipcRenderer.invoke('bs-tm:get-export-status', exportId),
  'bs-tm:download-export': (exportId: number) => ipcRenderer.invoke('bs-tm:download-export', exportId),

  // Jira
  'jira:test-connection': () => ipcRenderer.invoke('jira:test-connection'),
  'jira:create-issue': (data: any) => ipcRenderer.invoke('jira:create-issue', data),
  'jira:get-issue': (issueKey: string) => ipcRenderer.invoke('jira:get-issue', issueKey),
  'jira:search-issues': (jql: string) => ipcRenderer.invoke('jira:search-issues', jql),
  'jira:link-test-result': (issueKey: string, testResultId: string) => ipcRenderer.invoke('jira:link-test-result', issueKey, testResultId),

  // Correlation
  'correlation:correlate': (testResultId: string) => ipcRenderer.invoke('correlation:correlate', testResultId),
  'correlation:find-session': (testResultId: string) => ipcRenderer.invoke('correlation:find-session', testResultId),
  'correlation:find-jira': (testResultId: string) => ipcRenderer.invoke('correlation:find-jira', testResultId),

  // Triage
  'triage:save-metadata': (testId: string, metadata: any) => ipcRenderer.invoke('triage:save-metadata', testId, metadata),
  'triage:get-metadata': (testId: string) => ipcRenderer.invoke('triage:get-metadata', testId),

  // Settings
  'settings:get': (key?: string) => ipcRenderer.invoke('settings:get', key),
  'settings:set': (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
  'settings:test-bs-automate': () => ipcRenderer.invoke('settings:test-bs-automate'),
  'settings:test-bs-tm': () => ipcRenderer.invoke('settings:test-bs-tm'),
  'settings:test-jira': () => ipcRenderer.invoke('settings:test-jira'),
  'settings:test-azure': () => ipcRenderer.invoke('settings:test-azure'),

  // Azure DevOps
  'azure:parse-repo-url': (url: string) => ipcRenderer.invoke('azure:parse-repo-url', url),
  'azure:test-connection': () => ipcRenderer.invoke('azure:test-connection'),
  'azure:get-repos': () => ipcRenderer.invoke('azure:get-repos'),
  'azure:get-repo-by-name': (repoName: string) => ipcRenderer.invoke('azure:get-repo-by-name', repoName),
  'azure:get-commits': (repoId: string, branch: string, limit?: number) => ipcRenderer.invoke('azure:get-commits', repoId, branch, limit),
  'azure:get-commit': (repoId: string, commitHash: string) => ipcRenderer.invoke('azure:get-commit', repoId, commitHash),
  'azure:get-branch-info': (repoId: string, branch: string) => ipcRenderer.invoke('azure:get-branch-info', repoId, branch),

  // Repo
  'repo:git-status': (repoRoot: string) => ipcRenderer.invoke('repo:git-status', repoRoot),
  'repo:open-vscode': (repoRoot: string) => ipcRenderer.invoke('repo:open-vscode', repoRoot),
  'repo:create-template': (repoRoot: string, templateId: string, params: any) => ipcRenderer.invoke('repo:create-template', repoRoot, templateId, params),
  'repo:clone': (repoUrl: string, targetDir: string, repoName?: string, repoId?: string) => ipcRenderer.invoke('repo:clone', repoUrl, targetDir, repoName, repoId),
  'repo:pull': (repoRoot: string) => ipcRenderer.invoke('repo:pull', repoRoot),
  'repo:push': (repoRoot: string, branch?: string, commitContext?: any) => ipcRenderer.invoke('repo:push', repoRoot, branch, commitContext),
  'repo:select-directory': () => ipcRenderer.invoke('repo:select-directory'),
  'repo:get-local-path': (repoId?: string, repoName?: string) => ipcRenderer.invoke('repo:get-local-path', repoId, repoName),
  'repo:get-default-workspace': () => ipcRenderer.invoke('repo:get-default-workspace'),
  'repo:set-default-workspace': (workspacePath: string) => ipcRenderer.invoke('repo:set-default-workspace', workspacePath),
  'repo:detect-all-cloned': () => ipcRenderer.invoke('repo:detect-all-cloned'),
  'repo:stage-file': (repoRoot: string, filePath: string) => ipcRenderer.invoke('repo:stage-file', repoRoot, filePath),
  'repo:unstage-file': (repoRoot: string, filePath: string) => ipcRenderer.invoke('repo:unstage-file', repoRoot, filePath),
  'repo:stage-all': (repoRoot: string) => ipcRenderer.invoke('repo:stage-all', repoRoot),
  'repo:commit': (repoRoot: string, messageOrContext: string | any) => ipcRenderer.invoke('repo:commit', repoRoot, messageOrContext),
  'repo:get-branches': (repoRoot: string) => ipcRenderer.invoke('repo:get-branches', repoRoot),
  'repo:create-branch': (repoRoot: string, branchName: string, description?: string) => ipcRenderer.invoke('repo:create-branch', repoRoot, branchName, description),
  'repo:is-protected-branch': (branchName: string) => ipcRenderer.invoke('repo:is-protected-branch', branchName),
  'repo:validate-branch-name': (branchName: string) => ipcRenderer.invoke('repo:validate-branch-name', branchName),
  'repo:generate-branch-name': (description: string) => ipcRenderer.invoke('repo:generate-branch-name', description),
  'repo:switch-branch': (repoRoot: string, branchName: string) => ipcRenderer.invoke('repo:switch-branch', repoRoot, branchName),
  'repo:get-commit-history': (repoRoot: string, limit?: number) => ipcRenderer.invoke('repo:get-commit-history', repoRoot, limit),
  'repo:list-test-files': (repoRoot: string, patterns?: string[]) => ipcRenderer.invoke('repo:list-test-files', repoRoot, patterns),
  'repo:read-file': (repoRoot: string, filePath: string) => ipcRenderer.invoke('repo:read-file', repoRoot, filePath),

  // Azure Pipelines
  'azurePipelines:list': () => ipcRenderer.invoke('azurePipelines:list'),
  'azurePipelines:getPipeline': (pipelineId: number) => ipcRenderer.invoke('azurePipelines:getPipeline', pipelineId),
  'azurePipelines:run': (pipelineId: number, refName: string, runParams: any) => ipcRenderer.invoke('azurePipelines:run', pipelineId, refName, runParams),
  'azurePipelines:getRun': (pipelineId: number, runId: number) => ipcRenderer.invoke('azurePipelines:getRun', pipelineId, runId),
  'azurePipelines:listRuns': (pipelineId?: number, filters?: any) => ipcRenderer.invoke('azurePipelines:listRuns', pipelineId, filters),

  // Runs
  'runs:get': (runId: string) => ipcRenderer.invoke('runs:get', runId),
  'runs:getActive': () => ipcRenderer.invoke('runs:getActive'),
  'runs:getAll': (limit?: number) => ipcRenderer.invoke('runs:getAll', limit),
  'runs:updateStatus': (runId: string, status: string, completedAt?: string) => ipcRenderer.invoke('runs:updateStatus', runId, status, completedAt),

  // Rerun history
  'rerun:saveLink': (link: any) => ipcRenderer.invoke('rerun:saveLink', link),
  'rerun:getHistory': (originalRunId: string) => ipcRenderer.invoke('rerun:getHistory', originalRunId),
  'rerun:getByErrorSignature': (errorSignature: string) => ipcRenderer.invoke('rerun:getByErrorSignature', errorSignature),

  // Updater
  'updater:check': () => ipcRenderer.invoke('updater:check'),
  'updater:download': () => ipcRenderer.invoke('updater:download'),
  'updater:install': () => ipcRenderer.invoke('updater:install'),
  'app:getVersion': () => ipcRenderer.invoke('app:getVersion'),
});

// Expose updater event listener separately (events require different pattern)
contextBridge.exposeInMainWorld('updaterEvents', {
  onEvent: (callback: (event: any) => void) => {
    ipcRenderer.on('updater:event', (_event, data) => callback(data));
    // Return cleanup function
    return () => {
      ipcRenderer.removeAllListeners('updater:event');
    };
  },
});
