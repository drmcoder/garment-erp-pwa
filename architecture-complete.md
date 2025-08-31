# Garment ERP PWA - Complete Architecture Documentation

## System Architecture Overview

The Garment ERP PWA is built using a modern, scalable architecture that supports real-time manufacturing operations management. The system follows a centralized data management pattern with React frontend, Firebase backend, and Zustand state management.

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Admin     │  │ Supervisor  │  │  Operator   │         │
│  │ Dashboard   │  │ Dashboard   │  │ Dashboard   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              React Component Layer                      │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │ │
│  │  │ Common  │ │ Admin   │ │Supervisor│ │Operator │      │ │
│  │  │Components│ │Components│ │Components│ │Components│     │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Custom Hooks Layer                         │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │ │
│  │  │ useAppData  │ │useWorkMgmt  │ │  useUsers   │      │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │            Zustand State Management                     │ │
│  │  ┌─────────────────────────────────────────────────────┐│ │
│  │  │                AppStore.js                          ││ │
│  │  │  • Users State      • Work Items State             ││ │
│  │  │  • Bundles State    • Analytics State              ││ │
│  │  │  • Real-time Subscriptions Management              ││ │
│  │  └─────────────────────────────────────────────────────┘│ │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Service Layer                              │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │ │
│  │  │   WIP   │ │ Bundle  │ │Operator │ │  Config │      │ │
│  │  │Service  │ │Service  │ │Service  │ │Service  │      │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      FIREBASE TIER                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                  Firestore Database                     │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │ │
│  │  │  users  │ │ bundles │ │workItems│ │analytics│      │ │
│  │  │collection│ │collection│ │collection│ │collection│     │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │ │
│  │                                                         │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │ │
│  │  │templates│ │ damage  │ │ quality │ │ system  │      │ │
│  │  │collection│ │collection│ │collection│ │collection│     │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Firebase Authentication                    │ │
│  │         Role-based Access Control (RBAC)               │ │
│  └─────────────────────────────────────────────────────────┘ │
│                              │                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Real-time Subscriptions                       │ │
│  │         onSnapshot() WebSocket Connections              │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Core Architectural Principles

### 1. Centralized State Management
- **Single Source of Truth**: All application state managed through Zustand store
- **Real-time Synchronization**: Firebase subscriptions automatically update store
- **Predictable Data Flow**: Unidirectional data flow from store to components
- **Performance Optimization**: Shallow comparison prevents unnecessary re-renders

### 2. Separation of Concerns
- **Presentation Layer**: React components handle UI rendering only
- **Business Logic**: Custom hooks encapsulate data access patterns
- **Data Layer**: Services handle Firebase operations and API calls
- **State Layer**: Zustand manages global application state

### 3. Real-time Architecture
- **WebSocket Connections**: Firebase onSnapshot for live updates
- **Event-Driven Updates**: State changes trigger component re-renders
- **Optimistic Updates**: Local state updates before server confirmation
- **Subscription Management**: Automatic cleanup prevents memory leaks

## Component Architecture

### 1. Component Hierarchy
```
App
├── CentralizedAppProvider (Global State Provider)
├── Router
│   ├── AdminRoutes
│   │   ├── AdminDashboard
│   │   ├── UserManagement
│   │   ├── SystemConfiguration
│   │   └── Analytics
│   ├── SupervisorRoutes
│   │   ├── SupervisorDashboard
│   │   ├── WorkAssignment
│   │   ├── OperatorMonitoring
│   │   ├── QualityControl
│   │   └── ProductionTracking
│   ├── OperatorRoutes
│   │   ├── OperatorDashboard
│   │   ├── WorkQueue
│   │   ├── SelfAssignment
│   │   └── QualityReporting
│   └── ManagementRoutes
│       ├── ManagementDashboard
│       ├── ProductionAnalytics
│       └── ReportsCenter
└── GlobalComponents
    ├── NotificationSystem
    ├── ErrorBoundary
    └── LoadingIndicators
```

### 2. Component Patterns

