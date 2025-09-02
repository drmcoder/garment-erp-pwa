// Centralized Architecture Management Service
// Handles data flow patterns, error recovery, and application stability

import { dataService } from './DataService';
import { cacheService } from './CacheService';

class ArchitectureService {
  constructor() {
    this.errorQueue = [];
    this.retryCount = new Map();
    this.circuitBreakers = new Map();
    this.performanceMetrics = {
      componentRenders: new Map(),
      hookExecutions: new Map(),
      apiCalls: new Map(),
      errorCounts: new Map()
    };
    
    // Initialize circuit breaker for critical services
    this.initializeCircuitBreakers();
  }

  // Circuit Breaker Pattern Implementation
  initializeCircuitBreakers() {
    const services = ['dataService', 'cacheService', 'firebaseService'];
    
    services.forEach(serviceName => {
      this.circuitBreakers.set(serviceName, {
        state: 'closed', // closed, open, half-open
        failureCount: 0,
        successCount: 0,
        threshold: 5, // failures before opening
        timeout: 30000, // 30 seconds before retry
        lastFailureTime: null
      });
    });
  }

  // Safe execution with circuit breaker protection
  async executeWithCircuitBreaker(serviceName, operation, fallback = null) {
    const breaker = this.circuitBreakers.get(serviceName);
    
    if (!breaker) {
      console.warn(`Circuit breaker not found for service: ${serviceName}`);
      return await operation();
    }

    // Check circuit breaker state
    if (breaker.state === 'open') {
      const timeSinceFailure = Date.now() - breaker.lastFailureTime;
      
      if (timeSinceFailure < breaker.timeout) {
        console.log(`Circuit breaker OPEN for ${serviceName}, using fallback`);
        return fallback ? await fallback() : { success: false, error: 'Service temporarily unavailable' };
      } else {
        breaker.state = 'half-open';
        console.log(`Circuit breaker transitioning to HALF-OPEN for ${serviceName}`);
      }
    }

    try {
      const result = await operation();
      
      // Success - reset or close circuit breaker
      if (breaker.state === 'half-open' || breaker.failureCount > 0) {
        breaker.state = 'closed';
        breaker.failureCount = 0;
        breaker.successCount++;
        console.log(`Circuit breaker CLOSED for ${serviceName}`);
      }
      
      return result;
    } catch (error) {
      // Failure - update circuit breaker
      breaker.failureCount++;
      breaker.lastFailureTime = Date.now();
      
      if (breaker.failureCount >= breaker.threshold) {
        breaker.state = 'open';
        console.error(`Circuit breaker OPENED for ${serviceName} after ${breaker.failureCount} failures`);
      }
      
      // Use fallback if available
      if (fallback) {
        console.log(`Using fallback for ${serviceName} due to error:`, error.message);
        return await fallback();
      }
      
      throw error;
    }
  }

  // Robust data fetching with multiple fallback strategies
  async fetchDataSafely(collectionName, options = {}) {
    const cacheKey = `${collectionName}_${JSON.stringify(options)}`;
    
    // Strategy 1: Try primary data service
    const primaryOperation = () => dataService.fetchCollection(collectionName, options);
    const cacheOperation = () => cacheService.get(cacheKey);
    
    try {
      return await this.executeWithCircuitBreaker('dataService', primaryOperation, async () => {
        // Strategy 2: Try cache service
        console.log(`Falling back to cache for ${collectionName}`);
        const cached = await cacheOperation();
        
        if (cached && cached.success) {
          return { ...cached, fromCache: true };
        }
        
        // Strategy 3: Return mock data structure
        console.log(`Falling back to mock structure for ${collectionName}`);
        return this.getMockDataStructure(collectionName);
      });
    } catch (error) {
      console.error(`All fallback strategies failed for ${collectionName}:`, error);
      return this.getMockDataStructure(collectionName);
    }
  }

  // Mock data structures for fallback scenarios
  getMockDataStructure(collectionName) {
    const mockStructures = {
      operators: {
        success: true,
        data: [],
        fallback: true,
        message: 'Using empty operator list as fallback'
      },
      bundles: {
        success: true,
        data: [],
        fallback: true,
        message: 'Using empty bundle list as fallback'
      },
      work_assignments: {
        success: true,
        data: [],
        fallback: true,
        message: 'Using empty assignments list as fallback'
      },
      default: {
        success: true,
        data: [],
        fallback: true,
        message: `Using empty list as fallback for ${collectionName}`
      }
    };

    return mockStructures[collectionName] || mockStructures.default;
  }

