# Garment ERP PWA - Complete Component Documentation

## 1. Core Component Interfaces

### 1.1 Authentication Context Interface
```typescript
interface AuthContextValue {
  // State
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isOnline: boolean;
  allUsers: User[];
  
  // Actions
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean, user?: User }>;
  logout: () => Promise<{ success: boolean }>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean, user?: User }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean }>;
  refreshUserData: () => Promise<User>;
  
  // Utilities
  hasPermission: (permission: string) => boolean;
  getUserDisplayName: () => string;
  getUserDisplayInfo: () => UserDisplayInfo;
  getUserRoleDisplay: () => string;
  getUserSpecialityDisplay: () => string;
  getAllOperators: () => User[];
  getOperatorsBySpeciality: (speciality: string) => User[];
  
  // Work-related
  updateWorkAssignment: (workData: WorkData) => Promise<User>;
  completeCurrentWork: (completionData: WorkCompletionData) => Promise<{ success: boolean, earnings: number }>;
}

interface User {
  id: string;
  name: string;
  username: string;
  role: 'operator' | 'supervisor' | 'management';
  machine?: string;
  speciality?: string;
  station?: string;
  status?: string;
  active: boolean;
  lastLogin?: string;
  loginCount?: number;
  stats?: UserStats;
  currentWork?: WorkItem;
  permissions?: string[];
}

interface UserStats {
  todayPieces: number;
  todayEarnings: number;
  weeklyPieces: number;
  weeklyEarnings: number;
  monthlyPieces: number;
  monthlyEarnings: number;
}
```

### 1.2 Language Context Interface
```typescript
interface LanguageContextValue {
  currentLanguage: 'np' | 'en';
  setCurrentLanguage: (lang: 'np' | 'en') => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  
  // Formatting utilities
  getTimeBasedGreeting: () => string;
  formatTime: (date: Date) => string;
  formatDate: (date: Date | string, format?: string) => string;
  formatDateTime: (date: Date | string, includeTime?: boolean) => string;
  formatRelativeTime: (date: Date | string) => string;
  getCurrentDate: (format?: string) => string;
  formatNumber: (num: number) => string;
  formatCurrency: (amount: number) => string;
  getSizeLabel: (articleNumber: string, size: string) => string;
  
  // Size management
  sizeUtils: SizeUtilsInterface;
  sizeConfigurations: SizeConfigurations;
  articleSizeMapping: ArticleSizeMapping;
}
```

### 1.3 Notification Context Interface
```typescript
interface NotificationContextValue {
  notifications: Notification[];
  addNotification: (notification: NotificationInput) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  
  // Specialized notifications
  showNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  sendWorkCompleted: (articleNumber: string, operation: string, pieces: number, earnings: number) => void;
  sendWorkflowNotification: (completedWork: CompletedWork, nextOperators: NextOperator[]) => void;
  sendMachineGroupNotification: (machineType: string, workData: WorkData) => void;
  showQualityNotification: (qualityData: QualityNotificationData) => void;
}

interface NotificationInput {
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'supervisor_alert';
  priority?: 'low' | 'medium' | 'high';
  duration?: number;
  data?: any;
}
```

## 2. Reusable Component Library

### 2.1 Button Component
```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline' | 'ghost' | 'back';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: (e: React.MouseEvent) => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

// Specialized Button Components
interface BackButtonProps {
  onClick: () => void;
  text?: string;
  className?: string;
}

interface LogoutButtonProps {
  className?: string;
  variant?: 'button' | 'dropdown';
}
```

### 2.2 StatusBadge Component
```typescript
interface StatusBadgeProps {
  status: string;
  type?: 'work' | 'priority' | 'custom';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}
```

### 2.3 Loader Components
```typescript
interface LoaderProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  message?: string | null;
  fullScreen?: boolean;
  showProgress?: boolean;
  progress?: number;
  variant?: 'branded' | 'simple' | 'mini' | 'compact';
}

// Specialized Loader Components
interface FullScreenLoaderProps {
  message?: string;
}

interface ProgressLoaderProps {
  message?: string;
  progress?: number;
}
```

