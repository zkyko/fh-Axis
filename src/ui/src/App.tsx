import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Dashboard from './components/Dashboard';
import BrowserStackAutomateScreen from './components/BrowserStackAutomateScreen';
import TestManagementScreen from './components/TestManagementScreen';
import CorrelationView from './components/CorrelationView';
import JiraScreen from './components/JiraScreen';
import RepoCompanionScreen from './components/RepoCompanionScreen';
import RemoteExecutionScreen from './components/RemoteExecutionScreen';
import TestScriptViewer from './components/TestScriptViewer';
import SettingsScreen from './components/SettingsScreen';
import DiagnosticsScreen from './components/DiagnosticsScreen';

function App() {
  console.log('[App] Rendering App component');
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* BrowserStack Automate */}
          <Route path="automate" element={<BrowserStackAutomateScreen />} />
          <Route path="automate/:projectId" element={<BrowserStackAutomateScreen />} />
          <Route path="automate/:projectId/builds/:buildId" element={<BrowserStackAutomateScreen />} />
          <Route path="automate/:projectId/builds/:buildId/sessions/:sessionId" element={<BrowserStackAutomateScreen />} />
          
          {/* Test Management */}
          <Route path="test-management" element={<TestManagementScreen />} />
          <Route path="test-management/:projectId" element={<TestManagementScreen />} />
          <Route path="test-management/:projectId/runs/:runId" element={<TestManagementScreen />} />
          
          {/* Correlation */}
          <Route path="correlation" element={<CorrelationView />} />
          <Route path="correlation/:testResultId" element={<CorrelationView />} />
          
          {/* Jira */}
          <Route path="jira" element={<JiraScreen />} />
          <Route path="jira/:issueKey" element={<JiraScreen />} />
          
          {/* Tools */}
          <Route path="repo" element={<RepoCompanionScreen />} />
          <Route path="execution" element={<RemoteExecutionScreen />} />
          <Route path="test-viewer" element={<TestScriptViewer repoRoot="" />} />
          <Route path="settings" element={<SettingsScreen />} />
          <Route path="diagnostics" element={<DiagnosticsScreen />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
