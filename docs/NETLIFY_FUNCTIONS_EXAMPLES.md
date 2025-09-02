# 📖 Netlify Functions Usage Examples

## Frontend Integration Examples

### 1. Authentication Flow

```javascript
import apiService from '../services/ApiService';

// Login component
const LoginComponent = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    role: 'operator'
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await apiService.login(
        credentials.username,
        credentials.password,
        credentials.role,
        true // rememberMe
      );

      if (result.success) {
        // Handle successful login
        console.log('User logged in:', result.user);
        // Redirect to dashboard
      }
    } catch (error) {
      console.error('Login failed:', error.message);
      // Show error message to user
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
};

// Logout function
const handleLogout = async () => {
  try {
    await apiService.logout();
    // Redirect to login page
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
  }
};
```

### 2. Bundle Management

```javascript
// Operator Dashboard - Get assigned bundles
const OperatorDashboard = () => {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOperatorBundles();
  }, []);

  const loadOperatorBundles = async () => {
    try {
      const user = apiService.getStoredUser();
      const result = await apiService.getBundles({
        operatorId: user.id,
        status: 'assigned',
        machine: user.machine
      });

      setBundles(result.bundles);
    } catch (error) {
      console.error('Failed to load bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  const startWork = async (bundleId) => {
    try {
      await apiService.startBundle(bundleId);
      await loadOperatorBundles(); // Refresh list
      
      // Create notification
      await apiService.createNotification({
        title: 'Work Started',
        titleNp: 'काम सुरु भयो',
        message: `Bundle ${bundleId} work started`,
        messageNp: `बन्डल ${bundleId} काम सुरु भयो`,
        type: 'info',
        priority: 'medium',
        targetRole: 'supervisor'
      });
    } catch (error) {
      console.error('Failed to start work:', error);
    }
  };

  const completeWork = async (bundleId, completionData) => {
    try {
      await apiService.completeBundle(bundleId, completionData);
      await loadOperatorBundles();
      
      // Notify supervisor of completion
      await apiService.createNotification({
        title: 'Work Completed',
        titleNp: 'काम सकियो',
        message: `Bundle ${bundleId} completed with ${completionData.completedPieces} pieces`,
        messageNp: `बन्डल ${bundleId} ${completionData.completedPieces} टुक्राका साथ पूरा भयो`,
        type: 'success',
        priority: 'medium',
        targetRole: 'supervisor',
        bundleId
      });
    } catch (error) {
      console.error('Failed to complete work:', error);
    }
  };

  // ... rest of component
};
```

### 3. Supervisor Bundle Assignment

```javascript
// Supervisor Dashboard - Assign bundles
const SupervisorDashboard = () => {
  const [availableBundles, setAvailableBundles] = useState([]);
  const [operators, setOperators] = useState([]);

  const loadPendingBundles = async () => {
    try {
      const result = await apiService.getBundles({
        status: 'pending',
        priority: 'high' // Show high priority first
      });
      
      setAvailableBundles(result.bundles);
    } catch (error) {
      console.error('Failed to load bundles:', error);
    }
  };

  const assignBundle = async (bundleId, operatorId) => {
    try {
      await apiService.assignBundle(bundleId, operatorId);
      
      // Notify operator of new assignment
      await apiService.createNotification({
        title: 'New Work Assignment',
        titleNp: 'नयाँ काम तोकिएको',
        message: `Bundle ${bundleId} has been assigned to you`,
        messageNp: `बन्डल ${bundleId} तपाईंलाई तोकिएको छ`,
        type: 'info',
        priority: 'medium',
        targetUser: operatorId,
        bundleId,
        actionRequired: true
      });

      await loadPendingBundles(); // Refresh
    } catch (error) {
      console.error('Failed to assign bundle:', error);
    }
  };

  // Bulk assignment
  const assignMultipleBundles = async (bundleIds, operatorId) => {
    try {
      const results = await Promise.all(
        bundleIds.map(bundleId => apiService.assignBundle(bundleId, operatorId))
      );

      // Send single notification for multiple assignments
      await apiService.createNotification({
        title: 'Multiple Work Assignments',
        titleNp: 'धेरै काम तोकिएको',
        message: `${bundleIds.length} bundles have been assigned to you`,
        messageNp: `${bundleIds.length} बन्डल तपाईंलाई तोकिएको छ`,
        type: 'info',
        priority: 'high',
        targetUser: operatorId,
        actionRequired: true
      });

      await loadPendingBundles();
    } catch (error) {
      console.error('Failed to assign bundles:', error);
    }
  };
};
```

### 4. Real-time Notifications

```javascript
// Notification component
const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user] = useAuth();

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const result = await apiService.getNotifications({
        userId: user.id,
        role: user.role,
        limit: 50
      });

      setNotifications(result.notifications);
      setUnreadCount(result.summary.unread);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      await loadNotifications(); // Refresh
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications
        .filter(n => !n.read)
        .map(n => n.id);

      await Promise.all(
        unreadIds.map(id => apiService.markNotificationAsRead(id))
      );

      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // ... rest of component
};
```

