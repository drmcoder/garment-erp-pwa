# Garment ERP PWA - Performance Guide

## Overview
This document outlines performance optimization strategies, monitoring techniques, and best practices for maintaining optimal performance in the Garment ERP PWA system.

## Performance Metrics & Targets

### Core Web Vitals
- **Largest Contentful Paint (LCP)**: < 2.5 seconds
- **First Input Delay (FID)**: < 100 milliseconds  
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8 seconds
- **Time to Interactive (TTI)**: < 3.8 seconds

### Application-Specific Metrics
- **Initial Load Time**: < 3 seconds
- **Route Transition Time**: < 500ms
- **Data Fetch Response**: < 1 second
- **Real-time Update Latency**: < 200ms
- **Offline Functionality**: Available within 2 seconds

## Performance Architecture

### Optimization Strategy Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT OPTIMIZATION                      │
├─────────────────────────────────────────────────────────────┤
│ • Code Splitting        • Bundle Optimization              │
│ • Component Memoization • Image Optimization               │
│ • Lazy Loading          • Service Worker Caching           │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  NETWORK OPTIMIZATION                       │
├─────────────────────────────────────────────────────────────┤
│ • CDN Distribution      • HTTP/2 Support                   │
│ • Resource Compression  • Connection Pooling               │
│ • Prefetching          • Critical Resource Priority        │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE OPTIMIZATION                      │
├─────────────────────────────────────────────────────────────┤
│ • Query Optimization    • Index Management                 │
│ • Data Pagination       • Connection Pooling               │
│ • Caching Strategies    • Real-time Subscriptions          │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Performance Optimization

### Code Splitting & Lazy Loading
```javascript
// Route-based code splitting
import { lazy, Suspense } from 'react';
import LoadingSpinner from './components/common/LoadingSpinner';

// Lazy load major route components
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const SupervisorDashboard = lazy(() => import('./components/supervisor/SupervisorDashboard'));
const OperatorDashboard = lazy(() => import('./components/operator/OperatorDashboard'));
const ManagementDashboard = lazy(() => import('./components/management/ManagementDashboard'));

// Wrapper with loading fallback
const LazyRoute = ({ Component }) => (
  <Suspense fallback={<LoadingSpinner />}>
    <Component />
  </Suspense>
);

// Router configuration
const AppRouter = () => (
  <Routes>
    <Route path="/admin/*" element={<LazyRoute Component={AdminDashboard} />} />
    <Route path="/supervisor/*" element={<LazyRoute Component={SupervisorDashboard} />} />
    <Route path="/operator/*" element={<LazyRoute Component={OperatorDashboard} />} />
    <Route path="/management/*" element={<LazyRoute Component={ManagementDashboard} />} />
  </Routes>
);

// Component-level lazy loading
const HeavyAnalyticsChart = lazy(() => 
  import('./components/analytics/HeavyAnalyticsChart')
);

const Dashboard = () => {
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowAnalytics(true)}>
        Load Analytics
      </button>
      
      {showAnalytics && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <HeavyAnalyticsChart />
        </Suspense>
      )}
    </div>
  );
};
```

### Component Optimization
```javascript
// React.memo for expensive components
const WorkItemCard = React.memo(({ workItem, operator, onAssign }) => {
  return (
    <div className="work-item-card">
      <h3>{workItem.bundleNumber}</h3>
      <p>{workItem.operation}</p>
      <button onClick={() => onAssign(workItem.id, operator.id)}>
        Assign
      </button>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-rendering
  return (
    prevProps.workItem.id === nextProps.workItem.id &&
    prevProps.workItem.status === nextProps.workItem.status &&
    prevProps.operator.id === nextProps.operator.id
  );
});

// useCallback for event handlers
const WorkAssignmentBoard = ({ workItems, operators }) => {
  const { assignWork } = useWorkManagement();
  
  const handleAssignment = useCallback(async (workItemId, operatorId) => {
    try {
      await assignWork(operatorId, { bundleId: workItemId });
    } catch (error) {
      console.error('Assignment failed:', error);
    }
  }, [assignWork]);
  
  // useMemo for expensive calculations
  const sortedWorkItems = useMemo(() => {
    return workItems
      .filter(item => item.status === 'pending')
      .sort((a, b) => {
        // Priority sorting: high -> medium -> low
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }, [workItems]);
  
  return (
    <div className="work-assignment-board">
      {sortedWorkItems.map(workItem => (
        <WorkItemCard
          key={workItem.id}
          workItem={workItem}
          onAssign={handleAssignment}
        />
      ))}
    </div>
  );
};
```

