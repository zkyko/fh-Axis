import React, { useState, useEffect } from 'react';
import { Bug, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { ipc } from '../ipc';

interface JiraBugCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  failureInput: { type: 'build' | 'session' | 'tm'; id: string; projectId?: string };
}

interface SessionChoice {
  label: string;
  sessionId: string;
  sessionUrl?: string;
  status?: string;
}

interface JiraDraft {
  summary: string;
  description: string;
  labels: string[];
}

const JiraBugCreationModal: React.FC<JiraBugCreationModalProps> = ({
  isOpen,
  onClose,
  failureInput,
}) => {
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ key: string; url: string } | null>(null);
  
  const [draft, setDraft] = useState<JiraDraft | null>(null);
  const [sessionChoices, setSessionChoices] = useState<SessionChoice[] | undefined>();
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>();
  
  const [editedDraft, setEditedDraft] = useState<JiraDraft | null>(null);
  const [fields, setFields] = useState({
    projectKey: '',
    issueType: 'Bug',
    priority: '',
    assignee: '',
    component: '',
  });
  const [jiraDefaults, setJiraDefaults] = useState<{
    projectKey: string;
    issueType: string;
    defaultLabels: string[];
    componentRules: Array<{ pattern: string; component: string }>;
  } | null>(null);

  // Load Jira defaults on mount
  useEffect(() => {
    loadJiraDefaults();
  }, []);

  // Load draft on open
  useEffect(() => {
    if (isOpen && failureInput) {
      loadDraft();
    } else {
      // Reset state on close
      setDraft(null);
      setEditedDraft(null);
      setSessionChoices(undefined);
      setSelectedSessionId(undefined);
      setError(null);
      setSuccess(null);
      // Reset fields to defaults
      if (jiraDefaults) {
        setFields({
          projectKey: jiraDefaults.projectKey,
          issueType: jiraDefaults.issueType,
          priority: '',
          assignee: '',
          component: '',
        });
      }
    }
  }, [isOpen, failureInput, jiraDefaults]);

  const loadJiraDefaults = async () => {
    try {
      const settings = await ipc.settings.get();
      if (settings.jira?.defaults) {
        const defaults = settings.jira.defaults;
        setJiraDefaults({
          projectKey: defaults.projectKey || '',
          issueType: defaults.issueType || 'Bug',
          defaultLabels: defaults.defaultLabels || ['axis', 'automation', 'browserstack'],
          componentRules: defaults.componentRules || [],
        });
        // Initialize fields with defaults
        setFields({
          projectKey: defaults.projectKey || '',
          issueType: defaults.issueType || 'Bug',
          priority: '',
          assignee: '',
          component: '',
        });
      }
    } catch (err) {
      console.error('Failed to load Jira defaults:', err);
    }
  };

  const loadDraft = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await ipc.jira.prepareBugDraft({
        failureInput,
        preferredSessionId: selectedSessionId,
      });
      
      // Merge default labels with draft labels
      let finalLabels = result.draft.labels;
      if (jiraDefaults?.defaultLabels) {
        const combined = [...new Set([...jiraDefaults.defaultLabels, ...result.draft.labels])];
        finalLabels = combined;
      }
      
      const finalDraft = { ...result.draft, labels: finalLabels };
      setDraft(finalDraft);
      setEditedDraft(finalDraft);
      setSessionChoices(result.sessionChoices);
      
      // Apply component rules if available
      if (jiraDefaults?.componentRules && finalDraft.summary) {
        for (const rule of jiraDefaults.componentRules) {
          try {
            const regex = new RegExp(rule.pattern, 'i');
            if (regex.test(finalDraft.summary) || finalDraft.summary.toLowerCase().includes(rule.pattern.toLowerCase())) {
              setFields((prev) => ({ ...prev, component: rule.component }));
              break;
            }
          } catch (e) {
            // Invalid regex, try contains match
            if (finalDraft.summary.toLowerCase().includes(rule.pattern.toLowerCase())) {
              setFields((prev) => ({ ...prev, component: rule.component }));
              break;
            }
          }
        }
      }
      
      // If session choices exist and we haven't selected one, use the first one
      if (result.sessionChoices && result.sessionChoices.length > 0 && !selectedSessionId) {
        setSelectedSessionId(result.sessionChoices[0].sessionId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to prepare bug draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSessionChange = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setLoading(true);
    setError(null);
    try {
      const result = await ipc.jira.prepareBugDraft({
        failureInput,
        preferredSessionId: sessionId,
      });
      
      setDraft(result.draft);
      setEditedDraft(result.draft);
    } catch (err: any) {
      setError(err.message || 'Failed to update draft');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async () => {
    if (!editedDraft || !fields.projectKey) {
      setError('Project key is required');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const result = await ipc.jira.createIssueFromDraft({
        draft: editedDraft,
        fields,
      });
      
      setSuccess(result);
    } catch (err: any) {
      setError(err.message || 'Failed to create Jira issue');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Bug size={20} />
            Create Jira Bug
          </h3>
          <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin" size={24} />
            <span className="ml-2">Preparing bug draft...</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error mb-4">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success mb-4">
            <CheckCircle size={20} />
            <div className="flex-1">
              <div className="font-semibold">Issue created successfully!</div>
              <a
                href={success.url}
                target="_blank"
                rel="noopener noreferrer"
                className="link link-primary mt-1"
              >
                {success.key} - Open in Jira
              </a>
            </div>
            <button className="btn btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        )}

        {!loading && !success && editedDraft && (
          <div className="space-y-4">
            {/* Session Selection (for build inputs) */}
            {sessionChoices && sessionChoices.length > 1 && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Choose Failing Session</span>
                </label>
                <select
                  className="select select-bordered"
                  value={selectedSessionId || ''}
                  onChange={(e) => handleSessionChange(e.target.value)}
                >
                  {sessionChoices.map((choice) => (
                    <option key={choice.sessionId} value={choice.sessionId}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Project Key */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Project Key *</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="QST"
                value={fields.projectKey}
                onChange={(e) => setFields({ ...fields, projectKey: e.target.value })}
              />
              <label className="label">
                <span className="label-text-alt">
                  {jiraDefaults?.projectKey
                    ? `Default: ${jiraDefaults.projectKey} (configure in Settings)`
                    : 'Configure default in Settings'}
                </span>
              </label>
            </div>

            {/* Summary */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Summary</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                value={editedDraft.summary}
                onChange={(e) => setEditedDraft({ ...editedDraft, summary: e.target.value })}
              />
            </div>

            {/* Description */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-64 font-mono text-sm"
                value={editedDraft.description}
                onChange={(e) => setEditedDraft({ ...editedDraft, description: e.target.value })}
              />
            </div>

            {/* Labels */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Labels</span>
              </label>
              <input
                type="text"
                className="input input-bordered"
                placeholder="axis, automation, browserstack"
                value={editedDraft.labels.join(', ')}
                onChange={(e) => {
                  const labels = e.target.value
                    .split(',')
                    .map((l) => l.trim())
                    .filter((l) => l.length > 0);
                  setEditedDraft({ ...editedDraft, labels });
                }}
              />
              <label className="label">
                <span className="label-text-alt">Comma-separated list of labels</span>
              </label>
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Issue Type</span>
                </label>
                <select
                  className="select select-bordered"
                  value={fields.issueType}
                  onChange={(e) => setFields({ ...fields, issueType: e.target.value })}
                >
                  <option value="Bug">Bug</option>
                  <option value="Task">Task</option>
                  <option value="Story">Story</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Priority</span>
                </label>
                <select
                  className="select select-bordered"
                  value={fields.priority}
                  onChange={(e) => setFields({ ...fields, priority: e.target.value })}
                >
                  <option value="">None</option>
                  <option value="Highest">Highest</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                  <option value="Lowest">Lowest</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Assignee</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Account ID or username"
                  value={fields.assignee}
                  onChange={(e) => setFields({ ...fields, assignee: e.target.value })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Component</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Component name"
                  value={fields.component}
                  onChange={(e) => setFields({ ...fields, component: e.target.value })}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="modal-action mt-6 pt-4 border-t border-base-300">
              <button className="btn btn-ghost" onClick={onClose} disabled={creating}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateIssue}
                disabled={creating || !fields.projectKey || !editedDraft.summary}
              >
                {creating ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Creating...
                  </>
                ) : (
                  <>
                    <Bug size={16} />
                    Create Issue
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default JiraBugCreationModal;