#### Centralized Data Access Pattern
```javascript
// Component → Hook → Store → Service → Firebase

// Component Layer
const WorkAssignmentBoard = () => {
  const { bundles, assignWork, loading } = useWorkManagement();
  const { showNotification } = useNotifications();
  
  const handleAssignment = async (operatorId, workData) => {
    const result = await assignWork(operatorId, workData);
    if (result.success) {
      showNotification('Work assigned successfully', 'success');
    }
  };
  
  return (
    <div>
      {loading ? <Loading /> : <BundleList bundles={bundles} onAssign={handleAssignment} />}
    </div>
  );
};

// Hook Layer
const useWorkManagement = () => {
  return useAppStore(state => ({
    bundles: state.bundles,
    assignWork: state.assignWork,
    loading: state.loading
  }), shallow);
};

// Store Layer (Zustand)
const useAppStore = create((set, get) => ({
  bundles: [],
  loading: false,
  
  assignWork: async (operatorId, workData) => {
    set({ loading: true });
    try {
      const result = await WIPService.assignWork(operatorId, workData);
      if (result.success) {
        // Store automatically updated via subscriptions
        return { success: true };
      }
    } catch (error) {
      console.error('Assignment failed:', error);
      return { success: false, error: error.message };
    } finally {
      set({ loading: false });
    }
  }
}));
```

#### Real-time Subscription Pattern
```javascript
// Subscription Management in AppStore
const subscribeToWorkItems = () => {
  const unsubscribe = onSnapshot(
    collection(db, 'workItems'),
    (snapshot) => {
      const workItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Automatic store update triggers component re-renders
      useAppStore.getState().setWorkItems(workItems);
    },
    (error) => {
      console.error('WorkItems subscription error:', error);
      useAppStore.getState().setError(error);
    }
  );
  
  return unsubscribe;
};

// Subscription lifecycle management
useEffect(() => {
  const subscriptions = [];
  
  // Add subscriptions
  subscriptions.push(subscribeToUsers());
  subscriptions.push(subscribeToWorkItems());
  subscriptions.push(subscribeToBundles());
  
  return () => {
    // Cleanup all subscriptions
    subscriptions.forEach(unsubscribe => unsubscribe());
  };
}, []);
```

## Data Architecture

