/**
 * Backend getter for IPC module
 * Allows injection of backend (for web demo) or use of window.electronAPI (for Electron)
 */

import type { ElectronAPI } from '../types/electron.d';

let backendGetter: (() => ElectronAPI | undefined) | null = null;

/**
 * Set a custom backend getter function
 * Used by web demo to inject mock backend
 */
export function setBackendGetter(getter: () => ElectronAPI | undefined): void {
  backendGetter = getter;
}

/**
 * Get the current backend (ElectronAPI)
 * Falls back to window.electronAPI if no custom getter is set
 */
export function getBackend(): ElectronAPI | undefined {
  if (backendGetter) {
    return backendGetter();
  }
  return typeof window !== 'undefined' ? window.electronAPI : undefined;
}

