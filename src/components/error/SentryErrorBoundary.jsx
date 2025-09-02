// File: src/components/error/SentryErrorBoundary.jsx
// React Error Boundary Component (Sentry removed)

import React from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

class ReactErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console instead of Sentry
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallbackComponent 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={() => this.setState({ hasError: false, error: null, errorInfo: null })}
          showDetails={this.props.showDetails}
        />
      );
    }

    return this.props.children;
  }
}

const SentryErrorBoundary = ({ children, fallback = null, showDetails = false }) => {
  return (
    <ReactErrorBoundary showDetails={showDetails}>
      {children}
    </ReactErrorBoundary>
  );
};

// Custom error fallback component
const ErrorFallbackComponent = ({ error, errorInfo, resetError, showDetails }) => {
  const [showErrorDetails, setShowErrorDetails] = React.useState(showDetails);

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleRetry = () => {
    resetError();
  };

  const handleReportBug = () => {
    // Create mailto link for bug reporting
    const subject = 'Bug Report - TSA ERP';
    const body = `Error Details:\n\n${error ? error.toString() : 'Unknown error'}\n\nStack Trace:\n${error && error.stack ? error.stack : 'No stack trace available'}\n\nURL: ${window.location.href}\nTimestamp: ${new Date().toISOString()}`;
    window.location.href = `mailto:support@example.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Error Icon */}
        <div className="text-center mb-6">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
        </div>

        {/* Error Message */}
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-red-100">
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
            Something went wrong
          </h1>
          
          <p className="text-gray-600 text-center mb-6">
            We're sorry for the inconvenience. Please try refreshing the page or contact support if the problem persists.
          </p>

          {/* Error Details Toggle */}
          {error && (
            <div className="mb-6">
              <button
                onClick={() => setShowErrorDetails(!showErrorDetails)}
                className="w-full text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2"
              >
                <Bug className="w-4 h-4" />
                {showErrorDetails ? 'Hide' : 'Show'} Error Details
              </button>
              
              {showErrorDetails && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-2">Error Details:</p>
                  <code className="text-xs text-red-700 block whitespace-pre-wrap break-all">
                    {error.toString()}
                    {error.stack && `\n\nStack trace:\n${error.stack}`}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleReload}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                onClick={handleGoHome}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
            </div>

            <button
              onClick={handleReportBug}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <Bug className="w-4 h-4" />
              Report Bug
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            TSA Production Management System
          </p>
        </div>
      </div>
    </div>
  );
};

export default SentryErrorBoundary;