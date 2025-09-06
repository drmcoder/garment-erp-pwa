# Complete API Specifications and Service Architecture - Garment ERP PWA

## 1. Firebase Service Endpoints

### 1.1 Firestore Collections Structure

```javascript
// Collection Names
const COLLECTIONS = {
  OPERATORS: "operators",
  SUPERVISORS: "supervisors", 
  MANAGEMENT: "management",
  BUNDLES: "bundles",
  WORK_ASSIGNMENTS: "workAssignments",
  WORK_ITEMS: "workItems",
  WORK_COMPLETIONS: "workCompletions",
  WIP_ENTRIES: "wipEntries",
  WIP_ROLLS: "wipRolls",
  ASSIGNMENT_HISTORY: "assignmentHistory",
  QUALITY_ISSUES: "qualityIssues",
  NOTIFICATIONS: "notifications",
  DAILY_REPORTS: "dailyReports",
  PRODUCTION_STATS: "productionStats",
  EFFICIENCY_LOGS: "efficiencyLogs",
  SIZE_CONFIGS: "sizeConfigs",
  MACHINE_CONFIGS: "machineConfigs",
  ARTICLE_TEMPLATES: "articleTemplates",
  DELETED_TEMPLATES: "deletedTemplates",
  SYSTEM_SETTINGS: "systemSettings",
  WAGE_RECORDS: "wageRecords",
  LINE_STATUS: "lineStatus",
  DAMAGE_REPORTS: "damage_reports",
  DAMAGE_NOTIFICATIONS: "damage_notifications",
  OPERATOR_WALLETS: "operatorWallets"
};
```

### 1.2 Firebase Configuration
```javascript
// Firebase Project Details
const firebaseConfig = {
  apiKey: "AIzaSyB9bMIY2KA3-N2rOvidXoyzVeWWJwPuC4M",
  authDomain: "code-for-erp.firebaseapp.com",
  projectId: "code-for-erp",
  storageBucket: "code-for-erp.firebasestorage.app",
  messagingSenderId: "490842962773",
  appId: "1:490842962773:web:b2a5688d22416ebc710ddc"
};
```

### 1.3 Firebase Realtime Database Structure
```javascript
// Realtime Database Paths
const RT_PATHS = {
  OPERATOR_STATUS: 'operator_status',      // Live operator status
  WORK_PROGRESS: 'work_progress',          // Current work progress
  STATION_STATUS: 'station_status',        // Station monitoring
  LIVE_METRICS: 'live_metrics',            // Live counters/metrics
  NOTIFICATIONS: 'notifications',          // Real-time notifications
  SYSTEM_HEALTH: 'system_health',          // System health monitoring
  ACTIVE_SESSIONS: 'active_sessions'       // Active user sessions
};
```

## 2. Service Layer APIs

### 2.1 Core Firebase Services

#### FirebaseService API
```javascript
class FirebaseService {
  // Generic CRUD Operations
  static async create(collectionName, data)
  static async getById(collectionName, id)
  static async update(collectionName, id, data)
  static async delete(collectionName, id)
  static async getAll(collectionName, orderByField?, orderDirection?, limitCount?)
  static async getWhere(collectionName, field, operator, value, orderByField?, limitCount?)
}
```

**Request/Response Format:**
```javascript
// Standard Response Format
{
  success: boolean,
  data?: any,
  error?: string,
  id?: string
}
```

#### BundleService API
```javascript
class BundleService {
  static async getAllBundles()
  static async getBundleById(id)
  static async createBundle(bundleData)
  static async updateBundle(id, bundleData)
  static async getOperatorBundles(operatorId)
  static async getSelfAssignedBundles()
  static async approveSelfAssignment(bundleId, supervisorId)
  static async rejectSelfAssignment(bundleId, supervisorId, reason)
}
```

#### WorkItemService API
```javascript
class WorkItemService {
  static async getAllWorkItems()
  static async getWorkItemById(id)
  static async createWorkItem(workItemData)
  static async updateWorkItem(id, workItemData)
  static async getOperatorWorkItems(operatorId)
  static async getSelfAssignedWorkItems()
  static async approveSelfAssignment(workItemId, supervisorId)
  static async rejectSelfAssignment(workItemId, supervisorId, reason)
}
```

#### OperatorService API
```javascript
class OperatorService {
  static async getAllOperators()
  static async getOperatorById(id)
  static async updateOperator(id, operatorData)
}
```

#### EarningsService API
```javascript
class EarningsService {
  static async recordEarnings(earningsData)
  static async getOperatorEarnings(operatorId, startDate, endDate)
}
```

