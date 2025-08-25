// clear_firestore_data.js
// Script to clear all Firestore data for fresh initialization

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} = require('firebase/firestore');

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
const db = getFirestore(app);

const COLLECTIONS = {
  OPERATORS: "operators",
  SUPERVISORS: "supervisors", 
  MANAGEMENT: "management",
  BUNDLES: "bundles",
  WORK_ASSIGNMENTS: "workAssignments",
  MACHINE_CONFIGS: "machineConfigs",
  PRODUCTION_STATS: "productionStats",
  SYSTEM_SETTINGS: "systemSettings",
  OPERATION_TYPES: "operationTypes",
  ARTICLE_TEMPLATES: "articleTemplates",
  LINE_STATUS: "lineStatus",
  DAILY_REPORTS: "dailyReports",
  NOTIFICATIONS: "notifications",
  QUALITY_ISSUES: "qualityIssues",
};

async function clearCollection(collectionName) {
  console.log(`🗑️  Clearing collection: ${collectionName}`);
  
  const snapshot = await getDocs(collection(db, collectionName));
  
  if (snapshot.empty) {
    console.log(`   ✅ Collection ${collectionName} is already empty`);
    return 0;
  }

  const batch = writeBatch(db);
  let count = 0;

  snapshot.forEach((docSnapshot) => {
    batch.delete(doc(db, collectionName, docSnapshot.id));
    count++;
  });

  await batch.commit();
  console.log(`   ✅ Deleted ${count} documents from ${collectionName}`);
  return count;
}

async function clearAllFirestoreData() {
  console.log("🚨 WARNING: This will delete ALL data from Firestore!");
  console.log("   This action cannot be undone.");
  console.log("");

  // Ask for confirmation (in a real scenario, you might want to add readline for user input)
  if (process.argv.includes('--force')) {
    console.log("🔄 Force flag detected, proceeding with data deletion...");
  } else {
    console.log("❌ To confirm deletion, run this script with the --force flag:");
    console.log("   npm run clear-firestore -- --force");
    console.log("   or");
    console.log("   node clear_firestore_data.js --force");
    return;
  }

  try {
    let totalDeleted = 0;
    
    console.log("🗑️  Starting Firestore data deletion...");
    
    // Clear all collections
    for (const collectionName of Object.values(COLLECTIONS)) {
      try {
        const deleted = await clearCollection(collectionName);
        totalDeleted += deleted;
      } catch (error) {
        console.log(`   ⚠️  Error clearing ${collectionName}:`, error.message);
      }
    }

    console.log("");
    console.log("✅ Firestore cleanup completed!");
    console.log(`📊 Total documents deleted: ${totalDeleted}`);
    console.log("");
    console.log("🎯 You can now run the initialization script:");
    console.log("   npm run init-firestore");

  } catch (error) {
    console.error("❌ Error clearing Firestore:", error);
    process.exit(1);
  }
}

// Run the cleanup
if (require.main === module) {
  clearAllFirestoreData()
    .then(() => {
      console.log("🏁 Cleanup script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Fatal error:", error);
      process.exit(1);
    });
}

module.exports = { clearAllFirestoreData };