// File: src/hooks/useRealtimeData.js
// React hooks for real-time data with hybrid Firestore/Realtime DB approach

import { useState, useEffect, useCallback, useRef } from 'react';
import { hybridDataService } from '../services/HybridDataService';
import { monitorConnection } from '../config/realtime-firebase';

// Hook for real-time operator status
export function useOperatorStatus(operatorId = null) {
  const [operatorStatuses, setOperatorStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const handleStatusUpdate = (snapshot) => {
      setLoading(false);
      
      if (snapshot.exists()) {
        if (operatorId) {
          // Single operator
          setOperatorStatuses({ [operatorId]: snapshot.val() });
        } else {
          // All operators
          setOperatorStatuses(snapshot.val() || {});
        }
      } else {
        setOperatorStatuses(operatorId ? {} : {});
      }
    };

    // Subscribe to real-time updates
    unsubscribeRef.current = hybridDataService.subscribeToOperatorStatus(
      operatorId,
      handleStatusUpdate
    );

    // Monitor connection status
    const connectionUnsubscribe = monitorConnection(setConnected);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      connectionUnsubscribe();
    };
  }, [operatorId]);

  const updateStatus = useCallback(async (statusData) => {
    if (operatorId) {
      return hybridDataService.updateOperatorStatus(operatorId, statusData);
    }
  }, [operatorId]);

  return {
    operatorStatuses,
    loading,
    connected,
    updateStatus
  };
}

// Hook for real-time work progress
export function useWorkProgress(workId = null) {
  const [workProgress, setWorkProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const handleProgressUpdate = (snapshot) => {
      setLoading(false);
      
      if (snapshot.exists()) {
        if (workId) {
          setWorkProgress({ [workId]: snapshot.val() });
        } else {
          setWorkProgress(snapshot.val() || {});
        }
      } else {
        setWorkProgress({});
      }
    };

    unsubscribeRef.current = hybridDataService.subscribeToWorkProgress(
      workId,
      handleProgressUpdate
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [workId]);

  const updateProgress = useCallback(async (progressData) => {
    if (workId) {
      return hybridDataService.updateWorkProgress(workId, progressData);
    }
  }, [workId]);

  return {
    workProgress,
    loading,
    updateProgress
  };
}

// Hook for real-time live metrics
export function useLiveMetrics() {
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const handleMetricsUpdate = (snapshot) => {
      setLoading(false);
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        setMetrics(data);
        setLastUpdated(new Date(data.lastUpdated));
      } else {
        setMetrics({});
      }
    };

    unsubscribeRef.current = hybridDataService.subscribeToLiveMetrics(handleMetricsUpdate);

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  const updateMetrics = useCallback(async (metricsData) => {
    return hybridDataService.updateLiveMetrics(metricsData);
  }, []);

  return {
    metrics,
    loading,
    lastUpdated,
    updateMetrics
  };
}

// Hook for real-time station status
export function useStationStatus(stationId = null) {
  const [stationStatuses, setStationStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    const handleStationUpdate = (snapshot) => {
      setLoading(false);
      
      if (snapshot.exists()) {
        if (stationId) {
          setStationStatuses({ [stationId]: snapshot.val() });
        } else {
          setStationStatuses(snapshot.val() || {});
        }
      } else {
        setStationStatuses({});
      }
    };

    unsubscribeRef.current = hybridDataService.subscribeToStationStatus(
      stationId,
      handleStationUpdate
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [stationId]);

  const updateStationStatus = useCallback(async (statusData) => {
    if (stationId) {
      return hybridDataService.updateStationStatus(stationId, statusData);
    }
  }, [stationId]);

  return {
    stationStatuses,
    loading,
    updateStationStatus
  };
}

// Hook for real-time notifications
export function useRealtimeNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const handleNotificationsUpdate = (notificationsArray) => {
      setLoading(false);
      setNotifications(notificationsArray);
      setUnreadCount(notificationsArray.filter(n => !n.read).length);
    };

    unsubscribeRef.current = hybridDataService.subscribeToNotifications(
      userId,
      handleNotificationsUpdate
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userId]);

  const sendNotification = useCallback(async (notificationData) => {
    return hybridDataService.sendRealtimeNotification(notificationData);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    sendNotification
  };
}

// Hook for hybrid dashboard data (Firestore + Realtime DB)
export function useHybridDashboard() {
  const [dashboardData, setDashboardData] = useState({
    operatorProfiles: [],
    operatorStatuses: {},
    liveMetrics: {},
    stationStatuses: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Real-time subscriptions for live data
  const { operatorStatuses } = useOperatorStatus();
  const { metrics } = useLiveMetrics();
  const { stationStatuses } = useStationStatus();

  // Load initial hybrid data
  useEffect(() => {
    const loadHybridData = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await hybridDataService.getHybridDashboardData();
        
        if (result.success) {
          setDashboardData(result.data);
          setLastUpdated(new Date());
          console.log(`📊 Hybrid dashboard data loaded (cache: ${result.data.fromCache})`);
        } else {
          throw new Error(result.error);
        }
      } catch (err) {
        console.error('❌ Error loading hybrid dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadHybridData();
  }, []);

  // Update dashboard data when real-time data changes
  useEffect(() => {
    setDashboardData(prev => ({
      ...prev,
      operatorStatuses,
      liveMetrics: metrics,
      stationStatuses
    }));
  }, [operatorStatuses, metrics, stationStatuses]);

  return {
    dashboardData,
    loading,
    error,
    lastUpdated
  };
}

// Hook for connection monitoring
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionStats, setConnectionStats] = useState({});

  useEffect(() => {
    const unsubscribe = monitorConnection((connected) => {
      setIsConnected(connected);
      console.log(`🔗 Realtime DB connection: ${connected ? 'connected' : 'disconnected'}`);
    });

    // Update connection stats
    const updateStats = () => {
      setConnectionStats(hybridDataService.getConnectionStats());
    };

    updateStats();
    const statsInterval = setInterval(updateStats, 30000); // Update every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(statsInterval);
    };
  }, []);

  return {
    isConnected,
    connectionStats
  };
}