import Database from 'better-sqlite3';
import * as path from 'path';
import { app } from 'electron';

export interface CorrelationRecord {
  testResultId: string;
  automateSessionId?: string;
  jiraIssueKey?: string;
  azureRepoId?: string;
  azureCommitHash?: string;
  azureBranch?: string;
  createdAt: string;
}

export interface TriageMetadata {
  testId: string;
  assignee?: string;
  labels?: string[];
  notes?: string;
  updatedAt: string;
}

export interface WorkflowLogEntry {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  details?: Record<string, any>;
}

export interface Run {
  id: string;
  adoPipelineId: string;
  adoRunId: string;
  adoRunUrl?: string;
  correlationKey: string;
  requestedScope: 'all' | 'file' | 'tag' | 'grep';
  testFile?: string;
  testTag?: string;
  testGrep?: string;
  repoId?: string;
  branch?: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  completedAt?: string;
}

export interface RerunLink {
  id: string;
  originalRunId: string;
  rerunRunId: string;
  errorSignature?: string;
  createdAt: string;
}

export class StorageService {
  private db: Database.Database | null = null;

  private getDb(): Database.Database {
    if (!this.db) {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'qa-hub.db');
      this.db = new Database(dbPath);
      this.initializeTables();
    }
    return this.db;
  }

  private initializeTables(): void {
    const db = this.getDb();
    // Correlations table
    db.exec(`
      CREATE TABLE IF NOT EXISTS correlations (
        test_result_id TEXT PRIMARY KEY,
        automate_session_id TEXT,
        jira_issue_key TEXT,
        azure_repo_id TEXT,
        azure_commit_hash TEXT,
        azure_branch TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Triage metadata table
    db.exec(`
      CREATE TABLE IF NOT EXISTS triage_metadata (
        test_id TEXT PRIMARY KEY,
        assignee TEXT,
        labels TEXT,
        notes TEXT,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Workflow log table
    db.exec(`
      CREATE TABLE IF NOT EXISTS workflow_log (
        id TEXT PRIMARY KEY,
        user TEXT NOT NULL,
        action TEXT NOT NULL,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        details TEXT
      )
    `);

    // Local repository paths table
    db.exec(`
      CREATE TABLE IF NOT EXISTS local_repo_paths (
        repo_id TEXT PRIMARY KEY,
        repo_name TEXT NOT NULL,
        local_path TEXT NOT NULL,
        cloned_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Runs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS runs (
        id TEXT PRIMARY KEY,
        ado_pipeline_id TEXT NOT NULL,
        ado_run_id TEXT NOT NULL,
        ado_run_url TEXT,
        correlation_key TEXT NOT NULL,
        requested_scope TEXT NOT NULL,
        test_file TEXT,
        test_tag TEXT,
        test_grep TEXT,
        repo_id TEXT,
        branch TEXT,
        status TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        completed_at TEXT
      )
    `);

    // Rerun links table
    db.exec(`
      CREATE TABLE IF NOT EXISTS rerun_links (
        id TEXT PRIMARY KEY,
        original_run_id TEXT NOT NULL,
        rerun_run_id TEXT NOT NULL,
        error_signature TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_correlations_session ON correlations(automate_session_id);
      CREATE INDEX IF NOT EXISTS idx_correlations_jira ON correlations(jira_issue_key);
      CREATE INDEX IF NOT EXISTS idx_correlations_azure_commit ON correlations(azure_commit_hash);
      CREATE INDEX IF NOT EXISTS idx_workflow_log_timestamp ON workflow_log(timestamp);
      CREATE INDEX IF NOT EXISTS idx_runs_correlation_key ON runs(correlation_key);
      CREATE INDEX IF NOT EXISTS idx_runs_ado_run_id ON runs(ado_run_id);
      CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status);
      CREATE INDEX IF NOT EXISTS idx_rerun_links_original ON rerun_links(original_run_id);
      CREATE INDEX IF NOT EXISTS idx_rerun_links_signature ON rerun_links(error_signature);
    `);
    
    // Migrate existing correlations table if needed (add Azure columns)
    try {
      db.exec(`ALTER TABLE correlations ADD COLUMN azure_repo_id TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }
    try {
      db.exec(`ALTER TABLE correlations ADD COLUMN azure_commit_hash TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }
    try {
      db.exec(`ALTER TABLE correlations ADD COLUMN azure_branch TEXT`);
    } catch (e) {
      // Column already exists, ignore
    }
  }

  async saveCorrelation(
    testResultId: string,
    automateSessionId?: string,
    jiraIssueKey?: string,
    azureData?: {
      azureRepoId?: string;
      azureCommitHash?: string;
      azureBranch?: string;
    }
  ): Promise<void> {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO correlations 
      (test_result_id, automate_session_id, jira_issue_key, azure_repo_id, azure_commit_hash, azure_branch, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(
      testResultId,
      automateSessionId || null,
      jiraIssueKey || null,
      azureData?.azureRepoId || null,
      azureData?.azureCommitHash || null,
      azureData?.azureBranch || null
    );
  }

  async getCorrelation(testResultId: string): Promise<CorrelationRecord | null> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM correlations WHERE test_result_id = ?
    `);
    const row = stmt.get(testResultId) as any;
    if (!row) return null;
    
    return {
      testResultId: row.test_result_id,
      automateSessionId: row.automate_session_id,
      jiraIssueKey: row.jira_issue_key,
      azureRepoId: row.azure_repo_id,
      azureCommitHash: row.azure_commit_hash,
      azureBranch: row.azure_branch,
      createdAt: row.created_at,
    };
  }

  async saveTriageMetadata(metadata: TriageMetadata): Promise<void> {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO triage_metadata 
      (test_id, assignee, labels, notes, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(
      metadata.testId,
      metadata.assignee || null,
      metadata.labels ? JSON.stringify(metadata.labels) : null,
      metadata.notes || null
    );
  }

  async getTriageMetadata(testId: string): Promise<TriageMetadata | null> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM triage_metadata WHERE test_id = ?
    `);
    const row = stmt.get(testId) as any;
    if (!row) return null;
    
    return {
      testId: row.test_id,
      assignee: row.assignee,
      labels: row.labels ? JSON.parse(row.labels) : [],
      notes: row.notes,
      updatedAt: row.updated_at,
    };
  }

  async logWorkflow(entry: WorkflowLogEntry): Promise<void> {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT INTO workflow_log (id, user, action, timestamp, details)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      entry.id,
      entry.user,
      entry.action,
      entry.timestamp,
      entry.details ? JSON.stringify(entry.details) : null
    );
  }

  async saveLocalRepoPath(repoId: string, repoName: string, localPath: string): Promise<void> {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO local_repo_paths (repo_id, repo_name, local_path, cloned_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(repoId, repoName, localPath);
  }

  async getLocalRepoPath(repoId: string): Promise<string | null> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT local_path FROM local_repo_paths WHERE repo_id = ?
    `);
    const row = stmt.get(repoId) as any;
    return row ? row.local_path : null;
  }

  async getAllLocalRepoPaths(): Promise<Record<string, string>> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT repo_id, local_path FROM local_repo_paths
    `);
    const rows = stmt.all() as any[];
    const result: Record<string, string> = {};
    rows.forEach(row => {
      result[row.repo_id] = row.local_path;
    });
    return result;
  }

  async getDefaultWorkspacePath(): Promise<string> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT value FROM app_settings WHERE key = 'default_workspace_path'
    `);
    const row = stmt.get() as any;
    if (row) {
      return row.value;
    }
    // Default to user's Documents/QA-Studio-Workspace
    const userDataPath = app.getPath('documents');
    const defaultPath = path.join(userDataPath, 'QA-Studio-Workspace');
    await this.setDefaultWorkspacePath(defaultPath);
    return defaultPath;
  }

  async setDefaultWorkspacePath(workspacePath: string): Promise<void> {
    const db = this.getDb();
    // Create settings table if it doesn't exist
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);
    } catch (e) {
      // Table might already exist
    }
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO app_settings (key, value)
      VALUES ('default_workspace_path', ?)
    `);
    stmt.run(workspacePath);
  }

  async getSetting(key: string): Promise<any> {
    const db = this.getDb();
    // Ensure settings table exists
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);
    } catch (e) {
      // Table might already exist
    }
    
    const stmt = db.prepare(`
      SELECT value FROM app_settings WHERE key = ?
    `);
    const row = stmt.get(key) as any;
    if (!row) return null;
    
    try {
      return JSON.parse(row.value);
    } catch {
      return row.value;
    }
  }

  async setSetting(key: string, value: any): Promise<void> {
    const db = this.getDb();
    // Ensure settings table exists
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )
      `);
    } catch (e) {
      // Table might already exist
    }
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO app_settings (key, value)
      VALUES (?, ?)
    `);
    stmt.run(key, typeof value === 'string' ? value : JSON.stringify(value));
  }

  // Run management methods
  async saveRun(run: Run): Promise<void> {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO runs 
      (id, ado_pipeline_id, ado_run_id, ado_run_url, correlation_key, requested_scope, 
       test_file, test_tag, test_grep, repo_id, branch, status, created_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      run.id,
      run.adoPipelineId,
      run.adoRunId,
      run.adoRunUrl || null,
      run.correlationKey,
      run.requestedScope,
      run.testFile || null,
      run.testTag || null,
      run.testGrep || null,
      run.repoId || null,
      run.branch || null,
      run.status,
      run.createdAt,
      run.completedAt || null
    );
  }

  async getRun(runId: string): Promise<Run | null> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM runs WHERE id = ?
    `);
    const row = stmt.get(runId) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      adoPipelineId: row.ado_pipeline_id,
      adoRunId: row.ado_run_id,
      adoRunUrl: row.ado_run_url,
      correlationKey: row.correlation_key,
      requestedScope: row.requested_scope as 'all' | 'file' | 'tag' | 'grep',
      testFile: row.test_file,
      testTag: row.test_tag,
      testGrep: row.test_grep,
      repoId: row.repo_id,
      branch: row.branch,
      status: row.status as 'queued' | 'running' | 'completed' | 'failed' | 'cancelled',
      createdAt: row.created_at,
      completedAt: row.completed_at,
    };
  }

  async getRunByAdoRunId(adoRunId: string): Promise<Run | null> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM runs WHERE ado_run_id = ?
    `);
    const row = stmt.get(adoRunId) as any;
    if (!row) return null;
    
    return {
      id: row.id,
      adoPipelineId: row.ado_pipeline_id,
      adoRunId: row.ado_run_id,
      adoRunUrl: row.ado_run_url,
      correlationKey: row.correlation_key,
      requestedScope: row.requested_scope as 'all' | 'file' | 'tag' | 'grep',
      testFile: row.test_file,
      testTag: row.test_tag,
      testGrep: row.test_grep,
      repoId: row.repo_id,
      branch: row.branch,
      status: row.status as 'queued' | 'running' | 'completed' | 'failed' | 'cancelled',
      createdAt: row.created_at,
      completedAt: row.completed_at,
    };
  }

  async getActiveRuns(): Promise<Run[]> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM runs 
      WHERE status IN ('queued', 'running')
      ORDER BY created_at DESC
    `);
    const rows = stmt.all() as any[];
    return rows.map(row => ({
      id: row.id,
      adoPipelineId: row.ado_pipeline_id,
      adoRunId: row.ado_run_id,
      adoRunUrl: row.ado_run_url,
      correlationKey: row.correlation_key,
      requestedScope: row.requested_scope as 'all' | 'file' | 'tag' | 'grep',
      testFile: row.test_file,
      testTag: row.test_tag,
      testGrep: row.test_grep,
      repoId: row.repo_id,
      branch: row.branch,
      status: row.status as 'queued' | 'running' | 'completed' | 'failed' | 'cancelled',
      createdAt: row.created_at,
      completedAt: row.completed_at,
    }));
  }

  async getAllRuns(limit: number = 50): Promise<Run[]> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM runs 
      ORDER BY created_at DESC
      LIMIT ?
    `);
    const rows = stmt.all(limit) as any[];
    return rows.map(row => ({
      id: row.id,
      adoPipelineId: row.ado_pipeline_id,
      adoRunId: row.ado_run_id,
      adoRunUrl: row.ado_run_url,
      correlationKey: row.correlation_key,
      requestedScope: row.requested_scope as 'all' | 'file' | 'tag' | 'grep',
      testFile: row.test_file,
      testTag: row.test_tag,
      testGrep: row.test_grep,
      repoId: row.repo_id,
      branch: row.branch,
      status: row.status as 'queued' | 'running' | 'completed' | 'failed' | 'cancelled',
      createdAt: row.created_at,
      completedAt: row.completed_at,
    }));
  }

  async updateRunStatus(runId: string, status: Run['status'], completedAt?: string): Promise<void> {
    const db = this.getDb();
    const stmt = db.prepare(`
      UPDATE runs 
      SET status = ?, completed_at = ?
      WHERE id = ?
    `);
    stmt.run(status, completedAt || null, runId);
  }

  // Rerun link methods
  async saveRerunLink(link: RerunLink): Promise<void> {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO rerun_links 
      (id, original_run_id, rerun_run_id, error_signature, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(
      link.id,
      link.originalRunId,
      link.rerunRunId,
      link.errorSignature || null
    );
  }

  async getRerunHistory(originalRunId: string): Promise<RerunLink[]> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM rerun_links 
      WHERE original_run_id = ?
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(originalRunId) as any[];
    return rows.map(row => ({
      id: row.id,
      originalRunId: row.original_run_id,
      rerunRunId: row.rerun_run_id,
      errorSignature: row.error_signature,
      createdAt: row.created_at,
    }));
  }

  async getRerunsByErrorSignature(errorSignature: string): Promise<RerunLink[]> {
    const db = this.getDb();
    const stmt = db.prepare(`
      SELECT * FROM rerun_links 
      WHERE error_signature = ?
      ORDER BY created_at DESC
    `);
    const rows = stmt.all(errorSignature) as any[];
    return rows.map(row => ({
      id: row.id,
      originalRunId: row.original_run_id,
      rerunRunId: row.rerun_run_id,
      errorSignature: row.error_signature,
      createdAt: row.created_at,
    }));
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

