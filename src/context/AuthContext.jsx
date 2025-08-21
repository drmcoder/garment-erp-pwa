import React, { createContext, useContext, useReducer, useEffect } from "react";
import { DEMO_USERS } from "../config/firebase";

const AuthContext = createContext();

// Auth Actions
const AUTH_ACTIONS = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  CLEAR_ERROR: "CLEAR_ERROR",
};

// Initial State
const initialState = {
  user: null,
  userRole: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  loginAttempts: 0,
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
        userRole: action.payload.user.role,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        loginAttempts: 0,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        userRole: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
        loginAttempts: state.loginAttempts + 1,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Demo login function (replace with Firebase later)
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const { username, password, rememberMe = false } = credentials;

      // Check demo users
      const allUsers = [
        ...DEMO_USERS.OPERATORS,
        ...DEMO_USERS.SUPERVISORS,
        ...DEMO_USERS.MANAGEMENT,
      ];

      const user = allUsers.find(
        (u) => u.username === username && u.password === password
      );

      if (user) {
        // Store in localStorage if remember me
        if (rememberMe) {
          localStorage.setItem("garment-erp-user", JSON.stringify(user));
        }

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user },
        });

        return { success: true, user };
      } else {
        throw new Error("गलत प्रयोगकर्ता नाम वा पासवर्ड");
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: error.message },
      });
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("garment-erp-user");
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Get user display info
  const getUserDisplayInfo = () => {
    if (!state.user) return null;

    return {
      name: state.user.name,
      role: state.user.role,
      machine: state.user.machine || null,
      station: state.user.station || null,
      initials: state.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2),
    };
  };

  // Check for saved user on app start
  useEffect(() => {
    const savedUser = localStorage.getItem("garment-erp-user");
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user },
        });
      } catch (error) {
        localStorage.removeItem("garment-erp-user");
      }
    }
  }, []);

  const value = {
    // State
    user: state.user,
    userRole: state.userRole,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    loginAttempts: state.loginAttempts,

    // Actions
    login,
    logout,
    clearError,
    getUserDisplayInfo,
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

export default AuthContext;
