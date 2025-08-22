import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// Demo users for quick testing
const DEMO_USERS = {
  // Operators
  "ram.singh": {
    id: "op1",
    username: "ram.singh",
    password: "password123",
    name: "राम सिंह",
    role: "operator",
    machine: "overlock",
    station: "overlock-1",
  },
  "sita.devi": {
    id: "op2",
    username: "sita.devi",
    password: "password123",
    name: "सीता देवी",
    role: "operator",
    machine: "flatlock",
    station: "flatlock-1",
  },
  "hari.bahadur": {
    id: "op3",
    username: "hari.bahadur",
    password: "password123",
    name: "हरि बहादुर",
    role: "operator",
    machine: "singleNeedle",
    station: "single-needle-1",
  },

  // Supervisors
  supervisor: {
    id: "sup1",
    username: "supervisor",
    password: "super123",
    name: "श्याम पोखरेल",
    role: "supervisor",
    department: "production",
  },

  // Management
  management: {
    id: "mgmt1",
    username: "management",
    password: "mgmt123",
    name: "Management User",
    role: "management",
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("garment-erp-user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("garment-erp-user");
      }
    }
    setIsInitializing(false);
  }, []);

  const login = async (username, password, role = "operator") => {
    setIsLoading(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check demo users
      const user = DEMO_USERS[username];

      if (!user || user.password !== password || user.role !== role) {
        throw new Error("Invalid credentials");
      }

      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;

      setUser(userWithoutPassword);
      localStorage.setItem(
        "garment-erp-user",
        JSON.stringify(userWithoutPassword)
      );

      return userWithoutPassword;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("garment-erp-user");
  };

  const getUserDisplayInfo = () => {
    if (!user) return null;

    return {
      name: user.name || user.username,
      role: user.role,
      machine: user.machine,
      station: user.station,
      department: user.department,
    };
  };

  const hasPermission = (permission) => {
    if (!user) return false;

    // Simple role-based permissions
    const permissions = {
      operator: ["view_work", "complete_work", "report_quality"],
      supervisor: [
        "view_work",
        "complete_work",
        "report_quality",
        "assign_work",
        "view_analytics",
      ],
      management: [
        "view_work",
        "complete_work",
        "report_quality",
        "assign_work",
        "view_analytics",
        "manage_users",
        "view_reports",
      ],
    };

    return permissions[user.role]?.includes(permission) || false;
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isInitializing,
    userRole: user?.role,
    login,
    logout,
    getUserDisplayInfo,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