### 1. Firestore Database Schema
```
garment-erp-pwa/
├── users/
│   └── {userId}
│       ├── id: string
│       ├── name: string
│       ├── nameNepali: string
│       ├── email: string
│       ├── role: 'operator'|'supervisor'|'admin'|'management'
│       ├── status: 'available'|'working'|'break'|'offline'
│       ├── machineType: string
│       ├── machineTypes: string[]
│       ├── currentWorkload: number
│       ├── maxWorkload: number
│       ├── currentEfficiency: number
│       ├── qualityScore: number
│       ├── profileColor: string
│       ├── location: string
│       ├── shift: 'morning'|'evening'|'night'
│       ├── dailyProduction: number
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── bundles/
│   └── {bundleId}
│       ├── bundleNumber: string
│       ├── articleNumber: number
│       ├── articleName: string
│       ├── articleNameNepali: string
│       ├── color: string
│       ├── colorCode: string
│       ├── sizes: string[]
│       ├── quantity: number
│       ├── rate: number
│       ├── totalValue: number
│       ├── status: 'pending'|'assigned'|'in_progress'|'completed'|'quality_check'
│       ├── priority: 'low'|'medium'|'high'
│       ├── machineType: string
│       ├── currentOperation: string
│       ├── assignedOperator: string
│       ├── assignedLine: string
│       ├── estimatedTime: number
│       ├── actualTime: number
│       ├── dueDate: timestamp
│       ├── createdBy: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── workItems/
│   └── {workItemId}
│       ├── bundleId: string
│       ├── bundleNumber: string
│       ├── operatorId: string
│       ├── operatorName: string
│       ├── articleNumber: number
│       ├── operation: string
│       ├── pieces: number
│       ├── machineType: string
│       ├── status: 'assigned'|'started'|'paused'|'completed'|'quality_check'
│       ├── priority: 'low'|'medium'|'high'
│       ├── startTime: timestamp
│       ├── endTime: timestamp
│       ├── estimatedTime: number
│       ├── actualTime: number
│       ├── qualityScore: number
│       ├── selfAssigned: boolean
│       ├── selfAssignedAt: timestamp
│       ├── approvalStatus: 'pending'|'approved'|'rejected'
│       ├── wipEntryId: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── analytics/
│   └── {date}
│       ├── date: string (YYYY-MM-DD)
│       ├── totalProduction: number
│       ├── targetProduction: number
│       ├── efficiency: number
│       ├── qualityScore: number
│       ├── onTimeDelivery: number
│       ├── operatorPerformance: array<{
│       │   operatorId: string,
│       │   name: string,
│       │   production: number,
│       │   efficiency: number,
│       │   quality: number
│       │ }>
│       ├── productionTrends: array<{
│       │   hour: number,
│       │   production: number,
│       │   efficiency: number
│       │ }>
│       ├── qualityMetrics: array<{
│       │   operation: string,
│       │   defectRate: number,
│       │   reworkRate: number
│       │ }>
│       ├── machineUtilization: array<{
│       │   machineType: string,
│       │   utilization: number,
│       │   downtime: number
│       │ }>
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── damageReports/
│   └── {reportId}
│       ├── operatorId: string
│       ├── supervisorId: string
│       ├── articleNumber: number
│       ├── operation: string
│       ├── damageType: string
│       ├── quantity: number
│       ├── severity: 'low'|'medium'|'high'
│       ├── description: string
│       ├── images: string[]
│       ├── rootCause: string
│       ├── correctiveAction: string
│       ├── status: 'reported'|'investigating'|'resolved'
│       ├── penalty: number
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── qualityChecks/
│   └── {checkId}
│       ├── workItemId: string
│       ├── operatorId: string
│       ├── inspectorId: string
│       ├── operation: string
│       ├── checkedPieces: number
│       ├── passedPieces: number
│       ├── defectedPieces: number
│       ├── defectTypes: string[]
│       ├── qualityScore: number
│       ├── requiresRework: boolean
│       ├── notes: string
│       ├── images: string[]
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── templates/
│   └── {templateId}
│       ├── name: string
│       ├── nameNepali: string
│       ├── articleType: string
│       ├── operations: array<{
│       │   id: number,
│       │   name: string,
│       │   nameNepali: string,
│       │   machineType: string,
│       │   estimatedTime: number,
│       │   sequence: number,
│       │   dependencies: number[]
│       │ }>
│       ├── isActive: boolean
│       ├── createdBy: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
└── system/
    ├── config/
    │   ├── machineTypes: array<{
    │   │   id: string,
    │   │   name: string,
    │   │   nameNepali: string,
    │   │   icon: string,
    │   │   operations: string[]
    │   │ }>
    │   ├── operations: array<{
    │   │   id: string,
    │   │   name: string,
    │   │   nameNepali: string,
    │   │   machineTypes: string[]
    │   │ }>
    │   ├── priorities: array<{
    │   │   id: string,
    │   │   name: string,
    │   │   nameNepali: string,
    │   │   color: string,
    │   │   level: number
    │   │ }>
    │   └── settings: {
    │       maxWorkloadPerOperator: number,
    │       qualityThreshold: number,
    │       autoAssignmentEnabled: boolean
    │     }
    └── notifications/
        └── {notificationId}
            ├── userId: string
            ├── title: string
            ├── message: string
            ├── type: 'info'|'warning'|'error'|'success'
            ├── isRead: boolean
            ├── data: object
            ├── createdAt: timestamp
            └── expiresAt: timestamp
```

