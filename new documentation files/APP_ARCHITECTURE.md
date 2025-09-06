# 🏗️ Garment ERP PWA - Application Architecture

## 📋 Table of Contents
- [System Overview](#system-overview)
- [Architecture Patterns](#architecture-patterns)
- [Technology Stack](#technology-stack)
- [Folder Structure](#folder-structure)
- [Data Flow](#data-flow)
- [Component Architecture](#component-architecture)
- [Service Layer](#service-layer)
- [State Management](#state-management)
- [Security Architecture](#security-architecture)
- [Performance Architecture](#performance-architecture)

---

## 🎯 System Overview

The Garment ERP PWA is built using a **modern, scalable, and maintainable architecture** that supports real-time collaboration, offline functionality, and multi-role access control.

### **Core Architectural Principles:**
- **🔄 Centralized Logic**: All business logic centralized for consistency
- **🧩 Modular Design**: Loosely coupled, highly cohesive modules  
- **📱 Progressive Web App**: Offline-first, mobile-responsive design
- **🔐 Security First**: Role-based access control throughout
- **⚡ Performance Optimized**: Lazy loading, caching, and optimization
- **🌐 Real-time**: Live updates and collaborative features

---

## 🏛️ Architecture Patterns

### **1. Centralized Architecture Pattern**
```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │  Operator   │ │ Supervisor  │ │ Management/Admin    ││
│  │ Dashboard   │ │ Dashboard   │ │    Dashboard        ││
│  └─────────────┘ └─────────────┘ └─────────────────────┘│
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │   Workflow  │ │   Payment   │ │    Quality          ││
│  │   Engine    │ │   System    │ │    Control          ││
│  └─────────────┘ └─────────────┘ └─────────────────────┘│
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│
│  │  Firebase   │ │   Damage    │ │    Notification     ││
│  │  Services   │ │   Reports   │ │     Service         ││
│  └─────────────┘ └─────────────┘ └─────────────────────┘│
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                     DATA LAYER                          │
│            Firebase Firestore + Authentication          │
└─────────────────────────────────────────────────────────┘
```

### **2. Component Hierarchy Pattern**
```
App (Root)
├── CentralizedAppProvider (Global State)
├── ErrorBoundary (Error Handling)
├── AuthContext (Authentication)
└── Router
    ├── OperatorDashboard
    │   ├── WorkQueue
    │   ├── SelfAssignmentSystem
    │   ├── WorkCompletion
    │   └── DamageReportModal
    ├── SupervisorDashboard  
    │   ├── WorkAssignmentBoard
    │   ├── BundleFlowTracker
    │   └── EmergencyWorkInsertion
    └── AdminDashboard
        ├── UserManagement
        ├── WorkflowTemplates
        └── Analytics
```

---

## 💻 Technology Stack

### **Frontend Architecture**
```javascript
// Core Technologies
React 18.2.0           // UI Framework with Concurrent Features
PWA                    // Progressive Web App capabilities
Tailwind CSS 3.3.0    // Utility-first CSS framework
Context API            // State management
Service Workers        // Offline functionality
```

### **Backend & Services**
```javascript
// Firebase Ecosystem
Firebase 10.x          // Backend-as-a-Service
Firestore             // NoSQL Database
Firebase Auth         // Authentication & Authorization
Firebase Hosting     // Static web hosting
Firebase Functions   // Serverless functions (if needed)
```

### **Development & Build Tools**
```javascript
// Development Stack
Vite                  // Build tool and dev server
ESLint               // Code linting
Prettier             // Code formatting
Husky                // Git hooks
```

---

## 📁 Folder Structure

```
src/
├── components/              # React components by role
│   ├── admin/              # Admin-specific components
│   ├── supervisor/         # Supervisor components
│   ├── operator/           # Operator components  
│   ├── common/             # Shared components
│   └── ui/                 # Reusable UI components
│
├── core/                   # Core application logic
│   ├── business/           # Business logic engines
│   │   ├── WorkflowEngine.js
│   │   ├── PaymentEngine.js
│   │   └── QualityEngine.js
│   ├── components/         # Core reusable components
│   │   └── ui/            # Base UI components
│   └── constants/          # Centralized constants
│       └── index.js       # All app constants
│
├── services/              # External service integrations
│   ├── firebase-services.js
│   ├── DamageReportService.js
│   ├── OperatorWalletService.js
│   └── base/
│       └── BaseService.js
│
├── contexts/              # React Context providers
│   ├── AuthContext.jsx
│   ├── LanguageContext.jsx
│   ├── NotificationContext.jsx
│   └── CentralizedAppProvider.jsx
│
├── hooks/                 # Custom React hooks
│   ├── useAuth.js
│   ├── useNotifications.js
│   └── useWorkflow.js
│
├── lib/                   # Utility libraries
│   ├── appUtils.js
│   ├── workflowManager.js
│   └── businessLogic.js
│
├── config/               # Configuration files
│   ├── firebase.js
│   ├── damageReportSchema.js
│   └── environment.js
│
├── constants/            # Legacy constants (being migrated)
│   ├── index.js
│   └── appConstants.js
│
└── utils/               # Utility functions
    ├── logger.js
    ├── performanceMonitor.js
    └── helpers.js
```

---

## 🔄 Data Flow Architecture

### **1. User Action Flow**
```
User Action → Component → Context/Hook → Service → Firebase → Database
     ↓           ↓          ↓           ↓         ↓         ↓
   Click      Handler    Business    API       Firestore  Update
            Function     Logic      Call      
                                      ↓
Real-time Listener ← Firebase ← Database Update
     ↓
Context Update → Component Re-render → UI Update
```

### **2. Workflow State Flow**
```javascript
// Example: Work Assignment Flow
OperatorDashboard
    ↓ (self-assigns work)
SelfAssignmentSystem → useWorkflow → WorkflowEngine
    ↓                                      ↓
WorkAssignmentService → Firebase Services → Firestore
    ↓                                      ↓
Real-time Update → NotificationContext → All Users
```

### **3. Damage Reporting Flow**
```javascript
DamageReportModal → DamageReportService → holdBundlePayment()
        ↓                    ↓                    ↓
   Bundle Payment         Firestore          OperatorWallet
      HELD              Update Bundle        Update Held Amount
        ↓                    ↓                    ↓
  Supervisor Gets     Real-time           Operator Sees
  Notification        Listeners           Payment Hold
```

---

## 🧩 Component Architecture

### **1. Component Design Principles**
```javascript
// Single Responsibility Principle
const WorkCompletion = ({ bundleId, onComplete }) => {
  // Only handles work completion logic
  const [completionData, setCompletionData] = useState({});
  const { completeWork } = useWorkflow();
  
  const handleSubmit = async () => {
    // Business logic delegated to service
    await completeWork(bundleId, completionData);
    onComplete();
  };
};
```

### **2. Composition over Inheritance**
```javascript
// Reusable UI components composed together
const OperatorDashboard = () => (
  <Dashboard>
    <Header user={user} notifications={notifications} />
    <WorkQueue items={workItems} onSelect={handleWorkSelect} />
    <DamageReportModal isOpen={showDamage} onSubmit={handleDamageReport} />
  </Dashboard>
);
```

### **3. Container-Presentation Pattern**
```javascript
// Container Component (Logic)
const WorkQueueContainer = () => {
  const [workItems, setWorkItems] = useState([]);
  const { assignedWork } = useWorkflow();
  
  return <WorkQueuePresentation items={workItems} onAction={handleAction} />;
};

// Presentation Component (UI Only)
const WorkQueuePresentation = ({ items, onAction }) => (
  <div className="work-queue">
    {items.map(item => <WorkCard key={item.id} item={item} onClick={onAction} />)}
  </div>
);
```

---

## 🔧 Service Layer Architecture

### **1. Base Service Pattern**
```javascript
// src/services/base/BaseService.js
class BaseService {
  constructor(collectionName) {
    this.collection = collectionName;
    this.cache = new Map();
  }

  async create(data) {
    // Standardized create logic with validation, caching, logging
  }
  
  async update(id, data) {
    // Standardized update logic with optimistic updates
  }
}
```

### **2. Specialized Services**
```javascript
// Domain-specific services extend BaseService
class DamageReportService extends BaseService {
  constructor() {
    super('damage_reports');
  }

  async submitDamageReport(reportData) {
    // 1. Validate report
    // 2. Hold bundle payment  
    // 3. Create damage report
    // 4. Send notifications
    // 5. Return result
  }
}
```

### **3. Service Composition**
```javascript
// Services work together for complex operations
const completeWorkWithDamage = async (workItem, damageData) => {
  const batch = writeBatch(db);
  
  // Multiple services coordinate transaction
  await workflowService.completeWork(batch, workItem);
  await damageReportService.createReport(batch, damageData);
  await walletService.holdPayment(batch, workItem.bundleId);
  
  await batch.commit();
};
```

---

## 🏪 State Management Architecture

### **1. Centralized State Pattern**
```javascript
// CentralizedAppProvider manages global state
const CentralizedAppProvider = ({ children }) => {
  const [globalState, setGlobalState] = useState({
    user: null,
    workItems: [],
    notifications: [],
    damageReports: [],
    walletBalance: null
  });

  const updateState = (updates) => {
    setGlobalState(prev => ({ ...prev, ...updates }));
  };

  return (
    <CentralizedContext.Provider value={{ globalState, updateState }}>
      {children}
    </CentralizedContext.Provider>
  );
};
```

### **2. Context Specialization**
```javascript
// Specialized contexts for different domains
AuthContext          // User authentication state
LanguageContext      // Internationalization 
NotificationContext  // Real-time notifications
WorkflowContext      // Work management state
```

### **3. State Synchronization**
```javascript
// Real-time state synchronization with Firebase
const useRealtimeSync = (userId) => {
  useEffect(() => {
    const unsubscribes = [
      // Sync work assignments
      onSnapshot(workQuery, (snapshot) => {
        updateGlobalState({ workItems: processSnapshot(snapshot) });
      }),
      
      // Sync notifications  
      onSnapshot(notificationQuery, (snapshot) => {
        updateGlobalState({ notifications: processSnapshot(snapshot) });
      })
    ];

    return () => unsubscribes.forEach(unsub => unsub());
  }, [userId]);
};
```

---

## 🔐 Security Architecture

### **1. Authentication Flow**
```javascript
// Firebase Authentication + Custom Claims
User Login → Firebase Auth → Custom Claims → Role Assignment → Access Control
```

### **2. Authorization Levels**
```javascript
const ROLE_PERMISSIONS = {
  operator: ['view_own_work', 'complete_work', 'report_damage'],
  supervisor: ['assign_work', 'view_all_work', 'handle_damage'],
  admin: ['manage_users', 'system_config', 'view_analytics']
};
```

### **3. Route Protection**
```javascript
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();
  
  if (!user) return <LoginRedirect />;
  if (!hasPermission(user.role, requiredRole)) return <AccessDenied />;
  
  return children;
};
```

---

## ⚡ Performance Architecture

### **1. Lazy Loading Strategy**
```javascript
// Route-based code splitting
const OperatorDashboard = lazy(() => import('./components/operator/Dashboard'));
const SupervisorDashboard = lazy(() => import('./components/supervisor/Dashboard'));
```

### **2. Caching Strategy**
```javascript
// Multi-level caching
Browser Cache (PWA) → Memory Cache (React) → Firebase Local Cache
```

### **3. Optimization Techniques**
- **React.memo**: Prevent unnecessary re-renders
- **useMemo/useCallback**: Expensive calculation caching
- **Virtual Scrolling**: Large list optimization  
- **Image Optimization**: Lazy loading and WebP format
- **Bundle Splitting**: Reduce initial load time

---

## 🔍 Monitoring & Analytics

### **1. Performance Monitoring**
```javascript
// src/utils/performanceMonitor.js
export const performanceMonitor = {
  trackPageLoad: (pageName) => { /* track metrics */ },
  trackUserAction: (action) => { /* track interactions */ },
  trackError: (error) => { /* error logging */ }
};
```

### **2. Error Boundaries**
```javascript
// Comprehensive error handling at component boundaries
<ErrorBoundary fallback={<ErrorFallback />}>
  <OperatorDashboard />
</ErrorBoundary>
```

---

## 🚀 Deployment Architecture

### **1. Build Process**
```bash
npm run build → Vite Build → Static Assets → Firebase Hosting
```

### **2. Environment Configuration**
```javascript
// Different configs for dev/staging/production
const config = {
  development: { /* dev config */ },
  production: { /* prod config */ }
};
```

### **3. CI/CD Pipeline**
```
GitHub → Actions → Build & Test → Deploy → Health Check
```

---

## 🔧 Development Workflow

### **1. Feature Development**
```
Feature Branch → Local Development → Testing → PR → Code Review → Merge → Deploy
```

### **2. Code Standards**
- **ESLint**: Code quality enforcement
- **Prettier**: Consistent formatting  
- **Husky**: Pre-commit hooks
- **TypeScript**: Type safety (planned upgrade)

---

This architecture supports the complete garment manufacturing workflow while maintaining scalability, security, and performance. The centralized approach ensures consistency across all application domains while allowing for specialized functionality where needed.