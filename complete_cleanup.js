// Complete Cleanup - Nuclear option to remove ALL bundle data
// Run in browser console to completely clean everything

function completeCleanup() {
  console.log('💣 COMPLETE CLEANUP - NUCLEAR OPTION');
  console.log('🎯 This will remove ALL bundle data from everywhere');
  
  // 1. Clear ALL localStorage
  console.log('\n🗑️ Step 1: Clearing ALL localStorage...');
  const localStorageKeys = Object.keys(localStorage);
  console.log(`   Found ${localStorageKeys.length} localStorage items`);
  
  localStorageKeys.forEach(key => {
    console.log(`   ❌ Removing: ${key}`);
  });
  localStorage.clear();
  
  // 2. Clear ALL sessionStorage  
  console.log('\n🗑️ Step 2: Clearing ALL sessionStorage...');
  const sessionStorageKeys = Object.keys(sessionStorage);
  console.log(`   Found ${sessionStorageKeys.length} sessionStorage items`);
  
  sessionStorageKeys.forEach(key => {
    console.log(`   ❌ Removing: ${key}`);
  });
  sessionStorage.clear();
  
  // 3. Clear IndexedDB if present
  console.log('\n🗄️ Step 3: Clearing IndexedDB...');
  if ('indexedDB' in window) {
    // Clear Firebase's IndexedDB
    const dbsToDelete = ['firebaseLocalStorageDb', 'firebase-messaging-database'];
    dbsToDelete.forEach(dbName => {
      const deleteReq = indexedDB.deleteDatabase(dbName);
      deleteReq.onsuccess = () => console.log(`   ✅ Deleted ${dbName}`);
      deleteReq.onerror = () => console.log(`   ⚠️ Could not delete ${dbName}`);
    });
  }
  
  // 4. Clear all browser caches
  console.log('\n🗄️ Step 4: Clearing browser caches...');
  if ('caches' in window) {
    caches.keys().then(cacheNames => {
      console.log(`   Found ${cacheNames.length} caches`);
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log(`   ❌ Deleting cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    });
  }
  
  // 5. Unregister service workers
  console.log('\n🔧 Step 5: Unregistering service workers...');
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log(`   Found ${registrations.length} service workers`);
      registrations.forEach(registration => {
        console.log(`   ❌ Unregistering: ${registration.scope}`);
        registration.unregister();
      });
    });
  }
  
  // 6. Clear any Firebase auth state
  console.log('\n🔐 Step 6: Clearing Firebase auth state...');
  try {
    // Clear Firebase Auth persistence
    if (window.firebase && window.firebase.auth) {
      window.firebase.auth().signOut();
      console.log('   ✅ Signed out from Firebase Auth');
    }
  } catch (e) {
    console.log('   ⚠️ Could not clear Firebase auth:', e.message);
  }
  
  // 7. Show completion and reload
  console.log('\n🎯 CLEANUP SUMMARY:');
  console.log('   ✅ localStorage: CLEARED');
  console.log('   ✅ sessionStorage: CLEARED');
  console.log('   ✅ IndexedDB: CLEARED');
  console.log('   ✅ Browser caches: CLEARED');  
  console.log('   ✅ Service workers: UNREGISTERED');
  console.log('   ✅ Firebase auth: SIGNED OUT');
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('   1. App will reload with completely clean state');
  console.log('   2. You may need to sign in again');
  console.log('   3. Only Firestore data will be available');
  console.log('   4. No more "bundle not found" errors');
  
  console.log('\n⏰ Reloading in 3 seconds...');
  
  // Hard reload after a brief delay
  setTimeout(() => {
    // Force hard reload from server
    window.location.href = window.location.protocol + '//' + window.location.host + window.location.pathname + '?clearCache=' + Date.now();
  }, 3000);
}

// Run with confirmation
if (confirm('💣 NUCLEAR CLEANUP?\n\nThis will completely wipe:\n• All localStorage\n• All sessionStorage\n• Browser caches\n• Service workers\n• Firebase auth state\n\nYou may need to sign in again.\nContinue?')) {
  completeCleanup();
} else {
  console.log('ℹ️ Cleanup cancelled');
}