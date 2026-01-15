import { FailureContext, FailureContextInput, SessionChoice } from '../types';
import { BrowserStackAutomateService } from './browserstack-automate';
import { BrowserStackTMService } from './browserstack-tm';
import { AzurePipelinesService } from './azure-pipelines';
import { AzureDevOpsService } from './azure-devops';

interface BuildFailureContextOptions {
  automateService?: BrowserStackAutomateService;
  tmService?: BrowserStackTMService;
  azurePipelinesService?: AzurePipelinesService;
  azureService?: AzureDevOpsService;
}

/**
 * Parse correlation key from build name
 * Format: QA Hub|adoRun=<ID>|repo=<NAME>|branch=<BRANCH>
 * Tolerant parsing - handles variations
 */
function parseCorrelationKey(buildName: string): {
  adoRunId?: string;
  repo?: string;
  branch?: string;
} {
  const result: { adoRunId?: string; repo?: string; branch?: string } = {};

  try {
    // Look for pattern: QA Hub|adoRun=<ID>|repo=<NAME>|branch=<BRANCH>
    // Also handle variations like: QA Hub | adoRun = <ID> | repo = <NAME>
    const patterns = [
      /adoRun[=:]\s*([^|]+)/i,
      /repo[=:]\s*([^|]+)/i,
      /branch[=:]\s*([^|]+)/i,
    ];

    const adoRunMatch = buildName.match(/adoRun[=:]\s*([^|]+)/i);
    if (adoRunMatch) {
      result.adoRunId = adoRunMatch[1].trim();
    }

    const repoMatch = buildName.match(/repo[=:]\s*([^|]+)/i);
    if (repoMatch) {
      result.repo = repoMatch[1].trim();
    }

    const branchMatch = buildName.match(/branch[=:]\s*([^|]+)/i);
    if (branchMatch) {
      result.branch = branchMatch[1].trim();
    }
  } catch (error) {
    console.warn('[FailureContextBuilder] Failed to parse correlation key:', error);
  }

  return result;
}

/**
 * Enrich FailureContext with ADO data if available
 */
async function enrichWithAdoData(
  ctx: FailureContext,
  adoRunId: string,
  repoName: string,
  branch: string,
  azurePipelinesService?: AzurePipelinesService,
  azureService?: AzureDevOpsService
): Promise<void> {
  if (!azureService) {
    return;
  }

  try {
    const runId = parseInt(adoRunId, 10);
    if (isNaN(runId)) {
      return;
    }

    // Try to get repo by name
    const repo = await azureService.getRepositoryByName(repoName);
    if (!repo) {
      return;
    }

    // Get branch info to get commit
    const branchInfo = await azureService.getBranchInfo(repo.id, branch);
    
    // Get organization and project from repo
    const organization = repo.project.name; // This might not be the org, but we'll use project for now
    // For V1, we'll construct a basic URL - the actual org/project might need to come from settings
    // But we can use the pipeline run ID to construct a URL
    ctx.ado = {
      repo: repoName,
      branch: branch,
      commit: branchInfo?.objectId,
      pipelineRunId: adoRunId,
      // Construct URL - we'll need org/project from settings or correlation key
      // For now, use a generic format that can be enhanced later
      pipelineRunUrl: `https://dev.azure.com/_build/results?buildId=${runId}`,
    };
  } catch (error) {
    console.warn('[FailureContextBuilder] Failed to enrich with ADO data:', error);
  }
}

/**
 * Build FailureContext from input
 */