### 2.4 OperatorAvatar Component
```typescript
interface OperatorAvatarProps {
  operator: OperatorData;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  showWorkload?: boolean;
  showBadges?: boolean;
  onClick?: () => void;
  className?: string;
}

interface OperatorData {
  id: string;
  name: string;
  status?: 'available' | 'busy' | 'offline' | 'break';
  currentWorkload?: number;
  visualBadges?: string[];
  avatar?: {
    type: 'emoji' | 'photo' | 'initials' | 'unique';
    value?: string;
    bgColor?: string;
    textColor?: string;
  };
  profileColor?: string;
}
```

## 3. Business Logic Components

### 3.1 OperatorDashboard Component
```typescript
interface OperatorDashboardProps {
  // No props - uses contexts internally
}

interface OperatorDashboardState {
  // Current work state
  currentWork: WorkItem | null;
  workQueue: WorkItem[];
  availableWork: WorkItem[];
  pendingRequests: AssignmentRequest[];
  reworkPieces: ReworkItem[];
  
  // Statistics
  productionStats: ProductionStats;
  dailyStats: DailyStats;
  
  // UI state
  isWorkStarted: boolean;
  workStartTime: Date | null;
  currentTime: Date;
  loading: boolean;
  error: string | null;
  showUserMenu: boolean;
  pendingReworkPieces: number;
  
  // Modal states
  showWorkCompletion: boolean;
  showQualityReport: boolean;
}

interface WorkItem {
  id: string;
  articleNumber: string;
  articleName: string;
  color: string;
  size: string;
  pieces: number;
  completedPieces?: number;
  operation: string;
  currentOperation: string;
  machineType: string;
  rate: number;
  status: string;
  assignedOperator?: string;
  bundleNumber?: string;
  priority?: string;
  estimatedTime?: number;
  startTime?: Date;
}
```

### 3.2 SelfAssignmentSystem Component
```typescript
interface SelfAssignmentSystemProps {
  // No props - uses contexts internally
}

interface SelfAssignmentSystemState {
  availableWork: AvailableWorkItem[];
  selectedWork: AvailableWorkItem | null;
  operationTypes: OperationType[];
  loading: boolean;
  searchTerm: string;
  filter: WorkFilter;
  showOperationsEditor: boolean;
  showMachineSelector: boolean;
}

interface AvailableWorkItem {
  id: string;
  readableId: string;
  displayName: string;
  articleNumber: string;
  articleName: string;
  englishName: string;
  color: string;
  size: string;
  pieces: number;
  operation: string;
  englishOperation: string;
  machineType: string;
  englishMachine: string;
  rate: number;
  estimatedTime: number;
  priority: string;
  englishPriority: string;
  difficulty: string;
  englishDifficulty: string;
  recommendations: AIRecommendations;
  wipEntryId?: string;
  currentOperation: string;
}

interface AIRecommendations {
  match: number; // 0-100 percentage
  reasons: string[];
}
```

### 3.3 WorkAssignment Component
```typescript
interface WorkAssignmentProps {
  // No props - uses hooks internally
}

interface WorkAssignmentState {
  draggedBundle: WorkBundle | null;
  selectedBundle: WorkBundle | null;
  selectedOperator: Operator | null;
  filter: AssignmentFilter;
  assignmentHistory: AssignmentRecord[];
  showBulkAssign: boolean;
  searchTerm: string;
  activeTab: 'assignment' | 'approvals';
  showEmergencyInsertion: boolean;
  selectedLotForInsertion: string | null;
  showAnalyticsDashboard: boolean;
}

interface WorkBundle {
  id: string;
  articleNumber: string;
  articleName: string;
  color: string;
  size: string;
  pieces: number;
  operation: string | OperationInfo;
  machineType: string;
  rate: number;
  priority: string;
  status: string;
  estimatedTime: number;
  deadline?: Date;
  lotNumber?: string;
}

interface Operator {
  id: string;
  name: string;
  role: 'operator';
  status: 'available' | 'working' | 'break' | 'busy';
  machineType?: string;
  machine?: string;
  speciality?: string;
  assignedMachines?: string[];
  skills?: string[];
  efficiency: number;
  qualityScore: number;
  currentWorkload: number;
  maxWorkload: number;
  todayPieces: number;
  station?: string;
  isActive: boolean;
  isOnline?: boolean;
  estimatedFinishTime?: string;
}
```

