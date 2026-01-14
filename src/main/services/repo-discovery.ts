/**
 * RepoDiscoveryService
 * 
 * Scans filesystem for Git repositories without SQLite dependency.
 */

import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface LocalRepo {
  name: string;
  path: string;
}

export interface LocalRepoWithStatus extends LocalRepo {
  status: {
    ahead: number;
    behind: number;
    needsUpdate: boolean;
    hasUnpushedCommits: boolean;
  };
}

export class RepoDiscoveryService {
  /**
   * Scan workspace directory for Git repositories
   * Only checks immediate child directories (not recursive)
   * 
   * @param workspaceRoot - Root directory to scan
   * @returns Array of detected repositories
   */
  async scanRepos(workspaceRoot: string): Promise<LocalRepo[]> {
    const repos: LocalRepo[] = [];

    if (!fs.existsSync(workspaceRoot)) {
      return repos;
    }

    try {
      const entries = fs.readdirSync(workspaceRoot, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const repoPath = path.join(workspaceRoot, entry.name);
          const gitPath = path.join(repoPath, '.git');
          
          if (fs.existsSync(gitPath)) {
            repos.push({
              name: entry.name,
              path: repoPath,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to scan repos:', error);
    }

    return repos;
  }

  /**
   * Scan repositories and include git status (ahead/behind)
   * 
   * @param workspaceRoot - Root directory to scan
   * @returns Array of repositories with status information
   */
  async scanReposWithStatus(workspaceRoot: string): Promise<LocalRepoWithStatus[]> {
    const repos = await this.scanRepos(workspaceRoot);
    const reposWithStatus: LocalRepoWithStatus[] = [];

    for (const repo of repos) {
      try {
        const status = await execAsync('git status --porcelain --branch', { 
          cwd: repo.path,
          maxBuffer: 10 * 1024 * 1024,
        });

        const lines = status.stdout.trim().split('\n').filter(l => l.trim());
        const branchLine = lines.find((l) => l.startsWith('##'));
        let ahead = 0;
        let behind = 0;

        if (branchLine) {
          const aheadBehind = branchLine.match(/\[ahead (\d+)(?:, behind (\d+))?\]/);
          if (aheadBehind) {
            ahead = parseInt(aheadBehind[1]) || 0;
            behind = parseInt(aheadBehind[2]) || 0;
          }
        }

        reposWithStatus.push({
          name: repo.name,
          path: repo.path,
          status: {
            ahead,
            behind,
            needsUpdate: behind > 0,
            hasUnpushedCommits: ahead > 0,
          },
        });
      } catch (e) {
        // Git status failed, but repo exists
        reposWithStatus.push({
          name: repo.name,
          path: repo.path,
          status: {
            ahead: 0,
            behind: 0,
            needsUpdate: false,
            hasUnpushedCommits: false,
          },
        });
      }
    }

    return reposWithStatus;
  }

  /**
   * Find a repository by name in the workspace
   * 
   * @param workspaceRoot - Root directory to search
   * @param repoName - Name of the repository to find
   * @returns Repository path if found, null otherwise
   */
  async findRepoByName(workspaceRoot: string, repoName: string): Promise<string | null> {
    const repoPath = path.join(workspaceRoot, repoName);
    
    if (fs.existsSync(repoPath) && fs.existsSync(path.join(repoPath, '.git'))) {
      return repoPath;
    }

    return null;
  }
}

