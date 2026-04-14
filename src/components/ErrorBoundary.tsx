import React, { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Error caught by boundary:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-bold">Application Error</div>
              <div className="text-sm mt-2">
                {this.state.error?.message || 'An error occurred'}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reload Page
              </button>
            </AlertDescription>
          </Alert>
          {this.props.fallback && <>{this.props.fallback}</>}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
