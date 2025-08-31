# Garment ERP PWA - Complete Data Flow Documentation

## Overview
This document provides a comprehensive analysis of data flow patterns, state management, and real-time synchronization in the Garment ERP PWA system.

## High-Level Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA FLOW ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│  │    UI       │───▶│   Actions   │───▶│   Stores    │        │
│  │ Components  │◀───│ (Dispatch)  │◀───│  (Zustand)  │        │
│  └─────────────┘    └─────────────┘    └─────────────┘        │
│         │                  │                   │               │
│         ▼                  ▼                   ▼               │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Custom Hooks Layer                        │    │
│  │  • useWorkManagement  • useUsers  • useAnalytics      │    │
│  │  • useSupervisorData  • useAuth   • useNotifications  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                               │                                 │
│                               ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                  Service Layer                          │    │
│  │  • WIPService     • BundleService   • AnalyticsService │    │
│  │  • UserService    • QualityService  • NotificationSvc  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                               │                                 │
│                               ▼                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Firebase Firestore                        │    │
│  │  • Real-time subscriptions  • CRUD operations         │    │
│  │  • Transaction support      • Batch operations        │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Centralized State Management Flow

### 1. Zustand Store Architecture
```javascript
// AppStore.js - Centralized state management
const useAppStore = create((set, get) => ({
  // ═══════════════════════════════════════════════════════════
  //                        CORE STATE
  // ═══════════════════════════════════════════════════════════
  
  // User Management State
  users: [],                    // All system users
  currentUser: null,           // Currently logged in user
  
  // Work Management State
  bundles: [],                 // Work bundles
  workItems: [],               // Individual work items
  assignments: [],             // Work assignments
  
  // Analytics State
  analytics: null,             // Production analytics
  stats: {},                   // Real-time statistics
  
  // UI State
  loading: {
    users: false,
    bundles: false,
    workItems: false,
    analytics: false
  },
  
  error: null,                 // Global error state
  selectedItems: new Set(),    // Selected items across UI
  
  // Real-time subscriptions management
  subscriptions: new Map(),    // Active Firebase subscriptions
  isReady: false,             // Data initialization complete
  
  // ═══════════════════════════════════════════════════════════
  //                       ACTIONS
  // ═══════════════════════════════════════════════════════════
  
  // State setters (triggered by Firebase subscriptions)
  setUsers: (users) => set({ users }),
  setBundles: (bundles) => set({ bundles }),
  setWorkItems: (workItems) => set({ workItems }),
  setAnalytics: (analytics) => set({ analytics }),
  
  // Complex business operations
  assignWork: async (operatorId, workData) => {
    // Business logic implementation
  },
  
  createBundle: async (bundleData) => {
    // Bundle creation logic
  }
}));
```

### 2. Data Flow Patterns

#### Pattern 1: User Interaction → State Update
```
User Clicks Button
       ↓
Component Handler Called
       ↓
Custom Hook Action Invoked
       ↓
Service Method Called
       ↓
Firebase Operation Executed
       ↓
Real-time Subscription Triggered
       ↓
Store State Updated
       ↓
Components Re-render
```

#### Pattern 2: Real-time Data Synchronization
```
Firebase Database Change
       ↓
onSnapshot Callback Triggered
       ↓
Store State Updated (setUsers/setBundles/etc.)
       ↓
useAppStore Subscribers Notified
       ↓
Custom Hooks Return New Data
       ↓
Components Receive Updated Props
       ↓
UI Updates Automatically
```

## Detailed Data Flow Scenarios

### 1. Work Assignment Flow

