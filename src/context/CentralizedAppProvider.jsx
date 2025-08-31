// Centralized App Provider
// Bridges existing contexts with new centralized store

import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { useSystem } from './SystemContext';
import { useLanguage } from './LanguageContext';
import { useAppStore } from '../store/AppStore';
import { errorHandlingService } from '../services/ErrorHandlingService';
import { realtimeSubscriptionManager } from '../services/RealtimeSubscriptionManager';

// Provider component that syncs contexts with centralized store
export const CentralizedAppProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { showNotification } = useNotifications();
  const { systemSettings } = useSystem();
  const { currentLanguage } = useLanguage();
  
  const isNepali = currentLanguage === 'np';

  // Initialize services and centralized data when user is authenticated
  useEffect(() => {
    const initializeCentralizedData = async () => {
      if (!isAuthenticated || !user) return;

      console.log('🔄 Initializing centralized systems for user:', user.name);
      
      try {
        // Get actions directly from store to avoid re-render issues
        const { loadUsers, loadWorkItems, loadProductionStats } = useAppStore.getState();

        // Initialize error handling service
        errorHandlingService.initialize(
          { showNotification },
          user.id,
          isNepali
        );

        // Initialize real-time subscription manager with store reference
        realtimeSubscriptionManager.initialize(useAppStore);

        // Start real-time subscriptions
        realtimeSubscriptionManager.subscribeToUserData(user.id, user.role);
        realtimeSubscriptionManager.subscribeToSystemData();

        // Load initial data in parallel
        await Promise.all([
          loadUsers(),
          loadWorkItems(),
          loadProductionStats(),
        ]);
        
        console.log('✅ Centralized systems initialized successfully');
        showNotification(
          isNepali ? 'सिस्टम तयार छ' : 'System ready', 
          'success'
        );
      } catch (error) {
        console.error('❌ Failed to initialize centralized systems:', error);
        
        // Use error handling service
        await errorHandlingService.handleError(error, {
          component: 'CentralizedAppProvider',
          action: 'initialization'
        });
      }
    };

    initializeCentralizedData();

    // Cleanup on unmount or user change
    return () => {
      if (user) {
        realtimeSubscriptionManager.unsubscribeFromUserData(user.id);
        console.log('🧹 Cleaned up centralized systems');
      }
    };
  }, [isAuthenticated, user, isNepali, showNotification]);

  // Sync system settings with centralized store
  useEffect(() => {
    if (systemSettings?.isLoaded) {
      const { updateSystemSettings } = useAppStore.getState();
      updateSystemSettings(systemSettings);
    }
  }, [systemSettings]);

  // Auto-refresh data periodically (every 5 minutes) for active users
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      console.log('🔄 Auto-refreshing centralized data...');
      try {
        const { loadUsers, loadWorkItems, loadProductionStats } = useAppStore.getState();
        await Promise.all([
          loadUsers(),
          loadWorkItems(),
          loadProductionStats(),
        ]);
        console.log('✅ Auto-refresh completed');
      } catch (error) {
        console.error('❌ Auto-refresh failed:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  return <>{children}</>;
};

// Hook to check centralized data status
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

export default CentralizedAppProvider;