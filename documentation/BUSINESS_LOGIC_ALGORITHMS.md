# Comprehensive Business Logic Documentation for Garment ERP PWA

## 1. AI/ML Algorithms and Logic

### Self-Assignment Recommendation Engine

**Algorithm Location**: `/src/components/operator/SelfAssignmentSystem.jsx` (lines 179-274)

```javascript
// AI Recommendation Algorithm
const generateRecommendations = (bundle, user) => {
  let match = 50; // Base score
  const reasons = [];

  // Machine Compatibility Check (Most Critical - 40 points)
  const userMachine = user?.machine || user?.speciality;
  const machineMatches = {
    'overlock': ['overlock', 'ओभरलक', 'Overlock', 'OVERLOCK'],
    'flatlock': ['flatlock', 'फ्ल्यालक', 'Flatlock', 'FLATLOCK'], 
    'singleNeedle': ['singleNeedle', 'single_needle', 'एकल सुई', 'Single Needle'],
    'buttonhole': ['buttonhole', 'बटनहोल', 'Buttonhole', 'BUTTONHOLE'],
    'buttonAttach': ['buttonAttach', 'button_attach', 'बटन जोड्ने'],
    'iron': ['iron', 'pressing', 'इस्त्री प्रेस'],
    'cutting': ['cutting', 'काट्ने मेसिन'],
    'embroidery': ['embroidery', 'कसिदाकारी मेसिन'],
    'manual': ['manual', 'हस्तकला काम']
  };

  // Compatibility Algorithm
  if (isCompatible()) {
    match += 40;
    reasons.push("Perfect machine match");
  } else {
    match = 10; // Very low score for incompatible work
    reasons.push("Machine mismatch");
    return { match, reasons };
  }

  // Difficulty Assessment (5 points)
  if (bundle.difficulty && bundle.difficulty.includes('सामान्य')) {
    match += 5;
    reasons.push("Suitable difficulty");
  }

  // Priority Bonus (5 points)
  if (bundle.priority === 'high') {
    match += 5;
    reasons.push("High priority");
  }

  // Time Estimation Bonus (5 points)
  const estimatedTime = bundle.estimatedTime || 30;
  if (estimatedTime < 30) {
    match += 5;
    reasons.push("Quick work");
  }

  return {
    match: Math.min(match, 100),
    reasons: reasons.slice(0, 3)
  };
};
```

### Operator-Work Matching Algorithm

**Algorithm Location**: `/src/lib/businessLogic.js` (lines 95-144)

```javascript
// Work Assignment Logic
export const workAssignmentLogic = {
  // Calculate work priority score
  calculatePriorityScore: (workItem) => {
    const priority = PRIORITIES[workItem.priority];
    const urgencyScore = priority?.level || 3;
    
    // Factor in due date
    const dueDate = new Date(workItem.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    let dueDateScore = 0;
    if (daysUntilDue <= 1) dueDateScore = 10;
    else if (daysUntilDue <= 3) dueDateScore = 7;
    else if (daysUntilDue <= 7) dueDateScore = 5;
    else dueDateScore = 1;

    return urgencyScore * 2 + dueDateScore;
  },

  // Calculate operator-work match score
  calculateMatchScore: (workItem, operator) => {
    let score = 0;

    // Machine type match (50 points)
    if (operator.machineTypes?.includes(workItem.machineType)) {
      score += 50;
    }

    // Skill level compatibility (30 points + 10 bonus for exact match)
    const requiredSkill = workItem.requiredSkillLevel || 'beginner';
    const operatorSkill = operator.skillLevel || 'beginner';
    const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
    
    const requiredIndex = skillLevels.indexOf(requiredSkill);
    const operatorIndex = skillLevels.indexOf(operatorSkill);
    
    if (operatorIndex >= requiredIndex) {
      score += 30;
      if (operatorIndex === requiredIndex) score += 10; // Exact match bonus
    }

    // Workload consideration (max 20 points)
    const currentWorkload = operator.currentAssignments?.length || 0;
    score += Math.max(0, 20 - (currentWorkload * 5));

    // Performance history bonus (15 points max)
    if (operator.averageEfficiency > 0.8) score += 10;
    if (operator.qualityScore > 0.9) score += 5;

    return score;
  }
};
```

