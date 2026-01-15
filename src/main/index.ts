import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { WorkspaceService } from './services/workspace';
import { loadAxisEnv } from './env';

// Initialize IPC handlers (StorageService is lazy)
try {
  // Load `.env` before anything else so services can read credentials from process.env.
  loadAxisEnv();
  require('./bridge');
  console.log('[Electron] Bridge loaded successfully');
} catch (error) {
  console.error('[Electron] Failed to load bridge:', error);
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the app - check if we're in development mode
  // In development, always try to load from Vite dev server first
  // Check multiple indicators for dev mode
  const isDev = 
    process.env.NODE_ENV === 'development' || 
    process.env.ELECTRON_IS_DEV === '1' ||
    !app.isPackaged;
  
  if (isDev) {
    // In development, load from Vite dev server
    const devUrl = 'http://localhost:5173';
    console.log('[Electron] Loading from dev server:', devUrl);
    
    // Wait a bit for Vite to be ready, then load
    setTimeout(() => {
      mainWindow?.loadURL(devUrl).catch((err) => {
        console.error('[Electron] Failed to load dev server:', err);
      });
    }, 1000);
    
    mainWindow.webContents.openDevTools();
    
    // Handle navigation errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error('[Electron] Failed to load:', {
        errorCode,
        errorDescription,
        url: validatedURL,
      });
      if (errorCode === -106) {
        console.error('[Electron] Failed to load dev server. Make sure Vite is running on port 5173');
      }
    });
    
    // Log when page loads successfully
    mainWindow.webContents.on('did-finish-load', () => {
      console.log('[Electron] Page loaded successfully');
    });
  } else {
    // In production, load from built files
    // NOTE: In packaged builds, __dirname is inside `dist/main/main`, so relative paths can be tricky.
    // Use app.getAppPath() (points to the asar root) and load the renderer from dist/renderer.
    const htmlPath = path.join(app.getAppPath(), 'dist', 'renderer', 'index.html');
    console.log('[Electron] Loading from file:', htmlPath);
    mainWindow.loadFile(htmlPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  console.log('[Electron] App ready, initializing workspace...');
  
  // Ensure workspace directory exists on startup
  try {
    const workspaceService = new WorkspaceService();
    workspaceService.ensureRootExists();
    console.log('[Electron] Workspace initialized:', workspaceService.getRoot());
  } catch (error) {
    console.error('[Electron] Failed to initialize workspace:', error);
  }

  console.log('[Electron] Creating window...');
  try {
    createWindow();
  } catch (error) {
    console.error('[Electron] Error creating window:', error);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch((error) => {
  console.error('[Electron] Error in app.whenReady():', error);
  process.exit(1);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Electron] Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Electron] Unhandled Rejection at:', promise, 'reason:', reason);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

