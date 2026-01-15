# Troubleshooting Common Errors

## Update Feed Unreachable

### Symptom

When checking for updates in Settings → Updates, you see an error message like:
- "Failed to check for updates"
- "Update feed unreachable"
- Network error

### Cause

The update feed URL is currently a placeholder (`https://example.com/qa-hub-updates`). This is expected in Phase 1 of the updater implementation.

### Solution

This is **not an error** - it's expected behavior. The updater infrastructure is ready, but the feed URL will be updated once Azure Blob hosting is configured (Phase 2).

**Action:** No action required. The application will continue to work normally. Updates will be available once hosting is configured.

### Future (Phase 2)

Once Azure Blob hosting is configured, the feed URL will be updated in `electron-builder.json`, and updates will work automatically.

## BrowserStack Authentication Failures

### Symptom

- "Connection test failed" in Settings
- "Unauthorized" errors when fetching data
- Empty project/build lists

### Cause

- Incorrect credentials (username/access key)
- Expired access key
- Invalid API permissions

### Solution

1. **Verify credentials** in Settings → BrowserStack Automate (or BrowserStack TM)
2. **Check access key** - Ensure it hasn't expired
3. **Test connection** - Use the "Test Connection" button in Settings
4. **Check API permissions** - Ensure the access key has required permissions:
   - **Automate**: Read access to projects, builds, sessions
   - **TM**: Read access to projects, runs, test cases

### Common Issues

- **Credentials**: QA Hub reads credentials from your local `.env` file. Verify the required `AXIS_*` keys are set correctly.
- **API limits**: BrowserStack has rate limits. If you hit limits, wait a few minutes and try again.

## Jira Create Failures

### Symptom

- "Failed to create Jira issue" error
- Issue creation button is disabled
- Connection test fails

### Cause

- Jira credentials not configured
- Invalid project key
- Missing required fields
- Permission issues
- Network connectivity problems

### Solution

1. **Verify Jira configuration** in Settings → Jira:
   - Base URL (e.g., `https://your-company.atlassian.net`)
   - Email address
   - API token (not password - generate at: https://id.atlassian.com/manage-profile/security/api-tokens)

2. **Test connection** - Use the "Test Connection" button

3. **Check project key** - Ensure the project key exists and you have access

4. **Verify permissions** - Ensure your Jira account has permission to create issues in the target project

5. **Check required fields** - Some Jira projects require additional fields. Check project configuration.

### Common Issues

- **API token vs password**: Jira requires an API token, not your account password
- **Project key format**: Project keys are typically uppercase (e.g., `PROJ`, not `proj`)
- **Base URL format**: Should be `https://your-company.atlassian.net` (no trailing slash)

## Azure DevOps Connection Issues

### Symptom

- "Connection test failed" in Settings
- Empty repository list
- Git operations fail

### Cause

- Invalid Personal Access Token (PAT)
- PAT doesn't have required permissions
- Incorrect organization/project name
- Network connectivity issues

### Solution

1. **Verify Azure DevOps configuration** in Settings → Azure DevOps:
   - Organization name (e.g., `fourhands`)
   - Project name (e.g., `QA Automation`)
   - Personal Access Token (PAT)

2. **Check PAT permissions** - PAT must have:
   - **Code (read & write)** - For repository operations
   - **Build (read)** - For pipeline operations (if using pipelines)

3. **Generate new PAT** if needed:
   - Go to: `https://dev.azure.com/{organization}/_usersSettings/tokens`
   - Create new token with required permissions
   - Copy token immediately (it won't be shown again)

4. **Test connection** - Use the "Test Connection" button

5. **Verify organization/project names** - These are case-sensitive and must match exactly

### Common Issues

- **PAT expiration**: PATs can expire. Generate a new one if connection fails
- **Organization name**: Should match the URL (e.g., `fourhands` from `fourhands.visualstudio.com`)
- **Project name**: Must match exactly (e.g., `QA Automation` not `qa-automation`)

## Repository Operations Failures

### Symptom

- Git operations fail (clone, pull, push)
- "Repository not found" errors
- Authentication errors

### Cause

- PAT not configured
- Repository doesn't exist
- Permission issues
- Git not installed

### Solution

1. **Check Azure DevOps configuration** - Ensure PAT is configured (see Azure DevOps Connection Issues above)

2. **Verify repository exists** - Check that the repository exists in Azure DevOps

3. **Check Git installation** - Ensure Git is installed and available in system PATH:
   ```bash
   git --version
   ```

4. **Check workspace path** - Ensure the default workspace directory is accessible and writable

5. **Check repository URL** - Verify the repository URL format is correct

### Common Issues

- **Git not in PATH**: Git must be installed and accessible from command line
- **Workspace permissions**: Ensure you have write permissions to the workspace directory
- **Repository URL format**: Should be Azure DevOps URL format

## General Troubleshooting Tips

### Check Logs

QA Hub logs important events to the console. To view logs:

1. **Development mode**: Check the terminal/console where you ran `npm run dev`
2. **Production mode**: Check the application logs (location depends on OS)

### Reset Configuration

If configuration seems corrupted:

1. Close QA Hub
2. Clear settings (location depends on OS):
   - **Windows**: `%APPDATA%\axis\`
   - **macOS**: `~/Library/Application Support/axis/`
   - **Linux**: `~/.config/axis/`
3. Restart QA Hub and reconfigure

### Network Issues

If you're experiencing network-related errors:

1. **Check internet connection**
2. **Verify firewall settings** - Ensure QA Hub can make outbound connections
3. **Check proxy settings** - If behind a corporate proxy, you may need to configure it
4. **Verify API endpoints are accessible** - BrowserStack, Jira, Azure DevOps APIs should be accessible

### Still Having Issues?

1. Check the [Architecture Overview](./architecture/overview.md) to understand how QA Hub works
2. Review the [IPC Contract](./architecture/ipc.md) to understand communication flow
3. Check existing documentation for your specific use case
4. Contact your team's QA Hub administrator

