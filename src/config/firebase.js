// File: src/config/firebase.js (Updated Firebase config with Analytics fix)

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
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
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
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
};

// Your existing Firebase configuration
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

// Initialize Analytics only in production or when explicitly enabled
let analytics = null;
if (
  typeof window !== "undefined" &&
  (process.env.NODE_ENV === "production" ||
    process.env.REACT_APP_ENABLE_ANALYTICS === "true")
) {
  try {
    import("firebase/analytics")
      .then(({ getAnalytics }) => {
        analytics = getAnalytics(app);
        console.log("✅ Firebase Analytics initialized");
      })
      .catch((error) => {
        console.log("⚠️ Analytics not available:", error);
      });
  } catch (error) {
    console.log("⚠️ Analytics initialization failed:", error);
  }
} else {
  console.log("🔧 Analytics disabled in development");
}

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

// Rest of your existing Firebase configuration...
// (Keep all the COLLECTIONS, DEMO_USERS, etc. from the previous version)

export const COLLECTIONS = {
  OPERATORS: "operators",
  SUPERVISORS: "supervisors",
  MANAGEMENT: "management",
  BUNDLES: "bundles",
  WORK_ASSIGNMENTS: "workAssignments",
  QUALITY_ISSUES: "qualityIssues",
  NOTIFICATIONS: "notifications",
  PRODUCTION_STATS: "productionStats",
  WAGE_RECORDS: "wageRecords",
  SIZE_CONFIGS: "sizeConfigs",
  MACHINE_CONFIGS: "machineConfigs",
  ARTICLE_TEMPLATES: "articleTemplates",
  DAILY_REPORTS: "dailyReports",
  EFFICIENCY_LOGS: "efficiencyLogs",
  LINE_STATUS: "lineStatus",
};

// Demo Users for Development
export const DEMO_USERS = {
  OPERATORS: [
    {
      id: "op001",
      username: "ram.singh",
      password: "password123",
      name: "राम सिंह",
      nameEn: "Ram Singh",
      role: "operator",
      machine: "overlock",
      station: "स्टेसन-1",
      department: "sewing",
      shift: "morning",
      dailyTarget: 50,
      rate: 2.5,
      permissions: ["work_view", "work_update", "quality_report"],
    },
    {
      id: "op002",
      username: "sita.devi",
      password: "password123",
      name: "सीता देवी",
      nameEn: "Sita Devi",
      role: "operator",
      machine: "flatlock",
      station: "स्टेसन-2",
      department: "sewing",
      shift: "morning",
      dailyTarget: 50,
      rate: 2.5,
      permissions: ["work_view", "work_update", "quality_report"],
    },
    {
      id: "op003",
      username: "hari.bahadur",
      password: "password123",
      name: "हरि बहादुर",
      nameEn: "Hari Bahadur",
      role: "operator",
      machine: "singleNeedle",
      station: "स्टेसन-3",
      department: "sewing",
      shift: "morning",
      dailyTarget: 50,
      rate: 2.5,
      permissions: ["work_view", "work_update", "quality_report"],
    },
  ],
  SUPERVISORS: [
    {
      id: "sup001",
      username: "supervisor",
      password: "super123",
      name: "श्याम पोखरेल",
      nameEn: "Shyam Pokharel",
      role: "supervisor",
      department: "sewing",
      shift: "morning",
      permissions: ["all_view", "work_assign", "quality_manage", "report_view"],
    },
  ],
  MANAGEMENT: [
    {
      id: "mgmt001",
      username: "management",
      password: "mgmt123",
      name: "Management User",
      nameEn: "Management User",
      role: "management",
      department: "administration",
      permissions: ["admin", "all_view", "all_manage", "reports", "analytics"],
    },
  ],
};

