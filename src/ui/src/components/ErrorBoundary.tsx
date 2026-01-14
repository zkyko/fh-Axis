import React, { Component, ErrorInfo, ReactNode } from 'react';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-base-100 p-6">
          <div className="glass-card p-8 max-w-md w-full text-center">
            <div className="mb-4 flex justify-center">
              <AlertTriangle size={48} className="text-error" />
            </div>
            <h2 className="text-2xl font-bold text-base-content mb-2">
              Something went wrong
            </h2>
            <p className="text-base-content/70 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button variant="primary" onClick={this.handleReload}>
              Reload Application
            </Button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-base-content/60">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs bg-base-300 p-2 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

