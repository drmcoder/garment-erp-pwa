import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

class ErrorBoundary extends React.Component {
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
      errorInfo: errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-800 mb-2">
              कुनै समस्या भयो
            </h1>
            <p className="text-gray-600 mb-6">
              एप्लिकेसनमा अप्रत्याशित त्रुटि भएको छ। कृपया पेज रिलोड गर्नुहोस्।
            </p>

            <button
              onClick={this.handleReload}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              पेज रिलोड गर्नुहोस्
            </button>

            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-gray-500 text-sm">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto">
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
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