  // Retry mechanism with exponential backoff
  async retryOperation(operationId, operation, maxRetries = 3) {
    const currentRetries = this.retryCount.get(operationId) || 0;
    
    if (currentRetries >= maxRetries) {
      throw new Error(`Operation ${operationId} failed after ${maxRetries} retries`);
    }

    try {
      const result = await operation();
      this.retryCount.delete(operationId);
      return result;
    } catch (error) {
      const newRetryCount = currentRetries + 1;
      this.retryCount.set(operationId, newRetryCount);
      
      console.warn(`Operation ${operationId} failed, retry ${newRetryCount}/${maxRetries}:`, error.message);
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      const delayMs = Math.pow(2, currentRetries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      return this.retryOperation(operationId, operation, maxRetries);
    }
  }

  // Error collection and analysis
  logError(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.errorQueue.push(errorInfo);
    
    // Keep only last 100 errors
    if (this.errorQueue.length > 100) {
      this.errorQueue.shift();
    }

    // Update error metrics
    const errorType = error.name || 'UnknownError';
    const currentCount = this.performanceMetrics.errorCounts.get(errorType) || 0;
    this.performanceMetrics.errorCounts.set(errorType, currentCount + 1);

    console.error('ArchitectureService logged error:', errorInfo);
    
    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.sendErrorToService(errorInfo);
    }
  }

  // Performance monitoring
  trackComponentRender(componentName, renderTime = null) {
    const renders = this.performanceMetrics.componentRenders.get(componentName) || [];
    renders.push({
      timestamp: Date.now(),
      renderTime
    });
    
    // Keep only last 50 renders per component
    if (renders.length > 50) {
      renders.shift();
    }
    
    this.performanceMetrics.componentRenders.set(componentName, renders);
  }

  trackHookExecution(hookName, executionTime) {
    const executions = this.performanceMetrics.hookExecutions.get(hookName) || [];
    executions.push({
      timestamp: Date.now(),
      executionTime
    });
    
    // Keep only last 50 executions per hook
    if (executions.length > 50) {
      executions.shift();
    }
    
    this.performanceMetrics.hookExecutions.set(hookName, executions);
  }

  // Hook dependency analysis to prevent loops
  analyzeHookDependencies(hookName, dependencies) {
    const analysis = {
      hookName,
      dependencies: dependencies.map(dep => ({
        type: typeof dep,
        isFunction: typeof dep === 'function',
        isObject: typeof dep === 'object' && dep !== null,
        isStable: this.isStableReference(dep)
      })),
      potentialIssues: []
    };

    // Check for unstable function dependencies
    analysis.dependencies.forEach((dep, index) => {
      if (dep.isFunction && !dep.isStable) {
        analysis.potentialIssues.push({
          type: 'unstable_function',
          index,
          message: `Dependency at index ${index} is an unstable function reference`
        });
      }
      
      if (dep.isObject && !dep.isStable) {
        analysis.potentialIssues.push({
          type: 'unstable_object',
          index,
          message: `Dependency at index ${index} is an unstable object reference`
        });
      }
    });

    if (analysis.potentialIssues.length > 0) {
      console.warn(`Hook dependency analysis for ${hookName}:`, analysis);
    }

    return analysis;
  }

  // Check if a reference is stable (memoized)
  isStableReference(value) {
    // This is a simplified check - in practice, you'd need more sophisticated analysis
    if (typeof value === 'function') {
      return value.name !== '' || value.toString().includes('useCallback') || value.toString().includes('useMemo');
    }
    
    if (typeof value === 'object' && value !== null) {
      // Check if object has stable properties (simplified)
      return Object.prototype.hasOwnProperty.call(value, '__memoized__');
    }
    
    return true; // Primitives are stable
  }

  // Generate health report
  getHealthReport() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);

    return {
      timestamp: new Date().toISOString(),
      circuitBreakers: Object.fromEntries(this.circuitBreakers),
      recentErrors: this.errorQueue.filter(error => 
        new Date(error.timestamp).getTime() > last24Hours
      ),
      performanceMetrics: {
        totalComponentRenders: Array.from(this.performanceMetrics.componentRenders.values())
          .reduce((total, renders) => total + renders.length, 0),
        totalHookExecutions: Array.from(this.performanceMetrics.hookExecutions.values())
          .reduce((total, executions) => total + executions.length, 0),
        errorCounts: Object.fromEntries(this.performanceMetrics.errorCounts)
      },
      memoryUsage: this.getMemoryUsage()
    };
  }

  // Memory usage analysis
  getMemoryUsage() {
    if ('memory' in performance) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      };
    }
    
    return { available: false, reason: 'Memory API not supported' };
  }

  // Send error to external service (placeholder)
  async sendErrorToService(errorInfo) {
    try {
      // In real implementation, send to Sentry, LogRocket, or similar
      console.log('Would send error to external service:', errorInfo);
    } catch (serviceError) {
      console.error('Failed to send error to external service:', serviceError);
    }
  }

  // Cleanup method
  cleanup() {
    this.errorQueue = [];
    this.retryCount.clear();
    this.performanceMetrics.componentRenders.clear();
    this.performanceMetrics.hookExecutions.clear();
    this.performanceMetrics.apiCalls.clear();
    this.performanceMetrics.errorCounts.clear();
  }
}

// Create singleton instance
export const architectureService = new ArchitectureService();

// Convenience methods for common operations
export const safeFetch = (collectionName, options) => 
  architectureService.fetchDataSafely(collectionName, options);

export const withRetry = (operationId, operation, maxRetries) =>
  architectureService.retryOperation(operationId, operation, maxRetries);

export const logArchitectureError = (error, context) =>
  architectureService.logError(error, context);

export const trackPerformance = (componentName, renderTime) =>
  architectureService.trackComponentRender(componentName, renderTime);

export default architectureService;