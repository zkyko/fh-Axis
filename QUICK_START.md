# Quick Start Guide

## Installation

```bash
npm install
```

## Development

Run the app in development mode:

```bash
npm run dev
```

This will:
1. Start the Vite dev server for the React renderer (http://localhost:5173)
2. Compile the Electron main process in watch mode
3. Launch the Electron app

## Project Structure

```
V2-Studio/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Main entry point with IPC handlers
│   │   └── preload.ts  # Preload script (exposes API to renderer)
│   ├── renderer/       # React UI
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   └── main.tsx    # React entry point
│   └── shared/         # Shared types between main and renderer
├── docs/               # Documentation
└── package.json
```

## UI Screens

All screens are implemented with Material UI:

- **Runs Page** (`/runs`) - List of test runs with filters
- **Run Detail** (`/runs/:runId`) - Detailed view of a test run
- **Failure Detail** (`/failures/:resultId`) - Most important screen with 3-panel layout
- **Cases** (`/cases`) - Test cases list
- **Repo** (`/repo`) - Repository management (QA-only)
- **Admin** (`/admin`) - Integration and role management

## Current Status

✅ Electron app scaffold
✅ Material UI theme and styling
✅ All main UI screens implemented
✅ IPC framework with stubbed handlers
✅ React Router setup
✅ TypeScript configuration

## Next Steps

1. Connect real IPC handlers to BrowserStack/Jira APIs
2. Implement data fetching and state management
3. Add error boundaries and loading states
4. Implement authentication and role-based access

