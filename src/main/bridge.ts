import { ipcMain, dialog, BrowserWindow, app } from 'electron';
import Store from 'electron-store';
import { BrowserStackAutomateService } from './services/browserstack-automate';
import { BrowserStackTMService } from './services/browserstack-tm';
import { JiraService } from './services/jira';
import { AzureDevOpsService, parseAzureRepoUrl } from './services/azure-devops';
import { AzurePipelinesService } from './services/azure-pipelines';
import { TestDiscoveryService } from './services/test-discovery';
import { CorrelationEngine } from './services/correlation-engine';
import { RunPoller } from './services/run-poller';
import { StorageService } from './services/storage';
import { WorkspaceService } from './services/workspace';
import { RepoDiscoveryService } from './services/repo-discovery';
import { buildFailureContext } from './services/failure-context-builder';
import { renderDraft } from './services/jira-template-renderer';
import { UpdaterService, UpdaterEvent } from './services/updater';
import { FailureContextInput, JiraDraft } from './types';
import { 
  isProtectedBranch, 
  validateBranchName, 
  generateBranchName,
  formatCommitMessage,
  validateCommitContext,
  runPrePushChecks,
  CommitContext
} from './services/git-workflow';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const execAsync = promisify(exec);

// Initialize services (lazy initialization - don't create StorageService until app is ready)
let storage: StorageService | null = null;
let correlationEngine: CorrelationEngine | null = null;
const settingsStore = new Store();

let automateService: BrowserStackAutomateService | null = null;
let tmService: BrowserStackTMService | null = null;
let jiraService: JiraService | null = null;
let azureService: AzureDevOpsService | null = null;
let azurePipelinesService: AzurePipelinesService | null = null;
let testDiscoveryService: TestDiscoveryService | null = null;
let runPoller: RunPoller | null = null;
let updaterService: UpdaterService | null = null;

// Helper function to get main window for event forwarding
function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows();
  return windows.length > 0 ? windows[0] : null;
}

// Get or create storage service (lazy initialization)
function getStorage(): StorageService {
  if (!storage) {
    storage = new StorageService();
  }
  return storage;
}

// Get or create correlation engine (lazy initialization)
function getCorrelationEngine(): CorrelationEngine {
  if (!correlationEngine) {
    correlationEngine = new CorrelationEngine(getStorage());
  }
  return correlationEngine;
}

// Initialize services from settings
function initializeServices() {
  const engine = getCorrelationEngine();
  
  // BrowserStack Automate credentials from settings
  const bsAutomate = settingsStore.get('browserstack.automate', {}) as any;
  if (bsAutomate.username && bsAutomate.accessKey) {
    automateService = new BrowserStackAutomateService(bsAutomate.username, bsAutomate.accessKey);
    engine.setAutomateService(automateService);
  }

  // BrowserStack TM credentials from settings
  const bsTM = settingsStore.get('browserstack.tm', {}) as any;
  if (bsTM.username && bsTM.accessKey) {
    tmService = new BrowserStackTMService(bsTM.username, bsTM.accessKey);
    engine.setTMService(tmService);
  }

  const jira = settingsStore.get('jira', {}) as any;

  if (jira.baseUrl && jira.email && jira.apiToken) {
    jiraService = new JiraService(jira.baseUrl, jira.email, jira.apiToken);
    engine.setJiraService(jiraService);
  }

  const azure = settingsStore.get('azure', {}) as any;
  if (azure.organization && azure.project && azure.pat) {
    azureService = new AzureDevOpsService(azure.organization, azure.project, azure.pat);
    azurePipelinesService = new AzurePipelinesService(azure.organization, azure.project, azure.pat);
    engine.setAzureService(azureService);
    
    // Initialize and start run poller
    if (!runPoller) {
      runPoller = new RunPoller(getStorage());
      runPoller.setPipelinesService(azurePipelinesService);
      runPoller.setCorrelationEngine(engine);
      runPoller.start();
    }
  }

  // Initialize test discovery service
  testDiscoveryService = new TestDiscoveryService();
}

// Initialize on load
initializeServices();

// Initialize updater service
updaterService = new UpdaterService();
updaterService.on('event', (event: UpdaterEvent) => {
  const mainWindow = getMainWindow();
  if (mainWindow) {
    mainWindow.webContents.send('updater:event', event);
  }
});

// BrowserStack Automate IPC handlers
ipcMain.handle('bs-automate:get-projects', async () => {
  if (!automateService) return [];
  return await automateService.getProjects();
});

ipcMain.handle('bs-automate:get-builds', async (_, projectId?: string) => {
  if (!automateService) return [];
  return await automateService.getBuilds(projectId);
});

ipcMain.handle('bs-automate:get-sessions', async (_, buildId: string) => {
  if (!automateService) return [];
  return await automateService.getSessions(buildId);
});

ipcMain.handle('bs-automate:get-session-details', async (_, sessionId: string) => {
  if (!automateService) return null;
  return await automateService.getSessionDetails(sessionId);
});

// BrowserStack TM IPC handlers
ipcMain.handle('bs-tm:get-projects', async () => {
  if (!tmService) return [];
  return await tmService.getProjects();
});

ipcMain.handle('bs-tm:get-runs', async (_, projectId: string, filters?: any) => {
  if (!tmService) return [];
  return await tmService.getRuns(projectId, filters);
});

ipcMain.handle('bs-tm:get-results', async (_, runId: string) => {
  if (!tmService) return [];
  return await tmService.getResults(runId);
});

