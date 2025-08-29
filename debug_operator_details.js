// debug_operator_details.js
// Script to check detailed operator data structure

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
};

async function checkOperatorDetails() {
  console.log("🔍 Checking operator details in Firestore...");
  
  try {
    const operatorsSnapshot = await getDocs(collection(db, COLLECTIONS.OPERATORS));
    
    console.log(`\n👷 Found ${operatorsSnapshot.size} operators:`);
    
    operatorsSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n--- Operator ${index + 1} ---`);
      console.log(`ID: ${doc.id}`);
      console.log(`Username: ${data.username}`);
      console.log(`Name: ${data.name}`);
      console.log(`Active: ${data.active}`);
      console.log(`AssignedMachine: ${data.assignedMachine}`);
      console.log(`Machines: ${JSON.stringify(data.machines)}`);
      console.log(`Station: ${data.station}`);
      console.log(`Role: ${data.role}`);
      console.log(`All fields:`, Object.keys(data).sort());
    });

    console.log("\n✅ Operator details check completed!");

  } catch (error) {
    console.error("❌ Error checking operator details:", error);
  }
}

// Run the check
if (require.main === module) {
  checkOperatorDetails()
    .then(() => {
      console.log("🏁 Debug script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Fatal error:", error);
      process.exit(1);
    });
}