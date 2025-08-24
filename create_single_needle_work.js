// Create Single Needle Work Items - Copy and paste in browser console

console.log('🪡 Creating Single Needle Work Items...');

// Mock work items focused on single needle operations
const singleNeedleWorkItems = [
  {
    id: `B8085-001-placket-kaccha`,
    bundleId: 'B8085-001',
    bundleData: { 
      bundleId: 'B8085-001', 
      articleNumber: '8085', 
      articleName: 'Polo T-Shirt', 
      color: 'Navy Blue', 
      size: 'L', 
      pieces: 10 
    },
    operation: { 
      id: 'op-5', 
      nameEn: 'Placket Kaccha', 
      nameNp: 'प्लकेट कच्चा',
      machineType: 'singleNeedle',
      estimatedTimePerPiece: 1.5,
      rate: 3,
      icon: '🪡'
    },
    operationId: 'op-5',
    operationName: 'Placket Kaccha',
    sequence: 5,
    pieces: 10,
    estimatedTime: 15,
    totalEarnings: 30,
    machineType: 'singleNeedle',
    skillLevel: 'intermediate',
    status: 'ready',
    dependencies: [],
    assignedOperator: null,
    createdAt: new Date().toISOString(),
    priority: 'normal',
    lotNumber: 'LOT-8085-001',
    articleNumber: '8085',
    articleName: 'Polo T-Shirt',
    color: 'Navy Blue',
    size: 'L',
    icon: '🪡',
    wipId: Date.now()
  },
  {
    id: `B8085-002-placket-pakke`,
    bundleId: 'B8085-002',
    bundleData: { 
      bundleId: 'B8085-002', 
      articleNumber: '8085', 
      articleName: 'Polo T-Shirt', 
      color: 'White', 
      size: 'XL', 
      pieces: 12 
    },
    operation: { 
      id: 'op-6', 
      nameEn: 'Placket Pakke', 
      nameNp: 'प्लकेट पक्के',
      machineType: 'singleNeedle',
      estimatedTimePerPiece: 1.5,
      rate: 3,
      icon: '🪡'
    },
    operationId: 'op-6',
    operationName: 'Placket Pakke',
    sequence: 6,
    pieces: 12,
    estimatedTime: 18,
    totalEarnings: 36,
    machineType: 'singleNeedle',
    skillLevel: 'intermediate',
    status: 'ready',
    dependencies: [],
    assignedOperator: null,
    createdAt: new Date().toISOString(),
    priority: 'high',
    lotNumber: 'LOT-8085-001',
    articleNumber: '8085',
    articleName: 'Polo T-Shirt',
    color: 'White',
    size: 'XL',
    icon: '🪡',
    wipId: Date.now()
  },
  {
    id: `B8085-003-collar-making`,
    bundleId: 'B8085-003',
    bundleData: { 
      bundleId: 'B8085-003', 
      articleNumber: '8085', 
      articleName: 'Polo T-Shirt', 
      color: 'Black', 
      size: 'L', 
      pieces: 8 
    },
    operation: { 
      id: 'op-7', 
      nameEn: 'Collar Making', 
      nameNp: 'कलर बनाउने',
      machineType: 'singleNeedle',
      estimatedTimePerPiece: 1.5,
      rate: 3,
      icon: '👔'
    },
    operationId: 'op-7',
    operationName: 'Collar Making',
    sequence: 7,
    pieces: 8,
    estimatedTime: 12,
    totalEarnings: 24,
    machineType: 'singleNeedle',
    skillLevel: 'intermediate',
    status: 'ready',
    dependencies: [],
    assignedOperator: null,
    createdAt: new Date().toISOString(),
    priority: 'normal',
    lotNumber: 'LOT-8085-001',
    articleNumber: '8085',
    articleName: 'Polo T-Shirt',
    color: 'Black',
    size: 'L',
    icon: '👔',
    wipId: Date.now()
  },
  {
    id: `B8085-004-pocket-hemfold`,
    bundleId: 'B8085-004',
    bundleData: { 
      bundleId: 'B8085-004', 
      articleNumber: '8085', 
      articleName: 'Polo T-Shirt', 
      color: 'Red', 
      size: 'XL', 
      pieces: 15 
    },
    operation: { 
      id: 'op-8', 
      nameEn: 'Pocket Hem Fold', 
      nameNp: 'पकेट हेम फोल्ड',
      machineType: 'singleNeedle',
      estimatedTimePerPiece: 1.5,
      rate: 3,
      icon: '👜'
    },
    operationId: 'op-8',
    operationName: 'Pocket Hem Fold',
    sequence: 8,
    pieces: 15,
    estimatedTime: 22.5,
    totalEarnings: 45,
    machineType: 'singleNeedle',
    skillLevel: 'intermediate',
    status: 'ready',
    dependencies: [],
    assignedOperator: null,
    createdAt: new Date().toISOString(),
    priority: 'high',
    lotNumber: 'LOT-8085-001',
    articleNumber: '8085',
    articleName: 'Polo T-Shirt',
    color: 'Red',
    size: 'XL',
    icon: '👜',
    wipId: Date.now()
  },
  {
    id: `B8085-005-pocket-attach`,
    bundleId: 'B8085-005',
    bundleData: { 
      bundleId: 'B8085-005', 
      articleNumber: '8085', 
      articleName: 'Polo T-Shirt', 
      color: 'Navy Blue', 
      size: 'M', 
      pieces: 20 
    },
    operation: { 
      id: 'op-10', 
      nameEn: 'Pocket Attach', 
      nameNp: 'पकेट जोड्ने',
      machineType: 'singleNeedle',
      estimatedTimePerPiece: 1.5,
      rate: 3,
      icon: '👜'
    },
    operationId: 'op-10',
    operationName: 'Pocket Attach',
    sequence: 10,
    pieces: 20,
    estimatedTime: 30,
    totalEarnings: 60,
    machineType: 'singleNeedle',
    skillLevel: 'intermediate',
    status: 'ready',
    dependencies: [],
    assignedOperator: null,
    createdAt: new Date().toISOString(),
    priority: 'urgent',
    lotNumber: 'LOT-8085-001',
    articleNumber: '8085',
    articleName: 'Polo T-Shirt',
    color: 'Navy Blue',
    size: 'M',
    icon: '👜',
    wipId: Date.now()
  }
];

try {
  // Add to existing work items
  const existingWorkItems = JSON.parse(localStorage.getItem('workItems') || '[]');
  const updatedWorkItems = [...singleNeedleWorkItems, ...existingWorkItems];
  localStorage.setItem('workItems', JSON.stringify(updatedWorkItems));

  console.log('✅ Single Needle Work Items Added!');
  console.log(`🪡 Added ${singleNeedleWorkItems.length} single needle operations:`);
  
  singleNeedleWorkItems.forEach(item => {
    console.log(`  ${item.id}: ${item.operationName} [${item.pieces} pcs] - रु.${item.totalEarnings} [${item.priority}]`);
  });

  console.log('\n🎯 Ready for Assignment:');
  console.log('• All items are marked as "ready" status');
  console.log('• Machine type: singleNeedle');
  console.log('• Skill level: intermediate');
  console.log('• Total earnings: रु.' + singleNeedleWorkItems.reduce((sum, item) => sum + item.totalEarnings, 0));

  console.log('\n📋 Now you can:');
  console.log('1. Open Work Assignment Manager');
  console.log('2. See these single needle work items');
  console.log('3. Assign them to single needle operators');
  console.log('4. Operators can be assigned work that matches their machine type');

} catch (error) {
  console.error('❌ Error adding single needle work:', error);
}