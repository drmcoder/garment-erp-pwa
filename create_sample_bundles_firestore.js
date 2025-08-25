// Create Sample Bundles in Firestore - Run in browser console
// This will create the missing bundles in Firestore that are showing in localStorage

async function createSampleBundlesInFirestore() {
  console.log('🔥 CREATING SAMPLE BUNDLES IN FIRESTORE...');
  
  try {
    // Check if we can access Firebase from the app
    if (!window.firebase && !window.db) {
      console.log('❌ Firebase not accessible. Please run this in your app context.');
      console.log('💡 Alternative: Copy localStorage bundles to create manually in Firebase Console');
      
      // Show localStorage bundles for manual creation
      const bundleKeys = ['bundles', 'workItems', 'wipEntries', 'sampleBundles'];
      bundleKeys.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log(`📦 ${key} (${parsed.length} items):`);
              parsed.forEach((bundle, index) => {
                if (index < 3) { // Show first 3
                  console.log(`   ${bundle.id || bundle.bundleId}: ${bundle.bundleNumber || 'N/A'} - ${bundle.operation || bundle.currentOperation || 'N/A'}`);
                }
              });
              if (parsed.length > 3) console.log(`   ... and ${parsed.length - 3} more`);
            }
          } catch (e) {
            console.log(`⚠️ Could not parse ${key}`);
          }
        }
      });
      return;
    }
    
    // Sample bundles to create in Firestore
    const sampleBundles = [
      {
        id: 'B727970-w-DD-S',
        bundleId: 'B727970-w-DD-S',
        bundleNumber: 'B727970',
        article: 727970,
        articleNumber: 727970,
        articleName: 'Work Shirt',
        color: 'Dark Blue',
        colorCode: 'DD',
        size: 'S',
        pieces: 25,
        quantity: 25,
        rate: 3.5,
        totalValue: 87.5,
        priority: 'medium',
        status: 'pending',
        machineType: 'overlock',
        operation: 'shoulderJoin',
        currentOperation: 'shoulderJoin',
        assignedOperator: null,
        assignedLine: 'line-1',
        estimatedTime: 45,
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        department: 'sewing',
        shift: 'morning'
      },
      {
        id: 'B001-85-BL-XL',
        bundleId: 'B001-85-BL-XL',
        bundleNumber: 'B001',
        article: 8085,
        articleNumber: 8085,
        articleName: 'Polo T-Shirt',
        color: 'Blue',
        colorCode: 'BL',
        size: 'XL',
        pieces: 50,
        quantity: 50,
        rate: 2.5,
        totalValue: 125,
        priority: 'high',
        status: 'pending',
        machineType: 'overlock',
        operation: 'shoulderJoin',
        currentOperation: 'shoulderJoin',
        assignedOperator: null,
        assignedLine: 'line-1',
        estimatedTime: 60,
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        department: 'sewing',
        shift: 'morning'
      },
      {
        id: 'B002-33-GR-26',
        bundleId: 'B002-33-GR-26',
        bundleNumber: 'B002',
        article: 1033,
        articleNumber: 1033,
        articleName: 'Ladies Pants',
        color: 'Green',
        colorCode: 'GR',
        size: '26',
        pieces: 30,
        quantity: 30,
        rate: 3.0,
        totalValue: 90,
        priority: 'medium',
        status: 'pending',
        machineType: 'flatlock',
        operation: 'sideSeam',
        currentOperation: 'sideSeam',
        assignedOperator: null,
        assignedLine: 'line-1',
        estimatedTime: 45,
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        department: 'sewing',
        shift: 'morning'
      }
    ];
    
    // Add bundles from localStorage if available
    const localBundles = localStorage.getItem('bundles');
    if (localBundles) {
      try {
        const parsed = JSON.parse(localBundles);
        if (Array.isArray(parsed)) {
          parsed.forEach(bundle => {
            if (bundle.id && !sampleBundles.find(b => b.id === bundle.id)) {
              // Ensure bundle has required Firestore fields
              const firestoreBundle = {
                ...bundle,
                id: bundle.id || bundle.bundleId || `bundle_${Date.now()}`,
                bundleId: bundle.bundleId || bundle.id || `bundle_${Date.now()}`,
                status: bundle.status || 'pending',
                createdAt: bundle.createdAt || new Date().toISOString(),
                assignedOperator: bundle.assignedOperator || null,
                priority: bundle.priority || 'medium'
              };
              sampleBundles.push(firestoreBundle);
            }
          });
        }
      } catch (e) {
        console.log('⚠️ Could not parse localStorage bundles');
      }
    }
    
    console.log(`📦 Creating ${sampleBundles.length} bundles in Firestore...`);
    
    // This is pseudocode - you'll need to implement based on your Firebase setup
    console.log('🔥 Use this data to create bundles in Firebase Console:');
    console.log('1. Go to https://console.firebase.google.com/project/code-for-erp/firestore');
    console.log('2. Navigate to the "bundles" collection');
    console.log('3. Create documents with these IDs and data:');
    
    sampleBundles.forEach((bundle, index) => {
      console.log(`\n📋 Bundle ${index + 1}:`);
      console.log(`   Document ID: ${bundle.id}`);
      console.log(`   Data:`, JSON.stringify(bundle, null, 2));
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error creating sample bundles:', error);
  }
}

// Run the function
createSampleBundlesInFirestore();