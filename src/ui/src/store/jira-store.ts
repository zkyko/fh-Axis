import { create } from 'zustand';
import { ipc } from '../ipc';

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  assignee?: string;
  priority?: string;
  url: string;
}

interface JiraStore {
  issues: JiraIssue[];
  selectedIssue: JiraIssue | null;
  loading: boolean;
  loadIssues: (jql?: string) => Promise<void>;
  selectIssue: (key: string) => Promise<void>;
  createIssue: (data: any) => Promise<JiraIssue | null>;
  linkTestResult: (issueKey: string, testResultId: string) => Promise<void>;
}

export const useJiraStore = create<JiraStore>((set, get) => ({
  issues: [],
  selectedIssue: null,
  loading: false,

  loadIssues: async (jql?: string) => {
    set({ loading: true });
    try {
      const query = jql || 'order by created DESC';
      const issues = await ipc.jira.searchIssues(query);
      set({ issues, loading: false });
    } catch (error) {
      console.error('Failed to load Jira issues:', error);
      set({ loading: false });
    }
  },

  selectIssue: async (key: string) => {
    try {
      const issue = await ipc.jira.getIssue(key);
      set({ selectedIssue: issue || null });
    } catch (error) {
      console.error('Failed to load Jira issue:', error);
    }
  },

  createIssue: async (data: any) => {
    set({ loading: true });
    try {
      const issue = await ipc.jira.createIssue(data);
      if (issue) {
        set((state) => ({
          issues: [issue, ...state.issues],
          loading: false,
        }));
      }
      return issue;
    } catch (error) {
      console.error('Failed to create Jira issue:', error);
      set({ loading: false });
      return null;
    }
  },

  linkTestResult: async (issueKey: string, testResultId: string) => {
    try {
      await ipc.jira.linkTestResult(issueKey, testResultId);
    } catch (error) {
      console.error('Failed to link test result:', error);
      throw error;
    }
  },
}));

