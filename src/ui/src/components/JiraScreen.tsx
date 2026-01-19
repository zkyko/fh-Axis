import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import EmptyState from './EmptyState';
import { Bug, ExternalLink, Loader2 } from 'lucide-react';
import { ipc } from '../ipc';

const JiraScreen: React.FC = () => {
  const { issueKey } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<Array<{ key: string; summary: string; status: string; assignee?: string; priority?: string; url: string }>>([]);
  const [projectKey, setProjectKey] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const settings = await ipc.settings.get();
        const defaultProject = settings?.jira?.defaults?.projectKey || '';
        setProjectKey(defaultProject);
        if (defaultProject) {
          const jql = `project = ${defaultProject} ORDER BY created DESC`;
          const results = await ipc.jira.searchIssues(jql);
          setIssues(results || []);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load Jira issues');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (issueKey) {
    return <div className="p-4">Jira Issue: {issueKey}</div>;
  }

  if (!projectKey) {
    return (
      <EmptyState
        icon={Bug}
        title="Jira Defects"
        description="Set a default Jira project in Settings to view issues."
      />
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2">
        <Loader2 className="animate-spin" />
        <span>Loading Jira issues…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-error">{error}</div>
    );
  }

  if (!issues || issues.length === 0) {
    return (
      <EmptyState
        icon={Bug}
        title={`No issues in ${projectKey}`}
        description="Create a new bug from a failure or adjust filters."
      />
    );
  }

  return (
    <div className="p-4">
      <div className="mb-3 text-sm opacity-70">Project: {projectKey}</div>
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Key</th>
              <th>Summary</th>
              <th>Status</th>
              <th>Assignee</th>
              <th>Priority</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((i) => (
              <tr key={i.key}>
                <td>{i.key}</td>
                <td className="max-w-xl truncate" title={i.summary}>{i.summary}</td>
                <td>{i.status}</td>
                <td>{i.assignee || '-'}</td>
                <td>{i.priority || '-'}</td>
                <td>
                  <a className="link link-primary inline-flex items-center gap-1" href={i.url} target="_blank" rel="noreferrer">
                    Open <ExternalLink size={14} />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JiraScreen;

