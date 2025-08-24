// Clear all localStorage data - run in browser console
function clearAllLocalStorage() {
  console.log('🗑️ CLEARING ALL LOCALSTORAGE DATA...');
  
  // List of keys to clear
  const keysToRemove = [
    'bundles',
    'workItems', 
    'wipEntries',
    'wipData',
    'productionData',
    'sampleBundles',
    'customOperationsSequence',
    'assignmentHistory',
    'bundleData',
    'users',
    'roundNeckTshirtProcess'
  ];
  
  // Clear specific keys
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`❌ Removing ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  // Also clear any remaining items
  const remainingKeys = Object.keys(localStorage);
  if (remainingKeys.length > 0) {
    console.log(`🧹 Clearing ${remainingKeys.length} remaining items:`, remainingKeys);
    localStorage.clear();
  }
  
  console.log('✅ LocalStorage cleared completely');
  console.log('🔄 Now the system will fetch only from Firestore');
  
  // Reload page to reset state
  if (window.confirm('LocalStorage cleared! Reload page to refresh the application?')) {
    window.location.reload();
  }
}

// Run if in browser
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  clearAllLocalStorage();
} else {
  console.log('⚠️ This script needs to run in a browser environment');
  console.log('📖 Copy and paste this function in browser console');
}