// Centralized Data Hooks
// Custom hooks for consistent data access across components

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppStore, useAppActions, useAppUtils } from '../store/AppStore';
import { dataService } from '../services/DataService';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

// Main app data hook
export const useAppData = () => {
  const store = useAppStore();
  const actions = useAppActions();
  const utils = useAppUtils();
  
  const initializeApp = useCallback(async () => {
    try {
      await actions.refreshAll();
    } catch (error) {
      console.error('Failed to initialize app data:', error);
      actions.setError('Failed to load application data');
    }
  }, [actions]);
  
  return {
    ...store,
    ...actions,
    ...utils,
    initializeApp,
  };
};

// User management hooks
export const useUsers = () => {
  const { users } = useAppStore();
  const { loadUsers, updateUser } = useAppActions();
  const [localLoading, setLocalLoading] = useState(false);
  
  useEffect(() => {
    if (!users.lastUpdated) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users.lastUpdated]); // loadUsers is stable but causes infinite loop in dependency array
  
  const refreshUsers = useCallback(async () => {
    setLocalLoading(true);
    try {
      await loadUsers();
    } finally {
      setLocalLoading(false);
    }
  }, [loadUsers]);
  
  const getUserById = useCallback((id) => {
    const operators = (users && users.operators) ? users.operators : [];
    const supervisors = (users && users.supervisors) ? users.supervisors : [];
    const management = (users && users.management) ? users.management : [];
    const allUsers = [...operators, ...supervisors, ...management];
    return allUsers.find(user => user.id === id);
  }, [users]);
  
  const getUsersByRole = useCallback((role) => {
    if (!users) return [];
    
    switch (role) {
      case 'operator':
        return users.operators || [];
      case 'supervisor':
        return users.supervisors || [];
      case 'management':
      case 'manager':
      case 'admin':
        return users.management || [];
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
    // Ensure operators, supervisors, management are always arrays
    operators: users.operators || [],
    supervisors: users.supervisors || [],
    management: users.management || []
  };
};

// Work management hooks
export const useWorkManagement = () => {
  const { workItems } = useAppStore();
  const { loadWorkItems, assignWork, completeWork } = useAppActions();
  const { getAvailableOperators, getWorkloadByOperator } = useAppUtils();
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  
  const [localLoading, setLocalLoading] = useState(false);
  
  useEffect(() => {
    if (!workItems.lastUpdated) {
      loadWorkItems();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workItems.lastUpdated]); // loadWorkItems is stable but causes infinite loop in dependency array
  
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
    if (!user) return [];
    return workItems.assignments.filter(assignment => 
      assignment.operatorId === user.id && 
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

// Production analytics hooks
export const useProductionAnalytics = () => {
  const { production } = useAppStore();
  const { loadProductionStats, updateProductionTargets } = useAppActions();
  
  const [localLoading, setLocalLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  
  useEffect(() => {
    if (!production.lastUpdated) {
      loadProductionStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [production.lastUpdated]); // loadProductionStats is stable but causes infinite loop in dependency array
  
  const refreshStats = useCallback(async () => {
    setLocalLoading(true);
    try {
      await loadProductionStats();
    } finally {
      setLocalLoading(false);
    }
  }, [loadProductionStats]);
  
  const getEfficiencyTrend = useCallback(() => {
    // Calculate efficiency trend from analytics data
    const { analytics } = production;
    if (!analytics.operatorEfficiency) return [];
    
    return analytics.operatorEfficiency.map(op => ({
      operator: op.operatorName,
      efficiency: op.completionRate,
      pieces: op.totalPieces,
    }));
  }, [production]);
  
  const getTopPerformers = useCallback((limit = 5) => {
    const { analytics } = production;
    if (!analytics.operatorEfficiency) return [];
    
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
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const loadData = async () => {
      try {
        const result = await dataService.fetchCollection(collectionName, options);
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
      options
    );
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [collectionName, options]);
  
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await dataService.fetchCollection(collectionName, {
        ...options,
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
  }, [collectionName, options]);
  
  return { data, loading, error, refresh };
};

// Operator-specific hooks
export const useOperatorData = () => {
  const { user } = useAuth();
  const { getMyAssignments } = useWorkManagement();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const loadMyStats = useCallback(async () => {
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
  }, [user]);
  
  useEffect(() => {
    loadMyStats();
  }, [loadMyStats]);
  
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

// Supervisor-specific hooks
export const useSupervisorData = () => {
  const usersData = useUsers();
  const workData = useWorkManagement();
  const productionData = useProductionAnalytics();
  
  // Add safety checks for all data
  const users = usersData || {};
  const workItems = workData || {};
  const production = productionData || {};
  
  const getLineStatus = useCallback(() => {
    // Multiple layers of safety checks
    if (!users || typeof users !== 'object') {
      return { totalOperators: 0, busyOperators: 0, availableOperators: 0, utilizationRate: 0 };
    }
    if (!workItems || typeof workItems !== 'object') {
      return { totalOperators: 0, busyOperators: 0, availableOperators: 0, utilizationRate: 0 };
    }
    
    const operators = Array.isArray(users.operators) ? users.operators : [];
    const assignments = Array.isArray(workItems.assignments) ? workItems.assignments : [];
    
    const activeAssignments = assignments.filter(a => a && typeof a === 'object' && a.status === 'assigned');
    const busyOperators = activeAssignments.length;
    const availableOperators = operators.length - busyOperators;
    
    return {
      totalOperators: operators.length,
      busyOperators,
      availableOperators,
      utilizationRate: operators.length > 0 ? (busyOperators / operators.length) * 100 : 0,
    };
  }, [users, workItems]);
  
  const getPendingApprovals = useCallback(() => {
    if (!workItems || typeof workItems !== 'object') return [];
    const assignments = Array.isArray(workItems.assignments) ? workItems.assignments : [];
    return assignments.filter(a => a && typeof a === 'object' && a.status === 'pending_approval');
  }, [workItems]);
  
  const getQualityIssues = useCallback(() => {
    if (!workItems || typeof workItems !== 'object') return [];
    const completions = Array.isArray(workItems.completions) ? workItems.completions : [];
    return completions.filter(c => c && typeof c === 'object' && (c.quality || 100) < 95);
  }, [workItems]);
  
  const lineStatus = useMemo(() => getLineStatus(), [getLineStatus]);
  const pendingApprovals = useMemo(() => getPendingApprovals(), [getPendingApprovals]);
  const qualityIssues = useMemo(() => getQualityIssues(), [getQualityIssues]);
  const productionStats = useMemo(() => {
    if (!production || typeof production !== 'object') return {};
    return (production.stats && typeof production.stats === 'object') ? production.stats : {};
  }, [production]);

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

// Centralized status hook
export const useCentralizedStatus = () => {
  const { users, workItems, production, isLoading, error } = useAppStore();
  
  const isInitialized = !!(
    users.lastUpdated && 
    workItems.lastUpdated && 
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