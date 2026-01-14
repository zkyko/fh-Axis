import axios, { AxiosInstance } from 'axios';

export interface AzureRepo {
  id: string;
  name: string;
  url: string;
  defaultBranch: string;
  project: {
    id: string;
    name: string;
  };
}

export interface AzureCommit {
  commitId: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  comment: string;
  url: string;
}

export interface AzureBranch {
  name: string;
  objectId: string;
  aheadCount: number;
  behindCount: number;
}

export interface AzureRepoInfo {
  organization: string;
  project: string;
  repoId?: string;
  repoName?: string;
}

/**
 * Parse Azure DevOps repo URL to extract organization, project, and repo info
 * Supports formats like:
 * - https://dev.azure.com/{org}/{project}/_git/{repo}
 * - https://{org}@dev.azure.com/{org}/{project}/_git/{repo}
 */
export function parseAzureRepoUrl(url: string): AzureRepoInfo | null {
  try {
    const urlObj = new URL(url);
    
    // Handle both dev.azure.com and visualstudio.com domains
    // dev.azure.com format: https://dev.azure.com/{org}/{project}/_git/{repo}
    // visualstudio.com format: https://{org}.visualstudio.com/{project}/_git/{repo}
    
    let organization: string;
    let project: string;
    let repoName: string;
    
    if (urlObj.hostname.includes('visualstudio.com')) {
      // Format: https://{org}.visualstudio.com/{project}/_git/{repo}
      organization = urlObj.hostname.split('.')[0];
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      const gitIndex = pathParts.indexOf('_git');
      
      if (gitIndex === -1) {
        return null;
      }
      
      // Project is everything before _git (may be URL encoded)
      project = decodeURIComponent(pathParts.slice(0, gitIndex).join('/'));
      repoName = pathParts[gitIndex + 1];
    } else {
      // Format: https://dev.azure.com/{org}/{project}/_git/{repo}
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      const gitIndex = pathParts.indexOf('_git');
      
      if (gitIndex === -1 || gitIndex < 2) {
        return null;
      }
      
      organization = pathParts[0];
      // Project may be URL encoded
      project = decodeURIComponent(pathParts[1]);
      repoName = pathParts[gitIndex + 1];
    }
    
    if (!organization || !project || !repoName) {
      return null;
    }
    
    return {
      organization,
      project,
      repoName,
    };
  } catch (error) {
    console.error('Failed to parse Azure repo URL:', error);
    return null;
  }
}

export class AzureDevOpsService {
  private client: AxiosInstance;
  private organization: string;
  private project: string;
  private pat: string;

  constructor(organization: string, project: string, personalAccessToken: string) {
    this.organization = organization;
    this.project = project;
    this.pat = personalAccessToken;
    
    // Handle both dev.azure.com and visualstudio.com formats
    // For visualstudio.com, we still use dev.azure.com API endpoint
    const encodedProject = encodeURIComponent(project);
    this.client = axios.create({
      baseURL: `https://dev.azure.com/${organization}/${encodedProject}/_apis`,
      auth: {
        username: '',
        password: personalAccessToken,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/git/repositories?api-version=7.1');
      return response.status === 200;
    } catch (error) {
      console.error('Azure DevOps connection test failed:', error);
      return false;
    }
  }

  async getRepositories(): Promise<AzureRepo[]> {
    try {
      const response = await this.client.get('/git/repositories?api-version=7.1');
      return response.data.value.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        url: repo.url,
        defaultBranch: repo.defaultBranch?.replace('refs/heads/', '') || 'main',
        project: {
          id: repo.project.id,
          name: repo.project.name,
        },
      }));
    } catch (error) {
      console.error('Failed to fetch Azure repos:', error);
      throw error;
    }
  }

  async getRepositoryByName(repoName: string): Promise<AzureRepo | null> {
    try {
      const repos = await this.getRepositories();
      return repos.find(r => r.name === repoName) || null;
    } catch (error) {
      console.error('Failed to fetch repository by name:', error);
      return null;
    }
  }

  async getCommits(repoId: string, branch: string, limit: number = 10): Promise<AzureCommit[]> {
    try {
      const response = await this.client.get(
        `/git/repositories/${repoId}/commits?branch=${branch}&top=${limit}&api-version=7.1`
      );
      return response.data.value.map((commit: any) => ({
        commitId: commit.commitId,
        author: {
          name: commit.author.name,
          email: commit.author.email,
          date: commit.author.date,
        },
        comment: commit.comment,
        url: this.getCommitUrl(repoId, commit.commitId),
      }));
    } catch (error) {
      console.error('Failed to fetch commits:', error);
      throw error;
    }
  }

  async getBranchInfo(repoId: string, branch: string): Promise<AzureBranch | null> {
    try {
      const response = await this.client.get(
        `/git/repositories/${repoId}/refs?filter=heads/${branch}&api-version=7.1`
      );
      if (response.data.value.length === 0) return null;
      
      const ref = response.data.value[0];
      return {
        name: branch,
        objectId: ref.objectId,
        aheadCount: 0, // Would need additional API call to compare branches
        behindCount: 0,
      };
    } catch (error) {
      console.error('Failed to fetch branch info:', error);
      return null;
    }
  }

  async getCommitByHash(repoId: string, commitHash: string): Promise<AzureCommit | null> {
    try {
      const response = await this.client.get(
        `/git/repositories/${repoId}/commits/${commitHash}?api-version=7.1`
      );
      return {
        commitId: response.data.commitId,
        author: {
          name: response.data.author.name,
          email: response.data.author.email,
          date: response.data.author.date,
        },
        comment: response.data.comment,
        url: this.getCommitUrl(repoId, commitHash),
      };
    } catch (error) {
      console.error('Failed to fetch commit:', error);
      return null;
    }
  }

  getCommitUrl(repoId: string, commitHash: string): string {
    return `https://dev.azure.com/${this.organization}/${this.project}/_git/${repoId}/commit/${commitHash}`;
  }

  getBranchUrl(repoId: string, branch: string): string {
    return `https://dev.azure.com/${this.organization}/${this.project}/_git/${repoId}?version=GB${branch}`;
  }

  getRepoUrl(repoId: string): string {
    return `https://dev.azure.com/${this.organization}/${this.project}/_git/${repoId}`;
  }
}

