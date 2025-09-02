# Garment ERP PWA - API Reference

## Overview
This document provides a comprehensive reference for all APIs, services, hooks, and interfaces in the Garment ERP PWA system.

## Custom Hooks API

### useAuth()
```javascript
const { 
  user,           // Current user object
  loading,        // Authentication loading state
  error,          // Authentication error
  login,          // Login function
  logout,         // Logout function
  isAuthenticated // Boolean authentication status
} = useAuth();
```

**Returns:**
- `user: User | null` - Current authenticated user
- `loading: boolean` - Loading state during auth operations
- `error: string | null` - Authentication error message
- `login: (email: string, password: string) => Promise<AuthResult>`
- `logout: () => Promise<void>`
- `isAuthenticated: boolean` - True if user is logged in

### useWorkManagement()
```javascript
const {
  bundles,        // All work bundles
  workItems,      // All work items
  assignWork,     // Assign work function
  createBundle,   // Create bundle function
  updateStatus,   // Update work status
  loading         // Loading states
} = useWorkManagement();
```

**Returns:**
- `bundles: Bundle[]` - Array of work bundles
- `workItems: WorkItem[]` - Array of work items
- `assignWork: (operatorId: string, workData: WorkData) => Promise<Result>`
- `createBundle: (bundleData: BundleData) => Promise<Result>`
- `updateStatus: (itemId: string, status: WorkStatus) => Promise<Result>`
- `loading: LoadingState` - Loading states for different operations

### useUsers()
```javascript
const {
  allUsers,       // All system users
  operators,      // Operators only
  supervisors,    // Supervisors only
  loading,        // Loading state
  updateUser,     // Update user function
  createUser      // Create user function
} = useUsers();
```

**Returns:**
- `allUsers: User[]` - All users in system
- `operators: User[]` - Users with operator role
- `supervisors: User[]` - Users with supervisor role
- `loading: boolean` - Data loading state
- `updateUser: (userId: string, data: Partial<User>) => Promise<Result>`
- `createUser: (userData: UserData) => Promise<Result>`

### useSupervisorData()
```javascript
const {
  lineStatus,         // Line status information
  pendingApprovals,   // Self-assignment approvals
  qualityIssues,      // Quality issues to review
  workData,          // Work-related data
  loading            // Loading states
} = useSupervisorData();
```

### useAnalytics()
```javascript
const {
  analytics,         // Analytics data
  stats,            // Real-time statistics
  generateReport,   // Generate report function
  loading          // Loading state
} = useAnalytics();
```

### useNotifications()
```javascript
const {
  notifications,     // User notifications
  showNotification, // Show notification function
  markAsRead,       // Mark notification as read
  clearAll          // Clear all notifications
} = useNotifications();
```

## Firebase Services API

### WIPService
Work-in-progress management service.

#### Methods

##### `assignWork(operatorId: string, workData: WorkData): Promise<Result>`
Assigns work to an operator.

**Parameters:**
- `operatorId: string` - ID of the operator
- `workData: WorkData` - Work assignment data

```javascript
interface WorkData {
  bundleId: string;
  operation: string;
  pieces: number;
  priority: 'low' | 'medium' | 'high';
  estimatedTime?: number;
}
```

**Returns:**
```javascript
interface Result {
  success: boolean;
  data?: any;
  error?: string;
  code?: string;
}
```

##### `completeWork(workItemId: string, completionData: CompletionData): Promise<Result>`
Marks work item as completed.

**Parameters:**
- `workItemId: string` - ID of work item to complete
- `completionData: CompletionData` - Completion information

```javascript
interface CompletionData {
  actualTime: number;
  qualityScore?: number;
  notes?: string;
  completedPieces: number;
}
```

##### `getWorkItemsFromWIP(): Promise<WorkItemsResult>`
Retrieves all work items from WIP collection.

**Returns:**
```javascript
interface WorkItemsResult {
  success: boolean;
  workItems: WorkItem[];
  error?: string;
}
```

### BundleService
Bundle management service.

#### Methods

##### `createBundle(bundleData: BundleData): Promise<Result>`
Creates a new work bundle.

**Parameters:**
```javascript
interface BundleData {
  bundleNumber: string;
  articleNumber: number;
  articleName: string;
  color: string;
  quantity: number;
  priority: 'low' | 'medium' | 'high';
  machineType: string;
  operation: string;
  estimatedTime: number;
  dueDate?: Date;
}
```

##### `getAllBundles(): Promise<BundlesResult>`
Retrieves all bundles.

**Returns:**
```javascript
interface BundlesResult {
  success: boolean;
  bundles: Bundle[];
  error?: string;
}
```

##### `updateBundleStatus(bundleId: string, status: BundleStatus): Promise<Result>`
Updates bundle status.

