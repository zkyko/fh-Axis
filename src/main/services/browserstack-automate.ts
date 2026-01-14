import axios, { AxiosInstance } from 'axios';

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

export interface SessionDetails extends Session {
  videoUrl?: string;
  consoleLogs?: string[];
  networkLogs?: string;
  screenshots?: string[];
  bsSessionUrl?: string;
}

export class BrowserStackAutomateService {
  private client: AxiosInstance;
  private username: string;
  private accessKey: string;

  constructor(username: string, accessKey: string) {
    this.username = username;
    this.accessKey = accessKey;
    this.client = axios.create({
      baseURL: 'https://api.browserstack.com/automate',
      auth: {
        username,
        password: accessKey,
      },
      timeout: 30000,
    });
  }

  async getProjects(): Promise<Project[]> {
    try {
      // BrowserStack Automate API doesn't have a projects endpoint
      // Instead, we get all builds and extract unique project names
      const response = await this.client.get('/builds.json', {
        params: { limit: 200 } // Get more builds to extract projects
      });
      const builds = response.data || [];
      console.log('[Automate Service] Total builds fetched:', builds.length);
      
      // Log first build structure to understand the data
      if (builds.length > 0) {
        console.log('[Automate Service] First build keys:', Object.keys(builds[0]));
        console.log('[Automate Service] First build sample:', JSON.stringify(builds[0], null, 2).substring(0, 500));
      }
      
      // Extract unique projects from builds
      // Note: BrowserStack API wraps builds in 'automation_build' object
      const projectMap = new Map<string, Project>();
      builds.forEach((buildWrapper: any) => {
        // Access the actual build data from automation_build wrapper
        const build = buildWrapper.automation_build || buildWrapper;
        
        // BrowserStack builds might have different field names
        // Try multiple possible field names for project identification
        const projectName = build.project_name || build.project || build.name || null;
        const projectId = build.project_id?.toString() || build.project_id || null;
        
        // Skip builds without project information
        if (!projectName && !projectId) {
          console.warn('[Automate Service] Build missing project info:', {
            hashed_id: build.hashed_id,
            name: build.name,
            keys: Object.keys(build),
          });
          return;
        }
        
        // Use project_id if available (numeric), otherwise use project_name
        const finalProjectId = projectId || projectName;
        const finalProjectName = projectName || `Project ${projectId}`;
        
        if (!projectMap.has(finalProjectId)) {
          projectMap.set(finalProjectId, {
            id: finalProjectId,
            name: finalProjectName,
            buildsCount: 0,
            lastActivity: build.created_at,
          });
        }
        
        const project = projectMap.get(finalProjectId)!;
        project.buildsCount = (project.buildsCount || 0) + 1;
        if (build.created_at && (!project.lastActivity || build.created_at > project.lastActivity)) {
          project.lastActivity = build.created_at;
        }
      });
      
      const projects = Array.from(projectMap.values());
      console.log('[Automate Service] Extracted projects:', projects.map(p => ({ id: p.id, name: p.name, builds: p.buildsCount })));
      return projects;
    } catch (error: any) {
      console.error('[Automate Service] Failed to fetch projects:', error);
      console.error('[Automate Service] Error response:', error.response?.data);
      return [];
    }
  }

