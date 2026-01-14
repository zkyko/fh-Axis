import React from 'react';
import { useParams } from 'react-router-dom';
import EmptyState from './EmptyState';
import { Bug } from 'lucide-react';

const JiraScreen: React.FC = () => {
  const { issueKey } = useParams();

  if (issueKey) {
    return <div>Jira Issue: {issueKey}</div>;
  }

  return (
    <EmptyState
      icon={Bug}
      title="Jira Defects"
      description="View and manage linked Jira issues"
    />
  );
};

export default JiraScreen;

