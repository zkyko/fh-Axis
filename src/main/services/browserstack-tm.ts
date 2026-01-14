import axios, { AxiosInstance } from 'axios';

export interface TMProject {
  id: string;
  name: string;
  testCasesCount?: number;
  recentRunsCount?: number;
}

export interface TestRun {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  passCount: number;
  failCount: number;
  skipCount: number;
  startedAt: string;
  duration?: number;
}

export interface TestResult {
  id: string;
  testCaseId: string;
  testCaseName: string;
  status: 'pass' | 'fail' | 'skipped';
  errorMessage?: string;
  durationMs: number;
  metadata?: Record<string, any>;
}

export interface TestCaseStep {
  step: string;
  result: string;
  id?: number;
  order?: number;
  shared_step_id?: string | null;
  shared_step_detail_id?: string | null;
}

export interface TestCaseAttachment {
  size: string;
  name: string;
  content_type: string;
  url: string;
}

export interface TestCaseCustomField {
  name: string;
  value: string;
}

export interface TestCaseIssue {
  jira_id?: string;
  issue_id?: string;
  issue_type: 'jira' | 'azure' | 'asana';
}

export interface TestCase {
  identifier: string;
  title: string;
  case_type?: string;
  priority?: string;
  status?: string;
  folder_id?: number;
  issues?: string[] | TestCaseIssue[];
  tags?: string[];
  template?: 'test_case_steps' | 'test_case_text' | 'test_case_bdd';
  description?: string;
  preconditions?: string;
  automation_status?: 'automated' | 'not_automated' | 'cannot_be_automated' | 'obsolete' | 'automation_not_required';
  owner?: string | null;
  attachments?: TestCaseAttachment[];
  steps?: TestCaseStep[];
  custom_fields?: TestCaseCustomField[];
  created_at?: string;
  last_updated_at?: string;
  created_by?: string;
  last_updated_by?: string;
  // BDD fields
  feature?: string;
  scenario?: string;
  background?: string;
}

export interface TestCaseListResponse {
  success: boolean;
  test_cases: TestCase[];
  info: {
    page: number;
    page_size: number;
    count: number;
    prev: string | null;
    next: string | null;
  };
}

export interface TestCaseCreatePayload {
  name: string;
  description?: string;
  owner?: string;
  preconditions?: string;
  test_case_steps?: TestCaseStep[];
  issues?: string[];
  issue_tracker?: {
    name: 'jira' | 'azure' | 'asana';
    host: string;
  };
  tags?: string[];
  custom_fields?: Record<string, string>;
  // BDD fields
  template?: 'test_case_bdd';
  feature?: string;
  scenario?: string;
  background?: string;
}

export interface TestCaseUpdatePayload {
  name?: string;
  case_type?: string;
  priority?: string;
  status?: string;
  description?: string;
  owner?: string;
  preconditions?: string;
  test_case_steps?: TestCaseStep[];
  issues?: string[];
  issue_tracker?: {
    name: 'jira' | 'azure' | 'asana';
    host: string;
  };
  tags?: string[];
  custom_fields?: Record<string, string>;
  automation_status?: string;
  // BDD fields
  feature?: string;
  scenario?: string;
  background?: string;
}

export interface TestCaseHistoryEntry {
  version_id: string;
  source: string;
  modified_fields: string[];
  user_id: number;
  created_at: string;
  modified?: Record<string, any>;
  version_name: string;
  testcase_id: string;
  updated_by: string;
}

export class BrowserStackTMService {
  private client: AxiosInstance;
  private username: string;
  private accessKey: string;