#### Step-by-Step Data Flow
```javascript
// 1. User Interface Action
const WorkAssignmentComponent = () => {
  const { assignWork, loading } = useWorkManagement();
  
  const handleAssignment = async (operatorId, bundleId) => {
    // 2. Custom Hook Invocation
    const result = await assignWork(operatorId, { bundleId, operation: 'sewing' });
    
    if (result.success) {
      showNotification('Work assigned successfully', 'success');
    }
  };
};

// 3. Custom Hook Implementation
const useWorkManagement = () => {
  return useAppStore(state => ({
    bundles: state.bundles,
    workItems: state.workItems,
    assignWork: state.assignWork,
    loading: state.loading.workItems
  }), shallow);
};

// 4. Store Action Implementation
const assignWork = async (operatorId, workData) => {
  // Set loading state
  set(state => ({ loading: { ...state.loading, workItems: true } }));
  
  try {
    // 5. Service Layer Call
    const result = await WIPService.assignWork(operatorId, workData);
    
    if (result.success) {
      // 6. Optimistic Update (optional)
      const optimisticUpdate = createOptimisticWorkItem(operatorId, workData);
      set(state => ({
        workItems: [...state.workItems, optimisticUpdate]
      }));
      
      return { success: true };
    }
    
    throw new Error(result.error);
  } catch (error) {
    set({ error });
    return { success: false, error: error.message };
  } finally {
    set(state => ({ loading: { ...state.loading, workItems: false } }));
  }
};

// 7. Service Layer Implementation
class WIPService {
  static async assignWork(operatorId, workData) {
    const batch = writeBatch(db);
    
    // Create work item
    const workItemRef = doc(collection(db, 'workItems'));
    batch.set(workItemRef, {
      id: workItemRef.id,
      operatorId,
      bundleId: workData.bundleId,
      operation: workData.operation,
      status: 'assigned',
      assignedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });
    
    // Update operator status
    const operatorRef = doc(db, 'users', operatorId);
    batch.update(operatorRef, {
      status: 'working',
      currentWorkload: increment(1),
      updatedAt: serverTimestamp()
    });
    
    // Update bundle status
    const bundleRef = doc(db, 'bundles', workData.bundleId);
    batch.update(bundleRef, {
      status: 'assigned',
      assignedOperator: operatorId,
      updatedAt: serverTimestamp()
    });
    
    // 8. Firebase Transaction
    await batch.commit();
    
    return { success: true };
  }
}

// 9. Real-time Subscription Response
// Firebase triggers onSnapshot callbacks for workItems, users, and bundles
// Store state automatically updates
// Components re-render with new data
```

#### Data Flow Visualization
```
WorkAssignmentComponent
         │
         │ handleAssignment()
         ▼
useWorkManagement Hook
         │
         │ assignWork()
         ▼
AppStore Action
         │
         │ WIPService.assignWork()
         ▼
Firebase Batch Transaction
         │
         │ batch.commit()
         ▼
┌─────────────────────────────────────┐
│        Firebase Database           │
│  ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │workItems│ │  users  │ │bundles│ │
│  │   +1    │ │ status  │ │status │ │
│  └─────────┘ └─────────┘ └───────┘ │
└─────────────────────────────────────┘
         │
         │ onSnapshot triggers
         ▼
┌─────────────────────────────────────┐
│         AppStore Updates            │
│  setWorkItems()  setUsers()         │
│  setBundles()                       │
└─────────────────────────────────────┘
         │
         │ Zustand notifications
         ▼
All Subscribed Components Re-render
```

### 2. Real-time Dashboard Updates

#### Dashboard Data Flow
```javascript
// 1. Component Initialization
const SupervisorDashboard = () => {
  // 2. Multiple hook subscriptions
  const { allUsers, loading: usersLoading } = useUsers();
  const { bundles, workItems, stats, loading: workLoading } = useWorkManagement();
  const { analytics, loading: analyticsLoading } = useAnalytics();
  
  // 3. Derived state calculation
  const dashboardData = useMemo(() => {
    if (!allUsers || !workItems || !bundles) return null;
    
    // Real-time calculations
    const operators = allUsers.filter(user => user.role === 'operator');
    const activeWork = workItems.filter(item => item.status === 'in_progress');
    const completedToday = workItems.filter(item => 
      item.status === 'completed' && isToday(item.completedAt)
    );
    
    return {
      totalOperators: operators.length,
      activeOperators: operators.filter(op => op.status === 'working').length,
      totalWork: workItems.length,
      activeWork: activeWork.length,
      completedWork: completedToday.length,
      productivity: calculateProductivity(completedToday, operators),
      efficiency: calculateEfficiency(workItems, operators)
    };
  }, [allUsers, workItems, bundles]);
  
  // 4. Real-time UI updates
  return (
    <div>
      <MetricsGrid data={dashboardData} />
      <OperatorStatus operators={operators} />
      <WorkProgress workItems={activeWork} />
    </div>
  );
};

// 5. Hook implementations with real-time subscriptions
const useUsers = () => {
  return useAppStore(state => ({
    allUsers: state.users,
    loading: state.loading.users
  }), shallow);
};

// 6. Store subscription management
useEffect(() => {
  // Initialize real-time subscriptions
  const subscriptions = [];
  
  // Users subscription
  const usersUnsub = onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      useAppStore.getState().setUsers(users);
    }
  );
  subscriptions.push(usersUnsub);
  
  // Work items subscription
  const workItemsUnsub = onSnapshot(
    collection(db, 'workItems'),
    (snapshot) => {
      const workItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      useAppStore.getState().setWorkItems(workItems);
    }
  );
  subscriptions.push(workItemsUnsub);
  
  return () => {
    subscriptions.forEach(unsub => unsub());
  };
}, []);
```

