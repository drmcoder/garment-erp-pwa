// Test utility to create self-assignment data for debugging
import { BundleService, WorkItemService } from '../services/FirebaseService';

export const createTestSelfAssignments = async () => {
  console.log('🧪 Creating test self-assignment data...');
  
  try {
    // Create test bundle with self_assigned status
    const testBundle = await BundleService.createBundle({
      articleNumber: 'TEST-BUNDLE-001',
      batchNumber: 'BATCH-TEST-001',
      operation: 'Shoulder Join',
      machineType: 'overlock',
      pieces: 50,
      rate: 5.5,
      color: 'Blue',
      status: 'self_assigned',
      requestedBy: 'test_operator_1',
      selfAssignedAt: new Date(),
      assignedOperator: 'test_operator_1'
    });
    
    // Create test work item with self_assigned status
    const testWorkItem = await WorkItemService.createWorkItem({
      batchNumber: 'WIP-BATCH-TEST-001',
      operation: 'Side Seam',
      machineType: 'singleNeedle',
      pieces: 30,
      rate: 4.25,
      color: 'Red',
      status: 'self_assigned',
      requestedBy: 'test_operator_2',
      selfAssignedAt: new Date(),
      assignedOperator: 'test_operator_2'
    });
    
    console.log('✅ Test data created:', {
      bundle: testBundle.id,
      workItem: testWorkItem.id
    });
    
    return {
      success: true,
      data: {
        bundleId: testBundle.id,
        workItemId: testWorkItem.id
      }
    };
    
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    return { success: false, error: error.message };
  }
};

// Make it available on window for testing
if (typeof window !== 'undefined') {
  window.createTestSelfAssignments = createTestSelfAssignments;
}