  constructor(username: string, accessKey: string) {
    this.username = username;
    this.accessKey = accessKey;
    // BrowserStack TM API v2 uses Basic Auth with username and accessKey
    this.client = axios.create({
      baseURL: 'https://test-management.browserstack.com/api/v2',
      auth: {
        username,
        password: accessKey,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async getProjects(): Promise<TMProject[]> {
    try {
      const response = await this.client.get('/projects');
      // BrowserStack TM API returns projects in different formats
      // Handle both array and object with projects property
      const projects = response.data?.projects || response.data || [];
      // Map the response to ensure consistent structure
      // Note: BrowserStack uses 'identifier' for project ID (e.g., 'PR-45')
      return projects.map((p: any) => ({
        id: p.id || p.identifier || p.project_id,
        name: p.name || p.title || p.project_title,
        testCasesCount: p.test_cases_count || p.testCasesCount || p.testCases || 0,
        recentRunsCount: p.test_runs_count || p.recentRunsCount || p.testRuns || 0,
      }));
    } catch (error: any) {
      console.error('Failed to fetch TM projects:', error);
      console.error('Error response:', error.response?.data);
      return [];
    }
  }

  async getRuns(projectId: string, filters?: any): Promise<TestRun[]> {
    try {
      const params = filters || {};
      const response = await this.client.get(`/projects/${projectId}/runs`, { params });
      return response.data?.runs || [];
    } catch (error) {
      console.error('Failed to fetch test runs:', error);
      return [];
    }
  }

  async getResults(runId: string): Promise<TestResult[]> {
    try {
      const response = await this.client.get(`/runs/${runId}/results`);
      return response.data?.results || [];
    } catch (error) {
      console.error('Failed to fetch test results:', error);
      return [];
    }
  }

  async getTestCase(caseId: string): Promise<TestCase | null> {
    try {
      const response = await this.client.get(`/test-cases/${caseId}`);
      return response.data || null;
    } catch (error) {
      console.error('Failed to fetch test case:', error);
      return null;
    }
  }

  // Test Cases API v2
  async getTestCases(
    projectId: string,
    options?: {
      minify?: boolean;
      testCaseIds?: string[];
      updatedAfter?: string;
      updatedBefore?: string;
      issueIds?: string;
      issueType?: string;
      page?: number;
      pageSize?: number;
      filters?: {
        id?: string;
        status?: string;
        priority?: string;
        owner?: string;
        case_type?: string;
        custom_fields?: Record<string, string>;
        folder_id?: string;
        tags?: string;
      };
    }
  ): Promise<TestCaseListResponse> {
    try {
      const params: any = {};
      
      if (options?.minify) {
        params.minify = 'true';
      }
      if (options?.testCaseIds && options.testCaseIds.length > 0) {
        params.id = options.testCaseIds.join(',');
      }
      if (options?.updatedAfter) {
        params.updated_after = options.updatedAfter;
      }
      if (options?.updatedBefore) {
        params.updated_before = options.updatedBefore;
      }
      if (options?.issueIds) {
        params.issue_ids = options.issueIds;
        params.issue_type = options.issueType || 'jira';
      }
      // Page parameter should be at top level, not in filters
      if (options?.page) {
        params.p = options.page;
      }
      if (options?.pageSize) {
        params.page_size = options.pageSize;
      }
      // Apply filter parameters
      if (options?.filters) {
        if (options.filters.status) {
          params.status = options.filters.status;
        }
        if (options.filters.priority) {
          params.priority = options.filters.priority;
        }
        if (options.filters.case_type) {
          params.case_type = options.filters.case_type;
        }
        if (options.filters.owner) {
          params.owner = options.filters.owner;
        }
        if (options.filters.folder_id) {
          params.folder_id = options.filters.folder_id;
        }
        if (options.filters.tags) {
          params.tags = options.filters.tags;
        }
        if (options.filters.id) {
          params.id = options.filters.id;
        }
        if (options.filters.custom_fields) {
          Object.entries(options.filters.custom_fields).forEach(([key, value]) => {
            params[`custom_fields[${key}]`] = value;
          });
        }
      }

      console.log('[TM Service] Fetching test cases for project:', projectId);
      console.log('[TM Service] Request URL:', `/projects/${projectId}/test-cases`);
      console.log('[TM Service] Request params:', JSON.stringify(params, null, 2));
      const response = await this.client.get(`/projects/${projectId}/test-cases`, { params });
      console.log('[TM Service] Response status:', response.status);
      console.log('[TM Service] Response data keys:', Object.keys(response.data || {}));
      console.log('[TM Service] Test cases count:', response.data?.test_cases?.length || 0);
      if (response.data?.test_cases?.length > 0) {
        console.log('[TM Service] First test case sample:', JSON.stringify(response.data.test_cases[0], null, 2).substring(0, 300));
      }
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch test cases:', error);
      console.error('Error response:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch test cases');
    }
  }

  async createTestCase(
    projectId: string,
    folderId: string,
    payload: TestCaseCreatePayload
  ): Promise<{ success: boolean; test_case: TestCase }> {
    try {
      const response = await this.client.post(
        `/projects/${projectId}/folders/${folderId}/test-cases`,
        { test_case: payload }
      );
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Failed to create test case:', error);
      throw new Error(error.response?.data?.message || 'Failed to create test case');
    }
  }

  async updateTestCase(
    projectId: string,
    testCaseId: string,
    payload: TestCaseUpdatePayload
  ): Promise<{ success: boolean; test_case: TestCase }> {
    try {
      const response = await this.client.patch(
        `/projects/${projectId}/test-cases/${testCaseId}`,
        { test_case: payload }
      );
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Failed to update test case:', error);
      throw new Error(error.response?.data?.message || 'Failed to update test case');
    }
  }

  async bulkUpdateTestCases(
    projectId: string,
    testCaseIds: string[],
    payload: TestCaseUpdatePayload,
    useOperations?: boolean
  ): Promise<{ success: boolean }> {
    try {
      const endpoint = useOperations
        ? `/projects/${projectId}/test-cases/with-operations`
        : `/projects/${projectId}/test-cases`;
      
      const requestBody = useOperations
        ? {
            ids: testCaseIds,
            test_case: payload,
          }
        : {
            test_case: {
              ids: testCaseIds,
              ...payload,
            },
          };

      const response = await this.client.patch(endpoint, requestBody);
      return response.data;
    } catch (error: any) {
      console.error('Failed to bulk update test cases:', error);
      throw new Error(error.response?.data?.message || 'Failed to bulk update test cases');
    }
  }

  async deleteTestCase(projectId: string, testCaseId: string): Promise<{ success: boolean }> {
    try {
      const response = await this.client.delete(`/projects/${projectId}/test-cases/${testCaseId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to delete test case:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete test case');
    }
  }

  async bulkDeleteTestCases(projectId: string, testCaseIds: string[]): Promise<{ success: boolean }> {
    try {
      const response = await this.client.delete(`/projects/${projectId}/test-cases`, {
        data: {
          test_case: {
            ids: testCaseIds,
          },
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to bulk delete test cases:', error);
      throw new Error(error.response?.data?.message || 'Failed to bulk delete test cases');
    }
  }

  async getTestCaseHistory(
    projectId: string,
    testCaseId: string
  ): Promise<{ history: TestCaseHistoryEntry[]; info: any }> {
    try {
      const response = await this.client.get(`/projects/${projectId}/test-cases/${testCaseId}/history`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch test case history:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch test case history');
    }
  }

  async exportBDDTestCases(
    projectId: string,
    testCaseIds: string[],
    options?: {
      combine_into_one?: boolean;
      combined_feature?: string;
      combined_background?: string;
    }
  ): Promise<{
    success: boolean;
    export_id: number;
    status: string;
    status_url: string;
    warnings?: string[];
  }> {
    try {
      const response = await this.client.post(`/projects/${projectId}/test-cases/export-bdd`, {
        test_case_ids: testCaseIds,
        ...options,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to export BDD test cases:', error);
      throw new Error(error.response?.data?.message || 'Failed to export BDD test cases');
    }
  }

  async getExportStatus(exportId: number): Promise<{
    success: boolean;
    status: string;
    export_id: number;
    entity_type: string;
    file_type: string;
    url: string | null;
    error_message?: string;
  }> {
    try {
      const response = await this.client.get(`/exports/${exportId}/status`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get export status:', error);
      throw new Error(error.response?.data?.message || 'Failed to get export status');
    }
  }

  async downloadExport(exportId: number): Promise<Buffer> {
    try {
      const response = await this.client.get(`/exports/${exportId}/download`, {
        responseType: 'arraybuffer',
      });
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('Failed to download export:', error);
      throw new Error(error.response?.data?.message || 'Failed to download export');
    }
  }
}