### 2.2 Authentication Service

#### AuthService API
```javascript
class AuthService {
  static async login(username, password)
  static async logout(userId?)
  static async findUser(username)
  static async getUserById(userId, role)
  static async updateUserProfile(userId, role, updateData)
  static async changePassword(userId, role, currentPassword, newPassword)
  static async getUsersByRole(role)
  static hasPermission(user, permission)
  static async validateSession(userId, role)
}
```

**Authentication Flow:**
```javascript
// Login Request
{
  username: string,
  password: string,
  rememberMe?: boolean
}

// Login Response
{
  success: boolean,
  user?: {
    id: string,
    username: string,
    name: string,
    role: string,
    permissions: string[],
    // ... other user fields
  },
  error?: string
}
```

### 2.3 Work Assignment Service

#### WorkAssignmentService API (Real-time)
```javascript
class WorkAssignmentService {
  static async atomicSelfAssign(workId, operatorId, operatorInfo)
  static async updateOperatorAssignment(operatorId, workId, workData)
  static async releaseWork(workId, operatorId)
  static subscribeToAvailableWork(callback)
  static async testRaceCondition(workId, operatorIds)
}
```

**Atomic Self-Assignment Flow:**
```javascript
// Request
{
  workId: string,
  operatorId: string,
  operatorInfo: {
    name: string,
    machineType: string
  }
}

// Response
{
  success: boolean,
  workData?: any,
  message: string,
  error?: string
}
```

### 2.4 Operator Wallet Service

#### OperatorWalletService API
```javascript
class OperatorWalletService {
  async getWalletBalance(operatorId)
  async getHeldBundlesDetails(operatorId)
  async getWageHistory(operatorId, limitCount?)
  subscribeToWallet(operatorId, callback)
  async getEarningSummary(operatorId, dateRange?)
}
```

**Wallet Balance Response:**
```javascript
{
  success: boolean,
  wallet: {
    operatorId: string,
    availableAmount: number,
    heldAmount: number,
    totalEarned: number,
    heldBundles: string[],
    canWithdraw: boolean,
    lastUpdated: Date
  }
}
```

### 2.5 Damage Report Service

#### DamageReportService API
```javascript
class DamageReportService {
  async submitDamageReport(reportData)
  async getSupervisorDamageQueue(supervisorId, statusFilter?)
  async getOperatorDamageReports(operatorId, limitCount?)
  async startRework(reportId, supervisorData)
  async completeRework(reportId, completionData)
  async returnToOperator(reportId, supervisorData)
  async markFinalCompletion(reportId, operatorId, completionData?)
  async releaseBundlePayment(bundleId, operatorId, releaseData?)
  async createDamageNotification(notificationData)
  async getUserNotifications(userId, unreadOnly?)
  async markNotificationRead(notificationId)
  subscribeSupervisorQueue(supervisorId, callback)
  subscribeOperatorNotifications(operatorId, callback)
  async getPendingReworkPieces(operatorId)
  async getDamageAnalytics(startDate, endDate, filters?)
}
```

**Damage Report Schema:**
```javascript
{
  reportId: string,
  bundleId: string,
  bundleNumber: string,
  operatorId: string,
  operatorName: string,
  supervisorId: string,
  damageType: string,
  pieceNumbers: number[],
  pieceCount: number,
  severity: 'minor' | 'major' | 'severe',
  urgency: 'low' | 'normal' | 'high' | 'urgent',
  status: string, // See DAMAGE_STATUS enum
  reportedAt: timestamp,
  reworkDetails: {
    supervisorNotes: string,
    partsReplaced: string[],
    timeSpentMinutes: number,
    qualityCheckPassed: boolean,
    costEstimate: number
  },
  paymentImpact: {
    operatorAtFault: boolean,
    paymentAdjustment: number,
    adjustmentReason: string,
    supervisorCompensation: number
  }
}
```

### 2.6 Data Service (Centralized)

#### DataService API
```javascript
class DataService {
  async fetchCollection(collectionName, options?)
  async createDocument(collectionName, data, options?)
  async updateDocument(collectionName, docId, updates, options?)
  async deleteDocument(collectionName, docId, options?)
  async getAllUsers(options?)
  async getAllBundles(options?)
  async getWorkAssignments(options?)
  async getWorkCompletions(options?)
  async getActiveAssignments(operatorId?)
  async getOperatorStats(operatorId, dateRange?)
  async getProductionStats(dateRange?)
  async batchCreate(collectionName, documents, options?)
  async batchUpdate(collectionName, updates, options?)
  invalidateCache(pattern?)
  getCacheStats()
  subscribeToCollection(collectionName, callback, options?)
}
```

