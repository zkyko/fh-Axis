import React, { useEffect, useState } from 'react';
import { Play, Loader, ExternalLink, CheckCircle, XCircle, Clock, FileText, Tag, Search, RefreshCw } from 'lucide-react';
import { ipc } from '../ipc';
import { useRunStore } from '../store/run-store';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';
import StatusBadge from './StatusBadge';

interface Pipeline {
  id: number;
  name: string;
  folder?: string;
  url: string;
}

interface TestFile {
  path: string;
  relativePath: string;
  name: string;
  size: number;
}

type ExecutionScope = 'all' | 'file' | 'tag' | 'grep';

const RemoteExecutionScreen: React.FC = () => {
  const { runs, activeRuns, addRun, updateRun, loadActiveRuns } = useRunStore();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [executionScope, setExecutionScope] = useState<ExecutionScope>('all');
  const [selectedTestFile, setSelectedTestFile] = useState<TestFile | null>(null);
  const [testFiles, setTestFiles] = useState<TestFile[]>([]);
  const [testTag, setTestTag] = useState('');
  const [testGrep, setTestGrep] = useState('');
  const [branch, setBranch] = useState('');
  const [env, setEnv] = useState('');
  const [repoRoot, setRepoRoot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    loadPipelines();
    loadActiveRuns();
  }, []);

  useEffect(() => {
    // Auto-refresh active runs every 5 seconds
    const interval = setInterval(() => {
      loadActiveRuns();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadPipelines = async () => {
    setLoading(true);
    try {
      const pipelinesList = await ipc.azurePipelines.list();
      setPipelines(pipelinesList);
      if (pipelinesList.length > 0) {
        setSelectedPipeline(pipelinesList[0]);
      }
    } catch (err: any) {
      console.error('Failed to load pipelines:', err);
      setError(err.message || 'Failed to load pipelines');
    } finally {
      setLoading(false);
    }
  };

  const loadTestFiles = async (repoPath: string) => {
    try {
      const files = await ipc.repo.listTestFiles(repoPath);
      setTestFiles(files);
    } catch (err: any) {
      console.error('Failed to load test files:', err);
    }
  };

  const getGitStatus = async (repoPath: string) => {
    try {
      const status = await ipc.repo.gitStatus(repoPath);
      if (status.branch) {
        setBranch(status.branch);
      }
    } catch (err) {
      console.error('Failed to get git status:', err);
    }
  };

  const handleRepoSelect = async (repoPath: string) => {
    setRepoRoot(repoPath);
    await loadTestFiles(repoPath);
    await getGitStatus(repoPath);
  };

  const generateCorrelationKey = (adoRunId: number, repoName: string, branchName: string): string => {
    return `QAHub|adoRun=${adoRunId}|repo=${repoName}|branch=${branchName}`;
  };

  const executeRun = async () => {
    if (!selectedPipeline || !repoRoot || !branch) {
      setError('Please select a pipeline, repository, and branch');
      return;
    }

    setExecuting(true);
    setError(null);

    try {
      // Get repo name from path
      const repoName = repoRoot.split(/[/\\]/).pop() || 'unknown';
      
      // Build run parameters
      const runParams: any = {
        TRIGGER_SOURCE: 'qa-hub',
        TEST_SCOPE: executionScope,
        ENV: env || undefined,
      };

      // Add scope-specific parameters
      if (executionScope === 'file' && selectedTestFile) {
        runParams.TEST_FILE = selectedTestFile.relativePath;
      } else if (executionScope === 'tag' && testTag) {
        runParams.TEST_TAG = testTag;
      } else if (executionScope === 'grep' && testGrep) {
        runParams.TEST_GREP = testGrep;
      }

      // Generate a temporary correlation key (will be updated after run is created)
      const tempCorrelationKey = `QAHub|adoRun=temp|repo=${repoName}|branch=${branch}`;
      runParams.CORRELATION_KEY = tempCorrelationKey;

      // Trigger pipeline run
      const run = await ipc.azurePipelines.run(
        selectedPipeline.id,
        branch,
        runParams
      );

      // Update correlation key with actual run ID
      const correlationKey = generateCorrelationKey(run.id, repoName, branch);
      
      // Create local run record
      const localRun = {
        id: run.localRunId || `run-${run.id}-${Date.now()}`,
        adoPipelineId: selectedPipeline.id.toString(),
        adoRunId: run.id.toString(),
        adoRunUrl: run.url,
        correlationKey,
        requestedScope: executionScope,
        testFile: executionScope === 'file' ? selectedTestFile?.relativePath : undefined,
        testTag: executionScope === 'tag' ? testTag : undefined,
        testGrep: executionScope === 'grep' ? testGrep : undefined,
        repoId: repoName,
        branch,
        status: (run.state === 'queued' ? 'queued' : run.state === 'running' ? 'running' : 
                 run.result === 'succeeded' ? 'completed' : run.result === 'failed' ? 'failed' : 'cancelled') as any,
        createdAt: run.createdDate,
        completedAt: run.finishedDate,
      };

      addRun(localRun);
      setExecuting(false);

      // Reset form
      if (executionScope === 'file') {
        setSelectedTestFile(null);
      } else if (executionScope === 'tag') {
        setTestTag('');
      } else if (executionScope === 'grep') {
        setTestGrep('');
      }
    } catch (err: any) {
      console.error('Failed to execute run:', err);
      setError(err.message || 'Failed to execute pipeline run');
      setExecuting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-success" />;
      case 'failed':
        return <XCircle size={16} className="text-error" />;
      case 'running':
        return <Loader size={16} className="animate-spin text-primary" />;
      case 'queued':
        return <Clock size={16} className="text-warning" />;
      default:
        return <Clock size={16} className="text-base-content/60" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading && pipelines.length === 0) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error && pipelines.length === 0) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Play}
          title="Azure Pipelines Not Configured"
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
          <Play className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-base-content">Remote Test Execution</h2>
        </div>
        <button
          className="btn btn-sm btn-ghost"
          onClick={loadPipelines}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Execution Configuration */}
        <div className="glass-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-base-content">Execution Configuration</h3>

          {/* Pipeline Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Pipeline</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedPipeline?.id || ''}
              onChange={(e) => {
                const pipeline = pipelines.find((p) => p.id === parseInt(e.target.value));
                setSelectedPipeline(pipeline || null);
              }}
            >
              <option value="">Select a pipeline</option>
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.folder ? `${pipeline.folder}/${pipeline.name}` : pipeline.name}
                </option>
              ))}
            </select>
          </div>

          {/* Repository Selection */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Repository Path</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="Enter local repository path"
              value={repoRoot || ''}
              onChange={(e) => handleRepoSelect(e.target.value)}
            />
            <label className="label">
              <span className="label-text-alt">Path to cloned repository</span>
            </label>
          </div>

          {/* Branch */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Branch</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />
          </div>

          {/* Execution Scope */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Execution Scope</span>
            </label>
            <div className="flex gap-2 flex-wrap">
              <button
                className={`btn btn-sm ${executionScope === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setExecutionScope('all')}
              >
                Run All
              </button>
              <button
                className={`btn btn-sm ${executionScope === 'file' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setExecutionScope('file')}
                disabled={testFiles.length === 0}
              >
                <FileText size={14} />
                Run File
              </button>
              <button
                className={`btn btn-sm ${executionScope === 'tag' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setExecutionScope('tag')}
              >
                <Tag size={14} />
                Run by Tag
              </button>
              <button
                className={`btn btn-sm ${executionScope === 'grep' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setExecutionScope('grep')}
              >
                <Search size={14} />
                Run by Grep
              </button>
            </div>
          </div>

          {/* Scope-specific inputs */}
          {executionScope === 'file' && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Test File</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedTestFile?.relativePath || ''}
                onChange={(e) => {
                  const file = testFiles.find((f) => f.relativePath === e.target.value);
                  setSelectedTestFile(file || null);
                }}
              >
                <option value="">Select a test file</option>
                {testFiles.map((file) => (
                  <option key={file.relativePath} value={file.relativePath}>
                    {file.relativePath}
                  </option>
                ))}
              </select>
            </div>
          )}

          {executionScope === 'tag' && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Test Tag</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g., @smoke, @regression"
                value={testTag}
                onChange={(e) => setTestTag(e.target.value)}
              />
            </div>
          )}

          {executionScope === 'grep' && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Test Name Pattern</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g., login, checkout"
                value={testGrep}
                onChange={(e) => setTestGrep(e.target.value)}
              />
            </div>
          )}

          {/* Environment (optional) */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Environment (optional)</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder="e.g., staging, production"
              value={env}
              onChange={(e) => setEnv(e.target.value)}
            />
          </div>

          {/* Execute Button */}
          <button
            className="btn btn-primary w-full"
            onClick={executeRun}
            disabled={executing || !selectedPipeline || !repoRoot || !branch}
          >
            {executing ? (
              <>
                <Loader className="animate-spin" size={16} />
                Executing...
              </>
            ) : (
              <>
                <Play size={16} />
                Execute
              </>
            )}
          </button>

          {error && (
            <div className="alert alert-error">
              <XCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Active Runs */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-base-content mb-4">Active Runs</h3>
          {activeRuns.length === 0 ? (
            <EmptyState
              icon={Play}
              title="No Active Runs"
              description="Trigger a pipeline run to see it here"
            />
          ) : (
            <div className="space-y-3">
              {activeRuns.map((run) => (
                <div
                  key={run.id}
                  className="p-4 bg-base-200 rounded-lg border border-base-300"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(run.status)}
                      <div>
                        <div className="font-semibold text-sm">
                          {run.requestedScope === 'all' && 'Run All'}
                          {run.requestedScope === 'file' && `Run File: ${run.testFile}`}
                          {run.requestedScope === 'tag' && `Run Tag: ${run.testTag}`}
                          {run.requestedScope === 'grep' && `Run Grep: ${run.testGrep}`}
                        </div>
                        <div className="text-xs text-base-content/60">
                          Branch: {run.branch} • {formatDate(run.createdAt)}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={run.status} />
                  </div>
                  {run.adoRunUrl && (
                    <a
                      href={run.adoRunUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-xs btn-ghost"
                    >
                      <ExternalLink size={12} />
                      View in Azure DevOps
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RemoteExecutionScreen;

