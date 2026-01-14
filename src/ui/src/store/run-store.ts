import { create } from 'zustand';
import { ipc } from '../ipc';

export interface Run {
  id: string;
  adoPipelineId?: string;
  adoRunId?: string;
  adoRunUrl?: string;
  correlationKey?: string;
  requestedScope?: 'all' | 'file' | 'tag' | 'grep';
  testFile?: string;
  testTag?: string;
  testGrep?: string;
  repoId?: string;
  branch?: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
}

interface RunStore {
  runs: Run[];
  activeRuns: Run[];
  selectedRun: Run | null;
  loading: boolean;
  error: string | null;
  loadRuns: (limit?: number) => Promise<void>;
  loadActiveRuns: () => Promise<void>;
  selectRun: (id: string) => Promise<void>;
  addRun: (run: Run) => void;
  updateRun: (runId: string, updates: Partial<Run>) => void;
  refreshActiveRuns: () => Promise<void>;
}

export const useRunStore = create<RunStore>((set, get) => ({
  runs: [],
  activeRuns: [],
  selectedRun: null,
  loading: false,
  error: null,

  loadRuns: async (limit = 50) => {
    set({ loading: true, error: null });
    try {
      const runs = await ipc.runs.getAll(limit);
      set({ runs, loading: false });
    } catch (error: any) {
      console.error('Failed to load runs:', error);
      set({ loading: false, error: error.message || 'Failed to load runs' });
    }
  },

  loadActiveRuns: async () => {
    try {
      const activeRuns = await ipc.runs.getActive();
      set({ activeRuns });
    } catch (error: any) {
      console.error('Failed to load active runs:', error);
      set({ error: error.message || 'Failed to load active runs' });
    }
  },

  selectRun: async (id: string) => {
    const run = get().runs.find((r) => r.id === id) || 
                get().activeRuns.find((r) => r.id === id);
    if (run) {
      set({ selectedRun: run });
    } else {
      // Try to fetch from backend
      try {
        const run = await ipc.runs.get(id);
        if (run) {
          set({ selectedRun: run });
        }
      } catch (error) {
        console.error('Failed to load run:', error);
      }
    }
  },

  addRun: (run: Run) => {
    set((state) => ({
      runs: [run, ...state.runs],
      activeRuns: run.status === 'queued' || run.status === 'running' 
        ? [run, ...state.activeRuns.filter(r => r.id !== run.id)]
        : state.activeRuns,
    }));
  },

  updateRun: (runId: string, updates: Partial<Run>) => {
    set((state) => {
      const updatedRuns = state.runs.map((r) =>
        r.id === runId ? { ...r, ...updates } : r
      );
      const updatedActiveRuns = state.activeRuns.map((r) =>
        r.id === runId ? { ...r, ...updates } : r
      ).filter((r) => r.status === 'queued' || r.status === 'running');
      
      const updatedSelectedRun = state.selectedRun?.id === runId
        ? { ...state.selectedRun, ...updates }
        : state.selectedRun;

      return {
        runs: updatedRuns,
        activeRuns: updatedActiveRuns,
        selectedRun: updatedSelectedRun,
      };
    });
  },

  refreshActiveRuns: async () => {
    await get().loadActiveRuns();
  },
}));

