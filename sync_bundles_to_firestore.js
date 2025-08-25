// Sync LocalStorage Bundles to Firestore - Run this in your app's browser console

async function syncBundlesToFirestore() {
  console.log('🔄 SYNCING LOCALSTORAGE BUNDLES TO FIRESTORE...');
  
  try {
    // Check if we have access to Firebase services
    const firebaseServices = window.FirebaseService || window.firebaseServices;
    
    if (!firebaseServices && !window.db) {
      console.log('❌ Firebase services not available in window context');
      console.log('💡 Try running this on a page where Firebase is imported');
      return;
    }
    
    // Get bundles from localStorage
    const bundleKeys = ['bundles', 'workItems', 'sampleBundles'];
    const allBundles = [];
    
    bundleKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            parsed.forEach(bundle => {
              // Avoid duplicates
              const exists = allBundles.find(b => 
                (b.id && b.id === bundle.id) || 
                (b.bundleId && b.bundleId === bundle.bundleId)
              );
              if (!exists) {
                allBundles.push(bundle);
              }
            });
          }
        } catch (e) {
          console.log(`⚠️ Could not parse ${key}`);
        }
      }
    });
    
    console.log(`📦 Found ${allBundles.length} unique bundles in localStorage`);
    
    // Prepare bundles for Firestore
    const firestoreBundles = allBundles.map(bundle => {
      const bundleId = bundle.id || bundle.bundleId || `bundle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return {
        ...bundle,
        id: bundleId,
        bundleId: bundleId,
        status: bundle.status || 'pending',
        createdAt: bundle.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        assignedOperator: bundle.assignedOperator || null,
        priority: bundle.priority || 'medium',
        // Ensure required fields exist
        bundleNumber: bundle.bundleNumber || bundle.id || 'UNKNOWN',
        articleName: bundle.articleName || bundle.article || 'Unknown Article',
        pieces: bundle.pieces || bundle.quantity || 1,
        quantity: bundle.quantity || bundle.pieces || 1,
        operation: bundle.operation || bundle.currentOperation || 'unknown',
        currentOperation: bundle.currentOperation || bundle.operation || 'unknown',
        machineType: bundle.machineType || 'overlock',
        rate: bundle.rate || 2.5,
        estimatedTime: bundle.estimatedTime || 30
      };
    });
    
    console.log('\n🎯 BUNDLES TO SYNC:');
    firestoreBundles.forEach((bundle, index) => {
      console.log(`${index + 1}. ${bundle.id}: ${bundle.bundleNumber} - ${bundle.operation}`);
    });
    
    // Show the data that needs to be created manually
    console.log('\n📋 MANUAL FIRESTORE CREATION:');
    console.log('Go to: https://console.firebase.google.com/project/code-for-erp/firestore');
    console.log('Collection: bundles');
    console.log('\nBundles to create:');
    
    firestoreBundles.forEach((bundle, index) => {
      if (index < 5) { // Show first 5 bundles
        console.log(`\n--- Bundle ${index + 1} ---`);
        console.log(`Document ID: ${bundle.id}`);
        console.log('Data:', JSON.stringify(bundle, null, 2));
      }
    });
    
    if (firestoreBundles.length > 5) {
      console.log(`\n... and ${firestoreBundles.length - 5} more bundles`);
    }
    
    // Create a downloadable JSON file with all bundles
    const dataStr = JSON.stringify(firestoreBundles, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bundles_for_firestore.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('\n💾 Downloaded "bundles_for_firestore.json" - you can import this into Firestore');
    
    // Clear localStorage after successful sync preparation
    if (confirm('Clear localStorage now that bundle data is prepared for Firestore?')) {
      bundleKeys.forEach(key => localStorage.removeItem(key));
      console.log('✅ LocalStorage cleared');
    }
    
  } catch (error) {
    console.error('❌ Error syncing bundles:', error);
  }
}

// Run the sync
syncBundlesToFirestore();