## 2. Business Logic Formulas

### Earnings Calculation with Bonuses/Penalties

**Formula Location**: `/src/lib/businessLogic.js` (lines 7-71)

```javascript
export const paymentLogic = {
  // Base payment calculation
  calculateBasePayment: (rate, pieces) => {
    const baseRate = parseFloat(rate) || 0;
    const totalPieces = parseInt(pieces) || 0;
    return baseRate * totalPieces;
  },

  // Efficiency bonus calculation
  calculateWithEfficiencyBonus: (basePayment, efficiency, bonusThreshold = 0.9) => {
    if (efficiency >= bonusThreshold) {
      const bonusRate = Math.min((efficiency - bonusThreshold) * 2, 0.5); // Max 50% bonus
      return basePayment * (1 + bonusRate);
    }
    return basePayment;
  },

  // Damage-aware payment calculation
  calculateDamageAwarePayment: (bundleData, completionData, damageReports = []) => {
    const basePayment = paymentLogic.calculateBasePayment(
      bundleData.rate, 
      completionData.piecesCompleted
    );

    // Categorize damage reports
    const operatorFaultDamages = damageReports.filter(report => 
      ['stitching_defect', 'needle_damage', 'tension_issue', 'alignment_error'].includes(report.damageType)
    );

    // Calculate penalties (only for operator faults)
    let totalPenalty = 0;
    operatorFaultDamages.forEach(damage => {
      const severity = damage.severity || 'minor';
      const penaltyRates = {
        minor: 0.1,   // 10% reduction per piece
        major: 0.25,  // 25% reduction per piece  
        severe: 0.5   // 50% reduction per piece
      };
      
      const penalty = basePayment * (penaltyRates[severity] || 0.1) * (damage.affectedPieces || 1);
      totalPenalty += penalty;
    });

    return {
      basePayment,
      penalties: totalPenalty,
      finalPayment: Math.max(0, basePayment - totalPenalty),
      operatorFaultDamages: operatorFaultDamages.length,
      nonOperatorFaultDamages: damageReports.length - operatorFaultDamages.length
    };
  }
};
```

### Detailed Damage Deduction Algorithm

**Formula Location**: `/src/services/EarningsService.js` (lines 80-115)

```javascript
static calculateDamageDeduction(damageInfo, baseEarnings) {
  const { damageType, severity, pieces, operatorFault } = damageInfo;
  
  // If not operator's fault, no deduction
  if (!operatorFault) return 0;

  let deductionPercentage = 0;

  // Deduction based on damage type
  switch (damageType) {
    case 'broken_stitch':
      deductionPercentage = severity === 'major' ? 0.15 : 0.05;
      break;
    case 'wrong_measurement':
      deductionPercentage = severity === 'major' ? 0.20 : 0.10;
      break;
    case 'fabric_damage':
      deductionPercentage = severity === 'major' ? 0.25 : 0.10;
      break;
    case 'missing_operation':
      deductionPercentage = 0.30; // Always major
      break;
    default:
      deductionPercentage = 0.05;
  }

  // Calculate piece-based deduction
  const piecesAffected = pieces || 1;
  const totalWorkPieces = damageInfo.totalPieces || 1;
  const affectedRatio = piecesAffected / totalWorkPieces;
  
  return Math.round(baseEarnings * deductionPercentage * affectedRatio);
}
```

### Operation Rate Calculation Formula

**Formula Location**: `/src/services/OperationRateService.js` (lines 8-27)

```javascript
class OperationRateService {
  // Formula constants
  static TIME_MULTIPLIER = 1.9; // time = rate * 1.9 minutes
  
  // Calculate time from rate: time = rate * 1.9
  static calculateTimeFromRate(rate) {
    return parseFloat((rate * this.TIME_MULTIPLIER).toFixed(1));
  }
  
  // Calculate rate from time: rate = time / 1.9
  static calculateRateFromTime(time) {
    return parseFloat((time / this.TIME_MULTIPLIER).toFixed(2));
  }
}
```

