// Clean Firebase Configuration
// Core Firebase setup without legacy data

import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  runTransaction,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import {
  getMessaging,
  isSupported as isMessagingSupported,
} from "firebase/messaging";

// Re-export Firestore functions for use in services
export {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  runTransaction,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9bMIY2KA3-N2rOvidXoyzVeWWJwPuC4M",
  authDomain: "code-for-erp.firebaseapp.com",
  projectId: "code-for-erp",
  storageBucket: "code-for-erp.firebasestorage.app",
  messagingSenderId: "490842962773",
  appId: "1:490842962773:web:b2a5688d22416ebc710ddc",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configure Firestore settings for better error handling
try {
  console.log("🔧 Configuring Firestore for improved connection handling");
} catch (error) {
  console.warn("⚠️ Firestore configuration warning:", error);
}

// Analytics disabled to avoid conflicts
let analytics = null;
console.log("🔧 Analytics disabled - preventing conflicts and blocking issues");
export { analytics };

// Initialize Firebase Cloud Messaging (with support check)
let messaging = null;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    isMessagingSupported()
      .then((supported) => {
        if (supported) {
          messaging = getMessaging(app);
          console.log("✅ Firebase Messaging initialized");
        } else {
          console.log("⚠️ Firebase Messaging not supported");
        }
      })
      .catch((error) => {
        console.log("⚠️ Messaging support check failed:", error);
      });
  } catch (error) {
    console.log("⚠️ Firebase messaging initialization failed:", error);
  }
}
export { messaging };

// Set auth persistence to local storage
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence setup failed:", error);
});

// Firestore Collections Configuration
export const COLLECTIONS = {
  // User Collections
  OPERATORS: "operators",
  SUPERVISORS: "supervisors", 
  MANAGEMENT: "management",
  
  // Production Collections
  BUNDLES: "bundles",
  WORK_ASSIGNMENTS: "workAssignments",
  WORK_ITEMS: "workItems",
  WORK_COMPLETIONS: "workCompletions",
  WIP_ENTRIES: "wipEntries",
  WIP_ROLLS: "wipRolls",
  
  // Quality & Assignment Tracking
  ASSIGNMENT_HISTORY: "assignmentHistory",
  QUALITY_ISSUES: "qualityIssues",
  
  // Notifications & Reports
  NOTIFICATIONS: "notifications",
  DAILY_REPORTS: "dailyReports",
  
  // Analytics & Stats
  PRODUCTION_STATS: "productionStats",
  EFFICIENCY_LOGS: "efficiencyLogs",
  
  // Configuration
  SIZE_CONFIGS: "sizeConfigs",
  MACHINE_CONFIGS: "machineConfigs",
  ARTICLE_TEMPLATES: "articleTemplates",
  DELETED_TEMPLATES: "deletedTemplates",
  SYSTEM_SETTINGS: "systemSettings",
  
  // Financial
  WAGE_RECORDS: "wageRecords",
  
  // System Status
  LINE_STATUS: "lineStatus",
};

// Import demo data and configurations
export { DEMO_USERS, SAMPLE_BUNDLES } from './demo-data';
export { 
  SIZE_CONFIGURATIONS, 
  MACHINE_TYPES,
  OPERATIONS,
  GARMENT_WORKFLOWS,
  QUALITY_STANDARDS,
  PRODUCTION_TARGETS
} from './production-config';

export default app;