### Bundle Optimization
```javascript
// webpack.config.js optimizations
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true
        },
        firebase: {
          test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
          name: 'firebase',
          chunks: 'all',
          priority: 15
        }
      }
    },
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: process.env.NODE_ENV === 'production'
          }
        }
      })
    ]
  }
};

// Dynamic imports for heavy libraries
const loadChartingLibrary = async () => {
  const { Chart, registerables } = await import('chart.js');
  Chart.register(...registerables);
  return Chart;
};

// Tree shaking - import only what you need
import { format, parseISO } from 'date-fns'; // Instead of entire date-fns
import { debounce } from 'lodash/debounce'; // Instead of entire lodash
```

### Image & Asset Optimization
```javascript
// Image lazy loading component
const LazyImage = ({ src, alt, className, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <div ref={imgRef} className={className}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
          {...props}
        />
      )}
    </div>
  );
};

// WebP format support with fallback
const OptimizedImage = ({ src, alt, ...props }) => (
  <picture>
    <source srcSet={`${src}.webp`} type="image/webp" />
    <source srcSet={`${src}.jpg`} type="image/jpeg" />
    <img src={`${src}.jpg`} alt={alt} {...props} />
  </picture>
);
```

## State Management Optimization

### Zustand Performance Patterns
```javascript
// Shallow comparison for selectors
import { shallow } from 'zustand/shallow';

const useWorkData = () => useAppStore(
  state => ({
    workItems: state.workItems,
    bundles: state.bundles,
    loading: state.loading.workItems
  }),
  shallow // Prevents re-renders when object references change but values are the same
);

// Selector optimization - only select what you need
const useWorkItemsCount = () => useAppStore(
  state => state.workItems.length // Only subscribes to length changes
);

// Computed selectors with memoization
const useFilteredWorkItems = (status, priority) => {
  return useAppStore(
    state => state.workItems.filter(item => 
      (!status || item.status === status) &&
      (!priority || item.priority === priority)
    ),
    shallow
  );
};
```

### Firebase Performance Optimization
```javascript
// Firestore query optimization
class OptimizedFirebaseService {
  // Use pagination for large datasets
  static async getPaginatedWorkItems(pageSize = 25, lastDoc = null) {
    let query = collection(db, 'workItems')
      .orderBy('createdAt', 'desc')
      .limit(pageSize);
    
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    
    const snapshot = await getDocs(query);
    return {
      items: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === pageSize
    };
  }
  
  // Batch operations for better performance
  static async batchUpdateWorkItems(updates) {
    const batch = writeBatch(db);
    const maxBatchSize = 500; // Firestore batch limit
    
    for (let i = 0; i < updates.length; i += maxBatchSize) {
      const batchUpdates = updates.slice(i, i + maxBatchSize);
      
      batchUpdates.forEach(({ id, data }) => {
        const docRef = doc(db, 'workItems', id);
        batch.update(docRef, { ...data, updatedAt: serverTimestamp() });
      });
      
      await batch.commit();
    }
  }
  
  // Efficient real-time subscriptions
  static subscribeToWorkItems(callback, filters = {}) {
    let query = collection(db, 'workItems');
    
    // Apply filters to reduce data transfer
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    
    if (filters.operatorId) {
      query = query.where('operatorId', '==', filters.operatorId);
    }
    
    // Limit initial load
    query = query.orderBy('updatedAt', 'desc').limit(100);
    
    return onSnapshot(query, 
      snapshot => {
        // Only process changes, not full dataset
        const changes = snapshot.docChanges().map(change => ({
          type: change.type,
          id: change.doc.id,
          data: change.doc.data()
        }));
        
        callback(changes);
      },
      error => {
        console.error('Subscription error:', error);
      }
    );
  }
}
```

## Caching Strategies

### Multi-Level Caching
```javascript
// Memory cache for frequently accessed data
class MemoryCache {
  constructor(maxSize = 100, ttl = 300000) { // 5 minutes TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }
  
  set(key, value) {
    // Remove oldest entries if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }
  
  clear() {
    this.cache.clear();
  }
}

// Service worker caching
const CACHE_NAME = 'garment-erp-v1';
const STATIC_CACHE = 'garment-erp-static-v1';

// Cache strategy implementation
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Cache API responses with different strategies
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            // Serve from cache, update in background
            fetch(request).then(fetchResponse => {
              cache.put(request, fetchResponse.clone());
            });
            return response;
          }
          
          // Fetch and cache
          return fetch(request).then(fetchResponse => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
  
  // Cache static assets aggressively
  if (request.destination === 'image' || request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(fetchResponse => {
          return caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
```

