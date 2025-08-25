// Check localStorage contents - run in browser console
console.log('🔍 CHECKING LOCALSTORAGE CONTENTS...');
console.log('📊 Total localStorage items:', localStorage.length);

// List all localStorage keys
const keys = Object.keys(localStorage);
console.log('🔑 LocalStorage keys:', keys);

// Show bundle-related data specifically
const bundleKeys = ['bundles', 'workItems', 'wipEntries', 'wipData', 'productionData', 'sampleBundles', 'bundleData'];
bundleKeys.forEach(key => {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      console.log(`📦 ${key}:`, parsed.length || 'N/A', 'items');
    } catch (e) {
      console.log(`📦 ${key}:`, 'exists (not JSON)');
    }
  } else {
    console.log(`📦 ${key}:`, 'not found');
  }
});