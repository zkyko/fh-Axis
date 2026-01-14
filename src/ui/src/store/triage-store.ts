import { create } from 'zustand';
import { ipc } from '../ipc';

export interface TriageMetadata {
  testId: string;
  assignee?: string;
  labels?: string[];
  notes?: string;
}

interface TriageStore {
  triageData: Map<string, TriageMetadata>;
  saveTriageMetadata: (testId: string, metadata: TriageMetadata) => Promise<void>;
  getTriageMetadata: (testId: string) => Promise<TriageMetadata | null>;
}

export const useTriageStore = create<TriageStore>((set, get) => ({
  triageData: new Map(),

  saveTriageMetadata: async (testId: string, metadata: TriageMetadata) => {
    try {
      await ipc.triage.saveMetadata(testId, metadata);
      set((state) => {
        const newMap = new Map(state.triageData);
        newMap.set(testId, metadata);
        return { triageData: newMap };
      });
    } catch (error) {
      console.error('Failed to save triage metadata:', error);
      throw error;
    }
  },

  getTriageMetadata: async (testId: string) => {
    // Check cache first
    const cached = get().triageData.get(testId);
    if (cached) return cached;

    try {
      const metadata = await ipc.triage.getMetadata(testId);
      if (metadata) {
        set((state) => {
          const newMap = new Map(state.triageData);
          newMap.set(testId, metadata);
          return { triageData: newMap };
        });
      }
      return metadata;
    } catch (error) {
      console.error('Failed to get triage metadata:', error);
      return null;
    }
  },
}));