### Application-Level Caching
```javascript
// React Query for server state caching
import { useQuery, useQueryClient } from 'react-query';

const useWorkItems = (filters = {}) => {
  return useQuery(
    ['workItems', filters],
    () => fetchWorkItems(filters),
    {
      staleTime: 30000, // 30 seconds
      cacheTime: 300000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchInterval: 60000, // Refetch every minute
    }
  );
};

// Cache invalidation on mutations
const useAssignWork = () => {
  const queryClient = useQueryClient();
  
  return useMutation(assignWorkAPI, {
    onSuccess: () => {
      // Invalidate relevant caches
      queryClient.invalidateQueries(['workItems']);
      queryClient.invalidateQueries(['operators']);
    }
  });
};
```

## Real-time Performance

### Efficient WebSocket Management
```javascript
// Connection pooling for Firebase subscriptions
class SubscriptionManager {
  constructor() {
    this.subscriptions = new Map();
    this.subscriptionCounts = new Map();
  }
  
  // Shared subscription pattern
  subscribe(key, query, callback) {
    if (!this.subscriptions.has(key)) {
      // Create new subscription
      const unsubscribe = onSnapshot(query, snapshot => {
        // Notify all callbacks
        const callbacks = this.subscriptionCounts.get(key) || [];
        callbacks.forEach(cb => cb(snapshot));
      });
      
      this.subscriptions.set(key, unsubscribe);
      this.subscriptionCounts.set(key, []);
    }
    
    // Add callback
    this.subscriptionCounts.get(key).push(callback);
    
    // Return cleanup function
    return () => {
      const callbacks = this.subscriptionCounts.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        
        // Clean up subscription if no more callbacks
        if (callbacks.length === 0) {
          this.subscriptions.get(key)();
          this.subscriptions.delete(key);
          this.subscriptionCounts.delete(key);
        }
      }
    };
  }
}

// Debounced updates for real-time data
const useDebouncedRealTimeData = (data, delay = 500) => {
  const [debouncedData, setDebouncedData] = useState(data);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedData(data);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [data, delay]);
  
  return debouncedData;
};
```

### Batch Processing
```javascript
// Batch UI updates to prevent excessive re-renders
class BatchProcessor {
  constructor(batchSize = 50, delay = 100) {
    this.queue = [];
    this.batchSize = batchSize;
    this.delay = delay;
    this.timeoutId = null;
  }
  
  add(item) {
    this.queue.push(item);
    
    if (this.queue.length >= this.batchSize) {
      this.process();
    } else {
      this.scheduleProcess();
    }
  }
  
  scheduleProcess() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    this.timeoutId = setTimeout(() => {
      this.process();
    }, this.delay);
  }
  
  process() {
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0);
    this.processBatch(batch);
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  
  processBatch(items) {
    // Process all items at once
    // This could be updating UI, sending to server, etc.
  }
}
```

## Performance Monitoring

### Client-Side Monitoring
```javascript
// Performance monitoring service
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.initializeObservers();
  }
  
  initializeObservers() {
    // Core Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      // LCP monitoring
      const lcpObserver = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // FID monitoring
      const fidObserver = new PerformanceObserver(list => {
        list.getEntries().forEach(entry => {
          this.recordMetric('FID', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      
      // CLS monitoring
      const clsObserver = new PerformanceObserver(list => {
        let clsValue = 0;
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordMetric('CLS', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
    
    // Navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        this.recordMetric('DOM_LOAD_TIME', perfData.domContentLoadedEventEnd - perfData.fetchStart);
        this.recordMetric('WINDOW_LOAD_TIME', perfData.loadEventEnd - perfData.fetchStart);
      }, 0);
    });
  }
  
  recordMetric(name, value) {
    const timestamp = Date.now();
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name).push({ value, timestamp });
    
    // Send to analytics if configured
    this.sendMetricToAnalytics(name, value);
    
    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance Metric - ${name}: ${value}ms`);
    }
  }
  
  sendMetricToAnalytics(name, value) {
    // Send to Google Analytics or other monitoring service
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metric', {
        metric_name: name,
        metric_value: Math.round(value),
        custom_parameter: window.location.pathname
      });
    }
  }
  
  getMetricSummary(name) {
    const metrics = this.metrics.get(name) || [];
    if (metrics.length === 0) return null;
    
    const values = metrics.map(m => m.value);
    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      latest: values[values.length - 1]
    };
  }
}

