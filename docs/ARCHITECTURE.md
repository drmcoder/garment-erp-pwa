# Centralized Architecture Documentation

## Overview
This document outlines the centralized architecture implementation for the Garment ERP PWA. The new architecture consolidates scattered business logic, state management, and data operations into organized, reusable services and hooks.

## Architecture Components

### 1. Centralized Store (`/src/store/AppStore.js`)
- **Purpose**: Global state management using Zustand
- **Features**:
  - Centralized state for users, work items, production stats
  - Async actions for data operations
  - Built-in loading and error handling
  - Automatic cache invalidation
  - Utility functions for common operations

**Key Benefits**:
- Single source of truth for application state
- Consistent loading states across components
- Automatic data synchronization
- Reduced prop drilling

### 2. Data Service (`/src/services/DataService.js`)
- **Purpose**: Centralized data access layer
- **Features**:
  - Generic CRUD operations with caching
  - Request deduplication
  - Automatic error handling
  - Specialized methods for common queries
  - Batch operations
  - Cache management

**Key Benefits**:
- Consistent API interface
- Built-in caching reduces Firebase calls
- Centralized error handling
- Performance optimizations

### 3. Business Logic Service (`/src/services/BusinessLogicService.js`)
- **Purpose**: Centralized business rules and calculations
- **Features**:
  - Work assignment eligibility checks
  - Earnings calculations with bonuses/penalties
  - Production efficiency analysis
  - Quality analysis and recommendations
  - Workload balancing algorithms
  - Dependency resolution
  - Report generation

**Key Benefits**:
- Consistent business rule application
- Easy to test and maintain
- Reusable across components
- Clear separation of concerns

### 4. Custom Hooks (`/src/hooks/useAppData.js`)
- **Purpose**: Reusable data access hooks
- **Features**:
  - `useAppData()` - Main app data hook
  - `useUsers()` - User management
  - `useWorkManagement()` - Work operations
  - `useProductionAnalytics()` - Production metrics
  - `useOperatorData()` - Operator-specific data
  - `useSupervisorData()` - Supervisor dashboard data
  - `useRealTimeData()` - Real-time subscriptions
  - `useDataPersistence()` - Cache management

**Key Benefits**:
- Consistent data access patterns
- Automatic loading states
- Built-in error handling
- Reusable across components

## Migration Strategy

### Phase 1: Core Infrastructure ✅
- [x] Created centralized store
- [x] Implemented data service layer
- [x] Added business logic service
- [x] Built custom hooks

### Phase 2: Component Migration 🔄
- [x] Updated OperatorWorkDashboard (demo version)
- [ ] Update remaining operator components
- [ ] Update supervisor components
- [ ] Update admin components

### Phase 3: Testing & Optimization
- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Documentation updates

## Usage Examples

### Using the Centralized Store
```javascript
import { useAppStore, useAppActions } from '../store/AppStore';

const MyComponent = () => {
  const { users, loading, error } = useAppStore();
  const { loadUsers, updateUser } = useAppActions();
  
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);
  
  // Component logic...
};
```

### Using Custom Hooks
```javascript
import { useOperatorData, useWorkManagement } from '../hooks/useAppData';

const OperatorDashboard = () => {
  const { stats, myAssignments, hasActiveWork } = useOperatorData();
  const { assignWork, completeWork } = useWorkManagement();
  
  const handleCompleteWork = async (workId, completionData) => {
    try {
      await completeWork(workId, completionData);
      // Success handling is automatic
    } catch (error) {
      // Error handling is automatic
    }
  };
  
  // Component logic...
};
```

### Using Business Logic Service
```javascript
import BusinessLogicService from '../services/BusinessLogicService';

const AssignmentComponent = () => {
  const handleAssignWork = async (operatorId, workData) => {
    // Check eligibility using centralized business rules
    const eligibility = await BusinessLogicService.canAssignWork(operatorId, workData);
    
    if (!eligibility.canAssign) {
      showNotification(eligibility.reason, 'warning');
      return;
    }
    
    // Proceed with assignment...
  };
};
```

## Benefits of Centralized Architecture

### 1. Maintainability
- Single location for business logic
- Consistent patterns across components
- Easier debugging and testing
- Clear separation of concerns

### 2. Performance
- Request deduplication
- Intelligent caching
- Reduced Firebase calls
- Optimistic updates

### 3. Developer Experience
- Consistent APIs
- Automatic loading states
- Built-in error handling
- Type safety (with TypeScript)

### 4. Scalability
- Easy to add new features
- Reusable components
- Modular architecture
- Clear data flow

## File Structure
```
src/
├── store/
│   └── AppStore.js              # Global state management
├── services/
│   ├── DataService.js           # Data access layer
│   ├── BusinessLogicService.js  # Business logic
│   └── ...existing services
├── hooks/
│   └── useAppData.js            # Custom hooks
├── components/
│   ├── operator/
│   │   ├── OperatorWorkDashboardNew.jsx              # Original
│   │   └── OperatorWorkDashboardNewCentralized.jsx   # Centralized version
│   └── ...other components
└── context/                     # Existing contexts (still used for auth, etc.)
```

## Integration with Existing Code

The centralized architecture is designed to work alongside existing code:

- **Existing contexts** (Auth, Language, Notifications) are still used
- **Firebase config** and existing services remain unchanged
- **Components** can be migrated gradually
- **Development mode** uses centralized version for testing

## Performance Monitoring

Key metrics to monitor:
- Firebase read/write operations (should decrease)
- Component re-render frequency (should decrease)
- Page load times (should improve)
- Cache hit rates (should increase)

## Testing Strategy

1. **Unit Tests**: Business logic functions
2. **Integration Tests**: Data service operations
3. **Component Tests**: Hook usage patterns
4. **E2E Tests**: Complete user workflows

## Future Enhancements

1. **Real-time Subscriptions**: Replace polling with WebSocket connections
2. **Offline Support**: Enhanced PWA capabilities
3. **TypeScript Migration**: Add type safety
4. **Performance Analytics**: Built-in monitoring
5. **A/B Testing**: Feature flag system

## Conclusion

The centralized architecture provides a solid foundation for the Garment ERP application, improving maintainability, performance, and developer experience while preserving the existing functionality and user experience.