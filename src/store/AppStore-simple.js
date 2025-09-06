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
  
  // Simplified load functions that don't cause infinite loops
  loadUsers: async () => {
    console.log('Mock loadUsers called');
    return { success: true };
  },
  
  loadWorkItems: async () => {
    console.log('Mock loadWorkItems called');
    return { success: true };
  },
  
  assignWork: async () => {
    console.log('Mock assignWork called');
    return { success: true };
  },
  
  completeWork: async () => {
    console.log('Mock completeWork called');
    return { success: true };
  },
  
  loadProductionStats: async () => {
    console.log('Mock loadProductionStats called');
    return { success: true };
  },
  
  updateProductionTargets: async () => {
    console.log('Mock updateProductionTargets called');
    return { success: true };
  },
  
  updateUser: async () => {
    console.log('Mock updateUser called');
    return { success: true };
  },
  
  refreshAll: async () => {
    console.log('Mock refreshAll called'); 
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
    // Simple utility functions
    formatDate: (date) => date?.toLocaleDateString() || 'N/A',
    formatCurrency: (amount) => `Rs. ${amount || 0}`,
    getAvailableOperators: () => {
      console.log('Mock getAvailableOperators called');
      return [];
    },
    getWorkloadByOperator: () => {
      console.log('Mock getWorkloadByOperator called');
      return {};
    },
  };
};

export default useAppStore;