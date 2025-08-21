// Mock Authentication Service for Demo
// This replaces the Firebase auth for development/demo purposes

const DEMO_USERS = {
  "ram.singh": {
    id: "operator1",
    name: "राम सिंह",
    username: "ram.singh",
    password: "password123",
    email: "ram.singh@garment-erp.com",
    role: "operator",
    machine: "overlock",
    skillLevel: "expert",
    station: "overlock-1",
    shift: "morning",
    permissions: ["view-own-work", "complete-work", "report-quality"],
    department: "production",
    uid: "operator1",
  },
  supervisor: {
    id: "supervisor1",
    name: "श्याम पोखरेल",
    username: "supervisor",
    password: "super123",
    email: "supervisor@garment-erp.com",
    role: "supervisor",
    department: "production",
    shift: "morning",
    permissions: [
      "view-all-work",
      "assign-work",
      "monitor-lines",
      "view-analytics",
      "manage-operators",
      "approve-quality",
    ],
    uid: "supervisor1",
  },
  management: {
    id: "management1",
    name: "Management User",
    username: "management",
    password: "mgmt123",
    email: "management@garment-erp.com",
    role: "management",
    department: "all",
    permissions: [
      "view-all-data",
      "financial-data",
      "manage-system",
      "manage-users",
      "view-analytics",
    ],
    uid: "management1",
  },
};

class MockAuthService {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
    this.userPermissions = [];
    this.authStateListeners = [];

    // Check if user was previously logged in
    const savedUser = localStorage.getItem("garment-erp-current-user");
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        this.userRole = this.currentUser?.role;
        this.userPermissions = this.currentUser?.permissions || [];
        // Notify listeners after a brief delay to simulate async
        setTimeout(() => {
          this.notifyAuthStateListeners(this.currentUser);
        }, 100);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("garment-erp-current-user");
      }
    } else {
      // No saved user, user is not authenticated
      setTimeout(() => {
        this.notifyAuthStateListeners(null);
      }, 100);
    }
  }

  // Initialize auth state listener
  initializeAuthListener() {
    // Return a mock unsubscribe function
    return () => {
      console.log("Mock auth listener unsubscribed");
    };
  }

  // Login with username/password
  async login(credentials) {
    try {
      const { username, password, rememberMe = false } = credentials;

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Find user in demo users
      const user = DEMO_USERS[username];

      if (!user || user.password !== password) {
        throw new Error("Invalid username or password");
      }

      // Create user object without password
      const { password: _, ...userWithoutPassword } = user;
      const completeUser = {
        ...userWithoutPassword,
        loginTime: new Date().toISOString(),
        displayName: user.name,
        photoURL: null,
      };

      this.currentUser = completeUser;
      this.userRole = user.role;
      this.userPermissions = user.permissions || [];

      // Save to localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem("garment-erp-remember", "true");
      }

      // Always save current user for session persistence
      localStorage.setItem(
        "garment-erp-current-user",
        JSON.stringify(completeUser)
      );

      // Notify listeners
      this.notifyAuthStateListeners(completeUser);

      return {
        success: true,
        user: completeUser,
        role: user.role,
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message || "Login failed. Please try again.",
      };
    }
  }

  // Logout
  async logout() {
    try {
      // Clear user data
      this.currentUser = null;
      this.userRole = null;
      this.userPermissions = [];

      // Clear local storage
      localStorage.removeItem("garment-erp-remember");
      localStorage.removeItem("garment-erp-current-user");
      localStorage.removeItem("garment-erp-language");
      localStorage.removeItem("garment-erp-offline-data");

      // Notify listeners
      this.notifyAuthStateListeners(null);

      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        error: "Logout failed",
      };
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get user role
  getUserRole() {
    return this.userRole;
  }

  // Check permissions
  hasPermission(permission) {
    return this.userPermissions.includes(permission);
  }

  // Check role
  hasRole(role) {
    return this.userRole === role;
  }

  // Add auth state listener
  addAuthStateListener(callback) {
    this.authStateListeners.push(callback);
  }

  // Remove auth state listener
  removeAuthStateListener(callback) {
    const index = this.authStateListeners.indexOf(callback);
    if (index > -1) {
      this.authStateListeners.splice(index, 1);
    }
  }

  // Notify auth state listeners
  notifyAuthStateListeners(user) {
    this.authStateListeners.forEach((callback) => {
      try {
        callback(user);
      } catch (error) {
        console.error("Error in auth state listener:", error);
      }
    });
  }

  // Update user profile
  async updateUserProfile(updates) {
    try {
      if (!this.currentUser) {
        throw new Error("No authenticated user");
      }

      // Update current user object
      this.currentUser = {
        ...this.currentUser,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Update localStorage
      localStorage.setItem(
        "garment-erp-current-user",
        JSON.stringify(this.currentUser)
      );

      // Notify listeners
      this.notifyAuthStateListeners(this.currentUser);

      return { success: true };
    } catch (error) {
      console.error("Error updating profile:", error);
      return {
        success: false,
        error: "Failed to update profile",
      };
    }
  }

  // Get user data (for compatibility with Firebase version)
  async getUserData(userId) {
    // In mock version, just return current user if IDs match
    if (this.currentUser && this.currentUser.uid === userId) {
      return this.currentUser;
    }
    return null;
  }

  // Mock methods for compatibility
  async updateLastLogin(userId) {
    console.log("Mock: Last login updated for user:", userId);
  }

  async getClientIP() {
    return "mock-ip";
  }

  async changePassword(newPassword) {
    console.log("Mock: Password changed");
    return { success: true };
  }

  async sendPasswordReset(email) {
    console.log("Mock: Password reset sent to:", email);
    return { success: true };
  }
}

// Create singleton instance
const mockAuthService = new MockAuthService();

export default mockAuthService;
export { DEMO_USERS };