// Initialize performance monitoring
const performanceMonitor = new PerformanceMonitor();
window.performanceMonitor = performanceMonitor;
```

### Custom Performance Tracking
```javascript
// Component performance tracking
const withPerformanceTracking = (WrappedComponent, componentName) => {
  return (props) => {
    const renderStart = useRef();
    const [renderTime, setRenderTime] = useState(0);
    
    renderStart.current = performance.now();
    
    useEffect(() => {
      const renderEnd = performance.now();
      const duration = renderEnd - renderStart.current;
      setRenderTime(duration);
      
      // Track component render time
      performanceMonitor.recordMetric(`COMPONENT_RENDER_${componentName}`, duration);
    });
    
    return <WrappedComponent {...props} />;
  };
};

// Usage
const PerformantWorkAssignmentBoard = withPerformanceTracking(
  WorkAssignmentBoard,
  'WorkAssignmentBoard'
);
```

### Database Performance Monitoring
```javascript
// Firestore query performance tracking
const withQueryPerformanceTracking = (queryFn, queryName) => {
  return async (...args) => {
    const startTime = performance.now();
    
    try {
      const result = await queryFn(...args);
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceMonitor.recordMetric(`FIRESTORE_QUERY_${queryName}`, duration);
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      performanceMonitor.recordMetric(`FIRESTORE_QUERY_ERROR_${queryName}`, duration);
      throw error;
    }
  };
};

// Usage
const getWorkItemsWithTracking = withQueryPerformanceTracking(
  getWorkItems,
  'GET_WORK_ITEMS'
);
```

## Performance Testing

### Load Testing Scripts
```javascript
// Simple load testing for critical paths
const loadTest = async (testFunction, iterations = 100, concurrency = 10) => {
  const results = [];
  const batches = Math.ceil(iterations / concurrency);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchPromises = [];
    const batchSize = Math.min(concurrency, iterations - batch * concurrency);
    
    for (let i = 0; i < batchSize; i++) {
      batchPromises.push(
        (async () => {
          const startTime = performance.now();
          try {
            await testFunction();
            const endTime = performance.now();
            return { success: true, duration: endTime - startTime };
          } catch (error) {
            const endTime = performance.now();
            return { success: false, duration: endTime - startTime, error };
          }
        })()
      );
    }
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  // Analyze results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const durations = successful.map(r => r.duration);
  
  return {
    total: results.length,
    successful: successful.length,
    failed: failed.length,
    successRate: (successful.length / results.length) * 100,
    averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations)
  };
};

// Test critical operations
const testWorkAssignmentPerformance = async () => {
  const results = await loadTest(
    () => assignWork('operator123', { bundleId: 'bundle456' }),
    50, // 50 iterations
    5   // 5 concurrent requests
  );
  
  console.log('Work Assignment Load Test Results:', results);
};
```

### Lighthouse CI Integration
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lhci:
    name: Lighthouse
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: npm install, build
        run: |
          npm ci
          npm run build
      - name: run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.8.x
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

## Performance Optimization Checklist

### Development Phase
- [ ] Implement code splitting for routes
- [ ] Use React.memo for expensive components
- [ ] Optimize component re-renders with useCallback/useMemo
- [ ] Implement lazy loading for images and heavy components
- [ ] Use shallow comparison in state selectors
- [ ] Optimize bundle size with tree shaking
- [ ] Implement service worker caching

### Database Optimization
- [ ] Create appropriate Firestore indexes
- [ ] Implement query pagination
- [ ] Use batch operations for multiple updates
- [ ] Optimize real-time subscriptions
- [ ] Implement client-side caching
- [ ] Use connection pooling for subscriptions

### Deployment Optimization
- [ ] Enable HTTP/2 and compression
- [ ] Configure CDN for static assets
- [ ] Optimize image formats (WebP with fallbacks)
- [ ] Set up proper caching headers
- [ ] Implement resource preloading
- [ ] Monitor Core Web Vitals

### Monitoring & Maintenance
- [ ] Set up performance monitoring
- [ ] Configure alerts for performance degradation
- [ ] Regular performance audits
- [ ] Monitor real user metrics (RUM)
- [ ] Optimize based on actual usage patterns
- [ ] Regular dependency updates for performance improvements

This performance guide ensures the Garment ERP PWA maintains optimal speed and responsiveness across all user interactions and system operations.