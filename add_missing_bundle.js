// Add Missing Bundle to Firestore - Run in browser console where Firebase is available

async function addMissingBundleToFirestore() {
  console.log('➕ ADDING MISSING BUNDLE TO FIRESTORE...');
  
  try {
    // The specific bundle that's causing the error
    const missingBundle = {
      id: 'B727970-w-DD-S',
      bundleId: 'B727970-w-DD-S', 
      bundleNumber: 'B727970',
      article: 727970,
      articleNumber: 727970,
      articleName: 'Work Shirt',
      color: 'Dark Blue',
      colorCode: 'DD',
      size: 'S',
      pieces: 25,
      quantity: 25,
      rate: 3.5,
      totalValue: 87.5,
      priority: 'medium',
      status: 'pending',
      machineType: 'overlock',
      operation: 'shoulderJoin',
      currentOperation: 'shoulderJoin',
      assignedOperator: null,
      assignedLine: 'line-1',
      estimatedTime: 45,
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      department: 'sewing',
      shift: 'morning',
      // Add checklist for the operation
      checklist: [
        {
          id: 'cut_check',
          name: 'Cutting Quality Check',
          nameNp: 'काटन गुणस्तर जाँच',
          estimatedTime: 5,
          completed: false,
          completedAt: null,
          completedBy: null,
          notes: ''
        },
        {
          id: 'alignment', 
          name: 'Shoulder Alignment',
          nameNp: 'काँध मिलान',
          estimatedTime: 8,
          completed: false,
          completedAt: null,
          completedBy: null,
          notes: ''
        },
        {
          id: 'seam_stitch',
          name: 'Seam Stitching', 
          nameNp: 'सिलाई सिम',
          estimatedTime: 12,
          completed: false,
          completedAt: null,
          completedBy: null,
          notes: ''
        },
        {
          id: 'overlock_finish',
          name: 'Overlock Finishing',
          nameNp: 'ओभरलक फिनिशिङ', 
          estimatedTime: 10,
          completed: false,
          completedAt: null,
          completedBy: null,
          notes: ''
        },
        {
          id: 'quality_check',
          name: 'Final Quality Check',
          nameNp: 'अन्तिम गुणस्तर जाँच',
          estimatedTime: 5,
          completed: false,
          completedAt: null,
          completedBy: null,
          notes: ''
        }
      ]
    };
    
    // Try to access Firebase from the app context
    if (typeof window !== 'undefined' && (window.firebase || window.db)) {
      console.log('🔥 Firebase detected, attempting to create bundle...');
      
      // This would need the actual Firebase modules - showing what needs to be done
      console.log('⚠️ To add this bundle, you need to either:');
      console.log('1. Add it via Firebase Console (recommended)');
      console.log('2. Run this in app context with Firebase modules available');
      
    } else {
      console.log('📋 MANUAL CREATION INSTRUCTIONS:');
      console.log('Go to Firebase Console and create this bundle:');
    }
    
    console.log('\n🎯 BUNDLE DATA TO CREATE:');
    console.log('Collection: bundles');
    console.log('Document ID:', missingBundle.id);
    console.log('Data:', JSON.stringify(missingBundle, null, 2));
    
    // Also check what other bundles might be missing
    console.log('\n🔍 CHECKING FOR OTHER MISSING BUNDLES...');
    const bundleKeys = ['bundles', 'workItems', 'sampleBundles'];
    
    bundleKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            console.log(`\n📦 ${key} (${parsed.length} bundles):`);
            parsed.forEach(bundle => {
              const id = bundle.id || bundle.bundleId || 'unknown';
              const operation = bundle.operation || bundle.currentOperation || 'unknown';
              console.log(`   - ${id}: ${bundle.bundleNumber || 'N/A'} (${operation})`);
            });
          }
        } catch (e) {
          console.log(`⚠️ Could not parse ${key}`);
        }
      }
    });
    
    console.log('\n✅ NEXT STEPS:');
    console.log('1. Go to: https://console.firebase.google.com/project/code-for-erp/firestore');
    console.log('2. Navigate to "bundles" collection');
    console.log('3. Click "Add document"');
    console.log('4. Use Document ID: B727970-w-DD-S');
    console.log('5. Copy and paste the bundle data above');
    console.log('6. Repeat for any other missing bundles found');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the function
addMissingBundleToFirestore();