import Store from 'electron-store';

export interface Credentials {
  browserstackUsername?: string;
  browserstackAccessKey?: string;
  jiraBaseUrl?: string;
  jiraEmail?: string;
  jiraApiToken?: string;
  azureOrg?: string;
  azureProject?: string;
  azurePat?: string;
}

export class CredentialsService {
  private store: Store<Credentials>;

  constructor() {
    this.store = new Store<Credentials>({
      name: 'credentials',
      // Fixed encryption key for cross-platform credential portability
      // All installations share the same key to allow credential migration
      // Credentials are still encrypted at rest and isolated per user account
      encryptionKey: 'qa-hub-secure-credentials-key-v1',
      clearInvalidConfig: true,
    });
  }

  /**
   * Get all stored credentials
   */
  getCredentials(): Credentials {
    return {
      browserstackUsername: this.store.get('browserstackUsername'),
      browserstackAccessKey: this.store.get('browserstackAccessKey'),
      jiraBaseUrl: this.store.get('jiraBaseUrl'),
      jiraEmail: this.store.get('jiraEmail'),
      jiraApiToken: this.store.get('jiraApiToken'),
      azureOrg: this.store.get('azureOrg'),
      azureProject: this.store.get('azureProject'),
      azurePat: this.store.get('azurePat'),
    };
  }

  /**
   * Get credentials with fallback to .env for development
   * This allows developers to use .env while users use the UI
   */
  getCredentialsWithEnvFallback(): Credentials {
    const stored = this.getCredentials();
    
    return {
      browserstackUsername: stored.browserstackUsername || process.env.AXIS_BROWSERSTACK_USERNAME?.trim() || '',
      browserstackAccessKey: stored.browserstackAccessKey || process.env.AXIS_BROWSERSTACK_ACCESS_KEY?.trim() || '',
      jiraBaseUrl: stored.jiraBaseUrl || process.env.AXIS_JIRA_BASE_URL?.trim() || '',
      jiraEmail: stored.jiraEmail || process.env.AXIS_JIRA_EMAIL?.trim() || '',
      jiraApiToken: stored.jiraApiToken || process.env.AXIS_JIRA_API_TOKEN?.trim() || '',
      azureOrg: stored.azureOrg || process.env.AXIS_AZURE_ORG?.trim() || '',
      azureProject: stored.azureProject || process.env.AXIS_AZURE_PROJECT?.trim() || '',
      azurePat: stored.azurePat || process.env.AXIS_AZURE_PAT?.trim() || '',
    };
  }

  /**
   * Save credentials (partial update)
   */
  saveCredentials(credentials: Partial<Credentials>): void {
    Object.entries(credentials).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        this.store.set(key as keyof Credentials, value);
      }
    });
  }

  /**
   * Clear all credentials
   */
  clearCredentials(): void {
    this.store.clear();
  }

  /**
   * Check if credentials exist for a specific service
   */
  hasCredentials(service: 'browserstack' | 'jira' | 'azure'): boolean {
    const creds = this.getCredentialsWithEnvFallback();
    
    switch (service) {
      case 'browserstack':
        return !!(creds.browserstackUsername && creds.browserstackAccessKey);
      case 'jira':
        return !!(creds.jiraBaseUrl && creds.jiraEmail && creds.jiraApiToken);
      case 'azure':
        return !!(creds.azureOrg && creds.azureProject && creds.azurePat);
      default:
        return false;
    }
  }

  /**
   * Get masked credentials for display (security)
   */
  getMaskedCredentials(): Record<string, { value: string; masked: string; exists: boolean }> {
    const creds = this.getCredentialsWithEnvFallback();
    
    const maskValue = (value?: string): { value: string; masked: string; exists: boolean } => {
      if (!value || value.length === 0) {
        return { value: '', masked: '', exists: false };
      }
      const masked = value.length > 8 
        ? value.substring(0, 4) + '****' + value.substring(value.length - 4)
        : '********';
      return { value, masked, exists: true };
    };

    return {
      browserstackUsername: maskValue(creds.browserstackUsername),
      browserstackAccessKey: maskValue(creds.browserstackAccessKey),
      jiraBaseUrl: { value: creds.jiraBaseUrl || '', masked: creds.jiraBaseUrl || '', exists: !!creds.jiraBaseUrl },
      jiraEmail: maskValue(creds.jiraEmail),
      jiraApiToken: maskValue(creds.jiraApiToken),
      azureOrg: { value: creds.azureOrg || '', masked: creds.azureOrg || '', exists: !!creds.azureOrg },
      azureProject: { value: creds.azureProject || '', masked: creds.azureProject || '', exists: !!creds.azureProject },
      azurePat: maskValue(creds.azurePat),
    };
  }
}
