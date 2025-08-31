# Garment ERP PWA - Application Logic Documentation

## Overview
This document outlines the core application logic, architecture patterns, and data flow for the Garment ERP PWA system. The application manages garment manufacturing operations including work assignment, operator management, production tracking, and quality control.

## Architecture Overview

### Centralized Data Management
The application uses a centralized architecture built on top of Zustand state management with Firebase real-time subscriptions.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Components    │───▶│  Custom Hooks    │───▶│  Zustand Store  │
│   (UI Layer)    │    │  (Data Access)   │    │  (State Mgmt)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Firebase        │    │  Real-time      │
                       │  Services        │    │  Subscriptions  │
                       └──────────────────┘    └─────────────────┘
```

## Core Data Flow Patterns

### 1. Centralized Hooks Pattern
Replace direct Firebase calls and context usage with centralized hooks:

**Old Pattern (❌):**
```javascript
import { db, collection, getDocs } from '../../config/firebase';
import { AuthContext } from '../../context/AuthContext';

const Component = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const loadData = async () => {
      const snapshot = await getDocs(collection(db, 'bundles'));
      setData(snapshot.docs.map(doc => doc.data()));
    };
    loadData();
  }, []);
};
```

**New Pattern (✅):**
```javascript
import { useAuth } from '../../context/AuthContext';
import { useWorkManagement } from '../../hooks/useAppData';

