import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your Firebase configuration
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
export const analytics = getAnalytics(app);

// Firestore Collections
export const COLLECTIONS = {
  OPERATORS: "operators",
  SUPERVISORS: "supervisors",
  BUNDLES: "bundles",
  NOTIFICATIONS: "notifications",
  QUALITY_ISSUES: "qualityIssues",
  WAGE_RECORDS: "wageRecords",
  PRODUCTION_STATS: "productionStats",
};

// Demo Users for Testing
export const DEMO_USERS = {
  OPERATORS: [
    {
      id: "op1",
      username: "ram.singh",
      password: "password123",
      name: "राम सिंह",
      machine: "overlock",
      station: "overlock-1",
      role: "operator",
    },
    {
      id: "op2",
      username: "sita.devi",
      password: "password123",
      name: "सीता देवी",
      machine: "flatlock",
      station: "flatlock-1",
      role: "operator",
    },
    {
      id: "op3",
      username: "hari.bahadur",
      password: "password123",
      name: "हरि बहादुर",
      machine: "singleNeedle",
      station: "single-needle-1",
      role: "operator",
    },
  ],
  SUPERVISORS: [
    {
      id: "sup1",
      username: "supervisor",
      password: "super123",
      name: "श्याम पोखरेल",
      department: "production",
      role: "supervisor",
    },
  ],
  MANAGEMENT: [
    {
      id: "mgmt1",
      username: "management",
      password: "mgmt123",
      name: "Management User",
      role: "management",
    },
  ],
};

export default app;
