// Progressive App Test - Add providers one by one
import React from 'react';
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

const SimpleComponent = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        🏭 TSA Production Management
      </h1>
      <p className="text-gray-600">
        Progressive test - Step 1: Basic providers loaded
      </p>
      <div className="mt-8 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
        ✅ Language, Auth, and Notification providers working
      </div>
    </div>
  </div>
);

const AppTest = () => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <NotificationProvider>
          <SimpleComponent />
        </NotificationProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export default AppTest;