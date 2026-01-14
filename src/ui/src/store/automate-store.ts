import { create } from 'zustand';
import { ipc } from '../ipc';

export interface Project {
  id: string;
  name: string;
  buildsCount?: number;
  lastActivity?: string;
}

export interface Build {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  duration?: number;
  browserMatrix?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  name: string;
  status: string;
  browser?: string;
  os?: string;
  duration?: number;
  testName?: string;
}

interface AutomateStore {
  projects: Project[];
  selectedProject: Project | null;
  builds: Build[];
  selectedBuild: Build | null;
  sessions: Session[];
  selectedSession: Session | null;
  loading: boolean;
  loadProjects: () => Promise<void>;
  selectProject: (id: string) => Promise<void>;
  loadBuilds: (projectId: string) => Promise<void>;
  selectBuild: (id: string) => Promise<void>;
  loadSessions: (buildId: string) => Promise<void>;
  selectSession: (id: string) => Promise<void>;
}

export const useAutomateStore = create<AutomateStore>((set, get) => ({
  projects: [],
  selectedProject: null,
  builds: [],
  selectedBuild: null,
  sessions: [],
  selectedSession: null,
  loading: false,

  loadProjects: async () => {
    set({ loading: true });
    try {
      const projects = await ipc.bsAutomate.getProjects();
      set({ projects, loading: false });
    } catch (error) {
      console.error('Failed to load projects:', error);
      set({ loading: false });
    }
  },

  selectProject: async (id: string) => {
    const project = get().projects.find((p) => p.id === id);
    set({ selectedProject: project || null, builds: [], selectedBuild: null });
    if (project) {
      await get().loadBuilds(id);
    }
  },

  loadBuilds: async (projectId: string) => {
    set({ loading: true });
    try {
      const builds = await ipc.bsAutomate.getBuilds(projectId);
      set({ builds, loading: false });
    } catch (error) {
      console.error('Failed to load builds:', error);
      set({ loading: false });
    }
  },

  selectBuild: async (id: string) => {
    const build = get().builds.find((b) => b.id === id);
    set({ selectedBuild: build || null, sessions: [], selectedSession: null });
    if (build) {
      await get().loadSessions(id);
    }
  },

  loadSessions: async (buildId: string) => {
    set({ loading: true });
    try {
      const sessions = await ipc.bsAutomate.getSessions(buildId);
      set({ sessions, loading: false });
    } catch (error) {
      console.error('Failed to load sessions:', error);
      set({ loading: false });
    }
  },

  selectSession: async (id: string) => {
    const session = get().sessions.find((s) => s.id === id);
    set({ selectedSession: session || null });
  },
}));

