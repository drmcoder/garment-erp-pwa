// File: src/components/test/ErrorTestingComponent.jsx
// Component for testing error reporting system (Development only)

import React, { useState } from 'react';
import { Bug, AlertTriangle, X } from 'lucide-react';
import { errorHandlingService, ERROR_SEVERITY, ERROR_CATEGORIES } from '../../services/ErrorHandlingService';

const ErrorTestingComponent = ({ onClose }) => {
  const [testResults, setTestResults] = useState([]);

  const addResult = (test, success, message) => {
    setTestResults(prev => [...prev, { test, success, message, timestamp: new Date() }]);
  };

  const runTest = async (testName, testFunction) => {
    try {
      await testFunction();
      addResult(testName, true, 'Test completed successfully');
    } catch (error) {
      addResult(testName, false, `Test failed: ${error.message}`);
    }
  };

  const testJavaScriptError = async () => {
    await runTest('JavaScript Error', () => {
      // This will trigger the error boundary
      throw new Error('Test JavaScript Error - This should appear in Sentry');
    });
  };

  const testHandledError = async () => {
    await runTest('Handled Error via ErrorHandlingService', async () => {
      const testError = new Error('Test Handled Error - This should be logged and reported');
      await errorHandlingService.handleError(testError, {
        component: 'ErrorTestingComponent',
        action: 'test_handled_error',
        severity: ERROR_SEVERITY.MEDIUM,
        category: ERROR_CATEGORIES.SYSTEM
      });
    });
  };

  const testNetworkError = async () => {
    await runTest('Network Error Simulation', async () => {
      const networkError = new Error('Network request failed: 500 Internal Server Error');
      await errorHandlingService.handleError(networkError, {
        component: 'ErrorTestingComponent',
        action: 'api_call',
        severity: ERROR_SEVERITY.HIGH,
        category: ERROR_CATEGORIES.NETWORK
      });
    });
  };

  const testSentryDirect = async () => {
    await runTest('Direct Sentry Test', () => {
      console.log('Sentry testing disabled - service removed');
      throw new Error('Test error - Sentry service removed');
    });
  };

  const testAsyncError = async () => {
    await runTest('Async Error', async () => {
      // Simulate an async operation that fails
      setTimeout(() => {
        throw new Error('Async Error - Should be caught by global error handler');
      }, 100);
      
      // Give it a moment to trigger
      await new Promise(resolve => setTimeout(resolve, 200));
    });
  };

  const clearResults = () => {
    setTestResults([]);
  };

  if (process.env.NODE_ENV === 'production') {
    return null; // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4" />
          <span className="font-medium text-sm">Error Testing</span>
        </div>
        <button
          onClick={onClose}
          className="hover:bg-red-700 p-1 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Test Buttons */}
      <div className="p-4 space-y-2">
        <div className="grid gap-2">
          <button
            onClick={testSentryDirect}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors"
          >
            🎯 Test Sentry Direct
          </button>
          
          <button
            onClick={testHandledError}
            className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition-colors"
          >
            ✅ Test Handled Error
          </button>
          
          <button
            onClick={testNetworkError}
            className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded transition-colors"
          >
            🌐 Test Network Error
          </button>
          
          <button
            onClick={testJavaScriptError}
            className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors"
          >
            💥 Test JS Error (Breaks UI)
          </button>

          <button
            onClick={testAsyncError}
            className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded transition-colors"
          >
            ⏰ Test Async Error
          </button>
        </div>

        {testResults.length > 0 && (
          <button
            onClick={clearResults}
            className="w-full text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded transition-colors"
          >
            Clear Results
          </button>
        )}
      </div>

      {/* Results */}
      {testResults.length > 0 && (
        <div className="border-t border-gray-200 max-h-48 overflow-y-auto">
          <div className="p-3 space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`text-xs p-2 rounded ${
                  result.success 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  {result.success ? '✅' : '❌'}
                  <span>{result.test}</span>
                </div>
                <div className="text-xs opacity-75 mt-1">
                  {result.message}
                </div>
                <div className="text-xs opacity-50">
                  {result.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="text-xs text-gray-600">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3 h-3" />
            <span className="font-medium">Instructions:</span>
          </div>
          <ul className="text-xs space-y-1">
            <li>• Check browser console for logs</li>
            <li>• Check Sentry dashboard for reports</li>
            <li>• "JS Error" will show error boundary</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ErrorTestingComponent;