### 3.4 WorkCompletion Component
```typescript
interface WorkCompletionProps {
  bundleId: string;
  onWorkCompleted: (data: WorkCompletionResult) => void;
  onCancel: () => void;
}

interface WorkCompletionState {
  bundleData: BundleData | null;
  completionData: CompletionData;
  loading: boolean;
  step: 1 | 2 | 3; // Input, Review, Handoff
}

interface CompletionData {
  piecesCompleted: number;
  defectivePieces: number;
  qualityScore: number;
  timeSpent: number;
  startTime: string;
  endTime: string;
  notes: string;
}

interface BundleData {
  id: string;
  articleNumber: string;
  articleName: string;
  color: string;
  size: string;
  pieces: number;
  operation: string;
  machineType: string;
  rate: number;
  assignedAt: string;
  priority: string;
  nextOperation?: string;
  nextMachine?: string;
  nextOperator?: string;
}
```

### 3.5 QualityReport Component
```typescript
interface QualityReportProps {
  bundleData: BundleData;
  onSubmit: (qualityIssue: QualityIssue) => void;
  onCancel: () => void;
}

interface QualityReportState {
  reportData: QualityReportData;
  validationErrors: ValidationErrors;
  isSubmitting: boolean;
}

interface QualityReportData {
  defectType: string;
  customDefectType: string;
  severity: 'minor' | 'major';
  affectedPieces: number;
  totalPieces: number;
  description: string;
  cause: string;
  preventiveMeasure: string;
  images: File[];
  requiresRework: boolean;
  canContinue: boolean;
}

interface QualityIssue extends QualityReportData {
  bundleId: string;
  bundleNumber: string;
  operatorId: string;
  operatorName: string;
  operation: string;
  machine: string;
  reportedAt: string;
  status: string;
  defectTypeName: string;
  causeName: string;
}
```

## 4. Context and Hook Patterns

### 4.1 Custom Hook Interfaces
```typescript
// useAuth Hook
interface UseAuthReturn extends AuthContextValue {}

// useAppData Hook
interface UseAppDataReturn {
  // Store state
  users: UsersState;
  workItems: WorkItemsState;
  production: ProductionState;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  refreshAll: () => Promise<void>;
  loadUsers: () => Promise<void>;
  loadWorkItems: () => Promise<void>;
  loadProductionStats: () => Promise<void>;
  assignWork: (operatorId: string, workData: WorkData) => Promise<AssignResult>;
  completeWork: (assignmentId: string, completionData: CompletionData) => Promise<CompleteResult>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  
  // Utilities
  getAvailableOperators: () => Operator[];
  getWorkloadByOperator: (operatorId: string) => number;
  
  initializeApp: () => Promise<void>;
}

// useRealtimeData Hooks
interface UseOperatorStatusReturn {
  operatorStatuses: Record<string, OperatorStatus>;
  loading: boolean;
  connected: boolean;
  updateStatus: (statusData: OperatorStatusUpdate) => Promise<void>;
}

interface UseWorkProgressReturn {
  workProgress: Record<string, WorkProgress>;
  loading: boolean;
  updateProgress: (progressData: WorkProgressUpdate) => Promise<void>;
}

interface UseLiveMetricsReturn {
  metrics: LiveMetrics;
  loading: boolean;
  lastUpdated: Date | null;
  updateMetrics: (metricsData: MetricsUpdate) => Promise<void>;
}

interface UseConnectionStatusReturn {
  isConnected: boolean;
  connectionStats: ConnectionStats;
}
```

### 4.2 Context Provider Patterns
```typescript
// AuthProvider Pattern
interface AuthProviderProps {
  children: React.ReactNode;
}

// LanguageProvider Pattern
interface LanguageProviderProps {
  children: React.ReactNode;
}

// NotificationProvider Pattern
interface NotificationProviderProps {
  children: React.ReactNode;
}

// SystemProvider Pattern
interface SystemProviderProps {
  children: React.ReactNode;
}
```

## 5. Component Communication Patterns

### 5.1 Event-Driven Communication
```typescript
// Custom Events for Component Communication
interface WorkStartedEvent extends CustomEvent {
  detail: {
    workItem: WorkItem;
    operatorId: string;
    status: string;
  };
}

interface WorkSelfAssignedEvent extends CustomEvent {
  detail: {
    workItem: WorkItem;
    operatorId: string;
    operatorName: string;
    status: string;
    assignedAt: string;
  };
}

// Event Dispatching Pattern
const dispatchWorkEvent = (eventType: string, eventDetail: any) => {
  const event = new CustomEvent(eventType, { detail: eventDetail });
  window.dispatchEvent(event);
};

// Event Listening Pattern
useEffect(() => {
  const handleWorkStarted = (event: WorkStartedEvent) => {
    // Handle work started event
  };
  
  window.addEventListener('workStarted', handleWorkStarted);
  return () => window.removeEventListener('workStarted', handleWorkStarted);
}, []);
```

