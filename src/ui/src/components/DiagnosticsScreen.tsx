import React, { useEffect, useState } from 'react';
import { Activity, CheckCircle, XCircle, AlertCircle, RefreshCw, Database, Cloud, FileText, Bug, FolderGit, Settings, Server, HardDrive, Cpu, MemoryStick } from 'lucide-react';
import StatusBadge from './StatusBadge';
import Skeleton from './Skeleton';
import { ipc } from '../ipc';

interface IntegrationStatus {
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'checking';
  message?: string;
  icon: React.ReactNode;
}

const DiagnosticsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [databaseStatus, setDatabaseStatus] = useState<{ status: string; message?: string }>({ status: 'checking' });
  const [storageInfo, setStorageInfo] = useState<{ workspacePath?: string; repoCount?: number }>({});

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      // Get system information
      const sysInfo = {
        platform: process.platform,
        arch: process.arch,
        nodeVersion: process.versions.node,
        electronVersion: process.versions.electron,
        chromeVersion: process.versions.chrome,
      };
      setSystemInfo(sysInfo);

      // Check integrations
      await checkIntegrations();

      // Check database
      await checkDatabase();

      // Get storage info
      await loadStorageInfo();
    } catch (error) {
      console.error('Failed to load diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkIntegrations = async () => {
    const integrationStatuses: IntegrationStatus[] = [];

    // BrowserStack Automate
    try {
      const automateProjects = await ipc.bsAutomate.getProjects();
      integrationStatuses.push({
        name: 'BrowserStack Automate',
        status: automateProjects.length > 0 ? 'connected' : 'disconnected',
        message: automateProjects.length > 0 ? `${automateProjects.length} projects found` : 'No projects found',
        icon: <Cloud size={20} />,
      });
    } catch (error: any) {
      integrationStatuses.push({
        name: 'BrowserStack Automate',
        status: 'error',
        message: error.message || 'Connection failed',
        icon: <Cloud size={20} />,
      });
    }

    // BrowserStack Test Management
    try {
      const tmProjects = await ipc.bsTM.getProjects();
      integrationStatuses.push({
        name: 'BrowserStack Test Management',
        status: tmProjects.length > 0 ? 'connected' : 'disconnected',
        message: tmProjects.length > 0 ? `${tmProjects.length} projects found` : 'No projects found',
        icon: <FileText size={20} />,
      });
    } catch (error: any) {
      integrationStatuses.push({
        name: 'BrowserStack Test Management',
        status: 'error',
        message: error.message || 'Connection failed',
        icon: <FileText size={20} />,
      });
    }

    // Jira
    try {
      const jiraConnected = await ipc.jira.testConnection();
      integrationStatuses.push({
        name: 'Jira',
        status: jiraConnected ? 'connected' : 'disconnected',
        message: jiraConnected ? 'Connected successfully' : 'Not configured or connection failed',
        icon: <Bug size={20} />,
      });
    } catch (error: any) {
      integrationStatuses.push({
        name: 'Jira',
        status: 'error',
        message: error.message || 'Connection failed',
        icon: <Bug size={20} />,
      });
    }

    // Azure DevOps (check via repo detection)
    try {
      const clonedRepos = await ipc.repo.detectAllCloned();
      integrationStatuses.push({
        name: 'Azure DevOps',
        status: clonedRepos.length > 0 ? 'connected' : 'disconnected',
        message: clonedRepos.length > 0 ? `${clonedRepos.length} repositories detected` : 'No repositories configured',
        icon: <FolderGit size={20} />,
      });
    } catch (error: any) {
      integrationStatuses.push({
        name: 'Azure DevOps',
        status: 'error',
        message: error.message || 'Connection failed',
        icon: <FolderGit size={20} />,
      });
    }

    setIntegrations(integrationStatuses);
  };

  const checkDatabase = async () => {
    try {
      // Try to access storage - if it works, database is healthy
      const workspacePath = await ipc.repo.getDefaultWorkspace();
      setDatabaseStatus({
        status: 'healthy',
        message: 'SQLite database is accessible',
      });
    } catch (error: any) {
      setDatabaseStatus({
        status: 'error',
        message: error.message || 'Database access failed',
      });
    }
  };

  const loadStorageInfo = async () => {
    try {
      const workspacePath = await ipc.repo.getDefaultWorkspace();
      const clonedRepos = await ipc.repo.detectAllCloned();
      setStorageInfo({
        workspacePath: workspacePath || 'Not set',
        repoCount: clonedRepos.length,
      });
    } catch (error) {
      console.error('Failed to load storage info:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return 'text-success';
      case 'disconnected':
        return 'text-warning';
      case 'error':
        return 'text-error';
      default:
        return 'text-base-content/60';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'healthy':
        return <CheckCircle size={20} className="text-success" />;
      case 'disconnected':
        return <AlertCircle size={20} className="text-warning" />;
      case 'error':
        return <XCircle size={20} className="text-error" />;
      default:
        return <Activity size={20} className="text-base-content/60" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Activity size={32} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-base-content">System Diagnostics</h2>
              <p className="text-base-content/70 mt-1">
                View system health, integration status, and configuration
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={loadDiagnostics}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton variant="card" count={3} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Information */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Server size={20} className="text-primary" />
              <h3 className="text-lg font-semibold text-base-content">System Information</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-base-300">
                <span className="text-sm text-base-content/70">Platform</span>
                <span className="text-sm font-mono font-semibold">{systemInfo?.platform || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-base-300">
                <span className="text-sm text-base-content/70">Architecture</span>
                <span className="text-sm font-mono font-semibold">{systemInfo?.arch || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-base-300">
                <span className="text-sm text-base-content/70">Node.js</span>
                <span className="text-sm font-mono font-semibold">{systemInfo?.nodeVersion || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-base-300">
                <span className="text-sm text-base-content/70">Electron</span>
                <span className="text-sm font-mono font-semibold">{systemInfo?.electronVersion || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-base-content/70">Chrome</span>
                <span className="text-sm font-mono font-semibold">{systemInfo?.chromeVersion || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Database Status */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database size={20} className="text-primary" />
              <h3 className="text-lg font-semibold text-base-content">Database Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {getStatusIcon(databaseStatus.status)}
                <div>
                  <div className="font-semibold">SQLite Database</div>
                  <div className="text-sm text-base-content/70">{databaseStatus.message || 'Checking...'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Integration Status */}
          <div className="glass-card p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={20} className="text-primary" />
              <h3 className="text-lg font-semibold text-base-content">Integration Status</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations.map((integration) => (
                <div
                  key={integration.name}
                  className="flex items-start gap-3 p-4 bg-base-200 rounded-lg border border-base-300"
                >
                  <div className="mt-1">{integration.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{integration.name}</span>
                      {getStatusIcon(integration.status)}
                    </div>
                    <div className={`text-sm ${getStatusColor(integration.status)}`}>
                      {integration.message || 'Unknown status'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Storage Information */}
          <div className="glass-card p-6 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <HardDrive size={20} className="text-primary" />
              <h3 className="text-lg font-semibold text-base-content">Storage Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-base-200 rounded-lg border border-base-300">
                <div className="text-sm text-base-content/70 mb-1">Default Workspace</div>
                <div className="font-mono text-sm font-semibold break-all">
                  {storageInfo.workspacePath || 'Not configured'}
                </div>
              </div>
              <div className="p-4 bg-base-200 rounded-lg border border-base-300">
                <div className="text-sm text-base-content/70 mb-1">Cloned Repositories</div>
                <div className="text-2xl font-bold text-primary">
                  {storageInfo.repoCount ?? 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticsScreen;
