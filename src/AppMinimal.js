// Minimal App Component for testing
import React, { useState } from "react";

// Minimal Login Screen
const SimpleLoginScreen = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ username: "", password: "" });

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(credentials.username);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">TSA ERP</h1>
          <p className="mt-2 text-sm text-gray-600">Production Management System</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <input
              type="text"
              placeholder="Username"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

// Simple Dashboard
const SimpleDashboard = ({ user, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">TSA ERP Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span>Welcome, {user}</span>
              <button
                onClick={onLogout}
                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Today's Production</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">125 pieces</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Efficiency</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">92%</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900">Quality Score</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">96%</p>
            </div>
          </div>
          
          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>✅ Authentication System</span>
                <span className="text-green-600">Working</span>
              </div>
              <div className="flex justify-between">
                <span>✅ Basic UI Components</span>
                <span className="text-green-600">Working</span>
              </div>
              <div className="flex justify-between">
                <span>🔧 Advanced Features</span>
                <span className="text-yellow-600">Integration in Progress</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Main Minimal App
const AppMinimal = () => {
  const [user, setUser] = useState(null);

  const handleLogin = (username) => {
    setUser(username || "Demo User");
  };

  const handleLogout = () => {
    setUser(null);
  };

  return user ? (
    <SimpleDashboard user={user} onLogout={handleLogout} />
  ) : (
    <SimpleLoginScreen onLogin={handleLogin} />
  );
};

export default AppMinimal;