// Cleanup script to remove specific problematic bundles from Firestore
// Run this script in browser console while logged in as admin

async function cleanupProblematicBundles() {
  console.log('🧹 CLEANING UP PROBLEMATIC BUNDLES...');
  
  const problematicBundleIds = [
    'B727970-w-DD-S',
    'B759524-43--4XL'
  ];
  
  // Get reference to Firebase (should be available if logged in)
  if (typeof window.firebase === 'undefined' && typeof window.db === 'undefined') {
    console.error('❌ Firebase not available. Make sure you are logged in to the app first.');
    return;
  }
  
  try {
    // Try to access db from global scope or firebase
    const db = window.db || window.firebase?.firestore();
    if (!db) {
      console.error('❌ Could not access Firestore. Make sure you are logged in.');
      return;
    }
    
    console.log('🔍 Searching for problematic bundles in Firestore...');
    
    for (const bundleId of problematicBundleIds) {
      try {
        console.log(`\n🔍 Checking bundle: ${bundleId}`);
        
        // Check if bundle exists in Firestore
        const bundleRef = db.collection('bundles').doc(bundleId);
        const bundleDoc = await bundleRef.get();
        
        if (bundleDoc.exists) {
          const bundleData = bundleDoc.data();
          console.log(`📋 Bundle ${bundleId} exists in Firestore:`, {
            status: bundleData.status,
            article: bundleData.article,
            machineType: bundleData.machineType,
            currentOperation: bundleData.currentOperation,
            assignedOperator: bundleData.assignedOperator
          });
          
          // Check if bundle has invalid data
          const hasValidStatus = bundleData.status && ['pending', 'ready', 'assigned', 'waiting', 'in-progress', 'completed'].includes(bundleData.status);
          const hasValidMachine = bundleData.machineType && bundleData.machineType.trim().length > 0;
          const hasValidOperation = bundleData.currentOperation && bundleData.currentOperation.trim().length > 0;
          
          if (!hasValidStatus || !hasValidMachine || !hasValidOperation) {
            console.log(`🚫 Bundle ${bundleId} has invalid data, marking for removal`);
            
            if (confirm(`Delete corrupted bundle ${bundleId}?\n\nData: ${JSON.stringify(bundleData, null, 2)}`)) {
              await bundleRef.delete();
              console.log(`✅ Deleted corrupted bundle: ${bundleId}`);
            } else {
              console.log(`⏭️ Skipped deletion of ${bundleId}`);
            }
          } else {
            console.log(`✅ Bundle ${bundleId} has valid data but may need status update`);
            
            // If status is assigned but no valid assignedOperator, mark as pending
            if (bundleData.status === 'assigned' && !bundleData.assignedOperator) {
              if (confirm(`Reset bundle ${bundleId} status from 'assigned' to 'pending'?\n\nIt has no assigned operator.`)) {
                await bundleRef.update({
                  status: 'pending',
                  assignedOperator: null,
                  assignedAt: null
                });
                console.log(`🔄 Reset bundle ${bundleId} to pending status`);
              }
            }
          }
        } else {
          console.log(`ℹ️ Bundle ${bundleId} does not exist in Firestore`);
        }
      } catch (error) {
        console.error(`❌ Error processing bundle ${bundleId}:`, error);
      }
    }
    
    console.log('\n✅ CLEANUP COMPLETED!');
    console.log('🔄 Please refresh the app to see changes');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    console.log('\n💡 Alternative: Try clearing browser cache and localStorage');
  }
}

// Auto-run with confirmation
if (confirm('🧹 CLEANUP PROBLEMATIC BUNDLES?\n\nThis will:\n✅ Search for bundles B727970-w-DD-S and B759524-43--4XL\n✅ Check their data validity\n✅ Remove or fix corrupted bundles\n\nMake sure you are logged in as admin.\n\nContinue?')) {
  cleanupProblematicBundles();
} else {
  console.log('ℹ️ Cleanup cancelled');
}