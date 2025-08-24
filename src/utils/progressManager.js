// Progress Manager Utility
// Handles updating work item and WIP progress status

export const updateWorkItemStatus = (workItemId, newStatus, completedPieces = null) => {
  try {
    const workItems = JSON.parse(localStorage.getItem('workItems') || '[]');
    const updatedWorkItems = workItems.map(item => {
      if (item.id === workItemId) {
        const updatedItem = {
          ...item,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
        
        if (completedPieces !== null) {
          updatedItem.completedPieces = completedPieces;
        }
        
        if (newStatus === 'in_progress') {
          updatedItem.startedAt = new Date().toISOString();
        } else if (newStatus === 'completed') {
          updatedItem.completedAt = new Date().toISOString();
          updatedItem.completedPieces = completedPieces || item.pieces;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    localStorage.setItem('workItems', JSON.stringify(updatedWorkItems));
    
    // Check if this completion enables next operations
    checkAndUpdateDependentOperations(workItemId, updatedWorkItems);
    
    return { success: true, updatedWorkItems };
  } catch (error) {
    console.error('Error updating work item status:', error);
    return { success: false, error: error.message };
  }
};

export const checkAndUpdateDependentOperations = (completedWorkItemId, workItems = null) => {
  try {
    const items = workItems || JSON.parse(localStorage.getItem('workItems') || '[]');
    const completedItem = items.find(item => item.id === completedWorkItemId);
    
    if (!completedItem || completedItem.status !== 'completed') {
      return;
    }
    
    // Find dependent operations (same bundle, waiting status, dependencies include this operation)
    const dependentItems = items.filter(item => 
      item.bundleId === completedItem.bundleId &&
      item.status === 'waiting' &&
      item.dependencies.includes(completedWorkItemId)
    );
    
    // Update dependent items to ready if all their dependencies are completed
    const updatedItems = items.map(item => {
      if (dependentItems.some(dep => dep.id === item.id)) {
        const allDependenciesCompleted = item.dependencies.every(depId => {
          const depItem = items.find(i => i.id === depId);
          return depItem && depItem.status === 'completed';
        });
        
        if (allDependenciesCompleted) {
          return {
            ...item,
            status: 'ready',
            updatedAt: new Date().toISOString()
          };
        }
      }
      return item;
    });
    
    if (updatedItems.some(item => item.status === 'ready' && items.find(i => i.id === item.id)?.status === 'waiting')) {
      localStorage.setItem('workItems', JSON.stringify(updatedItems));
    }
    
  } catch (error) {
    console.error('Error checking dependent operations:', error);
  }
};

export const calculateBundleProgress = (bundleId) => {
  try {
    const workItems = JSON.parse(localStorage.getItem('workItems') || '[]');
    const bundleItems = workItems.filter(item => item.bundleId === bundleId);
    
    if (bundleItems.length === 0) {
      return {
        totalOperations: 0,
        completedOperations: 0,
        inProgressOperations: 0,
        pendingOperations: 0,
        progressPercentage: 0,
        status: 'not_started'
      };
    }
    
    const totalOperations = bundleItems.length;
    const completedOperations = bundleItems.filter(item => item.status === 'completed').length;
    const inProgressOperations = bundleItems.filter(item => 
      item.status === 'in_progress' || item.status === 'assigned'
    ).length;
    const pendingOperations = bundleItems.filter(item => 
      item.status === 'ready' || item.status === 'waiting'
    ).length;
    
    const progressPercentage = Math.round((completedOperations / totalOperations) * 100);
    
    let status = 'not_started';
    if (completedOperations === totalOperations) {
      status = 'completed';
    } else if (completedOperations > 0 || inProgressOperations > 0) {
      status = 'in_progress';
    }
    
    return {
      totalOperations,
      completedOperations,
      inProgressOperations,
      pendingOperations,
      progressPercentage,
      status,
      currentOperation: bundleItems.find(item => 
        item.status === 'in_progress' || item.status === 'assigned'
      ) || bundleItems.find(item => item.status === 'ready')
    };
  } catch (error) {
    console.error('Error calculating bundle progress:', error);
    return { progressPercentage: 0, status: 'error' };
  }
};

export const calculateLotProgress = (lotNumber) => {
  try {
    const workItems = JSON.parse(localStorage.getItem('workItems') || '[]');
    const lotItems = workItems.filter(item => item.lotNumber === lotNumber);
    
    if (lotItems.length === 0) {
      return {
        totalOperations: 0,
        completedOperations: 0,
        inProgressOperations: 0,
        pendingOperations: 0,
        progressPercentage: 0,
        status: 'not_started',
        bundles: []
      };
    }
    
    // Group by bundle to get bundle-level progress
    const bundleIds = [...new Set(lotItems.map(item => item.bundleId))];
    const bundleProgress = bundleIds.map(bundleId => calculateBundleProgress(bundleId));
    
    const totalOperations = lotItems.length;
    const completedOperations = lotItems.filter(item => item.status === 'completed').length;
    const inProgressOperations = lotItems.filter(item => 
      item.status === 'in_progress' || item.status === 'assigned'
    ).length;
    const pendingOperations = lotItems.filter(item => 
      item.status === 'ready' || item.status === 'waiting'
    ).length;
    
    const progressPercentage = Math.round((completedOperations / totalOperations) * 100);
    
    let status = 'not_started';
    if (completedOperations === totalOperations) {
      status = 'completed';
    } else if (completedOperations > 0 || inProgressOperations > 0) {
      status = 'in_progress';
    }
    
    return {
      totalOperations,
      completedOperations,
      inProgressOperations,
      pendingOperations,
      progressPercentage,
      status,
      bundles: bundleProgress
    };
  } catch (error) {
    console.error('Error calculating lot progress:', error);
    return { progressPercentage: 0, status: 'error' };
  }
};

export const assignWorkItemToOperator = (workItemId, operatorId, operatorName) => {
  try {
    const workItems = JSON.parse(localStorage.getItem('workItems') || '[]');
    const updatedWorkItems = workItems.map(item => {
      if (item.id === workItemId) {
        return {
          ...item,
          assignedOperator: operatorName,
          assignedOperatorId: operatorId,
          status: 'assigned',
          assignedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    
    localStorage.setItem('workItems', JSON.stringify(updatedWorkItems));
    
    // Also save assignment record
    const assignments = JSON.parse(localStorage.getItem('workAssignments') || '[]');
    const assignmentRecord = {
      id: `assign-${Date.now()}`,
      workItemId: workItemId,
      operatorId: operatorId,
      operatorName: operatorName,
      assignedAt: new Date().toISOString(),
      status: 'assigned'
    };
    assignments.push(assignmentRecord);
    localStorage.setItem('workAssignments', JSON.stringify(assignments));
    
    return { success: true, updatedWorkItems };
  } catch (error) {
    console.error('Error assigning work item:', error);
    return { success: false, error: error.message };
  }
};

export const startWorkItem = (workItemId) => {
  return updateWorkItemStatus(workItemId, 'in_progress');
};

export const completeWorkItem = (workItemId, completedPieces) => {
  return updateWorkItemStatus(workItemId, 'completed', completedPieces);
};

export const getAllProgressData = () => {
  try {
    const wipEntries = JSON.parse(localStorage.getItem('wipEntries') || '[]');
    const workItems = JSON.parse(localStorage.getItem('workItems') || '[]');
    
    const progressData = wipEntries.map(wip => {
      const lotProgress = calculateLotProgress(wip.lotNumber);
      return {
        ...wip,
        progress: lotProgress,
        workItems: workItems.filter(item => item.lotNumber === wip.lotNumber)
      };
    });
    
    return progressData;
  } catch (error) {
    console.error('Error getting progress data:', error);
    return [];
  }
};