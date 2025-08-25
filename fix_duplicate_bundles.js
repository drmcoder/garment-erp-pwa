// Fix Duplicate Bundle Keys - Run in browser console
// This will find and remove duplicate bundles that are causing React key conflicts

function fixDuplicateBundles() {
  console.log('🔧 FIXING DUPLICATE BUNDLE KEYS...');
  
  const bundleKeys = ['bundles', 'workItems', 'wipEntries', 'wipData', 'productionData', 'sampleBundles', 'bundleData'];
  let totalDuplicatesRemoved = 0;
  
  bundleKeys.forEach(storageKey => {
    const data = localStorage.getItem(storageKey);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          console.log(`📊 Checking ${storageKey}: ${parsed.length} items`);
          
          // Track seen IDs and bundle numbers
          const seenIds = new Set();
          const seenBundleNumbers = new Set();
          const uniqueBundles = [];
          let duplicatesInThisKey = 0;
          
          parsed.forEach((item, index) => {
            // Create a unique identifier for this bundle
            const bundleId = item.id || item.bundleId || `${storageKey}_${index}`;
            const bundleNumber = item.bundleNumber || item.bundle || bundleId;
            
            // Check for duplicates by ID or bundleNumber
            const isDuplicateId = seenIds.has(bundleId);
            const isDuplicateBundleNumber = seenBundleNumbers.has(bundleNumber);
            
            if (isDuplicateId || isDuplicateBundleNumber) {
              console.log(`❌ Duplicate found in ${storageKey}:`, {
                index,
                id: bundleId,
                bundleNumber: bundleNumber,
                duplicateType: isDuplicateId ? 'ID' : 'Bundle Number',
                item: item
              });
              duplicatesInThisKey++;
              totalDuplicatesRemoved++;
            } else {
              // Add to unique list
              uniqueBundles.push(item);
              seenIds.add(bundleId);
              seenBundleNumbers.add(bundleNumber);
            }
          });
          
          // Update localStorage if we removed duplicates
          if (duplicatesInThisKey > 0) {
            localStorage.setItem(storageKey, JSON.stringify(uniqueBundles));
            console.log(`✅ ${storageKey}: Removed ${duplicatesInThisKey} duplicates, kept ${uniqueBundles.length} unique items`);
          } else {
            console.log(`✅ ${storageKey}: No duplicates found`);
          }
        }
      } catch (e) {
        console.log(`⚠️ Could not parse ${storageKey}:`, e.message);
      }
    } else {
      console.log(`ℹ️ ${storageKey}: Not found in localStorage`);
    }
  });
  
  console.log(`🎯 SUMMARY: Removed ${totalDuplicatesRemoved} total duplicates`);
  
  if (totalDuplicatesRemoved > 0) {
    console.log('✅ Duplicates removed! Reloading page to fix React key conflicts...');
    if (confirm('Duplicate bundles removed! Reload page to refresh the application?')) {
      location.reload();
    }
  } else {
    console.log('ℹ️ No duplicates found in localStorage');
    console.log('⚠️ The duplicate key issue might be coming from Firestore data or component logic');
    
    // Additional check - look for the specific bundle_002 issue
    console.log('🔍 Searching specifically for bundle_002...');
    
    bundleKeys.forEach(storageKey => {
      const data = localStorage.getItem(storageKey);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            const bundle002Items = parsed.filter(item => 
              item.id === 'bundle_002' || 
              item.bundleId === 'bundle_002' || 
              item.bundleNumber === '002' ||
              item.bundleNumber === 'bundle_002'
            );
            
            if (bundle002Items.length > 1) {
              console.log(`🎯 Found ${bundle002Items.length} bundle_002 items in ${storageKey}:`, bundle002Items);
              
              // Keep only the first one
              const filtered = parsed.filter((item, index) => {
                const isBunde002 = (
                  item.id === 'bundle_002' || 
                  item.bundleId === 'bundle_002' || 
                  item.bundleNumber === '002' ||
                  item.bundleNumber === 'bundle_002'
                );
                
                if (isBunde002) {
                  const firstBundle002Index = parsed.findIndex(i => 
                    i.id === 'bundle_002' || 
                    i.bundleId === 'bundle_002' || 
                    i.bundleNumber === '002' ||
                    i.bundleNumber === 'bundle_002'
                  );
                  return index === firstBundle002Index; // Keep only the first occurrence
                }
                return true; // Keep non-bundle_002 items
              });
              
              localStorage.setItem(storageKey, JSON.stringify(filtered));
              console.log(`✅ Fixed bundle_002 duplicates in ${storageKey}`);
              location.reload();
            }
          }
        } catch (e) {
          console.log(`⚠️ Error checking ${storageKey}:`, e.message);
        }
      }
    });
  }
}

// Run the fix
fixDuplicateBundles();