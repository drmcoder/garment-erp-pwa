// Clear all existing WIP entries, work bundles, and related data
function clearAllData() {
  console.log('🗑️ Clearing all existing data...');
  
  // Clear all localStorage data
  const keysToRemove = [
    'bundles',
    'workItems', 
    'wipEntries',
    'wipData',
    'productionData',
    'sampleBundles',
    'customOperationsSequence',
    'assignmentHistory'
  ];
  
  keysToRemove.forEach(key => {
    const existingData = localStorage.getItem(key);
    if (existingData) {
      console.log(`❌ Removing ${key}: ${JSON.parse(existingData).length || 'data'} entries`);
      localStorage.removeItem(key);
    }
  });
  
  console.log('✅ All data cleared successfully!');
  return true;
}

// Setup Round Neck T-shirt process with correct operations
function setupRoundNeckTshirtProcess() {
  console.log('🏭 Setting up Round Neck T-shirt process...');
  
  // Define the correct Round Neck T-shirt operations sequence
  const roundNeckOperations = [
    {
      id: 1,
      name: 'Shoulder Join',
      nameNp: 'काँध जोड्ने',
      machineType: 'overlock',
      estimatedTime: 3.0,
      rate: 2.5,
      skillLevel: 'easy',
      sequence: 1,
      icon: '👕'
    },
    {
      id: 2, 
      name: 'Neck Join',
      nameNp: 'नेक जोड्ने',
      machineType: 'overlock',
      estimatedTime: 4.0,
      rate: 3.0,
      skillLevel: 'medium',
      sequence: 2,
      icon: '⭕'
    },
    {
      id: 3,
      name: 'Bottom Fold',
      nameNp: 'तलको फोल्ड',
      machineType: 'flatlock',
      estimatedTime: 2.5,
      rate: 2.0,
      skillLevel: 'easy',
      sequence: 3,
      icon: '📏'
    },
    {
      id: 4,
      name: 'Sleeve Fold', 
      nameNp: 'स्लिभ फोल्ड',
      machineType: 'flatlock',
      estimatedTime: 3.5,
      rate: 2.5,
      skillLevel: 'easy',
      sequence: 4,
      icon: '🔄'
    },
    {
      id: 5,
      name: 'Neck Band',
      nameNp: 'नेक ब्यान्ड',
      machineType: 'single-needle',
      estimatedTime: 5.0,
      rate: 4.0,
      skillLevel: 'hard',
      sequence: 5,
      icon: '🎯'
    }
  ];
  
  // Save the process template
  const processTemplate = {
    id: 'round-neck-tshirt-correct',
    name: 'Round Neck T-shirt Process',
    nameNp: 'राउन्ड नेक टी-शर्ट प्रक्रिया',
    articleType: 'round-neck-tshirt',
    operations: roundNeckOperations,
    totalTime: roundNeckOperations.reduce((sum, op) => sum + op.estimatedTime, 0),
    totalRate: roundNeckOperations.reduce((sum, op) => sum + op.rate, 0),
    createdAt: new Date().toISOString()
  };
  
  localStorage.setItem('roundNeckTshirtProcess', JSON.stringify(processTemplate));
  console.log('✅ Round Neck T-shirt process configured:', processTemplate);
  
  return processTemplate;
}

