// 8085 Polo Complete Data - Copy and paste this in browser console

console.log('🏭 Loading 8085 Polo Manufacturing Data...');

// 1. WIP Entry
const wipEntry = {
  id: Date.now(),
  lotNumber: 'LOT-8085-001',
  fabricName: 'Cotton Pique 180 GSM',
  nepaliDate: '२०८१/०५/०८',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'completed',
  parsedStyles: [{
    articleNumber: '8085',
    styleName: 'Polo T-Shirt',
    colors: ['Navy Blue', 'White', 'Black', 'Red'],
    sizes: ['S', 'M', 'L', 'XL', 'XXL']
  }],
  rolls: [
    { rollNumber: 'R001', fabric: 'Cotton Pique', color: 'Navy Blue', pieces: 50, sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    { rollNumber: 'R002', fabric: 'Cotton Pique', color: 'White', pieces: 45, sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    { rollNumber: 'R003', fabric: 'Cotton Pique', color: 'Black', pieces: 40, sizes: ['S', 'M', 'L', 'XL', 'XXL'] },
    { rollNumber: 'R004', fabric: 'Cotton Pique', color: 'Red', pieces: 35, sizes: ['S', 'M', 'L', 'XXL'] }
  ],
  totalPieces: 170,
  totalRolls: 4
};

// 2. Process Template with your 26 operations
const template = {
  id: 'polo-8085-template',
  name: '8085 Polo T-Shirt Complete Process',
  nameNp: '८०८५ पोलो टी-शर्ट पूर्ण प्रक्रिया',
  articleType: 'polo',
  articleNumbers: ['8085'],
  customTemplate: false,
  createdAt: new Date().toISOString(),
  operations: [
    { id: 'op-1', sequence: 1, nameEn: 'Size label DTF', nameNp: 'साइज लेबल DTF', machineType: 'overlock', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'beginner', dependencies: [], icon: '🏷️' },
    { id: 'op-2', sequence: 2, nameEn: 'Rubber Print', nameNp: 'रबर प्रिन्ट', machineType: 'overlock', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'beginner', dependencies: ['op-1'], icon: '🖨️' },
    { id: 'op-3', sequence: 3, nameEn: 'Plkt Fusing', nameNp: 'प्लकेट फ्युजिङ', machineType: 'overlock', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'beginner', dependencies: ['op-2'], icon: '🔥' },
    { id: 'op-4', sequence: 4, nameEn: 'Band Block Fusing', nameNp: 'ब्यान्ड ब्लक फ्युजिङ', machineType: 'overlock', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'beginner', dependencies: ['op-3'], icon: '🔥' },
    { id: 'op-5', sequence: 5, nameEn: 'Placket Kaccha', nameNp: 'प्लकेट कच्चा', machineType: 'singleNeedle', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'intermediate', dependencies: ['op-4'], icon: '🪡' },
    { id: 'op-6', sequence: 6, nameEn: 'Placket Pakke', nameNp: 'प्लकेट पक्के', machineType: 'singleNeedle', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'intermediate', dependencies: ['op-5'], icon: '🪡' },
    { id: 'op-7', sequence: 7, nameEn: 'Collar Making', nameNp: 'कलर बनाउने', machineType: 'singleNeedle', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'intermediate', dependencies: ['op-6'], icon: '👔' },
    { id: 'op-8', sequence: 8, nameEn: 'Pocket Hem Fold', nameNp: 'पकेट हेम फोल्ड', machineType: 'singleNeedle', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'intermediate', dependencies: ['op-7'], icon: '👜' },
    { id: 'op-9', sequence: 9, nameEn: 'Pocket Iron', nameNp: 'पकेट आइरन', machineType: 'manual', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'beginner', dependencies: ['op-8'], icon: '♨️' },
    { id: 'op-10', sequence: 10, nameEn: 'Pocket Attach', nameNp: 'पकेट जोड्ने', machineType: 'singleNeedle', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'intermediate', dependencies: ['op-9'], icon: '👜' },
    { id: 'op-11', sequence: 11, nameEn: 'Shoulder Join', nameNp: 'काँध जोड्ने', machineType: 'overlock', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'expert', dependencies: ['op-10'], icon: '🤝' },
    { id: 'op-12', sequence: 12, nameEn: 'Shoulder TS', nameNp: 'काँध TS', machineType: 'flatlock', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'intermediate', dependencies: ['op-11'], icon: '🤝' },
    { id: 'op-13', sequence: 13, nameEn: 'Armhole Join', nameNp: 'आर्महोल जोड्ने', machineType: 'overlock', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'expert', dependencies: ['op-12'], icon: '💪' },
    { id: 'op-14', sequence: 14, nameEn: 'Armhole TS', nameNp: 'आर्महोल TS', machineType: 'flatlock', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'intermediate', dependencies: ['op-13'], icon: '💪' },
    { id: 'op-15', sequence: 15, nameEn: 'Sleeve Cuff Join', nameNp: 'स्लिभ कफ जोड्ने', machineType: 'overlock', estimatedTimePerPiece: 1.5, rate: 3, skillLevel: 'expert', dependencies: ['op-14'], icon: '👕' }
  ]
};

// 3. Generate Sample Bundles (10 bundles)
const bundles = [
  { id: 1001, bundleId: 'B8085-001', lotNumber: 'LOT-8085-001', articleNumber: '8085', articleName: 'Polo T-Shirt', color: 'Navy Blue', size: 'L', pieces: 10, rollNumber: 'R001', status: 'ready', priority: 'normal' },
  { id: 1002, bundleId: 'B8085-002', lotNumber: 'LOT-8085-001', articleNumber: '8085', articleName: 'Polo T-Shirt', color: 'Navy Blue', size: 'XL', pieces: 10, rollNumber: 'R001', status: 'ready', priority: 'normal' },
  { id: 1003, bundleId: 'B8085-003', lotNumber: 'LOT-8085-001', articleNumber: '8085', articleName: 'Polo T-Shirt', color: 'White', size: 'L', pieces: 10, rollNumber: 'R002', status: 'ready', priority: 'normal' },
  { id: 1004, bundleId: 'B8085-004', lotNumber: 'LOT-8085-001', articleNumber: '8085', articleName: 'Polo T-Shirt', color: 'White', size: 'XL', pieces: 10, rollNumber: 'R002', status: 'ready', priority: 'normal' },
  { id: 1005, bundleId: 'B8085-005', lotNumber: 'LOT-8085-001', articleNumber: '8085', articleName: 'Polo T-Shirt', color: 'Black', size: 'L', pieces: 10, rollNumber: 'R003', status: 'ready', priority: 'normal' },
  { id: 1006, bundleId: 'B8085-006', lotNumber: 'LOT-8085-001', articleNumber: '8085', articleName: 'Polo T-Shirt', color: 'Black', size: 'XL', pieces: 10, rollNumber: 'R003', status: 'ready', priority: 'high' },
  { id: 1007, bundleId: 'B8085-007', lotNumber: 'LOT-8085-001', articleNumber: '8085', articleName: 'Polo T-Shirt', color: 'Red', size: 'L', pieces: 10, rollNumber: 'R004', status: 'ready', priority: 'normal' },
  { id: 1008, bundleId: 'B8085-008', lotNumber: 'LOT-8085-001', articleNumber: '8085', articleName: 'Polo T-Shirt', color: 'Red', size: 'XL', pieces: 10, rollNumber: 'R004', status: 'ready', priority: 'normal' }
];

// 4. Generate Work Items (First 3 bundles, first 15 operations)
const workItems = [];
const sampleBundles = bundles.slice(0, 3);

sampleBundles.forEach(bundle => {
  template.operations.forEach(operation => {
    workItems.push({
      id: `${bundle.bundleId}-${operation.id}`,
      bundleId: bundle.bundleId,
      bundleData: bundle,
      operation: operation,
      operationId: operation.id,
      operationName: operation.nameEn,
      sequence: operation.sequence,
      pieces: bundle.pieces,
      estimatedTime: bundle.pieces * operation.estimatedTimePerPiece,
      totalEarnings: bundle.pieces * operation.rate,
      machineType: operation.machineType,
      skillLevel: operation.skillLevel,
      status: operation.sequence === 1 ? 'ready' : 'waiting',
      dependencies: operation.dependencies.map(depId => `${bundle.bundleId}-${depId}`),
      assignedOperator: null,
      createdAt: new Date().toISOString(),
      priority: bundle.priority || 'normal',
      lotNumber: bundle.lotNumber,
      articleNumber: bundle.articleNumber,
      articleName: bundle.articleName,
      color: bundle.color,
      size: bundle.size,
      icon: operation.icon,
      wipId: wipEntry.id
    });
  });
});

// 5. Save to localStorage
try {
  // Save WIP entries
  const existingWipEntries = JSON.parse(localStorage.getItem('wipEntries') || '[]');
  wipEntry.bundles = bundles;
  wipEntry.workItems = workItems;
  wipEntry.template = template;
  const updatedWipEntries = [wipEntry, ...existingWipEntries];
  localStorage.setItem('wipEntries', JSON.stringify(updatedWipEntries));

  // Save work items
  const existingWorkItems = JSON.parse(localStorage.getItem('workItems') || '[]');
  const updatedWorkItems = [...workItems, ...existingWorkItems];
  localStorage.setItem('workItems', JSON.stringify(updatedWorkItems));

  // Save process template
  const existingTemplates = JSON.parse(localStorage.getItem('processTemplates') || '[]');
  const updatedTemplates = [template, ...existingTemplates.filter(t => t.id !== template.id)];
  localStorage.setItem('processTemplates', JSON.stringify(updatedTemplates));

  console.log('✅ 8085 Polo Data Loaded Successfully!');
  console.log(`📦 WIP Entry: ${wipEntry.lotNumber} (${wipEntry.totalPieces} pieces)`);
  console.log(`🎯 Bundles: ${bundles.length} bundles created`);
  console.log(`⚙️ Work Items: ${workItems.length} work items generated`);
  console.log(`🛠️ Template: ${template.operations.length} operations defined`);
  
  console.log('\n🎉 Ready to assign work! Go to:');
  console.log('• WIP Data Manager - to view the entry');
  console.log('• Work Assignment - to assign work items to operators');
  
  // Show sample work items ready for assignment
  const readyItems = workItems.filter(item => item.status === 'ready');
  console.log(`\n🟢 ${readyItems.length} work items ready for assignment:`);
  readyItems.forEach(item => {
    console.log(`  ${item.id}: ${item.operationName} [${item.machineType}] - ${item.pieces} pcs - रु.${item.totalEarnings}`);
  });

} catch (error) {
  console.error('❌ Error loading data:', error);
}