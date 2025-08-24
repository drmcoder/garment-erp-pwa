// Clean up localStorage data and remove invalid entries
function cleanupLocalStorage() {
  console.log('🧹 Starting localStorage cleanup...');
  
  // Clean up bundles
  let bundles = JSON.parse(localStorage.getItem('bundles') || '[]');
  console.log(`📦 Found ${bundles.length} bundles before cleanup`);
  
  const validBundles = bundles.filter(bundle => {
    const isValid = (
      bundle.id && 
      bundle.articleNumber && 
      bundle.articleNumber !== 'NaN' && 
      bundle.articleName && 
      bundle.articleName !== 'NaN - Operation' &&
      !bundle.articleName.includes('shoulderJoin') &&
      bundle.articleNumber !== '43'
    );
    
    if (!isValid) {
      console.log(`❌ Removing invalid bundle: ${bundle.id} - ${bundle.articleName} - Article: ${bundle.articleNumber}`);
    }
    return isValid;
  });
  
  // Clean up work items
  let workItems = JSON.parse(localStorage.getItem('workItems') || '[]');
  console.log(`🔧 Found ${workItems.length} work items before cleanup`);
  
  const validWorkItems = workItems.filter(work => {
    const isValid = (
      work.id && 
      work.articleNumber && 
      work.articleNumber !== 'NaN' && 
      work.articleName && 
      work.articleName !== 'NaN - Operation' &&
      work.operation !== 'shoulderJoin' &&
      work.articleNumber !== '43'
    );
    
    if (!isValid) {
      console.log(`❌ Removing invalid work item: ${work.id} - ${work.articleName} - Article: ${work.articleNumber} - Operation: ${work.operation}`);
    }
    return isValid;
  });
  
  // Save cleaned data back
  localStorage.setItem('bundles', JSON.stringify(validBundles));
  localStorage.setItem('workItems', JSON.stringify(validWorkItems));
  
  console.log(`✅ Cleanup complete!`);
  console.log(`📦 Bundles: ${bundles.length} → ${validBundles.length} (removed ${bundles.length - validBundles.length})`);
  console.log(`🔧 Work Items: ${workItems.length} → ${validWorkItems.length} (removed ${workItems.length - validWorkItems.length})`);
  
  // Clean up WIP data if needed
  let wipEntries = JSON.parse(localStorage.getItem('wipEntries') || '[]');
  if (wipEntries.length > 0) {
    console.log(`📋 Found ${wipEntries.length} WIP entries - keeping for reference`);
  }
  
  return {
    bundlesRemoved: bundles.length - validBundles.length,
    workItemsRemoved: workItems.length - validWorkItems.length,
    validBundles: validBundles.length,
    validWorkItems: validWorkItems.length
  };
}

// Load fresh sample work from WIP data if available
function loadFreshWorkFromWIP() {
  console.log('🔄 Loading fresh work from recent WIP entries...');
  
  const wipEntries = JSON.parse(localStorage.getItem('wipEntries') || '[]');
  if (wipEntries.length === 0) {
    console.log('⚠️ No WIP entries found. Creating sample data...');
    
    // Create some sample WIP-based work
    const freshWorkItems = [
      {
        id: 'fresh_work_001',
        bundleId: 'fresh_bundle_001',
        articleNumber: '7785',
        articleName: 'Cotton T-Shirt',
        englishName: 'Cotton T-Shirt',
        color: 'White',
        size: 'M',
        pieces: 20,
        operation: 'sewing',
        machineType: 'single-needle',
        status: 'pending',
        priority: 'medium',
        rate: 2.80,
        estimatedTime: 35,
        difficulty: 'Medium',
        englishDifficulty: 'Medium',
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
        recommendations: {
          reasons: ['Good for your skill level', 'Matches your machine type']
        }
      },
      {
        id: 'fresh_work_002',
        bundleId: 'fresh_bundle_002',
        articleNumber: '9901',
        articleName: 'Polo Shirt',
        englishName: 'Polo Shirt',
        color: 'Navy Blue',
        size: 'L',
        pieces: 25,
        operation: 'collar',
        machineType: 'overlock',
        status: 'ready',
        priority: 'high',
        rate: 3.20,
        estimatedTime: 40,
        difficulty: 'Hard',
        englishDifficulty: 'Hard',
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
        recommendations: {
          reasons: ['High priority work', 'Good earning potential']
        }
      }
    ];
    
    // Add fresh work items
    let existingWorkItems = JSON.parse(localStorage.getItem('workItems') || '[]');
    const combinedWorkItems = [...existingWorkItems, ...freshWorkItems];
    localStorage.setItem('workItems', JSON.stringify(combinedWorkItems));
    
    console.log(`✅ Added ${freshWorkItems.length} fresh work items from sample data`);
    return freshWorkItems.length;
  } else {
    console.log(`📋 Found ${wipEntries.length} WIP entries to process`);
    // Process WIP entries into work items would go here
    return 0;
  }
}

// Run cleanup and refresh
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  const results = cleanupLocalStorage();
  const freshItemsAdded = loadFreshWorkFromWIP();
  
  console.log('\n🎉 CLEANUP SUMMARY:');
  console.log(`- Removed ${results.bundlesRemoved} invalid bundles`);
  console.log(`- Removed ${results.workItemsRemoved} invalid work items`);
  console.log(`- Added ${freshItemsAdded} fresh work items`);
  console.log(`- Valid bundles remaining: ${results.validBundles}`);
  console.log(`- Valid work items remaining: ${results.validWorkItems}`);
  console.log('\n🔄 Please refresh the page to see updated work items');
} else {
  console.log('⚠️ This script needs to run in a browser environment');
}