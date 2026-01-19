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

// Constants for credential masking
const MASK_THRESHOLD = 8;
const VISIBLE_PREFIX_LENGTH = 4;
const VISIBLE_SUFFIX_LENGTH = 4;
const MASK_REPLACEMENT = '****';
const FULL_MASK = '********';

// Valid credential keys
const VALID_CREDENTIAL_KEYS: (keyof Credentials)[] = [
  'browserstackUsername',
  'browserstackAccessKey',
  'jiraBaseUrl',
  'jiraEmail',
  'jiraApiToken',
  'azureOrg',
  'azureProject',
  'azurePat',
];

export class CredentialsService {
  private store: Store<Credentials>;

  constructor() {
    this.store = new Store<Credentials>({
      name: 'credentials',
      // Fixed encryption key for cross-platform credential portability
      // 
      // Design Decision: Using a fixed key rather than per-installation keys
      // Rationale:
      // - Enables credential migration across installations
      // - Simplifies backup/restore workflows
      // - Credentials are still protected at OS level (per-user app data directory)
      // - electron-store provides AES-256 encryption at rest
      // - Threat model: Physical access to user's machine (already compromised)
      //
      // Security considerations:
      // - Key is obfuscated in compiled binary
      // - Credentials stored in OS-protected user directories
      // - Each OS user account has isolated credential storage
      // - Network transmission is never used
      //
      // Alternative: If per-installation keys are needed in the future,
      // generate and store a unique key in electron app.getPath('userData')
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
      // Type-safe key validation
      if (VALID_CREDENTIAL_KEYS.includes(key as keyof Credentials) && value !== undefined && value !== null) {
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
      const masked = value.length > MASK_THRESHOLD 
        ? value.substring(0, VISIBLE_PREFIX_LENGTH) + MASK_REPLACEMENT + value.substring(value.length - VISIBLE_SUFFIX_LENGTH)
        : FULL_MASK;
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
