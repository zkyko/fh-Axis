import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface AzurePipeline {
  id: number;
  name: string;
  folder?: string;
  url: string;
  revision?: number;
}

export interface AzurePipelineRun {
  id: number;
  name: string;
  state: 'queued' | 'running' | 'completed' | 'canceling' | 'canceled';
  result?: 'succeeded' | 'failed' | 'canceled' | 'partiallySucceeded';
  status: 'inProgress' | 'completed' | 'cancelling' | 'postponed' | 'notStarted' | 'queued';
  createdDate: string;
  finishedDate?: string;
  url: string;
  pipeline?: {
    id: number;
    name: string;
  };
  resources?: {
    repositories?: {
      self?: {
        refName?: string;
      };
    };
  };
}

export interface PipelineRunParameters {
  TEST_SCOPE: 'all' | 'file' | 'tag' | 'grep';
  TEST_FILE?: string;
  TEST_TAG?: string;
  TEST_GREP?: string;
  ENV?: string;
  TRIGGER_SOURCE?: string;
  CORRELATION_KEY: string;
}

export class AzurePipelinesService {
  private client: AxiosInstance;
  private organization: string;
  private project: string;
  private pat: string;

  constructor(organization: string, project: string, personalAccessToken: string) {
    this.organization = organization;
    this.project = project;
    this.pat = personalAccessToken;
    
    const encodedProject = encodeURIComponent(project);
    this.client = axios.create({
      baseURL: `https://dev.azure.com/${organization}/${encodedProject}/_apis`,
      auth: {
        username: '',
        password: personalAccessToken,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * List all pipelines in the project
   */
  async listPipelines(): Promise<AzurePipeline[]> {
    try {
      const response = await this.client.get('/pipelines?api-version=7.1');
      return response.data.value.map((pipeline: any) => ({
        id: pipeline.id,
        name: pipeline.name,
        folder: pipeline.folder,
        url: pipeline.url,
        revision: pipeline.revision,
      }));
    } catch (error) {
      console.error('Failed to fetch pipelines:', error);
      throw error;
    }
  }

  /**
   * Get pipeline details by ID
   */
  async getPipeline(pipelineId: number): Promise<AzurePipeline | null> {
    try {
      const response = await this.client.get(`/pipelines/${pipelineId}?api-version=7.1`);
      return {
        id: response.data.id,
        name: response.data.name,
        folder: response.data.folder,
        url: response.data.url,
        revision: response.data.revision,
      };
    } catch (error) {
      console.error('Failed to fetch pipeline:', error);
      return null;
    }
  }

  /**
   * Generate correlation key for a run
   */
  generateCorrelationKey(adoRunId: number, repoName: string, branch: string): string {
    return `QAHub|adoRun=${adoRunId}|repo=${repoName}|branch=${branch}`;
  }

  /**
   * Run a pipeline with parameters
   */
  async runPipeline(
    pipelineId: number,
    refName: string,
    parameters: PipelineRunParameters
  ): Promise<AzurePipelineRun> {
    try {
      // Build the request body
      const requestBody: any = {
        resources: {
          repositories: {
            self: {
              refName: refName,
            },
          },
        },
        templateParameters: parameters,
      };

      const response = await this.client.post(
        `/pipelines/${pipelineId}/runs?api-version=7.1`,
        requestBody
      );

      const run = response.data;
      return {
        id: run.id,
        name: run.name,
        state: run.state,
        result: run.result,
        status: run.status,
        createdDate: run.createdDate,
        finishedDate: run.finishedDate,
        url: run.url || this.getRunUrl(pipelineId, run.id),
        pipeline: run.pipeline ? {
          id: run.pipeline.id,
          name: run.pipeline.name,
        } : undefined,
        resources: run.resources,
      };
    } catch (error: any) {
      console.error('Failed to run pipeline:', error);
      if (error.response) {
        throw new Error(`Pipeline run failed: ${error.response.data?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get pipeline run details
   */
  async getRun(pipelineId: number, runId: number): Promise<AzurePipelineRun | null> {
    try {
      const response = await this.client.get(
        `/pipelines/${pipelineId}/runs/${runId}?api-version=7.1`
      );
      const run = response.data;
      return {
        id: run.id,
        name: run.name,
        state: run.state,
        result: run.result,
        status: run.status,
        createdDate: run.createdDate,
        finishedDate: run.finishedDate,
        url: run.url || this.getRunUrl(pipelineId, run.id),
        pipeline: run.pipeline ? {
          id: run.pipeline.id,
          name: run.pipeline.name,
        } : undefined,
        resources: run.resources,
      };
    } catch (error) {
      console.error('Failed to fetch pipeline run:', error);
      return null;
    }
  }

  /**
   * List recent pipeline runs
   */
  async listRuns(
    pipelineId?: number,
    filters?: {
      top?: number;
      status?: string;
      result?: string;
    }
  ): Promise<AzurePipelineRun[]> {
    try {
      let url = '/pipelines/runs?api-version=7.1';
      const params: string[] = [];
      
      if (pipelineId) {
        params.push(`pipelineIds=${pipelineId}`);
      }
      if (filters?.top) {
        params.push(`$top=${filters.top}`);
      }
      if (filters?.status) {
        params.push(`statusFilter=${filters.status}`);
      }
      if (filters?.result) {
        params.push(`resultFilter=${filters.result}`);
      }
      
      if (params.length > 0) {
        url += `&${params.join('&')}`;
      }

      const response = await this.client.get(url);
      return response.data.value.map((run: any) => ({
        id: run.id,
        name: run.name,
        state: run.state,
        result: run.result,
        status: run.status,
        createdDate: run.createdDate,
        finishedDate: run.finishedDate,
        url: run.url || (run.pipeline ? this.getRunUrl(run.pipeline.id, run.id) : ''),
        pipeline: run.pipeline ? {
          id: run.pipeline.id,
          name: run.pipeline.name,
        } : undefined,
        resources: run.resources,
      }));
    } catch (error) {
      console.error('Failed to fetch pipeline runs:', error);
      throw error;
    }
  }

  /**
   * Get run URL
   */
  getRunUrl(pipelineId: number, runId: number): string {
    return `https://dev.azure.com/${this.organization}/${this.project}/_build/results?buildId=${runId}`;
  }

  /**
   * Test connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/pipelines?$top=1&api-version=7.1');
      return response.status === 200;
    } catch (error) {
      console.error('Azure Pipelines connection test failed:', error);
      return false;
    }
  }
}

