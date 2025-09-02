import logger from './logger';

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: {},
      apiCalls: [],
      components: {},
      userInteractions: []
    };
    this.observers = [];
    this.isMonitoring = false;
  }

  // Start monitoring
  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Monitor page load performance
    this.monitorPageLoad();

    // Monitor long tasks
    this.monitorLongTasks();

    // Monitor resource timing
    this.monitorResources();

    // Monitor user interactions
    this.monitorInteractions();

    // Monitor memory usage
    this.monitorMemory();

    logger.info('Performance monitoring started');
  }

  // Stop monitoring
  stop() {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    logger.info('Performance monitoring stopped');
  }

  // Monitor page load metrics
  monitorPageLoad() {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const navigationStart = timing.navigationStart;

      this.metrics.pageLoad = {
        domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,
        loadComplete: timing.loadEventEnd - navigationStart,
        domInteractive: timing.domInteractive - navigationStart,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint(),
        largestContentfulPaint: this.getLargestContentfulPaint()
      };

      logger.debug('Page load metrics', this.metrics.pageLoad);
    }
  }

  // Get First Paint time
  getFirstPaint() {
    if (window.performance && window.performance.getEntriesByType) {
      const paintEntries = window.performance.getEntriesByType('paint');
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      return firstPaint ? firstPaint.startTime : 0;
    }
    return 0;
  }

  // Get First Contentful Paint time
  getFirstContentfulPaint() {
    if (window.performance && window.performance.getEntriesByType) {
      const paintEntries = window.performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      return fcp ? fcp.startTime : 0;
    }
    return 0;
  }

  // Get Largest Contentful Paint time
  getLargestContentfulPaint() {
    return new Promise(resolve => {
      if (!window.PerformanceObserver) {
        resolve(0);
        return;
      }

      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.renderTime || lastEntry.loadTime);
        observer.disconnect();
      });

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(observer);
      } catch (error) {
        resolve(0);
      }

      // Timeout after 10 seconds
      setTimeout(() => resolve(0), 10000);
    });
  }

  // Monitor long tasks
  monitorLongTasks() {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            logger.warn('Long task detected', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      logger.debug('Long task monitoring not supported');
    }
  }

  // Monitor resource loading
  monitorResources() {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 1000) {
            logger.warn('Slow resource loading', {
              name: entry.name,
              duration: entry.duration,
              type: entry.initiatorType
            });
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      logger.debug('Resource monitoring not supported');
    }
  }

  // Monitor user interactions
  monitorInteractions() {
    const interactionEvents = ['click', 'keydown', 'scroll', 'touchstart'];
    
    interactionEvents.forEach(eventType => {
      window.addEventListener(eventType, this.handleInteraction.bind(this), { passive: true });
    });
  }

  // Handle user interaction
  handleInteraction(event) {
    const interaction = {
      type: event.type,
      timestamp: Date.now(),
      target: event.target?.tagName || 'unknown',
      id: event.target?.id || '',
      className: event.target?.className || ''
    };

    this.metrics.userInteractions.push(interaction);

    // Keep only last 100 interactions
    if (this.metrics.userInteractions.length > 100) {
      this.metrics.userInteractions.shift();
    }
  }

  // Monitor memory usage
  monitorMemory() {
    if (!performance.memory) return;

    setInterval(() => {
      const memoryInfo = {
        usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2),
        totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2),
        jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2)
      };

      // Check for memory leaks
      const heapUsagePercent = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100;
      if (heapUsagePercent > 90) {
        logger.error('High memory usage detected', memoryInfo);
      }
    }, 30000); // Check every 30 seconds
  }

  // Track API call performance
  trackApiCall(url, duration, status) {
    const apiCall = {
      url,
      duration,
      status,
      timestamp: Date.now()
    };

    this.metrics.apiCalls.push(apiCall);

    // Keep only last 100 API calls
    if (this.metrics.apiCalls.length > 100) {
      this.metrics.apiCalls.shift();
    }

    // Log slow API calls
    if (duration > 3000) {
      logger.warn('Slow API call', apiCall);
    }
  }

  // Track component render time
  trackComponentRender(componentName, duration) {
    if (!this.metrics.components[componentName]) {
      this.metrics.components[componentName] = {
        renders: 0,
        totalDuration: 0,
        averageDuration: 0,
        maxDuration: 0
      };
    }

    const component = this.metrics.components[componentName];
    component.renders++;
    component.totalDuration += duration;
    component.averageDuration = component.totalDuration / component.renders;
    component.maxDuration = Math.max(component.maxDuration, duration);

    // Log slow component renders
    if (duration > 16) {
      logger.warn('Slow component render', {
        component: componentName,
        duration,
        average: component.averageDuration
      });
    }
  }

  // Get performance report
  getReport() {
    const report = {
      pageLoad: this.metrics.pageLoad,
      apiCalls: {
        total: this.metrics.apiCalls.length,
        averageDuration: this.calculateAverageApiDuration(),
        slowCalls: this.metrics.apiCalls.filter(call => call.duration > 3000).length
      },
      components: this.getComponentStats(),
      memory: this.getMemoryStats(),
      interactions: {
        total: this.metrics.userInteractions.length,
        byType: this.groupInteractionsByType()
      }
    };

    return report;
  }

  // Calculate average API duration
  calculateAverageApiDuration() {
    if (this.metrics.apiCalls.length === 0) return 0;
    
    const total = this.metrics.apiCalls.reduce((sum, call) => sum + call.duration, 0);
    return (total / this.metrics.apiCalls.length).toFixed(2);
  }

  // Get component statistics
  getComponentStats() {
    const stats = {};
    Object.keys(this.metrics.components).forEach(name => {
      const component = this.metrics.components[name];
      stats[name] = {
        renders: component.renders,
        averageDuration: component.averageDuration.toFixed(2),
        maxDuration: component.maxDuration.toFixed(2)
      };
    });
    return stats;
  }

  // Get memory statistics
  getMemoryStats() {
    if (!performance.memory) return null;
    
    return {
      used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
      usage: ((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100).toFixed(2) + '%'
    };
  }

  // Group interactions by type
  groupInteractionsByType() {
    const grouped = {};
    this.metrics.userInteractions.forEach(interaction => {
      if (!grouped[interaction.type]) {
        grouped[interaction.type] = 0;
      }
      grouped[interaction.type]++;
    });
    return grouped;
  }

  // Export metrics for analysis
  exportMetrics() {
    const blob = new Blob([JSON.stringify(this.getReport(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

const performanceMonitor = new PerformanceMonitor();
export default performanceMonitor;