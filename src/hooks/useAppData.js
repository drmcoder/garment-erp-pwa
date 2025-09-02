// Centralized Data Hooks
// Custom hooks for consistent data access across components

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRobustEffect, useRobustCallback } from './useRobustHook';
import { useAppStore, useAppActions, useAppUtils } from '../store/AppStore';
import { dataService } from '../services/DataService';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

// Main app data hook
export const useAppData = () => {
  const store = useAppStore();
  const actions = useAppActions();
  const utils = useAppUtils();
  
  // Memoize the initialize function to prevent infinite re-renders
  const initializeApp = useCallback(async () => {
    try {
      await actions.refreshAll();
    } catch (error) {
      console.error('Failed to initialize app data:', error);
      actions.setError('Failed to load application data');
    }
  }, []); // Remove actions from dependencies to break circular dependency
  
  return {
    ...store,
    ...actions,
    ...utils,
    initializeApp,
  };
};

// User management hooks - RESTORED WITH PROPER IMPLEMENTATION
export const useUsers = () => {
  const { users } = useAppStore();
  const { loadUsers, updateUser } = useAppActions();
  const [localLoading, setLocalLoading] = useState(false);
  const loadedRef = useRef(false);
  
  // Load users only once to prevent infinite loops
  useEffect(() => {
    if (!loadedRef.current && !users.lastUpdated && !users.loading) {
      loadedRef.current = true;
      loadUsers().catch(err => {
        console.error('Failed to load users:', err);
        loadedRef.current = false;
      });
    }
  }, []); // Empty deps - only run once
  
  const refreshUsers = useCallback(async () => {
    setLocalLoading(true);
    try {
      await loadUsers();
    } finally {
      setLocalLoading(false);
    }
  }, [loadUsers]);
  
  const getUserById = useCallback((id) => {
    if (!users) return null;
    const operators = users.operators || [];
    const supervisors = users.supervisors || [];
    const management = users.management || [];
    const allUsers = [...operators, ...supervisors, ...management];
    return allUsers.find(user => user.id === id);
  }, [users]);
  
  const getUsersByRole = useCallback((role) => {
    if (!users || typeof users !== 'object') return [];
    
    switch (role) {
      case 'operator':
        return Array.isArray(users.operators) ? users.operators : [];
      case 'supervisor':
        return Array.isArray(users.supervisors) ? users.supervisors : [];
      case 'management':
      case 'manager':
      case 'admin':
        return Array.isArray(users.management) ? users.management : [];
      default:
        return [];
    }
  }, [users]);
  
  return {
    ...users,
    loading: users.loading || localLoading,
    refreshUsers,
    updateUser,
    getUserById,
    getUsersByRole,
    allUsers: [
      ...(users.operators || []), 
      ...(users.supervisors || []), 
      ...(users.management || [])
    ],
    operators: users.operators || [],
    supervisors: users.supervisors || [],
    management: users.management || []
  };
};

// Work management hooks - RESTORED WITH PROPER IMPLEMENTATION
export const useWorkManagement = () => {
  const { workItems } = useAppStore();
  const { loadWorkItems, assignWork, completeWork } = useAppActions();
  const { getAvailableOperators, getWorkloadByOperator } = useAppUtils();
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  
  const [localLoading, setLocalLoading] = useState(false);
  const loadedRef = useRef(false);
  
  // Load work items only once to prevent infinite loops
  useEffect(() => {
    if (!loadedRef.current && !workItems.lastUpdated && !workItems.loading) {
      loadedRef.current = true;
      loadWorkItems().catch(err => {
        console.error('Failed to load work items:', err);
        loadedRef.current = false;
      });
    }
  }, []); // Empty deps - only run once
  
  const assignWorkToOperator = useCallback(async (operatorId, workData) => {
    setLocalLoading(true);
    try {
      const result = await assignWork(operatorId, workData);
      if (result.success) {
        showNotification(`Work assigned successfully`, 'success');
      }
      return result;
    } catch (error) {
      showNotification(`Failed to assign work: ${error.message}`, 'error');
      throw error;
    } finally {
      setLocalLoading(false);
    }
  }, [assignWork, showNotification]);
  
  const completeWorkAssignment = useCallback(async (assignmentId, completionData) => {
    setLocalLoading(true);
    try {
      const result = await completeWork(assignmentId, {
        ...completionData,
        operatorId: user?.id,
      });
      
      if (result.success) {
        showNotification(`Work completed successfully`, 'success');
      }
      return result;
    } catch (error) {
      showNotification(`Failed to complete work: ${error.message}`, 'error');
      throw error;
    } finally {
      setLocalLoading(false);
    }
  }, [completeWork, showNotification, user]);
  
  const getMyAssignments = useCallback(() => {
    if (!user || !workItems || !Array.isArray(workItems.assignments)) return [];
    return workItems.assignments.filter(assignment => 
      assignment && assignment.operatorId === user.id && 
      ['assigned', 'in_progress'].includes(assignment.status)
    );
  }, [workItems.assignments, user]);
  
  const refreshWorkItems = useCallback(async () => {
    setLocalLoading(true);
    try {
      await loadWorkItems();
    } finally {
      setLocalLoading(false);
    }
  }, [loadWorkItems]);
  
  return {
    ...workItems,
    loading: workItems.loading || localLoading,
    assignWork: assignWorkToOperator,
    completeWork: completeWorkAssignment,
    getAvailableOperators,
    getWorkloadByOperator,
    getMyAssignments,
    refreshWorkItems,
  };
};

