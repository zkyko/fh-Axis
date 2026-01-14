/**
 * WorkspaceService
 * 
 * Manages the deterministic workspace directory without SQLite dependency.
 * Workspace is always: <Documents>/Axis-Workspace
 */

import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs-extra';

export class WorkspaceService {
  /**
   * Get the workspace root directory path
   * Always returns: <Documents>/Axis-Workspace
   */
  getRoot(): string {
    const documentsPath = app.getPath('documents');
    return path.join(documentsPath, 'Axis-Workspace');
  }

  /**
   * Ensure the workspace root directory exists
   * Creates it if missing, then returns the path
   */
  ensureRootExists(): string {
    const root = this.getRoot();
    fs.ensureDirSync(root);
    return root;
  }
}

