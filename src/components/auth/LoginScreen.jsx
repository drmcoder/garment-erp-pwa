import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAllUsers } from '../../hooks/useOptimizedData';
import { locationService } from '../../services/LocationService';
import { loginControlService } from '../../services/LoginControlService';

const LoginScreen = () => {
  const { login, loading, isOnline } = useAuth();
  const { showNotification } = useNotifications();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [locationStatus, setLocationStatus] = useState('unchecked'); // unchecked, checking, valid, invalid, pending
  // Use optimized data fetching with caching
  const { 
    data: allUsers, 
    loading: loadingUsers, 
    error: usersError 
  } = useAllUsers({ 
    immediate: true,
    autoRefresh: false // Don't auto-refresh on login screen
  });

  // Process and filter users for login dropdown
  const availableUsers = React.useMemo(() => {
    if (loadingUsers) {
      // Show loading state
      return [];
    }
    
    if (allUsers.length === 0 || usersError) {
      // Fallback demo users
      return [
        {
          username: 'button',
          name: 'Button Operator', 
          role: 'supervisor',
          lastLogin: new Date(Date.now() - 1 * 60 * 60 * 1000)
        },
        {
          username: 'ram.singh',
          name: 'Ram Singh', 
          role: 'operator',
          lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          username: 'admin.manager',
          name: 'Admin Manager',
          role: 'management',
          lastLogin: new Date(Date.now() - 30 * 60 * 1000)
        }
      ];
    }

    // Process real users data
    const usersData = allUsers
      .filter(user => user.username) // Only users with usernames
      .map(user => ({
        username: user.username,
        name: user.name || user.nameEn || user.username,
        role: user.role,
        lastLogin: user.lastLogin?.toDate ? user.lastLogin.toDate() : 
                  (user.lastLogin ? new Date(user.lastLogin) : null)
      }))
      .sort((a, b) => {
        // Sort by most recently logged in
        if (!a.lastLogin && !b.lastLogin) return 0;
        if (!a.lastLogin) return 1;
        if (!b.lastLogin) return -1;
        return b.lastLogin.getTime() - a.lastLogin.getTime();
      })
      .slice(0, 8); // Show top 8 users

    return usersData;
  }, [allUsers]);

  const checkLocationAccess = async () => {
    setLocationStatus('checking');
    try {
      const result = await locationService.validateLocation();
      
      if (result.success) {
        setLocationStatus('valid');
        return true;
      } else if (result.requiresApproval) {
        setLocationStatus('pending');
        showNotification("Location outside factory. Admin approval requested.", "warning");
        return false;
      } else {
        setLocationStatus('invalid');
        showNotification(result.message || "Location access denied", "error");
        return false;
      }
    } catch (error) {
      setLocationStatus('invalid');
      showNotification("Location check failed: " + error.message, "error");
      return false;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);

    try {
      // First check location for operators
      const isOperatorLogin = credentials.username && !credentials.username.includes('admin');
      
      if (isOperatorLogin) {
        const locationValid = await checkLocationAccess();
        if (!locationValid) {
          setLoginLoading(false);
          return; // Don't proceed with login if location invalid
        }
      }

      // Proceed with login if location is valid or user is admin
      await login(
        credentials.username,
        credentials.password,
        credentials.rememberMe
      );
      showNotification("Login successful!", "success");
    } catch (error) {
      showNotification(error.message, "error");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setCredentials(prev => ({ 
      ...prev, 
      username: user.username,
      password: 'password123' // Auto-fill default password
    }));
    setShowDropdown(false);
    setManualEntry(false);
  };

  const handleUsernameClick = () => {
    setClickCount(prev => prev + 1);
    setTimeout(() => {
      if (clickCount === 0) {
        // Single click - show dropdown
        setShowDropdown(true);
        setManualEntry(false);
      }
      setClickCount(0);
    }, 300);
  };

  const handleUsernameDoubleClick = () => {
    // Double click - enable manual entry
    setManualEntry(true);
    setShowDropdown(false);
    setCredentials(prev => ({ ...prev, username: '' }));
  };

  const getRoleIcon = (role) => {
    const icons = {
      operator: '👤',
      supervisor: '👨‍💼', 
      management: '👔'
    };
    return icons[role] || '👤';
  };

  const getRoleColor = (role) => {
    const colors = {
      operator: 'text-blue-600',
      supervisor: 'text-purple-600',
      management: 'text-red-600'
    };
    return colors[role] || 'text-gray-600';
  };

  const getRoleBgColor = (role) => {
    const colors = {
      operator: 'bg-blue-100',
      supervisor: 'bg-purple-100', 
      management: 'bg-red-100'
    };
    return colors[role] || 'bg-gray-100';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.relative')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-indigo-400/20 to-blue-400/20 -bottom-40 -right-40 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-purple-400/10 to-pink-400/10 top-1/3 left-1/4 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* Connection Status */}
        <div className="mb-4">
          <div
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full text-sm font-medium ${
              isOnline
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {isOnline ? (
              <Wifi className="w-4 h-4" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span>{isOnline ? "🟢 Connected" : "🔴 Offline Mode"}</span>
          </div>
        </div>

        {/* Header with enhanced branding */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-300 p-2">
            <img
              src="https://kaha6.com/wp-content/uploads/ts-logo1640412572.png"
              alt="TSA Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to emoji if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
            <span className="text-4xl hidden">🏭</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            TSA Production Management
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 font-medium">
            ✨ AI Powered for Line Balancing ✨
          </p>
        </div>

        {/* Login Form with enhanced styling */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8">
            <div className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  👤 Username
                </label>
                
                {/* Username Input/Button */}
                {manualEntry ? (
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="block w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50"
                    placeholder="Type username manually..."
                    value={credentials.username}
                    onChange={(e) =>
                      setCredentials({ ...credentials, username: e.target.value })
                    }
                    onBlur={() => {
                      if (!credentials.username) {
                        setManualEntry(false);
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <button
                    type="button"
                    onClick={handleUsernameClick}
                    onDoubleClick={handleUsernameDoubleClick}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-left bg-gray-50/50 hover:bg-blue-50 hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-700"
                  >
{credentials.username || "👆 Click to select user account"}
                  </button>
                )}

                {/* Enhanced Dropdown */}
                {showDropdown && !manualEntry && (
                  <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-xl max-h-80 overflow-hidden">
                    <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-700 font-medium">
                          💫 Select User Account
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setManualEntry(true);
                            setShowDropdown(false);
                            setCredentials(prev => ({ ...prev, username: '' }));
                          }}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors font-medium"
                        >
                          ⌨️ Manual Entry
                        </button>
                      </div>
                      {loadingUsers && (
                        <div className="flex items-center justify-center mt-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-xs text-gray-600">Loading users...</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {loadingUsers ? (
                        <div className="p-4 text-center text-gray-500">
                          <div className="animate-pulse">Loading available users...</div>
                        </div>
                      ) : usersError ? (
                        <div className="p-4 text-center text-red-500">
                          <div>❌ Failed to load users</div>
                          <div className="text-xs text-gray-500 mt-1">Using demo accounts below</div>
                        </div>
                      ) : availableUsers.length > 0 ? (
                        availableUsers.map((user) => (
                          <button
                            key={user.username}
                            type="button"
                            onClick={() => handleUserSelect(user)}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <span className="text-xl">{getRoleIcon(user.role)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 truncate">{user.name}</div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600 font-mono">@{user.username}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold bg-opacity-20 ${getRoleColor(user.role)} ${getRoleBgColor(user.role)}`}>
                                    {user.role}
                                  </span>
                                  {user.lastLogin && (
                                    <span className="text-xs text-gray-500">
                                      Last: {user.lastLogin.toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex-shrink-0">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          <div className="text-2xl mb-2">🔍</div>
                          <div className="text-sm">No users found</div>
                          <div className="text-xs text-gray-400 mt-1">Create users in User Management</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  🔒 Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className={`block w-full px-4 py-3 border-2 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    credentials.password === 'password123' 
                      ? 'border-green-300 bg-green-50/50' 
                      : 'border-gray-200 bg-gray-50/50'
                  }`}
                  placeholder={credentials.password === 'password123' ? "✅ Auto-filled password" : "Password (password123)"}
                  value={credentials.password}
                  onChange={(e) =>
                    setCredentials({ ...credentials, password: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-5 w-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    checked={credentials.rememberMe}
                    onChange={(e) =>
                      setCredentials({
                        ...credentials,
                        rememberMe: e.target.checked,
                      })
                    }
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm font-medium text-gray-700"
                  >
                    🧠 Remember me
                  </label>
                </div>
              </div>

              {/* Location Status Indicator */}
              {credentials.username && !credentials.username.includes('admin') && locationStatus !== 'unchecked' && (
                <div className={`flex items-center justify-center p-3 rounded-lg border-2 ${
                  locationStatus === 'valid' ? 'bg-green-50 border-green-200 text-green-800' :
                  locationStatus === 'checking' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' :
                  locationStatus === 'pending' ? 'bg-orange-50 border-orange-200 text-orange-800' :
                  'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center">
                    {locationStatus === 'valid' && <CheckCircle className="w-5 h-5 mr-2" />}
                    {locationStatus === 'checking' && <Clock className="w-5 h-5 mr-2 animate-spin" />}
                    {locationStatus === 'pending' && <AlertTriangle className="w-5 h-5 mr-2" />}
                    {locationStatus === 'invalid' && <XCircle className="w-5 h-5 mr-2" />}
                    <span className="text-sm font-medium">
                      {locationStatus === 'valid' && '📍 Location verified - Factory premises'}
                      {locationStatus === 'checking' && '📍 Checking location...'}
                      {locationStatus === 'pending' && '📍 Location outside factory - Approval requested'}
                      {locationStatus === 'invalid' && '📍 Location access denied'}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading || loading}
                className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-lg font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {loginLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="mr-2">🚀</span>
                    <span>Login to Dashboard</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Demo Accounts Section */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50/50 backdrop-blur-sm rounded-2xl border border-gray-200 p-6">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">🎭 Demo Accounts</h3>
            <p className="text-sm text-gray-600">Quick access for testing</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-white/70 rounded-xl p-3 border border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">👤</span>
                  <span className="font-medium text-gray-800">Operator</span>
                </div>
                <div className="text-sm font-mono text-blue-600">ram.singh / password123</div>
              </div>
            </div>
            <div className="bg-white/70 rounded-xl p-3 border border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">👨‍💼</span>
                  <span className="font-medium text-gray-800">Supervisor</span>
                </div>
                <div className="text-sm font-mono text-purple-600">hari.supervisor / password123</div>
              </div>
            </div>
            <div className="bg-white/70 rounded-xl p-3 border border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">👔</span>
                  <span className="font-medium text-gray-800">Manager</span>
                </div>
                <div className="text-sm font-mono text-red-600">admin.manager / password123</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;