### Efficiency Calculation Formulas

**Formula Location**: `/src/lib/businessLogic.js` (lines 244-282)

```javascript
export const metricsLogic = {
  // Calculate operator efficiency
  calculateEfficiency: (actualTime, standardTime) => {
    if (!actualTime || !standardTime) return 0;
    return Math.min(2.0, standardTime / actualTime); // Cap at 200%
  },

  // Calculate daily production metrics
  calculateDailyMetrics: (completedWork) => {
    const totalPieces = completedWork.reduce((sum, work) => 
      sum + (work.completedPieces || 0), 0
    );
    
    const totalTime = completedWork.reduce((sum, work) => 
      sum + (work.timeSpent || 0), 0
    );
    
    const averageEfficiency = completedWork.length > 0 ? 
      completedWork.reduce((sum, work) => sum + (work.efficiency || 0), 0) / completedWork.length : 0;

    return {
      totalPieces,
      totalTime,
      averageEfficiency,
      bundlesCompleted: completedWork.length,
      piecesPerHour: totalTime > 0 ? (totalPieces / (totalTime / 60)) : 0
    };
  },

  // Calculate line efficiency
  calculateLineEfficiency: (operatorMetrics) => {
    if (operatorMetrics.length === 0) return 0;
    
    const totalEfficiency = operatorMetrics.reduce((sum, operator) => 
      sum + (operator.efficiency || 0), 0
    );
    
    return totalEfficiency / operatorMetrics.length;
  }
};
```

### Quality Score Calculations

**Formula Location**: `/src/lib/businessLogic.js` (lines 194-241)

```javascript
export const qualityLogic = {
  // Calculate quality score based on damage reports
  calculateQualityScore: (completedPieces, damageReports = []) => {
    if (completedPieces === 0) return 1.0;
    
    const totalDamaged = damageReports.reduce((sum, report) => 
      sum + (report.affectedPieces || 1), 0
    );
    
    const qualityPieces = Math.max(0, completedPieces - totalDamaged);
    return qualityPieces / completedPieces;
  },

  // Calculate defect severity impact
  calculateDefectImpact: (damageType, affectedPieces, totalPieces) => {
    const severityWeights = {
      'fabric_hole': 0.8,
      'color_issue': 0.6,
      'stitching_defect': 1.0,
      'size_issue': 0.9,
      'alignment_error': 0.7
    };

    const weight = severityWeights[damageType] || 0.5;
    const affectedRatio = affectedPieces / totalPieces;
    
    return {
      impactScore: weight * affectedRatio,
      category: affectedRatio > 0.1 ? 'major' : affectedRatio > 0.05 ? 'minor' : 'minimal'
    };
  }
};
```

## 3. Assignment Logic

### Race Condition Prevention in Self-Assignment

**Algorithm Location**: `/src/services/WorkAssignmentService.js` (lines 9-75)

```javascript
// Atomic self-assignment with race condition protection
static async atomicSelfAssign(workId, operatorId, operatorInfo) {
  const workRef = ref(rtdb, `${RT_PATHS.AVAILABLE_WORK}/${workId}`);
  
  try {
    const result = await runTransaction(workRef, (currentData) => {
      // Check if work is still available
      if (!currentData) {
        return; // Abort - work doesn't exist
      }
      
      if (currentData.assigned && currentData.assignedTo) {
        return; // Abort - already assigned
      }
      
      if (currentData.status !== 'available') {
        return; // Abort - not available
      }
      
      // SUCCESS: Assign the work atomically
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
      // Update operator status in parallel (non-blocking)
      this.updateOperatorAssignment(operatorId, workId, result.snapshot.val());
      
      return {
        success: true,
        workData: result.snapshot.val(),
        message: 'Work assigned successfully'
      };
    } else {
      return {
        success: false,
        error: 'Work already assigned to another operator',
        message: 'Someone else got this work first!'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: 'Assignment failed due to system error'
    };
  }
}
```

