# 🧠 Garment ERP PWA - Application Logic Documentation

## 📋 Table of Contents
- [Business Logic Overview](#business-logic-overview)
- [Workflow Management Logic](#workflow-management-logic)
- [Damage Reporting Logic](#damage-reporting-logic)
- [Payment System Logic](#payment-system-logic)
- [User Role & Permission Logic](#user-role--permission-logic)
- [Real-time Notification Logic](#real-time-notification-logic)
- [Quality Control Logic](#quality-control-logic)
- [Work Assignment Logic](#work-assignment-logic)
- [Bundle Management Logic](#bundle-management-logic)
- [Analytics & Reporting Logic](#analytics--reporting-logic)

---

## 🎯 Business Logic Overview

The Garment ERP PWA implements complex business logic to manage the complete garment manufacturing workflow. All business logic is centralized in the **Core Business Layer** to ensure consistency and maintainability.

### **Core Business Principles:**
- ✅ **Quality First**: No payment until ALL work is quality-approved
- ✅ **Accountability**: Complete audit trail for all operations
- ✅ **Real-time Collaboration**: Instant updates across all users
- ✅ **Fair Compensation**: Transparent payment system based on completed work
- ✅ **Scalable Workflows**: Support for sequential and parallel operations

---

## 🔄 Workflow Management Logic

### **1. Workflow Engine Architecture**
```javascript
// src/core/business/WorkflowEngine.js
class WorkflowEngine {
  // State transition validation
  canTransition(workflowName, currentState, targetState, userRole, permissions) {
    const workflow = this.workflows.get(workflowName);
    const stateConfig = workflow.states[currentState];
    
    // Validate transition path
    if (!stateConfig.transitions.includes(targetState)) return false;
    
    // Validate permissions
    const hasPermission = stateConfig.permissions.some(permission => 
      permissions.includes(permission) || this.hasRolePermission(userRole, permission)
    );
    
    return hasPermission;
  }
}
```

### **2. Sequential vs Parallel Work Logic**
```javascript
// Sequential Workflow (T-Shirt Production)
const sequentialWorkflow = {
  type: 'SEQUENTIAL',
  operations: [
    { id: 'cut_fabric', sequence: 1, dependencies: [] },
    { id: 'sew_shoulders', sequence: 2, dependencies: ['cut_fabric'] },
    { id: 'attach_sleeves', sequence: 3, dependencies: ['sew_shoulders'] },
    { id: 'side_seams', sequence: 4, dependencies: ['attach_sleeves'] }
  ]
};

// Parallel Workflow (Jacket Production) 
const parallelWorkflow = {
  type: 'PARALLEL',
  operations: [
    // These can run simultaneously
    { id: 'sew_front_panels', parallelGroup: 'body_work' },
    { id: 'sew_back_panel', parallelGroup: 'body_work' },
    { id: 'prepare_sleeves', parallelGroup: 'sleeves' },
    // Then sequential assembly
    { id: 'assemble_body', dependencies: ['sew_front_panels', 'sew_back_panel'] }
  ]
};
```

### **3. Work State Transitions**
```javascript
WORK_STATES = {
  PENDING → ASSIGNED → IN_PROGRESS → COMPLETED → QUALITY_CHECK → APPROVED
                                                      ↓
                                                   REJECTED → REWORK → IN_PROGRESS
}

// State transition logic
const executeTransition = async (workItem, targetState, context) => {
  // 1. Validate transition permissions
  if (!canTransition(workItem.status, targetState, context.user.role)) {
    throw new Error('Invalid transition');
  }
  
  // 2. Execute pre-transition hooks
  await runHooks('pre-transition', { workItem, targetState });
  
  // 3. Update work item state
  const updatedWorkItem = {
    ...workItem,
    status: targetState,
    transitionHistory: [...workItem.transitionHistory, {
      from: workItem.status,
      to: targetState,
      timestamp: new Date(),
      userId: context.user.id
    }]
  };
  
  // 4. Execute post-transition hooks
  await runHooks('post-transition', { updatedWorkItem });
  
  return updatedWorkItem;
};
```

---

## 🔧 Damage Reporting Logic

### **1. Damage Detection & Reporting**
```javascript
// src/services/DamageReportService.js
class DamageReportService {
  async submitDamageReport(reportData) {
    // 1. Validate damage report
    const validation = validateDamageReport(reportData);
    if (!validation.isValid) throw new Error(validation.errors.join(', '));
    
    // 2. CRITICAL: Hold entire bundle payment
    const batch = writeBatch(db);
    await this.holdBundlePayment(batch, reportData.bundleId, reportData.operatorId, {
      reason: 'DAMAGE_REPORTED',
      heldAmount: reportData.pieces * reportData.rate,
      heldPieces: reportData.pieces
    });
    
    // 3. Create damage report document
    const reportDocument = createDamageReportDocument(reportData);
    batch.set(reportRef, reportDocument);
    
    // 4. Commit atomic transaction
    await batch.commit();
    
    // 5. Send notifications
    await this.notifySupervisor(reportData);
    await this.notifyOperatorPaymentHeld(reportData);
    
    return { success: true, reportId: reportRef.id };
  }
}
```

### **2. Bundle Payment Hold Logic**
```javascript
// CRITICAL BUSINESS RULE: No partial payments
const holdBundlePayment = async (batch, bundleId, operatorId, holdData) => {
  // 1. Update work item - mark entire bundle as payment held
  const bundleRef = doc(db, 'workItems', bundleId);
  batch.update(bundleRef, {
    paymentStatus: 'HELD_FOR_DAMAGE',
    heldAmount: holdData.heldAmount,     // Full bundle amount
    canWithdraw: false,                  // Operator cannot withdraw
    paymentHeldAt: serverTimestamp()
  });

  // 2. Update operator wallet - show held vs available amounts
  const walletRef = doc(db, 'operatorWallets', operatorId);
  batch.update(walletRef, {
    heldAmount: increment(holdData.heldAmount),
    heldBundles: arrayUnion(bundleId)
  });
};
```

### **3. Damage Resolution Workflow**
```javascript
// Complete damage resolution flow
const damageResolutionFlow = {
  1: 'REPORTED_TO_SUPERVISOR',     // Operator reports damage
  2: 'ACKNOWLEDGED',               // Supervisor acknowledges  
  3: 'REWORK_IN_PROGRESS',        // Supervisor fixes damage
  4: 'REWORK_COMPLETED',          // Fix completed, quality checked
  5: 'RETURNED_TO_OPERATOR',      // Pieces returned to operator
  6: 'FINAL_COMPLETION',          // Operator completes all work
  7: 'PAYMENT_RELEASED'           // Full bundle payment released
};

// Automatic escalation logic
const checkEscalation = (damageReport) => {
  const hoursSinceReport = (Date.now() - damageReport.reportedAt) / (1000 * 60 * 60);
  const maxResponseTime = URGENCY_RESPONSE_TIMES[damageReport.urgency];
  
  if (hoursSinceReport > maxResponseTime) {
    // Auto-escalate to admin
    escalateToAdmin(damageReport, `Overdue by ${hoursSinceReport - maxResponseTime} hours`);
  }
};
```

---

## 💰 Payment System Logic

### **1. Bundle-Based Payment Model**
```javascript
// CORE PRINCIPLE: Payment only after complete bundle delivery
const bundlePaymentLogic = {
  rule: 'NO_PARTIAL_PAYMENTS',
  
  // When work is assigned
  onWorkAssignment: (bundle) => ({
    totalValue: bundle.pieces * bundle.rate,
    paymentStatus: 'PENDING',
    canWithdraw: false
  }),
  
  // When damage is reported  
  onDamageReport: (bundle) => ({
    paymentStatus: 'HELD_FOR_DAMAGE',
    heldAmount: bundle.totalValue,    // ENTIRE bundle amount held
    canWithdraw: false,
    holdReason: 'Damage reported - pending rework completion'
  }),
  
  // When all work completed (including rework)
  onBundleCompletion: (bundle) => ({
    paymentStatus: 'RELEASED',
    availableAmount: bundle.totalValue,
    canWithdraw: true,
    releasedAt: new Date()
  })
};
```

### **2. Operator Wallet Logic**
```javascript
// src/services/OperatorWalletService.js
class OperatorWalletService {
  getWalletBalance(operatorId) {
    return {
      availableAmount: 1250,    // Can withdraw immediately
      heldAmount: 300,          // Held due to damage reports
      totalEarned: 15500,       // Lifetime earnings
      heldBundles: ['B001'],    // Bundles with payment holds
      canWithdraw: true         // Can withdraw available amount
    };
  }
  
  // Payment hold validation
  canWithdrawAmount(operatorId, requestedAmount) {
    const wallet = getWalletBalance(operatorId);
    return {
      canWithdraw: requestedAmount <= wallet.availableAmount,
      maxAvailable: wallet.availableAmount,
      heldAmount: wallet.heldAmount,
      reason: 'Bundle payment held pending damage resolution'
    };
  }
}
```

### **3. Supervisor Compensation Logic**
```javascript
// Rework compensation system
const supervisorCompensation = {
  hourlyRate: 150,  // Rs 150 per hour
  
  calculatePayment: (reworkData) => {
    const timeHours = reworkData.timeSpentMinutes / 60;
    const basePay = timeHours * 150;
    
    // Bonus for complex rework
    const complexityMultiplier = reworkData.complexity === 'high' ? 1.2 : 1.0;
    const qualityBonus = reworkData.qualityScore >= 95 ? 25 : 0;
    
    return basePay * complexityMultiplier + qualityBonus;
  }
};
```

---

## 👥 User Role & Permission Logic

### **1. Role-Based Access Control (RBAC)**
```javascript
// src/core/constants/index.js
const ROLE_HIERARCHY = {
  admin: 10,          // Full system access
  management: 9,      // Business oversight
  manager: 8,         // Department management  
  supervisor: 6,      // Work assignment & quality
  quality_controller: 5,  // Quality checks only
  operator: 3,        // Work completion
  guest: 1           // View only
};

// Permission validation logic
const hasPermission = (userRole, requiredPermission) => {
  const rolePermissions = {
    admin: ['*'],  // All permissions
    supervisor: ['assign_work', 'view_all_work', 'handle_damage'],
    operator: ['complete_work', 'report_damage', 'view_own_work']
  };
  
  return rolePermissions[userRole]?.includes(requiredPermission) || 
         rolePermissions[userRole]?.includes('*');
};
```

### **2. Dynamic Permission Checking**
```javascript
// Component-level permission checks
const ProtectedComponent = ({ children, requiredPermission }) => {
  const { user } = useAuth();
  
  if (!hasPermission(user.role, requiredPermission)) {
    return <AccessDenied message="Insufficient permissions" />;
  }
  
  return children;
};

// Route-level protection
const ProtectedRoute = ({ component: Component, requiredRole, ...rest }) => (
  <Route {...rest} render={props => 
    hasRequiredRole(user.role, requiredRole) 
      ? <Component {...props} />
      : <Redirect to="/unauthorized" />
  } />
);
```

---

## 🔔 Real-time Notification Logic

### **1. Notification Priority System**
```javascript
// Notification priority and routing logic
const NOTIFICATION_PRIORITIES = {
  URGENT: { level: 1, sound: true, popup: true, color: 'red' },
  HIGH: { level: 2, sound: true, popup: false, color: 'orange' },
  NORMAL: { level: 3, sound: false, popup: false, color: 'blue' },
  LOW: { level: 4, sound: false, popup: false, color: 'gray' }
};

// Smart notification routing
const routeNotification = (notification) => {
  const recipients = [];
  
  switch (notification.type) {
    case 'DAMAGE_REPORTED':
      recipients.push(notification.supervisorId);
      break;
    case 'WORK_COMPLETED':
      recipients.push(...getNextOperators(notification.bundleId));
      break;
    case 'ESCALATED_ISSUE':
      recipients.push(...getManagementUsers());
      break;
  }
  
  return recipients;
};
```

### **2. Real-time State Synchronization**
```javascript
// Firebase real-time listeners for different user roles
const useRealtimeUpdates = (userId, userRole) => {
  useEffect(() => {
    const listeners = [];
    
    // Operator-specific listeners
    if (userRole === 'operator') {
      listeners.push(
        onSnapshot(workAssignmentsQuery(userId), updateWorkItems),
        onSnapshot(damageReportsQuery(userId), updateDamageReports),
        onSnapshot(walletQuery(userId), updateWalletBalance)
      );
    }
    
    // Supervisor-specific listeners  
    if (userRole === 'supervisor') {
      listeners.push(
        onSnapshot(supervisorQueueQuery(userId), updateSupervisorQueue),
        onSnapshot(escalatedIssuesQuery(), updateEscalatedIssues)
      );
    }
    
    return () => listeners.forEach(unsub => unsub());
  }, [userId, userRole]);
};
```

---

## 🎯 Quality Control Logic

### **1. Multi-Stage Quality System**
```javascript
// Quality checkpoints throughout workflow
const qualityCheckpoints = {
  OPERATOR_SELF_CHECK: {
    stage: 'completion',
    criteria: ['stitch_quality', 'measurements', 'appearance'],
    requiredScore: 85
  },
  
  SUPERVISOR_REVIEW: {
    stage: 'final_check',
    criteria: ['overall_quality', 'specifications', 'defects'],
    requiredScore: 90
  },
  
  RANDOM_AUDIT: {
    stage: 'post_completion',
    frequency: 0.1, // 10% of completed work
    criteria: ['accuracy', 'consistency', 'standards_compliance']
  }
};

// Quality score calculation
const calculateQualityScore = (checkData) => {
  const weights = {
    stitch_quality: 0.4,
    measurements: 0.3, 
    appearance: 0.2,
    completion_time: 0.1
  };
  
  return Object.entries(weights).reduce((score, [criterion, weight]) => {
    return score + (checkData[criterion] || 0) * weight;
  }, 0);
};
```

### **2. Defect Classification Logic**
```javascript
// Automated defect classification
const classifyDefect = (defectData) => {
  const classification = {
    severity: getSeverityLevel(defectData),
    category: getDefectCategory(defectData),
    operatorFault: isOperatorResponsible(defectData),
    reworkTime: estimateReworkTime(defectData),
    qualityImpact: assessQualityImpact(defectData)
  };
  
  // Determine payment impact
  classification.paymentImpact = {
    adjustmentType: classification.operatorFault ? 'PENALTY' : 'NO_PENALTY',
    adjustmentAmount: classification.operatorFault 
      ? calculatePenalty(classification.severity)
      : 0
  };
  
  return classification;
};
```

---

## 📝 Work Assignment Logic

### **1. Intelligent Assignment Algorithm**
```javascript
// Smart work assignment based on multiple factors
const intelligentAssignment = {
  factors: {
    operatorSkills: 0.3,      // Skill match with work requirements
    workload: 0.2,            // Current workload balance
    efficiency: 0.2,          // Historical efficiency ratings
    machineAvailability: 0.15, // Machine/station availability
    priority: 0.1,            // Work priority level
    location: 0.05            // Physical proximity
  },
  
  // Assignment scoring algorithm
  calculateAssignmentScore: (operator, workItem) => {
    const skillMatch = getSkillMatch(operator.skills, workItem.requiredSkills);
    const workloadFactor = 1 - (operator.currentWorkload / operator.maxCapacity);
    const efficiencyScore = operator.averageEfficiency / 100;
    const availabilityScore = checkMachineAvailability(workItem.machineType);
    
    return (skillMatch * 0.3) + (workloadFactor * 0.2) + 
           (efficiencyScore * 0.2) + (availabilityScore * 0.15);
  }
};
```

### **2. Self-Assignment Logic**
```javascript
// Operator self-assignment with constraints
const selfAssignmentLogic = {
  constraints: {
    maxSelfAssignments: 3,     // Max items operator can self-assign
    skillRequirement: 0.7,     // Minimum skill match required
    workloadLimit: 0.8,        // Max workload percentage
    priorityAccess: ['normal', 'high'] // Priority levels operator can self-assign
  },
  
  validateSelfAssignment: (operator, workItem) => {
    const checks = {
      hasCapacity: operator.currentWorkload < selfAssignmentLogic.constraints.workloadLimit,
      hasSkills: getSkillMatch(operator, workItem) >= 0.7,
      canAccessPriority: selfAssignmentLogic.constraints.priorityAccess.includes(workItem.priority),
      withinLimit: operator.selfAssignedCount < 3
    };
    
    return Object.values(checks).every(check => check === true);
  }
};
```

---

## 📦 Bundle Management Logic

### **1. Bundle Lifecycle Management**
```javascript
// Complete bundle lifecycle tracking
const bundleLifecycle = {
  states: {
    CREATED: 'Bundle created, ready for assignment',
    ASSIGNED: 'Assigned to operator(s)',
    IN_PROGRESS: 'Work in progress',
    COMPLETED: 'All work completed',
    QUALITY_CHECKED: 'Quality validation complete',
    APPROVED: 'Final approval, ready for shipment',
    DAMAGED: 'Damage reported, needs rework',
    REWORK: 'Rework in progress'
  },
  
  // State transition validation
  canProgress: (bundle, targetState) => {
    const transitions = {
      CREATED: ['ASSIGNED'],
      ASSIGNED: ['IN_PROGRESS'],
      IN_PROGRESS: ['COMPLETED', 'DAMAGED'],
      DAMAGED: ['REWORK'],
      REWORK: ['IN_PROGRESS'],
      COMPLETED: ['QUALITY_CHECKED'],
      QUALITY_CHECKED: ['APPROVED']
    };
    
    return transitions[bundle.status]?.includes(targetState) || false;
  }
};
```

### **2. Bundle Progress Tracking**
```javascript
// Real-time progress calculation
const calculateBundleProgress = (bundle) => {
  const totalPieces = bundle.pieces;
  const completedPieces = bundle.completedPieces || 0;
  const damagedPieces = bundle.damagedPieces || 0;
  const reworkPieces = bundle.reworkPieces || 0;
  
  const progressData = {
    totalPieces,
    completedPieces,
    pendingPieces: totalPieces - completedPieces - damagedPieces,
    damagedPieces,
    reworkPieces,
    completionPercentage: Math.round((completedPieces / totalPieces) * 100),
    qualityScore: calculateQualityScore(bundle.qualityMetrics),
    estimatedCompletion: estimateCompletion(bundle),
    paymentStatus: bundle.paymentStatus || 'PENDING'
  };
  
  return progressData;
};
```

---

## 📊 Analytics & Reporting Logic

### **1. Performance Metrics Calculation**
```javascript
// Comprehensive performance analytics
const performanceAnalytics = {
  // Operator efficiency metrics
  calculateOperatorEfficiency: (operatorData, timeRange) => {
    const completedWork = getCompletedWork(operatorData.id, timeRange);
    const totalTime = calculateWorkingTime(operatorData.id, timeRange);
    const standardTime = completedWork.reduce((sum, work) => 
      sum + (work.standardTime || 30), 0);
    
    return {
      efficiency: (standardTime / totalTime) * 100,
      productivity: completedWork.length / (totalTime / 60), // items per hour
      qualityScore: calculateAverageQuality(completedWork),
      onTimeCompletion: calculateOnTimeRate(completedWork)
    };
  },
  
  // Production line analytics
  calculateLinePerformance: (lineData, timeRange) => ({
    throughput: calculateThroughput(lineData, timeRange),
    bottlenecks: identifyBottlenecks(lineData),
    utilization: calculateUtilization(lineData),
    qualityMetrics: calculateLineQuality(lineData)
  })
};
```

### **2. Predictive Analytics Logic**
```javascript
// Machine learning-inspired predictive logic
const predictiveAnalytics = {
  // Predict completion time based on historical data
  predictCompletionTime: (workItem, operatorHistory) => {
    const similarWork = findSimilarWork(workItem, operatorHistory);
    const averageTime = calculateAverageTime(similarWork);
    const complexityFactor = getComplexityFactor(workItem);
    const operatorFactor = getOperatorFactor(operatorHistory);
    
    return averageTime * complexityFactor * operatorFactor;
  },
  
  // Predict quality issues
  predictQualityRisk: (workItem, operatorData) => {
    const riskFactors = {
      operatorExperience: getExperienceScore(operatorData),
      workComplexity: getComplexityScore(workItem),
      recentDefects: getRecentDefectRate(operatorData),
      machineCondition: getMachineCondition(workItem.machineType)
    };
    
    return calculateRiskScore(riskFactors);
  }
};
```

---

## 🔄 Integration Logic

### **1. Cross-System Data Synchronization**
```javascript
// Synchronization between different system components
const dataSync = {
  // Sync work completion with inventory
  syncWorkCompletion: async (completedWork) => {
    await Promise.all([
      updateInventory(completedWork.articleId, completedWork.pieces),
      updateProductionMetrics(completedWork),
      triggerShippingNotification(completedWork),
      updateCustomerOrder(completedWork.orderId)
    ]);
  },
  
  // Sync damage reports with quality metrics
  syncDamageReport: async (damageReport) => {
    await Promise.all([
      updateQualityMetrics(damageReport),
      updateOperatorRating(damageReport.operatorId),
      updateMachineMetrics(damageReport.machineId),
      triggerPreventiveMaintenance(damageReport)
    ]);
  }
};
```

---

This comprehensive application logic ensures consistent, predictable, and efficient operation of the entire garment manufacturing process while maintaining high quality standards and fair compensation for all stakeholders.