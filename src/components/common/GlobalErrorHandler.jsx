import React, { useState, createContext, useContext } from 'react';
import { useLanguage } from '../../context/LanguageContext';

// Error Context
const ErrorContext = createContext();

// Error Types
const ERROR_TYPES = {
  VALIDATION: 'validation',
  NETWORK: 'network',
  SYSTEM: 'system',
  USER: 'user',
  CRITICAL: 'critical'
};

// Error Severity Levels
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Global Error Handler Provider
export const GlobalErrorProvider = ({ children }) => {
  const { currentLanguage } = useLanguage();
  const [errors, setErrors] = useState([]);
  const [currentError, setCurrentError] = useState(null);

  // Add error to system
  const addError = (error, type = ERROR_TYPES.SYSTEM, severity = ERROR_SEVERITY.MEDIUM) => {
    const errorId = Date.now() + Math.random();
    const timestamp = new Date();
    
    const errorObject = {
      id: errorId,
      message: error?.message || error || 'Unknown error occurred',
      type,
      severity,
      timestamp,
      stack: error?.stack,
      component: error?.component,
      action: error?.action,
      data: error?.data
    };

    // Log to console with full details
    logErrorToConsole(errorObject);

    // Add to errors list
    setErrors(prev => [...prev, errorObject]);
    
    // Show current error in bottom notification
    setCurrentError(errorObject);

    // Auto-hide based on severity
    const hideDelay = getHideDelay(severity);
    if (hideDelay > 0) {
      setTimeout(() => {
        hideError(errorId);
      }, hideDelay);
    }

    return errorId;
  };

  // Log error to console with structured format
  const logErrorToConsole = (errorObject) => {
    const logLevel = getConsoleLogLevel(errorObject.severity);
    const timestamp = errorObject.timestamp.toISOString();
    
    console.group(`🚨 ${logLevel.toUpperCase()} ERROR - ${timestamp}`);
    console.error('Message:', errorObject.message);
    console.error('Type:', errorObject.type);
    console.error('Severity:', errorObject.severity);
    
    if (errorObject.component) {
      console.error('Component:', errorObject.component);
    }
    
    if (errorObject.action) {
      console.error('Action:', errorObject.action);
    }
    
    if (errorObject.data) {
      console.error('Data:', errorObject.data);
    }
    
    if (errorObject.stack) {
      console.error('Stack Trace:', errorObject.stack);
    }
    
    console.groupEnd();
  };

  // Get console log level based on severity
  const getConsoleLogLevel = (severity) => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return 'critical';
      case ERROR_SEVERITY.HIGH:
        return 'error';
      case ERROR_SEVERITY.MEDIUM:
        return 'warn';
      case ERROR_SEVERITY.LOW:
        return 'info';
      default:
        return 'error';
    }
  };

  // Get auto-hide delay based on severity
  const getHideDelay = (severity) => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return 0; // Never auto-hide critical errors
      case ERROR_SEVERITY.HIGH:
        return 8000;
      case ERROR_SEVERITY.MEDIUM:
        return 5000;
      case ERROR_SEVERITY.LOW:
        return 3000;
      default:
        return 5000;
    }
  };

  // Hide specific error
  const hideError = (errorId) => {
    if (currentError?.id === errorId) {
      setCurrentError(null);
    }
  };

  // Clear all errors
  const clearAllErrors = () => {
    setErrors([]);
    setCurrentError(null);
  };

  // Get error message in current language
  const getLocalizedErrorMessage = (error) => {
    // Common error message translations
    const errorTranslations = {
      'Network Error': {
        np: 'नेटवर्क त्रुटि',
        en: 'Network Error'
      },
      'Validation Error': {
        np: 'प्रमाणीकरण त्रुटि',
        en: 'Validation Error'
      },
      'System Error': {
        np: 'प्रणाली त्रुटि',
        en: 'System Error'
      },
      'Unknown error occurred': {
        np: 'अज्ञात त्रुटि भयो',
        en: 'Unknown error occurred'
      }
    };

    const translation = errorTranslations[error.message];
    if (translation) {
      return translation[currentLanguage] || translation.en;
    }
    
    return error.message;
  };

  // Context value
  const contextValue = {
    errors,
    currentError,
    addError,
    hideError,
    clearAllErrors,
    ERROR_TYPES,
    ERROR_SEVERITY,
    getLocalizedErrorMessage
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      <ErrorNotification />
    </ErrorContext.Provider>
  );
};

// Error Notification Component (appears at bottom)
const ErrorNotification = () => {
  const { currentError, hideError, getLocalizedErrorMessage } = useContext(ErrorContext);
  const { currentLanguage } = useLanguage();

  if (!currentError) return null;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return 'bg-red-600 border-red-700';
      case ERROR_SEVERITY.HIGH:
        return 'bg-red-500 border-red-600';
      case ERROR_SEVERITY.MEDIUM:
        return 'bg-orange-500 border-orange-600';
      case ERROR_SEVERITY.LOW:
        return 'bg-yellow-500 border-yellow-600';
      default:
        return 'bg-red-500 border-red-600';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        return '🚨';
      case ERROR_SEVERITY.HIGH:
        return '❌';
      case ERROR_SEVERITY.MEDIUM:
        return '⚠️';
      case ERROR_SEVERITY.LOW:
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] flex justify-center">
      <div className={`
        max-w-md w-full border-l-4 rounded-lg shadow-lg text-white p-4 
        transform transition-all duration-300 animate-slideUp
        ${getSeverityColor(currentError.severity)}
      `}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <span className="text-lg">{getSeverityIcon(currentError.severity)}</span>
            <div className="flex-1">
              <div className="font-medium text-sm">
                {currentLanguage === 'np' ? 'त्रुटि' : 'Error'}
              </div>
              <div className="text-sm opacity-90 mt-1">
                {getLocalizedErrorMessage(currentError)}
              </div>
              <div className="text-xs opacity-70 mt-1">
                {currentError.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          <button
            onClick={() => hideError(currentError.id)}
            className="ml-2 text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook to use error context
export const useGlobalError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useGlobalError must be used within a GlobalErrorProvider');
  }
  return context;
};

// Higher-order component for error boundary
export const withErrorHandler = (Component) => {
  return function ErrorBoundaryWrapper(props) {
    const { addError } = useGlobalError();

    const handleError = (error, errorInfo) => {
      addError({
        message: error.message,
        stack: error.stack,
        component: Component.name,
        action: 'Component Error',
        data: errorInfo
      }, ERROR_TYPES.SYSTEM, ERROR_SEVERITY.HIGH);
    };

    return (
      <ErrorBoundary onError={handleError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Error Boundary Class Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-red-800 font-medium">Something went wrong</h3>
          <p className="text-red-600 text-sm mt-1">Please refresh the page or try again.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Utility functions for common error scenarios
export const handleAsyncError = (asyncFn, errorHandler) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      errorHandler(error);
      throw error;
    }
  };
};

export const handleValidationError = (validationFn, errorHandler) => {
  return (...args) => {
    try {
      return validationFn(...args);
    } catch (error) {
      errorHandler(error, ERROR_TYPES.VALIDATION, ERROR_SEVERITY.MEDIUM);
      return false;
    }
  };
};

export default GlobalErrorProvider;