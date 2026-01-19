import React, { useEffect, useState } from 'react';
import { FolderGit, ExternalLink, GitBranch, Code, Calendar, User, Download, Upload, RefreshCw, Loader, FolderOpen, Plus, Minus, CheckCircle, XCircle, GitCommit, History, PlusCircle, Search, FileText } from 'lucide-react';
import { ipc } from '../ipc';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';
import StatusBadge from './StatusBadge';

const RepoCompanionScreen: React.FC = () => {
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [commits, setCommits] = useState<any[]>([]);
  const [gitStatus, setGitStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localRepoPath, setLocalRepoPath] = useState<string | null>(null);
  const [operationStatus, setOperationStatus] = useState<Record<string, { loading: boolean; message?: string; error?: string }>>({});
  const [commitMessage, setCommitMessage] = useState('');
  const [branches, setBranches] = useState<{ local: string[]; remote: string[]; current: string }>({ local: [], remote: [], current: '' });
  const [newBranchName, setNewBranchName] = useState('');
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [commitHistory, setCommitHistory] = useState<Array<{ hash: string; author: string; email: string; date: string; message: string }>>([]);
  const [showCommitHistory, setShowCommitHistory] = useState(false);
  const [defaultWorkspace, setDefaultWorkspace] = useState<string | null>(null);
  const [detectedRepos, setDetectedRepos] = useState<Array<{ repoId: string; repoName: string; localPath: string; status: any }>>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadRepos();
    loadDefaultWorkspace();
    detectClonedRepos();
  }, []);

  const loadDefaultWorkspace = async () => {
    const workspace = await ipc.repo.getDefaultWorkspace();
    setDefaultWorkspace(workspace);
  };

  const detectClonedRepos = async () => {
    const detected = await ipc.repo.detectAllCloned();
    setDetectedRepos(detected);
  };

  useEffect(() => {
    if (selectedRepo) {
      loadCommits(selectedRepo.id, selectedRepo.defaultBranch);
      checkLocalRepo();
    }
  }, [selectedRepo]);

  const checkLocalRepo = async () => {
    if (selectedRepo) {
      const repoId = selectedRepo.id;
      const repoName = selectedRepo.repoName || selectedRepo.name;
      const localPath = await ipc.repo.getLocalPath(repoId, repoName);
      setLocalRepoPath(localPath);
      if (localPath) {
        await refreshGitStatus(localPath);
        await loadBranches(localPath);
        await loadCommitHistory(localPath);
      }
    }
  };

  const refreshGitStatus = async (repoPath: string) => {
    const status = await ipc.repo.gitStatus(repoPath);
    setGitStatus(status);
  };

  const loadBranches = async (repoPath: string) => {
    const branchData = await ipc.repo.getBranches(repoPath);
    setBranches(branchData);
  };

  const loadCommitHistory = async (repoPath: string) => {
    const history = await ipc.repo.getCommitHistory(repoPath, 10);
    setCommitHistory(history);
  };

  const handleStageFile = async (filePath: string) => {
    if (!localRepoPath) return;
    const result = await ipc.repo.stageFile(localRepoPath, filePath);
    if (result.success) {
      await refreshGitStatus(localRepoPath);
    } else {
      alert(result.error || 'Failed to stage file');
    }
  };

  const handleUnstageFile = async (filePath: string) => {
    if (!localRepoPath) return;
    const result = await ipc.repo.unstageFile(localRepoPath, filePath);
    if (result.success) {
      await refreshGitStatus(localRepoPath);
    } else {
      alert(result.error || 'Failed to unstage file');
    }
  };

  const handleStageAll = async () => {
    if (!localRepoPath) return;
    const result = await ipc.repo.stageAll(localRepoPath);
    if (result.success) {
      await refreshGitStatus(localRepoPath);
    } else {
      alert(result.error || 'Failed to stage all files');
    }
  };

  const handleCommit = async () => {
    if (!localRepoPath) return;
    
    if (!commitMessage.trim()) {
      alert('Commit message is required');
      return;
    }

    if (commitMessage.trim().length < 10) {
      alert('Commit message must be at least 10 characters long');
      return;
    }

    if (!gitStatus?.staged || gitStatus.staged.length === 0) {
      alert('No staged changes to commit. Please stage files first.');
      return;
    }

    setOperationStatus({ ...operationStatus, commit: { loading: true } });
    const result = await ipc.repo.commit(localRepoPath, commitMessage.trim());
    
    if (result.success) {
      setCommitMessage('');
      await refreshGitStatus(localRepoPath);
      await loadCommitHistory(localRepoPath);
      setOperationStatus({ 
        ...operationStatus, 
        commit: { loading: false, message: 'Committed successfully!' } 
      });
      setTimeout(() => {
        setOperationStatus({ ...operationStatus, commit: { loading: false } });
      }, 3000);
    } else {
      setOperationStatus({ 
        ...operationStatus, 
        commit: { loading: false, error: result.error || 'Commit failed' } 
      });
    }
  };

  const handleCreateBranch = async () => {
    if (!localRepoPath || !newBranchName.trim()) return;
    
    const result = await ipc.repo.createBranch(localRepoPath, newBranchName.trim());
    if (result.success) {
      setNewBranchName('');
      setShowBranchModal(false);
      await loadBranches(localRepoPath);
      await refreshGitStatus(localRepoPath);
      alert(result.message || 'Branch created successfully');
    } else {
      alert(result.error || 'Failed to create branch');
    }
  };

  const handleSwitchBranch = async (branchName: string) => {
    if (!localRepoPath) return;
    
    const result = await ipc.repo.switchBranch(localRepoPath, branchName);
    if (result.success) {
      await loadBranches(localRepoPath);
      await refreshGitStatus(localRepoPath);
      await loadCommitHistory(localRepoPath);
      alert(result.message || 'Switched branch successfully');
    } else {
      alert(result.error || 'Failed to switch branch');
    }
  };

  const loadRepos = async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await ipc.settings.get();
      const azureSettings = settings.azure as any;
      
      const defaultRepos = [
        {
          id: 'web-workspace-default',
          name: 'Web Workspace',
          organization: 'fourhands',
          project: 'QA Automation',
          repoName: 'QA-Playwright-Auto',
          repoUrl: 'https://fourhands.visualstudio.com/QA%20Automation/_git/QA-Playwright-Auto',
        },
      ];
      
      const configuredRepos = azureSettings?.repos || defaultRepos;
      
      if (configuredRepos.length === 0) {
        setError('No repositories configured. Go to Settings to add repositories.');
        setLoading(false);
        return;
      }

      let allAzureRepos: any[] = [];
      try {
        allAzureRepos = await ipc.azure.getRepos();
      } catch (err) {
        console.warn('Failed to fetch Azure repos, using configured repos only:', err);
      }
      
      const matchedRepos = configuredRepos.map((configRepo: any) => {
        const azureRepo = allAzureRepos.find((ar: any) => 
          ar.name === configRepo.repoName || 
          ar.name.toLowerCase() === configRepo.repoName?.toLowerCase()
        );
        
        return {
          ...configRepo,
          ...azureRepo,
          displayName: configRepo.name,
        };
      });

      setRepos(matchedRepos);
    } catch (err: any) {
      setError(err.message || 'Failed to load repositories. Make sure Azure DevOps is configured in Settings.');
    } finally {
      setLoading(false);
    }
  };

  const loadCommits = async (repoId: string, branch: string) => {
    setLoading(true);
    try {
      const recentCommits = await ipc.azure.getCommits(repoId, branch, 20);
      setCommits(recentCommits);
    } catch (err: any) {
      setError(err.message || 'Failed to load commits');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleClone = async (repo: any) => {
    if (!repo.repoUrl) {
      alert('Repository URL not available');
      return;
    }

    setOperationStatus({ ...operationStatus, [`clone-${repo.id}`]: { loading: true } });

    try {
      const repoName = repo.repoName || repo.name;
      const repoId = repo.id;

      let targetDirectory = defaultWorkspace;
      if (!targetDirectory) {
        const selectedDir = await ipc.repo.selectDirectory();
        if (!selectedDir) {
          setOperationStatus({ ...operationStatus, [`clone-${repo.id}`]: { loading: false } });
          return;
        }
        targetDirectory = selectedDir;
      }

      const result = await ipc.repo.clone(repo.repoUrl, targetDirectory, repoName, repoId);
      
      if (result.success) {
        setOperationStatus({ 
          ...operationStatus, 
          [`clone-${repo.id}`]: { loading: false, message: 'Repository cloned successfully!' } 
        });
        const clonedPath = (result as any).path || `${targetDirectory}/${repoName}`;
        setLocalRepoPath(clonedPath);
        await refreshGitStatus(clonedPath);
        await loadBranches(clonedPath);
        await loadCommitHistory(clonedPath);
        await detectClonedRepos();
        setTimeout(() => {
          setOperationStatus({ ...operationStatus, [`clone-${repo.id}`]: { loading: false } });
        }, 3000);
      } else {
        setOperationStatus({ 
          ...operationStatus, 
          [`clone-${repo.id}`]: { loading: false, error: result.error || 'Clone failed' } 
        });
      }
    } catch (err: any) {
      setOperationStatus({ 
        ...operationStatus, 
        [`clone-${repo.id}`]: { loading: false, error: err.message || 'Clone failed' } 
      });
    }
  };

  const handlePull = async () => {
    if (!localRepoPath) {
      alert('Repository not cloned locally. Please clone it first.');
      return;
    }

    setOperationStatus({ ...operationStatus, pull: { loading: true } });

    try {
      const result = await ipc.repo.pull(localRepoPath);
      
      if (result.success) {
        setOperationStatus({ 
          ...operationStatus, 
          pull: { loading: false, message: result.message || 'Pulled successfully!' } 
        });
        const status = await ipc.repo.gitStatus(localRepoPath);
        setGitStatus(status);
        if (selectedRepo) {
          loadCommits(selectedRepo.id, selectedRepo.defaultBranch);
        }
        setTimeout(() => {
          setOperationStatus({ ...operationStatus, pull: { loading: false } });
        }, 3000);
      } else {
        let errorMessage = result.error || 'Pull failed';
        if (result.needsMerge) {
          errorMessage += '\n\nTip: Try using the Sync button instead.';
        }
        setOperationStatus({ 
          ...operationStatus, 
          pull: { loading: false, error: errorMessage } 
        });
      }
    } catch (err: any) {
      setOperationStatus({ 
        ...operationStatus, 
        pull: { loading: false, error: err.message || 'Pull failed' } 
      });
    }
  };

  const handlePush = async () => {
    if (!localRepoPath) {
      alert('Repository not cloned locally. Please clone it first.');
      return;
    }

    if (!gitStatus?.branch) {
      alert('Unable to determine current branch');
      return;
    }

    setOperationStatus({ ...operationStatus, push: { loading: true } });

    try {
      const result = await ipc.repo.push(localRepoPath, gitStatus.branch);
      
      if (result.success) {
        let message = result.message || 'Pushed successfully!';
        if (result.warnings && result.warnings.length > 0) {
          message += '\n\nWarnings:\n' + result.warnings.join('\n');
        }
        setOperationStatus({ 
          ...operationStatus, 
          push: { loading: false, message } 
        });
        const status = await ipc.repo.gitStatus(localRepoPath);
        setGitStatus(status);
        setTimeout(() => {
          setOperationStatus({ ...operationStatus, push: { loading: false } });
        }, 3000);
      } else {
        let errorMessage = result.error || 'Push failed';
        if (result.needsPull) {
          errorMessage += '\n\nTip: Pull or Sync first, then push again.';
        } else if (result.authError) {
          errorMessage += '\n\nCheck your credentials in Settings.';
        } else if (result.isProtectedBranch) {
          errorMessage += '\n\nCreate a feature branch first.';
        }
        setOperationStatus({ 
          ...operationStatus, 
          push: { loading: false, error: errorMessage } 
        });
      }
    } catch (err: any) {
      setOperationStatus({ 
        ...operationStatus, 
        push: { loading: false, error: err.message || 'Push failed' } 
      });
    }
  };

  const handleSync = async () => {
    if (!localRepoPath) {
      alert('Repository not cloned locally. Please clone it first.');
      return;
    }

    setOperationStatus({ ...operationStatus, sync: { loading: true } });

    try {
      const result = await ipc.repo.sync(localRepoPath);
      
      if (result.success) {
        let message = result.message || 'Synced successfully!';
        if (result.results) {
          message += `\n\n• ${result.results.fetch.message}\n• ${result.results.pull.message}\n• ${result.results.push.message}`;
        }
        setOperationStatus({ 
          ...operationStatus, 
          sync: { loading: false, message } 
        });
        const status = await ipc.repo.gitStatus(localRepoPath);
        setGitStatus(status);
        if (selectedRepo) {
          loadCommits(selectedRepo.id, selectedRepo.defaultBranch);
        }
        setTimeout(() => {
          setOperationStatus({ ...operationStatus, sync: { loading: false } });
        }, 3000);
      } else {
        let errorMessage = result.error || 'Sync failed';
        if (result.results) {
          errorMessage += '\n\nStatus:';
          errorMessage += `\n• Fetch: ${result.results.fetch.success ? '✓' : '✗'} ${result.results.fetch.message}`;
          errorMessage += `\n• Pull: ${result.results.pull.success ? '✓' : '✗'} ${result.results.pull.message}`;
          errorMessage += `\n• Push: ${result.results.push.success ? '✓' : '✗'} ${result.results.push.message}`;
        }
        setOperationStatus({ 
          ...operationStatus, 
          sync: { loading: false, error: errorMessage } 
        });
      }
    } catch (err: any) {
      setOperationStatus({ 
        ...operationStatus, 
        sync: { loading: false, error: err.message || 'Sync failed' } 
      });
    }
  };

  const filteredRepos = repos.filter(repo => 
    !searchQuery || 
    repo.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.repoName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.project?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (error && repos.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={FolderGit}
          title="Azure DevOps Not Configured"
          description={error}
          action={
            <a href="#/settings" className="btn btn-primary">
              Go to Settings
            </a>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderGit className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-base-content">Repo Companion</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="form-control">
            <div className="input-group">
              <input
                type="text"
                placeholder="Search repositories..."
                className="input input-bordered input-sm w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-square btn-sm btn-ghost">
                <Search size={16} />
              </button>
            </div>
          </div>
          <button
            className="btn btn-sm btn-ghost"
            onClick={loadRepos}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Detected Repos Status - Top Section */}
      {detectedRepos.length > 0 && (
        <div className="glass-card p-4 bg-base-200/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderOpen size={18} className="text-primary" />
              <h3 className="font-semibold text-base-content">Detected Repositories</h3>
            </div>
            <button
              className="btn btn-xs btn-ghost"
              onClick={detectClonedRepos}
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {detectedRepos.map((detected) => {
              const matchingRepo = repos.find(r => r.repoName === detected.repoName || r.id === detected.repoId);
              return (
                <div
                  key={detected.repoId}
                  className="p-3 bg-base-100 rounded-lg border border-base-300 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => {
                    if (matchingRepo) {
                      setSelectedRepo(matchingRepo);
                      setLocalRepoPath(detected.localPath);
                      refreshGitStatus(detected.localPath);
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FolderGit size={16} className="text-primary" />
                      <span className="font-semibold text-sm">{detected.repoName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {detected.status.needsUpdate && (
                        <span className="badge badge-warning badge-sm">
                          {detected.status.behind} behind
                        </span>
                      )}
                      {detected.status.hasUnpushedCommits && (
                        <span className="badge badge-info badge-sm">
                          {detected.status.ahead} ahead
                        </span>
                      )}
                      {!detected.status.needsUpdate && !detected.status.hasUnpushedCommits && (
                        <span className="badge badge-success badge-sm">Up to date</span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-base-content/60 font-mono truncate">{detected.localPath}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Azure Repositories - Left Side */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <FolderGit size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-base-content">Azure Repositories</h3>
          </div>
          {loading && repos.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredRepos.length === 0 ? (
            <EmptyState
              icon={FolderGit}
              title="No Repositories"
              description={searchQuery ? "No repositories match your search." : "No Azure repositories found. Check your settings."}
            />
          ) : (
            <div className="space-y-2">
              {filteredRepos.map((repo) => {
                const isSelected = selectedRepo?.id === repo.id;
                const detectedRepo = detectedRepos.find(dr => dr.repoName === repo.repoName || dr.repoId === repo.id);
                const isCloned = !!detectedRepo;
                
                return (
                  <div
                    key={repo.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary/10 border-primary shadow-md'
                        : 'bg-base-100 border-base-300 hover:border-primary/50 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedRepo(repo)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary/20' : 'bg-base-200'}`}>
                          <FolderGit
                            size={20}
                            className={isSelected ? 'text-primary' : 'text-base-content/70'}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-semibold mb-1 ${isSelected ? 'text-primary' : 'text-base-content'}`}>
                            {repo.displayName || repo.name}
                          </div>
                          <div className="text-sm text-base-content/60 truncate">
                            {repo.project?.name || `${repo.organization} / ${repo.project}`}
                          </div>
                          {isCloned && (
                            <div className="flex items-center gap-2 mt-2">
                              <CheckCircle size={14} className="text-success" />
                              <span className="text-xs text-success font-medium">Cloned locally</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <a
                        href={repo.repoUrl || repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="btn btn-sm btn-ghost btn-square"
                        title="Open in Azure DevOps"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-base-300">
                        <button
                          className="btn btn-sm btn-primary w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClone(repo);
                          }}
                          disabled={operationStatus[`clone-${repo.id}`]?.loading || isCloned}
                        >
                          {operationStatus[`clone-${repo.id}`]?.loading ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Cloning...
                            </>
                          ) : isCloned ? (
                            <>
                              <CheckCircle size={16} />
                              Already Cloned
                            </>
                          ) : (
                            <>
                              <Download size={16} />
                              Clone Repository
                            </>
                          )}
                        </button>
                        {operationStatus[`clone-${repo.id}`]?.message && (
                          <div className="mt-2 text-xs text-success">{operationStatus[`clone-${repo.id}`].message}</div>
                        )}
                        {operationStatus[`clone-${repo.id}`]?.error && (
                          <div className="mt-2 text-xs text-error">{operationStatus[`clone-${repo.id}`].error}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Local Git Operations - Right Side */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Code size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-base-content">Local Git Operations</h3>
          </div>
          {!localRepoPath ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-base-200 rounded-full mb-4">
                <FolderGit size={32} className="text-base-content/40" />
              </div>
              <h4 className="font-semibold text-base-content mb-2">Repository not cloned locally</h4>
              <p className="text-sm text-base-content/60 mb-4 max-w-sm">
                Click "Clone Repository" on a repository above to get started with local Git operations.
              </p>
              {defaultWorkspace && (
                <div className="text-xs text-base-content/50 bg-base-200 px-3 py-2 rounded">
                  Default workspace: <code className="font-mono">{defaultWorkspace}</code>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Local Path Display */}
              <div className="p-3 bg-base-200 rounded-lg border border-base-300">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-base-content/60 mb-1">Local Repository Path</div>
                    <div className="flex items-center gap-2">
                      <FolderOpen size={16} className="text-primary flex-shrink-0" />
                      <code className="text-sm font-mono bg-base-100 px-2 py-1 rounded break-all">
                        {localRepoPath}
                      </code>
                    </div>
                  </div>
                  <button
                    className="btn btn-sm btn-primary flex-shrink-0"
                    onClick={async () => {
                      if (localRepoPath) {
                        await ipc.repo.openVSCode(localRepoPath);
                      }
                    }}
                    title="Open in VS Code"
                  >
                    <Code size={16} />
                    Open in VS Code
                  </button>
                </div>
              </div>
              
              {/* Git Operations Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handlePull}
                  disabled={operationStatus.pull?.loading}
                >
                  {operationStatus.pull?.loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  Pull
                </button>
                <button
                  className="btn btn-sm btn-success"
                  onClick={handlePush}
                  disabled={operationStatus.push?.loading || !gitStatus?.branch}
                >
                  {operationStatus.push?.loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload size={16} />
                  )}
                  Push
                </button>
                <button
                  className="btn btn-sm btn-accent"
                  onClick={handleSync}
                  disabled={operationStatus.sync?.loading}
                  title="Fetch, Pull, and Push in one operation"
                >
                  {operationStatus.sync?.loading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  Sync
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={async () => {
                    if (localRepoPath) {
                      await refreshGitStatus(localRepoPath);
                    }
                  }}
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => setShowCommitHistory(!showCommitHistory)}
                >
                  <History size={16} />
                  History
                </button>
              </div>

              {/* Status Messages */}
              {(operationStatus.pull?.message || operationStatus.push?.message || operationStatus.sync?.message) && (
                <div className="alert alert-success py-2">
                  <CheckCircle size={16} />
                  <span className="text-sm whitespace-pre-line">{operationStatus.pull?.message || operationStatus.push?.message || operationStatus.sync?.message}</span>
                </div>
              )}
              {(operationStatus.pull?.error || operationStatus.push?.error || operationStatus.sync?.error) && (
                <div className="alert alert-error py-2">
                  <XCircle size={16} />
                  <span className="text-sm whitespace-pre-line">{operationStatus.pull?.error || operationStatus.push?.error || operationStatus.sync?.error}</span>
                </div>
              )}

              {/* Branch Management */}
              {gitStatus && (
                <div className="p-3 bg-base-200 rounded-lg border border-base-300">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <GitBranch size={16} className="text-primary" />
                      <span className="font-mono font-semibold">{gitStatus.branch || branches.current}</span>
                      {gitStatus.ahead > 0 && (
                        <span className="badge badge-success badge-sm flex items-center gap-1">
                          <Upload size={10} />
                          {gitStatus.ahead} ahead
                        </span>
                      )}
                      {gitStatus.behind > 0 && (
                        <span className="badge badge-warning badge-sm flex items-center gap-1">
                          <Download size={10} />
                          {gitStatus.behind} behind
                        </span>
                      )}
                      {(() => {
                        const isUpToDate = gitStatus.ahead === 0 && gitStatus.behind === 0;
                        return isUpToDate && (
                          <span className="badge badge-sm badge-ghost">
                            <CheckCircle size={10} />
                            up to date
                          </span>
                        );
                      })()}
                    </div>
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={() => setShowBranchModal(true)}
                    >
                      <PlusCircle size={12} />
                      New Branch
                    </button>
                  </div>
                  {branches.local.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {branches.local.map((branch) => (
                        <button
                          key={branch}
                          className={`btn btn-xs ${branch === branches.current ? 'btn-primary' : 'btn-ghost'}`}
                          onClick={() => branch !== branches.current && handleSwitchBranch(branch)}
                        >
                          {branch}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Staged Files */}
              {gitStatus && gitStatus.staged && gitStatus.staged.length > 0 && (
                <div className="p-3 bg-base-200 rounded-lg border border-success/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={16} className="text-success" />
                      <span className="font-semibold text-sm">Staged Changes ({gitStatus.staged.length})</span>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {gitStatus.staged.map((file: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 bg-base-100 rounded">
                        <span className="font-mono text-xs truncate flex-1">{file.file}</span>
                        <button
                          className="btn btn-xs btn-ghost flex-shrink-0"
                          onClick={() => handleUnstageFile(file.file)}
                          title="Unstage"
                        >
                          <Minus size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Unstaged Files */}
              {gitStatus && gitStatus.unstaged && gitStatus.unstaged.length > 0 && (
                <div className="p-3 bg-base-200 rounded-lg border border-warning/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <XCircle size={16} className="text-warning" />
                      <span className="font-semibold text-sm">Unstaged Changes ({gitStatus.unstaged.length})</span>
                    </div>
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={handleStageAll}
                    >
                      <Plus size={12} />
                      Stage All
                    </button>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {gitStatus.unstaged.map((file: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 bg-base-100 rounded">
                        <span className="font-mono text-xs truncate flex-1">{file.file}</span>
                        <button
                          className="btn btn-xs btn-primary flex-shrink-0"
                          onClick={() => handleStageFile(file.file)}
                          title="Stage"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Untracked Files */}
              {gitStatus && gitStatus.untracked && gitStatus.untracked.length > 0 && (
                <div className="p-3 bg-base-200 rounded-lg border border-base-300">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-base-content/60" />
                      <span className="font-semibold text-sm">Untracked Files ({gitStatus.untracked.length})</span>
                    </div>
                    <button
                      className="btn btn-xs btn-primary"
                      onClick={async () => {
                        for (const file of gitStatus.untracked) {
                          await handleStageFile(file.file);
                        }
                      }}
                    >
                      <Plus size={12} />
                      Stage All
                    </button>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {gitStatus.untracked.map((file: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between text-sm p-2 bg-base-100 rounded">
                        <span className="font-mono text-xs truncate flex-1">{file.file}</span>
                        <button
                          className="btn btn-xs btn-primary flex-shrink-0"
                          onClick={() => handleStageFile(file.file)}
                          title="Stage"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Commit Section */}
              {gitStatus && (gitStatus.staged?.length > 0 || gitStatus.unstaged?.length > 0 || gitStatus.untracked?.length > 0) && (
                <div className="p-3 bg-base-200 rounded-lg border border-base-300">
                  <div className="flex items-center gap-2 mb-2">
                    <GitCommit size={16} className="text-primary" />
                    <span className="font-semibold text-sm">Commit Changes</span>
                  </div>
                  <textarea
                    className="textarea textarea-bordered w-full mb-2 text-sm"
                    placeholder="Enter commit message (minimum 10 characters)..."
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    rows={3}
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-base-content/60">
                      {commitMessage.length > 0 && (
                        <span className={commitMessage.length < 10 ? 'text-warning' : 'text-success'}>
                          {commitMessage.length} / 10 characters
                        </span>
                      )}
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={handleCommit}
                      disabled={operationStatus.commit?.loading || commitMessage.trim().length < 10 || !gitStatus.staged || gitStatus.staged.length === 0}
                    >
                      {operationStatus.commit?.loading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <GitCommit size={16} />
                      )}
                      Commit
                    </button>
                  </div>
                  {operationStatus.commit?.message && (
                    <div className="mt-2 text-xs text-success">{operationStatus.commit.message}</div>
                  )}
                  {operationStatus.commit?.error && (
                    <div className="mt-2 text-xs text-error">{operationStatus.commit.error}</div>
                  )}
                </div>
              )}

              {/* Commit History Modal */}
              {showCommitHistory && (
                <div className="modal modal-open">
                  <div className="modal-box max-w-3xl">
                    <h3 className="font-bold text-lg mb-4">Commit History</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {commitHistory.map((commit) => (
                        <div key={commit.hash} className="p-3 bg-base-200 rounded-lg">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <code className="text-xs font-mono bg-base-100 px-2 py-1 rounded">
                              {commit.hash.substring(0, 7)}
                            </code>
                            <span className="text-xs text-base-content/60">{formatDate(commit.date)}</span>
                          </div>
                          <div className="text-sm font-medium mb-1">{commit.message}</div>
                          <div className="text-xs text-base-content/60">
                            {commit.author} &lt;{commit.email}&gt;
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="modal-action">
                      <button className="btn btn-sm" onClick={() => setShowCommitHistory(false)}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Branch Creation Modal */}
      {showBranchModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New Branch</h3>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Branch Name</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="feature/new-feature"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newBranchName.trim()) {
                    handleCreateBranch();
                  }
                }}
              />
            </div>
            <div className="modal-action">
              <button className="btn btn-sm btn-ghost" onClick={() => setShowBranchModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={handleCreateBranch}
                disabled={!newBranchName.trim()}
              >
                Create Branch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoCompanionScreen;
