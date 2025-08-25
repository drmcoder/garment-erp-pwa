// Clear LocalStorage and Start Fresh - Run in browser console
// This will remove all localStorage data and reload the app to use only Firestore

function clearAndStartFresh() {
  console.log('🧹 CLEARING LOCALSTORAGE AND STARTING FRESH...');
  
  // List what we're about to clear
  const allKeys = Object.keys(localStorage);
  console.log('📊 Current localStorage items:', allKeys.length);
  
  if (allKeys.length > 0) {
    console.log('🗑️ Items to be cleared:');
    allKeys.forEach((key, index) => {
      const value = localStorage.getItem(key);
      const size = value ? `${Math.round(value.length / 1024)}KB` : 'N/A';
      console.log(`   ${index + 1}. ${key} (${size})`);
    });
  }
  
  // Clear specific bundle-related keys first
  const bundleKeys = [
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
  
  console.log('\n🎯 Clearing bundle-related data...');
  bundleKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`❌ Removing ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  // Clear any remaining items
  const remainingKeys = Object.keys(localStorage);
  if (remainingKeys.length > 0) {
    console.log(`\n🧹 Clearing ${remainingKeys.length} remaining items:`, remainingKeys);
    localStorage.clear();
  }
  
  // Also clear sessionStorage
  console.log('🧹 Clearing sessionStorage...');
  sessionStorage.clear();
  
  // Clear any browser cache/service worker if present
  if ('serviceWorker' in navigator) {
    console.log('🔧 Clearing service workers...');
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  }
  
  // Clear browser cache (if possible)
  if ('caches' in window) {
    console.log('🗄️ Clearing browser caches...');
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
      });
    });
  }
  
  console.log('\n✅ ALL DATA CLEARED!');
  console.log('🔄 The app will now use ONLY Firestore data');
  console.log('🎯 Benefits:');
  console.log('   - No more "bundle not found" errors');
  console.log('   - Real-time sync with Firestore');
  console.log('   - Consistent data across all users');
  console.log('   - No localStorage conflicts');
  
  console.log('\n🚀 Reloading application...');
  
  // Force a hard reload to clear all cached data
  if (window.location.reload) {
    window.location.reload(true); // Force reload from server
  } else {
    window.location.href = window.location.href;
  }
}

// Show confirmation before clearing
if (confirm('🧹 CLEAR ALL LOCALSTORAGE & START FRESH?\n\nThis will:\n✅ Remove all localStorage data\n✅ Clear browser cache\n✅ Reload the app\n✅ Use only Firestore data\n\nContinue?')) {
  clearAndStartFresh();
} else {
  console.log('ℹ️ Clear operation cancelled');
}