### 5. Quality Issue Reporting

```javascript
// Quality report component
const QualityReportForm = ({ bundleId, onComplete }) => {
  const [qualityData, setQualityData] = useState({
    defectType: 'fabric',
    affectedPieces: 1,
    description: '',
    cause: 'material'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Report quality issue
      await apiService.reportQualityIssue({
        bundleId,
        ...qualityData,
        operatorId: user.id,
        priority: 'high'
      });

      // Create urgent notification for supervisor
      await apiService.createNotification({
        title: 'Quality Issue Reported',
        titleNp: 'गुणस्तर समस्या रिपोर्ट गरिएको',
        message: `Quality issue in Bundle ${bundleId}: ${qualityData.defectType}`,
        messageNp: `बन्डल ${bundleId} मा गुणस्तर समस्या: ${qualityData.defectType}`,
        type: 'quality_alert',
        priority: 'urgent',
        targetRole: 'supervisor',
        bundleId,
        actionRequired: true
      });

      // Update bundle status to paused
      await apiService.updateBundle(bundleId, {
        status: 'paused',
        qualityStatus: 'fail'
      });

      onComplete();
    } catch (error) {
      console.error('Failed to report quality issue:', error);
    }
  };

  // ... rest of component
};
```

### 6. Production Statistics Dashboard

```javascript
// Production dashboard
const ProductionDashboard = () => {
  const [todayStats, setTodayStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductionStats();
    // Refresh every 5 minutes
    const interval = setInterval(loadProductionStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadProductionStats = async () => {
    try {
      const result = await apiService.getTodayStats();
      setTodayStats(result.stats);
    } catch (error) {
      console.error('Failed to load production stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOperatorPerformance = async (operatorId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await apiService.getOperatorStats(operatorId, today);
      return result.operatorStats;
    } catch (error) {
      console.error('Failed to load operator stats:', error);
      return null;
    }
  };

  // ... rest of component
};
```

## API Testing Examples

### Using curl (Terminal)

```bash
# Set your site URL
export SITE_URL="http://localhost:8888"  # For local development
# export SITE_URL="https://your-site.netlify.app"  # For production

# Test authentication
curl -X POST $SITE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ram.singh",
    "password": "password123",
    "role": "operator"
  }'

# Get operator bundles
curl "$SITE_URL/api/bundles?operatorId=op001&status=assigned" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Create notification
curl -X POST $SITE_URL/api/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Test Notification",
    "message": "This is a test notification",
    "type": "info",
    "priority": "medium",
    "targetUser": "op001"
  }'

# Get unread notifications
curl "$SITE_URL/api/notifications?userId=op001&unreadOnly=true" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using JavaScript (Browser Console)

```javascript
// Test from browser console on your site
const baseURL = '/api';

// Test login
fetch(`${baseURL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'ram.singh',
    password: 'password123',
    role: 'operator'
  })
}).then(r => r.json()).then(console.log);

// Test bundle creation
fetch(`${baseURL}/bundles`, {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    article: '9999',
    articleName: 'Test Article',
    articleNameNp: 'परीक्षण लेख',
    color: 'Red',
    size: 'L',
    pieces: 25,
    operation: 'Test Operation',
    operationNp: 'परीक्षण कार्य',
    machine: 'overlock',
    rate: 2.0
  })
}).then(r => r.json()).then(console.log);
```

## Error Handling Examples

```javascript
// Robust error handling
const handleApiCall = async (apiFunction, ...args) => {
  try {
    const result = await apiFunction(...args);
    return result;
  } catch (error) {
    // Handle different types of errors
    if (error.message.includes('token expired')) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }

    if (error.message.includes('Network')) {
      // Show offline message
      showNotification({
        title: 'Connection Error',
        message: 'Please check your internet connection',
        type: 'error'
      });
      return;
    }

    // Log error and show user-friendly message
    console.error('API Error:', error);
    showNotification({
      title: 'Error',
      message: apiService.handleError(error),
      type: 'error'
    });
  }
};

// Usage
const loadData = () => handleApiCall(
  apiService.getBundles, 
  { operatorId: user.id }
);
```

## Performance Optimization

```javascript
// Cache API responses
class CachedApiService extends ApiService {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getCachedBundles(filters = {}) {
    const cacheKey = `bundles-${JSON.stringify(filters)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await this.getBundles(filters);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  clearCache() {
    this.cache.clear();
  }
}

// Debounced search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Usage in search component
const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // Perform search
      apiService.getBundles({
        search: debouncedSearchTerm
      }).then(setResults);
    }
  }, [debouncedSearchTerm]);
};
```

Your Netlify Functions are now fully integrated and ready to use! 🚀