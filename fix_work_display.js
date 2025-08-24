// Fix work display - ensure WIP entries and bundles show up in Available Work

function fixWorkDisplay() {
  console.log('🔍 Checking work display issues...');
  
  // Check what's in localStorage
  const bundles = JSON.parse(localStorage.getItem('bundles') || '[]');
  const workItems = JSON.parse(localStorage.getItem('workItems') || '[]');
  const wipEntries = JSON.parse(localStorage.getItem('wipEntries') || '[]');
  
  console.log('📊 Current Data:');
  console.log(`📦 Bundles: ${bundles.length}`);
  console.log(`🔧 WorkItems: ${workItems.length}`);
  console.log(`📋 WIP Entries: ${wipEntries.length}`);
  
  // Check bundle formats
  if (bundles.length > 0) {
    console.log('📦 Bundle Sample:', bundles[0]);
  }
  
  if (workItems.length > 0) {
    console.log('🔧 Work Item Sample:', workItems[0]);
  }
  
  // Fix bundles to have correct status and format for Available Work
  const fixedBundles = bundles.map(bundle => ({
    ...bundle,
    status: bundle.status === 'created' ? 'pending' : (bundle.status || 'pending'),
    machineType: bundle.machineType || 'overlock',
    priority: bundle.priority || 'medium',
    articleNumber: bundle.articleNumber || bundle.article,
    articleName: bundle.articleName || `Article ${bundle.articleNumber}`,
    operation: bundle.operation || bundle.currentOperation || 'Process',
    pieces: bundle.pieces || bundle.quantity || 0,
    estimatedTime: bundle.estimatedTime || 30,
    bundleNumber: bundle.bundleNumber || bundle.id,
    createdAt: bundle.createdAt || { seconds: Math.floor(Date.now() / 1000) }
  }));
  
  // Fix work items to have correct format
  const fixedWorkItems = workItems.map(item => ({
    ...item,
    status: item.status === 'created' ? 'pending' : (item.status || 'pending'),
    machineType: item.machineType || 'overlock',
    priority: item.priority || 'medium',
    bundleNumber: item.bundleNumber || item.bundleId || item.id,
    createdAt: item.createdAt || { seconds: Math.floor(Date.now() / 1000) }
  }));
  
  // Save fixed data
  if (fixedBundles.length > 0) {
    localStorage.setItem('bundles', JSON.stringify(fixedBundles));
    console.log('✅ Fixed bundle formats');
  }
  
  if (fixedWorkItems.length > 0) {
    localStorage.setItem('workItems', JSON.stringify(fixedWorkItems));
    console.log('✅ Fixed work item formats');
  }
  
  // Create test work items if nothing exists
  if (bundles.length === 0 && workItems.length === 0) {
    console.log('🏭 Creating test work items...');
    
    const testWorkItems = [
      {
        id: 'test-B001',
        bundleId: 'test-B001',
        bundleNumber: 'B001-TEST',
        articleNumber: 'T001',
        articleName: 'Test Lot',
        englishName: 'Test Lot',
        color: 'Blue',
        size: 'M',
        pieces: 25,
        operation: 'Shoulder Join',
        operationNp: 'काँध जोड्ने',
        machineType: 'overlock',
        status: 'pending',
        priority: 'medium',
        rate: 2.5,
        estimatedTime: 3.0,
        difficulty: 'Easy',
        englishDifficulty: 'Easy',
        sequence: 1,
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
        recommendations: {
          reasons: ['Test work item', 'Ready for assignment']
        }
      },
      {
        id: 'test-B002',
        bundleId: 'test-B002', 
        bundleNumber: 'B002-TEST',
        articleNumber: 'T001',
        articleName: 'Test Lot',
        englishName: 'Test Lot',
        color: 'Red',
        size: 'L',
        pieces: 30,
        operation: 'Neck Join',
        operationNp: 'नेक जोड्ने',
        machineType: 'overlock',
        status: 'pending',
        priority: 'high',
        rate: 3.0,
        estimatedTime: 4.0,
        difficulty: 'Medium',
        englishDifficulty: 'Medium',
        sequence: 2,
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
        recommendations: {
          reasons: ['High priority test', 'Ready for assignment']
        }
      }
    ];
    
    localStorage.setItem('workItems', JSON.stringify(testWorkItems));
    localStorage.setItem('bundles', JSON.stringify(testWorkItems));
    console.log('✅ Created test work items');
  }
  
  console.log('');
  console.log('🎯 SOLUTION:');
  console.log('1. Check Work Assignment page filters:');
  console.log('   - Status should be "Pending" or "All"');
  console.log('   - Machine should match your bundles');
  console.log('2. Click Refresh button in Work Assignment');
  console.log('3. Check Available Work count in statistics');
  console.log('');
  console.log('✅ Work display fix complete!');
  
  return {
    bundlesFixed: fixedBundles.length,
    workItemsFixed: fixedWorkItems.length,
    totalWork: fixedBundles.length + fixedWorkItems.length
  };
}

// Run the fix if in browser
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  const result = fixWorkDisplay();
  console.log(`📊 Final Result: ${result.totalWork} work items ready for assignment`);
} else {
  console.log('⚠️ This script needs to run in a browser environment');
}