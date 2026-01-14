import { create } from 'zustand';
import { ipc } from '../ipc';

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

interface TMStore {
  projects: TMProject[];
  selectedProject: TMProject | null;
  runs: TestRun[];
  selectedRun: TestRun | null;
  results: TestResult[];
  loading: boolean;
  loadProjects: () => Promise<void>;
  selectProject: (id: string) => Promise<void>;
  loadRuns: (projectId: string, filters?: any) => Promise<void>;
  selectRun: (id: string) => Promise<void>;
  loadResults: (runId: string) => Promise<void>;
}

export const useTMStore = create<TMStore>((set, get) => ({
  projects: [],
  selectedProject: null,
  runs: [],
  selectedRun: null,
  results: [],
  loading: false,

  loadProjects: async () => {
    set({ loading: true });
    try {
      const projects = await ipc.bsTM.getProjects();
      set({ projects, loading: false });
    } catch (error) {
      console.error('Failed to load TM projects:', error);
      set({ loading: false });
    }
  },

  selectProject: async (id: string) => {
    const project = get().projects.find((p) => p.id === id);
    set({ selectedProject: project || null, runs: [], selectedRun: null });
    if (project) {
      await get().loadRuns(id);
    }
  },

  loadRuns: async (projectId: string, filters?: any) => {
    set({ loading: true });
    try {
      const runs = await ipc.bsTM.getRuns(projectId, filters);
      set({ runs, loading: false });
    } catch (error) {
      console.error('Failed to load test runs:', error);
      set({ loading: false });
    }
  },

  selectRun: async (id: string) => {
    const run = get().runs.find((r) => r.id === id);
    set({ selectedRun: run || null, results: [] });
    if (run) {
      await get().loadResults(id);
    }
  },

  loadResults: async (runId: string) => {
    set({ loading: true });
    try {
      const results = await ipc.bsTM.getResults(runId);
      set({ results, loading: false });
    } catch (error) {
      console.error('Failed to load test results:', error);
      set({ loading: false });
    }
  },
}));