**Parameters:**
- `bundleId: string` - Bundle ID
- `status: BundleStatus` - New status

```javascript
type BundleStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'quality_check';
```

### UserService
User management service.

#### Methods

##### `getAllUsers(): Promise<UsersResult>`
Retrieves all system users.

##### `getUsersByRole(role: UserRole): Promise<UsersResult>`
Gets users by specific role.

**Parameters:**
```javascript
type UserRole = 'operator' | 'supervisor' | 'admin' | 'management';
```

##### `updateUser(userId: string, userData: Partial<User>): Promise<Result>`
Updates user information.

##### `createUser(userData: UserCreationData): Promise<Result>`
Creates new user account.

**Parameters:**
```javascript
interface UserCreationData {
  name: string;
  nameNepali: string;
  email: string;
  role: UserRole;
  machineType?: string;
  location?: string;
  shift?: 'morning' | 'evening' | 'night';
}
```

### DamageService
Damage reporting service.

#### Methods

##### `createDamageReport(reportData: DamageReportData): Promise<Result>`
Creates damage report.

**Parameters:**
```javascript
interface DamageReportData {
  operatorId: string;
  workItemId?: string;
  damageType: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  quantity: number;
  images?: string[];
  rootCause?: string;
}
```

##### `getDamageReports(filters?: DamageFilters): Promise<DamageReportsResult>`
Retrieves damage reports with optional filters.

### QualityService
Quality control service.

#### Methods

##### `createQualityCheck(checkData: QualityCheckData): Promise<Result>`
Creates quality inspection record.

##### `getQualityMetrics(dateRange: DateRange): Promise<QualityMetricsResult>`
Gets quality metrics for date range.

### AnalyticsService
Analytics and reporting service.

#### Methods

##### `getProductionMetrics(date: string): Promise<ProductionMetricsResult>`
Gets production metrics for specific date.

##### `generateReport(reportType: ReportType, parameters: ReportParameters): Promise<ReportResult>`
Generates custom reports.

**Parameters:**
```javascript
type ReportType = 'production' | 'quality' | 'efficiency' | 'operator_performance';

interface ReportParameters {
  startDate: Date;
  endDate: Date;
  operators?: string[];
  operations?: string[];
  format?: 'json' | 'csv' | 'pdf';
}
```

## Data Types and Interfaces

### Core Entities

