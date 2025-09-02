// Robust Hook Wrapper - Prevents Infinite Loops and Manages Dependencies
import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { architectureService } from '../services/ArchitectureService';

// Hook execution tracker to prevent infinite loops
class HookExecutionTracker {
  constructor() {
    this.executions = new Map(); // hookId -> execution count
    this.timeWindows = new Map(); // hookId -> timestamps
    this.warnings = new Map();   // hookId -> warning count
  }

  shouldExecute(hookId, maxExecutionsPerSecond = 10) {
    const now = Date.now();
    const windowSize = 1000; // 1 second
    
    if (!this.timeWindows.has(hookId)) {
      this.timeWindows.set(hookId, []);
      this.executions.set(hookId, 0);
    }

    const timestamps = this.timeWindows.get(hookId);
    const currentCount = this.executions.get(hookId);

    // Clean old timestamps
    const validTimestamps = timestamps.filter(time => now - time < windowSize);
    this.timeWindows.set(hookId, validTimestamps);

    // Check if we're exceeding the limit
    if (validTimestamps.length >= maxExecutionsPerSecond) {
      const warningCount = this.warnings.get(hookId) || 0;
      
      if (warningCount < 3) { // Only warn 3 times to avoid spam
        console.warn(`🚨 Hook execution limit reached for ${hookId}. Possible infinite loop detected!`);
        console.warn(`Executed ${validTimestamps.length} times in the last ${windowSize}ms`);
        this.warnings.set(hookId, warningCount + 1);
      }
      
      return false;
    }

    // Record this execution
    validTimestamps.push(now);
    this.executions.set(hookId, currentCount + 1);
    
    return true;
  }

  reset(hookId) {
    this.executions.delete(hookId);
    this.timeWindows.delete(hookId);
    this.warnings.delete(hookId);
  }

  getStats() {
    return {
      totalHooks: this.executions.size,
      executions: Object.fromEntries(this.executions),
      warnings: Object.fromEntries(this.warnings)
    };
  }
}

const hookTracker = new HookExecutionTracker();

// Stable dependency comparator
function areDependenciesEqual(prevDeps, nextDeps) {
  if (prevDeps === null || nextDeps === null) return false;
  if (prevDeps.length !== nextDeps.length) return false;
  
  for (let i = 0; i < prevDeps.length; i++) {
    if (prevDeps[i] !== nextDeps[i]) {
      return false;
    }
  }
  
  return true;
}

// Enhanced useEffect with loop prevention
export function useRobustEffect(effect, dependencies, options = {}) {
  const {
    hookId = `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    maxExecutionsPerSecond = 5,
    debounceMs = 0,
    onLoopDetected = null
  } = options;

  const prevDepsRef = useRef(null);
  const executionCountRef = useRef(0);
  const debounceTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // Analyze dependencies for potential issues
  const dependencyAnalysis = useMemo(() => {
    return architectureService.analyzeHookDependencies(hookId, dependencies || []);
  }, [hookId, dependencies]);

  // Log warnings for potential issues
  useEffect(() => {
    if (dependencyAnalysis.potentialIssues.length > 0) {
      console.warn(`⚠️ Potential dependency issues detected in ${hookId}:`, dependencyAnalysis.potentialIssues);
    }
  }, [hookId, dependencyAnalysis]);

  useEffect(() => {
    // Check if we should execute
    if (!hookTracker.shouldExecute(hookId, maxExecutionsPerSecond)) {
      if (onLoopDetected) {
        onLoopDetected(hookId, executionCountRef.current);
      }
      return;
    }

    // Clear previous debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Execute with optional debouncing
    const executeEffect = () => {
      if (!mountedRef.current) return;

      executionCountRef.current++;
      
      try {
        const startTime = performance.now();
        const cleanup = effect();
        const executionTime = performance.now() - startTime;
        
        // Track performance
        architectureService.trackHookExecution(hookId, executionTime);
        
        // Store previous dependencies
        prevDepsRef.current = dependencies;
        
        return cleanup;
      } catch (error) {
        architectureService.logError(error, {
          hookId,
          hookType: 'useRobustEffect',
          dependencies: dependencies?.map((dep, i) => ({ index: i, type: typeof dep })),
          executionCount: executionCountRef.current
        });
        throw error;
      }
    };

    if (debounceMs > 0) {
      debounceTimeoutRef.current = setTimeout(executeEffect, debounceMs);
      return () => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    } else {
      return executeEffect();
    }

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
    };
  }, dependencies);

  // Reset tracking on unmount
  useEffect(() => {
    return () => {
      hookTracker.reset(hookId);
      mountedRef.current = false;
    };
  }, [hookId]);
}

// Enhanced useCallback with stability checks
export function useRobustCallback(callback, dependencies, options = {}) {
  const {
    hookId = `callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    trackPerformance = false
  } = options;

  const analysisRef = useRef(null);

  // Analyze dependencies
  const dependencyAnalysis = useMemo(() => {
    const analysis = architectureService.analyzeHookDependencies(hookId, dependencies || []);
    analysisRef.current = analysis;
    return analysis;
  }, [hookId, dependencies]);

  // Create stable callback
  const stableCallback = useCallback((...args) => {
    if (trackPerformance) {
      const startTime = performance.now();
      const result = callback(...args);
      const executionTime = performance.now() - startTime;
      architectureService.trackHookExecution(hookId, executionTime);
      return result;
    } else {
      return callback(...args);
    }
  }, dependencies);

  // Mark as memoized for stability detection
  stableCallback.__memoized__ = true;
  stableCallback.__hookId__ = hookId;
  stableCallback.__dependencies__ = dependencies;

  return stableCallback;
}