### 2. State Management Architecture
```javascript
// AppStore Structure
const useAppStore = create((set, get) => ({
  // Core Data State
  users: [],
  bundles: [],
  workItems: [],
  analytics: null,
  damageReports: [],
  qualityChecks: [],
  
  // UI State
  loading: {
    users: false,
    bundles: false,
    workItems: false,
    analytics: false
  },
  
  error: null,
  selectedItems: new Set(),
  
  // Filters and Search
  filters: {
    status: 'all',
    machineType: 'all',
    operator: 'all',
    priority: 'all',
    dateRange: 'today'
  },
  
  searchTerm: '',
  
  // Real-time Subscriptions Management
  subscriptions: new Map(),
  isReady: false,
  
  // Core Actions
  setUsers: (users) => set({ users }),
  setBundles: (bundles) => set({ bundles }),
  setWorkItems: (workItems) => set({ workItems }),
  setAnalytics: (analytics) => set({ analytics }),
  
  // Loading State Management
  setLoading: (key, isLoading) => set(state => ({
    loading: { ...state.loading, [key]: isLoading }
  })),
  
  // Error Handling
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  
  // Work Management Actions
  assignWork: async (operatorId, workData) => {
    set(state => ({ loading: { ...state.loading, workItems: true } }));
    try {
      const result = await WIPService.assignWork(operatorId, workData);
      if (result.success) {
        // Store updated via subscriptions
        return { success: true };
      }
      throw new Error(result.error);
    } catch (error) {
      set({ error });
      return { success: false, error: error.message };
    } finally {
      set(state => ({ loading: { ...state.loading, workItems: false } }));
    }
  },
  
  createBundle: async (bundleData) => {
    set(state => ({ loading: { ...state.loading, bundles: true } }));
    try {
      const result = await BundleService.createBundle(bundleData);
      if (result.success) {
        return { success: true, id: result.id };
      }
      throw new Error(result.error);
    } catch (error) {
      set({ error });
      return { success: false, error: error.message };
    } finally {
      set(state => ({ loading: { ...state.loading, bundles: false } }));
    }
  },
  
  updateWorkStatus: async (workItemId, status) => {
    try {
      const result = await WIPService.updateWorkStatus(workItemId, status);
      if (result.success) {
        // Update local state optimistically
        set(state => ({
          workItems: state.workItems.map(item =>
            item.id === workItemId ? { ...item, status } : item
          )
        }));
        return { success: true };
      }
      throw new Error(result.error);
    } catch (error) {
      set({ error });
      return { success: false, error: error.message };
    }
  },
  
  // Subscription Management
  addSubscription: (key, unsubscribe) => {
    const subs = get().subscriptions;
    // Clean up existing subscription
    if (subs.has(key)) {
      subs.get(key)();
    }
    subs.set(key, unsubscribe);
    set({ subscriptions: subs });
  },
  
  removeSubscription: (key) => {
    const subs = get().subscriptions;
    if (subs.has(key)) {
      subs.get(key)(); // Call unsubscribe
      subs.delete(key);
      set({ subscriptions: subs });
    }
  },
  
  clearAllSubscriptions: () => {
    const subs = get().subscriptions;
    subs.forEach(unsubscribe => unsubscribe());
    subs.clear();
    set({ subscriptions: subs, isReady: false });
  }
}));
```

## Security Architecture

### 1. Role-Based Access Control (RBAC)
```javascript
const ROLE_PERMISSIONS = {
  operator: [
    'read:own_work',
    'update:own_work_status',
    'create:self_assignment_request',
    'create:damage_report',
    'read:own_analytics'
  ],
  supervisor: [
    'read:line_work',
    'read:line_operators',
    'create:work_assignment',
    'update:work_assignment',
    'delete:work_assignment',
    'approve:self_assignment',
    'reject:self_assignment',
    'create:bundle',
    'update:bundle_status',
    'read:line_analytics',
    'create:quality_check',
    'update:quality_check'
  ],
  admin: [
    'read:all_data',
    'create:user',
    'update:user',
    'delete:user',
    'manage:system_config',
    'create:template',
    'update:template',
    'delete:template',
    'read:all_analytics',
    'export:all_data'
  ],
  management: [
    'read:analytics',
    'read:reports',
    'export:analytics',
    'read:cost_analysis',
    'read:production_forecasting',
    'read:performance_metrics'
  ]
};

// Permission checking utility
const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = useCallback((action, resource) => {
    if (!user || !user.role) return false;
    
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(`${action}:${resource}`);
  }, [user]);
  
  const canAccess = useCallback((requiredPermissions) => {
    return requiredPermissions.some(permission => hasPermission(...permission.split(':')));
  }, [hasPermission]);
  
  return { hasPermission, canAccess };
};
```

### 2. Authentication Flow Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Login Form    │───▶│  Firebase Auth  │───▶│   JWT Token     │
│   (Email/Pass)  │    │   Validation    │    │   Generation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Loading State  │    │   User Role     │    │   Route Guard   │
│   Management    │    │  Verification   │    │   Protection    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Permission     │    │   Component     │
                       │   Context       │    │    Access       │
                       └─────────────────┘    └─────────────────┘