### 2.7 Cache Service

#### CacheService API
```javascript
class CacheService {
  getCacheKey(collection, query?)
  isCacheValid(key)
  getCached(key)
  setCache(key, data)
  subscribe(key, callback)
  clearCache(key)
  clearAllCache()
  async getCollection(collectionName, useCache?)
  async getAllUsers(useCache?)
  async getOperators(useCache?)
  async getSupervisors(useCache?)
  async getManagement(useCache?)
  async getArticleTemplates(useCache?)
  async getMachineConfigs(useCache?)
  async refreshCollection(collectionName)
  getCacheStats()
}
```

### 2.8 Business Logic Service

#### BusinessLogicService API
```javascript
class BusinessLogicService {
  static async canAssignWork(operatorId, workData)
  static calculateEarnings(workData, completionData)
  static calculateProductionEfficiency(completions, timeFrame?)
  static analyzeQuality(completions, threshold?)
  static balanceWorkload(operators, workItems)
  static async resolveDependencies(bundleId)
  static async generateProductionReport(dateRange, operators?)
  static async sendWorkflowNotifications(completedWork, notificationService)
}
```

## 3. External API Integrations

### 3.1 Netlify Functions Endpoints

**Base URL:** `https://garment-erp-nepal.netlify.app/api`

#### Authentication Function (`/api/auth`)
```javascript
// POST /api/auth
{
  username: string,
  password: string,
  rememberMe?: boolean
}

// Response
{
  success: boolean,
  user?: UserObject,
  token?: string,
  error?: string
}
```

#### Production Statistics Function (`/api/production`)
```javascript
// GET /api/production/stats
// GET /api/production/efficiency
// GET /api/production/line-status
// POST /api/production/record

// Production Record Structure
{
  id: string,
  operatorId: string,
  bundleId: string,
  articleNumber: string,
  operation: string,
  machineType: string,
  piecesCompleted: number,
  timeSpent: number,
  rate: number,
  earnings: number,
  qualityScore: number,
  efficiency: number,
  shift: 'morning' | 'afternoon' | 'night',
  date: string,
  createdAt: string
}
```

#### Bundles Management Function (`/api/bundles`)
```javascript
// GET /api/bundles
// GET /api/bundles/:id
// POST /api/bundles
// PUT /api/bundles/:id
// DELETE /api/bundles/:id

// Bundle Structure
{
  id: string,
  bundleNumber: string,
  articleNumber: string,
  operation: string,
  pieces: number,
  rate: number,
  assignedOperator?: string,
  status: 'available' | 'assigned' | 'in_progress' | 'completed',
  priority: 'low' | 'normal' | 'high' | 'urgent',
  createdAt: string,
  updatedAt: string
}
```

#### Notifications Function (`/api/notifications`)
```javascript
// GET /api/notifications/:userId
// POST /api/notifications
// PUT /api/notifications/:id/read

// Notification Structure
{
  id: string,
  userId: string,
  type: string,
  title: string,
  message: string,
  read: boolean,
  priority: 'low' | 'normal' | 'high' | 'urgent',
  createdAt: string,
  expiresAt?: string
}
```

### 3.2 Google Sheets Integration (`/api/google-sheets`)

**Features:**
- Real-time data synchronization with Google Sheets
- Automatic report generation
- Data export/import functionality
- Production metrics tracking

```javascript
// Endpoints
// GET /api/google-sheets/sync
// POST /api/google-sheets/export
// GET /api/google-sheets/reports/:type
```

### 3.3 Real-time Sync Function (`/api/realtime-sync`)

**Features:**
- WebSocket-like real-time updates
- Firebase Realtime Database synchronization
- Live operator status tracking
- Production line monitoring

```javascript
// GET /api/realtime-sync/status
// POST /api/realtime-sync/update
// GET /api/realtime-sync/operators
```

## 4. Data Flow Specifications

### 4.1 Request/Response Flow Patterns

#### Standard API Flow
```
Client → Auth Middleware → Service Layer → Firebase/External API → Response Processing → Client
```

#### Real-time Data Flow
```
Firebase Realtime DB → RealtimeSubscriptionManager → Store Update → UI Refresh
```

#### Caching Flow
```
Request → Cache Check → Cache Hit: Return Data | Cache Miss: Fetch → Cache Store → Return Data
```

### 4.2 Error Handling Patterns

