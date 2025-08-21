import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginScreen from "./components/auth/LoginScreen";
import OperatorDashboard from "./components/operator/Dashboard";
import SupervisorDashboard from "./components/supervisor/Dashboard";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// Placeholder Component for Management
const PlaceholderComponent = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{title}</h1>
      <p className="text-gray-600">Component coming soon...</p>
    </div>
  </div>
);

// App Routes Component
const AppRoutes = () => {
  const { isAuthenticated, userRole } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Redirect based on user role
  if (userRole === "operator") {
    return <OperatorDashboard />;
  } else if (userRole === "supervisor") {
    return <SupervisorDashboard />;
  } else if (userRole === "management") {
    return <PlaceholderComponent title="Management Dashboard" />;
  }

  return <PlaceholderComponent title="Unknown Role" />;
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/*" element={<AppRoutes />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
