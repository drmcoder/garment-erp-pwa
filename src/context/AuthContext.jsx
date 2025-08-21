import React, { createContext, useContext, useReducer, useEffect } from "react";
// Import mock auth service instead of Firebase for demo
import mockAuthService from "../services/mockAuthService";

// For demo purposes, we'll create a simple mock data service
const mockDataService = {
  unsubscribeAll: () => console.log("Mock: All subscriptions cleaned up"),
  subscribeToUserBundles: (userId, callback) => {
    // Simulate real-time bundle updates
    setTimeout(() => {
      callback({
        success: true,
        data: [
          {
            id: 1,
            bundleNumber: "B001-85-BL-XL",
            article: "8085",
            status: "in-progress",
            assignedTime: new Date(Date.now() - 45 * 60000),
          },
        ],
      });
    }, 500);

    // Return mock unsubscribe function
    return () => console.log("Mock: Bundle subscription unsubscribed");
  },
  subscribeToUserNotifications: (userId, callback) => {
    // Simulate real-time notifications
    setTimeout(() => {
      callback({
        success: true,
        data: [
          {
            id: 1,
            type: "work-ready",
            title: "Bundle Ready",
            titleNepali: "बन्डल तयार",
            message: "Bundle #B002-33-GR-2XL ready for your station",
            messageNepali: "बन्डल #B002-33-GR-2XL तपाईंको स्टेसनको लागि तयार छ",
            time: new Date(Date.now() - 2 * 60000),
            read: false,
          },
        ],
      });
    }, 500);

    return () => console.log("Mock: Notifications subscription unsubscribed");
  },
  startWork: async (bundleId) => {
    console.log("Mock: Starting work on bundle:", bundleId);
    return { success: true };
  },
  completeWork: async (bundleId, completionData) => {
    console.log("Mock: Completing work on bundle:", bundleId, completionData);
    return { success: true };
  },
  createQualityIssue: async (issueData) => {
    console.log("Mock: Creating quality issue:", issueData);
    return { success: true };
  },
  getProductionStats: async (dateRange) => {
    console.log("Mock: Getting production stats for:", dateRange);
    return {
      success: true,
      data: {
        totalPieces: 85,
        totalEarnings: 237.5,
        efficiency: 88,
        qualityScore: 98,
      },
    };
  },
  getWageRecords: async (userId, dateRange) => {
    console.log("Mock: Getting wage records for:", userId, dateRange);
    return {
      success: true,
      data: {
        records: [],
        summary: {
          totalEarnings: 6205,
          totalPieces: 2480,
          averageRate: 2.5,
          workingDays: 26,
        },
      },
    };
  },
  markNotificationRead: async (notificationId) => {
    console.log("Mock: Marking notification read:", notificationId);
    return { success: true };
  },
};

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

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = mockAuthService.initializeAuthListener();

    // Set up auth state listener
    mockAuthService.addAuthStateListener((user) => {
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
      mockDataService.unsubscribeAll();
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

  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const result = await mockAuthService.login(credentials);

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
      await mockAuthService.logout();
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: "Logout failed" };
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      const result = await mockAuthService.updateUserProfile(updates);

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

  // Mock data service functions
  const subscribeToUserBundles = (callback) => {
    if (!state.user?.uid) {
      callback({ success: false, error: "No authenticated user" });
      return null;
    }

    return mockDataService.subscribeToUserBundles(state.user.uid, callback);
  };

  const subscribeToUserNotifications = (callback) => {
    if (!state.user?.uid) {
      callback({ success: false, error: "No authenticated user" });
      return null;
    }

    return mockDataService.subscribeToUserNotifications(
      state.user.uid,
      callback
    );
  };

  const startWork = async (bundleId) => {
    try {
      return await mockDataService.startWork(bundleId);
    } catch (error) {
      console.error("Error starting work:", error);
      return { success: false, error: "Failed to start work" };
    }
  };

  const completeWork = async (bundleId, completionData) => {
    try {
      return await mockDataService.completeWork(bundleId, completionData);
    } catch (error) {
      console.error("Error completing work:", error);
      return { success: false, error: "Failed to complete work" };
    }
  };

  const reportQualityIssue = async (issueData) => {
    try {
      return await mockDataService.createQualityIssue(issueData);
    } catch (error) {
      console.error("Error reporting quality issue:", error);
      return { success: false, error: "Failed to report quality issue" };
    }
  };

  const getProductionStats = async (dateRange = "today") => {
    try {
      return await mockDataService.getProductionStats(dateRange);
    } catch (error) {
      console.error("Error getting production stats:", error);
      return { success: false, error: "Failed to get production stats" };
    }
  };

  const getWageRecords = async (dateRange = "month") => {
    if (!state.user?.uid) {
      return { success: false, error: "No authenticated user" };
    }

    try {
      return await mockDataService.getWageRecords(state.user.uid, dateRange);
    } catch (error) {
      console.error("Error getting wage records:", error);
      return { success: false, error: "Failed to get wage records" };
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      return await mockDataService.markNotificationRead(notificationId);
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