#### Real-time Update Flow
```
Firebase Database Change
         │
         │ (Any document in users/workItems/bundles)
         ▼
onSnapshot Callback
         │
         │ Extract document data
         ▼
Store State Update
         │
         │ setUsers() / setWorkItems() / setBundles()
         ▼
Zustand Notification
         │
         │ Notify all subscribers
         ▼
Custom Hooks Re-evaluate
         │
         │ useUsers(), useWorkManagement() return new data
         ▼
Component Re-render
         │
         │ useMemo recalculates derived data
         ▼
UI Updates
         │
         │ New metrics, status indicators, progress bars
         ▼
User Sees Real-time Changes
```

### 3. Quality Control Data Flow

#### Damage Report Submission Flow
```javascript
// 1. Operator submits damage report
const DamageReportForm = () => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (formData) => {
    setIsSubmitting(true);
    
    try {
      // 2. Service call
      const result = await DamageService.createDamageReport({
        ...formData,
        operatorId: user.id,
        operatorName: user.name,
        reportedAt: new Date(),
        status: 'reported'
      });
      
      if (result.success) {
        showNotification('Damage report submitted', 'success');
        onClose();
      }
    } catch (error) {
      showNotification('Failed to submit report', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
};

// 3. Service implementation
class DamageService {
  static async createDamageReport(reportData) {
    const batch = writeBatch(db);
    
    // Create damage report
    const reportRef = doc(collection(db, 'damageReports'));
    batch.set(reportRef, {
      id: reportRef.id,
      ...reportData,
      createdAt: serverTimestamp()
    });
    
    // Update work item status
    if (reportData.workItemId) {
      const workItemRef = doc(db, 'workItems', reportData.workItemId);
      batch.update(workItemRef, {
        status: 'quality_issue',
        hasQualityIssue: true,
        updatedAt: serverTimestamp()
      });
    }
    
    // Create notification for supervisor
    const notificationRef = doc(collection(db, 'notifications'));
    batch.set(notificationRef, {
      userId: reportData.supervisorId,
      type: 'damage_report',
      title: 'New Damage Report',
      message: `${reportData.operatorName} reported damage on ${reportData.articleNumber}`,
      data: { reportId: reportRef.id },
      isRead: false,
      createdAt: serverTimestamp()
    });
    
    await batch.commit();
    return { success: true, id: reportRef.id };
  }
}

// 4. Real-time supervisor notification
const SupervisorNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    if (!user) return;
    
    // Real-time notification subscription
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'notifications'),
        where('userId', '==', user.id),
        where('isRead', '==', false),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        const newNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setNotifications(newNotifications);
        
        // Show push notification for new items
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            showPushNotification(change.doc.data());
          }
        });
      }
    );
    
    return unsubscribe;
  }, [user]);
  
  return <NotificationList notifications={notifications} />;
};
```

#### Multi-Collection Update Flow
```
Damage Report Submission
         │
         │ DamageService.createDamageReport()
         ▼
Firebase Batch Transaction
┌─────────────────────────────────────────────────────┐
│                Batch Operations                     │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │damageReports│ │ workItems   │ │notifications │  │
│  │   CREATE    │ │   UPDATE    │ │    CREATE    │  │
│  └─────────────┘ └─────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────┘
         │
         │ batch.commit() - All or nothing
         ▼
Real-time Subscriptions Triggered
┌─────────────────────────────────────────────────────┐
│              Multiple onSnapshot                    │
│  ┌─────────────┐ ┌─────────────┐ ┌──────────────┐  │
│  │ Damage List │ │ Work Board  │ │Notifications │  │
│  │  Updates    │ │   Updates   │ │    Panel     │  │
│  └─────────────┘ └─────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────┘
         │
         │ Simultaneous UI Updates
         ▼
Multiple Components Re-render
```

