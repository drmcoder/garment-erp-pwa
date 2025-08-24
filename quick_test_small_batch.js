// Quick Test - Small Batch for Testing Template Processing
// Copy and paste in browser console

console.log('🧪 Creating Small Test Batch...');

// Create minimal test data - just 2 bundles and 5 operations
const smallTestWip = {
  id: Date.now(),
  lotNumber: 'LOT-TEST-SMALL',
  fabricName: 'Test Cotton',
  nepaliDate: '२०८१/०५/०८',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'active',
  parsedStyles: [{
    articleNumber: '8085',
    styleName: 'Test Polo',
    colors: ['Blue', 'White'],
    sizes: ['L', 'XL']
  }],
  rolls: [
    { rollNumber: 'R001', fabric: 'Test Cotton', color: 'Blue', pieces: 20 },
    { rollNumber: 'R002', fabric: 'Test Cotton', color: 'White', pieces: 20 }
  ],
  totalPieces: 40,
  totalRolls: 2
};

// Just 2 small bundles for testing
const testBundles = [
  {
    id: 1001,
    bundleId: 'TEST-001', 
    lotNumber: 'LOT-TEST-SMALL',
    articleNumber: '8085',
    articleName: 'Test Polo',
    color: 'Blue',
    size: 'L', 
    pieces: 5,
    rollNumber: 'R001',
    status: 'ready',
    priority: 'normal'
  },
  {
    id: 1002,
    bundleId: 'TEST-002',
    lotNumber: 'LOT-TEST-SMALL', 
    articleNumber: '8085',
    articleName: 'Test Polo',
    color: 'White',
    size: 'XL',
    pieces: 8, 
    rollNumber: 'R002',
    status: 'ready',
    priority: 'normal'
  }
];

// Simple 5-operation template
const smallTemplate = {
  id: 'test-small-template',
  name: 'Test Small Template (5 ops)',
  nameNp: 'परीक्षण सानो टेम्प्लेट',
  articleType: 'polo',
  articleNumbers: ['8085'],
  customTemplate: false,
  createdAt: new Date().toISOString(),
  operations: [
    { id: 'op-1', sequence: 1, nameEn: 'Size Label DTF', nameNp: 'साइज लेबल DTF', machineType: 'overlock', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'beginner', dependencies: [], icon: '🏷️' },
    { id: 'op-2', sequence: 2, nameEn: 'Placket Kaccha', nameNp: 'प्लकेट कच्चा', machineType: 'singleNeedle', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'intermediate', dependencies: ['op-1'], icon: '🪡' },
    { id: 'op-3', sequence: 3, nameEn: 'Collar Making', nameNp: 'कलर बनाउने', machineType: 'singleNeedle', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'intermediate', dependencies: ['op-2'], icon: '👔' },
    { id: 'op-4', sequence: 4, nameEn: 'Shoulder Join', nameNp: 'काँध जोड्ने', machineType: 'overlock', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'expert', dependencies: ['op-3'], icon: '🤝' },
    { id: 'op-5', sequence: 5, nameEn: 'Side Seam', nameNp: 'साइड सिम', machineType: 'overlock', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'expert', dependencies: ['op-4'], icon: '📏' }
  ]
};

try {
  // Save small test data
  const wipEntries = JSON.parse(localStorage.getItem('wipEntries') || '[]');
  smallTestWip.bundles = testBundles;
  const updatedWipEntries = [smallTestWip, ...wipEntries];
  localStorage.setItem('wipEntries', JSON.stringify(updatedWipEntries));

  // Save template
  const templates = JSON.parse(localStorage.getItem('processTemplates') || '[]');
  const updatedTemplates = [smallTemplate, ...templates.filter(t => t.id !== smallTemplate.id)];
  localStorage.setItem('processTemplates', JSON.stringify(updatedTemplates));

  console.log('✅ Small Test Batch Created!');
  console.log('📊 Test Data Summary:');
  console.log(`  WIP: ${smallTestWip.lotNumber}`);
  console.log(`  Bundles: ${testBundles.length} (${testBundles.reduce((sum, b) => sum + b.pieces, 0)} total pieces)`);
  console.log(`  Template: ${smallTemplate.operations.length} operations`);
  console.log(`  Expected Work Items: ${testBundles.length} × ${smallTemplate.operations.length} = ${testBundles.length * smallTemplate.operations.length}`);
  
  console.log('\n🎯 Testing Instructions:');
  console.log('1. Open WIP Data Import');
  console.log('2. Select "LOT-TEST-SMALL" (if visible in WIP Manager)');
  console.log('3. OR create new WIP manually with 2-3 small bundles');
  console.log('4. Select "Test Small Template (5 ops)" - should process quickly');
  console.log('5. Should create 10 work items (2 bundles × 5 operations) in ~1-2 seconds');

} catch (error) {
  console.error('❌ Error creating test data:', error);
}