import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
  root: path.resolve(__dirname, './src/ui'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/ui/src'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
});

