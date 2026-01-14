import { StorageService, Run } from './storage';
import { AzurePipelinesService } from './azure-pipelines';
import { CorrelationEngine } from './correlation-engine';

export class RunPoller {
  private storage: StorageService;
  private pipelinesService: AzurePipelinesService | null = null;
  private correlationEngine: CorrelationEngine | null = null;
  private pollInterval: number = 10000; // 10 seconds
  private pollTimer: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;

  constructor(storage: StorageService) {
    this.storage = storage;
  }

  setPipelinesService(service: AzurePipelinesService): void {
    this.pipelinesService = service;
  }

  setCorrelationEngine(engine: CorrelationEngine): void {
    this.correlationEngine = engine;
  }

  setPollInterval(interval: number): void {
    this.pollInterval = interval;
    if (this.isPolling) {
      this.stop();
      this.start();
    }
  }

  async poll(): Promise<void> {
    if (!this.pipelinesService) {
      console.warn('[RunPoller] Pipelines service not available');
      return;
    }

    try {
      const activeRuns = await this.storage.getActiveRuns();
      
      if (activeRuns.length === 0) {
        return; // No active runs to poll
      }

      console.log(`[RunPoller] Polling ${activeRuns.length} active run(s)`);

      for (const run of activeRuns) {
        try {
          if (!run.adoPipelineId || !run.adoRunId) {
            console.warn(`[RunPoller] Run ${run.id} missing pipeline/run IDs`);
            continue;
          }

          const pipelineId = parseInt(run.adoPipelineId);
          const runId = parseInt(run.adoRunId);

          const adoRun = await this.pipelinesService.getRun(pipelineId, runId);
          
          if (!adoRun) {
            console.warn(`[RunPoller] Could not fetch run ${runId} from Azure DevOps`);
            continue;
          }

          // Map ADO status to our status
          let newStatus: Run['status'] = run.status;
          if (adoRun.state === 'queued') {
            newStatus = 'queued';
          } else if (adoRun.state === 'running') {
            newStatus = 'running';
          } else if (adoRun.state === 'completed' || adoRun.state === 'canceled') {
            if (adoRun.result === 'succeeded') {
              newStatus = 'completed';
            } else if (adoRun.result === 'failed') {
              newStatus = 'failed';
            } else if (adoRun.result === 'canceled') {
              newStatus = 'cancelled';
            } else {
              newStatus = 'completed'; // Default for completed state
            }
          }

          // Check if status changed
          if (newStatus !== run.status) {
            console.log(`[RunPoller] Run ${run.id} status changed: ${run.status} -> ${newStatus}`);
            
            await this.storage.updateRunStatus(
              run.id,
              newStatus,
              adoRun.finishedDate
            );

            // If run completed, trigger correlation lookup
            if ((newStatus === 'completed' || newStatus === 'failed') && 
                run.status !== 'completed' && run.status !== 'failed') {
              console.log(`[RunPoller] Run ${run.id} completed, triggering correlation lookup`);
              await this.triggerCorrelationLookup(run);
            }
          }
        } catch (error: any) {
          console.error(`[RunPoller] Error polling run ${run.id}:`, error);
        }
      }
    } catch (error: any) {
      console.error('[RunPoller] Error during poll:', error);
    }
  }

  private async triggerCorrelationLookup(run: Run): Promise<void> {
    if (!this.correlationEngine || !run.correlationKey) {
      console.warn(`[RunPoller] Cannot trigger correlation lookup: missing engine or correlation key`);
      return;
    }

    try {
      // Wait a bit for BrowserStack to process the build
      setTimeout(async () => {
        try {
          await this.correlationEngine!.findBrowserStackBuildByCorrelation(run.correlationKey!);
        } catch (error) {
          console.error(`[RunPoller] Correlation lookup failed for run ${run.id}:`, error);
        }
      }, 5000); // Wait 5 seconds before looking up
    } catch (error) {
      console.error(`[RunPoller] Error scheduling correlation lookup:`, error);
    }
  }

  start(): void {
    if (this.isPolling) {
      console.warn('[RunPoller] Already polling');
      return;
    }

    if (!this.pipelinesService) {
      console.warn('[RunPoller] Cannot start: pipelines service not available');
      return;
    }

    console.log(`[RunPoller] Starting poller (interval: ${this.pollInterval}ms)`);
    this.isPolling = true;
    
    // Poll immediately
    this.poll();
    
    // Then poll at intervals
    this.pollTimer = setInterval(() => {
      this.poll();
    }, this.pollInterval);
  }

  stop(): void {
    if (!this.isPolling) {
      return;
    }

    console.log('[RunPoller] Stopping poller');
    this.isPolling = false;
    
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  isActive(): boolean {
    return this.isPolling;
  }
}