  async getBuilds(projectIdOrName?: string): Promise<Build[]> {
    try {
      console.log('[Automate Service] Fetching builds for project:', projectIdOrName);
      const params: any = { limit: 100 };
      
      const response = await this.client.get('/builds.json', { params });
      const builds = response.data || [];
      console.log('[Automate Service] Total builds fetched:', builds.length);
      
      // Filter builds by project if projectId is provided
      // Note: BrowserStack API wraps builds in 'automation_build' object
      let filteredBuilds = builds;
      if (projectIdOrName) {
        filteredBuilds = builds.filter((buildWrapper: any) => {
          // Access the actual build data from automation_build wrapper
          const build = buildWrapper.automation_build || buildWrapper;
          
          // Try multiple possible field names for project identification
          const buildProjectName = build.project_name || build.project || build.name || '';
          const buildProjectId = build.project_id?.toString() || build.project_id || '';
          
          // Match by project_id (numeric) or project_name
          const matches = buildProjectId === projectIdOrName || 
                         buildProjectName === projectIdOrName ||
                         buildProjectId === projectIdOrName.toString();
          
          if (matches) {
            console.log('[Automate Service] Matched build:', build.name, 'for project:', {
              project_id: buildProjectId,
              project_name: buildProjectName,
              searching_for: projectIdOrName,
            });
          }
          return matches;
        });
        console.log('[Automate Service] Filtered builds count:', filteredBuilds.length);
        if (filteredBuilds.length === 0 && builds.length > 0) {
          console.log('[Automate Service] No builds matched. Looking for project:', projectIdOrName);
          const allProjectIds = [...new Set(builds.map((b: any) => {
            const build = b.automation_build || b;
            return build.project_id?.toString() || build.project_id;
          }).filter(Boolean))];
          const allProjectNames = [...new Set(builds.map((b: any) => {
            const build = b.automation_build || b;
            return build.project_name || build.project || build.name;
          }).filter(Boolean))];
          console.log('[Automate Service] Available project IDs:', allProjectIds);
          console.log('[Automate Service] Available project names:', allProjectNames);
          const firstBuild = builds[0].automation_build || builds[0];
          console.log('[Automate Service] Sample build structure:', {
            name: firstBuild.name,
            project_name: firstBuild.project_name,
            project: firstBuild.project,
            project_id: firstBuild.project_id,
            keys: Object.keys(firstBuild),
          });
        }
      }
      
      return filteredBuilds.map((buildWrapper: any) => {
        const build = buildWrapper.automation_build || buildWrapper;
        return {
          id: build.hashed_id || build.id || '',
          name: build.name || build.hashed_id || 'Unnamed Build',
          status: build.status || 'unknown',
          duration: build.duration,
          browserMatrix: build.browser,
          createdAt: build.created_at || build.createdAt || new Date().toISOString(),
          sessionsCount: build.sessions_count || 0,
        };
      });
    } catch (error: any) {
      console.error('[Automate Service] Failed to fetch builds:', error);
      console.error('[Automate Service] Error response:', error.response?.data);
      console.error('[Automate Service] Request URL:', error.config?.url);
      return [];
    }
  }

