import React, { createContext, useContext, useReducer, useEffect } from "react";
import authService from "../services/authService";
import dataService from "../services/dataService";
import { requestNotificationPermission } from "../config/firebase";

// Auth Context
const AuthContext = createContext();

// Auth Actions
const AUTH_ACTIONS = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  UPDATE_PROFILE: "UPDATE_PROFILE",
  CLEAR_ERROR: "CLEAR_ERROR",
  SET_LOADING: "SET_LOADING",
  SET_OFFLINE: "SET_OFFLINE",
};

// Initial State
const initialState = {
  user: null,
  userRole: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  error: null,
  loginAttempts: 0,
  lastLoginTime: null,
  isOffline: false,
  fcmToken: null,
};

// Auth Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        userRole: action.payload.role,
        isAuthenticated: true,
        isLoading: false,
        isInitializing: false,
        error: null,
        loginAttempts: 0,
        lastLoginTime: new Date().toISOString(),
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        userRole: null,
        isAuthenticated: false,
        isLoading: false,
        isInitializing: false,
        error: action.payload.error,
        loginAttempts: state.loginAttempts + 1,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isInitializing: false,
      };

    case AUTH_ACTIONS.UPDATE_PROFILE:
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload.updates,
        },
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload.loading,
      };

    case AUTH_ACTIONS.SET_OFFLINE:
      return {
        ...state,
        isOffline: action.payload.offline,
      };

    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = authService.initializeAuthListener();

    // Set up auth state listener
    authService.addAuthStateListener((user) => {
      if (user) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user,
            role: user.role,
          },
        });
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGOUT,
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      dataService.unsubscribeAll();
    };
  }, []);

  // Setup offline detection
  useEffect(() => {
    const handleOnline = () => {
      dispatch({
        type: AUTH_ACTIONS.SET_OFFLINE,
        payload: { offline: false },
      });
    };

    const handleOffline = () => {
      dispatch({
        type: AUTH_ACTIONS.SET_OFFLINE,
        payload: { offline: true },
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Set initial state
    dispatch({
      type: AUTH_ACTIONS.SET_OFFLINE,
      payload: { offline: !navigator.onLine },
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Setup FCM notifications
  useEffect(() => {
    if (state.isAuthenticated && state.user && !state.fcmToken) {
      requestNotificationPermission().then((token) => {
        if (token) {
          // Store FCM token in user profile
          updateProfile({ fcmToken: token });
        }
      });
    }
  }, [state.isAuthenticated, state.user]);

  // Login function using Firebase Auth Service
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const result = await authService.login(credentials);

      if (result.success) {
        // Success is handled by the auth state listener
        return result;
      } else {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: {
            error: result.error,
          },
        });
        return result;
      }
    } catch (error) {
      console.error("Login error:", error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: {
          error: "Login failed. Please try again.",
        },
      });
      return { success: false, error: "Login failed. Please try again." };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authService.logout();
      // Logout success is handled by the auth state listener
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: "Logout failed" };
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      const result = await authService.updateUserProfile(updates);

      if (result.success) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_PROFILE,
          payload: { updates },
        });
      }

      return result;
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, error: "Failed to update profile" };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check permissions
  const hasPermission = (permission) => {
    if (!state.user || !state.user.permissions) {
      return false;
    }
    return state.user.permissions.includes(permission);
  };

  // Check if user can access specific features
  const canAccess = {
    operatorFeatures: () => hasPermission("view-own-work"),
    supervisorFeatures: () => hasPermission("view-all-work"),
    managementFeatures: () => hasPermission("view-all-data"),
    workAssignment: () => hasPermission("assign-work"),
    qualityManagement: () => hasPermission("approve-quality"),
    analytics: () => hasPermission("view-analytics"),
    userManagement: () => hasPermission("manage-users"),
    financialData: () => hasPermission("financial-data"),
    systemSettings: () => hasPermission("manage-system"),
  };

  // Get user display info
  const getUserDisplayInfo = () => {
    if (!state.user) return null;

    return {
      name: state.user.name || state.user.displayName,
      role: state.userRole,
      machine: state.user.machine || null,
      station: state.user.station || null,
      department: state.user.department || null,
      avatar: state.user.photoURL || state.user.profilePic || null,
      initials: (state.user.name || state.user.displayName || "??")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2),
    };
  };

  // Check if session is valid
  const isSessionValid = () => {
    if (!state.lastLoginTime) return false;

    const loginTime = new Date(state.lastLoginTime);
    const now = new Date();
    const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);

    // Session expires after 12 hours
    return hoursSinceLogin < 12;
  };

  // Get current user bundles (with real-time subscription)
  const subscribeToUserBundles = (callback) => {
    if (!state.user?.uid) {
      callback({ success: false, error: "No authenticated user" });
      return null;
    }

    return dataService.subscribeToUserBundles(state.user.uid, callback);
  };

  // Get current user notifications (with real-time subscription)
  const subscribeToUserNotifications = (callback) => {
    if (!state.user?.uid) {
      callback({ success: false, error: "No authenticated user" });
      return null;
    }

    return dataService.subscribeToUserNotifications(state.user.uid, callback);
  };

  // Work management functions
  const startWork = async (bundleId) => {
    try {
      return await dataService.startWork(bundleId);
    } catch (error) {
      console.error("Error starting work:", error);
      return { success: false, error: "Failed to start work" };
    }
  };

  const completeWork = async (bundleId, completionData) => {
    try {
      return await dataService.completeWork(bundleId, completionData);
    } catch (error) {
      console.error("Error completing work:", error);
      return { success: false, error: "Failed to complete work" };
    }
  };

  const reportQualityIssue = async (issueData) => {
    try {
      return await dataService.createQualityIssue(issueData);
    } catch (error) {
      console.error("Error reporting quality issue:", error);
      return { success: false, error: "Failed to report quality issue" };
    }
  };

  // Get production statistics
  const getProductionStats = async (dateRange = "today") => {
    try {
      return await dataService.getProductionStats(dateRange);
    } catch (error) {
      console.error("Error getting production stats:", error);
      return { success: false, error: "Failed to get production stats" };
    }
  };

  // Get wage records
  const getWageRecords = async (dateRange = "month") => {
    if (!state.user?.uid) {
      return { success: false, error: "No authenticated user" };
    }

    try {
      return await dataService.getWageRecords(state.user.uid, dateRange);
    } catch (error) {
      console.error("Error getting wage records:", error);
      return { success: false, error: "Failed to get wage records" };
    }
  };

  // Mark notification as read
  const markNotificationRead = async (notificationId) => {
    try {
      return await dataService.markNotificationRead(notificationId);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return { success: false, error: "Failed to mark notification as read" };
    }
  };

  // Context value
  const value = {
    // State
    user: state.user,
    userRole: state.userRole,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isInitializing: state.isInitializing,
    error: state.error,
    loginAttempts: state.loginAttempts,
    isOffline: state.isOffline,

    // Authentication actions
    login,
    logout,
    updateProfile,
    clearError,

    // Utilities
    hasPermission,
    canAccess,
    getUserDisplayInfo,
    isSessionValid,

    // Real-time subscriptions
    subscribeToUserBundles,
    subscribeToUserNotifications,

    // Work management
    startWork,
    completeWork,
    reportQualityIssue,

    // Data retrieval
    getProductionStats,
    getWageRecords,
    markNotificationRead,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

// HOC for protected routes
export const withAuth = (Component, requiredPermissions = []) => {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, hasPermission, userRole, isInitializing } =
      useAuth();

    if (isInitializing) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Will be handled by ProtectedRoute component
    }

    // Check if user has required permissions
    if (requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((permission) =>
        hasPermission(permission)
      );

      if (!hasAllPermissions) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Access Denied
              </h2>
              <p className="text-gray-600">
                You don't have permission to access this feature.
              </p>
            </div>
          </div>
        );
      }
    }

    return <Component {...props} />;
  };
};

export default AuthContext;