// Production analytics hooks - RESTORED WITH PROPER IMPLEMENTATION
export const useProductionAnalytics = () => {
  const { production } = useAppStore();
  const { loadProductionStats, updateProductionTargets } = useAppActions();
  
  const [localLoading, setLocalLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const loadedRef = useRef(false);
  
  // Load production stats only once to prevent infinite loops
  useEffect(() => {
    if (!loadedRef.current && !production.lastUpdated && !production.loading) {
      loadedRef.current = true;
      loadProductionStats().catch(err => {
        console.error('Failed to load production stats:', err);
        loadedRef.current = false;
      });
    }
  }, []); // Empty deps - only run once
  
  const refreshStats = useCallback(async () => {
    setLocalLoading(true);
    try {
      await loadProductionStats();
    } finally {
      setLocalLoading(false);
    }
  }, [loadProductionStats]);
  
  const getEfficiencyTrend = useCallback(() => {
    const { analytics } = production;
    if (!analytics?.operatorEfficiency) return [];
    
    return analytics.operatorEfficiency.map(op => ({
      operator: op.operatorName,
      efficiency: op.completionRate,
      pieces: op.totalPieces,
    }));
  }, [production]);
  
  const getTopPerformers = useCallback((limit = 5) => {
    const { analytics } = production;
    if (!analytics?.operatorEfficiency) return [];
    
    return analytics.operatorEfficiency
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, limit);
  }, [production]);
  
  return {
    ...production,
    loading: production.loading || localLoading,
    dateRange,
    setDateRange,
    refreshStats,
    updateTargets: updateProductionTargets,
    getEfficiencyTrend,
    getTopPerformers,
  };
};

// Real-time data hook
export const useRealTimeData = (collectionName, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  
  // Memoize options to prevent infinite re-renders
  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)]);
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const loadData = async () => {
      try {
        const result = await dataService.fetchCollection(collectionName, memoizedOptions);
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    
    // Set up real-time subscription (when implemented)
    unsubscribeRef.current = dataService.subscribeToCollection(
      collectionName,
      (newData) => setData(newData),
      memoizedOptions
    );
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [collectionName, memoizedOptions]);
  
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await dataService.fetchCollection(collectionName, {
        ...memoizedOptions,
        maxAge: 0, // Force fresh data
      });
      
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [collectionName, memoizedOptions]);
  
  return { data, loading, error, refresh };
};