  async getSessions(buildId: string): Promise<Session[]> {
    try {
      const response = await this.client.get(`/builds/${buildId}/sessions.json`);
      const sessions = response.data || [];
      // BrowserStack API might wrap sessions in 'automation_session' objects
      return sessions.map((sessionWrapper: any) => {
        const session = sessionWrapper.automation_session || sessionWrapper;
        return {
          id: session.hashed_id || session.id || '',
          name: session.name || session.hashed_id || 'Unnamed Session',
          status: session.status || 'unknown',
          duration: session.duration,
          browser: session.browser,
          os: session.os,
          createdAt: session.created_at || new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      return [];
    }
  }

  async getSessionDetails(sessionId: string): Promise<SessionDetails | null> {
    try {
      const response = await this.client.get(`/sessions/${sessionId}.json`);
      const data = response.data;
      
      // Ensure consoleLogs is always an array
      let consoleLogs: string[] = [];
      const logs = data.automation_session?.logs;
      if (Array.isArray(logs)) {
        consoleLogs = logs;
      } else if (typeof logs === 'string') {
        // If logs is a string, split by newlines
        consoleLogs = logs.split('\n').filter(line => line.trim().length > 0);
      }

      // Ensure screenshots is always an array
      let screenshots: string[] = [];
      const screenshotsData = data.automation_session?.screenshots;
      if (Array.isArray(screenshotsData)) {
        screenshots = screenshotsData;
      } else if (screenshotsData) {
        screenshots = [screenshotsData];
      }

      return {
        id: data.automation_session?.hashed_id || sessionId,
        name: data.automation_session?.name || '',
        status: data.automation_session?.status || 'unknown',
        browser: data.automation_session?.browser,
        os: data.automation_session?.os,
        duration: data.automation_session?.duration,
        testName: data.automation_session?.name,
        videoUrl: data.automation_session?.video_url,
        consoleLogs,
        networkLogs: data.automation_session?.har_logs_url,
        screenshots,
        bsSessionUrl: `https://automate.browserstack.com/dashboard/v2/builds/${data.automation_session?.build_hashed_id}/sessions/${sessionId}`,
      };
    } catch (error) {
      console.error('Failed to fetch session details:', error);
      return null;
    }
  }

  async getSessionVideo(sessionId: string): Promise<string | null> {
    try {
      const details = await this.getSessionDetails(sessionId);
      return details?.videoUrl || null;
    } catch (error) {
      console.error('Failed to fetch session video:', error);
      return null;
    }
  }

  async getSessionLogs(sessionId: string): Promise<string[]> {
    try {
      const details = await this.getSessionDetails(sessionId);
      return details?.consoleLogs || [];
    } catch (error) {
      console.error('Failed to fetch session logs:', error);
      return [];
    }
  }

  /**
   * Get a single build by hashed ID with public URL
   */
  async getBuild(buildHashedId: string): Promise<Build & { public_url?: string } | null> {
    try {
      const response = await this.client.get('/builds.json', {
        params: { limit: 200 }
      });
      const builds = response.data || [];
      
      // Find the build with matching hashed_id
      const buildWrapper = builds.find((b: any) => {
        const build = b.automation_build || b;
        return (build.hashed_id || build.id) === buildHashedId;
      });

      if (!buildWrapper) {
        return null;
      }

      const build = buildWrapper.automation_build || buildWrapper;
      
      // Construct public URL
      const publicUrl = `https://automate.browserstack.com/dashboard/v2/builds/${buildHashedId}`;

      return {
        id: build.hashed_id || build.id || buildHashedId,
        name: build.name || buildHashedId || 'Unnamed Build',
        status: build.status || 'unknown',
        duration: build.duration,
        browserMatrix: build.browser,
        createdAt: build.created_at || build.createdAt || new Date().toISOString(),
        public_url: publicUrl,
      };
    } catch (error) {
      console.error('Failed to fetch build:', error);
      return null;
    }
  }

  /**
   * List all sessions for a build with public URLs and capabilities
   */
  async listBuildSessions(buildHashedId: string): Promise<Array<Session & { public_url?: string; caps?: { os?: string; osVersion?: string; browser?: string; browserVersion?: string; device?: string; realMobile?: boolean } }>> {
    try {
      const response = await this.client.get(`/builds/${buildHashedId}/sessions.json`);
      const sessions = response.data || [];
      
      return sessions.map((sessionWrapper: any) => {
        const session = sessionWrapper.automation_session || sessionWrapper;
        const sessionId = session.hashed_id || session.id || '';
        
        // Construct public URL
        const publicUrl = `https://automate.browserstack.com/dashboard/v2/builds/${buildHashedId}/sessions/${sessionId}`;

        // Extract capabilities
        const caps = {
          os: session.os,
          osVersion: session.os_version,
          browser: session.browser,
          browserVersion: session.browser_version,
          device: session.device,
          realMobile: session.real_mobile || false,
        };

        return {
          id: sessionId,
          name: session.name || sessionId || 'Unnamed Session',
          status: session.status || 'unknown',
          duration: session.duration,
          browser: session.browser,
          os: session.os,
          testName: session.name,
          public_url: publicUrl,
          caps,
        };
      });
    } catch (error) {
      console.error('Failed to fetch build sessions:', error);
      return [];
    }
  }

  /**
   * Get session details with public URL and capabilities
   */
  async getSession(sessionHashedId: string): Promise<(SessionDetails & { public_url?: string; caps?: { os?: string; osVersion?: string; browser?: string; browserVersion?: string; device?: string; realMobile?: boolean } }) | null> {
    try {
      const response = await this.client.get(`/sessions/${sessionHashedId}.json`);
      const data = response.data;
      const session = data.automation_session || data;
      
      if (!session) {
        return null;
      }

      const buildHashedId = session.build_hashed_id || '';
      const publicUrl = `https://automate.browserstack.com/dashboard/v2/builds/${buildHashedId}/sessions/${sessionHashedId}`;

      // Extract capabilities
      const caps = {
        os: session.os,
        osVersion: session.os_version,
        browser: session.browser,
        browserVersion: session.browser_version,
        device: session.device,
        realMobile: session.real_mobile || false,
      };

      // Ensure consoleLogs is always an array
      let consoleLogs: string[] = [];
      const logs = session.logs;
      if (Array.isArray(logs)) {
        consoleLogs = logs;
      } else if (typeof logs === 'string') {
        consoleLogs = logs.split('\n').filter(line => line.trim().length > 0);
      }

      // Ensure screenshots is always an array
      let screenshots: string[] = [];
      const screenshotsData = session.screenshots;
      if (Array.isArray(screenshotsData)) {
        screenshots = screenshotsData;
      } else if (screenshotsData) {
        screenshots = [screenshotsData];
      }

      return {
        id: session.hashed_id || sessionHashedId,
        name: session.name || '',
        status: session.status || 'unknown',
        browser: session.browser,
        os: session.os,
        duration: session.duration,
        testName: session.name,
        videoUrl: session.video_url,
        consoleLogs,
        networkLogs: session.har_logs_url,
        screenshots,
        bsSessionUrl: publicUrl,
        public_url: publicUrl,
        caps,
      };
    } catch (error) {
      console.error('Failed to fetch session:', error);
      return null;
    }
  }
}

