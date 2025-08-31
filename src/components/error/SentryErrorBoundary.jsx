// File: src/components/error/SentryErrorBoundary.jsx
// Enhanced React Error Boundary with Sentry Integration

import React from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

const SentryErrorBoundary = ({ children, fallback = null, showDetails = false }) => {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError, eventId }) => (
        <ErrorFallbackComponent 
          error={error} 
          resetError={resetError} 
          eventId={eventId}
          showDetails={showDetails}
        />
      )}
      beforeCapture={(scope) => {
        // Add additional context before sending to Sentry
        scope.setTag('errorBoundary', true);
        scope.setLevel('error');
        scope.setContext('errorBoundary', {
          component: 'SentryErrorBoundary',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        });
      }}
      showDialog={{
        // Show user report dialog in production
        showDialog: process.env.NODE_ENV === 'production',
        user: {
          name: 'User',
          email: 'user@example.com', // Could be populated from auth context
        },
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
};

// Custom error fallback component
const ErrorFallbackComponent = ({ error, resetError, eventId, showDetails }) => {
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
    // Open Sentry user feedback dialog
    if (eventId) {
      Sentry.showReportDialog({ eventId });
    }
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
            We're sorry for the inconvenience. The error has been automatically reported to our team.
          </p>

          {/* Error ID for reference */}
          {eventId && (
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-gray-700 text-center">
                <span className="font-medium">Error ID:</span> <code className="bg-gray-200 px-2 py-1 rounded text-xs">{eventId}</code>
              </p>
            </div>
          )}

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

            {eventId && (
              <button
                onClick={handleReportBug}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
              >
                <Bug className="w-4 h-4" />
                Report Bug
              </button>
            )}
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