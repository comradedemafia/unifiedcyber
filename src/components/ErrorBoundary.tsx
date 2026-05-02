import React from "react";
import { toast } from "sonner";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

/**
 * Catches render errors in the React tree and shows a friendly fallback
 * instead of a blank screen. Also logs full details to console + toast.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: "" };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const componentStack = info.componentStack || "";
    // Detailed console output to aid debugging (CSP/network/runtime).
    console.group("%c[ErrorBoundary] Render error caught", "color:#ff5555;font-weight:bold");
    console.error("Error:", error);
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("Component stack:", componentStack);
    console.groupEnd();

    // User-visible notification with hint about likely causes.
    toast.error("Application error", {
      description: error.message?.slice(0, 200) || "An unexpected error occurred.",
      duration: 8000,
    });

    this.setState({ errorInfo: componentStack });
  }

  handleReload = () => window.location.reload();

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      const isCsp = /Content Security Policy|CSP|blocked by/i.test(err?.message || "");
      const isWs = /WebSocket|wss:/i.test(err?.message || "");
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-2xl w-full border border-destructive/40 rounded-lg p-6 bg-card">
            <h1 className="text-xl font-semibold text-destructive mb-2">
              Something broke while rendering
            </h1>
            <p className="text-sm text-muted-foreground mb-4">
              {isCsp && "A Content Security Policy rule is blocking a resource. "}
              {isWs && "A WebSocket connection failed (often CSP / network). "}
              The app caught the error so you don't see a blank screen.
            </p>
            <pre className="text-xs bg-muted/40 p-3 rounded overflow-auto max-h-60 whitespace-pre-wrap break-words">
              <strong>{err?.name}: </strong>{err?.message}
              {"\n\n"}
              {err?.stack}
              {this.state.errorInfo && `\n\nComponent stack:${this.state.errorInfo}`}
            </pre>
            <div className="mt-4 flex gap-2">
              <button
                onClick={this.handleReload}
                className="px-3 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90"
              >
                Reload
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: "" })}
                className="px-3 py-1.5 text-sm rounded border border-border hover:bg-muted"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