```

### 3. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    
    function hasRole(role) {
      return getUserRole() == role;
    }
    
    function hasAnyRole(roles) {
      return getUserRole() in roles;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (
        request.auth.uid == userId || 
        hasAnyRole(['supervisor', 'admin', 'management'])
      );
      allow write: if isAuthenticated() && (
        request.auth.uid == userId || 
        hasAnyRole(['admin'])
      );
    }
    
    // Work items collection
    match /workItems/{workItemId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && hasAnyRole(['supervisor', 'admin']);
      allow update: if isAuthenticated() && (
        resource.data.operatorId == request.auth.uid ||
        hasAnyRole(['supervisor', 'admin'])
      );
      allow delete: if isAuthenticated() && hasAnyRole(['supervisor', 'admin']);
    }
    
    // Bundles collection
    match /bundles/{bundleId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && hasAnyRole(['supervisor', 'admin']);
    }
    
    // Analytics collection - read only for management
    match /analytics/{date} {
      allow read: if isAuthenticated() && hasAnyRole(['management', 'admin']);
      allow write: if false; // Only server can write analytics
    }
    
    // Damage reports
    match /damageReports/{reportId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && (
        resource.data.operatorId == request.auth.uid ||
        hasAnyRole(['supervisor', 'admin'])
      );
    }
    
    // System configuration
    match /system/{document=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && hasRole('admin');
    }
  }
}
```

## Performance Architecture

### 1. Optimization Strategies

#### State Management Optimization
```javascript
// Shallow comparison to prevent unnecessary re-renders
import { shallow } from 'zustand/shallow';

const useWorkData = () => useAppStore(
  state => ({
    bundles: state.bundles,
    workItems: state.workItems,
    loading: state.loading.workItems
  }),
  shallow
);

// Memoized selectors for expensive calculations
const useFilteredBundles = (filters) => {
  const bundles = useAppStore(state => state.bundles);
  
  return useMemo(() => {
    return bundles.filter(bundle => {
      if (filters.status !== 'all' && bundle.status !== filters.status) return false;
      if (filters.priority !== 'all' && bundle.priority !== filters.priority) return false;
      if (filters.machineType !== 'all' && bundle.machineType !== filters.machineType) return false;
      return true;
    });
  }, [bundles, filters]);
};
```

#### Component Optimization
```javascript
// Memoized components to prevent unnecessary re-renders
const BundleCard = memo(({ bundle, onAssign, onUpdate }) => {
  const handleAssign = useCallback((operatorId) => {
    onAssign(bundle.id, operatorId);
  }, [bundle.id, onAssign]);
  
  return (
    <div className="bundle-card">
      <BundleHeader bundle={bundle} />
      <BundleActions onAssign={handleAssign} onUpdate={onUpdate} />
    </div>
  );
});

// Virtualized lists for large datasets
const VirtualizedBundleList = ({ bundles }) => {
  const [containerRef, { height, width }] = useElementSize();
  
  return (
    <div ref={containerRef} style={{ height: '100%', width: '100%' }}>
      <FixedSizeList
        height={height}
        width={width}
        itemCount={bundles.length}
        itemSize={120}
      >
        {({ index, style }) => (
          <div style={style}>
            <BundleCard bundle={bundles[index]} />
          </div>
        )}
      </FixedSizeList>
    </div>
  );
};
```

### 2. Caching Architecture
```javascript
// Multi-layer caching strategy
class CacheService {
  static cache = new Map();
  static DEFAULT_TTL = 300000; // 5 minutes
  
  static async get(key, fetcher, ttl = this.DEFAULT_TTL) {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    try {
      const data = await fetcher();
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
      return data;
    } catch (error) {
      // Return cached data if available, even if stale
      if (cached) {
        console.warn(`Using stale cache for ${key}:`, error);
        return cached.data;
      }
      throw error;
    }
  }
  
  static invalidate(pattern) {
    if (typeof pattern === 'string') {
      this.cache.delete(pattern);
    } else {
      // Pattern matching for bulk invalidation
      for (const key of this.cache.keys()) {
        if (pattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }
  }
  
  static clear() {
    this.cache.clear();
  }
}

// Usage in services
class AnalyticsService {
  static async getProductionMetrics(date) {
    const cacheKey = `production_metrics_${date}`;
    
    return await CacheService.get(cacheKey, async () => {
      const doc = await getDoc(doc(db, 'analytics', date));
      return doc.exists() ? doc.data() : null;
    }, 600000); // Cache for 10 minutes
  }
}
```

