// Script to clear all application data including any cached bundle_001 references
// Run this in the browser console to clear all localStorage data

console.log('🗑️ CLEARING ALL APPLICATION DATA INCLUDING bundle_001 REFERENCES');

// Clear all localStorage data
const keysToKeep = ['language', 'auth_user']; // Keep authentication and language settings
const allKeys = Object.keys(localStorage);

allKeys.forEach(key => {
  if (!keysToKeep.includes(key)) {
    localStorage.removeItem(key);
    console.log(`Removed: ${key}`);
  }
});

// Clear specific items that might contain bundle_001
const itemsToCheck = ['workItems', 'bundles', 'availableWork', 'assignmentHistory', 'operatorWork'];
itemsToCheck.forEach(key => {
  localStorage.removeItem(key);
  console.log(`Cleared ${key} to remove any bundle_001 references`);
});

// Clear all sessionStorage
sessionStorage.clear();

// Clear any currentWork from AuthContext
const authUser = localStorage.getItem('auth_user');
if (authUser) {
  try {
    const user = JSON.parse(authUser);
    if (user.currentWork && user.currentWork.bundleId === 'bundle_001') {
      user.currentWork = null;
      localStorage.setItem('auth_user', JSON.stringify(user));
      console.log('Cleared bundle_001 reference from auth_user currentWork');
    }
  } catch (e) {
    console.warn('Could not parse auth_user data:', e);
  }
}

// Clear IndexedDB if any
if ('indexedDB' in window) {
  indexedDB.databases().then((databases) => {
    databases.forEach((db) => {
      if (db.name.includes('garment') || db.name.includes('erp')) {
        indexedDB.deleteDatabase(db.name);
        console.log(`Removed IndexedDB: ${db.name}`);
      }
    });
  });
}

console.log('✅ Application data cleared successfully - all bundle_001 references removed');
console.log('💡 Refresh the page to see the clean state');