### Machine Compatibility Validation Algorithm

**Algorithm Location**: `/src/utils/machineCompatibility.js` (lines 46-113)

```javascript
static isCompatible(operator, workItem) {
  // Validate inputs
  if (!operator || !workItem) {
    return {
      compatible: false,
      reason: 'Invalid operator or work item data',
      severity: 'high'
    };
  }

  // Extract machine types
  const operatorMachine = this.normalizeMachineType(operator.machine);
  const workMachine = this.normalizeMachineType(workItem.machineType);

  // Multi-skill operators can handle any work
  if (operatorMachine === 'multi-skill') {
    return {
      compatible: true,
      reason: 'Multi-skill operator can handle any work type',
      confidence: 'high'
    };
  }

  // Check if machines are missing
  if (!operatorMachine) {
    return {
      compatible: false,
      reason: 'Operator machine type not specified',
      severity: 'medium'
    };
  }

  if (!workMachine) {
    return {
      compatible: false,
      reason: 'Work item machine type not specified',
      severity: 'medium'
    };
  }

  // Direct machine type match
  if (operatorMachine === workMachine) {
    return {
      compatible: true,
      reason: `Exact machine match: ${operatorMachine}`,
      confidence: 'high'
    };
  }

  // No compatibility found
  return {
    compatible: false,
    reason: `Machine mismatch: operator has ${operatorMachine}, work requires ${workMachine}`,
    severity: 'high'
  };
}
```

### Workload Balancing Algorithm

**Algorithm Location**: `/src/services/BusinessLogicService.js` (lines 202-236)

```javascript
// Workload balancing
static balanceWorkload(operators, workItems) {
  if (!operators || !workItems || operators.length === 0 || workItems.length === 0) {
    return [];
  }
  
  // Calculate current workload for each operator
  const operatorWorkloads = operators.map(operator => {
    const assignedWork = workItems.filter(w => 
      w.operatorId === operator.id && 
      ['assigned', 'in_progress'].includes(w.status)
    );
    
    const totalPieces = assignedWork.reduce((sum, w) => sum + (w.pieces || w.targetPieces || 0), 0);
    const estimatedHours = assignedWork.reduce((sum, w) => sum + (w.estimatedHours || 1), 0);
    
    return {
      ...operator,
      currentWorkload: {
        assignments: assignedWork.length,
        pieces: totalPieces,
        estimatedHours
      }
    };
  });
  
  // Sort by workload (ascending) to find least loaded operators first
  operatorWorkloads.sort((a, b) => {
    const aLoad = a.currentWorkload.assignments * 10 + a.currentWorkload.estimatedHours;
    const bLoad = b.currentWorkload.assignments * 10 + b.currentWorkload.estimatedHours;
    return aLoad - bLoad;
  });
  
  return operatorWorkloads;
}
```

## 4. Data Transformation Logic

### WIP to Bundle Conversion Algorithm

**Algorithm Location**: `/src/services/business/bundle-service.js` (lines 237-273)

```javascript
// Format work items as bundles
static formatWorkItemsAsBundles(workItems) {
  return workItems.map((workItem, index) => {
    return {
      id: workItem.id,
      article: workItem.article,
      articleNumber: workItem.article,
      articleName: workItem.articleName,
      size: workItem.size,
      color: workItem.color,
      pieces: workItem.pieces,
      quantity: workItem.pieces,
      completedPieces: workItem.completedPieces || 0,
      status: workItem.status,
      machineType: workItem.machineType,
      currentOperation: workItem.currentOperation,
      priority: workItem.priority || 'medium',
      deadline: workItem.deadline,
      assignedOperator: workItem.assignedOperator,
      assignedAt: workItem.assignedAt,
      lotNumber: workItem.lotNumber,
      rollNumber: workItem.rollNumber,
      wipEntryId: workItem.wipEntryId,
      createdAt: workItem.createdAt
    };
  });
}
```

### Bundle ID Generation Algorithm

**Algorithm Location**: `/src/utils/bundleIdGenerator.js` (lines 5-27)