### 3. Real-time Performance Optimization
```javascript
// Batched updates to reduce Firebase reads
class BatchUpdateManager {
  static updates = new Map();
  static timeout = null;
  static BATCH_DELAY = 1000; // 1 second
  
  static scheduleUpdate(collection, id, data) {
    const key = `${collection}/${id}`;
    
    // Merge with existing updates
    if (this.updates.has(key)) {
      this.updates.set(key, { ...this.updates.get(key), ...data });
    } else {
      this.updates.set(key, data);
    }
    
    // Clear existing timeout and set new one
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    
    this.timeout = setTimeout(() => {
      this.processBatch();
    }, this.BATCH_DELAY);
  }
  
  static async processBatch() {
    const batch = writeBatch(db);
    
    for (const [key, data] of this.updates.entries()) {
      const [collection, id] = key.split('/');
      const docRef = doc(db, collection, id);
      batch.update(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    }
    
    try {
      await batch.commit();
      console.log(`Batch updated ${this.updates.size} documents`);
    } catch (error) {
      console.error('Batch update failed:', error);
    }
    
    this.updates.clear();
    this.timeout = null;
  }
}
```

## Scalability Architecture

### 1. Horizontal Scaling Strategies

#### Service Decomposition
```javascript
// Microservice-style organization within monolith
const services = {
  // User management service
  user: {
    getAll: () => UserService.getAllUsers(),
    getByRole: (role) => UserService.getUsersByRole(role),
    update: (id, data) => UserService.updateUser(id, data)
  },
  
  // Work management service
  work: {
    assign: (operatorId, workData) => WIPService.assignWork(operatorId, workData),
    complete: (workItemId) => WIPService.completeWork(workItemId),
    getBundles: () => BundleService.getAllBundles()
  },
  
  // Analytics service
  analytics: {
    getMetrics: (date) => AnalyticsService.getProductionMetrics(date),
    generateReport: (params) => ReportService.generateReport(params)
  },
  
  // Quality service
  quality: {
    createCheck: (data) => QualityService.createQualityCheck(data),
    reportDamage: (data) => DamageService.reportDamage(data)
  }
};

// API abstraction layer
const api = {
  get: (service, method, ...args) => services[service][method](...args),
  
  // Caching wrapper
  getCached: (service, method, cacheKey, ttl, ...args) => 
    CacheService.get(cacheKey, () => services[service][method](...args), ttl),
  
  // Retry wrapper
  getWithRetry: async (service, method, maxRetries = 3, ...args) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await services[service][method](...args);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
};
```

### 2. Database Optimization
```javascript
// Optimized Firestore queries with pagination
class PaginatedQuery {
  constructor(collectionPath, pageSize = 25) {
    this.collectionPath = collectionPath;
    this.pageSize = pageSize;
    this.lastDoc = null;
  }
  
  async getFirstPage(constraints = []) {
    const q = query(
      collection(db, this.collectionPath),
      ...constraints,
      limit(this.pageSize)
    );
    
    const snapshot = await getDocs(q);
    this.lastDoc = snapshot.docs[snapshot.docs.length - 1];
    
    return {
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      hasMore: snapshot.docs.length === this.pageSize
    };
  }
  
  async getNextPage(constraints = []) {
    if (!this.lastDoc) throw new Error('No previous page loaded');
    
    const q = query(
      collection(db, this.collectionPath),
      ...constraints,
      startAfter(this.lastDoc),
      limit(this.pageSize)
    );
    
    const snapshot = await getDocs(q);
    this.lastDoc = snapshot.docs[snapshot.docs.length - 1];
    
    return {
      data: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      hasMore: snapshot.docs.length === this.pageSize
    };
  }
}

// Composite indexes for complex queries
const REQUIRED_INDEXES = [
  {
    collection: 'workItems',
    fields: ['status', 'priority', 'createdAt']
  },
  {
    collection: 'bundles',
    fields: ['assignedOperator', 'status', 'dueDate']
  },
  {
    collection: 'users',
    fields: ['role', 'status', 'location']
  }
];
```

## Error Handling Architecture

