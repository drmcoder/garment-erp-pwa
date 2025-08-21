// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9bMIY2KA3-N2rOvidXoyzVeWWJwPuC4M",
  authDomain: "code-for-erp.firebaseapp.com",
  projectId: "code-for-erp",
  storageBucket: "code-for-erp.firebasestorage.app",
  messagingSenderId: "490842962773",
  appId: "1:490842962773:web:b2a5688d22416ebc710ddc",
  measurementId: "G-SYC37HR0QE",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

// Initialize Firebase Cloud Messaging
let messaging = null;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    messaging = getMessaging(app);
  } catch (error) {
    console.log("Firebase messaging not supported:", error);
  }
}
export { messaging };

// Connect to emulators in development (optional)
if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  const connectToEmulators = () => {
    try {
      // Only connect once
      if (!auth._delegate._config.emulator) {
        connectAuthEmulator(auth, "http://localhost:9099");
      }
      if (!db._delegate._databaseId.projectId.includes("localhost")) {
        connectFirestoreEmulator(db, "localhost", 8080);
      }
      if (!storage._delegate._host.includes("localhost")) {
        connectStorageEmulator(storage, "localhost", 9199);
      }
    } catch (error) {
      console.log(
        "Emulator connection error (this is normal if emulators are not running):",
        error.message
      );
    }
  };

  // Uncomment the line below if you're using Firebase emulators for development
  // connectToEmulators();
}

// Firestore Collections
export const COLLECTIONS = {
  USERS: "users",
  OPERATORS: "operators",
  SUPERVISORS: "supervisors",
  BUNDLES: "bundles",
  LOTS: "lots",
  WORK_ASSIGNMENTS: "workAssignments",
  QUALITY_ISSUES: "qualityIssues",
  NOTIFICATIONS: "notifications",
  PRODUCTION_STATS: "productionStats",
  MACHINE_STATUS: "machineStatus",
  PROCESS_TEMPLATES: "processTemplates",
  WIP_DATA: "wipData",
  WAGE_RECORDS: "wageRecords",
  SETTINGS: "settings",
};

// Firebase Cloud Messaging setup
export const requestNotificationPermission = async () => {
  if (!messaging) {
    console.log("Messaging not supported");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("Notification permission granted.");

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: process.env.REACT_APP_VAPID_KEY, // You'll need to add this to .env
      });

      if (token) {
        console.log("FCM Token:", token);
        return token;
      } else {
        console.log("No registration token available.");
        return null;
      }
    } else {
      console.log("Unable to get permission to notify.");
      return null;
    }
  } catch (error) {
    console.error("An error occurred while retrieving token:", error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = () => {
  if (!messaging) {
    return Promise.reject("Messaging not supported");
  }

  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("Message received in foreground:", payload);
      resolve(payload);
    });
  });
};

// Firestore security rules helper
export const SECURITY_RULES = {
  // Users can only read/write their own data
  USER_OWNS_DOCUMENT: (userId) => `auth != null && auth.uid == '${userId}'`,

  // Operators can only see their assigned work
  OPERATOR_ACCESS: (operatorId) =>
    `auth != null && resource.data.assignedTo == '${operatorId}'`,

  // Supervisors can see all data in their department
  SUPERVISOR_ACCESS: (department) =>
    `auth != null && auth.token.role == 'supervisor' && auth.token.department == '${department}'`,

  // Management can see everything
  MANAGEMENT_ACCESS: () =>
    `auth != null && auth.token.role in ['management', 'admin']`,
};

// Firebase initialization status
export const isFirebaseInitialized = () => {
  return !!app && !!auth && !!db;
};

// Error handling helper
export const handleFirebaseError = (error) => {
  console.error("Firebase Error:", error);

  // Common Firebase error codes and user-friendly messages
  const errorMessages = {
    "auth/user-not-found": "User not found. Please check your credentials.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/too-many-requests":
      "Too many failed attempts. Please try again later.",
    "auth/network-request-failed":
      "Network error. Please check your internet connection.",
    "firestore/permission-denied":
      "You do not have permission to perform this action.",
    "firestore/unavailable":
      "Service temporarily unavailable. Please try again.",
    "storage/unauthorized": "You do not have permission to access this file.",
    "storage/quota-exceeded": "Storage quota exceeded.",
  };

  return (
    errorMessages[error.code] ||
    error.message ||
    "An unexpected error occurred."
  );
};

// Batch operations helper
export const createBatch = () => {
  const { writeBatch } = require("firebase/firestore");
  return writeBatch(db);
};

// Timestamp helper
export const getServerTimestamp = () => {
  const { serverTimestamp } = require("firebase/firestore");
  return serverTimestamp();
};

// Array operations helpers
export const arrayUnion = (...elements) => {
  const { arrayUnion: fbArrayUnion } = require("firebase/firestore");
  return fbArrayUnion(...elements);
};

export const arrayRemove = (...elements) => {
  const { arrayRemove: fbArrayRemove } = require("firebase/firestore");
  return fbArrayRemove(...elements);
};

// Increment helper
export const increment = (value) => {
  const { increment: fbIncrement } = require("firebase/firestore");
  return fbIncrement(value);
};

export default app;