### 5.2 Context-Based State Management
```typescript
// Centralized State Pattern
interface AppState {
  users: {
    operators: User[];
    supervisors: User[];
    management: User[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
  };
  
  workItems: {
    bundles: WorkBundle[];
    assignments: Assignment[];
    completions: Completion[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
  };
  
  production: {
    stats: ProductionStats;
    analytics: ProductionAnalytics;
    targets: ProductionTargets;
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
  };
}

// Action Pattern
interface AppActions {
  refreshAll: () => Promise<void>;
  loadUsers: () => Promise<void>;
  loadWorkItems: () => Promise<void>;
  loadProductionStats: () => Promise<void>;
  assignWork: (operatorId: string, workData: WorkData) => Promise<AssignResult>;
  completeWork: (assignmentId: string, completionData: CompletionData) => Promise<CompleteResult>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  setError: (error: string) => void;
  clearError: () => void;
}
```

### 5.3 Component Composition Patterns
```typescript
// Higher-Order Component Pattern
interface WithAuthProps {
  user: User;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
}

const withAuth = <P extends object>(
  Component: React.ComponentType<P & WithAuthProps>
) => {
  return (props: P) => {
    const { user, isAuthenticated, hasPermission } = useAuth();
    
    if (!isAuthenticated) {
      return <LoginScreen />;
    }
    
    return (
      <Component 
        {...props} 
        user={user} 
        isAuthenticated={isAuthenticated}
        hasPermission={hasPermission}
      />
    );
  };
};

// Render Props Pattern
interface DataProviderProps {
  children: (data: DataState) => React.ReactNode;
}

const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const dataState = useAppData();
  return children(dataState);
};

// Compound Component Pattern
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, children }: ModalProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

Modal.Header = ({ children }: { children: React.ReactNode }) => (
  <div className="modal-header">{children}</div>
);

Modal.Body = ({ children }: { children: React.ReactNode }) => (
  <div className="modal-body">{children}</div>
);

Modal.Footer = ({ children }: { children: React.ReactNode }) => (
  <div className="modal-footer">{children}</div>
);
```

## 6. State Management Patterns

### 6.1 Context + Reducer Pattern
```typescript
// State Management with useReducer
interface AppState {
  users: UsersState;
  workItems: WorkItemsState;
  production: ProductionState;
  ui: UIState;
}

type AppAction = 
  | { type: 'LOAD_USERS_START' }
  | { type: 'LOAD_USERS_SUCCESS'; payload: User[] }
  | { type: 'LOAD_USERS_ERROR'; payload: string }
  | { type: 'ASSIGN_WORK_START' }
  | { type: 'ASSIGN_WORK_SUCCESS'; payload: Assignment }
  | { type: 'SET_LOADING'; payload: { section: string; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { section: string; error: string } };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'LOAD_USERS_START':
      return {
        ...state,
        users: { ...state.users, loading: true, error: null }
      };
    case 'LOAD_USERS_SUCCESS':
      return {
        ...state,
        users: {
          ...state.users,
          operators: action.payload.filter(u => u.role === 'operator'),
          supervisors: action.payload.filter(u => u.role === 'supervisor'),
          management: action.payload.filter(u => u.role === 'management'),
          loading: false,
          lastUpdated: new Date().toISOString()
        }
      };
    // ... other cases
    default:
      return state;
  }
};
```

## 7. Component Lifecycle Patterns

### 7.1 Effect Management
```typescript
// Data Loading Effect Pattern
useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await dataService.fetchData();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  loadData();
}, []); // Empty dependency array for mount-only effect

// Cleanup Effect Pattern
useEffect(() => {
  const subscription = subscribeToUpdates((data) => {
    setRealtimeData(data);
  });
  
  return () => {
    subscription.unsubscribe();
  };
}, []);

// Conditional Effect Pattern
useEffect(() => {
  if (user?.id) {
    loadUserSpecificData(user.id);
  }
}, [user?.id]);
```

This comprehensive documentation captures the complete component architecture, prop interfaces, and implementation patterns used throughout the garment ERP PWA. It provides the exact structure needed to recreate the same component behavior and architecture in any reconstruction effort.