import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GitMerge, Play, ExternalLink, FileText, Tag, Search, Bug } from 'lucide-react';
import { ipc } from '../ipc';
import EmptyState from './EmptyState';
import JiraBugCreationModal from './JiraBugCreationModal';

const CorrelationView: React.FC = () => {
  const { testResultId } = useParams();
  const navigate = useNavigate();
  const [rerunning, setRerunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJiraModal, setShowJiraModal] = useState(false);
  const [jiraModalInput, setJiraModalInput] = useState<{ type: 'build' | 'session' | 'tm'; id: string; projectId?: string } | null>(null);

  const handleRerun = async () => {
    if (!testResultId) return;

    setRerunning(true);
    setError(null);

    try {
      // Navigate to execution screen with pre-filled parameters
      // In a real implementation, we would fetch the test result details
      // and extract the test file/name/tag from it
      navigate('/execution', {
        state: {
          rerunFrom: testResultId,
          // These would be populated from the test result
          // testFile: testResult.metadata?.filePath,
          // testName: testResult.testName,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to initiate rerun');
    } finally {
      setRerunning(false);
    }
  };

  if (testResultId) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GitMerge className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-base-content">Correlation Details</h2>
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-secondary"
              onClick={() => {
                // For correlation view, we need to determine the input type
                // For now, we'll try to extract from testResultId or use a placeholder
                // In a full implementation, we'd fetch the test result and determine the source
                setJiraModalInput({ type: 'tm', id: testResultId || '' });
                setShowJiraModal(true);
              }}
            >
              <Bug size={16} />
              Create Jira Bug
            </button>
            <button
              className="btn btn-primary"
              onClick={handleRerun}
              disabled={rerunning}
            >
              {rerunning ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Rerunning...
                </>
              ) : (
                <>
                  <Play size={16} />
                  Rerun This Test
                </>
              )}
            </button>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-base-content mb-4">Test Result: {testResultId}</h3>
          <p className="text-base-content/70">
            Correlation details and rerun functionality. In a full implementation, this would show:
            - Test failure details
            - BrowserStack session evidence
            - Jira issue links
            - Rerun history
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {showJiraModal && jiraModalInput && (
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
  }

  return (
    <EmptyState
      icon={GitMerge}
      title="Correlation View"
      description="View correlated test results, BrowserStack sessions, and Jira issues"
    />
  );
};

export default CorrelationView;