#### Standard Error Response
```javascript
{
  success: false,
  error: string,
  code?: string,
  details?: any
}
```

#### Error Codes
- `AUTH_FAILED`: Authentication failed
- `PERMISSION_DENIED`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Data validation failed
- `SERVER_ERROR`: Internal server error
- `NETWORK_ERROR`: Network/connectivity issue
- `RATE_LIMITED`: Too many requests

### 4.3 Real-time Data Synchronization

#### Subscription Management
```javascript
class RealtimeSubscriptionManager {
  subscribe(subscriptionId, collectionName, options)
  unsubscribe(subscriptionId)
  subscribeToUserData(userId, role)
  subscribeToSystemData()
  unsubscribeAll()
}
```

#### Real-time Updates Flow
```
Firestore Change → onSnapshot Listener → Store Update → Component Re-render
```

### 4.4 Offline/Online Data Sync

#### Cache Strategy
- **Cache First**: Check cache, fallback to network
- **Network First**: Try network, fallback to cache
- **Cache Only**: Only use cached data
- **Network Only**: Always fetch from network

#### Sync Patterns
```javascript
// Service Worker Background Sync
// Automatic retry on network restoration
// Conflict resolution for offline changes
// Progressive data loading
```

## 5. Authentication & Authorization APIs

### 5.1 Session Management

#### Session Storage
```javascript
// LocalStorage Structure
{
  tsaAuthSession: {
    userId: string,
    username: string,
    role: string,
    timestamp: number,
    rememberMe: boolean
  }
}
```

#### Session Validation
```javascript
// Auto-logout after 8 hours of inactivity
// Session refresh on user activity
// Cross-tab session synchronization
```

### 5.2 Permission System

#### Role-based Permissions
```javascript
const rolePermissions = {
  operator: ['view_own_work', 'complete_work', 'report_quality', 'self_assign_work'],
  supervisor: ['assign_work', 'view_reports', 'manage_quality', 'view_line_status', 'manage_operators'],
  management: ['all']
};
```

#### Permission Validation
```javascript
hasPermission(permission) {
  // Check user role and specific permissions
  // Return boolean result
}
```

## 6. Architecture Service (Circuit Breaker & Monitoring)

### 6.1 Circuit Breaker Pattern
```javascript
class ArchitectureService {
  executeWithCircuitBreaker(serviceName, operation, fallback?)
  fetchDataSafely(collectionName, options?)
  retryOperation(operationId, operation, maxRetries?)
  logError(error, context?)
  trackComponentRender(componentName, renderTime?)
  getHealthReport()
}
```

### 6.2 Performance Monitoring
```javascript
// Metrics Collection
{
  componentRenders: Map,
  hookExecutions: Map,
  apiCalls: Map,
  errorCounts: Map
}
```

## 7. Configuration Management

### 7.1 Environment Configuration
```javascript
const environments = {
  development: {
    apiUrl: 'http://localhost:3001/api',
    features: { logging: true, debugMode: true },
    cache: { ttl: 300000, maxSize: 50 }
  },
  staging: {
    apiUrl: 'https://staging-api.garment-erp.com/api',
    features: { logging: true, debugMode: false },
    cache: { ttl: 600000, maxSize: 100 }
  },
  production: {
    apiUrl: 'https://api.garment-erp.com/api',
    features: { logging: false, debugMode: false },
    cache: { ttl: 900000, maxSize: 200 }
  }
};
```

### 7.2 API Configuration
```javascript
{
  timeout: 15000-30000,
  retryAttempts: 3-5,
  retryDelay: 1000-3000,
  corsHeaders: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  }
}
```

## Summary

This comprehensive API documentation covers:

1. **Firebase Service Endpoints** - 18+ Firestore collections with full CRUD operations
2. **Service Layer APIs** - 10+ service classes with 100+ methods
3. **External API Integrations** - 9 Netlify Functions with REST endpoints
4. **Data Flow Specifications** - Request/response patterns, caching, real-time sync
5. **Authentication & Authorization** - Complete auth flow with JWT tokens and permissions
6. **Real-time Data Synchronization** - Firebase Realtime DB with WebSocket-like updates
7. **Cache Invalidation Strategies** - Multi-level caching with TTL and invalidation patterns
8. **Service Integration Patterns** - Circuit breaker, retry logic, and error handling
9. **Configuration Management** - Environment-based config with feature flags

The system supports both online and offline modes, provides real-time updates, implements comprehensive error handling, and includes production-ready monitoring and analytics capabilities. All APIs follow consistent request/response patterns with proper error codes and authentication mechanisms.