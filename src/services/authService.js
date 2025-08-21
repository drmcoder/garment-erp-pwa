import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, COLLECTIONS, handleFirebaseError } from "../config/firebase";

// Custom claims for role-based access
const USER_ROLES = {
  OPERATOR: "operator",
  SUPERVISOR: "supervisor",
  MANAGEMENT: "management",
  ADMIN: "admin",
};

// Authentication Service Class
class AuthService {
  constructor() {
    this.currentUser = null;
    this.userRole = null;
    this.userPermissions = [];
    this.authStateListeners = [];
  }

  // Initialize auth state listener
  initializeAuthListener() {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get user data from Firestore
          const userData = await this.getUserData(user.uid);
          this.currentUser = {
            ...user,
            ...userData,
          };
          this.userRole = userData?.role || null;
          this.userPermissions = userData?.permissions || [];

          // Notify listeners
          this.notifyAuthStateListeners(this.currentUser);
        } catch (error) {
          console.error("Error fetching user data:", error);
          this.currentUser = user;
          this.notifyAuthStateListeners(user);
        }
      } else {
        this.currentUser = null;
        this.userRole = null;
        this.userPermissions = [];
        this.notifyAuthStateListeners(null);
      }
    });
  }

  // Login with username/password (custom implementation)
  async login(credentials) {
    try {
      const { username, password, rememberMe = false } = credentials;

      // Find user by username in Firestore
      const userDoc = await this.findUserByUsername(username);

      if (!userDoc) {
        throw new Error("User not found");
      }

      // Use email for Firebase Auth (stored in Firestore)
      const userCredential = await signInWithEmailAndPassword(
        auth,
        userDoc.email,
        password
      );

      const user = userCredential.user;

      // Update last login time
      await this.updateLastLogin(user.uid);

      // Get complete user data
      const userData = await this.getUserData(user.uid);

      const completeUser = {
        ...user,
        ...userData,
        loginTime: new Date().toISOString(),
      };

      // Store in localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem("garment-erp-remember", "true");
      }

      return {
        success: true,
        user: completeUser,
        role: userData.role,
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: handleFirebaseError(error),
      };
    }
  }

  // Logout
  async logout() {
    try {
      // Clear local storage
      localStorage.removeItem("garment-erp-remember");
      localStorage.removeItem("garment-erp-language");
      localStorage.removeItem("garment-erp-offline-data");

      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return {
        success: false,
        error: handleFirebaseError(error),
      };
    }
  }

  // Find user by username
  async findUserByUsername(username) {
    try {
      const operatorsQuery = query(
        collection(db, COLLECTIONS.OPERATORS),
        where("username", "==", username)
      );

      const supervisorsQuery = query(
        collection(db, COLLECTIONS.SUPERVISORS),
        where("username", "==", username)
      );

      // Check operators first
      const operatorDocs = await getDocs(operatorsQuery);
      if (!operatorDocs.empty) {
        const doc = operatorDocs.docs[0];
        return { id: doc.id, ...doc.data(), role: USER_ROLES.OPERATOR };
      }

      // Check supervisors
      const supervisorDocs = await getDocs(supervisorsQuery);
      if (!supervisorDocs.empty) {
        const doc = supervisorDocs.docs[0];
        return { id: doc.id, ...doc.data(), role: USER_ROLES.SUPERVISOR };
      }

      // Check for management/admin users
      const usersQuery = query(
        collection(db, COLLECTIONS.USERS),
        where("username", "==", username)
      );

      const userDocs = await getDocs(usersQuery);
      if (!userDocs.empty) {
        const doc = userDocs.docs[0];
        return { id: doc.id, ...doc.data() };
      }

      return null;
    } catch (error) {
      console.error("Error finding user:", error);
      throw error;
    }
  }

  // Get user data from Firestore
  async getUserData(userId) {
    try {
      // Try operators collection first
      const operatorDoc = await getDoc(doc(db, COLLECTIONS.OPERATORS, userId));
      if (operatorDoc.exists()) {
        return {
          id: operatorDoc.id,
          ...operatorDoc.data(),
          role: USER_ROLES.OPERATOR,
        };
      }

      // Try supervisors collection
      const supervisorDoc = await getDoc(
        doc(db, COLLECTIONS.SUPERVISORS, userId)
      );
      if (supervisorDoc.exists()) {
        return {
          id: supervisorDoc.id,
          ...supervisorDoc.data(),
          role: USER_ROLES.SUPERVISOR,
        };
      }

      // Try users collection
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data(),
        };
      }

      return null;
    } catch (error) {
      console.error("Error getting user data:", error);
      throw error;
    }
  }

  // Update last login time
  async updateLastLogin(userId) {
    try {
      // Determine which collection to update
      const collections = [
        COLLECTIONS.OPERATORS,
        COLLECTIONS.SUPERVISORS,
        COLLECTIONS.USERS,
      ];

      for (const collectionName of collections) {
        const userDocRef = doc(db, collectionName, userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          await updateDoc(userDocRef, {
            lastLoginTime: serverTimestamp(),
            lastLoginIP: await this.getClientIP(),
          });
          break;
        }
      }
    } catch (error) {
      console.error("Error updating last login:", error);
      // Don't throw error as this is not critical
    }
  }

  // Get client IP (optional)
  async getClientIP() {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return "unknown";
    }
  }

  // Update user profile
  async updateUserProfile(updates) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user");
      }

      // Update Firebase Auth profile
      if (updates.displayName || updates.photoURL) {
        await updateProfile(user, {
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        });
      }

      // Update Firestore data
      const userDocRef = await this.getUserDocRef(user.uid);
      if (userDocRef) {
        await updateDoc(userDocRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating profile:", error);
      return {
        success: false,
        error: handleFirebaseError(error),
      };
    }
  }

  // Get user document reference
  async getUserDocRef(userId) {
    const collections = [
      COLLECTIONS.OPERATORS,
      COLLECTIONS.SUPERVISORS,
      COLLECTIONS.USERS,
    ];

    for (const collectionName of collections) {
      const userDocRef = doc(db, collectionName, userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        return userDocRef;
      }
    }

    return null;
  }

  // Change password
  async changePassword(newPassword) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("No authenticated user");
      }

      await updatePassword(user, newPassword);

      return { success: true };
    } catch (error) {
      console.error("Error changing password:", error);
      return {
        success: false,
        error: handleFirebaseError(error),
      };
    }
  }

  // Send password reset email
  async sendPasswordReset(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error("Error sending password reset:", error);
      return {
        success: false,
        error: handleFirebaseError(error),
      };
    }
  }

  // Check permissions
  hasPermission(permission) {
    return this.userPermissions.includes(permission);
  }

  // Check role
  hasRole(role) {
    return this.userRole === role;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get user role
  getUserRole() {
    return this.userRole;
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

  // Create initial demo users (run once during setup)
  async createDemoUsers() {
    try {
      // Demo operators
      const demoOperators = [
        {
          id: "operator1",
          name: "राम सिंह",
          username: "ram.singh",
          email: "ram.singh@garment-erp.com",
          machine: "overlock",
          skillLevel: "expert",
          station: "overlock-1",
          shift: "morning",
          permissions: ["view-own-work", "complete-work", "report-quality"],
          createdAt: serverTimestamp(),
        },
        {
          id: "operator2",
          name: "सीता देवी",
          username: "sita.devi",
          email: "sita.devi@garment-erp.com",
          machine: "flatlock",
          skillLevel: "expert",
          station: "flatlock-1",
          shift: "morning",
          permissions: ["view-own-work", "complete-work", "report-quality"],
          createdAt: serverTimestamp(),
        },
      ];

      // Demo supervisors
      const demoSupervisors = [
        {
          id: "supervisor1",
          name: "श्याम पोखरेल",
          username: "supervisor",
          email: "supervisor@garment-erp.com",
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
          createdAt: serverTimestamp(),
        },
      ];

      // Create operator documents
      for (const operator of demoOperators) {
        await setDoc(doc(db, COLLECTIONS.OPERATORS, operator.id), operator);
      }

      // Create supervisor documents
      for (const supervisor of demoSupervisors) {
        await setDoc(
          doc(db, COLLECTIONS.SUPERVISORS, supervisor.id),
          supervisor
        );
      }

      console.log("Demo users created successfully");
      return { success: true };
    } catch (error) {
      console.error("Error creating demo users:", error);
      return {
        success: false,
        error: handleFirebaseError(error),
      };
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
export { USER_ROLES };
