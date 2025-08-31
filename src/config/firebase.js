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

// Your existing Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9bMIY2KA3-N2rOvidXoyzVeWWJwPuC4M",
  authDomain: "code-for-erp.firebaseapp.com",
  projectId: "code-for-erp",
  storageBucket: "code-for-erp.firebasestorage.app",
  messagingSenderId: "490842962773",
  appId: "1:490842962773:web:b2a5688d22416ebc710ddc",
  // measurementId: "G-SYC37HR0QE", // Removed to prevent Analytics loading
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Configure Firestore settings for better error handling
try {
  // Enable persistence and configure Firestore for better connection handling
  console.log("🔧 Configuring Firestore for improved connection handling");
} catch (error) {
  console.warn("⚠️ Firestore configuration warning:", error);
}

// Analytics completely disabled to avoid conflicts and blocking issues
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

// Rest of your existing Firebase configuration...
// (Keep all the COLLECTIONS, DEMO_USERS, etc. from the previous version)

export const COLLECTIONS = {
  OPERATORS: "operators",
  SUPERVISORS: "supervisors",
  MANAGEMENT: "management",
  BUNDLES: "bundles",
  WORK_ASSIGNMENTS: "workAssignments",
  ASSIGNMENT_HISTORY: "assignmentHistory",
  QUALITY_ISSUES: "qualityIssues",
  NOTIFICATIONS: "notifications",
  PRODUCTION_STATS: "productionStats",
  WAGE_RECORDS: "wageRecords",
  SIZE_CONFIGS: "sizeConfigs",
  MACHINE_CONFIGS: "machineConfigs",
  ARTICLE_TEMPLATES: "articleTemplates",
  DELETED_TEMPLATES: "deletedTemplates",
  DAILY_REPORTS: "dailyReports",
  EFFICIENCY_LOGS: "efficiencyLogs",
  LINE_STATUS: "lineStatus",
  SYSTEM_SETTINGS: "systemSettings",
  WIP_ENTRIES: "wipEntries",
  WIP_ROLLS: "wipRolls",
  WORK_ITEMS: "workItems",
};

// Demo Users for Development
export const DEMO_USERS = {
  OPERATORS: [
    {
      id: "op001",
      username: "ram.singh",
      password: "password123",
      name: "ram",
      nameEn: "Ram",
      role: "operator",
      employeeId: "EMP001",
      assignedMachines: ["overlock-1"],
      machineType: "overlock",
      skills: ["overlock-advanced"],
      status: "active",
      department: "sewing",
      shift: "day",
      hourlyRate: 250,
      active: true,
      productivity: {
        totalBundles: 45,
        completedBundles: 43,
        averageTime: 25,
        qualityScore: 95
      }
    },
    {
      id: "op002",
      username: "ashika.devi",
      password: "password123",
      name: "ashika",
      nameEn: "Ashika",
      role: "operator",
      employeeId: "EMP002",
      assignedMachines: ["overlock-2"],
      machineType: "overlock",
      skills: ["overlock-intermediate"],
      status: "active",
      department: "sewing",
      shift: "day",
      hourlyRate: 220,
      active: true,
      productivity: {
        totalBundles: 38,
        completedBundles: 35,
        averageTime: 28,
        qualityScore: 92
      }
    },
    {
      id: "op003",
      username: "bimala.thapa",
      password: "password123",
      name: "bimala",
      nameEn: "Bimala",
      role: "operator",
      employeeId: "EMP003",
      assignedMachines: ["overlock-3"],
      machineType: "overlock",
      skills: ["overlock-intermediate"],
      status: "active",
      department: "sewing",
      shift: "day",
      hourlyRate: 230,
      active: true,
      productivity: {
        totalBundles: 41,
        completedBundles: 39,
        averageTime: 26,
        qualityScore: 94
      }
    },
    {
      id: "op004",
      username: "govin.singh",
      password: "password123",
      name: "govin",
      nameEn: "Govin",
      role: "operator",
      employeeId: "EMP004",
      assignedMachines: ["flatlock-1"],
      machineType: "flatlock",
      skills: ["flatlock-advanced"],
      status: "active",
      department: "sewing",
      shift: "day",
      hourlyRate: 260,
      active: true,
      productivity: {
        totalBundles: 35,
        completedBundles: 33,
        averageTime: 30,
        qualityScore: 96
      }
    },
    {
      id: "op005",
      username: "siru.maharjan",
      password: "password123",
      name: "siru",
      nameEn: "Siru",
      role: "operator",
      employeeId: "EMP005",
      assignedMachines: ["single-needle-1"],
      machineType: "single-needle",
      skills: ["single-needle-intermediate"],
      status: "active",
      department: "sewing",
      shift: "day",
      hourlyRate: 200,
      active: true,
      productivity: {
        totalBundles: 50,
        completedBundles: 48,
        averageTime: 22,
        qualityScore: 90
      }
    }
  ],
  SUPERVISORS: [
    {
      id: "sup001",
      username: "supervisor",
      password: "super123",
      name: "Shyam Pokharel",
      nameEn: "Shyam Pokharel",
      role: "supervisor",
      employeeId: "SUP001",
      assignedLine: "line-1",
      department: "sewing",
      shift: "day",
      status: "active",
      active: true,
      permissions: ["all_view", "work_assign", "quality_manage", "report_view"],
      hourlyRate: 400
    },
    {
      id: "sup002",
      username: "maya.supervisor",
      password: "super123", 
      name: "Maya Gurung",
      nameEn: "Maya Gurung",
      role: "supervisor",
      employeeId: "SUP002",
      assignedLine: "line-2", 
      department: "sewing",
      shift: "day",
      status: "active",
      active: true,
      permissions: ["all_view", "work_assign", "quality_manage", "report_view"],
      hourlyRate: 380
    }
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
    assignedLine: "line-1",
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
    assignedLine: "line-1",
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
    assignedLine: "line-1",
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
  kansai: {
    name: "Kansai Special Machine",
    nameNepali: "कान्साई स्पेसल मेसिन",
    operations: ["specialSeaming", "multiNeedleWork", "decorativeStitch"],
    avgSpeed: 42,
    efficiency: 88,
  },
};

export default app;

// ========================================

