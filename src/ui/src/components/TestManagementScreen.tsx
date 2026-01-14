import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Plus, Edit, Trash2, Search, Filter, ChevronRight, ChevronLeft, Loader, Tag, User, Calendar, History, Download, CheckCircle, XCircle, AlertCircle, X, Save, Bug } from 'lucide-react';
import { ipc } from '../ipc';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';
import StatusBadge from './StatusBadge';
import Button from './Button';
import JiraBugCreationModal from './JiraBugCreationModal';

interface TestCase {
  identifier: string;
  title: string;
  case_type?: string;
  priority?: string;
  status?: string;
  folder_id?: number;
  issues?: string[] | any[];
  tags?: string[];
  template?: 'test_case_steps' | 'test_case_text' | 'test_case_bdd';
  description?: string;
  preconditions?: string;
  automation_status?: string;
  owner?: string | null;
  steps?: Array<{ step: string; result: string }>;
  custom_fields?: Array<{ name: string; value: string }>;
  created_at?: string;
  last_updated_at?: string;
  feature?: string;
  scenario?: string;
  background?: string;
}

const TestManagementScreen: React.FC = () => {
  const { projectId, runId } = useParams();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    case_type: '',
    automation_status: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    page_size: 30,
    count: 0,
    prev: null as string | null,
    next: null as string | null,
  });
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(new Set());
  const [testCaseForm, setTestCaseForm] = useState({
    name: '',
    template: 'test_case_steps' as 'test_case_steps' | 'test_case_text' | 'test_case_bdd',
    description: '',
    preconditions: '',
    case_type: 'Functional',
    priority: 'Medium',
    status: 'Active',
    automation_status: 'not_automated',
    owner: '',
    folder_id: '',
    steps: [{ step: '', result: '' }],
    tags: [] as string[],
    issues: [] as string[],
    issue_tracker: { name: 'jira' as 'jira' | 'azure' | 'asana', host: '' },
    custom_fields: {} as Record<string, string>,
    // BDD fields
    feature: '',
    scenario: '',
    background: '',
  });
  const [newTag, setNewTag] = useState('');
  const [newIssue, setNewIssue] = useState('');
  const [newCustomField, setNewCustomField] = useState({ name: '', value: '' });
  const [saving, setSaving] = useState(false);
  const [showJiraModal, setShowJiraModal] = useState(false);
  const [jiraModalInput, setJiraModalInput] = useState<{ type: 'build' | 'session' | 'tm'; id: string; projectId?: string } | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projectId && projects.length > 0) {
      // Try to find project in existing list first
      // BrowserStack uses 'identifier' for project ID (e.g., 'PR-45')
      const existingProject = projects.find((p: any) => {
        const pId = p.id || p.identifier;
        return pId === projectId || 
               pId === `PR-${projectId}` ||
               projectId === `PR-${pId}` ||
               pId === projectId.replace('PR-', '');
      });
      if (existingProject) {
        setSelectedProject(existingProject);
        // Use the project's actual ID (identifier field)
        const projectIdToUse = existingProject.id || existingProject.identifier;
        loadTestCases(projectIdToUse);
      } else {
        // Project not found in list, but try loading it anyway (might be a valid ID)
        // Ensure it's in PR-XXX format
        const formattedId = projectId.startsWith('PR-') ? projectId : `PR-${projectId}`;
        console.log('[TM] Project not found in list, trying to load with ID:', formattedId);
        loadTestCases(formattedId);
      }
    }
  }, [projectId, filters, pagination.page, projects]);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const projectsList = await ipc.bsTM.getProjects();
      setProjects(projectsList);
      // After loading projects, if we have a projectId, set it
      if (projectId) {
        // BrowserStack uses 'identifier' for project ID (e.g., 'PR-45')
        const project = projectsList.find((p: any) => {
          const pId = p.id || p.identifier;
          return pId === projectId || 
                 pId === `PR-${projectId}` ||
                 projectId === `PR-${pId}` ||
                 pId === projectId.replace('PR-', '');
        });
        if (project) {
          setSelectedProject(project);
          // Load test cases after project is found - use project's actual ID (identifier)
          const projectIdToUse = project.id || project.identifier;
          loadTestCases(projectIdToUse);
        } else {
          // Project not found in list, but try loading test cases anyway (might be a valid ID)
          // Ensure it's in PR-XXX format
          const formattedId = projectId.startsWith('PR-') ? projectId : `PR-${projectId}`;
          console.log('[TM] Project not found in loaded list, trying ID:', formattedId);
          loadTestCases(formattedId);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const loadTestCases = async (projectIdParam: string) => {
    if (!projectIdParam) {
      setError('Project ID is required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Ensure projectId is in the correct format (PR-XXX)
      const formattedProjectId = projectIdParam.startsWith('PR-') ? projectIdParam : `PR-${projectIdParam}`;
      
      // First try without any filters to get all test cases
      const options: any = {
        page: pagination.page || 1,
        pageSize: pagination.page_size || 30,
      };
      
      // Only add filters if they have values
      const activeFilters: any = {};
      if (filters.status) activeFilters.status = filters.status;
      if (filters.priority) activeFilters.priority = filters.priority;
      if (filters.case_type) activeFilters.case_type = filters.case_type;
      if (filters.automation_status) activeFilters.automation_status = filters.automation_status;
      
      if (Object.keys(activeFilters).length > 0) {
        options.filters = activeFilters;
      }
      
      if (searchQuery) {
        // Note: BrowserStack API doesn't have direct search, but we can filter by title via custom fields or client-side
      }
      console.log('[TM] Loading test cases for project:', formattedProjectId, 'with options:', JSON.stringify(options, null, 2));
      const response = await ipc.bsTM.getTestCases(formattedProjectId, options);
      console.log('[TM] Test cases response:', {
        success: response.success,
        count: response.test_cases?.length || 0,
        total: response.info?.count || 0,
        page: response.info?.page || 1,
        sample: response.test_cases?.slice(0, 2) || []
      });
      if (response.success) {
        setTestCases(response.test_cases || []);
        setPagination(response.info || pagination);
      } else {
        const errorMsg = response.error || 'Failed to load test cases';
        console.error('[TM] Error loading test cases:', errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load test cases';
      console.error('[TM] Exception loading test cases:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (testCaseId: string) => {
    if (!projectId || !confirm('Are you sure you want to delete this test case? This action cannot be undone.')) {
      return;
    }
    try {
      const result = await ipc.bsTM.deleteTestCase(projectId, testCaseId);
      if (result.success) {
        await loadTestCases(projectId);
        setSelectedTestCase(null);
      } else {
        alert(result.error || 'Failed to delete test case');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete test case');
    }
  };

  const handleBulkDelete = async () => {
    if (!projectId || selectedTestCases.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedTestCases.size} test case(s)? This action cannot be undone.`)) {
      return;
    }
    try {
      const result = await ipc.bsTM.bulkDeleteTestCases(projectId, Array.from(selectedTestCases));
      if (result.success) {
        await loadTestCases(projectId);
        setSelectedTestCases(new Set());
      } else {
        alert(result.error || 'Failed to delete test cases');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete test cases');
    }
  };

  const handleViewHistory = async (testCaseId: string) => {
    if (!projectId) return;
    setSelectedTestCase(testCases.find(tc => tc.identifier === testCaseId) || null);
    setShowHistoryModal(true);
  };

  const resetForm = () => {
    setTestCaseForm({
      name: '',
      template: 'test_case_steps',
      description: '',
      preconditions: '',
      case_type: 'Functional',
      priority: 'Medium',
      status: 'Active',
      automation_status: 'not_automated',
      owner: '',
      folder_id: '',
      steps: [{ step: '', result: '' }],
      tags: [],
      issues: [],
      issue_tracker: { name: 'jira', host: '' },
      custom_fields: {},
      feature: '',
      scenario: '',
      background: '',
    });
    setNewTag('');
    setNewIssue('');
    setNewCustomField({ name: '', value: '' });
  };

  const populateFormFromTestCase = (testCase: TestCase) => {
    setTestCaseForm({
      name: testCase.title || '',
      template: testCase.template || 'test_case_steps',
      description: testCase.description || '',
      preconditions: testCase.preconditions || '',
      case_type: testCase.case_type || 'Functional',
      priority: testCase.priority || 'Medium',
      status: testCase.status || 'Active',
      automation_status: testCase.automation_status || 'not_automated',
      owner: testCase.owner || '',
      folder_id: testCase.folder_id?.toString() || '',
      steps: testCase.steps && testCase.steps.length > 0
        ? testCase.steps.map(s => ({ step: s.step || '', result: s.result || '' }))
        : [{ step: '', result: '' }],
      tags: testCase.tags || [],
      issues: Array.isArray(testCase.issues) ? testCase.issues.map((i: any) => typeof i === 'string' ? i : i.jira_id || i.issue_id || '') : [],
      issue_tracker: { name: 'jira', host: '' },
      custom_fields: testCase.custom_fields
        ? testCase.custom_fields.reduce((acc, cf) => ({ ...acc, [cf.name]: cf.value }), {})
        : {},
      feature: testCase.feature || '',
      scenario: testCase.scenario || '',
      background: testCase.background || '',
    });
  };

  const handleSaveTestCase = async () => {
    if (!projectId) return;
    if (!testCaseForm.name || !testCaseForm.folder_id) {
      alert('Test case name and folder ID are required');
      return;
    }
    if (testCaseForm.template === 'test_case_bdd' && (!testCaseForm.feature || !testCaseForm.scenario)) {
      alert('Feature and Scenario are required for BDD test cases');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {
        name: testCaseForm.name,
        description: testCaseForm.description || undefined,
        preconditions: testCaseForm.preconditions || undefined,
        case_type: testCaseForm.case_type,
        priority: testCaseForm.priority,
        status: testCaseForm.status,
        automation_status: testCaseForm.automation_status,
        owner: testCaseForm.owner || undefined,
        tags: testCaseForm.tags.length > 0 ? testCaseForm.tags : undefined,
        issues: testCaseForm.issues.length > 0 ? testCaseForm.issues : undefined,
        custom_fields: Object.keys(testCaseForm.custom_fields).length > 0 ? testCaseForm.custom_fields : undefined,
      };

      if (testCaseForm.issues.length > 0 && testCaseForm.issue_tracker.host) {
        payload.issue_tracker = testCaseForm.issue_tracker;
      }

      if (testCaseForm.template === 'test_case_bdd') {
        payload.template = 'test_case_bdd';
        payload.feature = testCaseForm.feature;
        payload.scenario = testCaseForm.scenario;
        payload.background = testCaseForm.background || undefined;
      } else if (testCaseForm.template === 'test_case_steps') {
        const validSteps = testCaseForm.steps.filter(s => s.step.trim() || s.result.trim());
        if (validSteps.length > 0) {
          payload.test_case_steps = validSteps;
        }
      }

      let result;
      if (showCreateModal) {
        result = await ipc.bsTM.createTestCase(projectId, testCaseForm.folder_id, payload);
      } else if (showEditModal && selectedTestCase) {
        result = await ipc.bsTM.updateTestCase(projectId, selectedTestCase.identifier, payload);
      }

      if (result?.success || result?.data?.success) {
        await loadTestCases(projectId);
        setShowCreateModal(false);
        setShowEditModal(false);
        resetForm();
        setSelectedTestCase(null);
        alert(showCreateModal ? 'Test case created successfully!' : 'Test case updated successfully!');
      } else {
        alert(result?.error || result?.data?.error || 'Failed to save test case');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save test case');
    } finally {
      setSaving(false);
    }
  };

  const filteredTestCases = testCases.filter(tc => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        tc.title?.toLowerCase().includes(query) ||
        tc.identifier?.toLowerCase().includes(query) ||
        tc.description?.toLowerCase().includes(query) ||
        tc.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  if (runId) {
    return <div className="p-6">Run Details: {runId}</div>;
  }

  if (!projectId) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Test Management Projects</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Projects Found"
            description="Configure BrowserStack Test Management in Settings to get started"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th className="cursor-pointer hover:bg-base-300">ID</th>
                  <th className="cursor-pointer hover:bg-base-300">PROJECT TITLE</th>
                  <th>QUICK LINKS</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project: any) => {
                  // BrowserStack uses 'identifier' for project ID (e.g., 'PR-45')
                  const projectId = project.id || project.identifier;
                  const projectIdForUrl = projectId || `PR-${project.id || project.identifier}`;
                  return (
                    <tr
                      key={projectId || project.name}
                      className="cursor-pointer hover:bg-base-300"
                      onClick={() => {
                        console.log('[TM] Clicked project:', project, 'navigating to:', projectIdForUrl);
                        window.location.hash = `/test-management/${projectIdForUrl}`;
                      }}
                    >
                      <td className="font-mono font-semibold">{projectId}</td>
                      <td className="font-semibold">{project.name}</td>
                      <td>
                        <div className="flex gap-4 text-sm">
                          <span className="text-base-content/70">
                            {project.testCasesCount ?? 0} Test Cases
                          </span>
                          <span className="text-base-content/40">|</span>
                          <span className="text-base-content/70">
                            {project.recentRunsCount ?? 0} Test Runs
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="breadcrumbs text-sm mb-2">
            <ul>
              <li>
                <a href="#/test-management" onClick={(e) => { e.preventDefault(); window.location.hash = '/test-management'; }}>
                  Projects
                </a>
              </li>
              <li>{selectedProject?.name || projectId || 'Unknown Project'}</li>
            </ul>
          </div>
          <h2 className="text-2xl font-bold">{selectedProject?.name || projectId || 'Test Cases'}</h2>
        </div>
        <div className="flex gap-2">
          {selectedTestCases.size > 0 && (
            <button
              className="btn btn-error btn-sm"
              onClick={handleBulkDelete}
            >
              <Trash2 size={16} />
              Delete Selected ({selectedTestCases.size})
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Plus size={16} />
            Create Test Case
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card bg-base-200 mb-4">
        <div className="card-body">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="label">
                <span className="label-text">Search</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/40" size={16} />
                <input
                  type="text"
                  className="input input-bordered w-full pl-10"
                  placeholder="Search by title, ID, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Status</span>
              </label>
              <select
                className="select select-bordered"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Obsolete">Obsolete</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Priority</span>
              </label>
              <select
                className="select select-bordered"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <option value="">All</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Automation</span>
              </label>
              <select
                className="select select-bordered"
                value={filters.automation_status}
                onChange={(e) => setFilters({ ...filters, automation_status: e.target.value })}
              >
                <option value="">All</option>
                <option value="automated">Automated</option>
                <option value="not_automated">Not Automated</option>
                <option value="automation_not_required">Not Required</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Test Cases Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : filteredTestCases.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Test Cases Found"
          description="Create your first test case to get started"
        />
      ) : (
        <>
          <div className="card bg-base-200">
            <div className="card-body p-0">
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectedTestCases.size === filteredTestCases.length && filteredTestCases.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTestCases(new Set(filteredTestCases.map(tc => tc.identifier)));
                            } else {
                              setSelectedTestCases(new Set());
                            }
                          }}
                        />
                      </th>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Automation</th>
                      <th>Owner</th>
                      <th>Tags</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTestCases.map((testCase) => (
                      <tr
                        key={testCase.identifier}
                        className="cursor-pointer hover:bg-base-300"
                        onClick={() => setSelectedTestCase(testCase)}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={selectedTestCases.has(testCase.identifier)}
                            onChange={(e) => {
                              const newSet = new Set(selectedTestCases);
                              if (e.target.checked) {
                                newSet.add(testCase.identifier);
                              } else {
                                newSet.delete(testCase.identifier);
                              }
                              setSelectedTestCases(newSet);
                            }}
                          />
                        </td>
                        <td className="font-mono text-sm">{testCase.identifier}</td>
                        <td className="font-medium">{testCase.title}</td>
                        <td>
                          <span className="badge badge-ghost badge-sm">
                            {testCase.case_type || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <StatusBadge
                            status={testCase.priority || 'Medium'}
                            variant={testCase.priority === 'High' ? 'error' : testCase.priority === 'Low' ? 'success' : 'warning'}
                          />
                        </td>
                        <td>
                          <StatusBadge
                            status={testCase.status || 'Active'}
                            variant={testCase.status === 'Active' ? 'success' : 'warning'}
                          />
                        </td>
                        <td>
                          {testCase.automation_status === 'automated' ? (
                            <CheckCircle className="text-success" size={16} />
                          ) : (
                            <XCircle className="text-base-content/40" size={16} />
                          )}
                        </td>
                        <td className="text-sm">{testCase.owner || 'Unassigned'}</td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {testCase.tags?.slice(0, 2).map((tag, idx) => (
                              <span key={`tag-${idx}-${tag}`} className="badge badge-outline badge-xs">
                                {tag}
                              </span>
                            ))}
                            {testCase.tags && testCase.tags.length > 2 && (
                              <span className="badge badge-outline badge-xs">
                                +{testCase.tags.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1">
                            <button
                              className="btn btn-xs btn-ghost"
                              onClick={() => {
                                setSelectedTestCase(testCase);
                                populateFormFromTestCase(testCase);
                                setShowEditModal(true);
                              }}
                              title="Edit"
                            >
                              <Edit size={12} />
                            </button>
                            <button
                              className="btn btn-xs btn-ghost"
                              onClick={() => handleViewHistory(testCase.identifier)}
                              title="History"
                            >
                              <History size={12} />
                            </button>
                            <button
                              className="btn btn-xs btn-secondary"
                              onClick={() => {
                                setJiraModalInput({ type: 'tm', id: testCase.identifier, projectId: projectId });
                                setShowJiraModal(true);
                              }}
                              title="Create Jira Bug"
                            >
                              <Bug size={12} />
                            </button>
                            <button
                              className="btn btn-xs btn-ghost text-error"
                              onClick={() => handleDelete(testCase.identifier)}
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Pagination */}
          {pagination.count > pagination.page_size && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-base-content/60">
                Showing {((pagination.page - 1) * pagination.page_size) + 1} to {Math.min(pagination.page * pagination.page_size, pagination.count)} of {pagination.count} test cases
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm"
                  disabled={!pagination.prev}
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  className="btn btn-sm"
                  disabled={!pagination.next}
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Test Case Detail Modal */}
      {selectedTestCase && !showEditModal && !showHistoryModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-5xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-base-300">
              <div className="flex-1">
                <h3 className="font-bold text-2xl mb-2">{selectedTestCase.title}</h3>
                <div className="flex items-center gap-3 text-sm text-base-content/60">
                  <span className="font-mono font-semibold">{selectedTestCase.identifier}</span>
                  {selectedTestCase.template && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{selectedTestCase.template.replace('_', ' ')}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setSelectedTestCase(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Metadata Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-base-200 p-3 rounded-lg">
                  <div className="text-xs text-base-content/60 mb-1">Status</div>
                  <StatusBadge status={selectedTestCase.status || 'Active'} />
                </div>
                <div className="bg-base-200 p-3 rounded-lg">
                  <div className="text-xs text-base-content/60 mb-1">Priority</div>
                  <StatusBadge status={selectedTestCase.priority || 'Medium'} />
                </div>
                <div className="bg-base-200 p-3 rounded-lg">
                  <div className="text-xs text-base-content/60 mb-1">Automation Status</div>
                  <div className="text-sm font-medium capitalize">
                    {selectedTestCase.automation_status?.replace('_', ' ') || 'Not Automated'}
                  </div>
                </div>
                <div className="bg-base-200 p-3 rounded-lg">
                  <div className="text-xs text-base-content/60 mb-1">Owner</div>
                  <div className="text-sm font-medium">{selectedTestCase.owner || 'Unassigned'}</div>
                </div>
                {selectedTestCase.case_type && (
                  <div className="bg-base-200 p-3 rounded-lg">
                    <div className="text-xs text-base-content/60 mb-1">Case Type</div>
                    <div className="text-sm font-medium">{selectedTestCase.case_type}</div>
                  </div>
                )}
                {(selectedTestCase.created_at || selectedTestCase.last_updated_at) && (
                  <div className="bg-base-200 p-3 rounded-lg">
                    <div className="text-xs text-base-content/60 mb-1">Last Updated</div>
                    <div className="text-sm font-medium">
                      {selectedTestCase.last_updated_at 
                        ? new Date(selectedTestCase.last_updated_at).toLocaleDateString()
                        : 'N/A'}
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {selectedTestCase.description && (
                <div className="bg-base-200 p-4 rounded-lg">
                  <div className="text-sm font-semibold mb-3 text-base-content/80">Description</div>
                  <div 
                    className="prose prose-sm max-w-none prose-headings:text-base-content prose-p:text-base-content/90 prose-li:text-base-content/90 prose-strong:text-base-content"
                    dangerouslySetInnerHTML={{ __html: selectedTestCase.description }} 
                  />
                </div>
              )}

              {/* Preconditions */}
              {selectedTestCase.preconditions && (
                <div className="bg-base-200 p-4 rounded-lg">
                  <div className="text-sm font-semibold mb-3 text-base-content/80">Preconditions</div>
                  <div 
                    className="prose prose-sm max-w-none prose-headings:text-base-content prose-p:text-base-content/90 prose-li:text-base-content/90 prose-strong:text-base-content"
                    dangerouslySetInnerHTML={{ __html: selectedTestCase.preconditions }} 
                  />
                </div>
              )}

              {/* BDD Details */}
              {selectedTestCase.template === 'test_case_bdd' && (
                <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                  <div className="text-sm font-semibold mb-3 text-primary">BDD Details</div>
                  <div className="space-y-2">
                    {selectedTestCase.feature && (
                      <div>
                        <span className="font-semibold text-sm">Feature:</span>
                        <div className="mt-1 text-sm">{selectedTestCase.feature}</div>
                      </div>
                    )}
                    {selectedTestCase.scenario && (
                      <div>
                        <span className="font-semibold text-sm">Scenario:</span>
                        <div className="mt-1 text-sm">{selectedTestCase.scenario}</div>
                      </div>
                    )}
                    {selectedTestCase.background && (
                      <div>
                        <span className="font-semibold text-sm">Background:</span>
                        <div className="mt-1 text-sm">{selectedTestCase.background}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Test Steps */}
              {selectedTestCase.steps && selectedTestCase.steps.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-3 text-base-content/80">Test Steps</div>
                  <div className="space-y-3">
                    {selectedTestCase.steps.map((step, idx) => (
                      <div 
                        key={`step-${idx}-${step.step?.substring(0, 10)}`} 
                        className="bg-base-200 border-l-4 border-primary p-4 rounded-r-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div>
                              <div className="text-xs font-semibold text-base-content/60 mb-1">Step</div>
                              <div 
                                className="prose prose-sm max-w-none prose-p:text-base-content/90 prose-li:text-base-content/90 prose-strong:text-base-content prose-ol:text-base-content/90"
                                dangerouslySetInnerHTML={{ __html: step.step || '' }} 
                              />
                            </div>
                            {step.result && (
                              <div className="pt-2 border-t border-base-300">
                                <div className="text-xs font-semibold text-base-content/60 mb-1">Expected Result</div>
                                <div 
                                  className="prose prose-sm max-w-none prose-p:text-base-content/90 prose-li:text-base-content/90 prose-strong:text-base-content prose-ol:text-base-content/90"
                                  dangerouslySetInnerHTML={{ __html: step.result }} 
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedTestCase.tags && selectedTestCase.tags.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2 text-base-content/80">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTestCase.tags.map((tag, idx) => (
                      <span key={`tag-${idx}-${tag}`} className="badge badge-primary badge-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues */}
              {selectedTestCase.issues && selectedTestCase.issues.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2 text-base-content/80">Linked Issues</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTestCase.issues.map((issue: any, idx: number) => {
                      const issueId = typeof issue === 'string' ? issue : issue.jira_id || issue.issue_id || '';
                      return (
                        <span key={`issue-${idx}-${issueId}`} className="badge badge-outline badge-sm">
                          {issueId}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Fields */}
              {selectedTestCase.custom_fields && selectedTestCase.custom_fields.length > 0 && (
                <div>
                  <div className="text-sm font-semibold mb-2 text-base-content/80">Custom Fields</div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedTestCase.custom_fields.map((field, idx) => (
                      <div key={`custom-${idx}-${field.name}`} className="bg-base-200 p-3 rounded">
                        <div className="text-xs text-base-content/60 mb-1">{field.name}</div>
                        <div className="text-sm font-medium">{field.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="modal-action mt-6 pt-4 border-t border-base-300">
              <button className="btn" onClick={() => setSelectedTestCase(null)}>Close</button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (selectedTestCase) {
                    populateFormFromTestCase(selectedTestCase);
                    setShowEditModal(true);
                    setSelectedTestCase(null);
                  }
                }}
              >
                <Edit size={16} />
                Edit Test Case
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelectedTestCase(null)}></div>
        </div>
      )}

      {/* Create/Edit Modal - Placeholder for now */}
      {(showCreateModal || showEditModal) && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {showCreateModal ? 'Create Test Case' : 'Edit Test Case'}
            </h3>
            <div className="alert alert-info">
              <AlertCircle size={20} />
              <span>Test case creation/editing form will be implemented in the next step</span>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}>Close</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}></div>
        </div>
      )}

      {/* History Modal - Placeholder */}
      {showHistoryModal && selectedTestCase && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Test Case History: {selectedTestCase.identifier}</h3>
            <div className="alert alert-info">
              <History size={20} />
              <span>History viewer will be implemented in the next step</span>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => { setShowHistoryModal(false); setSelectedTestCase(null); }}>Close</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => { setShowHistoryModal(false); setSelectedTestCase(null); }}></div>
        </div>
      )}

      {/* Jira Bug Creation Modal */}
      {jiraModalInput && (
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
};

export default TestManagementScreen;