// Create sample Round Neck T-shirt bundles for the workflow
function createSampleRoundNeckBundles() {
  console.log('📦 Creating sample Round Neck T-shirt bundles...');
  
  const sampleBundles = [
    // Shoulder Join bundles (Overlock)
    {
      id: 'RN001-SJ',
      bundleNumber: 'RN001-SJ-Blue-M',
      articleNumber: 'RN001',
      articleName: 'Round Neck T-shirt',
      englishName: 'Round Neck T-shirt',
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
      nextOperation: 'Neck Join',
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      recommendations: {
        reasons: ['First operation in sequence', 'Good for overlock operators']
      }
    },
    {
      id: 'RN002-SJ',
      bundleNumber: 'RN002-SJ-Red-L',
      articleNumber: 'RN001', 
      articleName: 'Round Neck T-shirt',
      englishName: 'Round Neck T-shirt',
      color: 'Red',
      size: 'L', 
      pieces: 30,
      operation: 'Shoulder Join',
      operationNp: 'काँध जोड्ने',
      machineType: 'overlock',
      status: 'pending',
      priority: 'high',
      rate: 2.5,
      estimatedTime: 3.0,
      difficulty: 'Easy',
      englishDifficulty: 'Easy', 
      sequence: 1,
      nextOperation: 'Neck Join',
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      recommendations: {
        reasons: ['High priority work', 'First operation in sequence']
      }
    },
    
    // Neck Join bundles (Overlock)  
    {
      id: 'RN003-NJ',
      bundleNumber: 'RN003-NJ-Green-S',
      articleNumber: 'RN001',
      articleName: 'Round Neck T-shirt', 
      englishName: 'Round Neck T-shirt',
      color: 'Green',
      size: 'S',
      pieces: 20,
      operation: 'Neck Join',
      operationNp: 'नेक जोड्ने',
      machineType: 'overlock',
      status: 'ready',
      priority: 'medium',
      rate: 3.0,
      estimatedTime: 4.0,
      difficulty: 'Medium', 
      englishDifficulty: 'Medium',
      sequence: 2,
      nextOperation: 'Bottom Fold',
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      recommendations: {
        reasons: ['Second operation', 'Requires precision']
      }
    },
    
    // Bottom Fold bundles (Flatlock)
    {
      id: 'RN004-BF',
      bundleNumber: 'RN004-BF-White-XL',
      articleNumber: 'RN001',
      articleName: 'Round Neck T-shirt',
      englishName: 'Round Neck T-shirt', 
      color: 'White',
      size: 'XL',
      pieces: 28,
      operation: 'Bottom Fold',
      operationNp: 'तलको फोल्ड',
      machineType: 'flatlock',
      status: 'pending',
      priority: 'medium',
      rate: 2.0,
      estimatedTime: 2.5,
      difficulty: 'Easy',
      englishDifficulty: 'Easy',
      sequence: 3, 
      nextOperation: 'Sleeve Fold',
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      recommendations: {
        reasons: ['Good for flatlock operators', 'Quick operation']
      }
    },
    
    // Sleeve Fold bundles (Flatlock)
    {
      id: 'RN005-SF',
      bundleNumber: 'RN005-SF-Black-M',
      articleNumber: 'RN001',
      articleName: 'Round Neck T-shirt',
      englishName: 'Round Neck T-shirt',
      color: 'Black', 
      size: 'M',
      pieces: 32,
      operation: 'Sleeve Fold',
      operationNp: 'स्लिभ फोल्ड',
      machineType: 'flatlock',
      status: 'pending',
      priority: 'low',
      rate: 2.5,
      estimatedTime: 3.5,
      difficulty: 'Easy',
      englishDifficulty: 'Easy',
      sequence: 4,
      nextOperation: 'Neck Band',
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      recommendations: {
        reasons: ['Fourth operation', 'Good practice work']
      }
    },
    
    // Neck Band bundles (Single Needle)
    {
      id: 'RN006-NB', 
      bundleNumber: 'RN006-NB-Navy-L',
      articleNumber: 'RN001',
      articleName: 'Round Neck T-shirt',
      englishName: 'Round Neck T-shirt',
      color: 'Navy',
      size: 'L',
      pieces: 24,
      operation: 'Neck Band',
      operationNp: 'नेक ब्यान्ड',
      machineType: 'single-needle',
      status: 'pending',
      priority: 'high',
      rate: 4.0,
      estimatedTime: 5.0,
      difficulty: 'Hard',
      englishDifficulty: 'Hard',
      sequence: 5,
      nextOperation: 'Completed',
      createdAt: { seconds: Math.floor(Date.now() / 1000) },
      recommendations: {
        reasons: ['Final operation', 'High skill required', 'Good earning']
      }
    }
  ];
  
  // Save bundles as workItems for operator self-assignment
  localStorage.setItem('workItems', JSON.stringify(sampleBundles));
  console.log(`✅ Created ${sampleBundles.length} Round Neck T-shirt bundles`);
  
  return sampleBundles;
}

// Run the complete setup
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  console.log('🚀 Starting complete data reset and Round Neck T-shirt setup...');
  
  // Step 1: Clear all existing data
  clearAllData();
  
  // Step 2: Setup correct process
  const process = setupRoundNeckTshirtProcess();
  
  // Step 3: Create sample bundles
  const bundles = createSampleRoundNeckBundles();
  
  console.log('');
  console.log('🎉 SETUP COMPLETE!');
  console.log(`✅ Process: ${process.name} with ${process.operations.length} operations`);
  console.log(`✅ Bundles: ${bundles.length} work items created`);
  console.log('');
  console.log('📋 ROUND NECK T-SHIRT PROCESS:');
  process.operations.forEach(op => {
    console.log(`${op.sequence}. ${op.name} (${op.nameNp}) → ${op.machineType} → ${op.estimatedTime}min → Rs${op.rate}`);
  });
  console.log('');
  console.log('🔄 WORKFLOW:');
  console.log('1. Supervisor assigns bundles to operators by machine type');
  console.log('2. Operators complete work and move to next operation');
  console.log('3. Operators can self-assign available work');
  console.log('4. System tracks progress through all 5 operations');
  console.log('');
  console.log('🔄 Please refresh the page to see the new Round Neck T-shirt workflow!');
  
} else {
  console.log('⚠️ This script needs to run in a browser environment');
}