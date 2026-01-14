import React, { useEffect, useState } from 'react';
import { Settings, CheckCircle, XCircle, Loader, Download, RefreshCw } from 'lucide-react';
import { ipc } from '../ipc';
import Button from './Button';

const SettingsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState('azure');
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});

  // Azure settings - support multiple repos
  const [azureConfig, setAzureConfig] = useState({
    organization: 'fourhands',
    project: 'QA Automation',
    pat: '',
  });
  const [azureRepos, setAzureRepos] = useState<Array<{
    id: string;
    name: string;
    organization: string;
    project: string;
    repoName?: string;
    repoUrl?: string;
  }>>([
    {
      id: 'web-workspace-default',
      name: 'Web Workspace',
      organization: 'fourhands',
      project: 'QA Automation',
      repoName: 'QA-Playwright-Auto',
      repoUrl: 'https://fourhands.visualstudio.com/QA%20Automation/_git/QA-Playwright-Auto',
    },
  ]);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [newRepoName, setNewRepoName] = useState('');

  // BrowserStack Automate settings
  const [bsAutomateConfig, setBSAutomateConfig] = useState({
    username: '',
    accessKey: '',
  });

  // BrowserStack TM settings
  const [bsTMConfig, setBSTMConfig] = useState({
    username: '',
    accessKey: '',
  });

  // Jira settings
  const [jiraConfig, setJiraConfig] = useState({
    baseUrl: 'https://fourhands.atlassian.net', // Default base URL
    email: '',
    apiToken: '',
  });
  const [jiraDefaults, setJiraDefaults] = useState({
    projectKey: '',
    issueType: 'Bug',
    defaultLabels: ['axis', 'automation', 'browserstack'],
    componentRules: [] as Array<{ pattern: string; component: string }>,
  });

  // Updater settings
  const [appVersion, setAppVersion] = useState<string>('');
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'>('idle');
  const [updateMessage, setUpdateMessage] = useState<string>('');
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [updateError, setUpdateError] = useState<string>('');

  useEffect(() => {
    loadSettings();
    loadAppVersion();
    const cleanup = setupUpdaterEvents();
    return cleanup;
  }, []);

  const loadAppVersion = async () => {
    const version = await ipc.app.getVersion();
    setAppVersion(version);
  };

  const setupUpdaterEvents = (): (() => void) => {
    if (typeof window !== 'undefined' && window.updaterEvents) {
      const cleanup = window.updaterEvents.onEvent((event: { type: string; data?: any }) => {
        switch (event.type) {
          case 'checking-for-update':
            setUpdateStatus('checking');
            setUpdateMessage('Checking for updates...');
            setUpdateError('');
            break;
          case 'update-available':
            setUpdateStatus('available');
            setUpdateMessage(`Update available: ${event.data?.version || 'New version'}`);
            setUpdateError('');
            break;
          case 'update-not-available':
            setUpdateStatus('idle');
            setUpdateMessage('You are using the latest version.');
            setUpdateError('');
            break;
          case 'download-progress':
            setUpdateStatus('downloading');
            setDownloadProgress(event.data?.percent || 0);
            setUpdateMessage(`Downloading update: ${Math.round(event.data?.percent || 0)}%`);
            setUpdateError('');
            break;
          case 'update-downloaded':
            setUpdateStatus('downloaded');
            setUpdateMessage(`Update downloaded. Restart to install version ${event.data?.version || ''}`);
            setDownloadProgress(100);
            setUpdateError('');
            break;
          case 'error':
            setUpdateStatus('error');
            setUpdateError(event.data?.message || 'An error occurred');
            setUpdateMessage('');
            break;
        }
      });

      return cleanup;
    }
    return () => {}; // No-op cleanup if updaterEvents not available
  };

  const loadSettings = async () => {
    const settings = await ipc.settings.get();
    if (settings.azure) {
      const azure = settings.azure as any;
      setAzureConfig({
        organization: azure.organization || 'fourhands',
        project: azure.project || 'QA Automation',
        pat: azure.pat || '',
      });
      setAzureRepos(azure.repos || [
        {
          id: 'web-workspace-default',
          name: 'Web Workspace',
          organization: 'fourhands',
          project: 'QA Automation',
          repoName: 'QA-Playwright-Auto',
          repoUrl: 'https://fourhands.visualstudio.com/QA%20Automation/_git/QA-Playwright-Auto',
        },
      ]);
    } else {
      // If no Azure settings, use defaults
      setAzureConfig({
        organization: 'fourhands',
        project: 'QA Automation',
        pat: '',
      });
      setAzureRepos([
        {
          id: 'web-workspace-default',
          name: 'Web Workspace',
          organization: 'fourhands',
          project: 'QA Automation',
          repoName: 'QA-Playwright-Auto',
          repoUrl: 'https://fourhands.visualstudio.com/QA%20Automation/_git/QA-Playwright-Auto',
        },
      ]);
    }
    // Load BrowserStack Automate settings
    if (settings.browserstack?.automate) {
      setBSAutomateConfig({
        username: settings.browserstack.automate.username || '',
        accessKey: settings.browserstack.automate.accessKey || '',
      });
    }
    // Load BrowserStack TM settings
    if (settings.browserstack?.tm) {
      setBSTMConfig({
        username: settings.browserstack.tm.username || '',
        accessKey: settings.browserstack.tm.accessKey || '',
      });
    }
    if (settings.jira) {
      setJiraConfig({
        baseUrl: settings.jira.baseUrl || 'https://fourhands.atlassian.net',
        email: settings.jira.email || '',
        apiToken: settings.jira.apiToken || '',
      });
      if (settings.jira.defaults) {
        setJiraDefaults({
          projectKey: settings.jira.defaults.projectKey || '',
          issueType: settings.jira.defaults.issueType || 'Bug',
          defaultLabels: settings.jira.defaults.defaultLabels || ['axis', 'automation', 'browserstack'],
          componentRules: settings.jira.defaults.componentRules || [],
        });
      }
    }
  };

  const addAzureRepo = async () => {
    if (!newRepoUrl || !newRepoName) {
      alert('Please enter both repo name and URL');
      return;
    }

    const parsed = await ipc.azure.parseRepoUrl(newRepoUrl);
    if (!parsed) {
      alert('Invalid Azure repo URL. Format: https://dev.azure.com/{org}/{project}/_git/{repo}');
      return;
    }

    const newRepo = {
      id: Date.now().toString(),
      name: newRepoName,
      organization: parsed.organization,
      project: parsed.project,
      repoName: parsed.repoName,
      repoUrl: newRepoUrl,
    };

    const updatedRepos = [...azureRepos, newRepo];
    await ipc.settings.set('azure', {
      ...azureConfig,
      repos: updatedRepos,
    });
    setAzureRepos(updatedRepos);
    setNewRepoUrl('');
    setNewRepoName('');
  };

  const removeAzureRepo = async (repoId: string) => {
    const updatedRepos = azureRepos.filter(r => r.id !== repoId);
    await ipc.settings.set('azure', {
      ...azureConfig,
      repos: updatedRepos,
    });
    setAzureRepos(updatedRepos);
  };

  const saveAzureConfig = async () => {
    await ipc.settings.set('azure', {
      ...azureConfig,
      repos: azureRepos,
    });
  };

  const testAzureConnection = async () => {
    setTestStatus({ ...testStatus, azure: 'testing' });
    await saveAzureConfig();
    const result = await ipc.settings.testAzure();
    setTestStatus({ ...testStatus, azure: result ? 'success' : 'error' });
  };

  const testBSAutomate = async () => {
    setTestStatus({ ...testStatus, bsAutomate: 'testing' });
    await ipc.settings.set('browserstack.automate', bsAutomateConfig);
    const result = await ipc.settings.testBSAutomate();
    setTestStatus({ ...testStatus, bsAutomate: result ? 'success' : 'error' });
  };

  const testBSTM = async () => {
    setTestStatus({ ...testStatus, bsTM: 'testing' });
    await ipc.settings.set('browserstack.tm', bsTMConfig);
    const result = await ipc.settings.testBSTM();
    setTestStatus({ ...testStatus, bsTM: result ? 'success' : 'error' });
  };

  const testJira = async () => {
    setTestStatus({ ...testStatus, jira: 'testing' });
    await ipc.settings.set('jira', jiraConfig);
    const result = await ipc.settings.testJira();
    setTestStatus({ ...testStatus, jira: result ? 'success' : 'error' });
  };

  const renderTestButton = (service: string, onTest: () => void) => {
    const status = testStatus[service] || 'idle';
    return (
      <button
        className="btn btn-primary btn-sm"
        onClick={onTest}
        disabled={status === 'testing'}
      >
        {status === 'testing' && <Loader className="w-4 h-4 animate-spin" />}
        {status === 'success' && <CheckCircle className="w-4 h-4 text-success" />}
        {status === 'error' && <XCircle className="w-4 h-4 text-error" />}
        {status === 'idle' && 'Test Connection'}
        {status === 'testing' && 'Testing...'}
        {status === 'success' && 'Connected'}
        {status === 'error' && 'Failed'}
      </button>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6" />
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed">
        <button
          className={`tab ${activeTab === 'azure' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('azure')}
        >
          Azure DevOps
        </button>
        <button
          className={`tab ${activeTab === 'bs-automate' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('bs-automate')}
        >
          BrowserStack Automate
        </button>
        <button
          className={`tab ${activeTab === 'bs-tm' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('bs-tm')}
        >
          BrowserStack TM
        </button>
        <button
          className={`tab ${activeTab === 'jira' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('jira')}
        >
          Jira
        </button>
        <button
          className={`tab ${activeTab === 'updates' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('updates')}
        >
          Updates
        </button>
      </div>

      {/* Azure DevOps Tab */}
      {activeTab === 'azure' && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title">Azure DevOps Integration</h3>
            <p className="text-sm text-base-content/60 mb-4">
              Connect to Azure DevOps to link repositories and view commits. You can either paste a repo URL
              (which will auto-fill org/project) or enter credentials manually.
            </p>

            <div className="space-y-6">
              {/* Global Azure DevOps Credentials */}
              <div className="border-b border-base-300 pb-4">
                <h4 className="font-semibold mb-3">Azure DevOps Credentials</h4>
                <p className="text-sm text-base-content/60 mb-4">
                  These credentials are shared across all repositories in the same organization/project.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text">Organization</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="fourhands"
                      value={azureConfig.organization}
                      onChange={(e) => setAzureConfig({ ...azureConfig, organization: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Project</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="QA Automation"
                      value={azureConfig.project}
                      onChange={(e) => setAzureConfig({ ...azureConfig, project: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text">Personal Access Token</span>
                    </label>
                    <input
                      type="password"
                      className="input input-bordered w-full"
                      placeholder="PAT with Code (read) permissions"
                      value={azureConfig.pat}
                      onChange={(e) => setAzureConfig({ ...azureConfig, pat: e.target.value })}
                    />
                    <label className="label">
                      <span className="label-text-alt">
                        Create PAT at:{' '}
                        <a
                          href={`https://dev.azure.com/${azureConfig.organization || 'your-org'}/_usersSettings/tokens`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link link-primary"
                        >
                          Azure DevOps User Settings
                        </a>
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={saveAzureConfig}
                    >
                      Save Credentials
                    </button>
                    {renderTestButton('azure', testAzureConnection)}
                  </div>
                </div>
              </div>

              {/* Repository Management */}
              <div>
                <h4 className="font-semibold mb-3">Repositories</h4>
                <p className="text-sm text-base-content/60 mb-4">
                  Add multiple repositories (Web Workspace, D365, Salesforce, Infosys, etc.)
                </p>

                {/* Add New Repo */}
                <div className="card bg-base-100 mb-4">
                  <div className="card-body">
                    <h5 className="card-title text-sm">Add Repository</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="label">
                          <span className="label-text">Repository Name</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full input-sm"
                          placeholder="e.g., Web Workspace, D365, Salesforce, Infosys"
                          value={newRepoName}
                          onChange={(e) => setNewRepoName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="label">
                          <span className="label-text">Repository URL</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full input-sm"
                          placeholder="https://dev.azure.com/org/project/_git/repo"
                          value={newRepoUrl}
                          onChange={(e) => setNewRepoUrl(e.target.value)}
                        />
                        <label className="label">
                          <span className="label-text-alt">
                            Example: https://fourhands.visualstudio.com/QA%20Automation/_git/QA-Playwright-Auto
                          </span>
                        </label>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={addAzureRepo}
                        disabled={!newRepoName || !newRepoUrl}
                      >
                        Add Repository
                      </button>
                    </div>
                  </div>
                </div>

                {/* Existing Repos List */}
                {azureRepos.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold">Configured Repositories:</div>
                    {azureRepos.map((repo) => (
                      <div
                        key={repo.id}
                        className="card bg-base-100"
                      >
                        <div className="card-body py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold">{repo.name}</div>
                              <div className="text-sm text-base-content/60">
                                {repo.organization} / {repo.project} / {repo.repoName}
                              </div>
                              {repo.repoUrl && (
                                <a
                                  href={repo.repoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs link link-primary mt-1 block"
                                >
                                  {repo.repoUrl}
                                </a>
                              )}
                            </div>
                            <button
                              className="btn btn-sm btn-ghost text-error"
                              onClick={() => removeAzureRepo(repo.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {azureRepos.length === 0 && (
                  <div className="text-sm text-base-content/60 italic">
                    No repositories configured. Add your first repository above.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BrowserStack Automate Tab */}
      {activeTab === 'bs-automate' && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title">BrowserStack Automate</h3>
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={bsAutomateConfig.username}
                  onChange={(e) => setBSAutomateConfig({ ...bsAutomateConfig, username: e.target.value })}
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Access Key</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={bsAutomateConfig.accessKey}
                  onChange={(e) => setBSAutomateConfig({ ...bsAutomateConfig, accessKey: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    await ipc.settings.set('browserstack.automate', bsAutomateConfig);
                    alert('BrowserStack Automate credentials saved successfully!');
                  }}
                >
                  Save
                </button>
                {renderTestButton('bsAutomate', testBSAutomate)}
              </div>
              <div className="alert alert-info">
                <span className="text-sm">
                  Credentials are hardcoded and automatically configured. Click "Test Connection" to verify.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BrowserStack TM Tab */}
      {activeTab === 'bs-tm' && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title">BrowserStack Test Management</h3>
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Username</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={bsTMConfig.username}
                  onChange={(e) => setBSTMConfig({ ...bsTMConfig, username: e.target.value })}
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Access Key</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={bsTMConfig.accessKey}
                  onChange={(e) => setBSTMConfig({ ...bsTMConfig, accessKey: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    await ipc.settings.set('browserstack.tm', bsTMConfig);
                    alert('BrowserStack TM credentials saved successfully!');
                  }}
                >
                  Save
                </button>
                {renderTestButton('bsTM', testBSTM)}
              </div>
              <div className="alert alert-info">
                <span className="text-sm">
                  Credentials are hardcoded and automatically configured. Click "Test Connection" to verify.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Jira Tab */}
      {activeTab === 'jira' && (
        <div className="space-y-4">
          {/* Connection Settings */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">Jira Connection</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Base URL</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="https://fourhands.atlassian.net"
                    value={jiraConfig.baseUrl}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, baseUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    className="input input-bordered w-full"
                    value={jiraConfig.email}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">API Token</span>
                  </label>
                  <input
                    type="password"
                    className="input input-bordered w-full"
                    value={jiraConfig.apiToken}
                    onChange={(e) => setJiraConfig({ ...jiraConfig, apiToken: e.target.value })}
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      Create API token at:{' '}
                      <a
                        href="https://id.atlassian.com/manage-profile/security/api-tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary"
                      >
                        Atlassian Account Settings
                      </a>
                    </span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      await ipc.settings.set('jira', {
                        ...jiraConfig,
                        defaults: jiraDefaults,
                      });
                      alert('Jira settings saved successfully!');
                    }}
                  >
                    Save
                  </button>
                  {renderTestButton('jira', testJira)}
                </div>
              </div>
            </div>
          </div>

          {/* Bug Creation Defaults */}
          <div className="card bg-base-200">
            <div className="card-body">
              <h3 className="card-title">Bug Creation Defaults</h3>
              <p className="text-sm text-base-content/60 mb-4">
                Configure default values for creating Jira bugs from test failures.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="label">
                    <span className="label-text">Default Project Key</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="QST"
                    value={jiraDefaults.projectKey}
                    onChange={(e) => setJiraDefaults({ ...jiraDefaults, projectKey: e.target.value })}
                  />
                  <label className="label">
                    <span className="label-text-alt">Project key (e.g., QST, PROJ)</span>
                  </label>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Default Issue Type</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={jiraDefaults.issueType}
                    onChange={(e) => setJiraDefaults({ ...jiraDefaults, issueType: e.target.value })}
                  >
                    <option value="Bug">Bug</option>
                    <option value="Task">Task</option>
                    <option value="Story">Story</option>
                  </select>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Default Labels</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    placeholder="axis, automation, browserstack"
                    value={jiraDefaults.defaultLabels.join(', ')}
                    onChange={(e) => {
                      const labels = e.target.value
                        .split(',')
                        .map((l) => l.trim())
                        .filter((l) => l.length > 0);
                      setJiraDefaults({ ...jiraDefaults, defaultLabels: labels });
                    }}
                  />
                  <label className="label">
                    <span className="label-text-alt">Comma-separated list of default labels</span>
                  </label>
                </div>
                <div>
                  <label className="label">
                    <span className="label-text">Component Rules (Optional)</span>
                  </label>
                  <p className="text-sm text-base-content/60 mb-2">
                    Map test names or patterns to Jira components. One rule per line: pattern=component
                  </p>
                  <textarea
                    className="textarea textarea-bordered w-full h-32 font-mono text-sm"
                    placeholder="login.*=Authentication&#10;checkout.*=Payment&#10;.*api.*=Backend"
                    value={jiraDefaults.componentRules
                      .map((r) => `${r.pattern}=${r.component}`)
                      .join('\n')}
                    onChange={(e) => {
                      const rules = e.target.value
                        .split('\n')
                        .map((line) => line.trim())
                        .filter((line) => line.length > 0)
                        .map((line) => {
                          const [pattern, component] = line.split('=');
                          return { pattern: pattern?.trim() || '', component: component?.trim() || '' };
                        })
                        .filter((r) => r.pattern && r.component);
                      setJiraDefaults({ ...jiraDefaults, componentRules: rules });
                    }}
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      Format: pattern=component (regex or contains match)
                    </span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      await ipc.settings.set('jira', {
                        ...jiraConfig,
                        defaults: jiraDefaults,
                      });
                      alert('Jira defaults saved successfully!');
                    }}
                  >
                    Save Defaults
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Updates Tab */}
      {activeTab === 'updates' && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title">Application Updates</h3>
            <p className="text-sm text-base-content/60 mb-4">
              Check for updates and manage application version.
            </p>

            <div className="space-y-6">
              {/* Current Version */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Current Version</span>
                </label>
                <div className="text-lg font-mono">{appVersion || 'Loading...'}</div>
              </div>

              {/* Update Status */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold">Update Status</span>
                </label>
                <div className="space-y-2">
                  {updateMessage && (
                    <div className={`alert ${updateStatus === 'error' ? 'alert-error' : updateStatus === 'downloaded' ? 'alert-success' : 'alert-info'}`}>
                      <div>
                        {updateStatus === 'checking' && <Loader className="w-5 h-5 animate-spin" />}
                        {updateStatus === 'available' && <CheckCircle className="w-5 h-5" />}
                        {updateStatus === 'downloaded' && <CheckCircle className="w-5 h-5" />}
                        {updateStatus === 'error' && <XCircle className="w-5 h-5" />}
                        <span>{updateMessage}</span>
                      </div>
                    </div>
                  )}
                  {updateError && (
                    <div className="alert alert-error">
                      <XCircle className="w-5 h-5" />
                      <span>{updateError}</span>
                    </div>
                  )}
                  {updateStatus === 'downloading' && downloadProgress > 0 && (
                    <div className="w-full">
                      <progress className="progress progress-primary w-full" value={downloadProgress} max="100"></progress>
                      <div className="text-sm text-base-content/60 mt-1">{Math.round(downloadProgress)}%</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    setUpdateStatus('checking');
                    setUpdateMessage('Checking for updates...');
                    setUpdateError('');
                    try {
                      await ipc.updater.check();
                    } catch (error: any) {
                      setUpdateStatus('error');
                      setUpdateError(error.message || 'Failed to check for updates');
                    }
                  }}
                  disabled={updateStatus === 'checking' || updateStatus === 'downloading'}
                >
                  <RefreshCw className={`w-4 h-4 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
                  Check for Updates
                </button>

                {updateStatus === 'available' && (
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {
                      setUpdateStatus('downloading');
                      setUpdateMessage('Downloading update...');
                      setUpdateError('');
                      try {
                        await ipc.updater.download();
                      } catch (error: any) {
                        setUpdateStatus('error');
                        setUpdateError(error.message || 'Failed to download update');
                      }
                    }}
                    disabled={updateStatus === 'downloading'}
                  >
                    <Download className="w-4 h-4" />
                    Download Update
                  </button>
                )}

                {updateStatus === 'downloaded' && (
                  <button
                    className="btn btn-success"
                    onClick={async () => {
                      await ipc.updater.install();
                    }}
                  >
                    Restart to Install
                  </button>
                )}
              </div>

              <div className="text-sm text-base-content/60">
                <p>Note: Update feed URL is currently a placeholder. Updates will be available once hosting is configured.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsScreen;
