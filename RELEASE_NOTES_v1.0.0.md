# Axis v1.0.0 Release Notes

## 🎉 First Release

Axis is a desktop Electron application that provides unified test execution, failure analysis, and defect tracking. This is the initial v1.0.0 release.

## ✨ Key Features

### Core Integrations
- **BrowserStack Automate Integration** - View builds, sessions, and evidence (videos, logs, HAR files)
- **BrowserStack Test Management** - View test cases, runs, and results
- **Jira Integration** - Create and link defects with structured, evidence-driven bug creation
- **Azure DevOps Integration** - Repository management, commit tracking, and code correlation

### Workflow & Analysis
- **Correlation Engine** - Link test results to sessions, Jira issues, and Azure commits
- **Failure Analysis** - View test failures with evidence from BrowserStack sessions
- **Structured Bug Creation** - Auto-generate Jira bug drafts with test metadata, evidence links, and environment details

### Repository Management (QA Engineers)
- **Default Workspace** - Centralized directory for all cloned repositories (`~/Documents/Axis-Workspace`)
- **Auto-Detection** - Automatically detects cloned repositories on app startup
- **Full Git Workflow** - Complete Git operations without command line:
  - Clone repositories (with Azure PAT authentication)
  - Pull/Push operations
  - File staging/unstaging
  - Commit with message validation (min 10 chars)
  - Branch management (create, switch, view)
  - Commit history viewer
- **VS Code Integration** - Open repositories in VS Code with one click
- **Sync Status Indicators** - Shows which repos need updates (ahead/behind indicators)

### User Interface
- Modern, responsive UI built with React and TailwindCSS
- Dark/Light theme support
- Dashboard with metrics and recent activity
- Comprehensive navigation and routing

## 🔧 System Requirements

- **Operating System**: Windows, macOS, or Linux
- **Git**: Must be installed and available in system PATH (for repository operations)
- **Internet Connection**: Required for API integrations

## 📦 Installation

1. Download `Axis Setup 1.0.0.exe` from the release assets
2. Run the installer
3. Follow the installation wizard
4. Launch Axis from the Start Menu or Desktop shortcut

## ⚙️ First-Time Setup

1. **Configure Integrations** in Settings:
   - **Azure DevOps**: Organization, Project, and Personal Access Token (PAT)
   - **BrowserStack Automate**: Username and Access Key
   - **BrowserStack Test Management**: Username and Access Key
   - **Jira**: Base URL, Email, and API Token

2. **Default Workspace**: The app will automatically create `~/Documents/Axis-Workspace` (or `Documents\Axis-Workspace` on Windows) for cloned repositories

3. **Clone Repositories**: Use the Repo Companion screen to clone repositories from Azure DevOps

## 📚 Documentation

- **Testing Guide**: See `docs/TESTING.md` for comprehensive testing instructions
- **Architecture**: See `docs/ARCHITECTURE.md` for system design
- **Integration Details**: See `docs/INTEGRATIONS.md` for API integration specifics

## 🐛 Known Limitations

- Stack trace parsing is intentionally out of scope for v1.0.0
- Jira descriptions include links to evidence, not parsed error output
- Some advanced features may be limited based on API availability

## 🙏 Feedback

For issues, questions, or feedback, please use the repository's issue tracker.

---

**Version**: 1.0.0  
**Release Date**: January 2025

