// debug_work_item_status.js
// Check the actual status of work items being self-assigned

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  getDoc,
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
  BUNDLES: "bundles",
  WIP_ENTRIES: "wipEntries",
  WORK_ITEMS: "workItems",
};

async function checkWorkItemStatuses() {
  console.log("🔍 Checking work item statuses...");
  
  try {
    // Check bundles collection
    console.log("\n📦 BUNDLES Collection:");
    const bundlesSnapshot = await getDocs(query(collection(db, COLLECTIONS.BUNDLES), limit(10)));
    bundlesSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`  Bundle ${index + 1}: ID=${doc.id.slice(-6)}, Status=${data.status}, Machine=${data.machineType}, Assigned=${data.assignedOperator || 'None'}`);
    });

    // Check work items
    console.log("\n🏭 WORK ITEMS Collection:");
    const workItemsSnapshot = await getDocs(query(collection(db, COLLECTIONS.WORK_ITEMS), limit(10)));
    workItemsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`  Work Item ${index + 1}: ID=${doc.id.slice(-6)}, Status=${data.status}, Machine=${data.machineType || data.machine}, Operation=${data.currentOperation || data.operation}, Assigned=${data.assignedOperator || 'None'}`);
    });

    // Check specific IDs that were mentioned in console
    const specificIds = ['2hb3Tnib3NIe4bmXmkdm', 'WOs8xht6V1wlofks7wmn'];
    console.log("\n🎯 SPECIFIC ITEMS BEING ASSIGNED:");
    
    for (const itemId of specificIds) {
      try {
        // Try bundles first
        const bundleRef = doc(db, COLLECTIONS.BUNDLES, itemId);
        const bundleDoc = await getDoc(bundleRef);
        
        if (bundleDoc.exists()) {
          const data = bundleDoc.data();
          console.log(`  📦 Bundle ${itemId.slice(-6)}: Status=${data.status}, Machine=${data.machineType}, Available=${data.status === 'pending' ? 'YES' : 'NO'}`);
          continue;
        }
        
        // Try work items
        const workItemRef = doc(db, COLLECTIONS.WORK_ITEMS, itemId);
        const workItemDoc = await getDoc(workItemRef);
        
        if (workItemDoc.exists()) {
          const data = workItemDoc.data();
          console.log(`  🏭 Work Item ${itemId.slice(-6)}: Status=${data.status}, Machine=${data.machineType || data.machine}, Available=${['pending', 'ready'].includes(data.status) ? 'YES' : 'NO'}`);
        } else {
          console.log(`  ❌ Item ${itemId.slice(-6)}: Not found in either collection`);
        }
      } catch (error) {
        console.error(`  ❌ Error checking ${itemId.slice(-6)}:`, error.message);
      }
    }

    console.log("\n✅ Status check completed!");

  } catch (error) {
    console.error("❌ Error checking work item statuses:", error);
  }
}

// Run the check
if (require.main === module) {
  checkWorkItemStatuses()
    .then(() => {
      console.log("🏁 Debug script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Fatal error:", error);
      process.exit(1);
    });
}