// Enhanced useMemo with dependency analysis
export function useRobustMemo(factory, dependencies, options = {}) {
  const {
    hookId = `memo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    trackPerformance = false
  } = options;

  // Analyze dependencies
  const dependencyAnalysis = useMemo(() => {
    return architectureService.analyzeHookDependencies(hookId, dependencies || []);
  }, [hookId, dependencies]);

  // Create memoized value
  const memoizedValue = useMemo(() => {
    if (trackPerformance) {
      const startTime = performance.now();
      const result = factory();
      const executionTime = performance.now() - startTime;
      architectureService.trackHookExecution(hookId, executionTime);
      
      // Mark result as memoized if it's an object
      if (typeof result === 'object' && result !== null) {
        result.__memoized__ = true;
        result.__hookId__ = hookId;
      }
      
      return result;
    } else {
      const result = factory();
      
      // Mark result as memoized if it's an object
      if (typeof result === 'object' && result !== null) {
        result.__memoized__ = true;
        result.__hookId__ = hookId;
      }
      
      return result;
    }
  }, dependencies);

  return memoizedValue;
}

// Safe data loading hook with error handling
export function useRobustDataLoader(dataLoader, dependencies, options = {}) {
  const {
    hookId = `dataLoader_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    retryCount = 3,
    fallbackData = null,
    cacheKey = null
  } = options;

  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastLoadTime, setLastLoadTime] = useState(null);

  const loadData = useRobustCallback(async () => {
    if (!hookTracker.shouldExecute(hookId, 2)) {
      console.warn(`Data loading throttled for ${hookId}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await architectureService.retryOperation(
        `${hookId}_load`,
        dataLoader,
        retryCount
      );

      if (result && result.success !== false) {
        setData(result);
        setLastLoadTime(Date.now());
      } else {
        throw new Error(result.error || 'Data loading failed');
      }
    } catch (err) {
      setError(err);
      architectureService.logError(err, {
        hookId,
        dataLoader: dataLoader.name || 'anonymous',
        cacheKey,
        retryCount
      });
      
      // Use fallback data if available
      if (fallbackData !== null) {
        setData(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  }, [hookId, dataLoader, retryCount, fallbackData, cacheKey]);

  // Load data when dependencies change
  useRobustEffect(() => {
    loadData();
  }, dependencies, {
    hookId: `${hookId}_effect`,
    maxExecutionsPerSecond: 2,
    debounceMs: 100
  });

  const refresh = useRobustCallback(() => {
    return loadData();
  }, [loadData], { hookId: `${hookId}_refresh` });

  return {
    data,
    loading,
    error,
    refresh,
    lastLoadTime: lastLoadTime ? new Date(lastLoadTime) : null
  };
}

// Hook to monitor and debug other hooks
export function useHookDebugger(hookName, dependencies) {
  const renderCount = useRef(0);
  const prevDependencies = useRef();

  renderCount.current++;

  useEffect(() => {
    console.group(`🔍 Hook Debug: ${hookName}`);
    console.log(`Render #${renderCount.current}`);
    
    if (prevDependencies.current) {
      console.log('Previous dependencies:', prevDependencies.current);
      console.log('Current dependencies:', dependencies);
      
      const changed = dependencies.map((dep, index) => ({
        index,
        changed: prevDependencies.current[index] !== dep,
        prev: prevDependencies.current[index],
        current: dep
      })).filter(item => item.changed);

      if (changed.length > 0) {
        console.log('Changed dependencies:', changed);
      } else {
        console.log('No dependencies changed');
      }
    } else {
      console.log('Initial render - dependencies:', dependencies);
    }
    
    console.groupEnd();

    prevDependencies.current = dependencies;
  });

  return { renderCount: renderCount.current };
}

// Get hook execution statistics
export function getHookStats() {
  return {
    tracker: hookTracker.getStats(),
    architecture: architectureService.getHealthReport()
  };
}

// Reset all hook tracking (useful for testing)
export function resetHookTracking() {
  hookTracker.executions.clear();
  hookTracker.timeWindows.clear();
  hookTracker.warnings.clear();
}

export default {
  useRobustEffect,
  useRobustCallback,
  useRobustMemo,
  useRobustDataLoader,
  useHookDebugger,
  getHookStats,
  resetHookTracking
};