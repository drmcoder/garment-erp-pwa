import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import LoginScreen from "./components/auth/LoginScreen";
import Header from "./components/common/Header";
import { useAuth } from "./context/AuthContext";

// Main App Content
function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Welcome to Garment ERP!
          </h1>
          <p className="text-gray-600">
            🎉 System is working! Ready to build operator dashboard...
          </p>
        </div>
      </main>
    </div>
  );
}

// Main App with Providers
function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