// Test Cases IPC handlers
ipcMain.handle('bs-tm:get-test-cases', async (_, projectId: string, options?: any) => {
  if (!tmService) return { success: false, test_cases: [], info: { page: 1, page_size: 30, count: 0, prev: null, next: null } };
  try {
    return await tmService.getTestCases(projectId, options);
  } catch (error: any) {
    console.error('Failed to get test cases:', error);
    return { success: false, test_cases: [], info: { page: 1, page_size: 30, count: 0, prev: null, next: null }, error: error.message };
  }
});

ipcMain.handle('bs-tm:create-test-case', async (_, projectId: string, folderId: string, payload: any) => {
  if (!tmService) return { success: false, error: 'TM service not initialized' };
  try {
    return await tmService.createTestCase(projectId, folderId, payload);
  } catch (error: any) {
    console.error('Failed to create test case:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bs-tm:update-test-case', async (_, projectId: string, testCaseId: string, payload: any) => {
  if (!tmService) return { success: false, error: 'TM service not initialized' };
  try {
    return await tmService.updateTestCase(projectId, testCaseId, payload);
  } catch (error: any) {
    console.error('Failed to update test case:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bs-tm:bulk-update-test-cases', async (_, projectId: string, testCaseIds: string[], payload: any, useOperations?: boolean) => {
  if (!tmService) return { success: false, error: 'TM service not initialized' };
  try {
    return await tmService.bulkUpdateTestCases(projectId, testCaseIds, payload, useOperations);
  } catch (error: any) {
    console.error('Failed to bulk update test cases:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bs-tm:delete-test-case', async (_, projectId: string, testCaseId: string) => {
  if (!tmService) return { success: false, error: 'TM service not initialized' };
  try {
    return await tmService.deleteTestCase(projectId, testCaseId);
  } catch (error: any) {
    console.error('Failed to delete test case:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bs-tm:bulk-delete-test-cases', async (_, projectId: string, testCaseIds: string[]) => {
  if (!tmService) return { success: false, error: 'TM service not initialized' };
  try {
    return await tmService.bulkDeleteTestCases(projectId, testCaseIds);
  } catch (error: any) {
    console.error('Failed to bulk delete test cases:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bs-tm:get-test-case-history', async (_, projectId: string, testCaseId: string) => {
  if (!tmService) return { history: [], info: { page: 1, page_size: 20, count: 0, prev: null, next: null } };
  try {
    return await tmService.getTestCaseHistory(projectId, testCaseId);
  } catch (error: any) {
    console.error('Failed to get test case history:', error);
    return { history: [], info: { page: 1, page_size: 20, count: 0, prev: null, next: null }, error: error.message };
  }
});

ipcMain.handle('bs-tm:export-bdd-test-cases', async (_, projectId: string, testCaseIds: string[], options?: any) => {
  if (!tmService) return { success: false, error: 'TM service not initialized' };
  try {
    return await tmService.exportBDDTestCases(projectId, testCaseIds, options);
  } catch (error: any) {
    console.error('Failed to export BDD test cases:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bs-tm:get-export-status', async (_, exportId: number) => {
  if (!tmService) return { success: false, status: 'failed', error: 'TM service not initialized' };
  try {
    return await tmService.getExportStatus(exportId);
  } catch (error: any) {
    console.error('Failed to get export status:', error);
    return { success: false, status: 'failed', error: error.message };
  }
});

ipcMain.handle('bs-tm:download-export', async (_, exportId: number) => {
  if (!tmService) return { success: false, error: 'TM service not initialized' };
  try {
    const buffer = await tmService.downloadExport(exportId);
    return { success: true, data: buffer.toString('base64') };
  } catch (error: any) {
    console.error('Failed to download export:', error);
    return { success: false, error: error.message };
  }
});

// Jira IPC handlers
ipcMain.handle('jira:test-connection', async () => {
  if (!jiraService) return false;
  return await jiraService.testConnection();
});

ipcMain.handle('jira:create-issue', async (_, data: any) => {
  if (!jiraService) return null;
  return await jiraService.createIssue(data);
});

ipcMain.handle('jira:get-issue', async (_, issueKey: string) => {
  if (!jiraService) return null;
  return await jiraService.getIssue(issueKey);
});

ipcMain.handle('jira:search-issues', async (_, jql: string) => {
  if (!jiraService) return [];
  return await jiraService.searchIssues(jql);
});

ipcMain.handle('jira:link-test-result', async (_, issueKey: string, testResultId: string) => {
  if (!jiraService) return;
  await jiraService.linkTestResult(issueKey, testResultId);
});

ipcMain.handle('jira:prepare-bug-draft', async (_, args: { failureInput: FailureContextInput; preferredSessionId?: string }) => {
  try {
    const { failureInput, preferredSessionId } = args;
    
    // Build failure context
    const { ctx, sessionChoices } = await buildFailureContext(
      failureInput,
      preferredSessionId,
      {
        automateService: automateService || undefined,
        tmService: tmService || undefined,
        azurePipelinesService: azurePipelinesService || undefined,
        azureService: azureService || undefined,
      }
    );

    // Render draft
    const draft = renderDraft(ctx, sessionChoices);

    return {
      ctx,
      draft,
      sessionChoices,
    };
  } catch (error: any) {
    console.error('Failed to prepare bug draft:', error);
    throw new Error(error.message || 'Failed to prepare bug draft');
  }
});

ipcMain.handle('jira:create-issue-from-draft', async (_, args: { draft: JiraDraft; fields?: { projectKey: string; issueType?: string; priority?: string; assignee?: string; component?: string } }) => {
  try {
    if (!jiraService) {
      throw new Error('Jira service not configured');
    }

    const { draft, fields } = args;
    
    if (!fields?.projectKey) {
      throw new Error('Project key is required');
    }

    const issue = await jiraService.createIssue({
      projectKey: fields.projectKey,
      issueType: fields.issueType || 'Bug',
      summary: draft.summary,
      description: draft.description,
      labels: draft.labels,
      priority: fields.priority,
      assignee: fields.assignee,
      component: fields.component,
    });

    if (!issue) {
      throw new Error('Failed to create Jira issue');
    }

    return {
      key: issue.key,
      url: issue.url,
    };
  } catch (error: any) {
    console.error('Failed to create issue from draft:', error);
    throw new Error(error.message || 'Failed to create Jira issue');
  }
});

// Correlation IPC handlers
ipcMain.handle('correlation:correlate', async (_, testResultId: string) => {
  // This would need the full test result object
  // For now, return null
  return null;
});

ipcMain.handle('correlation:find-session', async (_, testResultId: string) => {
  // This would need the test result object
  return null;
});

ipcMain.handle('correlation:find-jira', async (_, testResultId: string) => {
  // This would need the test result object
  return null;
});

// Triage IPC handlers
ipcMain.handle('triage:save-metadata', async (_, testId: string, metadata: any) => {
  await getStorage().saveTriageMetadata({
    testId,
    ...metadata,
    updatedAt: new Date().toISOString(),
  });
});

ipcMain.handle('triage:get-metadata', async (_, testId: string) => {
  return await getStorage().getTriageMetadata(testId);
});

// Settings IPC handlers
ipcMain.handle('settings:get', async (_, key?: string) => {
  if (key) {
    return settingsStore.get(key);
  }
  return settingsStore.store;
});

ipcMain.handle('settings:set', async (_, key: string, value: any) => {
  settingsStore.set(key, value);
  // Reinitialize services if Azure settings changed
  if (key === 'azure') {
    const azure = value as any;
    if (azure.organization && azure.project && azure.pat) {
      azureService = new AzureDevOpsService(azure.organization, azure.project, azure.pat);
      azurePipelinesService = new AzurePipelinesService(azure.organization, azure.project, azure.pat);
      getCorrelationEngine().setAzureService(azureService);
      
      // Reinitialize run poller
      if (runPoller) {
        runPoller.stop();
      }
      runPoller = new RunPoller(getStorage());
      runPoller.setPipelinesService(azurePipelinesService);
      runPoller.setCorrelationEngine(getCorrelationEngine());
      runPoller.start();
    } else {
      azureService = null;
      azurePipelinesService = null;
      if (runPoller) {
        runPoller.stop();
        runPoller = null;
      }
    }
  }
  // Reinitialize services if credentials changed
  if (key.startsWith('browserstack.') || key.startsWith('jira.')) {
    initializeServices();
  }
});

ipcMain.handle('settings:test-bs-automate', async () => {
  const config = settingsStore.get('browserstack.automate', {}) as any;
  if (!config.username || !config.accessKey) return false;
  try {
    const service = new BrowserStackAutomateService(config.username, config.accessKey);
    const projects = await service.getProjects();
    return projects.length >= 0; // Even empty array means connection works
  } catch {
    return false;
  }
});

ipcMain.handle('settings:test-bs-tm', async () => {
  const config = settingsStore.get('browserstack.tm', {}) as any;
  if (!config.username || !config.accessKey) return false;
  try {
    const service = new BrowserStackTMService(config.username, config.accessKey);
    const projects = await service.getProjects();
    return projects.length >= 0;
  } catch {
    return false;
  }
});

ipcMain.handle('settings:test-jira', async () => {
  const config = settingsStore.get('jira', {}) as any;
  if (!config.baseUrl || !config.email || !config.apiToken) return false;
  try {
    const service = new JiraService(config.baseUrl, config.email, config.apiToken);
    return await service.testConnection();
  } catch {
    return false;
  }
});

ipcMain.handle('settings:test-azure', async () => {
  const config = settingsStore.get('azure', {}) as any;
  if (!config.organization || !config.project || !config.pat) return false;
  try {
    const service = new AzureDevOpsService(config.organization, config.project, config.pat);
    return await service.testConnection();
  } catch {
    return false;
  }
});

// Repo IPC handlers
ipcMain.handle('repo:git-status', async (_, repoRoot: string) => {
  try {
    if (!fs.existsSync(path.join(repoRoot, '.git'))) {
      return { branch: 'unknown', staged: [], unstaged: [], untracked: [], ahead: 0, behind: 0 };
    }

    // Get detailed status
    const { stdout } = await execAsync('git status --porcelain --branch', { cwd: repoRoot });
    const lines = stdout.trim().split('\n').filter(l => l.trim());
    
    // Parse branch info
    const branchLine = lines.find((l) => l.startsWith('##'));
    let branch = 'unknown';
    let ahead = 0;
    let behind = 0;
    
    if (branchLine) {
      const branchMatch = branchLine.match(/## (.+?)(?:\.\.\.(.+?))?(?:\s|$)/);
      if (branchMatch) {
        branch = branchMatch[1];
        if (branchMatch[2]) {
          const aheadBehind = branchMatch[2].match(/\[ahead (\d+)(?:, behind (\d+))?\]/);
          if (aheadBehind) {
            ahead = parseInt(aheadBehind[1]) || 0;
            behind = parseInt(aheadBehind[2]) || 0;
          }
        }
      }
    }

    // Parse file status
    // Format: XY filename
    // X = staged status, Y = unstaged status
    const staged: Array<{ file: string; status: string }> = [];
    const unstaged: Array<{ file: string; status: string }> = [];
    const untracked: string[] = [];

    lines.filter(l => !l.startsWith('##')).forEach(line => {
      if (!line.trim()) return;
      
      const status = line.substring(0, 2);
      const file = line.substring(3);
      
      const stagedStatus = status[0];
      const unstagedStatus = status[1];

      // Staged files (X is not space)
      if (stagedStatus !== ' ' && stagedStatus !== '?') {
        staged.push({
          file,
          status: stagedStatus === 'M' ? 'modified' : stagedStatus === 'A' ? 'added' : stagedStatus === 'D' ? 'deleted' : stagedStatus === 'R' ? 'renamed' : 'unknown',
        });
      }

      // Unstaged files (Y is not space)
      if (unstagedStatus !== ' ' && unstagedStatus !== '?') {
        unstaged.push({
          file,
          status: unstagedStatus === 'M' ? 'modified' : unstagedStatus === 'A' ? 'added' : unstagedStatus === 'D' ? 'deleted' : unstagedStatus === 'R' ? 'renamed' : 'unknown',
        });
      }

      // Untracked files
      if (status === '??') {
        untracked.push(file);
      }
    });

    // Get current commit hash
    let currentCommit = '';
    try {
      const { stdout: commitHash } = await execAsync('git rev-parse --short HEAD', { cwd: repoRoot });
      currentCommit = commitHash.trim();
    } catch (e) {
      // Ignore if no commits yet
    }

    return {
      branch,
      staged,
      unstaged,
      untracked,
      ahead,
      behind,
      currentCommit,
    };
  } catch (error) {
    console.error('Failed to get git status:', error);
    return { branch: 'unknown', staged: [], unstaged: [], untracked: [], ahead: 0, behind: 0, currentCommit: '' };
  }
});

ipcMain.handle('repo:open-vscode', async (_, repoRoot: string) => {
  try {
    await execAsync(`code "${repoRoot}"`);
  } catch (error) {
    console.error('Failed to open VS Code:', error);
  }
});

ipcMain.handle('repo:create-template', async (_, repoRoot: string, templateId: string, params: any) => {
  // Template creation logic would go here
  return { success: true, filePath: 'test.spec.ts' };
});

// Git operations
ipcMain.handle('repo:clone', async (_, repoUrl: string, targetDir?: string, repoName?: string, repoId?: string) => {
  try {
    // Get Azure PAT from settings for authentication
    const azure = settingsStore.get('azure', {}) as any;
    if (!azure.pat) {
      throw new Error('Azure Personal Access Token not configured. Please set it in Settings.');
    }

    // Build authenticated URL: https://PAT@dev.azure.com/org/project/_git/repo
    // Or for visualstudio.com: https://PAT@org.visualstudio.com/project/_git/repo
    let authenticatedUrl = repoUrl;
    if (repoUrl.includes('dev.azure.com')) {
      authenticatedUrl = repoUrl.replace('https://', `https://${azure.pat}@`);
    } else if (repoUrl.includes('visualstudio.com')) {
      authenticatedUrl = repoUrl.replace('https://', `https://${azure.pat}@`);
    }

    // Determine target path - use workspace if not specified
    let targetPath: string;
    if (targetDir) {
      targetPath = repoName ? path.join(targetDir, repoName) : targetDir;
    } else {
      // Use workspace directory
      const workspaceService = new WorkspaceService();
      const workspaceRoot = workspaceService.ensureRootExists();
      if (!repoName) {
        throw new Error('Repository name is required when cloning to default workspace');
      }
      targetPath = path.join(workspaceRoot, repoName);
    }

    // Check if directory already exists
    if (fs.existsSync(targetPath)) {
      // Check if it's a git repo
      if (fs.existsSync(path.join(targetPath, '.git'))) {
        // Repo already exists, just return the path
        return { success: true, message: 'Repository already exists locally', path: targetPath, alreadyExists: true };
      } else {
        throw new Error(`Directory ${targetPath} already exists and is not a git repository`);
      }
    }

    // Clone the repository
    const { stdout, stderr } = await execAsync(`git clone "${authenticatedUrl}" "${targetPath}"`, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large repos
    });

    return { success: true, message: 'Repository cloned successfully', output: stdout, path: targetPath };
  } catch (error: any) {
    console.error('Failed to clone repository:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to clone repository',
      stderr: error.stderr || '',
    };
  }
});

ipcMain.handle('repo:pull', async (_, repoRoot: string) => {
  try {
    if (!fs.existsSync(path.join(repoRoot, '.git'))) {
      throw new Error('Not a git repository');
    }

    const { stdout, stderr } = await execAsync('git pull', { 
      cwd: repoRoot,
      maxBuffer: 10 * 1024 * 1024,
    });

    return { success: true, message: 'Pulled successfully', output: stdout };
  } catch (error: any) {
    console.error('Failed to pull:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to pull',
      stderr: error.stderr || '',
    };
  }
});

ipcMain.handle('repo:push', async (_, repoRoot: string, branch?: string, commitContext?: CommitContext) => {
  try {
    if (!fs.existsSync(path.join(repoRoot, '.git'))) {
      throw new Error('Not a git repository');
    }

    // Get current branch if not specified
    let currentBranch = branch;
    if (!currentBranch) {
      try {
        const { stdout: branchOut } = await execAsync('git branch --show-current', { cwd: repoRoot });
        currentBranch = branchOut.trim();
      } catch (e) {
        currentBranch = 'HEAD';
      }
    }

    // Run pre-push safety checks
    const prePushCheck = await runPrePushChecks(repoRoot, currentBranch || 'HEAD', commitContext);
    
    if (!prePushCheck.canPush) {
      return { 
        success: false, 
        error: prePushCheck.errors.join('; '),
        errors: prePushCheck.errors,
        warnings: prePushCheck.warnings
      };
    }

    // Show warnings but don't block
    if (prePushCheck.warnings.length > 0) {
      console.warn('Pre-push warnings:', prePushCheck.warnings);
    }

    // Check if there are commits to push
    const { stdout: statusOut } = await execAsync('git status --porcelain --branch', { cwd: repoRoot });
    const aheadMatch = statusOut.match(/\[ahead (\d+)\]/);
    const aheadCount = aheadMatch ? parseInt(aheadMatch[1]) : 0;

    if (aheadCount === 0) {
      return { success: false, error: 'Nothing to push. Your branch is up to date.' };
    }

    const branchToPush = branch || 'HEAD';
    const { stdout, stderr } = await execAsync(`git push origin ${branchToPush}`, { 
      cwd: repoRoot,
      maxBuffer: 10 * 1024 * 1024,
    });

    return { 
      success: true, 
      message: `Pushed ${aheadCount} commit(s) successfully`, 
      output: stdout,
      warnings: prePushCheck.warnings
    };
  } catch (error: any) {
    console.error('Failed to push:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to push',
      stderr: error.stderr || '',
    };
  }
});

// Git file operations
ipcMain.handle('repo:stage-file', async (_, repoRoot: string, filePath: string) => {
  try {
    if (!fs.existsSync(path.join(repoRoot, '.git'))) {
      throw new Error('Not a git repository');
    }

    const { stdout } = await execAsync(`git add "${filePath}"`, { cwd: repoRoot });
    return { success: true, message: 'File staged successfully' };
  } catch (error: any) {
    console.error('Failed to stage file:', error);
    return { success: false, error: error.message || 'Failed to stage file' };
  }
});

ipcMain.handle('repo:unstage-file', async (_, repoRoot: string, filePath: string) => {
  try {
    if (!fs.existsSync(path.join(repoRoot, '.git'))) {
      throw new Error('Not a git repository');
    }

    const { stdout } = await execAsync(`git reset HEAD "${filePath}"`, { cwd: repoRoot });
    return { success: true, message: 'File unstaged successfully' };
  } catch (error: any) {
    console.error('Failed to unstage file:', error);
    return { success: false, error: error.message || 'Failed to unstage file' };
  }
});

ipcMain.handle('repo:stage-all', async (_, repoRoot: string) => {
  try {
    if (!fs.existsSync(path.join(repoRoot, '.git'))) {
      throw new Error('Not a git repository');
    }

    const { stdout } = await execAsync('git add -A', { cwd: repoRoot });
    return { success: true, message: 'All changes staged successfully' };
  } catch (error: any) {
    console.error('Failed to stage all:', error);
    return { success: false, error: error.message || 'Failed to stage all files' };
  }
});

ipcMain.handle('repo:commit', async (_, repoRoot: string, messageOrContext: string | CommitContext) => {
  try {
    if (!fs.existsSync(path.join(repoRoot, '.git'))) {
      throw new Error('Not a git repository');
    }

    // Get current branch
    let currentBranch = '';
    try {
      const { stdout: branchOut } = await execAsync('git branch --show-current', { cwd: repoRoot });
      currentBranch = branchOut.trim();
    } catch (e) {
      // If we can't get branch, continue (might be in detached HEAD)
    }

    // Check if on protected branch
    if (currentBranch && isProtectedBranch(currentBranch)) {
      return { 
        success: false, 
        error: `Cannot commit directly to protected branch "${currentBranch}". Please create a feature branch first (e.g., qa/your-feature-name).` 
      };
    }

    // Handle both legacy string messages and new structured context
    let commitMessage: string;
    let commitContext: CommitContext | undefined;

    if (typeof messageOrContext === 'string') {
      // Legacy mode: simple string message
      if (!messageOrContext || messageOrContext.trim().length === 0) {
        return { success: false, error: 'Commit message is required' };
      }

      if (messageOrContext.trim().length < 10) {
        return { success: false, error: 'Commit message must be at least 10 characters long' };
      }
      commitMessage = messageOrContext;
    } else {
      // New guided mode: structured context
      commitContext = messageOrContext;
      const validation = validateCommitContext(commitContext);
      if (!validation.valid) {
        return { 
          success: false, 
          error: validation.errors.join('; '),
          errors: validation.errors
        };
      }
      commitMessage = formatCommitMessage(commitContext);
    }

    // Check if there are staged changes
    const { stdout: statusOut } = await execAsync('git diff --cached --name-only', { cwd: repoRoot });
    if (!statusOut.trim()) {
      return { success: false, error: 'No staged changes to commit. Please stage files first.' };
    }

    // Commit with message
    const { stdout, stderr } = await execAsync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { 
      cwd: repoRoot,
      maxBuffer: 10 * 1024 * 1024,
    });

    return { success: true, message: 'Committed successfully', output: stdout, commitContext };
  } catch (error: any) {
    console.error('Failed to commit:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to commit',
      stderr: error.stderr || '',
    };
  }
});

ipcMain.handle('repo:get-branches', async (_, repoRoot: string) => {
  try {
    if (!fs.existsSync(path.join(repoRoot, '.git'))) {
      return { local: [], remote: [], current: '' };
    }

    // Get current branch
    const { stdout: currentBranch } = await execAsync('git branch --show-current', { cwd: repoRoot });
    
    // Get all local branches
    const { stdout: localBranches } = await execAsync('git branch', { cwd: repoRoot });
    const local = localBranches
      .split('\n')
      .filter(b => b.trim())
      .map(b => b.replace(/^\*\s*/, '').trim());

    // Get remote branches
    let remote: string[] = [];
    try {
      const { stdout: remoteBranches } = await execAsync('git branch -r', { cwd: repoRoot });
      remote = remoteBranches
        .split('\n')
        .filter(b => b.trim() && !b.includes('HEAD'))
        .map(b => b.replace(/^origin\//, '').trim());
    } catch (e) {
      // No remote branches
    }

    return {
      local,
      remote,
      current: currentBranch.trim(),
    };
  } catch (error) {
    console.error('Failed to get branches:', error);
    return { local: [], remote: [], current: '' };
  }
});

ipcMain.handle('repo:create-branch', async (_, repoRoot: string, branchName: string, description?: string) => {
  try {
    if (!fs.existsSync(path.join(repoRoot, '.git'))) {
      throw new Error('Not a git repository');
    }

    // If description is provided, generate branch name from it
    let finalBranchName = branchName;
    if (description && !branchName) {
      finalBranchName = generateBranchName(description);
    }

    // Validate branch name (enforces qa/ prefix)
    const validation = validateBranchName(finalBranchName);
    if (!validation.valid) {
      return { success: false, error: validation.error || 'Invalid branch name' };
    }

    // Check if branch already exists
    try {
      const { stdout: existingBranches } = await execAsync('git branch --list', { cwd: repoRoot });
      const branchList = existingBranches.split('\n').map(b => b.replace(/^\*\s*/, '').trim());
      if (branchList.includes(finalBranchName)) {
        return { success: false, error: `Branch "${finalBranchName}" already exists.` };
      }
    } catch (e) {
      // Continue if check fails
    }

    const { stdout } = await execAsync(`git checkout -b "${finalBranchName}"`, { cwd: repoRoot });
    return { success: true, message: `Branch "${finalBranchName}" created and checked out`, output: stdout };
  } catch (error: any) {
    console.error('Failed to create branch:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create branch',
      stderr: error.stderr || '',
    };
  }
});

ipcMain.handle('repo:switch-branch', async (_, repoRoot: string, branchName: string) => {
  try {
    if (!fs.existsSync(path.join(repoRoot, '.git'))) {
      throw new Error('Not a git repository');
    }

    // Check for uncommitted changes
    const { stdout: statusOut } = await execAsync('git status --porcelain', { cwd: repoRoot });
    if (statusOut.trim()) {
      return { 
        success: false, 
        error: 'You have uncommitted changes. Please commit or stash them before switching branches.' 
      };
    }

    const { stdout } = await execAsync(`git checkout "${branchName}"`, { cwd: repoRoot });
    return { success: true, message: `Switched to branch "${branchName}"`, output: stdout };
  } catch (error: any) {
    console.error('Failed to switch branch:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to switch branch',
      stderr: error.stderr || '',
    };
  }
});

ipcMain.handle('repo:get-commit-history', async (_, repoRoot: string, limit: number = 20) => {
  try {
    if (!fs.existsSync(path.join(repoRoot, '.git'))) {
      return [];
    }

    const { stdout } = await execAsync(
      `git log --pretty=format:"%H|%an|%ae|%ad|%s" --date=iso -n ${limit}`,
      { cwd: repoRoot }
    );

    const commits = stdout
      .split('\n')
      .filter(l => l.trim())
      .map(line => {
        const [hash, author, email, date, ...messageParts] = line.split('|');
        return {
          hash,
          author,
          email,
          date,
          message: messageParts.join('|'),
        };
      });

    return commits;
  } catch (error) {
    console.error('Failed to get commit history:', error);
    return [];
  }
});

// Git workflow helpers
ipcMain.handle('repo:is-protected-branch', async (_, branchName: string) => {
  return { isProtected: isProtectedBranch(branchName) };
});

ipcMain.handle('repo:validate-branch-name', async (_, branchName: string) => {
  const validation = validateBranchName(branchName);
  return { valid: validation.valid, error: validation.error };
});

ipcMain.handle('repo:generate-branch-name', async (_, description: string) => {
  return { branchName: generateBranchName(description) };
});

ipcMain.handle('repo:select-directory', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select directory to clone repository',
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  } catch (error) {
    console.error('Failed to select directory:', error);
    return null;
  }
});

ipcMain.handle('repo:get-local-path', async (_, repoId?: string, repoName?: string) => {
  try {
    const workspaceService = new WorkspaceService();
    const workspaceRoot = workspaceService.ensureRootExists();

    // Check workspace directory first (most common case)
    if (repoName) {
      const repoDiscovery = new RepoDiscoveryService();
      const foundPath = await repoDiscovery.findRepoByName(workspaceRoot, repoName);
      if (foundPath) {
        return foundPath;
      }
    }

    // Fallback: Scan all repos in workspace and match by name
    if (repoName) {
      const repoDiscovery = new RepoDiscoveryService();
      const repos = await repoDiscovery.scanRepos(workspaceRoot);
      const matchingRepo = repos.find(r => r.name === repoName);
      if (matchingRepo) {
        return matchingRepo.path;
      }
    }

    // Final fallback: Check common locations (for repos not in workspace)
    if (repoName) {
      const homeDir = os.homedir();
      const commonPaths = [
        path.join(homeDir, repoName),
        path.join(homeDir, 'Documents', repoName),
        path.join(homeDir, 'Desktop', repoName),
        path.join(homeDir, 'Projects', repoName),
        path.join(homeDir, 'projects', repoName),
        path.join(homeDir, 'code', repoName),
      ];

      for (const repoPath of commonPaths) {
        if (fs.existsSync(repoPath) && fs.existsSync(path.join(repoPath, '.git'))) {
          return repoPath;
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to get local repo path:', error);
    return null;
  }
});

ipcMain.handle('repo:get-default-workspace', async () => {
  try {
    const workspaceService = new WorkspaceService();
    const workspacePath = workspaceService.ensureRootExists();
    return workspacePath;
  } catch (error) {
    console.error('Failed to get default workspace:', error);
    return null;
  }
});

ipcMain.handle('repo:set-default-workspace', async (_, workspacePath: string) => {
  try {
    await getStorage().setDefaultWorkspacePath(workspacePath);
    return { success: true };
  } catch (error) {
    console.error('Failed to set default workspace:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('repo:detect-all-cloned', async () => {
  try {
    const workspaceService = new WorkspaceService();
    const workspaceRoot = workspaceService.ensureRootExists();
    
    const repoDiscovery = new RepoDiscoveryService();
    const reposWithStatus = await repoDiscovery.scanReposWithStatus(workspaceRoot);

    // Convert to expected format for backward compatibility
    const detectedRepos = reposWithStatus.map(repo => ({
      repoId: `detected-${repo.name}`,
      repoName: repo.name,
      localPath: repo.path,
      status: repo.status,
    }));

    return detectedRepos;
  } catch (error) {
    console.error('Failed to detect cloned repos:', error);
    return [];
  }
});

// Azure DevOps IPC handlers
ipcMain.handle('azure:parse-repo-url', async (_, url: string) => {
  return parseAzureRepoUrl(url);
});

ipcMain.handle('azure:test-connection', async () => {
  try {
    if (!azureService) {
      // Try to initialize from settings
      const azure = settingsStore.get('azure', {}) as any;
      if (azure.organization && azure.project && azure.pat) {
        azureService = new AzureDevOpsService(azure.organization, azure.project, azure.pat);
      } else {
        return false;
      }
    }
    return await azureService.testConnection();
  } catch {
    return false;
  }
});

ipcMain.handle('azure:get-repos', async () => {
  try {
    if (!azureService) {
      const azure = settingsStore.get('azure', {}) as any;
      if (azure.organization && azure.project && azure.pat) {
        azureService = new AzureDevOpsService(azure.organization, azure.project, azure.pat);
      } else {
        return [];
      }
    }
    return await azureService.getRepositories();
  } catch (error) {
    console.error('Failed to get Azure repos:', error);
    return [];
  }
});

ipcMain.handle('azure:get-repo-by-name', async (_, repoName: string) => {
  try {
    if (!azureService) {
      const azure = settingsStore.get('azure', {}) as any;
      if (azure.organization && azure.project && azure.pat) {
        azureService = new AzureDevOpsService(azure.organization, azure.project, azure.pat);
      } else {
        return null;
      }
    }
    return await azureService.getRepositoryByName(repoName);
  } catch (error) {
    console.error('Failed to get Azure repo by name:', error);
    return null;
  }
});

ipcMain.handle('azure:get-commits', async (_, repoId: string, branch: string, limit?: number) => {
  try {
    if (!azureService) {
      const azure = settingsStore.get('azure', {}) as any;
      if (azure.organization && azure.project && azure.pat) {
        azureService = new AzureDevOpsService(azure.organization, azure.project, azure.pat);
      } else {
        return [];
      }
    }
    return await azureService.getCommits(repoId, branch, limit || 20);
  } catch (error) {
    console.error('Failed to get Azure commits:', error);
    return [];
  }
});

ipcMain.handle('azure:get-commit', async (_, repoId: string, commitHash: string) => {
  try {
    if (!azureService) {
      const azure = settingsStore.get('azure', {}) as any;
      if (azure.organization && azure.project && azure.pat) {
        azureService = new AzureDevOpsService(azure.organization, azure.project, azure.pat);
      } else {
        return null;
      }
    }
    return await azureService.getCommitByHash(repoId, commitHash);
  } catch (error) {
    console.error('Failed to get Azure commit:', error);
    return null;
  }
});

ipcMain.handle('azure:get-branch-info', async (_, repoId: string, branch: string) => {
  try {
    if (!azureService) {
      const azure = settingsStore.get('azure', {}) as any;
      if (azure.organization && azure.project && azure.pat) {
        azureService = new AzureDevOpsService(azure.organization, azure.project, azure.pat);
      } else {
        return null;
      }
    }
    return await azureService.getBranchInfo(repoId, branch);
  } catch (error) {
    console.error('Failed to get Azure branch info:', error);
    return null;
  }
});

// Test Discovery IPC handlers
ipcMain.handle('repo:list-test-files', async (_, repoRoot: string, patterns?: string[]) => {
  try {
    if (!testDiscoveryService) {
      testDiscoveryService = new TestDiscoveryService();
    }
    const storage = getStorage();
    const files = await testDiscoveryService.discoverTestFiles(repoRoot, patterns, storage);
    return files;
  } catch (error: any) {
    console.error('Failed to list test files:', error);
    return [];
  }
});

ipcMain.handle('repo:read-file', async (_, repoRoot: string, filePath: string) => {
  try {
    if (!testDiscoveryService) {
      testDiscoveryService = new TestDiscoveryService();
    }
    // Ensure filePath is relative to repoRoot for security
    const fullPath = path.resolve(repoRoot, filePath);
    const repoRootResolved = path.resolve(repoRoot);
    if (!fullPath.startsWith(repoRootResolved)) {
      throw new Error('File path is outside repository root');
    }
    const content = await testDiscoveryService.readFile(fullPath);
    return content;
  } catch (error: any) {
    console.error('Failed to read file:', error);
    throw error;
  }
});

// Azure Pipelines IPC handlers
ipcMain.handle('azurePipelines:list', async () => {
  try {
    if (!azurePipelinesService) {
      const azure = settingsStore.get('azure', {}) as any;
      if (azure.organization && azure.project && azure.pat) {
        azurePipelinesService = new AzurePipelinesService(azure.organization, azure.project, azure.pat);
      } else {
        return [];
      }
    }
    return await azurePipelinesService.listPipelines();
  } catch (error) {
    console.error('Failed to list pipelines:', error);
    return [];
  }
});

ipcMain.handle('azurePipelines:getPipeline', async (_, pipelineId: number) => {
  try {
    if (!azurePipelinesService) {
      const azure = settingsStore.get('azure', {}) as any;
      if (azure.organization && azure.project && azure.pat) {
        azurePipelinesService = new AzurePipelinesService(azure.organization, azure.project, azure.pat);
      } else {
        return null;
      }
    }
    return await azurePipelinesService.getPipeline(pipelineId);
  } catch (error) {
    console.error('Failed to get pipeline:', error);
    return null;
  }
});

ipcMain.handle('azurePipelines:run', async (_, pipelineId: number, refName: string, runParams: any) => {
  try {
    if (!azurePipelinesService) {
      const azure = settingsStore.get('azure', {}) as any;
      if (azure.organization && azure.project && azure.pat) {
        azurePipelinesService = new AzurePipelinesService(azure.organization, azure.project, azure.pat);
      } else {
        throw new Error('Azure Pipelines service not configured');
      }
    }

    // Run the pipeline
    const run = await azurePipelinesService.runPipeline(pipelineId, refName, runParams);

    // Save run to database
    const storage = getStorage();
    const runId = `run-${run.id}-${Date.now()}`;
    const correlationKey = runParams.CORRELATION_KEY;
    
    // Get repo name from correlation key or params
    const repoName = runParams.repoName || 'unknown';
    
    await storage.saveRun({
      id: runId,
      adoPipelineId: pipelineId.toString(),
      adoRunId: run.id.toString(),
      adoRunUrl: run.url,
      correlationKey,
      requestedScope: runParams.TEST_SCOPE,
      testFile: runParams.TEST_FILE,
      testTag: runParams.TEST_TAG,
      testGrep: runParams.TEST_GREP,
      repoId: runParams.repoId,
      branch: refName,
      status: run.state === 'queued' ? 'queued' : run.state === 'running' ? 'running' : 
              run.result === 'succeeded' ? 'completed' : run.result === 'failed' ? 'failed' : 'cancelled',
      createdAt: run.createdDate,
      completedAt: run.finishedDate,
    });

    return {
      ...run,
      localRunId: runId,
    };
  } catch (error: any) {
    console.error('Failed to run pipeline:', error);
    throw error;
  }
});

ipcMain.handle('azurePipelines:getRun', async (_, pipelineId: number, runId: number) => {
  try {
    if (!azurePipelinesService) {
      const azure = settingsStore.get('azure', {}) as any;
      if (azure.organization && azure.project && azure.pat) {
        azurePipelinesService = new AzurePipelinesService(azure.organization, azure.project, azure.pat);
      } else {
        return null;
      }
    }
    return await azurePipelinesService.getRun(pipelineId, runId);
  } catch (error) {
    console.error('Failed to get pipeline run:', error);
    return null;
  }
});

ipcMain.handle('azurePipelines:listRuns', async (_, pipelineId?: number, filters?: any) => {
  try {
    if (!azurePipelinesService) {
      const azure = settingsStore.get('azure', {}) as any;
      if (azure.organization && azure.project && azure.pat) {
        azurePipelinesService = new AzurePipelinesService(azure.organization, azure.project, azure.pat);
      } else {
        return [];
      }
    }
    return await azurePipelinesService.listRuns(pipelineId, filters);
  } catch (error) {
    console.error('Failed to list pipeline runs:', error);
    return [];
  }
});

// Run management IPC handlers
ipcMain.handle('runs:get', async (_, runId: string) => {
  try {
    const storage = getStorage();
    return await storage.getRun(runId);
  } catch (error) {
    console.error('Failed to get run:', error);
    return null;
  }
});

ipcMain.handle('runs:getActive', async () => {
  try {
    const storage = getStorage();
    return await storage.getActiveRuns();
  } catch (error) {
    console.error('Failed to get active runs:', error);
    return [];
  }
});

ipcMain.handle('runs:getAll', async (_, limit?: number) => {
  try {
    const storage = getStorage();
    return await storage.getAllRuns(limit || 50);
  } catch (error) {
    console.error('Failed to get all runs:', error);
    return [];
  }
});

ipcMain.handle('runs:updateStatus', async (_, runId: string, status: string, completedAt?: string) => {
  try {
    const storage = getStorage();
    await storage.updateRunStatus(
      runId,
      status as 'queued' | 'running' | 'completed' | 'failed' | 'cancelled',
      completedAt
    );
    return { success: true };
  } catch (error) {
    console.error('Failed to update run status:', error);
    return { success: false, error: (error as Error).message };
  }
});

// Rerun history IPC handlers
ipcMain.handle('rerun:saveLink', async (_, link: any) => {
  try {
    const storage = getStorage();
    await storage.saveRerunLink(link);
    return { success: true };
  } catch (error) {
    console.error('Failed to save rerun link:', error);
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('rerun:getHistory', async (_, originalRunId: string) => {
  try {
    const storage = getStorage();
    return await storage.getRerunHistory(originalRunId);
  } catch (error) {
    console.error('Failed to get rerun history:', error);
    return [];
  }
});

ipcMain.handle('rerun:getByErrorSignature', async (_, errorSignature: string) => {
  try {
    const storage = getStorage();
    return await storage.getRerunsByErrorSignature(errorSignature);
  } catch (error) {
    console.error('Failed to get reruns by error signature:', error);
    return [];
  }
});

// Updater IPC handlers
ipcMain.handle('updater:check', async () => {
  if (!updaterService) {
    return;
  }
  await updaterService.checkForUpdates();
});

ipcMain.handle('updater:download', async () => {
  if (!updaterService) {
    return;
  }
  await updaterService.downloadUpdate();
});

ipcMain.handle('updater:install', () => {
  if (!updaterService) {
    return;
  }
  updaterService.installUpdate();
});

ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

