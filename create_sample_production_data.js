// Create sample production data for testing the complete workflow
const sampleProductionData = {
  // Sample WIP data that can be imported
  wipData: {
    lotNumber: 'LOT001',
    articles: ['8085'],
    garmentType: 'polo_shirt',
    cuttingDate: '2024-01-20',
    cutter: 'Cutting Team A',
    colors: [
      { name: 'Blue-1', pieces: 150 },
      { name: 'Red-2', pieces: 120 },
      { name: 'White-3', pieces: 180 }
    ],
    sizes: [
      { name: 'S', pieces: 80 },
      { name: 'M', pieces: 150 },
      { name: 'L', pieces: 120 },
      { name: 'XL', pieces: 100 }
    ],
    totalPieces: 450
  },

  // Bundles with correct machine types
  sampleBundles: [
    {
      id: 'bundle_001',
      bundleNumber: 'LOT001-8085-Blue-S-01',
      lotNumber: 'LOT001',
      article: '8085',
      color: 'Blue-1',
      size: 'S',
      pieceCount: 25,
      machineType: 'overlock', // Matches operator machine
      currentOperation: 'shoulderJoin',
      status: 'ready',
      priority: 'high',
      estimatedTime: 30,
      rate: 2.50,
      createdAt: new Date().toISOString()
    },
    {
      id: 'bundle_002', 
      bundleNumber: 'LOT001-8085-Blue-M-02',
      lotNumber: 'LOT001',
      article: '8085',
      color: 'Blue-1', 
      size: 'M',
      pieceCount: 30,
      machineType: 'single-needle', // Matches sita.devi's machine
      currentOperation: 'placket',
      status: 'ready',
      priority: 'medium',
      estimatedTime: 45,
      rate: 3.00,
      createdAt: new Date().toISOString()
    },
    {
      id: 'bundle_003',
      bundleNumber: 'LOT001-8085-Red-L-03', 
      lotNumber: 'LOT001',
      article: '8085',
      color: 'Red-2',
      size: 'L', 
      pieceCount: 28,
      machineType: 'flatlock', // For flatlock operators
      currentOperation: 'hemFold',
      status: 'ready',
      priority: 'medium',
      estimatedTime: 35,
      rate: 2.75,
      createdAt: new Date().toISOString()
    }
  ],

  // Work items that operators can pick up
  workItems: [
    {
      id: 'work_001',
      bundleId: 'bundle_001',
      articleNumber: '8085',
      articleName: 'Polo T-Shirt',
      color: 'Blue-1',
      size: 'S',
      operation: 'shoulderJoin',
      machineType: 'overlock',
      pieces: 25,
      rate: 2.50,
      estimatedTime: 30,
      priority: 'high',
      status: 'ready',
      assignedOperator: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 'work_002',
      bundleId: 'bundle_002', 
      articleNumber: '8085',
      articleName: 'Polo T-Shirt',
      color: 'Blue-1',
      size: 'M',
      operation: 'placket',
      machineType: 'single-needle',
      pieces: 30,
      rate: 3.00,
      estimatedTime: 45,
      priority: 'medium', 
      status: 'ready',
      assignedOperator: null,
      createdAt: new Date().toISOString()
    },
    {
      id: 'work_003',
      bundleId: 'bundle_003',
      articleNumber: '8085', 
      articleName: 'Polo T-Shirt',
      color: 'Red-2',
      size: 'L',
      operation: 'hemFold',
      machineType: 'flatlock', 
      pieces: 28,
      rate: 2.75,
      estimatedTime: 35,
      priority: 'medium',
      status: 'ready', 
      assignedOperator: null,
      createdAt: new Date().toISOString()
    }
  ]
};

// Instructions for testing
console.log('🏭 SAMPLE PRODUCTION DATA CREATED');
console.log('');
console.log('📋 TESTING STEPS:');
console.log('1. Login as supervisor (hari.supervisor/password123)');
console.log('2. Go to WIP Data Import');
console.log('3. Use the wipData above to create a lot');
console.log('4. Generate bundles (should create bundles with matching machine types)');
console.log('5. Go to Work Assignment and assign work to operators');
console.log('6. Login as operator (ram.singh/password123) - should see overlock work');
console.log('7. Login as operator (sita.devi/password123) - should see single-needle work');
console.log('');
console.log('🔧 Machine Type Mapping:');
console.log('- ram.singh → overlock → shoulderJoin operation');
console.log('- sita.devi → single-needle → placket operation');  
console.log('- (others) → flatlock → hemFold operation');

module.exports = sampleProductionData;