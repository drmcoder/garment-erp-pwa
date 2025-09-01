// Fixed version of AppClean - minimal working authentication app
import React from 'react';

// Simple mock authentication for testing
const AppFixed = () => {
  const [user, setUser] = React.useState(null);
  const [showLogin, setShowLogin] = React.useState(true);

  const handleLogin = (username) => {
    const mockUser = {
      name: username || 'Demo User',
      role: username === 'supervisor' ? 'supervisor' : 'operator',
      id: '123'
    };
    setUser(mockUser);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setUser(null);
    setShowLogin(true);
  };

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">🏭 TSA Production System</h1>
            <p className="text-gray-600">Fixed Authentication Test</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={() => handleLogin('ram.singh')}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Login as Operator (ram.singh)
            </button>
            <button
              onClick={() => handleLogin('supervisor')}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
            >
              Login as Supervisor
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl">🏭</span>
              <h1 className="ml-4 text-xl font-semibold text-gray-900">
                TSA Production Management
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              ✅ {user.role === 'operator' ? 'Operator' : 'Supervisor'} Dashboard
            </h2>
            <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto">
              <p className="text-lg mb-4">🎉 Authentication Working!</p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <strong>User:</strong> {user.name}
                </div>
                <div>
                  <strong>Role:</strong> {user.role}
                </div>
                <div>
                  <strong>Status:</strong> <span className="text-green-600">Active</span>
                </div>
                <div>
                  <strong>System:</strong> <span className="text-green-600">Stable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppFixed;