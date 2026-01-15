/**
 * WorkspaceService
 * 
 * Manages the deterministic workspace directory without SQLite dependency.
 * Workspace is always: <Documents>/QA-Hub-Workspace
 *
 * Backward compatibility:
 * - If a legacy Axis workspace exists, continue using it so existing users keep their data.
 */

import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs-extra';

export class WorkspaceService {
  /**
   * Get the workspace root directory path
   * Returns: <Documents>/QA-Hub-Workspace (or legacy Axis workspace if it already exists)
   */
  getRoot(): string {
    const documentsPath = app.getPath('documents');
    const newRoot = path.join(documentsPath, 'QA-Hub-Workspace');
    const legacyRoot = path.join(documentsPath, 'Axis-Workspace');

    // Prefer legacy if it exists and the new one doesn't yet.
    if (fs.existsSync(legacyRoot) && !fs.existsSync(newRoot)) {
      return legacyRoot;
    }
    return newRoot;
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

