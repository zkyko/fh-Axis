import { autoUpdater } from 'electron-updater';
import { EventEmitter } from 'events';

export interface UpdaterEvent {
  type: 'checking-for-update' | 'update-available' | 'update-not-available' | 'download-progress' | 'update-downloaded' | 'error';
  data?: any;
}

export class UpdaterService extends EventEmitter {
  private isChecking = false;
  private isDownloading = false;

  constructor() {
    super();
    this.setupAutoUpdater();
  }

  private setupAutoUpdater(): void {
    // Configure autoUpdater
    autoUpdater.autoDownload = false; // User-triggered only
    autoUpdater.autoInstallOnAppQuit = false; // Manual install

    // Set up event listeners
    autoUpdater.on('checking-for-update', () => {
      console.log('[Updater] Checking for update...');
      this.isChecking = true;
      this.emit('event', { type: 'checking-for-update' });
    });

    autoUpdater.on('update-available', (info) => {
      console.log('[Updater] Update available:', info.version);
      this.isChecking = false;
      this.emit('event', { type: 'update-available', data: info });
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('[Updater] Update not available. Current version is latest.');
      this.isChecking = false;
      this.emit('event', { type: 'update-not-available', data: info });
    });

    autoUpdater.on('error', (error) => {
      console.error('[Updater] Error:', error);
      this.isChecking = false;
      this.isDownloading = false;
      this.emit('event', { 
        type: 'error', 
        data: { 
          message: error.message || 'Unknown error',
          stack: error.stack 
        } 
      });
    });

    autoUpdater.on('download-progress', (progress) => {
      console.log('[Updater] Download progress:', Math.round(progress.percent), '%');
      this.emit('event', { type: 'download-progress', data: progress });
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('[Updater] Update downloaded:', info.version);
      this.isDownloading = false;
      this.emit('event', { type: 'update-downloaded', data: info });
    });
  }

  async checkForUpdates(): Promise<void> {
    if (this.isChecking) {
      console.log('[Updater] Already checking for updates');
      return;
    }

    try {
      console.log('[Updater] Checking for updates...');
      await autoUpdater.checkForUpdates();
    } catch (error: any) {
      console.error('[Updater] Failed to check for updates:', error);
      this.emit('event', { 
        type: 'error', 
        data: { 
          message: error.message || 'Failed to check for updates',
          stack: error.stack 
        } 
      });
    }
  }

  async downloadUpdate(): Promise<void> {
    if (this.isDownloading) {
      console.log('[Updater] Already downloading update');
      return;
    }

    try {
      console.log('[Updater] Downloading update...');
      this.isDownloading = true;
      await autoUpdater.downloadUpdate();
    } catch (error: any) {
      console.error('[Updater] Failed to download update:', error);
      this.isDownloading = false;
      this.emit('event', { 
        type: 'error', 
        data: { 
          message: error.message || 'Failed to download update',
          stack: error.stack 
        } 
      });
    }
  }

  installUpdate(): void {
    console.log('[Updater] Quitting and installing update...');
    autoUpdater.quitAndInstall(false, true);
  }
}
