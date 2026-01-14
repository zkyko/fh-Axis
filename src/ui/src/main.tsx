import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

console.log('[Renderer] Starting app...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[Renderer] Root element not found!');
} else {
  console.log('[Renderer] Root element found, rendering app...');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log('[Renderer] App rendered');
}

