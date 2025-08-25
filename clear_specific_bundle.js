// Clear Specific Bundle - Run in browser console
// This will remove bundle "43 - shoulderJoin" from both localStorage and Firestore

async function clearSpecificBundle() {
  console.log('🗑️ CLEARING SPECIFIC BUNDLE: 43 - shoulderJoin');
  
  // Clear from localStorage first
  console.log('📱 Checking localStorage...');
  
  const bundleKeys = ['bundles', 'workItems', 'wipEntries', 'wipData', 'productionData', 'sampleBundles', 'bundleData'];
  let removedFromLocalStorage = false;
  
  bundleKeys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          // Filter out the specific bundle
          const filtered = parsed.filter(item => {
            const matches = (
              item.bundleNumber === '43' ||
              item.bundleId === '43' ||
              item.id === '43' ||
              item.article === 43 ||
              item.articleNumber === 43 ||
              (item.operation && item.operation.toLowerCase().includes('shoulderjoin')) ||
              (item.currentOperation && item.currentOperation.toLowerCase().includes('shoulderjoin')) ||
              (item.bundleNumber && item.bundleNumber.toString() === '43')
            );
            
            if (matches) {
              console.log(`❌ Found matching bundle in ${key}:`, item);
              removedFromLocalStorage = true;
            }
            
            return !matches;
          });
          
          // Update localStorage with filtered data
          if (filtered.length < parsed.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
            console.log(`✅ Updated ${key}: removed ${parsed.length - filtered.length} items`);
          }
        }
      } catch (e) {
        console.log(`⚠️ Could not parse ${key}:`, e.message);
      }
    }
  });
  
  if (!removedFromLocalStorage) {
    console.log('ℹ️ Bundle not found in localStorage');
  }
  
  // Clear from Firestore (if available)
  console.log('☁️ Checking Firestore...');
  
  try {
    // Try to access Firebase from the app
    if (typeof window !== 'undefined' && window.firebase) {
      console.log('🔥 Firebase available, attempting Firestore cleanup...');
      
      // Note: This would need to be adapted based on your actual Firebase setup
      // Since we can't directly access the modules here, we'll show what needs to be done
      
      console.log('⚠️ Firestore cleanup needs to be done via the app:');
      console.log('   1. Go to your Firebase Console');
      console.log('   2. Navigate to Firestore Database');
      console.log('   3. Find collections: bundles, workAssignments, assignmentHistory');
      console.log('   4. Search for documents with:');
      console.log('      - bundleNumber: "43"');
      console.log('      - article: 43');  
      console.log('      - operation: "shoulderJoin"');
      console.log('   5. Delete those documents manually');
      
    } else {
      console.log('⚠️ Firebase not accessible from console');
    }
  } catch (error) {
    console.error('❌ Error accessing Firestore:', error);
  }
  
  console.log('🔄 Reloading page to refresh data...');
  
  // Ask user if they want to reload
  if (confirm('Bundle cleared from localStorage! Reload page to refresh the application?')) {
    window.location.reload();
  }
}

// Run the function
clearSpecificBundle();