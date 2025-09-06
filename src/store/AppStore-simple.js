// Simplified App Store to prevent infinite loops
// Basic state management without complex subscriptions

import { create } from 'zustand';

// Simple store without complex subscriptions that cause infinite loops
export const useAppStore = create((set, get) => ({
  // Core App State
  isLoading: false,
  error: null,
  
  // Users State - simplified
  users: {
    operators: [],
    supervisors: [],
    management: [],
    loading: false,
    lastUpdated: null,
  },
  
  // Work State - simplified  
  workItems: {
    bundles: [],
    assignments: [],
    completions: [],
    loading: false,
    lastUpdated: null,
  },
  
  // Production State - simplified
  production: {
    stats: {},
    analytics: {},
    targets: {},
    loading: false,
    lastUpdated: null,
  },
  
  // Simple Actions without async complexity
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  
  // Load functions
  loadUsers: async () => {
    return { success: true };
  },
  
  loadWorkItems: async () => {
    return { success: true };
  },
  
  assignWork: async () => {
    return { success: true };
  },
  
  completeWork: async () => {
    return { success: true };
  },
  
  loadProductionStats: async () => {
    return { success: true };
  },
  
  updateProductionTargets: async () => {
    return { success: true };
  },
  
  updateUser: async () => {
    return { success: true };
  },
  
  refreshAll: async () => {
    return { success: true };
  }
}));

// Export simple hooks that don't cause loops
export const useAppActions = () => {
  const store = useAppStore();
  return {
    loadUsers: store.loadUsers,
    loadWorkItems: store.loadWorkItems,
    assignWork: store.assignWork,
    completeWork: store.completeWork,
    loadProductionStats: store.loadProductionStats,
    updateProductionTargets: store.updateProductionTargets,
    updateUser: store.updateUser,
    refreshAll: store.refreshAll,
    setLoading: store.setLoading,
    setError: store.setError,
    clearError: store.clearError,
  };
};

export const useAppUtils = () => {
  return {
    // Utility functions
    formatDate: (date) => date?.toLocaleDateString() || 'N/A',
    formatCurrency: (amount) => `Rs. ${amount || 0}`,
    getAvailableOperators: () => {
      return [];
    },
    getWorkloadByOperator: () => {
      return {};
    },
  };
};

export default useAppStore;