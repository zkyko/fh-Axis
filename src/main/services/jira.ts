import axios, { AxiosInstance } from 'axios';

export interface JiraIssue {
  key: string;
  summary: string;
  status: string;
  assignee?: string;
  priority?: string;
  url: string;
  description?: string;
  comments?: any[];
}

export interface CreateIssueData {
  projectKey: string;
  issueType: string;
  summary: string;
  description: string; // Plain text string
  labels?: string[];
  priority?: string;
  assignee?: string;
  component?: string;
}

export class JiraService {
  private client: AxiosInstance;
  private baseUrl: string;
  private email: string;
  private apiToken: string;

  constructor(baseUrl: string, email: string, apiToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.email = email;
    this.apiToken = apiToken;
    this.client = axios.create({
      baseURL: `${this.baseUrl}/rest/api/3`,
      auth: {
        username: email,
        password: apiToken,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/myself');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Convert plain text description to Jira ADF format
   * Handles headings (##), links (URLs), and paragraphs
   */
  private convertPlainTextToADF(plainText: string): any {
    const lines = plainText.split('\n');
    const content: any[] = [];
    let currentParagraph: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Empty line - flush current paragraph
      if (!trimmed) {
        if (currentParagraph.length > 0) {
          content.push(this.createParagraph(currentParagraph.join(' ')));
          currentParagraph = [];
        }
        continue;
      }

      // Heading (##)
      if (trimmed.startsWith('##')) {
        // Flush current paragraph first
        if (currentParagraph.length > 0) {
          content.push(this.createParagraph(currentParagraph.join(' ')));
          currentParagraph = [];
        }
        // Add heading
        const headingText = trimmed.replace(/^##+\s*/, '');
        content.push({
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: headingText }],
        });
        continue;
      }

      // Regular line - add to current paragraph
      currentParagraph.push(trimmed);
    }

    // Flush remaining paragraph
    if (currentParagraph.length > 0) {
      content.push(this.createParagraph(currentParagraph.join(' ')));
    }

    // If no content, add empty paragraph
    if (content.length === 0) {
      content.push({ type: 'paragraph', content: [] });
    }

    return {
      type: 'doc',
      version: 1,
      content,
    };
  }

  /**
   * Create a paragraph node with text and links
   */
  private createParagraph(text: string): any {
    // Detect URLs and convert to links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts: any[] = [];
    let lastIndex = 0;
    let match;

    while ((match = urlRegex.exec(text)) !== null) {
      // Add text before URL
      if (match.index > lastIndex) {
        const textBefore = text.substring(lastIndex, match.index);
        if (textBefore) {
          parts.push({ type: 'text', text: textBefore });
        }
      }

      // Add link
      const url = match[0];
      parts.push({
        type: 'text',
        text: url,
        marks: [{ type: 'link', attrs: { href: url } }],
      });

      lastIndex = match.index + url.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      const textAfter = text.substring(lastIndex);
      if (textAfter) {
        parts.push({ type: 'text', text: textAfter });
      }
    }

    // If no parts, create empty paragraph
    if (parts.length === 0) {
      parts.push({ type: 'text', text: text });
    }

    return {
      type: 'paragraph',
      content: parts,
    };
  }

  async createIssue(data: CreateIssueData): Promise<JiraIssue | null> {
    try {
      // Convert plain text description to ADF
      const descriptionADF = this.convertPlainTextToADF(data.description);

      const fields: any = {
        project: { key: data.projectKey },
        issuetype: { name: data.issueType },
        summary: data.summary,
        description: descriptionADF,
      };

      // Add optional fields
      if (data.priority) {
        fields.priority = { name: data.priority };
      }

      if (data.assignee) {
        fields.assignee = { accountId: data.assignee };
      }

      if (data.labels && data.labels.length > 0) {
        fields.labels = data.labels;
      }

      if (data.component) {
        fields.components = [{ name: data.component }];
      }

      const payload = { fields };

      const response = await this.client.post('/issue', payload);
      const issue = response.data;
      
      return {
        key: issue.key,
        summary: data.summary,
        status: 'To Do',
        url: `${this.baseUrl}/browse/${issue.key}`,
      };
    } catch (error) {
      console.error('Failed to create Jira issue:', error);
      return null;
    }
  }

  async getIssue(issueKey: string): Promise<JiraIssue | null> {
    try {
      const response = await this.client.get(`/issue/${issueKey}`);
      const issue = response.data;
      
      return {
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName,
        priority: issue.fields.priority?.name,
        url: `${this.baseUrl}/browse/${issue.key}`,
        description: issue.fields.description,
      };
    } catch (error) {
      console.error('Failed to fetch Jira issue:', error);
      return null;
    }
  }

  async searchIssues(jql: string): Promise<JiraIssue[]> {
    try {
      const response = await this.client.get('/search', {
        params: { jql, maxResults: 100 },
      });
      
      return response.data.issues.map((issue: any) => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        assignee: issue.fields.assignee?.displayName,
        priority: issue.fields.priority?.name,
        url: `${this.baseUrl}/browse/${issue.key}`,
      }));
    } catch (error) {
      console.error('Failed to search Jira issues:', error);
      return [];
    }
  }

  async linkTestResult(issueKey: string, testResultId: string): Promise<void> {
    try {
      // Add a comment to the issue with the test result link
      await this.client.post(`/issue/${issueKey}/comment`, {
        body: {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: `Linked to test result: ${testResultId}`,
                },
              ],
            },
          ],
        },
      });
    } catch (error) {
      console.error('Failed to link test result to Jira issue:', error);
      throw error;
    }
  }
}