```javascript
// Format: B:batch:article:S:size:color:pieces
export const generateBundleId = (bundleData) => {
  const {
    batchNumber = '001',
    articleNumber = '0000',
    size = 'M',
    color = 'def',
    pieces = 0,
    quantity = 0,
    colorQuantity = 1 // Number of items of this color in the bundle
  } = bundleData;

  // Use pieces or quantity, whichever is available
  const totalPieces = pieces || quantity || 0;

  // Normalize size (convert to standard format)
  const normalizedSize = normalizeSize(size);

  // Normalize color (convert to 3-letter code with quantity prefix if > 1)
  const colorCode = normalizeColor(color, colorQuantity);

  // Format: B:batch:article:S:size:color:pieces
  return `B:${batchNumber}:${articleNumber}:S:${normalizedSize}:${colorCode}:${totalPieces}P`;
};
```

### Progress Calculation Algorithms

**Algorithm Location**: `/src/utils/progressManager.js` (lines 90-138)

```javascript
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
      item.status === 'in_progress' || item.status === 'assigned' || item.status === 'self_assigned'
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
        item.status === 'in_progress' || item.status === 'assigned' || item.status === 'self_assigned'
      ) || bundleItems.find(item => item.status === 'ready')
    };
  } catch (error) {
    console.error('Error calculating bundle progress:', error);
    return { progressPercentage: 0, status: 'error' };
  }
};
```

## 5. Complex Business Rules

### Workflow State Machine

**Algorithm Location**: `/src/lib/workflowManager.js` (lines 8-85)

```javascript
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
```

### Data Aggregation and Analytics Algorithms

**Algorithm Location**: `/src/lib/dataProcessor.js` (lines 8-127)

```javascript
export const dataAggregator = {
  // Calculate aggregated metrics
  calculateMetrics: (data, metricDefinitions) => {
    const results = {};
    
    Object.entries(metricDefinitions).forEach(([metricName, definition]) => {
      const { field, type, filter } = definition;
      let filteredData = filter ? data.filter(filter) : data;
      
      switch (type) {
        case 'sum':
          results[metricName] = filteredData.reduce((sum, item) => 
            sum + (parseFloat(item[field]) || 0), 0);
          break;
          
        case 'average':
          const total = filteredData.reduce((sum, item) => 
            sum + (parseFloat(item[field]) || 0), 0);
          results[metricName] = filteredData.length > 0 ? total / filteredData.length : 0;
          break;
          
        case 'count':
          results[metricName] = filteredData.length;
          break;
          
        case 'max':
          results[metricName] = Math.max(...filteredData.map(item => 
            parseFloat(item[field]) || 0));
          break;
          
        case 'min':
          results[metricName] = Math.min(...filteredData.map(item => 
            parseFloat(item[field]) || 0));
          break;
          
        case 'unique':
          const uniqueValues = new Set(filteredData.map(item => item[field]));
          results[metricName] = uniqueValues.size;
          break;
      }
    });
    
    return results;
  },

  // Create summary statistics
  summarizeNumericField: (data, field) => {
    const values = data
      .map(item => parseFloat(item[field]))
      .filter(value => !isNaN(value))
      .sort((a, b) => a - b);
    
    if (values.length === 0) {
      return { count: 0, sum: 0, mean: 0, median: 0, min: 0, max: 0, stdDev: 0 };
    }
    
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const median = values.length % 2 === 0 ? 
      (values[values.length / 2 - 1] + values[values.length / 2]) / 2 :
      values[Math.floor(values.length / 2)];
    
    const variance = values.reduce((sum, value) => 
      sum + Math.pow(value - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      count: values.length,
      sum,
      mean: Math.round(mean * 100) / 100,
      median,
      min: values[0],
      max: values[values.length - 1],
      stdDev: Math.round(stdDev * 100) / 100
    };
  }
};
```

This comprehensive documentation captures all the critical business logic, algorithms, formulas, and implementation details from your garment ERP PWA codebase. Each algorithm includes the exact mathematical formulas, decision trees, and business rules needed for precise reconstruction of the system's functionality.