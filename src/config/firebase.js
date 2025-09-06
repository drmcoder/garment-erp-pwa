// Firebase Configuration
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";

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

// Set auth persistence
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Auth persistence setup failed:", error);
});

// Initialize Firebase Cloud Messaging
let messaging = null;
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  try {
    isMessagingSupported()
      .then((supported) => {
        if (supported) {
          messaging = getMessaging(app);
          console.log("✅ Firebase Messaging initialized");
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

// Analytics disabled
export const analytics = null;

// Firestore Collections Configuration
export const COLLECTIONS = {
  OPERATORS: "operators",
  SUPERVISORS: "supervisors", 
  MANAGEMENT: "management",
  BUNDLES: "bundles",
  WORK_ASSIGNMENTS: "workAssignments",
  WORK_ITEMS: "workItems",
  WORK_COMPLETIONS: "workCompletions",
  WIP_ENTRIES: "wipEntries",
  WIP_ROLLS: "wipRolls",
  ASSIGNMENT_HISTORY: "assignmentHistory",
  QUALITY_ISSUES: "qualityIssues",
  NOTIFICATIONS: "notifications",
  DAILY_REPORTS: "dailyReports",
  PRODUCTION_STATS: "productionStats",
  EFFICIENCY_LOGS: "efficiencyLogs",
  SIZE_CONFIGS: "sizeConfigs",
  MACHINE_CONFIGS: "machineConfigs",
  ARTICLE_TEMPLATES: "articleTemplates",
  DELETED_TEMPLATES: "deletedTemplates",
  SYSTEM_SETTINGS: "systemSettings",
  WAGE_RECORDS: "wageRecords",
  LINE_STATUS: "lineStatus",
};

// Export all Firestore functions
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
  runTransaction
} from "firebase/firestore";

// Export auth functions
export {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

export default app;