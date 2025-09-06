// File: src/services/WorkAssignmentService.js
// Atomic work assignment service to prevent race conditions

import { rtdb, RT_PATHS } from '../config/realtime-firebase';
import { ref, runTransaction, get, serverTimestamp, onValue } from 'firebase/database';

class WorkAssignmentService {
  
  // Atomic self-assignment with race condition protection
  static async atomicSelfAssign(workId, operatorId, operatorInfo) {
    const workRef = ref(rtdb, `${RT_PATHS.AVAILABLE_WORK}/${workId}`);
    
    try {
      console.log(`🔄 Attempting atomic assignment: ${workId} → ${operatorId}`);
      
      const result = await runTransaction(workRef, (currentData) => {
        // Check if work is still available
        if (!currentData) {
          console.log(`❌ Work ${workId} doesn't exist`);
          return; // Abort - work doesn't exist
        }
        
        if (currentData.assigned && currentData.assignedTo) {
          console.log(`❌ Work ${workId} already assigned to ${currentData.assignedTo}`);
          return; // Abort - already assigned
        }
        
        if (currentData.status !== 'available') {
          console.log(`❌ Work ${workId} not available (status: ${currentData.status})`);
          return; // Abort - not available
        }
        
        // SUCCESS: Assign the work atomically
        console.log(`✅ Assigning work ${workId} to ${operatorId}`);
        return {
          ...currentData,
          assigned: true,
          assignedTo: operatorId,
          assignedAt: serverTimestamp(),
          operatorName: operatorInfo.name,
          operatorMachine: operatorInfo.machineType,
          status: 'assigned',
          assignmentMethod: 'self-assign'
        };
      });
      
      if (result.committed) {
        console.log(`🎉 SUCCESS: Work ${workId} assigned to ${operatorId}`);
        
        // Update operator status in parallel (non-blocking)
        this.updateOperatorAssignment(operatorId, workId, result.snapshot.val());
        
        return {
          success: true,
          workData: result.snapshot.val(),
          message: 'Work assigned successfully'
        };
      } else {
        console.log(`❌ FAILED: Could not assign work ${workId} to ${operatorId}`);
        return {
          success: false,
          error: 'Work already assigned to another operator',
          message: 'Someone else got this work first!'
        };
      }
      
    } catch (error) {
      console.error(`❌ Transaction error for work ${workId}:`, error);
      return {
        success: false,
        error: error.message,
        message: 'Assignment failed due to system error'
      };
    }
  }
  
  // Update operator's current assignment
  static async updateOperatorAssignment(operatorId, workId, workData) {
    try {
      const operatorStatusRef = ref(rtdb, `${RT_PATHS.OPERATOR_STATUS}/${operatorId}`);
      
      await runTransaction(operatorStatusRef, (currentStatus) => {
        return {
          ...currentStatus,
          status: 'assigned',
          currentWork: {
            workId: workId,
            bundleId: workData.bundleId,
            article: workData.article,
            pieces: workData.pieces,
            assignedAt: new Date().toISOString()
          },
          lastActivity: serverTimestamp()
        };
      });
      
      console.log(`✅ Updated operator ${operatorId} status`);
    } catch (error) {
      console.error(`❌ Failed to update operator ${operatorId} status:`, error);
    }
  }
  
  // Release work assignment (if operator cancels)
  static async releaseWork(workId, operatorId) {
    const workRef = ref(rtdb, `${RT_PATHS.AVAILABLE_WORK}/${workId}`);
    
    try {
      const result = await runTransaction(workRef, (currentData) => {
        if (!currentData || currentData.assignedTo !== operatorId) {
          return; // Can only release own work
        }
        
        return {
          ...currentData,
          assigned: false,
          assignedTo: null,
          assignedAt: null,
          operatorName: null,
          operatorMachine: null,
          status: 'available',
          releasedAt: serverTimestamp(),
          releasedBy: operatorId
        };
      });
      
      if (result.committed) {
        // Update operator status
        const operatorStatusRef = ref(rtdb, `${RT_PATHS.OPERATOR_STATUS}/${operatorId}`);
        await runTransaction(operatorStatusRef, (currentStatus) => ({
          ...currentStatus,
          status: 'active',
          currentWork: null
        }));
        
        return { success: true };
      } else {
        return { success: false, error: 'Could not release work' };
      }
      
    } catch (error) {
      console.error('Error releasing work:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Get available work with real-time listener
  static subscribeToAvailableWork(callback) {
    const workRef = ref(rtdb, RT_PATHS.AVAILABLE_WORK);
    
    return onValue(workRef, (snapshot) => {
      const allWork = snapshot.val() || {};
      
      // Filter only available work
      const availableWork = Object.entries(allWork)
        .filter(([_, work]) => work.status === 'available' && !work.assigned)
        .map(([id, work]) => ({ id, ...work }));
      
      callback(availableWork);
    });
  }
  
  // Batch assignment for testing race conditions
  static async testRaceCondition(workId, operatorIds) {
    console.log(`🧪 Testing race condition for work ${workId} with ${operatorIds.length} operators`);
    
    const promises = operatorIds.map(operatorId => 
      this.atomicSelfAssign(workId, operatorId, { 
        name: `Operator ${operatorId}`, 
        machineType: 'test' 
      })
    );
    
    const results = await Promise.all(promises);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`🧪 Race condition test results:`);
    console.log(`✅ Successful assignments: ${successful.length}`);
    console.log(`❌ Failed assignments: ${failed.length}`);
    console.log(`Winner: ${successful[0]?.workData?.assignedTo || 'None'}`);
    
    return {
      successful: successful.length,
      failed: failed.length,
      winner: successful[0]?.workData?.assignedTo
    };
  }
}

export { WorkAssignmentService };
export default WorkAssignmentService;