### 1. Global Error Handling
```javascript
// Global error boundary
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log error to monitoring service
    ErrorService.reportError(error, {
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userId: this.props.userId
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={() => window.location.reload()}
        />
      );
    }
    
    return this.props.children;
  }
}

// Service-level error handling
const withErrorHandling = (serviceMethod, context) => {
  return async (...args) => {
    try {
      return await serviceMethod(...args);
    } catch (error) {
      const errorContext = {
        service: context.service,
        method: context.method,
        args: args,
        timestamp: new Date().toISOString()
      };
      
      console.error(`Error in ${context.service}.${context.method}:`, error);
      
      // Global error store update
      useAppStore.getState().setError({
        message: error.message,
        context: errorContext,
        severity: 'error'
      });
      
      return { success: false, error: error.message };
    }
  };
};
```

### 2. Network Error Recovery
```javascript
// Offline/online detection and recovery
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryQueue, setRetryQueue] = useState([]);
  
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processRetryQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const addToRetryQueue = useCallback((operation) => {
    setRetryQueue(queue => [...queue, operation]);
  }, []);
  
  const processRetryQueue = useCallback(async () => {
    for (const operation of retryQueue) {
      try {
        await operation();
      } catch (error) {
        console.error('Retry operation failed:', error);
      }
    }
    setRetryQueue([]);
  }, [retryQueue]);
  
  return { isOnline, addToRetryQueue };
};
```

## Testing Architecture

### 1. Component Testing Strategy
```javascript
// Testing utilities
const createMockStore = (initialState = {}) => {
  return create(() => ({
    users: [],
    bundles: [],
    workItems: [],
    loading: { users: false, bundles: false, workItems: false },
    error: null,
    ...initialState,
    
    // Mock actions
    assignWork: jest.fn(() => Promise.resolve({ success: true })),
    createBundle: jest.fn(() => Promise.resolve({ success: true }))
  }));
};

// Component test example
describe('WorkAssignmentBoard', () => {
  let mockStore;
  
  beforeEach(() => {
    mockStore = createMockStore({
      bundles: [
        { id: '1', bundleNumber: 'B001', status: 'pending' },
        { id: '2', bundleNumber: 'B002', status: 'assigned' }
      ]
    });
  });
  
  it('should display bundles from store', () => {
    render(
      <StoreProvider value={mockStore}>
        <WorkAssignmentBoard />
      </StoreProvider>
    );
    
    expect(screen.getByText('B001')).toBeInTheDocument();
    expect(screen.getByText('B002')).toBeInTheDocument();
  });
  
  it('should call assignWork when assignment is made', async () => {
    render(
      <StoreProvider value={mockStore}>
        <WorkAssignmentBoard />
      </StoreProvider>
    );
    
    const assignButton = screen.getByText('Assign');
    await userEvent.click(assignButton);
    
    expect(mockStore.getState().assignWork).toHaveBeenCalled();
  });
});
```

### 2. Integration Testing
```javascript
// Firebase testing utilities
const setupFirestoreTest = () => {
  const testEnv = initializeTestEnvironment({
    projectId: 'test-garment-erp',
    rules: fs.readFileSync('firestore.rules', 'utf8')
  });
  
  return testEnv;
};

// Integration test example
describe('Work Assignment Integration', () => {
  let testEnv, db, auth;
  
  beforeAll(async () => {
    testEnv = setupFirestoreTest();
    db = testEnv.unauthenticatedContext().firestore();
    auth = testEnv.authenticatedContext('supervisor-1').firestore();
  });
  
  afterAll(() => testEnv.cleanup());
  
  it('should assign work to operator', async () => {
    // Setup test data
    await auth.collection('users').doc('operator-1').set({
      role: 'operator',
      status: 'available',
      currentWorkload: 0
    });
    
    await auth.collection('bundles').doc('bundle-1').set({
      status: 'pending',
      assignedOperator: null
    });
    
    // Execute assignment
    const result = await WIPService.assignWork('operator-1', {
      bundleId: 'bundle-1',
      operation: 'sewing'
    });
    
    expect(result.success).toBe(true);
    
    // Verify state changes
    const operatorDoc = await auth.collection('users').doc('operator-1').get();
    const bundleDoc = await auth.collection('bundles').doc('bundle-1').get();
    
    expect(operatorDoc.data().status).toBe('working');
    expect(bundleDoc.data().assignedOperator).toBe('operator-1');
  });
});
```

This architecture documentation provides a comprehensive guide for understanding, maintaining, and scaling the Garment ERP PWA system.