export async function buildFailureContext(
  input: FailureContextInput,
  preferredSessionId?: string,
  options: BuildFailureContextOptions = {}
): Promise<{ ctx: FailureContext; sessionChoices?: SessionChoice[] }> {
  const { automateService, tmService, azurePipelinesService, azureService } = options;

  const ctx: FailureContext = {
    source: input.type === 'tm' ? 'tm' : 'automate',
    createdAt: new Date().toISOString(),
  };

  let sessionChoices: SessionChoice[] | undefined;

  if (input.type === 'build') {
    // Build input: fetch build and sessions
    if (!automateService) {
      throw new Error('Automate service not available');
    }

    const build = await automateService.getBuild(input.id);
    if (!build) {
      throw new Error(`Build not found: ${input.id}`);
    }

    // Get all sessions for the build
    const sessions = await automateService.listBuildSessions(input.id);

    // Create session choices
    sessionChoices = sessions.map((session) => ({
      label: `Session: ${session.name || session.id} (${session.status})`,
      sessionId: session.id,
      sessionUrl: session.public_url,
      status: session.status,
    }));

    // Choose session: preferredSessionId > first failed > first session
    let chosenSession = sessions.find((s) => s.id === preferredSessionId);
    if (!chosenSession) {
      chosenSession = sessions.find((s) => s.status === 'failed' || s.status === 'error');
    }
    if (!chosenSession && sessions.length > 0) {
      chosenSession = sessions[0];
    }

    if (!chosenSession) {
      throw new Error('No sessions found for build');
    }

    // Get full session details
    const sessionDetails = await automateService.getSession(chosenSession.id);
    if (!sessionDetails) {
      throw new Error(`Session not found: ${chosenSession.id}`);
    }

    // Populate automate context
    ctx.automate = {
      buildName: build.name,
      buildHashedId: build.id,
      buildUrl: build.public_url,
      sessionName: sessionDetails.name,
      sessionHashedId: sessionDetails.id,
      sessionUrl: sessionDetails.public_url,
      status: sessionDetails.status,
      durationSec: sessionDetails.duration,
      caps: sessionDetails.caps,
      artifacts: {
        videoUrl: sessionDetails.videoUrl,
        logsUrl: sessionDetails.networkLogs,
        consoleUrl: sessionDetails.consoleLogs?.length ? 'See console logs' : undefined,
        networkUrl: sessionDetails.networkLogs,
        screenshotUrl: sessionDetails.screenshots?.[0],
      },
      evidenceFlags: {
        hasVideo: !!sessionDetails.videoUrl,
        hasLogs: !!sessionDetails.networkLogs,
        hasConsole: !!(sessionDetails.consoleLogs && sessionDetails.consoleLogs.length > 0),
        hasNetwork: !!sessionDetails.networkLogs,
        hasScreenshot: !!(sessionDetails.screenshots && sessionDetails.screenshots.length > 0),
      },
    };

    // Parse correlation key from build name
    const correlationData = parseCorrelationKey(build.name);
    if (correlationData.adoRunId && correlationData.repo && correlationData.branch) {
      await enrichWithAdoData(
        ctx,
        correlationData.adoRunId,
        correlationData.repo,
        correlationData.branch,
        azurePipelinesService,
        azureService
      );
    }
  } else if (input.type === 'session') {
    // Session input: fetch session directly
    if (!automateService) {
      throw new Error('Automate service not available');
    }

    const sessionDetails = await automateService.getSession(input.id);
    if (!sessionDetails) {
      throw new Error(`Session not found: ${input.id}`);
    }

    // Get build info if available
    const buildHashedId = sessionDetails.bsSessionUrl?.match(/builds\/([^/]+)/)?.[1];
    let build = null;
    if (buildHashedId) {
      build = await automateService.getBuild(buildHashedId);
    }

    ctx.automate = {
      buildName: build?.name,
      buildHashedId: build?.id,
      buildUrl: build?.public_url,
      sessionName: sessionDetails.name,
      sessionHashedId: sessionDetails.id,
      sessionUrl: sessionDetails.public_url,
      status: sessionDetails.status,
      durationSec: sessionDetails.duration,
      caps: sessionDetails.caps,
      artifacts: {
        videoUrl: sessionDetails.videoUrl,
        logsUrl: sessionDetails.networkLogs,
        consoleUrl: sessionDetails.consoleLogs?.length ? 'See console logs' : undefined,
        networkUrl: sessionDetails.networkLogs,
        screenshotUrl: sessionDetails.screenshots?.[0],
      },
      evidenceFlags: {
        hasVideo: !!sessionDetails.videoUrl,
        hasLogs: !!sessionDetails.networkLogs,
        hasConsole: !!(sessionDetails.consoleLogs && sessionDetails.consoleLogs.length > 0),
        hasNetwork: !!sessionDetails.networkLogs,
        hasScreenshot: !!(sessionDetails.screenshots && sessionDetails.screenshots.length > 0),
      },
    };

    // Parse correlation key from build name if available
    if (build?.name) {
      const correlationData = parseCorrelationKey(build.name);
      if (correlationData.adoRunId && correlationData.repo && correlationData.branch) {
        await enrichWithAdoData(
          ctx,
          correlationData.adoRunId,
          correlationData.repo,
          correlationData.branch,
          azurePipelinesService,
          azureService
        );
      }
    }
  } else if (input.type === 'tm') {
    // TM input: fetch test case
    if (!tmService) {
      throw new Error('TM service not available');
    }

    const testCase = await tmService.getTestCase(input.id);
    if (!testCase) {
      throw new Error(`Test case not found: ${input.id}`);
    }

    ctx.test = {
      name: testCase.title || testCase.identifier,
      id: testCase.identifier,
      tags: testCase.tags,
    };
  }

  return { ctx, sessionChoices };
}

