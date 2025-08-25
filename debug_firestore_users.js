// debug_firestore_users.js
// Script to check what users are actually in Firestore

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
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
};

async function checkFirestoreUsers() {
  console.log("🔍 Checking users in Firestore...");
  
  try {
    // Check operators
    console.log("\n👷 OPERATORS:");
    const operatorsSnapshot = await getDocs(collection(db, COLLECTIONS.OPERATORS));
    operatorsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ID: ${doc.id} | Username: ${data.username} | Name: ${data.name} | Role: ${data.role || 'operator'}`);
    });

    // Check supervisors  
    console.log("\n👨‍💼 SUPERVISORS:");
    const supervisorsSnapshot = await getDocs(collection(db, COLLECTIONS.SUPERVISORS));
    supervisorsSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ID: ${doc.id} | Username: ${data.username} | Name: ${data.name} | Role: ${data.role || 'supervisor'}`);
    });

    // Check management
    console.log("\n🏢 MANAGEMENT:");
    const managementSnapshot = await getDocs(collection(db, COLLECTIONS.MANAGEMENT));
    managementSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ID: ${doc.id} | Username: ${data.username} | Name: ${data.name} | Role: ${data.role || 'manager'}`);
    });

    console.log("\n✅ Firestore user check completed!");

  } catch (error) {
    console.error("❌ Error checking Firestore users:", error);
  }
}

// Run the check
if (require.main === module) {
  checkFirestoreUsers()
    .then(() => {
      console.log("🏁 Debug script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Fatal error:", error);
      process.exit(1);
    });
}