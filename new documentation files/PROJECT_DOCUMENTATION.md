# Garment ERP PWA - Complete System Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Schema and Data Models](#3-database-schema-and-data-models)
4. [Core Features and User Workflows](#4-core-features-and-user-workflows)
5. [Authentication and Authorization](#5-authentication-and-authorization)
6. [Services and API Integrations](#6-services-and-api-integrations)
7. [UI/UX Components and Design System](#7-uiux-components-and-design-system)
8. [Technical Specifications](#8-technical-specifications)
9. [Development Guidelines](#9-development-guidelines)
10. [Deployment Instructions](#10-deployment-instructions)

---

## 1. Project Overview

### System Description
The **TSA Production Management System** is a comprehensive garment manufacturing ERP Progressive Web Application (PWA) designed for real-time production management, work assignment, quality control, and payroll processing with AI-powered insights and multi-language support.

### Key Characteristics
- **Progressive Web App (PWA)**: Offline-capable, installable, and mobile-optimized
- **Real-time Operations**: Live data synchronization using Firebase
- **Multi-language Support**: English and Nepali with proper typography
- **Role-based Access Control**: Operator, Supervisor, Management hierarchies
- **AI-powered Analytics**: Production predictions and optimization recommendations
- **Mobile-first Design**: Touch-optimized for production floor environments

### Technology Stack

#### Frontend
- **React 18.2.0**: Core framework with hooks and context
- **React Router DOM 6.30.1**: Client-side routing
- **Zustand 5.0.8**: Lightweight state management
- **TailwindCSS 3.4.17**: Utility-first CSS framework
- **Lucide React 0.263.1**: Modern icon library
- **Recharts 3.1.2**: Data visualization

#### Backend & Database
- **Firebase 10.14.1**: Authentication, Firestore, Realtime Database, Cloud Messaging
- **Firebase Functions**: Serverless backend logic
- **Firestore**: Primary database for structured data
- **Firebase Realtime Database**: Live updates and ephemeral data

#### Development & Deployment
- **React Scripts 5.0.1**: Build tooling and development server
- **Workbox**: Service worker and PWA features
- **Netlify Functions**: Serverless function deployment
- **ESLint & Prettier**: Code quality and formatting

#### Specialized Libraries
- **date-fns 4.1.0**: Date manipulation utilities
- **nepali-date-converter 3.4.0**: Nepali calendar integration
- **nepali-datepicker-reactjs 1.1.9**: Nepali date picker component

---

## 2. System Architecture

### Architecture Overview
The system follows a **layered microservices architecture** with real-time capabilities, progressive enhancement, and fault tolerance patterns.

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENT LAYER                          │
├─────────────────────────────────────────────────────────┤
│  PWA Shell | React Components | Context Providers       │
├─────────────────────────────────────────────────────────┤
│                 SERVICE LAYER                           │
├─────────────────────────────────────────────────────────┤
│  Business Services | Cache Service | Error Handling     │
├─────────────────────────────────────────────────────────┤
│                INTEGRATION LAYER                        │
├─────────────────────────────────────────────────────────┤
│  Firebase Services | Realtime Subscriptions | PWA APIs  │
├─────────────────────────────────────────────────────────┤
│                    DATA LAYER                           │
├─────────────────────────────────────────────────────────┤
│     Firestore     |  Realtime DB   |   Local Storage    │
└─────────────────────────────────────────────────────────┘
```

### Core Architectural Patterns

#### 1. Context-driven State Management
- **AuthContext**: User authentication and session management
- **LanguageContext**: Multi-language support (English/Nepali)
- **NotificationContext**: Real-time alerts and messaging
- **SystemContext**: Application-wide settings and configuration
- **PermissionsContext**: Role-based access control

#### 2. Service Layer Architecture
- **ServiceRegistry**: Dependency injection and singleton management
- **BaseService**: Template pattern for CRUD operations
- **Business Logic Services**: Domain-specific operations
- **CacheService**: Multi-level caching with TTL and invalidation
- **ArchitectureService**: Circuit breaker and fault tolerance

#### 3. Progressive Web App Features
- **Service Worker**: Offline functionality and caching strategies
- **Web App Manifest**: Native app-like installation
- **Push Notifications**: Real-time work assignments and alerts
- **Offline-first**: Core functionality works without internet

#### 4. Real-time Data Synchronization
- **Firebase Realtime Database**: Live operator status, work progress
- **Firestore**: Persistent structured data with offline support
- **Hybrid Strategy**: Optimal data source selection
- **Subscription Management**: Centralized real-time listeners

---

## 3. Database Schema and Data Models

### 3.1 Firestore Collections Structure

#### User Management Collections
```javascript
// /operators - Operator profiles and statistics
{
  id: string,
  username: string,
  name: string,
  role: 'operator',
  machineType: 'overlock' | 'flatlock' | 'singleNeedle',
  skillLevel: 'beginner' | 'intermediate' | 'expert',
  speciality: string,
  station: string,
  stats: {
    todayPieces: number,
    todayEarnings: number,
    weeklyPieces: number,
    weeklyEarnings: number,
    monthlyPieces: number,
    monthlyEarnings: number
  },
  active: boolean,
  lastLogin: timestamp,
  createdAt: timestamp
}

// /supervisors - Supervisor user profiles
{
  id: string,
  username: string,
  name: string,
  role: 'supervisor',
  permissions: string[],
  lineAssignment: string,
  active: boolean,
  lastLogin: timestamp
}

// /management - Management/admin profiles
{
  id: string,
  username: string,
  name: string,
  role: 'management' | 'admin' | 'manager',
  permissions: string[],
  accessLevel: number,
  active: boolean,
  lastLogin: timestamp
}
```

#### Work Management Collections
```javascript
// /bundles - Traditional work bundles/orders
{
  id: string,
  bundleNumber: string,
  article: string,
  articleName: string,
  size: string,
  color: string,
  totalPieces: number,
  completedPieces: number,
  status: 'pending' | 'assigned' | 'in_progress' | 'completed',
  machineType: string,
  currentOperation: string,
  priority: 'low' | 'medium' | 'high',
  assignedOperator: string,
  assignedAt: timestamp,
  createdAt: timestamp,
  dueDate: timestamp
}

// /workItems - Individual work assignments
{
  id: string,
  bundleId: string,
  operatorId: string,
  operation: string,
  pieces: number,
  ratePerPiece: number,
  estimatedTime: number,
  actualTime: number,
  status: 'assigned' | 'started' | 'paused' | 'completed',
  qualityScore: number,
  startedAt: timestamp,
  completedAt: timestamp
}

// /wipEntries - Work In Progress tracking
{
  id: string,
  article: string,
  size: string,
  color: string,
  pieces: number,
  completedPieces: number,
  machineType: string,
  currentOperation: string,
  lotNumber: string,
  rollNumber: string,
  assignedOperator: string,
  status: string,
  createdAt: timestamp
}
```

#### Production and Quality Collections
```javascript
// /operatorEarnings - Payroll and earnings
{
  id: string,
  operatorId: string,
  bundleNumber: string,
  operation: string,
  pieces: number,
  ratePerPiece: number,
  baseEarnings: number,
  qualityBonus: number,
  damageDeduction: number,
  finalEarnings: number,
  status: 'pending' | 'approved' | 'paid' | 'held',
  paymentDate: timestamp,
  completedAt: timestamp
}

// /qualityIssues - Quality control tracking
{
  id: string,
  bundleId: string,
  operatorId: string,
  issueType: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  description: string,
  imageUrl: string,
  reportedBy: string,
  status: 'open' | 'investigating' | 'resolved',
  resolution: string,
  reportedAt: timestamp
}

// /productionStats - Production metrics
{
  id: string,
  date: string,
  lineId: string,
  totalProduction: number,
  targetProduction: number,
  efficiency: number,
  qualityScore: number,
  activeOperators: number,
  downtime: number,
  createdAt: timestamp
}
```

### 3.2 Firebase Realtime Database Structure
```javascript
// Real-time paths for live data
{
  // Live operator status
  "operator_status": {
    "<operatorId>": {
      "status": "working" | "break" | "offline",
      "currentWork": "<workId>",
      "lastActivity": timestamp,
      "machineStatus": "running" | "stopped" | "maintenance"
    }
  },

  // Real-time work progress
  "work_progress": {
    "<workId>": {
      "completedPieces": number,
      "remainingPieces": number,
      "efficiency": number,
      "estimatedCompletion": timestamp,
      "lastUpdate": timestamp
    }
  },

  // Live production metrics
  "live_metrics": {
    "daily": {
      "totalPieces": number,
      "completedOrders": number,
      "activeOperators": number,
      "efficiency": number
    }
  },

  // Real-time notifications
  "notifications": {
    "<userId>": {
      "<notificationId>": {
        "title": string,
        "message": string,
        "type": string,
        "priority": string,
        "read": boolean,
        "timestamp": timestamp
      }
    }
  }
}
```

### 3.3 Business Entity Relationships
```
Operator ──┬── WorkItems ── Bundle
           ├── OperatorEarnings
           ├── QualityIssues  
           └── OperatorStatus (Realtime)

Bundle ──┬── WorkItems
         ├── WIPEntries
         └── QualityIssues

Supervisor ──┬── WorkAssignments
             ├── LineManagement
             └── QualityApprovals

Management ──┬── ProductionReports
             ├── PayrollApprovals
             └── SystemSettings
```

---

## 4. Core Features and User Workflows

### 4.1 Operator Role Features

#### 4.1.1 Self-Assignment System
**Purpose**: AI-powered work selection with machine compatibility matching

**Key Features**:
- Machine-specific work filtering (overlock, flatlock, single-needle)
- AI recommendations based on operator skills and performance history
- Search and filter capabilities by priority, difficulty, and estimated earnings
- Real-time bundle availability with automatic updates

**User Workflow**:
1. **Browse Available Work**: System shows machine-compatible bundles
2. **AI Recommendations**: Smart suggestions with match scores and reasoning
3. **Filter Options**: Priority level, article type, estimated time, rate
4. **Work Selection**: Detailed bundle information with requirements
5. **Request Assignment**: Submit request to supervisor for approval
6. **Approval Workflow**: Real-time status updates until approved

#### 4.1.2 Work Dashboard
**Purpose**: Real-time work execution and progress tracking

**Key Features**:
- Active work display with integrated timer
- Piece counting with progress visualization
- Quality reporting integration
- Break management and time tracking
- Machine status monitoring

**User Workflow**:
1. **View Active Work**: Current assignments with priorities
2. **Start Work**: Timer activation with piece tracking
3. **Progress Updates**: Real-time piece counting and status updates
4. **Quality Reporting**: Photo-based damage reporting
5. **Break Management**: Pause/resume work with time tracking
6. **Work Completion**: Final count submission and quality confirmation

#### 4.1.3 Earnings Wallet
**Purpose**: Transparent earnings tracking and payment status

**Key Features**:
- Real-time earnings calculation based on completed work
- Payment status tracking (pending, approved, paid)
- Historical earnings with detailed breakdown
- Performance bonus and quality deduction tracking

### 4.2 Supervisor Role Features

#### 4.2.1 Work Assignment System
**Purpose**: Comprehensive work distribution and operator management

**Key Features**:
- Drag-and-drop bundle assignment interface
- Operator capacity and skill matching algorithms
- Bulk assignment capabilities with smart suggestions
- Self-assignment approval queue with detailed review

**User Workflow**:
1. **Bundle Overview**: Available work with priorities and requirements
2. **Operator Status**: Real-time operator availability and workload
3. **Assignment Methods**: Drag-and-drop or bulk assignment tools
4. **Approval Queue**: Review self-assignment requests with recommendations
5. **Monitoring**: Track assignment progress and operator performance

#### 4.2.2 Template Builder
**Purpose**: Process template creation and workflow design

**Key Features**:
- Visual workflow designer with drag-and-drop operations
- Operation sequencing with dependencies
- Machine type and skill level requirements
- Time estimation and rate calculation tools

#### 4.2.3 Live Monitoring Dashboard
**Purpose**: Real-time production line monitoring

**Key Features**:
- Live operator status with work progress
- Machine status monitoring and alerts
- Production KPIs and efficiency tracking
- Quality issue alerts and resolution tracking

### 4.3 Management Role Features

#### 4.3.1 Advanced Analytics Dashboard
**Purpose**: Executive-level business intelligence and KPI monitoring

**Key Features**:
- Comprehensive production analytics with trend analysis
- Operator performance rankings and efficiency metrics
- Quality analysis with root cause identification
- Financial tracking (revenue, costs, profitability)
- Predictive analytics for production planning

#### 4.3.2 AI Production Analytics
**Purpose**: Machine learning-powered insights and recommendations

**Key Features**:
- Production efficiency predictions with confidence intervals
- Bottleneck identification and resolution recommendations
- Trend analysis with seasonal adjustments
- Anomaly detection for quality and performance issues
- Correlation analysis between factors affecting production

#### 4.3.3 Payroll System
**Purpose**: Comprehensive payment processing and approval workflows

**Key Features**:
- Automated earnings calculation with quality adjustments
- Multi-level approval workflows
- Payment status tracking and audit trails
- Export capabilities for accounting systems

### 4.4 Key Business Workflows

#### 4.4.1 Work Assignment Process

**Traditional Assignment (Supervisor-Driven)**:
```
WIP Import → Bundle Creation → Operator Selection → Assignment → 
Work Execution → Progress Tracking → Completion → Quality Review → 
Earnings Calculation → Payment Approval
```

**Self-Assignment Workflow (Operator-Driven)**:
```
Browse Available Work → AI Recommendations → Work Selection → 
Request Submission → Supervisor Review → Approval/Rejection → 
Work Execution → [Same as traditional from here]
```

#### 4.4.2 Quality Management Process
```
Issue Detection → Photo Documentation → Categorization → 
Severity Assessment → Supervisor Notification → Investigation → 
Root Cause Analysis → Resolution Implementation → 
Process Improvement → Verification
```

#### 4.4.3 Earnings and Payroll Process
```
Work Completion → Quality Verification → Base Rate Calculation → 
Quality Bonus/Penalty Application → Efficiency Bonus Calculation → 
Supervisor Approval → Management Authorization → Payment Processing → 
Status Updates → Audit Trail Recording
```

---

## 5. Authentication and Authorization

### 5.1 Authentication System Architecture

#### Authentication Context (`/src/context/AuthContext.jsx`)
**Features**:
- Firebase Authentication integration with local session persistence
- Multi-source user data loading (Firestore with cache fallback)
- Session management with configurable expiration (24 hours / 30 days)
- Activity logging and audit trail integration
- Auto-logout on inactivity (8 hours)

#### Authentication Flow
```javascript
// Login Process
1. Username/password validation against Firestore user records
2. Password verification (default: 'password123' or user-specific)
3. User status validation (active/inactive check)
4. Session creation and localStorage persistence
5. Firebase user document updates (lastLogin, loginCount)
6. Activity logging for audit trail
7. Context state updates and UI redirection

// Session Restoration
1. Check localStorage for saved session on app initialization
2. Validate session age and remember-me preferences
3. Refresh user data from Firestore
4. Update last activity timestamp
5. Restore authentication context
```

### 5.2 Role-Based Access Control (RBAC)

#### Permission System (`/src/services/permissions-service.js`)
**Granular Permission Structure**:
```javascript
PERMISSIONS = {
  // Dashboard and Analytics
  DASHBOARD_VIEW, DASHBOARD_ANALYTICS, ANALYTICS_VIEW, ANALYTICS_ADVANCED,
  
  // Work Management
  WORK_ASSIGN, WORK_VIEW_ALL, WORK_VIEW_OWN, WORK_COMPLETE, WORK_CANCEL,
  
  // User Management
  USER_CREATE, USER_EDIT, USER_DELETE, USER_VIEW_ALL, USER_MANAGE_ROLES,
  
  // Production and Quality
  PRODUCTION_VIEW, PRODUCTION_EDIT, PRODUCTION_REPORTS,
  QUALITY_VIEW, QUALITY_REPORT, QUALITY_APPROVE,
  
  // System Administration
  SETTINGS_VIEW, SETTINGS_EDIT, SETTINGS_SYSTEM,
  PAYROLL_VIEW, PAYROLL_EDIT, PAYROLL_APPROVE,
  MACHINE_VIEW, MACHINE_EDIT, MACHINE_MAINTENANCE
}
```

#### Role Permission Matrix
```javascript
// Hierarchical permission inheritance
operator: [DASHBOARD_VIEW, WORK_VIEW_OWN, WORK_COMPLETE, QUALITY_REPORT]

supervisor: [
  ...operatorPermissions,
  WORK_ASSIGN, WORK_VIEW_ALL, USER_CREATE, USER_EDIT, 
  WIP_IMPORT, QUALITY_APPROVE
]

management: [
  ...supervisorPermissions,
  SETTINGS_EDIT, ANALYTICS_ADVANCED, PAYROLL_APPROVE,
  USER_MANAGE_ROLES, MACHINE_MAINTENANCE
]
```

#### Permission Context (`/src/context/PermissionsContext.jsx`)
**Advanced Permission Checking**:
- `hasPermission(permission)`: Single permission validation
- `hasAnyPermission(permissions)`: OR-based permission checking
- `hasAllPermissions(permissions)`: AND-based permission checking
- `canAccessView(viewName)`: Route-level access control
- `filterByPermissions(items)`: Data filtering based on permissions

### 5.3 Security Implementation

#### Component-Level Security
```javascript
// Permission Gates for conditional rendering
<PermissionGate permission={PERMISSIONS.WORK_ASSIGN}>
  <WorkAssignmentInterface />
</PermissionGate>

// Higher-order component wrapping
const SecureComponent = withPermissions(Component, [PERMISSIONS.USER_EDIT]);

// View-level access control
const canAccessAnalytics = canAccessView(user, 'analytics');
```

#### Data Access Security
- **Role-based data filtering**: Users only see data relevant to their role
- **Firebase security rules**: Server-side access control
- **Session validation**: Automatic session expiration and cleanup
- **Activity monitoring**: Comprehensive audit logging

---

## 6. Services and API Integrations

### 6.1 Service Architecture Overview

#### Service Registry Pattern (`/src/services/ServiceRegistry.js`)
**Features**:
- Singleton management with lazy initialization
- Dependency injection for service resolution
- Performance monitoring middleware
- Health check integration
- Cross-cutting concern injection (logging, caching, error handling)

```javascript
// Service registration and middleware
serviceRegistry.register('cacheService', CacheService);
serviceRegistry.use(performanceMonitoringMiddleware);
serviceRegistry.use(errorHandlingMiddleware);
```

#### Base Service Template (`/src/services/base/BaseService.js`)
**Template Method Pattern**:
- Standardized CRUD operations with Firebase Firestore
- Automatic timestamp management (createdAt, updatedAt)
- Pagination support with cursor-based navigation
- Batch operation capabilities
- Transaction support for atomic operations
- Comprehensive error handling with retry mechanisms

### 6.2 Firebase Integration Services

#### Firebase Base Service (`/src/services/core/firebase-base.js`)
**Dual Database Strategy**:
- **Firestore**: Structured data, offline support, complex queries
- **Realtime Database**: Live updates, ephemeral data, presence detection

**Query Builder**:
```javascript
// Fluent API for complex queries
queryBuilder
  .collection('bundles')
  .where('status', '==', 'pending')
  .where('machineType', '==', 'overlock')
  .orderBy('priority', 'desc')
  .limit(20)
  .execute();
```

#### Realtime Database Integration
**Live Data Paths**:
```javascript
RT_PATHS = {
  OPERATOR_STATUS: 'operator_status',     // Live operator states
  WORK_PROGRESS: 'work_progress',         // Real-time work tracking  
  STATION_STATUS: 'station_status',       // Machine monitoring
  LIVE_METRICS: 'live_metrics',          // Production counters
  NOTIFICATIONS: 'notifications'          // Real-time alerts
}
```

### 6.3 Business Logic Services

#### Bundle Service (`/src/services/business/bundle-service.js`)
**Responsibilities**:
- Work item lifecycle management with status tracking
- Priority-based sorting algorithms
- Machine compatibility validation
- WIP data integration and transformation
- Fallback data strategies for offline operation

#### Work Assignment Service (`/src/services/WorkAssignmentService.js`)
**Atomic Operations with Race Condition Protection**:
```javascript
// Prevents concurrent assignment conflicts
await runTransaction(workRef, (currentData) => {
  if (currentData.assigned) return; // Abort if already assigned
  return { 
    ...currentData, 
    assigned: true, 
    assignedTo: operatorId,
    assignedAt: serverTimestamp()
  };
});
```

#### Business Logic Service (`/src/services/BusinessLogicService.js`)
**Advanced Algorithms**:
```javascript
// Quality-based earnings calculation
calculateEarnings(baseRate, pieces, quality, duration, expected) {
  let earnings = baseRate * pieces;
  
  // Quality bonus/penalty
  if (quality >= 98) earnings *= 1.1;      // 10% bonus
  else if (quality < 90) earnings *= 0.9;  // 10% penalty
  
  // Efficiency bonus
  if (duration < expected * 0.8) earnings *= 1.15; // 15% bonus
  
  return earnings;
}
```

### 6.4 Caching and Performance Services

#### Cache Service (`/src/services/CacheService.js`)
**Multi-level Caching Strategy**:
- Memory caching with configurable TTL (5 minutes default)
- Subscriber notification system for cache updates
- Network timeout protection (3 seconds)
- Cache statistics and monitoring
- Hierarchical cache invalidation

**Cache Architecture**:
```javascript
// Layered cache structure
cache.set('operators', operatorData);
cache.set('bundles', bundleData);
cache.set('all_users', [...operators, ...supervisors, ...management]);

// Subscriber notifications
cache.subscribe('operators', (data) => {
  updateOperatorUI(data);
});
```

#### Architecture Service (`/src/services/ArchitectureService.js`)
**Circuit Breaker Pattern**:
- Service health monitoring with failure threshold (5 failures)
- Automatic circuit opening with timeout (30 seconds)
- Exponential backoff retry logic (1s, 2s, 4s, 8s)
- Multi-level fallback strategies (primary → cache → mock data)

**Circuit States**:
- **Closed**: Normal operation, monitoring failures
- **Open**: Service blocked, returning cached/mock data
- **Half-Open**: Testing service recovery with limited requests

### 6.5 Real-time Services

#### Hybrid Data Service (`/src/services/HybridDataService.js`)
**Optimal Data Source Selection**:
```javascript
// Smart data source routing
getOperatorData(operatorId) {
  return {
    profile: await firestore.getOperator(operatorId),      // Cached
    liveStatus: await realtimeDB.getStatus(operatorId),    // Live
    workProgress: await realtimeDB.getProgress(operatorId) // Live
  };
}
```

#### Realtime Subscription Manager (`/src/services/RealtimeSubscriptionManager.js`)
**Features**:
- Centralized subscription lifecycle management
- Automatic store synchronization
- Error handling with automatic reconnection
- Subscription grouping and batch operations
- Memory leak prevention with cleanup

### 6.6 Error Handling and Monitoring

#### Error Handling Service (`/src/services/ErrorHandlingService.js`)
**Comprehensive Error Management**:
```javascript
// Severity-based error classification
SEVERITY: {
  LOW: 'low',           // General errors, silent logging
  MEDIUM: 'medium',     // Business logic errors, user notification
  HIGH: 'high',         // Network/auth errors, circuit breaker
  CRITICAL: 'critical'  // System failures, force re-authentication
}

// Multi-language error messages
getErrorMessage(error, language) {
  const messages = {
    'auth/invalid-credential': {
      en: 'Invalid username or password',
      np: 'गलत प्रयोगकर्ता नाम वा पासवर्ड'
    }
  };
}
```

#### Performance Monitor (`/src/utils/performanceMonitor.js`)
**Comprehensive Performance Tracking**:
- Core Web Vitals monitoring (FCP, LCP, FID, CLS)
- Long task detection (>50ms)
- Memory usage monitoring with leak detection
- API call performance with timeout detection
- Component render timing analysis

---

## 7. UI/UX Components and Design System

### 7.1 Component Architecture

#### Core UI Library (`/src/core/components/ui/`)
**Centralized Component System**:
- **Button**: Comprehensive button variants with accessibility
- **StatusBadge**: Semantic status indicators with color coding
- **Loader**: Multiple loader variants for different contexts
- **Forms**: Standardized form controls with validation

#### Component Hierarchy
```
Core UI Components (Reusable primitives)
├── Role-specific Components
│   ├── Operator Components (Production floor interfaces)
│   ├── Supervisor Components (Management tools)
│   └── Management Components (Analytics dashboards)
└── Common Components (Shared business logic)
    ├── ProcessFlowChart
    ├── WorkAssignmentSystem
    └── Quality Reporting
```

### 7.2 Design System

#### Tailwind CSS Configuration
```javascript
// Extended theme configuration
theme: {
  extend: {
    colors: {
      primary: { /* 50-900 scale */ },
      success: { /* 50-900 scale */ },
      warning: { /* 50-900 scale */ },
      danger: { /* 50-900 scale */ }
    },
    fontFamily: {
      nepali: ["Noto Sans Devanagari", "Arial Unicode MS"],
      sans: ["Inter", "Noto Sans", "sans-serif"]
    },
    animation: {
      "fade-in": "fadeIn 0.5s ease-in-out",
      "slide-up": "slideUp 0.3s ease-out",
      "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite"
    }
  }
}
```

#### Button System Design
**Comprehensive Button Variants**:
- **Types**: primary, secondary, success, danger, warning, info
- **Styles**: solid, outline, ghost
- **Sizes**: xs, sm, md, lg, xl
- **States**: loading, disabled, with icons (left/right)
- **Specialized**: BackButton with navigation, LogoutButton with profile

### 7.3 Mobile-First and PWA Design

#### Production Floor Optimizations
```css
/* Touch-friendly interface */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}

/* High contrast mode for industrial environments */
.high-contrast {
  filter: contrast(1.2);
}

/* Responsive breakpoints optimized for tablets */
screens: {
  xs: "375px",   /* Mobile phones */
  sm: "640px",   /* Large phones */
  md: "768px",   /* Tablets */
  lg: "1024px",  /* Small desktops */
  xl: "1280px"   /* Large desktops */
}
```

#### PWA Features
- **Offline Support**: Service worker with cache-first strategy
- **App Shortcuts**: Quick access to role-specific dashboards
- **File Handling**: Support for JSON, CSV, Excel imports
- **Installation**: Native app-like installation prompts

### 7.4 Multi-language (i18n) Support

#### Comprehensive Bilingual Implementation
```javascript
// Context-aware translations (200+ terms)
const translations = {
  // Authentication & Navigation
  'login': { en: 'Login', np: 'लगिन' },
  'dashboard': { en: 'Dashboard', np: 'ड्यासबोर्ड' },
  
  // Production Terms
  'efficiency': { en: 'Efficiency', np: 'दक्षता' },
  'quality_score': { en: 'Quality Score', np: 'गुणस्तर अंक' },
  
  // Work Management
  'work_assignment': { en: 'Work Assignment', np: 'काम बाँडफाँड' },
  'bundle_completed': { en: 'Bundle Completed', np: 'बन्डल सम्पन्न' }
};
```

#### Nepali Date Integration
- **BS/AD Calendar Conversion**: Accurate date transformations
- **Localized Date Picker**: Native Nepali calendar interface
- **Format Consistency**: Standardized date formats across components
- **Error Handling**: Graceful fallback for invalid dates

### 7.5 Data Visualization Components

#### Chart System (Recharts Integration)
**Production Analytics Charts**:
- **LineChart**: Production trends and efficiency tracking over time
- **BarChart**: Operator performance comparisons
- **PieChart**: Work distribution and completion status
- **Area Chart**: Cumulative production metrics

#### Custom Interactive Components
```javascript
// ProcessFlowChart - Interactive workflow visualization
Features:
- Step-by-step production process display
- Status-based color coding (pending, active, completed, blocked)
- Progress indicators with percentage completion
- Operator assignment indicators
- Real-time status updates
- Click-to-expand detail views
```

### 7.6 Loading States and User Feedback

#### Comprehensive Loader System
```javascript
// Multiple loader variants for different contexts
- FullScreenLoader: App initialization with branding
- ProgressLoader: File processing with progress tracking
- CompactLoader: Component-level loading states
- MiniLoader: Inline operation indicators
- SimpleLoader: Basic operation feedback

// Specialized presets
- BrandedLoader: Company logo with animated particles
- ProgressRingLoader: Circular progress with percentage
- PulseLoader: Subtle activity indicator
```

#### Error Handling UI
- **Error Boundaries**: Graceful component failure handling
- **Bilingual Error Messages**: Nepali for operators, English for management
- **Recovery Actions**: Reload functionality and fallback options
- **Development Mode**: Detailed error information for debugging

### 7.7 Accessibility and Inclusive Design

#### Production Environment Accessibility
- **Large Touch Targets**: Minimum 44px for gloved hands
- **High Contrast Options**: Enhanced visibility in industrial lighting
- **Focus Management**: Clear keyboard navigation paths
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **Multi-sensory Feedback**: Visual, audio, and haptic notifications

#### Universal Design Principles
- **Color Accessibility**: High contrast ratios and colorblind-friendly palettes
- **Typography**: Readable fonts with appropriate sizing
- **Navigation**: Intuitive information architecture
- **Error Prevention**: Clear validation and confirmation patterns

---

## 8. Technical Specifications

### 8.1 Development Environment

#### System Requirements
- **Node.js**: ≥16.0.0
- **NPM**: ≥8.0.0
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+

#### Development Dependencies
```json
{
  "@tailwindcss/forms": "^0.5.3",
  "@tailwindcss/typography": "^0.5.9",
  "autoprefixer": "^10.4.21",
  "eslint": "^8.57.1",
  "postcss": "^8.5.6",
  "prettier": "^2.8.8",
  "tailwindcss": "^3.4.17"
}
```

#### Build Configuration
- **React Scripts 5.0.1**: Development and build tooling
- **Service Worker**: Custom build process for PWA features
- **Environment Variables**: Multi-environment configuration support
- **Code Splitting**: Automatic route-based code splitting

### 8.2 Performance Specifications

#### Core Web Vitals Targets
- **First Contentful Paint (FCP)**: <1.8s
- **Largest Contentful Paint (LCP)**: <2.5s
- **First Input Delay (FID)**: <100ms
- **Cumulative Layout Shift (CLS)**: <0.1

#### Performance Optimizations
- **Bundle Size**: Main bundle <500KB compressed
- **Image Optimization**: WebP format with fallbacks
- **Code Splitting**: Route-based and component-based splitting
- **Caching Strategy**: 5-minute cache for operational data

#### Memory Management
- **Memory Leak Prevention**: Automatic subscription cleanup
- **Cache Management**: TTL-based automatic cleanup
- **Component Optimization**: Memoization for expensive operations

### 8.3 PWA Specifications

#### Service Worker Configuration
```javascript
// Caching strategies
- Static assets: Cache-first with versioning
- API calls: Network-first with cache fallback
- Images: Cache-first with size limits
- User data: Network-first for freshness

// Background sync capabilities
- Work completion submission
- Quality report submission
- Offline earnings calculation
```

#### Web App Manifest
```json
{
  "name": "TSA Production Management System",
  "short_name": "TSA Production",
  "description": "Garment ERP Production Management",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#3B82F6",
  "background_color": "#FFFFFF",
  "categories": ["business", "productivity", "utilities"],
  "shortcuts": [
    {
      "name": "Operator Dashboard",
      "url": "/operator",
      "icons": [{"src": "/icons/operator-192.png", "sizes": "192x192"}]
    }
  ]
}
```

### 8.4 Security Specifications

#### Authentication Security
- **Session Management**: 24-hour expiration, 30-day remember-me option
- **Password Requirements**: Configurable complexity rules
- **Activity Logging**: Comprehensive audit trail
- **Auto-logout**: 8-hour inactivity timeout

#### Data Security
- **Firebase Security Rules**: Role-based data access control
- **Input Validation**: Comprehensive client and server-side validation
- **Error Sanitization**: No sensitive data in error messages
- **Local Storage**: Minimal persistence with secure cleanup

### 8.5 Scalability Specifications

#### Concurrent User Support
- **Target Load**: 100+ concurrent users
- **Firebase Quotas**: Read/write limits monitoring
- **Connection Pooling**: Shared Firebase connections
- **Load Balancing**: Netlify CDN distribution

#### Data Volume Handling
- **Pagination**: 20-50 items per page default
- **Large Dataset Support**: Virtual scrolling for tables
- **Query Optimization**: Indexed queries with efficient filtering
- **Batch Operations**: Bulk operations for efficiency

---

## 9. Development Guidelines

### 9.1 Code Organization

#### Project Structure
```
src/
├── components/          # UI components organized by role
│   ├── operator/       # Operator-specific components
│   ├── supervisor/     # Supervisor interface components
│   ├── management/     # Management dashboard components
│   ├── admin/          # Admin system components
│   ├── common/         # Shared components
│   └── auth/           # Authentication components
├── context/            # React context providers
├── services/           # Business logic and API services
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── constants/          # Application constants
├── config/             # Configuration files
├── core/               # Core UI components and utilities
└── styles/             # Global styles and themes
```

#### Naming Conventions
- **Components**: PascalCase (e.g., `OperatorDashboard.jsx`)
- **Services**: PascalCase with Service suffix (e.g., `BundleService.js`)
- **Utilities**: camelCase (e.g., `dateHelpers.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `USER_ROLES.js`)
- **Context**: PascalCase with Context suffix (e.g., `AuthContext.jsx`)

### 9.2 Development Practices

#### React Component Guidelines
```javascript
// Functional components with hooks
const ComponentName = ({ prop1, prop2 }) => {
  // Custom hooks first
  const { user } = useAuth();
  const { t } = useLanguage();
  
  // State hooks
  const [loading, setLoading] = useState(false);
  
  // Effect hooks
  useEffect(() => {
    // Cleanup function when necessary
    return () => cleanup();
  }, [dependencies]);
  
  // Event handlers
  const handleAction = useCallback(() => {
    // Handler logic
  }, [dependencies]);
  
  return (
    <div className="component-wrapper">
      {/* JSX content */}
    </div>
  );
};
```

#### Service Development Pattern
```javascript
// Service class with error handling
export class ServiceName {
  constructor() {
    this.baseService = new BaseService('collection_name');
  }
  
  async methodName(params) {
    try {
      // Validation
      if (!params.required) {
        throw new Error('Required parameter missing');
      }
      
      // Business logic
      const result = await this.baseService.query(params);
      
      // Return standardized response
      return { success: true, data: result };
    } catch (error) {
      // Error logging
      console.error('ServiceName.methodName error:', error);
      
      // Return error response
      return { success: false, error: error.message };
    }
  }
}
```

### 9.3 State Management Guidelines

#### Context Usage Patterns
- **AuthContext**: User authentication and session management
- **LanguageContext**: Multi-language support and translations
- **NotificationContext**: Real-time alerts and user messaging
- **SystemContext**: Application-wide settings and configuration

#### Local State Management
- Use `useState` for component-specific state
- Use `useReducer` for complex state logic
- Use `useContext` for cross-component state sharing
- Use Zustand for global application state when Context is insufficient

### 9.4 Error Handling Guidelines

#### Error Boundary Implementation
```javascript
// Comprehensive error boundary with logging
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    // Send to external error tracking
    // errorTrackingService.logError(error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

#### Service Error Handling
```javascript
// Standardized error handling pattern
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  // Log error with context
  console.error('Operation failed:', {
    operation: 'operationName',
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  // Return user-friendly error
  return {
    success: false,
    error: getUserFriendlyError(error),
    code: error.code
  };
}
```

### 9.5 Testing Guidelines

#### Component Testing Strategy
```javascript
// React Testing Library approach
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../context/AuthContext';

describe('ComponentName', () => {
  const renderWithAuth = (component) => {
    return render(
      <AuthProvider>{component}</AuthProvider>
    );
  };
  
  test('should handle user interaction correctly', async () => {
    renderWithAuth(<ComponentName />);
    
    const button = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
    });
  });
});
```

#### Service Testing
```javascript
// Service unit testing
describe('ServiceName', () => {
  let service;
  
  beforeEach(() => {
    service = new ServiceName();
  });
  
  test('should handle successful operation', async () => {
    const result = await service.methodName(validParams);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
  
  test('should handle error conditions', async () => {
    const result = await service.methodName(invalidParams);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

---

## 10. Deployment Instructions

### 10.1 Build Configuration

#### Environment Setup
```bash
# Install dependencies
npm install

# Environment variables setup (.env files)
REACT_APP_ENVIRONMENT=production
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_DEBUG=false
```

#### Build Commands
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build && npm run build-sw",
    "build-sw": "node scripts/build-sw.js",
    "build:dev": "REACT_APP_ENVIRONMENT=development npm run build",
    "build:staging": "REACT_APP_ENVIRONMENT=staging npm run build",
    "build:prod": "REACT_APP_ENVIRONMENT=production npm run build"
  }
}
```

### 10.2 Firebase Configuration

#### Firestore Setup
```javascript
// Security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User collections with role-based access
    match /operators/{operatorId} {
      allow read, write: if request.auth != null 
        && (resource.data.id == request.auth.uid 
        || hasRole(request.auth.uid, ['supervisor', 'management']));
    }
    
    // Work data access control
    match /bundles/{bundleId} {
      allow read: if request.auth != null;
      allow write: if hasRole(request.auth.uid, ['supervisor', 'management']);
    }
  }
}
```

#### Firebase Functions Deployment
```bash
# Deploy functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy full Firebase project
firebase deploy
```

### 10.3 Netlify Deployment

#### Netlify Configuration (`netlify.toml`)
```toml
[build]
  publish = "build"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "16"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  directory = "netlify/functions"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "max-age=31536000"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "max-age=86400"
```

#### Deployment Commands
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

### 10.4 Environment-Specific Configurations

#### Development Environment
```javascript
// Development-specific features
- Debug logging enabled
- Mock data fallbacks
- Hot reloading
- Source maps
- Development tools integration
```

#### Staging Environment
```javascript
// Staging configuration
- Production build with debug info
- Limited dataset
- Testing integrations
- Performance monitoring
```

#### Production Environment
```javascript
// Production optimizations
- Minified assets
- Service worker enabled
- Error tracking
- Analytics integration
- Performance monitoring
```

### 10.5 Monitoring and Analytics

#### Performance Monitoring
```javascript
// Core Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

#### Error Tracking
```javascript
// Error logging service integration
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  // Send to error tracking service
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Send to error tracking service
});
```

### 10.6 Maintenance and Updates

#### Update Strategy
1. **Dependency Updates**: Regular security and feature updates
2. **Firebase SDK Updates**: Maintain compatibility with latest Firebase features
3. **React Updates**: Stay current with React ecosystem improvements
4. **PWA Updates**: Service worker versioning and cache invalidation

#### Backup and Recovery
- **Database Backups**: Automated Firestore exports
- **Code Repository**: Git-based version control with branching strategy
- **Configuration Backup**: Environment variable and configuration management
- **Disaster Recovery**: Multi-region deployment capabilities

---

## Conclusion

This comprehensive documentation provides a complete overview of the Garment ERP PWA system, covering all aspects from architecture and data models to deployment and maintenance. The system demonstrates enterprise-grade patterns and practices suitable for production manufacturing environments with modern web technologies, real-time capabilities, and comprehensive user experience design.

For additional information or clarification on any aspect of the system, please refer to the specific component documentation within the codebase or contact the development team.