#### User
```javascript
interface User {
  id: string;
  name: string;
  nameNepali: string;
  email: string;
  role: 'operator' | 'supervisor' | 'admin' | 'management';
  status: 'available' | 'working' | 'break' | 'offline';
  machineType: string;
  machineTypes: string[];
  currentWorkload: number;
  maxWorkload: number;
  currentEfficiency: number;
  qualityScore: number;
  profileColor: string;
  location: string;
  shift: 'morning' | 'evening' | 'night';
  dailyProduction: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Bundle
```javascript
interface Bundle {
  id: string;
  bundleNumber: string;
  articleNumber: number;
  articleName: string;
  articleNameNepali: string;
  color: string;
  colorCode: string;
  sizes: string[];
  quantity: number;
  rate: number;
  totalValue: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'quality_check';
  priority: 'low' | 'medium' | 'high';
  machineType: string;
  currentOperation: string;
  assignedOperator: string;
  assignedLine: string;
  estimatedTime: number;
  actualTime: number;
  dueDate: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### WorkItem
```javascript
interface WorkItem {
  id: string;
  bundleId: string;
  bundleNumber: string;
  operatorId: string;
  operatorName: string;
  articleNumber: number;
  operation: string;
  pieces: number;
  machineType: string;
  status: 'assigned' | 'started' | 'paused' | 'completed' | 'quality_check';
  priority: 'low' | 'medium' | 'high';
  startTime: Date;
  endTime: Date;
  estimatedTime: number;
  actualTime: number;
  qualityScore: number;
  selfAssigned: boolean;
  selfAssignedAt: Date;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  wipEntryId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Analytics
```javascript
interface Analytics {
  date: string;
  totalProduction: number;
  targetProduction: number;
  efficiency: number;
  qualityScore: number;
  onTimeDelivery: number;
  operatorPerformance: OperatorPerformance[];
  productionTrends: ProductionTrend[];
  qualityMetrics: QualityMetric[];
  machineUtilization: MachineUtilization[];
  createdAt: Date;
  updatedAt: Date;
}

interface OperatorPerformance {
  operatorId: string;
  name: string;
  production: number;
  efficiency: number;
  quality: number;
}

interface ProductionTrend {
  hour: number;
  production: number;
  efficiency: number;
}

interface QualityMetric {
  operation: string;
  defectRate: number;
  reworkRate: number;
}

interface MachineUtilization {
  machineType: string;
  utilization: number;
  downtime: number;
}
```

#### DamageReport
```javascript
interface DamageReport {
  id: string;
  operatorId: string;
  supervisorId: string;
  articleNumber: number;
  operation: string;
  damageType: string;
  quantity: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  images: string[];
  rootCause: string;
  correctiveAction: string;
  status: 'reported' | 'investigating' | 'resolved';
  penalty: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Codes

### Authentication Errors
- `AUTH_INVALID_EMAIL` - Invalid email format
- `AUTH_INVALID_PASSWORD` - Invalid password
- `AUTH_USER_NOT_FOUND` - User not found
- `AUTH_WRONG_PASSWORD` - Incorrect password
- `AUTH_TOO_MANY_REQUESTS` - Too many login attempts

### Work Management Errors
- `WORK_OPERATOR_NOT_AVAILABLE` - Operator not available for assignment
- `WORK_WORKLOAD_EXCEEDED` - Operator workload limit exceeded
- `WORK_BUNDLE_NOT_FOUND` - Bundle not found
- `WORK_INVALID_OPERATION` - Invalid operation type
- `WORK_MACHINE_INCOMPATIBLE` - Machine type incompatible

### Quality Control Errors
- `QUALITY_INVALID_SCORE` - Invalid quality score
- `QUALITY_MISSING_DATA` - Required quality data missing
- `QUALITY_CHECK_FAILED` - Quality check validation failed

### System Errors
- `SYSTEM_DATABASE_ERROR` - Database operation failed
- `SYSTEM_NETWORK_ERROR` - Network connection error
- `SYSTEM_PERMISSION_DENIED` - Insufficient permissions
- `SYSTEM_RATE_LIMIT` - API rate limit exceeded

## Rate Limiting

### API Limits
- Work assignments: 100 requests per minute per user
- Data queries: 1000 requests per minute per user
- File uploads: 10 requests per minute per user
- Authentication: 5 requests per minute per IP

### Firestore Limits
- Writes: 1 per document per second
- Reads: No limit (billing applies)
- Queries: 1 million per day (free tier)

## Authentication

### JWT Token Structure
```javascript
{
  "iss": "https://securetoken.google.com/your-project-id",
  "aud": "your-project-id", 
  "auth_time": 1234567890,
  "user_id": "user123",
  "sub": "user123",
  "iat": 1234567890,
  "exp": 1234567890,
  "email": "user@example.com",
  "email_verified": true,
  "firebase": {
    "identities": {
      "email": ["user@example.com"]
    },
    "sign_in_provider": "password"
  }
}
```

### API Request Headers
```javascript
// Required headers for authenticated requests
{
  "Authorization": "Bearer <firebase-jwt-token>",
  "Content-Type": "application/json"
}
```

## WebSocket Events

### Real-time Subscriptions
The system uses Firebase onSnapshot for real-time updates:

```javascript
// Work items updates
onSnapshot(collection(db, 'workItems'), (snapshot) => {
  // Handle real-time work item changes
});

// User status updates  
onSnapshot(collection(db, 'users'), (snapshot) => {
  // Handle real-time user status changes
});
```

## Usage Examples

### Complete Work Assignment Flow
```javascript
import { useWorkManagement, useNotifications } from '../hooks/useAppData';

const WorkAssignmentComponent = () => {
  const { assignWork, loading } = useWorkManagement();
  const { showNotification } = useNotifications();
  
  const handleAssignment = async () => {
    try {
      const result = await assignWork('operator123', {
        bundleId: 'bundle456',
        operation: 'sewing',
        pieces: 50,
        priority: 'high',
        estimatedTime: 120
      });
      
      if (result.success) {
        showNotification('Work assigned successfully', 'success');
      } else {
        showNotification(result.error, 'error');
      }
    } catch (error) {
      showNotification('Assignment failed', 'error');
    }
  };
  
  return (
    <button 
      onClick={handleAssignment}
      disabled={loading.workItems}
    >
      {loading.workItems ? 'Assigning...' : 'Assign Work'}
    </button>
  );
};
```

### Quality Report Creation
```javascript
import { DamageService } from '../services/firebase-services';

const createDamageReport = async (reportData) => {
  try {
    const result = await DamageService.createDamageReport({
      operatorId: 'op123',
      damageType: 'fabric_tear',
      severity: 'medium',
      description: 'Small tear in sleeve area',
      quantity: 2,
      images: ['image1.jpg', 'image2.jpg']
    });
    
    if (result.success) {
      console.log('Damage report created:', result.data);
    }
  } catch (error) {
    console.error('Failed to create damage report:', error);
  }
};
```

This API reference provides comprehensive information for developers working with the Garment ERP PWA system.