// Sample Bundles for Development
export const SAMPLE_BUNDLES = [
  {
    id: "B001-85-BL-XL",
    bundleNumber: "B001",
    article: 8085,
    articleName: "Polo T-Shirt",
    color: "Blue",
    colorCode: "BL",
    sizes: ["XL"],
    quantity: 50,
    rate: 2.5,
    totalValue: 125,
    priority: "high",
    dueDate: "2024-01-15",
    status: "pending",
    machineType: "overlock",
    currentOperation: "shoulderJoin",
    assignedOperator: null,
    estimatedTime: 60,
  },
  {
    id: "B002-33-GR-26",
    bundleNumber: "B002",
    article: 1020,
    articleName: "Ladies Pants",
    color: "Green",
    colorCode: "GR",
    sizes: ["26"],
    quantity: 30,
    rate: 3.0,
    totalValue: 90,
    priority: "medium",
    dueDate: "2024-01-20",
    status: "pending",
    machineType: "flatlock",
    currentOperation: "sideSeam",
    assignedOperator: null,
    estimatedTime: 45,
  },
  {
    id: "B003-01-WH-4XL",
    bundleNumber: "B003",
    article: 9001,
    articleName: "Plus Size Shirt",
    color: "White",
    colorCode: "WH",
    sizes: ["4XL"],
    quantity: 25,
    rate: 4.0,
    totalValue: 100,
    priority: "medium",
    dueDate: "2024-01-25",
    status: "pending",
    machineType: "singleNeedle",
    currentOperation: "collar",
    assignedOperator: null,
    estimatedTime: 90,
  },
];

// Size Configurations
export const SIZE_CONFIGURATIONS = {
  "standard-shirt": {
    name: "Standard Shirt Sizes",
    nameNepali: "सामान्य शर्ट साइज",
    sizes: ["L", "XL", "2XL", "3XL"],
    category: "apparel",
    defaultSize: "XL",
  },
  "numeric-sizes": {
    name: "Numeric Sizes",
    nameNepali: "संख्यात्मक साइज",
    sizes: ["20", "22", "24", "26", "28", "30", "32"],
    category: "pants",
    defaultSize: "26",
  },
  "kids-sizes": {
    name: "Kids Sizes",
    nameNepali: "बालबालिकाका साइज",
    sizes: ["M", "L", "XL", "2XL"],
    category: "kids",
    defaultSize: "L",
  },
  "plus-sizes": {
    name: "Plus Sizes",
    nameNepali: "ठूला साइज",
    sizes: ["4XL", "5XL", "6XL", "7XL"],
    category: "plus",
    defaultSize: "4XL",
  },
  "free-size": {
    name: "Free Size",
    nameNepali: "फ्री साइज",
    sizes: ["FREE"],
    category: "accessories",
    defaultSize: "FREE",
  },
};

// Machine Type Configurations
export const MACHINE_TYPES = {
  overlock: {
    name: "Overlock Machine",
    nameNepali: "ओभरलक मेसिन",
    operations: ["shoulderJoin", "sideSeam", "sleeves"],
    avgSpeed: 45,
    efficiency: 85,
  },
  flatlock: {
    name: "Flatlock Machine",
    nameNepali: "फ्ल्याटलक मेसिन",
    operations: ["hemFold", "hemming", "finishing"],
    avgSpeed: 40,
    efficiency: 80,
  },
  singleNeedle: {
    name: "Single Needle Machine",
    nameNepali: "सिंगल निडल मेसिन",
    operations: ["collar", "waistband", "topStitch"],
    avgSpeed: 35,
    efficiency: 90,
  },
  buttonhole: {
    name: "Buttonhole Machine",
    nameNepali: "बटनहोल मेसिन",
    operations: ["buttonhole"],
    avgSpeed: 20,
    efficiency: 95,
  },
  buttonAttach: {
    name: "Button Attach Machine",
    nameNepali: "बटन जोड्ने मेसिन",
    operations: ["buttonAttach"],
    avgSpeed: 25,
    efficiency: 92,
  },
  iron: {
    name: "Iron Press",
    nameNepali: "इस्त्री प्रेस",
    operations: ["pressing", "finishing"],
    avgSpeed: 30,
    efficiency: 88,
  },
  cutting: {
    name: "Cutting Machine",
    nameNepali: "काट्ने मेसिन",
    operations: ["cutting"],
    avgSpeed: 50,
    efficiency: 95,
  },
};

export default app;

// ========================================