### 4. Analytics Data Aggregation Flow

#### Real-time Analytics Calculation
```javascript
// 1. Analytics service with real-time calculation
class AnalyticsService {
  // Initialize real-time analytics subscriptions
  static initializeAnalytics() {
    const today = new Date().toISOString().split('T')[0];
    
    // Subscribe to work items for real-time metrics
    return onSnapshot(
      query(
        collection(db, 'workItems'),
        where('createdAt', '>=', startOfDay(today)),
        where('createdAt', '<=', endOfDay(today))
      ),
      (snapshot) => {
        // Real-time calculation of daily metrics
        const workItems = snapshot.docs.map(doc => doc.data());
        const analytics = this.calculateDailyMetrics(workItems);
        
        // Update analytics store
        useAppStore.getState().setAnalytics(analytics);
        
        // Also persist to database for historical tracking
        this.persistAnalytics(today, analytics);
      }
    );
  }
  
  static calculateDailyMetrics(workItems) {
    const completed = workItems.filter(item => item.status === 'completed');
    const inProgress = workItems.filter(item => item.status === 'in_progress');
    const total = workItems.length;
    
    // Production metrics
    const totalProduction = completed.reduce((sum, item) => sum + item.pieces, 0);
    const averageTime = completed.reduce((sum, item) => sum + item.actualTime, 0) / completed.length;
    const efficiency = completed.reduce((sum, item) => sum + (item.estimatedTime / item.actualTime), 0) / completed.length * 100;
    
    // Quality metrics
    const qualityScore = completed.reduce((sum, item) => sum + (item.qualityScore || 100), 0) / completed.length;
    
    // Operator performance
    const operatorStats = this.calculateOperatorPerformance(completed);
    
    return {
      date: new Date().toISOString().split('T')[0],
      totalWork: total,
      completedWork: completed.length,
      inProgressWork: inProgress.length,
      totalProduction,
      averageTime,
      efficiency: Math.round(efficiency),
      qualityScore: Math.round(qualityScore),
      operatorPerformance: operatorStats,
      lastUpdated: new Date()
    };
  }
  
  static calculateOperatorPerformance(completedWork) {
    const operatorMap = new Map();
    
    completedWork.forEach(item => {
      const operatorId = item.operatorId;
      if (!operatorMap.has(operatorId)) {
        operatorMap.set(operatorId, {
          operatorId,
          operatorName: item.operatorName,
          completedTasks: 0,
          totalProduction: 0,
          totalTime: 0,
          qualityScore: 0,
          efficiency: 0
        });
      }
      
      const operator = operatorMap.get(operatorId);
      operator.completedTasks++;
      operator.totalProduction += item.pieces;
      operator.totalTime += item.actualTime;
      operator.qualityScore += item.qualityScore || 100;
    });
    
    // Calculate averages
    return Array.from(operatorMap.values()).map(operator => ({
      ...operator,
      averageTime: operator.totalTime / operator.completedTasks,
      averageQuality: operator.qualityScore / operator.completedTasks,
      efficiency: (operator.completedTasks * 100) / operator.totalTime // pieces per hour
    }));
  }
}

// 2. Real-time dashboard consumption
const AnalyticsDashboard = () => {
  const { analytics, isReady } = useAnalytics();
  const { allUsers } = useUsers();
  
  // Derived real-time metrics
  const liveMetrics = useMemo(() => {
    if (!analytics || !allUsers) return null;
    
    const operators = allUsers.filter(user => user.role === 'operator');
    const activeOperators = operators.filter(op => op.status === 'working');
    
    return {
      ...analytics,
      activeOperators: activeOperators.length,
      totalOperators: operators.length,
      utilizationRate: (activeOperators.length / operators.length) * 100
    };
  }, [analytics, allUsers]);
  
  return (
    <div>
      <MetricsOverview metrics={liveMetrics} />
      <ProductionChart data={analytics?.productionTrends} />
      <OperatorPerformance data={analytics?.operatorPerformance} />
    </div>
  );
};
```

