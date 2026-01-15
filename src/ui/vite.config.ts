import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  root: __dirname, // Set root to src/ui directory (where vite.config.ts is located)
  // Load env files from the repo root so we can use a single `.env` for main + renderer builds.
  // (Renderer still only exposes variables prefixed with VITE_ by default.)
  envDir: path.resolve(__dirname, '../..'),
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
});

