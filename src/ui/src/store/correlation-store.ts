import { create } from 'zustand';
import { ipc } from '../ipc';

export interface CorrelatedData {
  testResultId: string;
  testResult?: any;
  automateSession?: any;
  jiraIssue?: any;
}

interface CorrelationStore {
  correlations: Map<string, CorrelatedData>;
  loading: boolean;
  correlate: (testResultId: string) => Promise<CorrelatedData | null>;
  getCorrelation: (testResultId: string) => CorrelatedData | null;
}

export const useCorrelationStore = create<CorrelationStore>((set, get) => ({
  correlations: new Map(),
  loading: false,

  correlate: async (testResultId: string) => {
    set({ loading: true });
    try {
      const data = await ipc.correlation.correlate(testResultId);
      if (data) {
        const correlated: CorrelatedData = {
          testResultId,
          ...data,
        };
        set((state) => {
          const newMap = new Map(state.correlations);
          newMap.set(testResultId, correlated);
          return { correlations: newMap, loading: false };
        });
        return correlated;
      }
      set({ loading: false });
      return null;
    } catch (error) {
      console.error('Failed to correlate:', error);
      set({ loading: false });
      return null;
    }
  },

  getCorrelation: (testResultId: string) => {
    return get().correlations.get(testResultId) || null;
  },
}));

