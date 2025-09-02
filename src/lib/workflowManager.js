// src/lib/workflowManager.js
// Centralized workflow and WIP management utilities

import { WORKFLOW_TYPES, INSERTION_POINTS, WORK_STATUSES } from '../constants';
import { arrayUtils, dateUtils, debugUtils } from './appUtils';

// Workflow State Management
export const workflowStateManager = {
  // Create a new workflow instance
  createWorkflow: (definition, initialData = {}) => {
    return {
      id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      definition,
      currentStep: definition.steps?.[0]?.id || null,
      completedSteps: [],
      stepData: {},
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...initialData
    };
  },

  // Progress to next step
  progressWorkflow: (workflowInstance) => {
    const { definition, currentStep, completedSteps } = workflowInstance;
    const steps = definition.steps || [];
    
    // Mark current step as completed
    if (currentStep && !completedSteps.includes(currentStep)) {
      completedSteps.push(currentStep);
    }

    // Find next step based on workflow type
    let nextStep = null;
    const currentIndex = steps.findIndex(step => step.id === currentStep);

    if (definition.type === WORKFLOW_TYPES.SEQUENTIAL) {
      // Sequential: move to next step in order
      if (currentIndex >= 0 && currentIndex < steps.length - 1) {
        nextStep = steps[currentIndex + 1].id;
      }
    } else if (definition.type === WORKFLOW_TYPES.PARALLEL) {
      // Parallel: all steps can be worked on simultaneously
      const incompleteSteps = steps.filter(step => !completedSteps.includes(step.id));
      nextStep = incompleteSteps[0]?.id || null;
    }

    return {
      ...workflowInstance,
      currentStep: nextStep,
      completedSteps: [...completedSteps],
      status: nextStep ? 'active' : 'completed',
      updatedAt: new Date()
    };
  },

  // Check if workflow can progress
  canProgress: (workflowInstance) => {
    const { definition, currentStep, completedSteps } = workflowInstance;
    const steps = definition.steps || [];
    const currentStepDef = steps.find(s => s.id === currentStep);

    if (!currentStepDef) return false;

    // Check if all dependencies are met
    const dependencies = currentStepDef.dependencies || [];
    return dependencies.every(dep => completedSteps.includes(dep));
  },

  // Get available next steps
  getAvailableSteps: (workflowInstance) => {
    const { definition, completedSteps } = workflowInstance;
    const steps = definition.steps || [];

    return steps.filter(step => {
      // Skip already completed steps
      if (completedSteps.includes(step.id)) return false;

      // Check dependencies
      const dependencies = step.dependencies || [];
      return dependencies.every(dep => completedSteps.includes(dep));
    });
  }
};