#### Analytics Data Flow
```
Work Items Collection Changes
         │
         │ (Any status update, completion, etc.)
         ▼
Analytics onSnapshot Triggered
         │
         │ Query all today's work items
         ▼
Real-time Calculation
         │
         │ calculateDailyMetrics()
         ▼
Analytics Store Update
         │
         │ setAnalytics()
         ▼
Dashboard Components Re-render
         │
         │ useMemo recalculates live metrics
         ▼
Charts and Metrics Update
         │
         │ Real-time visualization updates
         ▼
Persistent Analytics Storage
         │
         │ persistAnalytics() - Historical data
         ▼
Analytics Collection Updated
```

## Error Handling Data Flow

### Error Propagation Pattern
```javascript
// 1. Service level error handling
class WIPService {
  static async assignWork(operatorId, workData) {
    try {
      // Firebase operations
      const result = await this.performAssignment(operatorId, workData);
      return { success: true, data: result };
    } catch (error) {
      console.error('WIPService.assignWork failed:', error);
      
      // Structured error response
      return {
        success: false,
        error: error.message,
        code: error.code || 'ASSIGNMENT_FAILED',
        details: {
          operatorId,
          workData,
          timestamp: new Date(),
          stack: error.stack
        }
      };
    }
  }
}

// 2. Store level error handling
const useAppStore = create((set, get) => ({
  error: null,
  
  assignWork: async (operatorId, workData) => {
    set({ error: null }); // Clear previous errors
    
    try {
      const result = await WIPService.assignWork(operatorId, workData);
      
      if (!result.success) {
        // Set structured error in store
        set({
          error: {
            type: 'ASSIGNMENT_ERROR',
            message: result.error,
            code: result.code,
            details: result.details,
            timestamp: new Date()
          }
        });
        return result;
      }
      
      return result;
    } catch (error) {
      // Unexpected error handling
      set({
        error: {
          type: 'UNEXPECTED_ERROR',
          message: 'An unexpected error occurred',
          originalError: error,
          timestamp: new Date()
        }
      });
      
      return { success: false, error: error.message };
    }
  }
}));

// 3. Component level error handling
const WorkAssignmentComponent = () => {
  const { assignWork, error } = useWorkManagement();
  const { showNotification } = useNotifications();
  
  const handleAssignment = async (operatorId, workData) => {
    const result = await assignWork(operatorId, workData);
    
    if (!result.success) {
      // Error handling with user feedback
      const errorMessage = getErrorMessage(error);
      showNotification(errorMessage, 'error');
      
      // Optional: Report to error tracking service
      ErrorReportingService.reportError(error, {
        action: 'work_assignment',
        user: user.id,
        context: { operatorId, workData }
      });
    } else {
      showNotification('Work assigned successfully', 'success');
    }
  };
  
  // Error message translation
  const getErrorMessage = (error) => {
    const { isNepali } = useLanguage();
    
    const errorMessages = {
      ASSIGNMENT_FAILED: isNepali ? 'काम असाइनमेन्ट असफल' : 'Work assignment failed',
      OPERATOR_NOT_AVAILABLE: isNepali ? 'अपरेटर उपलब्ध छैन' : 'Operator not available',
      WORKLOAD_EXCEEDED: isNepali ? 'कामको बोझ बढी छ' : 'Workload exceeded'
    };
    
    return errorMessages[error?.code] || error?.message || 'An error occurred';
  };
};
```

### Error Flow Visualization
```
Service Error Occurs
         │
         │ try/catch in service method
         ▼
Structured Error Response
         │
         │ return { success: false, error, code, details }
         ▼
Store Error Handling
         │
         │ set({ error: structuredError })
         ▼
Component Error Detection
         │
         │ useWorkManagement() returns error
         ▼
User Notification
         │
         │ showNotification(errorMessage, 'error')
         ▼
Error Reporting Service
         │
         │ Log for debugging/monitoring
         ▼
Error Recovery Options
```

## Performance Optimization Data Flow

