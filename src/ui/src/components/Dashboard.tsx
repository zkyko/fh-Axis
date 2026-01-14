import React, { useEffect, useState } from 'react';
import { Cloud, FileText, XCircle, Bug, Activity } from 'lucide-react';
import MetricCard from './MetricCard';
import StatusBadge from './StatusBadge';
import Skeleton from './Skeleton';
import EmptyState from './EmptyState';
import { ipc } from '../ipc';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    automateBuilds: 0,
    tmRuns: 0,
    failedTests: 0,
    linkedJira: 0,
  });
  const [recentBuilds, setRecentBuilds] = useState<any[]>([]);
  const [recentRuns, setRecentRuns] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load BrowserStack Automate data - get all builds (no project filter)
      const automateBuilds = await ipc.bsAutomate.getBuilds();
      const recentAutomateBuilds = automateBuilds
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5); // Get 5 most recent
      
      // Calculate Automate metrics (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentBuildsCount = automateBuilds.filter(build => {
        const buildDate = new Date(build.createdAt || 0);
        return buildDate >= sevenDaysAgo;
      }).length;
      
      const failedBuildsCount = automateBuilds.filter(build => 
        build.status === 'failed' || build.status === 'error'
      ).length;

      // Load BrowserStack Test Management data
      const tmProjects = await ipc.bsTM.getProjects();
      let allTMTestCases: any[] = [];
      
      // Get test cases from all TM projects (limit to first 3 projects to avoid too many calls)
      for (const project of tmProjects.slice(0, 3)) {
        try {
          const response = await ipc.bsTM.getTestCases(project.id, {
            page: 1,
            pageSize: 10, // Get recent test cases
          });
          if (response.success && Array.isArray(response.test_cases)) {
            allTMTestCases = allTMTestCases.concat(response.test_cases.map((tc: any) => ({
              ...tc,
              projectId: project.id,
              projectName: project.name,
            })));
          }
        } catch (err) {
          console.warn(`Failed to load test cases for TM project ${project.id}:`, err);
        }
      }
      
      // Sort by last updated and get 5 most recent
      const recentTMTestCases = allTMTestCases
        .sort((a, b) => {
          const dateA = new Date(a.last_updated_at || a.created_at || 0).getTime();
          const dateB = new Date(b.last_updated_at || b.created_at || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);

      // Calculate TM metrics (last 7 days)
      const recentTMTestCasesCount = allTMTestCases.filter(tc => {
        const updateDate = new Date(tc.last_updated_at || tc.created_at || 0);
        return updateDate >= sevenDaysAgo;
      }).length;

      // Update metrics
      setMetrics({
        automateBuilds: recentBuildsCount,
        tmRuns: recentTMTestCasesCount,
        failedTests: failedBuildsCount,
        linkedJira: 0, // TODO: Calculate from correlation data
      });
      
      // Update recent activity
      setRecentBuilds(recentAutomateBuilds.map(build => ({
        id: build.id,
        name: build.name,
        status: build.status,
        duration: build.duration ? `${Math.round(build.duration / 60)}m ${build.duration % 60}s` : 'N/A',
        createdAt: build.createdAt,
      })));
      
      setRecentRuns(recentTMTestCases.map(tc => ({
        id: tc.identifier || tc.id,
        name: tc.title || tc.name || 'Unnamed Test Case',
        status: tc.status || 'unknown',
        priority: tc.priority || 'N/A',
        passCount: 0, // Test cases don't have pass/fail counts
        failCount: 0,
        projectId: tc.projectId,
        projectName: tc.projectName,
        createdAt: tc.last_updated_at || tc.created_at,
      })));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="glass-card p-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/20 rounded-lg">
            <Activity size={32} className="text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-base-content">Axis</h2>
            <p className="text-base-content/70 mt-1">
              Unified view of test execution, failures, and defect tracking
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <Skeleton variant="card" count={4} />
          </>
        ) : (
          <>
            <MetricCard
              title="Total Automate Builds"
              value={metrics.automateBuilds}
              icon={Cloud}
              className="border-l-4 border-[#4C6EF5]"
            />
            <MetricCard
              title="TM Test Cases (7d)"
              value={metrics.tmRuns}
              icon={FileText}
              className="border-l-4 border-[#9775FA]"
            />
            <MetricCard
              title="Failed Tests"
              value={metrics.failedTests}
              icon={XCircle}
              className="border-l-4 border-[#FA5252]"
            />
            <MetricCard
              title="Linked Jira Issues"
              value={metrics.linkedJira}
              icon={Bug}
              className="border-l-4 border-[#FD7E14]"
            />
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Automate Builds */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-base-content mb-4">Recent Automate Builds</h3>
          {loading ? (
            <Skeleton variant="table" count={5} />
          ) : recentBuilds.length === 0 ? (
            <EmptyState
              title="No builds found"
              description="Recent BrowserStack Automate builds will appear here"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Build Name</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBuilds.map((build) => (
                    <tr key={build.id}>
                      <td className="font-semibold">{build.name}</td>
                      <td><StatusBadge status={build.status} /></td>
                      <td className="text-sm text-base-content/70">{build.duration}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-ghost"
                          onClick={() => window.location.hash = `/automate/${build.id}`}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent TM Test Cases */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-semibold text-base-content mb-4">Recent TM Test Cases</h3>
          {loading ? (
            <Skeleton variant="table" count={5} />
          ) : recentRuns.length === 0 ? (
            <EmptyState
              title="No test cases yet"
              description="Recent BrowserStack Test Management test cases will appear here"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Test Case</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Project</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((tc) => (
                    <tr key={tc.id}>
                      <td>
                        <div className="font-semibold">{tc.name}</div>
                        <div className="text-xs text-base-content/60 font-mono">{tc.id}</div>
                      </td>
                      <td><StatusBadge status={tc.status} /></td>
                      <td className="text-sm text-base-content/70">{tc.priority || 'N/A'}</td>
                      <td className="text-sm text-base-content/70">{tc.projectName || 'N/A'}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-ghost"
                          onClick={() => window.location.hash = `/test-management/${tc.projectId}`}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

