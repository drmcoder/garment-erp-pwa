// Check what's currently in the database/localStorage
function checkDatabase() {
  console.log('🔍 CHECKING DATABASE/LOCALSTORAGE...');
  console.log('');
  
  // Check all relevant localStorage keys
  const keys = [
    'wipEntries',
    'bundles', 
    'workItems',
    'wipData',
    'bundleData',
    'productionData',
    'sampleBundles',
    'assignmentHistory'
  ];
  
  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        console.log(`📊 ${key.toUpperCase()}:`);
        console.log(`   Count: ${Array.isArray(parsed) ? parsed.length : 'Not array'}`);
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`   Sample:`, parsed[0]);
          
          // Show all items briefly
          if (parsed.length <= 5) {
            parsed.forEach((item, index) => {
              console.log(`   ${index + 1}. ${item.id || item.lotNumber || 'No ID'} - ${item.articleName || item.operation || item.bundleNumber || 'Unknown'}`);
            });
          }
        }
        console.log('');
      } catch (e) {
        console.log(`   ❌ Error parsing ${key}:`, e.message);
      }
    } else {
      console.log(`❌ ${key}: No data found`);
    }
  });
  
  // Check what format is needed for Available Work
  console.log('🎯 REQUIRED FORMAT FOR AVAILABLE WORK:');
  console.log('Bundles need these properties:');
  console.log('- id: unique identifier');
  console.log('- status: "pending" (not "created" or other)');  
  console.log('- machineType: "overlock", "flatlock", "singleNeedle"');
  console.log('- operation or currentOperation: operation name');
  console.log('- articleNumber: article number');
  console.log('- articleName: garment name');
  console.log('- pieces or quantity: number of pieces');
  console.log('- estimatedTime: time in minutes');
  console.log('- priority: "high", "medium", "low"');
  console.log('');
  
  // Check for any bundle that might work
  const allData = {};
  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        allData[key] = JSON.parse(data);
      } catch (e) {}
    }
  });
  
  console.log('💡 ANALYSIS:');
  const wipCount = (allData.wipEntries?.length || 0) + (allData.wipData?.length || 0);
  const bundleCount = (allData.bundles?.length || 0) + (allData.sampleBundles?.length || 0);
  const workCount = allData.workItems?.length || 0;
  
  console.log(`📋 Total WIP Entries: ${wipCount}`);
  console.log(`📦 Total Bundles: ${bundleCount}`);  
  console.log(`🔧 Total Work Items: ${workCount}`);
  
  if (bundleCount > 0) {
    console.log('');
    console.log('🔍 CHECKING BUNDLE FORMAT...');
    const sampleBundle = allData.bundles?.[0] || allData.sampleBundles?.[0];
    if (sampleBundle) {
      console.log('Sample Bundle:', sampleBundle);
      
      const issues = [];
      if (!sampleBundle.status || sampleBundle.status === 'created') {
        issues.push('❌ Status should be "pending"');
      }
      if (!sampleBundle.machineType) {
        issues.push('❌ Missing machineType');
      }
      if (!sampleBundle.operation && !sampleBundle.currentOperation) {
        issues.push('❌ Missing operation name');  
      }
      
      if (issues.length > 0) {
        console.log('🚨 ISSUES FOUND:');
        issues.forEach(issue => console.log('  ', issue));
      } else {
        console.log('✅ Bundle format looks good!');
      }
    }
  }
  
  return { wipCount, bundleCount, workCount };
}

// Run if in browser
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  const result = checkDatabase();
  console.log('');  
  console.log('📊 SUMMARY:');
  console.log(`WIP: ${result.wipCount} | Bundles: ${result.bundleCount} | Work: ${result.workCount}`);
} else {
  console.log('⚠️ This script needs to run in a browser environment');
}