// Operator-specific hooks
export const useOperatorData = () => {
  const { user } = useAuth();
  const { getMyAssignments } = useWorkManagement();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const loadMyStats = useRobustCallback(async () => {
    if (!user || user.role !== 'operator') return;
    
    setLoading(true);
    try {
      const result = await dataService.getOperatorStats(user.id);
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load operator stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user], { hookId: 'useOperatorData_loadStatsCallback' });
  
  useRobustEffect(() => {
    loadMyStats();
  }, [user?.id], { 
    hookId: 'useOperatorData_statsEffect',
    maxExecutionsPerSecond: 1,
    debounceMs: 200 
  });
  
  const myAssignments = getMyAssignments();
  const hasActiveWork = myAssignments.length > 0;
  
  return {
    stats,
    loading,
    myAssignments,
    hasActiveWork,
    refreshStats: loadMyStats,
  };
};

// Supervisor-specific hooks - RESTORED WITH PROPER IMPLEMENTATION
export const useSupervisorData = () => {
  // Get data directly from store with proper selectors
  const users = useAppStore(state => state.users);
  const workItems = useAppStore(state => state.workItems);
  const production = useAppStore(state => state.production);
  
  // Simple state checks without complex memoization that can cause loops
  const safeUsers = users && typeof users === 'object' ? {
    ...users,
    operators: Array.isArray(users.operators) ? users.operators : []
  } : { operators: [], supervisors: [], management: [] };
  
  const safeWorkItems = workItems && typeof workItems === 'object' ? {
    ...workItems,
    assignments: Array.isArray(workItems.assignments) ? workItems.assignments : []
  } : { assignments: [], bundles: [], completions: [] };
  
  const safeProduction = production && typeof production === 'object' ? production : { stats: {}, analytics: {}, targets: {} };
  
  // Direct calculations without complex memoization to prevent infinite loops
  const getLineStatus = () => {
    const operators = Array.isArray(safeUsers.operators) ? safeUsers.operators : [];
    const assignments = Array.isArray(safeWorkItems.assignments) ? safeWorkItems.assignments : [];
    
    const activeAssignments = assignments.filter(a => a && typeof a === 'object' && a.status === 'assigned');
    const busyOperators = activeAssignments.length;
    const availableOperators = operators.length - busyOperators;
    
    return {
      totalOperators: operators.length,
      busyOperators,
      availableOperators,
      utilizationRate: operators.length > 0 ? (busyOperators / operators.length) * 100 : 0,
    };
  };
  
  const getPendingApprovals = () => {
    const assignments = Array.isArray(safeWorkItems.assignments) ? safeWorkItems.assignments : [];
    return assignments.filter(a => a && typeof a === 'object' && a.status === 'pending_approval');
  };
  
  const getQualityIssues = () => {
    const completions = Array.isArray(safeWorkItems.completions) ? safeWorkItems.completions : [];
    return completions.filter(c => c && typeof c === 'object' && (c.quality || 100) < 95);
  };
  
  const lineStatus = getLineStatus();
  const pendingApprovals = getPendingApprovals();
  const qualityIssues = getQualityIssues();
  const productionStats = (safeProduction.stats && typeof safeProduction.stats === 'object') ? safeProduction.stats : {};

  return {
    lineStatus,
    pendingApprovals,
    qualityIssues,
    productionStats,
  };
};

// Data persistence hook
export const useDataPersistence = () => {
  const { showNotification } = useNotifications();
  
  const saveToCache = useCallback(async (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);
  
  const loadFromCache = useCallback((key, maxAge = 5 * 60 * 1000) => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return { success: false, error: 'No cached data' };
      
      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;
      
      if (age > maxAge) {
        return { success: false, error: 'Cached data expired' };
      }
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);
  
  const clearCache = useCallback((pattern = null) => {
    try {
      if (pattern) {
        Object.keys(localStorage).forEach(key => {
          if (key.includes(pattern)) {
            localStorage.removeItem(key);
          }
        });
      } else {
        localStorage.clear();
      }
      showNotification('Cache cleared successfully', 'success');
    } catch (error) {
      showNotification('Failed to clear cache', 'error');
    }
  }, [showNotification]);
  
  return { saveToCache, loadFromCache, clearCache };
};

// Centralized status hook - RESTORED WITH PROPER IMPLEMENTATION
export const useCentralizedStatus = () => {
  const { users, workItems, production, isLoading, error } = useAppStore();
  
  const isInitialized = !!(
    users.lastUpdated || 
    workItems.lastUpdated || 
    production.lastUpdated
  );
  
  const isReady = isInitialized && !isLoading && !error;
  
  return {
    isInitialized,
    isReady,
    isLoading,
    error,
    lastUpdated: {
      users: users.lastUpdated,
      workItems: workItems.lastUpdated,
      production: production.lastUpdated,
    }
  };
};

export default useAppData;