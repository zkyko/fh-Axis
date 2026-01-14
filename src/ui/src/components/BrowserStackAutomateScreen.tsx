import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Cloud, ChevronRight, ChevronLeft, Loader, Play, CheckCircle, XCircle, AlertCircle, Clock, Monitor, ExternalLink, Video, FileText, Network, Image as ImageIcon, X, Bug } from 'lucide-react';
import { ipc } from '../ipc';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';
import StatusBadge from './StatusBadge';
import Button from './Button';
import JiraBugCreationModal from './JiraBugCreationModal';

interface Project {
  id: string;
  name: string;
  buildsCount?: number;
  lastActivity?: string;
}

interface Build {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  duration?: number;
  browserMatrix?: string;
  createdAt: string;
  sessionsCount?: number;
}

interface Session {
  id: string;
  name: string;
  status: string;
  browser?: string;
  os?: string;
  duration?: number;
  testName?: string;
}

interface SessionDetails extends Session {
  videoUrl?: string;
  consoleLogs?: string[];
  networkLogs?: string;
  screenshots?: string[];
  bsSessionUrl?: string;
  buildId?: string;
}

const BrowserStackAutomateScreen: React.FC = () => {
  const { projectId, buildId, sessionId } = useParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBuild, setSelectedBuild] = useState<Build | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'video' | 'console' | 'network' | 'screenshots'>('video');
  const [showJiraModal, setShowJiraModal] = useState(false);
  const [jiraModalInput, setJiraModalInput] = useState<{ type: 'build' | 'session' | 'tm'; id: string; projectId?: string } | null>(null);

  useEffect(() => {
    if (!projectId) {
      loadProjects();
    } else if (!buildId) {
      loadProject(projectId);
      loadBuilds(projectId);
    } else if (!sessionId) {
      loadBuild(buildId);
      loadSessions(buildId);
    } else {
      loadSessionDetails(sessionId);
    }
  }, [projectId, buildId, sessionId]);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const projectsList = await ipc.bsAutomate.getProjects();
      setProjects(projectsList);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async (id: string) => {
    console.log('[Automate] Loading project with ID:', id, 'Type:', typeof id);
    console.log('[Automate] Available projects in cache:', projects.map(p => ({ id: p.id, name: p.name, idType: typeof p.id })));
    // Try to match by ID (could be numeric string or project name)
    const project = projects.find(p => 
      p.id === id || 
      p.id === id.toString() || 
      p.name === id ||
      p.id.toString() === id.toString()
    );
    if (project) {
      console.log('[Automate] Found project in cache:', project);
      setSelectedProject(project);
    } else {
      // Try to load from projects list
      console.log('[Automate] Project not in cache, fetching projects list');
      const projectsList = await ipc.bsAutomate.getProjects();
      console.log('[Automate] Fetched projects:', projectsList.map(p => ({ id: p.id, name: p.name, idType: typeof p.id })));
      // Try multiple matching strategies
      const found = projectsList.find(p => 
        p.id === id || 
        p.id === id.toString() || 
        p.name === id ||
        p.id.toString() === id.toString()
      );
      if (found) {
        console.log('[Automate] Found project after fetch:', found);
        setSelectedProject(found);
        setProjects(projectsList);
      } else {
        console.log('[Automate] Project not found. Searching for ID:', id);
        console.log('[Automate] Available project IDs:', projectsList.map(p => ({ id: p.id, name: p.name, idType: typeof p.id })));
      }
    }
  };

  const loadBuilds = async (projectIdParam: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('[Automate] Loading builds for project:', projectIdParam);
      const buildsList = await ipc.bsAutomate.getBuilds(projectIdParam);
      console.log('[Automate] Builds response:', buildsList);
      setBuilds(buildsList);
    } catch (err: any) {
      console.error('[Automate] Error loading builds:', err);
      setError(err.message || 'Failed to load builds');
    } finally {
      setLoading(false);
    }
  };

  const loadBuild = async (id: string) => {
    const build = builds.find(b => b.id === id);
    if (build) {
      setSelectedBuild(build);
    }
  };

  const loadSessions = async (buildIdParam: string) => {
    setLoading(true);
    setError(null);
    try {
      const sessionsList = await ipc.bsAutomate.getSessions(buildIdParam);
      setSessions(sessionsList);
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetails = async (sessionIdParam: string) => {
    setLoading(true);
    setError(null);
    try {
      const details = await ipc.bsAutomate.getSessionDetails(sessionIdParam);
      if (details) {
        setSelectedSession(details);
      } else {
        setError('Session not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Level 1: Projects List
  if (!projectId) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">BrowserStack Automate Projects</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={Cloud}
            title="No Projects Found"
            description="No BrowserStack Automate projects available"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>PROJECT NAME</th>
                  <th>BUILDS</th>
                  <th>LAST ACTIVITY</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="cursor-pointer hover:bg-base-300"
                    onClick={() => window.location.hash = `/automate/${project.id}`}
                  >
                    <td className="font-mono font-semibold">{project.id}</td>
                    <td className="font-semibold">{project.name}</td>
                    <td>{project.buildsCount ?? 0}</td>
                    <td className="text-sm text-base-content/60">
                      {project.lastActivity ? formatDate(project.lastActivity) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // Level 2: Builds List
  if (!buildId) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="breadcrumbs text-sm mb-2">
              <ul>
                <li>
                  <a href="#/automate" onClick={(e) => { e.preventDefault(); window.location.hash = '/automate'; }}>
                    Projects
                  </a>
                </li>
                <li>{selectedProject?.name || projectId}</li>
              </ul>
            </div>
            <h2 className="text-2xl font-bold">{selectedProject?.name || 'Builds'}</h2>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : builds.length === 0 ? (
          <EmptyState
            icon={Cloud}
            title="No Builds Found"
            description="No builds available for this project"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>BUILD NAME</th>
                  <th>STATUS</th>
                  <th>SESSIONS</th>
                  <th>DURATION</th>
                  <th>CREATED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {builds.map((build) => (
                  <tr
                    key={build.id}
                    className="cursor-pointer hover:bg-base-300"
                    onClick={() => window.location.hash = `/automate/${projectId}/builds/${build.id}`}
                  >
                    <td className="font-semibold">{build.name}</td>
                    <td>
                      <StatusBadge status={build.status} />
                    </td>
                    <td>{build.sessionsCount ?? 0}</td>
                    <td>{formatDuration(build.duration)}</td>
                    <td className="text-sm text-base-content/60">{formatDate(build.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      {(build.status === 'failed' || build.status === 'error') && (
                        <button
                          className="btn btn-xs btn-secondary"
                          onClick={() => {
                            setJiraModalInput({ type: 'build', id: build.id });
                            setShowJiraModal(true);
                          }}
                        >
                          <Bug size={12} />
                          Create Jira Bug
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // Level 3: Sessions List or Session Details
  if (!sessionId) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="breadcrumbs text-sm mb-2">
              <ul>
                <li>
                  <a href="#/automate" onClick={(e) => { e.preventDefault(); window.location.hash = '/automate'; }}>
                    Projects
                  </a>
                </li>
                <li>
                  <a href={`#/automate/${projectId}`} onClick={(e) => { e.preventDefault(); window.location.hash = `/automate/${projectId}`; }}>
                    {selectedProject?.name || projectId}
                  </a>
                </li>
                <li>{selectedBuild?.name || buildId}</li>
              </ul>
            </div>
            <h2 className="text-2xl font-bold">{selectedBuild?.name || 'Sessions'}</h2>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={Cloud}
            title="No Sessions Found"
            description="No sessions available for this build"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>SESSION NAME</th>
                  <th>STATUS</th>
                  <th>BROWSER / OS</th>
                  <th>DURATION</th>
                  <th>TEST NAME</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr
                    key={session.id}
                    className="cursor-pointer hover:bg-base-300"
                    onClick={() => window.location.hash = `/automate/${projectId}/builds/${buildId}/sessions/${session.id}`}
                  >
                    <td className="font-semibold">{session.name || session.id}</td>
                    <td>
                      <StatusBadge status={session.status} />
                    </td>
                    <td>
                      <div className="text-sm">
                        {session.browser && <div>{session.browser}</div>}
                        {session.os && <div className="text-base-content/60">{session.os}</div>}
                      </div>
                    </td>
                    <td>{formatDuration(session.duration)}</td>
                    <td className="text-sm">{session.testName || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // Level 4: Session Details
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="breadcrumbs text-sm mb-2">
            <ul>
              <li>
                <a href="#/automate" onClick={(e) => { e.preventDefault(); window.location.hash = '/automate'; }}>
                  Projects
                </a>
              </li>
              <li>
                <a href={`#/automate/${projectId}`} onClick={(e) => { e.preventDefault(); window.location.hash = `/automate/${projectId}`; }}>
                  {selectedProject?.name || projectId}
                </a>
              </li>
              <li>
                <a href={`#/automate/${projectId}/builds/${buildId}`} onClick={(e) => { e.preventDefault(); window.location.hash = `/automate/${projectId}/builds/${buildId}`; }}>
                  {selectedBuild?.name || buildId}
                </a>
              </li>
              <li>Session Details</li>
            </ul>
          </div>
          <h2 className="text-2xl font-bold">{selectedSession?.name || selectedSession?.testName || 'Session Details'}</h2>
        </div>
        <div className="flex gap-2">
          {selectedSession?.bsSessionUrl && (
            <a
              href={selectedSession.bsSessionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-sm btn-primary"
            >
              <ExternalLink size={16} />
              Open in BrowserStack
            </a>
          )}
          <button
            className="btn btn-sm btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              setJiraModalInput({ type: 'session', id: sessionId! });
              setShowJiraModal(true);
            }}
          >
            <Bug size={16} />
            Create Jira Bug
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-32" />
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : !selectedSession ? (
        <EmptyState
          icon={Cloud}
          title="Session Not Found"
          description="The requested session could not be loaded"
        />
      ) : (
        <div className="space-y-6">
          {/* Session Metadata */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-xs text-base-content/60 mb-1">Status</div>
              <StatusBadge status={selectedSession.status} />
            </div>
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-xs text-base-content/60 mb-1">Browser</div>
              <div className="text-sm font-medium">{selectedSession.browser || 'N/A'}</div>
            </div>
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-xs text-base-content/60 mb-1">OS</div>
              <div className="text-sm font-medium">{selectedSession.os || 'N/A'}</div>
            </div>
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="text-xs text-base-content/60 mb-1">Duration</div>
              <div className="text-sm font-medium">{formatDuration(selectedSession.duration)}</div>
            </div>
          </div>

          {/* Evidence Viewer Tabs */}
          <div className="card bg-base-200">
            <div className="card-body">
              <div className="tabs tabs-boxed mb-4">
                <button
                  className={`tab ${activeTab === 'video' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('video')}
                >
                  <Video size={16} />
                  Video
                </button>
                <button
                  className={`tab ${activeTab === 'console' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('console')}
                >
                  <FileText size={16} />
                  Console Logs
                </button>
                <button
                  className={`tab ${activeTab === 'network' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('network')}
                >
                  <Network size={16} />
                  Network
                </button>
                <button
                  className={`tab ${activeTab === 'screenshots' ? 'tab-active' : ''}`}
                  onClick={() => setActiveTab('screenshots')}
                >
                  <ImageIcon size={16} />
                  Screenshots
                </button>
              </div>

              <div className="min-h-[400px]">
                {activeTab === 'video' && (
                  <div>
                    {selectedSession.videoUrl ? (
                      <video
                        controls
                        className="w-full rounded-lg"
                        src={selectedSession.videoUrl}
                      >
                        Your browser does not support video playback.
                      </video>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-base-content/60">
                        <div className="text-center">
                          <Video size={48} className="mx-auto mb-2 opacity-50" />
                          <p>No video available for this session</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'console' && (
                  <div>
                    {selectedSession.consoleLogs && Array.isArray(selectedSession.consoleLogs) && selectedSession.consoleLogs.length > 0 ? (
                      <div className="bg-base-300 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto">
                        {selectedSession.consoleLogs.map((log, idx) => (
                          <div key={idx} className="mb-1">{log}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-base-content/60">
                        <div className="text-center">
                          <FileText size={48} className="mx-auto mb-2 opacity-50" />
                          <p>No console logs available</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'network' && (
                  <div>
                    {selectedSession.networkLogs ? (
                      <div className="bg-base-300 rounded-lg p-4">
                        <a
                          href={selectedSession.networkLogs}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary"
                        >
                          <ExternalLink size={16} />
                          Download HAR Logs
                        </a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-base-content/60">
                        <div className="text-center">
                          <Network size={48} className="mx-auto mb-2 opacity-50" />
                          <p>No network logs available</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'screenshots' && (
                  <div>
                    {selectedSession.screenshots && Array.isArray(selectedSession.screenshots) && selectedSession.screenshots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedSession.screenshots.map((screenshot, idx) => (
                          <div key={idx} className="bg-base-300 rounded-lg overflow-hidden">
                            <img
                              src={screenshot}
                              alt={`Screenshot ${idx + 1}`}
                              className="w-full h-auto"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-64 text-base-content/60">
                        <div className="text-center">
                          <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                          <p>No screenshots available</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jira Bug Creation Modal */}
      {jiraModalInput && (
        <JiraBugCreationModal
          isOpen={showJiraModal}
          onClose={() => {
            setShowJiraModal(false);
            setJiraModalInput(null);
          }}
          failureInput={jiraModalInput}
        />
      )}
    </div>
  );
};

export default BrowserStackAutomateScreen;
