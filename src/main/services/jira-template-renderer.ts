import { FailureContext, JiraDraft, SessionChoice } from '../types';

/**
 * Render FailureContext as Jira draft (plain text description)
 */
export function renderDraft(
  ctx: FailureContext,
  sessionChoices?: SessionChoice[]
): JiraDraft {
  // Generate summary
  let summary = 'Test Failure';
  if (ctx.test?.name) {
    summary = ctx.test.name;
  } else if (ctx.automate?.sessionName) {
    summary = ctx.automate.sessionName;
  } else if (ctx.automate?.buildName) {
    summary = `Build Failed: ${ctx.automate.buildName}`;
  }

  // Build description sections
  const sections: string[] = [];

  // Test Information
  if (ctx.test) {
    sections.push('## Test Information');
    if (ctx.test.name) {
      sections.push(`Test Name: ${ctx.test.name}`);
    }
    if (ctx.test.id) {
      sections.push(`Test Case ID: ${ctx.test.id}`);
    }
    if (ctx.test.filePath) {
      sections.push(`File Path: ${ctx.test.filePath}`);
    }
    if (ctx.test.tags && ctx.test.tags.length > 0) {
      sections.push(`Tags: ${ctx.test.tags.join(', ')}`);
    }
    sections.push('');
  }

  // BrowserStack Information
  if (ctx.automate) {
    sections.push('## BrowserStack Test Execution');
    
    if (ctx.automate.buildName) {
      sections.push(`Build: ${ctx.automate.buildName}`);
      if (ctx.automate.buildUrl) {
        sections.push(`Build URL: ${ctx.automate.buildUrl}`);
      }
    }

    if (ctx.automate.sessionName) {
      sections.push(`Session: ${ctx.automate.sessionName}`);
      if (ctx.automate.sessionUrl) {
        sections.push(`Session URL: ${ctx.automate.sessionUrl}`);
      }
    }

    if (ctx.automate.status) {
      sections.push(`Status: ${ctx.automate.status}`);
    }

    if (ctx.automate.durationSec) {
      const minutes = Math.floor(ctx.automate.durationSec / 60);
      const seconds = ctx.automate.durationSec % 60;
      sections.push(`Duration: ${minutes}m ${seconds}s`);
    }

    // Capabilities
    if (ctx.automate.caps) {
      sections.push('');
      sections.push('### Environment');
      const caps = ctx.automate.caps;
      if (caps.browser) {
        let browserInfo = caps.browser;
        if (caps.browserVersion) {
          browserInfo += ` ${caps.browserVersion}`;
        }
        sections.push(`Browser: ${browserInfo}`);
      }
      if (caps.os) {
        let osInfo = caps.os;
        if (caps.osVersion) {
          osInfo += ` ${caps.osVersion}`;
        }
        sections.push(`OS: ${osInfo}`);
      }
      if (caps.device) {
        sections.push(`Device: ${caps.device}`);
      }
      if (caps.realMobile !== undefined) {
        sections.push(`Real Mobile: ${caps.realMobile ? 'Yes' : 'No'}`);
      }
    }

    // Artifacts
    if (ctx.automate.artifacts) {
      const artifacts = ctx.automate.artifacts;
      const artifactLinks: string[] = [];
      
      if (artifacts.videoUrl) {
        artifactLinks.push(`Video: ${artifacts.videoUrl}`);
      }
      if (artifacts.logsUrl) {
        artifactLinks.push(`Logs: ${artifacts.logsUrl}`);
      }
      if (artifacts.networkUrl) {
        artifactLinks.push(`Network Logs (HAR): ${artifacts.networkUrl}`);
      }
      if (artifacts.screenshotUrl) {
        artifactLinks.push(`Screenshot: ${artifacts.screenshotUrl}`);
      }
      if (artifacts.consoleUrl) {
        artifactLinks.push(`Console: ${artifacts.consoleUrl}`);
      }

      if (artifactLinks.length > 0) {
        sections.push('');
        sections.push('### Evidence');
        sections.push(...artifactLinks);
      }
    }

    sections.push('');
  }

  // Azure DevOps Information
  if (ctx.ado) {
    sections.push('## Azure DevOps');
    
    if (ctx.ado.pipelineRunUrl) {
      sections.push(`Pipeline Run: ${ctx.ado.pipelineRunUrl}`);
    }
    if (ctx.ado.repo) {
      sections.push(`Repository: ${ctx.ado.repo}`);
    }
    if (ctx.ado.branch) {
      sections.push(`Branch: ${ctx.ado.branch}`);
    }
    if (ctx.ado.commit) {
      sections.push(`Commit: ${ctx.ado.commit}`);
    }

    sections.push('');
  }

  // Additional Failed Sessions (if build input with multiple sessions)
  if (sessionChoices && sessionChoices.length > 1) {
    const failedSessions = sessionChoices.filter(
      (choice) => choice.status === 'failed' || choice.status === 'error'
    );
    
    if (failedSessions.length > 1) {
      sections.push('## Additional Failed Sessions');
      failedSessions.forEach((choice) => {
        if (choice.sessionUrl) {
          sections.push(`- ${choice.label}: ${choice.sessionUrl}`);
        } else {
          sections.push(`- ${choice.label}`);
        }
      });
      sections.push('');
    }
  }

  // Error Information (if available - V1: only message, no stack trace parsing)
  if (ctx.automate?.error?.message) {
    sections.push('## Error Details');
    sections.push(`Message: ${ctx.automate.error.message}`);
    sections.push('');
  }

  const description = sections.join('\n').trim();

  // Generate labels
  const labels: string[] = ['qa-hub', 'automation'];
  if (ctx.automate) {
    labels.push('browserstack');
  }
  if (ctx.test?.tags) {
    // Add test tags as labels (sanitize for Jira)
    ctx.test.tags.forEach((tag) => {
      const sanitized = tag.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      if (sanitized && !labels.includes(sanitized)) {
        labels.push(sanitized);
      }
    });
  }

  return {
    summary,
    description,
    labels,
  };
}

