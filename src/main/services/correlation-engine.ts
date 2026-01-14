import { StorageService } from './storage';
import { BrowserStackAutomateService } from './browserstack-automate';
import { BrowserStackTMService, TestResult } from './browserstack-tm';
import { JiraService } from './jira';
import { AzureDevOpsService } from './azure-devops';

export interface CorrelatedData {
  testResult: TestResult;
  automateSession?: any;
  jiraIssue?: any;
  azureCommit?: any;
  azureBranch?: string;
  correlationKey?: string;
}

export class CorrelationEngine {
  private storage: StorageService;
  private automateService?: BrowserStackAutomateService;
  private tmService?: BrowserStackTMService;
  private jiraService?: JiraService;
  private azureService?: AzureDevOpsService;

  constructor(storage: StorageService) {
    this.storage = storage;
  }

  setAutomateService(service: BrowserStackAutomateService): void {
    this.automateService = service;
  }

  setTMService(service: BrowserStackTMService): void {
    this.tmService = service;
  }

  setJiraService(service: JiraService): void {
    this.jiraService = service;
  }

  setAzureService(service: AzureDevOpsService): void {
    this.azureService = service;
  }

  async correlate(testResult: TestResult): Promise<CorrelatedData> {
    const correlated: CorrelatedData = { testResult };

    // Find Automate session
    correlated.automateSession = await this.findAutomateSession(testResult);
    
    // Find Jira issue
    correlated.jiraIssue = await this.findJiraIssue(testResult);

    // Find Azure commit
    const azureData = await this.findAzureCommit(testResult);
    if (azureData) {
      correlated.azureCommit = azureData.commit;
      correlated.azureBranch = azureData.branch;
    }

    return correlated;
  }

  async findAutomateSession(testResult: TestResult): Promise<any | null> {
    if (!this.automateService) return null;

    // Strategy 1: Check for session_id in metadata
    const sessionId = testResult.metadata?.session_id;
    if (sessionId) {
      try {
        return await this.automateService.getSessionDetails(sessionId);
      } catch (error) {
        console.error('Failed to fetch session by ID:', error);
      }
    }

    // Strategy 2: Check stored correlations
    const stored = await this.storage.getCorrelation(testResult.id);
    if (stored?.automateSessionId) {
      try {
        return await this.automateService.getSessionDetails(stored.automateSessionId);
      } catch (error) {
        console.error('Failed to fetch stored session:', error);
      }
    }

    // Strategy 3: Pattern matching by test name (if implemented)
    // This would require additional API calls to search sessions

    return null;
  }

  async findJiraIssue(testResult: TestResult): Promise<any | null> {
    if (!this.jiraService) return null;

    // Strategy 1: Check stored correlations
    const stored = await this.storage.getCorrelation(testResult.id);
    if (stored?.jiraIssueKey) {
      try {
        return await this.jiraService.getIssue(stored.jiraIssueKey);
      } catch (error) {
        console.error('Failed to fetch stored Jira issue:', error);
      }
    }

    // Strategy 2: Search by test name
    if (testResult.testCaseName) {
      try {
        const jql = `summary ~ "${testResult.testCaseName}" OR description ~ "${testResult.testCaseName}"`;
        const issues = await this.jiraService.searchIssues(jql);
        return issues.length > 0 ? issues[0] : null;
      } catch (error) {
        console.error('Failed to search Jira issues:', error);
      }
    }

    return null;
  }

  async findAzureCommit(testResult: TestResult): Promise<{ commit: any; branch?: string } | null> {
    if (!this.azureService) return null;

    // Strategy 1: Check for commit hash in metadata
    const commitHash = testResult.metadata?.commitHash || testResult.metadata?.gitCommit;
    const repoId = testResult.metadata?.repoId;
    const branch = testResult.metadata?.branch;

    if (commitHash && repoId) {
      try {
        const commit = await this.azureService.getCommitByHash(repoId, commitHash);
        if (commit) {
          return { commit, branch };
        }
      } catch (error) {
        console.error('Failed to fetch Azure commit:', error);
      }
    }

    // Strategy 2: Check stored correlations
    const stored = await this.storage.getCorrelation(testResult.id);
    if (stored && (stored as any).azureCommitHash && (stored as any).azureRepoId) {
      try {
        const commit = await this.azureService.getCommitByHash(
          (stored as any).azureRepoId,
          (stored as any).azureCommitHash
        );
        if (commit) {
          return { commit, branch: (stored as any).azureBranch };
        }
      } catch (error) {
        console.error('Failed to fetch stored Azure commit:', error);
      }
    }

    return null;
  }

  async saveCorrelation(mapping: {
    testResultId: string;
    automateSessionId?: string;
    jiraIssueKey?: string;
    azureRepoId?: string;
    azureCommitHash?: string;
    azureBranch?: string;
  }): Promise<void> {
    await this.storage.saveCorrelation(
      mapping.testResultId,
      mapping.automateSessionId,
      mapping.jiraIssueKey,
      {
        azureRepoId: mapping.azureRepoId,
        azureCommitHash: mapping.azureCommitHash,
        azureBranch: mapping.azureBranch,
      }
    );
  }

  /**
   * Find BrowserStack build by correlation key
   * Searches builds by name containing the correlation key
   */
  async findBrowserStackBuildByCorrelation(correlationKey: string): Promise<any | null> {
    if (!this.automateService) {
      console.warn('[CorrelationEngine] Automate service not available');
      return null;
    }

    try {
      // Get all projects
      const projects = await this.automateService.getProjects();
      
      // Search through projects for builds matching correlation key
      for (const project of projects) {
        try {
          const builds = await this.automateService.getBuilds(project.id);
          
          // Find build with correlation key in name
          const matchingBuild = builds.find((build: any) => {
            const buildName = build.name || '';
            return buildName.includes(correlationKey);
          });

          if (matchingBuild) {
            console.log(`[CorrelationEngine] Found matching build: ${matchingBuild.id} (${matchingBuild.name})`);
            
            // Get sessions for this build
            const sessions = await this.automateService.getSessions(matchingBuild.id);
            
            // Get session details with artifacts
            const sessionsWithDetails = await Promise.all(
              sessions.map(async (session: any) => {
                try {
                  const details = await this.automateService!.getSessionDetails(session.id);
                  return details;
                } catch (error) {
                  console.warn(`[CorrelationEngine] Failed to get details for session ${session.id}:`, error);
                  return session;
                }
              })
            );

            return {
              build: matchingBuild,
              sessions: sessionsWithDetails,
              correlationKey,
            };
          }
        } catch (error) {
          console.warn(`[CorrelationEngine] Error searching builds in project ${project.id}:`, error);
        }
      }

      console.log(`[CorrelationEngine] No build found with correlation key: ${correlationKey}`);
      return null;
    } catch (error) {
      console.error('[CorrelationEngine] Error finding build by correlation key:', error);
      return null;
    }
  }
}