### Optimized Subscription Management
```javascript
// Subscription manager for efficient resource usage
class SubscriptionManager {
  static subscriptions = new Map();
  static subscriptionCounts = new Map();
  
  // Shared subscription pattern
  static subscribe(key, query, callback) {
    if (!this.subscriptions.has(key)) {
      // Create new subscription only if none exists
      const unsubscribe = onSnapshot(query, (snapshot) => {
        // Notify all callbacks for this subscription
        const callbacks = this.subscriptionCounts.get(key) || [];
        callbacks.forEach(cb => cb(snapshot));
      });
      
      this.subscriptions.set(key, unsubscribe);
      this.subscriptionCounts.set(key, []);
    }
    
    // Add callback to list
    const callbacks = this.subscriptionCounts.get(key);
    callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptionCounts.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      // Clean up subscription if no more callbacks
      if (callbacks.length === 0) {
        const unsubscribe = this.subscriptions.get(key);
        if (unsubscribe) {
          unsubscribe();
          this.subscriptions.delete(key);
          this.subscriptionCounts.delete(key);
        }
      }
    };
  }
}

// Optimized hook with shared subscriptions
const useUsers = () => {
  useEffect(() => {
    const query = collection(db, 'users');
    
    const unsubscribe = SubscriptionManager.subscribe(
      'users',
      query,
      (snapshot) => {
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        useAppStore.getState().setUsers(users);
      }
    );
    
    return unsubscribe;
  }, []);
  
  return useAppStore(state => state.users, shallow);
};
```

### Batched Update Flow
```javascript
// Batch update manager for performance
class BatchUpdateManager {
  static pendingUpdates = new Map();
  static batchTimeout = null;
  static BATCH_DELAY = 1000; // 1 second
  
  static scheduleUpdate(collection, docId, updates) {
    const key = `${collection}/${docId}`;
    
    // Merge with existing updates
    const existing = this.pendingUpdates.get(key) || {};
    this.pendingUpdates.set(key, { ...existing, ...updates });
    
    // Schedule batch processing
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
  }
  
  static async processBatch() {
    const batch = writeBatch(db);
    
    for (const [key, updates] of this.pendingUpdates.entries()) {
      const [collection, docId] = key.split('/');
      const docRef = doc(db, collection, docId);
      
      batch.update(docRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    }
    
    try {
      await batch.commit();
      console.log(`✅ Batch processed ${this.pendingUpdates.size} updates`);
    } catch (error) {
      console.error('❌ Batch update failed:', error);
      // Retry logic could be added here
    }
    
    // Clear pending updates
    this.pendingUpdates.clear();
    this.batchTimeout = null;
  }
}

// Usage in components for frequent updates
const WorkTimer = ({ workItemId }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      
      // Batch the frequent time updates instead of individual Firebase writes
      BatchUpdateManager.scheduleUpdate('workItems', workItemId, {
        currentTime: elapsedTime + 1
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [workItemId]);
};
```

## Data Flow Performance Metrics

### Measurement Points
```javascript
// Performance monitoring throughout data flow
class DataFlowMetrics {
  static measurements = new Map();
  
  static startMeasurement(operationId, metadata = {}) {
    this.measurements.set(operationId, {
      startTime: performance.now(),
      metadata
    });
  }
  
  static endMeasurement(operationId, result = {}) {
    const measurement = this.measurements.get(operationId);
    if (!measurement) return;
    
    const endTime = performance.now();
    const duration = endTime - measurement.startTime;
    
    const metrics = {
      operationId,
      duration,
      startTime: measurement.startTime,
      endTime,
      result,
      metadata: measurement.metadata
    };
    
    // Log performance metrics
    console.log(`📊 Operation ${operationId}: ${duration.toFixed(2)}ms`, metrics);
    
    // Send to analytics (if configured)
    this.sendMetrics(metrics);
    
    this.measurements.delete(operationId);
  }
  
  static sendMetrics(metrics) {
    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', 'data_flow_performance', {
        custom_parameter_operation: metrics.operationId,
        custom_parameter_duration: metrics.duration
      });
    }
  }
}

// Usage throughout the data flow
const useWorkManagement = () => {
  return useAppStore(state => ({
    assignWork: async (operatorId, workData) => {
      const operationId = `assign_work_${Date.now()}`;
      DataFlowMetrics.startMeasurement(operationId, { operatorId, workData });
      
      try {
        const result = await state.assignWork(operatorId, workData);
        DataFlowMetrics.endMeasurement(operationId, { success: result.success });
        return result;
      } catch (error) {
        DataFlowMetrics.endMeasurement(operationId, { success: false, error: error.message });
        throw error;
      }
    }
  }), shallow);
};
```

This comprehensive data flow documentation provides a detailed understanding of how data moves through the Garment ERP PWA system, from user interactions to database updates and real-time synchronization across all connected clients.