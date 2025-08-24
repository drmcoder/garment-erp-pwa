// Initialize sample work items in localStorage for testing
const initializeSampleWork = () => {
  const sampleWorkItems = [
    {
      id: 'work_001',
      bundleId: 'bundle_001',
      articleNumber: '8085',
      articleName: 'Polo T-Shirt',
      color: 'Blue-1',
      size: 'M',
      pieces: 25,
      operation: 'shoulderJoin',
      machineType: 'overlock',
      status: 'ready',
      priority: 'high',
      rate: 2.50,
      estimatedTime: 30,
      createdAt: new Date().toISOString()
    },
    {
      id: 'work_002',
      bundleId: 'bundle_002',
      articleNumber: '6635',
      articleName: '3-Button Tops',
      color: 'Navy-2',
      size: 'S',
      pieces: 20,
      operation: 'placket',
      machineType: 'single-needle',
      status: 'ready',
      priority: 'medium',
      rate: 3.00,
      estimatedTime: 45,
      createdAt: new Date().toISOString()
    },
    {
      id: 'work_003',
      bundleId: 'bundle_003',
      articleNumber: '8085',
      articleName: 'Polo T-Shirt',
      color: 'Red-2',
      size: 'L',
      pieces: 28,
      operation: 'hemFold',
      machineType: 'flatlock',
      status: 'ready',
      priority: 'medium',
      rate: 2.75,
      estimatedTime: 40,
      createdAt: new Date().toISOString()
    }
  ];

  // Save to localStorage
  localStorage.setItem('workItems', JSON.stringify(sampleWorkItems));
  console.log('✅ Sample work items initialized in localStorage');
  console.log('🔧 Machine assignments:');
  console.log('- Overlock work: shoulderJoin (for ram.singh)');
  console.log('- Single-needle work: placket (for sita.devi)');
  console.log('- Flatlock work: hemFold (for other operators)');
};

// Run initialization
if (typeof window !== 'undefined') {
  initializeSampleWork();
}