// test_operator_service.js
// Test the OperatorService.getActiveOperators() function directly

const { initializeApp } = require('firebase/app');
const {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
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

// Replicate the exact getActiveOperators() function
async function testGetActiveOperators() {
  try {
    console.log('🔍 Testing OperatorService.getActiveOperators()...');
    
    const operatorsSnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.OPERATORS),
        orderBy("name", "asc")
      )
    );

    console.log(`📋 Raw snapshot size: ${operatorsSnapshot.size}`);

    const operators = operatorsSnapshot.docs
      .map((doc) => {
        const userData = doc.data();
        console.log(`\n--- Processing operator: ${userData.name} ---`);
        console.log(`Active field: ${userData.active}`);
        console.log(`Active !== false: ${userData.active !== false}`);
        
        const operator = {
          id: doc.id,
          username: userData.username,
          name: userData.name || userData.nameEn,
          nameNp: userData.nameNepali || userData.name,
          nameEn: userData.nameEn || userData.name,
          photo: userData.photo || '👨‍🏭',
          role: 'operator',
          station: userData.station,
          stationNp: userData.stationNp || userData.station,
          machine: userData.assignedMachine || (userData.machines && userData.machines[0]) || 'manual',
          machines: userData.assignedMachine ? [userData.assignedMachine] : userData.machines || ['manual'],
          skillLevel: userData.skillLevel || 'medium',
          efficiency: userData.efficiency || 75,
          currentLoad: userData.currentLoad || 0,
          maxLoad: userData.maxLoad || 5,
          status: userData.active !== false ? 'available' : 'inactive',
          active: userData.active !== false,
          createdAt: userData.createdAt?.toDate() || new Date()
        };
        
        console.log(`Final active status: ${operator.active}`);
        return operator;
      })
      .filter(operator => {
        console.log(`Filtering operator ${operator.name}: active=${operator.active}`);
        return operator.active;
      });

    console.log(`\n✅ Final operators count after filtering: ${operators.length}`);
    console.log('Sample operator:', operators[0]);

    return { success: true, operators };
  } catch (error) {
    console.error("❌ Test error:", error);
    return { success: false, error: error.message };
  }
}

// Run the test
if (require.main === module) {
  testGetActiveOperators()
    .then((result) => {
      console.log("\n🏁 Test completed");
      console.log('Final result:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Fatal error:", error);
      process.exit(1);
    });
}