const Component = () => {
  const { user } = useAuth();
  const { bundles, createBundle, assignWork } = useWorkManagement();
  
  // Data flows automatically via centralized hooks
  // No manual loading required
};
```

### 2. Real-time Data Synchronization
All data updates propagate automatically through Zustand subscriptions:

```javascript
// AppStore.js - Centralized state management
const useAppStore = create((set, get) => ({
  // State
  users: [],
  bundles: [],
  workItems: [],
  
  // Real-time subscriptions
  subscriptions: new Map(),
  
  // Actions
  setUsers: (users) => set({ users }),
  setBundles: (bundles) => set({ bundles }),
  
  // Subscription management
  addSubscription: (key, unsubscribe) => {
    const subs = get().subscriptions;
    subs.set(key, unsubscribe);
    set({ subscriptions: subs });
  }
}));
```

### 3. Component Data Derivation
Use React.useMemo to derive component-specific data from centralized state:

```javascript
const DashboardComponent = () => {
  const { allUsers, stats, isReady } = useAppData();
  
  const dashboardData = React.useMemo(() => {
    if (!isReady) return { /* default data */ };
    
    const operators = allUsers.filter(user => user.role === 'operator');
    const activeOps = operators.filter(op => op.status === 'working');
    
    return {
      kpis: {
        activeOperators: activeOps.length,
        totalOperators: operators.length,
        efficiency: operators.reduce((sum, op) => sum + op.efficiency, 0) / operators.length
      }
    };
  }, [allUsers, stats, isReady]);
};
```

## Key Application Entities

### 1. User Management
```javascript
// User Entity Structure
{
  id: string,
  name: string,
  nameNepali: string,
  email: string,
  role: 'operator' | 'supervisor' | 'admin' | 'management',
  status: 'available' | 'working' | 'break' | 'offline',
  machineType: string,
  currentEfficiency: number,
  qualityScore: number,
  currentWorkload: number,
  profileColor: string,
  location: string,
  shift: string
}
```

### 2. Work Management
```javascript
// Bundle/Work Item Entity
{
  id: string,
  bundleNumber: string,
  articleNumber: number,
  articleName: string,
  color: string,
  quantity: number,
  currentOperation: string,
  machineType: string,
  status: 'pending' | 'in_progress' | 'completed' | 'quality_check',
  assignedOperator: string,
  priority: 'low' | 'medium' | 'high',
  createdAt: timestamp,
  updatedAt: timestamp,
  estimatedTime: number,
  actualTime: number
}
```

### 3. Production Analytics
```javascript
// Analytics Data Structure
{
  dailyProduction: number,
  targetProduction: number,
  efficiency: number,
  qualityScore: number,
  productionTrends: Array<{
    date: string,
    production: number,
    efficiency: number
  }>,
  operatorPerformance: Array<{
    operatorId: string,
    efficiency: number,
    production: number,
    quality: number
  }>
}
```

## Core Business Logic

### 1. Work Assignment Logic
```javascript
const assignWork = async (operatorId, workData) => {
  // Validate operator availability
  const operator = await getOperator(operatorId);
  if (operator.status !== 'available') {
    throw new Error('Operator not available');
  }
  
  // Check workload capacity
  if (operator.currentWorkload >= 5) {
    throw new Error('Operator at maximum capacity');
  }
  
  // Validate machine compatibility
  if (!operator.machineTypes.includes(workData.machineType)) {
    throw new Error('Machine type incompatible');
  }
  
  // Create work assignment
  const assignment = {
    id: generateId(),
    operatorId,
    bundleId: workData.bundleId,
    assignedAt: new Date(),
    status: 'assigned',
    priority: workData.priority
  };
  
  // Update operator status
  await updateOperatorStatus(operatorId, {
    status: 'working',
    currentWorkload: operator.currentWorkload + 1,
    currentWork: assignment.id
  });
  
  return { success: true, assignment };
};
```

### 2. Quality Control Logic
```javascript
const processQualityCheck = async (workItem, qualityData) => {
  const qualityScore = calculateQualityScore(qualityData);
  
  if (qualityScore >= 95) {
    // High quality - proceed to next operation
    await updateWorkStatus(workItem.id, 'completed');
    await moveToNextOperation(workItem);
  } else if (qualityScore >= 80) {
    // Minor issues - rework required
    await updateWorkStatus(workItem.id, 'rework');
    await assignRework(workItem, qualityData.issues);
  } else {
    // Major issues - reject and reassign
    await updateWorkStatus(workItem.id, 'rejected');
    await createQualityReport(workItem, qualityData);
  }
  
  // Update operator quality metrics
  await updateOperatorQuality(workItem.operatorId, qualityScore);
};
```

### 3. Production Analytics Logic
```javascript
const calculateProductionMetrics = (workItems, operators, timeRange) => {
  const completedWork = workItems.filter(item => 
    item.status === 'completed' && 
    isWithinTimeRange(item.completedAt, timeRange)
  );
  
  const totalProduced = completedWork.reduce((sum, item) => sum + item.quantity, 0);
  const totalTime = completedWork.reduce((sum, item) => sum + item.actualTime, 0);
  
  const efficiency = (totalProduced / totalTime) * 100;
  const averageQuality = completedWork.reduce((sum, item) => sum + item.qualityScore, 0) / completedWork.length;
  
  return {
    totalProduction: totalProduced,
    efficiency: Math.round(efficiency),
    qualityScore: Math.round(averageQuality),
    completionRate: (completedWork.length / workItems.length) * 100
  };
};
```

## Data Flow Patterns

### 1. Component to Store Communication
```javascript
// Component dispatches actions
const handleWorkAssignment = async (operatorId, workData) => {
  const result = await assignWork(operatorId, workData);
  if (result.success) {
    // Store automatically updates via subscriptions
    showNotification('Work assigned successfully');
  }
};
```

### 2. Real-time Updates
```javascript
// Firebase subscription in AppStore
const subscribeToWorkItems = () => {
  const unsubscribe = onSnapshot(
    collection(db, 'workItems'),
    (snapshot) => {
      const workItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Update store triggers component re-renders
      useAppStore.getState().setWorkItems(workItems);
    }
  );
  
  return unsubscribe;
};
```

### 3. Error Handling Pattern
```javascript
const withErrorHandling = async (operation, context) => {
  try {
    return await operation();
  } catch (error) {
    console.error(`Error in ${context}:`, error);
    
    // Global error handling
    useAppStore.getState().addError({
      message: error.message,
      context,
      timestamp: new Date(),
      severity: 'error'
    });
    
    // User notification
    showNotification(
      isNepali ? 'त्रुटि भयो' : 'An error occurred',
      'error'
    );
    
    return { success: false, error: error.message };
  }
};
```

## Performance Optimization

### 1. Shallow Comparison in Selectors
```javascript
// Prevent unnecessary re-renders
const useWorkData = () => useAppStore(
  state => ({
    bundles: state.bundles,
    workItems: state.workItems,
    loading: state.loading
  }),
  shallow // Import from zustand/shallow
);
```

### 2. Memoized Calculations
```javascript
const Dashboard = () => {
  const { allUsers, workItems } = useAppData();
  
  // Expensive calculations memoized
  const metrics = useMemo(() => {
    return calculateProductionMetrics(workItems, allUsers);
  }, [workItems, allUsers]);
  
  return <MetricsDisplay metrics={metrics} />;
};
```

### 3. Subscription Management
```javascript
// Cleanup subscriptions on unmount
useEffect(() => {
  const subscriptions = [];
  
  // Add subscriptions
  subscriptions.push(subscribeToUsers());
  subscriptions.push(subscribeToWorkItems());
  
  return () => {
    subscriptions.forEach(unsub => unsub());
  };
}, []);
```

## Security Patterns

### 1. Role-based Access Control
```javascript
const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = (action, resource) => {
    const permissions = ROLE_PERMISSIONS[user.role];
    return permissions.includes(`${action}:${resource}`);
  };
  
  return { hasPermission };
};