// WIP (Work In Progress) Management
export const wipManager = {
  // Create WIP entry
  createWIPEntry: (bundleId, operationData, operatorId) => {
    return {
      id: `wip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bundleId,
      operatorId,
      operation: operationData,
      status: WORK_STATUSES.IN_PROGRESS,
      startTime: new Date(),
      pieces: {
        total: operationData.targetPieces || 0,
        completed: 0,
        inProgress: 0,
        rework: 0
      },
      quality: {
        passedQC: 0,
        failedQC: 0,
        reworkRequired: 0
      },
      timeline: [{
        event: 'started',
        timestamp: new Date(),
        operator: operatorId
      }],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  // Update WIP progress
  updateProgress: (wipEntry, completedPieces, qualityData = {}) => {
    const updatedPieces = {
      ...wipEntry.pieces,
      completed: completedPieces,
      inProgress: Math.max(0, wipEntry.pieces.total - completedPieces)
    };

    const updatedQuality = {
      ...wipEntry.quality,
      ...qualityData
    };

    // Add timeline entry
    const timelineEntry = {
      event: 'progress_update',
      timestamp: new Date(),
      completedPieces,
      qualityData
    };

    return {
      ...wipEntry,
      pieces: updatedPieces,
      quality: updatedQuality,
      timeline: [...wipEntry.timeline, timelineEntry],
      updatedAt: new Date(),
      status: completedPieces >= wipEntry.pieces.total ? 
        WORK_STATUSES.COMPLETED : WORK_STATUSES.IN_PROGRESS
    };
  },

  // Calculate WIP efficiency
  calculateEfficiency: (wipEntry) => {
    const { startTime, pieces, operation } = wipEntry;
    const timeElapsed = (Date.now() - new Date(startTime)) / (1000 * 60); // minutes
    const standardTime = (operation.standardTime || 5) * pieces.completed; // total standard minutes
    
    if (timeElapsed === 0 || standardTime === 0) return 0;
    return Math.min(2.0, standardTime / timeElapsed); // Cap at 200%
  },

  // Check if WIP needs attention
  needsAttention: (wipEntry, thresholds = {}) => {
    const {
      maxIdleTime = 60,      // minutes
      minEfficiency = 0.7,   // 70%
      maxQualityFailures = 5 // pieces
    } = thresholds;

    const now = new Date();
    const lastUpdate = new Date(wipEntry.updatedAt);
    const idleTime = (now - lastUpdate) / (1000 * 60); // minutes

    const efficiency = wipManager.calculateEfficiency(wipEntry);
    const qualityFailures = wipEntry.quality.failedQC || 0;

    return {
      idle: idleTime > maxIdleTime,
      lowEfficiency: efficiency < minEfficiency,
      qualityIssues: qualityFailures > maxQualityFailures,
      needsAttention: idleTime > maxIdleTime || 
                     efficiency < minEfficiency || 
                     qualityFailures > maxQualityFailures
    };
  }
};

// Operation Sequence Management
export const operationSequencer = {
  // Create operation sequence
  createSequence: (operations, sequenceType = WORKFLOW_TYPES.SEQUENTIAL) => {
    const sequence = {
      id: `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: sequenceType,
      operations: operations.map((op, index) => ({
        ...op,
        sequence: index + 1,
        dependencies: sequenceType === WORKFLOW_TYPES.SEQUENTIAL && index > 0 ? 
          [operations[index - 1].id] : (op.dependencies || [])
      })),
      createdAt: new Date()
    };

    return sequence;
  },

  // Insert operation into sequence
  insertOperation: (sequence, newOperation, insertionPoint = INSERTION_POINTS.AT_END, referenceOpId = null) => {
    const operations = [...sequence.operations];
    
    switch (insertionPoint) {
      case INSERTION_POINTS.AT_BEGINNING:
        operations.unshift({ ...newOperation, sequence: 0 });
        break;
        
      case INSERTION_POINTS.AT_END:
        operations.push({ ...newOperation, sequence: operations.length });
        break;
        
      case INSERTION_POINTS.AFTER_CURRENT:
        const afterIndex = operations.findIndex(op => op.id === referenceOpId);
        if (afterIndex >= 0) {
          operations.splice(afterIndex + 1, 0, { ...newOperation, sequence: afterIndex + 1.5 });
        }
        break;
        
      case INSERTION_POINTS.BEFORE_NEXT:
        const beforeIndex = operations.findIndex(op => op.id === referenceOpId);
        if (beforeIndex >= 0) {
          operations.splice(beforeIndex, 0, { ...newOperation, sequence: beforeIndex - 0.5 });
        }
        break;
        
      case INSERTION_POINTS.PARALLEL:
        // Add as parallel operation to reference operation
        const parallelIndex = operations.findIndex(op => op.id === referenceOpId);
        if (parallelIndex >= 0) {
          const referenceOp = operations[parallelIndex];
          operations.splice(parallelIndex + 1, 0, {
            ...newOperation,
            sequence: referenceOp.sequence,
            isParallel: true,
            parallelGroup: referenceOp.parallelGroup || referenceOp.id
          });
        }
        break;
    }

    // Resequence operations
    operations.forEach((op, index) => {
      if (!op.isParallel) {
        op.sequence = index + 1;
      }
    });

    return {
      ...sequence,
      operations,
      updatedAt: new Date()
    };
  },

  // Remove operation from sequence
  removeOperation: (sequence, operationId) => {
    const operations = sequence.operations.filter(op => op.id !== operationId);
    
    // Resequence remaining operations
    operations.forEach((op, index) => {
      if (!op.isParallel) {
        op.sequence = index + 1;
      }
    });

    return {
      ...sequence,
      operations,
      updatedAt: new Date()
    };
  },

  // Get next operation in sequence
  getNextOperation: (sequence, currentOperationId) => {
    const operations = sequence.operations;
    const currentIndex = operations.findIndex(op => op.id === currentOperationId);
    
    if (currentIndex >= 0 && currentIndex < operations.length - 1) {
      return operations[currentIndex + 1];
    }
    
    return null;
  },

  // Check if operation can be started
  canStartOperation: (sequence, operationId, completedOperations = []) => {
    const operation = sequence.operations.find(op => op.id === operationId);
    if (!operation) return false;

    // Check dependencies
    const dependencies = operation.dependencies || [];
    return dependencies.every(dep => completedOperations.includes(dep));
  }
};

// Bundle Flow Management
export const bundleFlowManager = {
  // Create bundle flow tracking
  createBundleFlow: (bundleId, operationSequence) => {
    return {
      bundleId,
      operationSequence,
      currentOperation: operationSequence.operations[0]?.id || null,
      completedOperations: [],
      operationHistory: [],
      status: 'active',
      startTime: new Date(),
      estimatedCompletion: bundleFlowManager.estimateCompletion(operationSequence),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  },

  // Move bundle to next operation
  progressBundle: (bundleFlow, currentOperationData) => {
    const { operationSequence, currentOperation, completedOperations, operationHistory } = bundleFlow;
    
    // Mark current operation as completed
    if (currentOperation && !completedOperations.includes(currentOperation)) {
      completedOperations.push(currentOperation);
      operationHistory.push({
        operationId: currentOperation,
        completedAt: new Date(),
        ...currentOperationData
      });
    }

    // Find next operation
    const nextOperation = operationSequencer.getNextOperation(operationSequence, currentOperation);

    return {
      ...bundleFlow,
      currentOperation: nextOperation?.id || null,
      completedOperations: [...completedOperations],
      operationHistory: [...operationHistory],
      status: nextOperation ? 'active' : 'completed',
      updatedAt: new Date()
    };
  },

  // Estimate completion time
  estimateCompletion: (operationSequence) => {
    const totalTime = operationSequence.operations.reduce((sum, op) => {
      return sum + (op.estimatedTime || 30); // 30 minutes default
    }, 0);

    const completionDate = new Date();
    completionDate.setMinutes(completionDate.getMinutes() + totalTime);
    return completionDate;
  },

  // Calculate bundle progress percentage
  calculateProgress: (bundleFlow) => {
    const totalOperations = bundleFlow.operationSequence.operations.length;
    const completedOperations = bundleFlow.completedOperations.length;
    
    if (totalOperations === 0) return 100;
    return Math.round((completedOperations / totalOperations) * 100);
  }
};

// Export all workflow management modules
export default {
  workflowStateManager,
  wipManager,
  operationSequencer,
  bundleFlowManager
};