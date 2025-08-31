// File: src/hooks/useOptimizedData.js
// Optimized data fetching hook with intelligent caching and reduced Firestore reads

import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheService } from '../services/CacheService';

// Custom hook for optimized data fetching with caching
export function useOptimizedData(dataType, options = {}) {
  const {
    autoRefresh = false,
    refreshInterval = 300000, // 5 minutes default
    immediate = true,
    timeout = 10000, // 10 second default timeout
    onError = null
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchData = useCallback(async (useCache = true) => {
    if (!mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Data fetch timeout')), timeout)
      );

      let dataPromise;
      
      switch (dataType) {
        case 'operators':
          dataPromise = cacheService.getOperators(useCache);
          break;
        case 'supervisors':
          dataPromise = cacheService.getSupervisors(useCache);
          break;
        case 'management':
          dataPromise = cacheService.getManagement(useCache);
          break;
        case 'all_users':
          dataPromise = cacheService.getAllUsers(useCache);
          break;
        case 'article_templates':
          dataPromise = cacheService.getArticleTemplates(useCache);
          break;
        case 'machine_configs':
          dataPromise = cacheService.getMachineConfigs(useCache);
          break;
        default:
          dataPromise = cacheService.getCollection(dataType, useCache);
      }

      // Race between data fetch and timeout
      const result = await Promise.race([dataPromise, timeoutPromise]);

      if (!mountedRef.current) return;

      if (result.success) {
        setData(result.data);
        setLastUpdated(new Date());
        
        // Log cache performance
        if (result.fromCache) {
          console.log(`📋 Cache hit for ${dataType}: ${result.data.length} items`);
        } else {
          console.log(`🔥 Fresh data for ${dataType}: ${result.data.length} items`);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      console.error(`❌ Error fetching ${dataType}:`, err);
      setError(err.message);
      
      if (onError) {
        onError(err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [dataType, timeout, onError]);

  // Force refresh (bypass cache)
  const refresh = useCallback(() => {
    console.log(`🔄 Force refreshing ${dataType}`);
    return fetchData(false);
  }, [fetchData, dataType]);

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        console.log(`⏰ Auto-refreshing ${dataType}`);
        fetchData(true); // Use cache for auto-refresh
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchData, dataType]);

  // Initial data load
  useEffect(() => {
    if (immediate) {
      fetchData(true);
    }
  }, [fetchData, immediate]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    refresh,
    refetch: () => fetchData(true)
  };
}

// Specialized hooks for common data types
export function useOperators(options = {}) {
  return useOptimizedData('operators', options);
}

export function useSupervisors(options = {}) {
  return useOptimizedData('supervisors', options);
}

export function useAllUsers(options = {}) {
  return useOptimizedData('all_users', options);
}

export function useArticleTemplates(options = {}) {
  return useOptimizedData('article_templates', options);
}

export function useMachineConfigs(options = {}) {
  return useOptimizedData('machine_configs', options);
}

// Hook for smart auto-refresh with user activity detection
export function useSmartRefresh(dataType, options = {}) {
  const {
    baseInterval = 300000, // 5 minutes
    activeInterval = 60000, // 1 minute when active
    inactiveMultiplier = 5 // 5x slower when inactive
  } = options;

  const [isActive, setIsActive] = useState(true);
  const [currentInterval, setCurrentInterval] = useState(activeInterval);
  const lastActivityRef = useRef(Date.now());

  // Track user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (!isActive) {
        setIsActive(true);
      }
    };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Check activity every minute
    const activityCheck = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      const shouldBeInactive = timeSinceActivity > 2 * 60 * 1000; // 2 minutes

      if (shouldBeInactive && isActive) {
        setIsActive(false);
        console.log(`💤 User inactive, slowing refresh for ${dataType}`);
      } else if (!shouldBeInactive && !isActive) {
        setIsActive(true);
        console.log(`⚡ User active, speeding up refresh for ${dataType}`);
      }
    }, 60000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(activityCheck);
    };
  }, [isActive, dataType]);

  // Update refresh interval based on activity
  useEffect(() => {
    const newInterval = isActive ? activeInterval : baseInterval * inactiveMultiplier;
    setCurrentInterval(newInterval);
  }, [isActive, activeInterval, baseInterval, inactiveMultiplier]);

  return useOptimizedData(dataType, {
    ...options,
    autoRefresh: true,
    refreshInterval: currentInterval
  });
}