// Usage in components
const WorkAssignmentPanel = () => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission('assign', 'work')) {
    return <AccessDenied />;
  }
  
  return <AssignmentInterface />;
};
```

### 2. Data Validation
```javascript
const validateWorkData = (workData) => {
  const schema = {
    bundleId: { required: true, type: 'string' },
    operatorId: { required: true, type: 'string' },
    quantity: { required: true, type: 'number', min: 1 },
    priority: { required: true, enum: ['low', 'medium', 'high'] }
  };
  
  return validateSchema(workData, schema);
};
```

## Internationalization (i18n)

### 1. Language Context
```javascript
const useLanguage = () => {
  const { language, translations } = useContext(LanguageContext);
  
  const t = (key, params = {}) => {
    let text = translations[language][key] || key;
    
    // Replace parameters
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  };
  
  return { t, isNepali: language === 'np' };
};
```

### 2. Date/Time Formatting
```javascript
const formatDateByLanguage = (date, isNepali) => {
  if (isNepali) {
    return convertToNepaliDate(date);
  }
  return new Intl.DateTimeFormat('en-US').format(date);
};
```

## Error Recovery Patterns

### 1. Retry Logic
```javascript
const withRetry = async (operation, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
};
```

### 2. Fallback Data
```javascript
const useWorkData = () => {
  const { bundles, loading, error } = useWorkManagement();
  
  // Provide fallback data on error
  if (error) {
    return {
      bundles: getCachedBundles() || [],
      loading: false,
      error: true
    };
  }
  
  return { bundles, loading, error };
};
```

## Migration Patterns

### From Old to Centralized Architecture:
1. **Replace Contexts**: `useContext(AuthContext)` → `useAuth()`
2. **Replace Firebase Calls**: Direct imports → Centralized services
3. **Replace Local State**: `useState` for data → Centralized hooks
4. **Add Error Handling**: Consistent error patterns
5. **Update Loading States**: Local loading → Centralized loading

## Testing Strategies

### 1. Component Testing
```javascript
// Test centralized data flow
test('should display work items from centralized store', () => {
  const mockWorkItems = [/* mock data */];
  
  // Mock the hook
  jest.mock('../../hooks/useAppData', () => ({
    useWorkManagement: () => ({
      workItems: mockWorkItems,
      loading: false
    })
  }));
  
  render(<WorkItemsList />);
  expect(screen.getByText('Work Item 1')).toBeInTheDocument();
});
```

### 2. Integration Testing
```javascript
// Test complete workflow
test('work assignment workflow', async () => {
  // Mock operator and work data
  const operator = { id: '1', status: 'available' };
  const workData = { bundleId: '1', priority: 'high' };
  
  // Execute assignment
  const result = await assignWork(operator.id, workData);
  
  expect(result.success).toBe(true);
  expect(operator.status).toBe('working');
});
```

This documentation serves as the canonical reference for understanding the application's architecture, data flow, and business logic patterns. All new development should follow these established patterns for consistency and maintainability.