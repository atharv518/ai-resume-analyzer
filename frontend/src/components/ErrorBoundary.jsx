import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled render error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-on-surface text-inverse-on-surface flex flex-col items-center justify-center p-6 text-center antialiased">
          <div className="glass-card max-w-md w-full rounded-2xl p-6 sm:p-8 border border-error/30 flex flex-col items-center gap-4 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-error-container/20 border border-error/40 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[32px]">warning</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Something went wrong</h2>
              <p className="text-xs sm:text-sm text-outline-variant mt-1.5 leading-relaxed">
                An unexpected rendering error occurred while displaying this view.
              </p>
            </div>
            {this.state.error && (
              <pre className="w-full bg-on-surface/90 border border-outline-variant/20 rounded-xl p-3 text-left font-mono text-[11px] text-error/90 overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-primary text-on-primary font-semibold text-xs sm:text-sm rounded-xl hover:bg-primary-container transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Return to Upload</span>
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="py-2.5 px-4 bg-inverse-surface border border-outline-variant/30 text-secondary-fixed-dim hover:text-white font-medium text-xs sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Reload</span>
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
