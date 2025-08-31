// Central Application Store
// Centralized state management and business logic

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import { cacheService } from '../services/CacheService';
import { ActivityLogService } from '../services/firebase-services';

// Central data store
export const useAppStore = create(
  subscribeWithSelector((set, get) => ({
    // Core App State
    isLoading: false,
    error: null,
    
    // Users State
    users: {
      operators: [],
      supervisors: [],
      management: [],
      loading: false,
      lastUpdated: null,
    },
    
    // Work State
    workItems: {
      bundles: [],
      assignments: [],
      completions: [],
      loading: false,
      lastUpdated: null,
    },
    
    // Production State
    production: {
      stats: {},
      analytics: {},
      targets: {},
      loading: false,
      lastUpdated: null,
    },
    
    // System State
    system: {
      currentLine: 'line-1',
      settings: {},
      features: {},
      loading: false,
    },
    
    // Actions
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    
    // User Management Actions
    loadUsers: async () => {
      const state = get();
      if (state.users.loading) return; // Prevent duplicate calls
      
      set((state) => ({ 
        users: { ...state.users, loading: true } 
      }));
      
      try {
        const result = await cacheService.getAllUsers();
        
        if (result.success) {
          const categorizedUsers = {
            operators: result.data.filter(u => u.role === 'operator'),
            supervisors: result.data.filter(u => u.role === 'supervisor'),
            management: result.data.filter(u => ['management', 'admin', 'manager'].includes(u.role)),
          };
          
          set((state) => ({
            users: {
              ...categorizedUsers,
              loading: false,
              lastUpdated: new Date().toISOString(),
            }
          }));
          
          return result;
        } else {
          throw new Error('Failed to load users');
        }
      } catch (error) {
        set((state) => ({ 
          users: { ...state.users, loading: false },
          error: error.message 
        }));
        throw error;
      }
    },
    
    updateUser: async (userId, updates) => {
      try {
        set({ isLoading: true });
        
        // Update in cache service
        const result = await cacheService.updateUser(userId, updates);
        
        if (result.success) {
          // Update local state
          set((state) => {
            const updateUserInCategory = (users) => 
              users.map(user => user.id === userId ? { ...user, ...updates } : user);
            
            return {
              users: {
                ...state.users,
                operators: updateUserInCategory(state.users.operators),
                supervisors: updateUserInCategory(state.users.supervisors),
                management: updateUserInCategory(state.users.management),
              },
              isLoading: false,
            };
          });
          
          // Log activity
          await ActivityLogService.logActivity(userId, 'user_updated', { updates });
          
          return result;
        } else {
          throw new Error(result.error || 'Failed to update user');
        }
      } catch (error) {
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },
    
    // Work Management Actions
    loadWorkItems: async () => {
      const state = get();
      if (state.workItems.loading) return;
      
      set((state) => ({ 
        workItems: { ...state.workItems, loading: true } 
      }));
      
      try {
        const [bundlesResult, assignmentsResult] = await Promise.all([
          cacheService.getAllBundles(),
          cacheService.getWorkAssignments(),
        ]);
        
        set((state) => ({
          workItems: {
            bundles: bundlesResult.success ? bundlesResult.data : [],
            assignments: assignmentsResult.success ? assignmentsResult.data : [],
            completions: [], // Will be loaded separately
            loading: false,
            lastUpdated: new Date().toISOString(),
          }
        }));
        
        return { success: true };
      } catch (error) {
        set((state) => ({ 
          workItems: { ...state.workItems, loading: false },
          error: error.message 
        }));
        throw error;
      }
    },
    
    assignWork: async (operatorId, workData) => {
      try {
        set({ isLoading: true });
        
        // Business logic for work assignment
        const assignment = {
          id: `assignment_${Date.now()}`,
          operatorId,
          workData,
          assignedAt: new Date().toISOString(),
          status: 'assigned',
        };
        
        // Save assignment
        const result = await cacheService.createWorkAssignment(assignment);
        
        if (result.success) {
          // Update local state
          set((state) => ({
            workItems: {
              ...state.workItems,
              assignments: [...state.workItems.assignments, assignment],
            },
            isLoading: false,
          }));
          
          // Log activity
          await ActivityLogService.logActivity(operatorId, 'work_assigned', { workData });
          
          return { success: true, assignment };
        } else {
          throw new Error(result.error || 'Failed to assign work');
        }
      } catch (error) {
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },
    
    completeWork: async (assignmentId, completionData) => {
      try {
        set({ isLoading: true });
        
        // Business logic for work completion
        const completion = {
          id: `completion_${Date.now()}`,
          assignmentId,
          ...completionData,
          completedAt: new Date().toISOString(),
          status: 'completed',
        };
        
        // Save completion
        const result = await cacheService.createWorkCompletion(completion);
        
        if (result.success) {
          // Update local state
          set((state) => ({
            workItems: {
              ...state.workItems,
              assignments: state.workItems.assignments.map(assignment =>
                assignment.id === assignmentId 
                  ? { ...assignment, status: 'completed', completedAt: completion.completedAt }
                  : assignment
              ),
              completions: [...state.workItems.completions, completion],
            },
            isLoading: false,
          }));
          
          // Log activity
          await ActivityLogService.logActivity(
            completion.operatorId, 
            'work_completed', 
            { assignmentId, completionData }
          );
          
          return { success: true, completion };
        } else {
          throw new Error(result.error || 'Failed to complete work');
        }
      } catch (error) {
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },
    
    // Production Analytics Actions
    loadProductionStats: async () => {
      const state = get();
      if (state.production.loading) return;
      
      set((state) => ({ 
        production: { ...state.production, loading: true } 
      }));
      
      try {
        // Calculate production statistics from work data
        const { workItems, users } = get();
        
        const stats = calculateProductionStats(workItems, users);
        const analytics = calculateAnalytics(workItems, users);
        
        set((state) => ({
          production: {
            stats,
            analytics,
            targets: state.production.targets, // Keep existing targets
            loading: false,
            lastUpdated: new Date().toISOString(),
          }
        }));
        
        return { success: true, stats, analytics };
      } catch (error) {
        set((state) => ({ 
          production: { ...state.production, loading: false },
          error: error.message 
        }));
        throw error;
      }
    },
    
    updateProductionTargets: async (targets) => {
      try {
        set({ isLoading: true });
        
        // Save targets to cache
        const result = await cacheService.saveProductionTargets(targets);
        
        if (result.success) {
          set((state) => ({
            production: {
              ...state.production,
              targets,
            },
            isLoading: false,
          }));
          
          return { success: true };
        } else {
          throw new Error(result.error || 'Failed to update targets');
        }
      } catch (error) {
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },
    
    // System Configuration Actions
    updateSystemSettings: async (settings) => {
      try {
        set({ isLoading: true });
        
        set((state) => ({
          system: {
            ...state.system,
            settings: { ...state.system.settings, ...settings },
          },
          isLoading: false,
        }));
        
        // Persist to localStorage
        localStorage.setItem('systemSettings', JSON.stringify(settings));
        
        return { success: true };
      } catch (error) {
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },
    
    // Utility Functions
    getOperatorsByMachine: (machineType) => {
      const { users } = get();
      return users.operators.filter(op => op.machine === machineType || op.speciality === machineType);
    },
    
    getAvailableOperators: () => {
      const { users, workItems } = get();
      const assignedOperatorIds = workItems.assignments
        .filter(a => a.status === 'assigned')
        .map(a => a.operatorId);
      
      return users.operators.filter(op => !assignedOperatorIds.includes(op.id));
    },
    
    getWorkloadByOperator: (operatorId) => {
      const { workItems } = get();
      return workItems.assignments.filter(a => 
        a.operatorId === operatorId && ['assigned', 'in_progress'].includes(a.status)
      );
    },
    
    // Data refresh actions
    refreshAll: async () => {
      const { loadUsers, loadWorkItems, loadProductionStats } = get();
      
      set({ isLoading: true });
      
      try {
        await Promise.all([
          loadUsers(),
          loadWorkItems(),
          loadProductionStats(),
        ]);
        
        set({ isLoading: false });
        return { success: true };
      } catch (error) {
        set({ isLoading: false, error: error.message });
        throw error;
      }
    },
  }))
);

// Helper functions for calculations
function calculateProductionStats(workItems, users) {
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate today's production
  const todayCompletions = workItems.completions.filter(c =>
    c.completedAt?.startsWith(today)
  );
  
  const totalPieces = todayCompletions.reduce((sum, c) => sum + (c.pieces || 0), 0);
  const totalOperators = users.operators.length;
  const activeOperators = workItems.assignments.filter(a => a.status === 'assigned').length;
  
  return {
    todayPieces: totalPieces,
    totalOperators,
    activeOperators,
    efficiency: totalOperators > 0 ? (activeOperators / totalOperators) * 100 : 0,
    hourlyRate: totalPieces > 0 ? totalPieces / 8 : 0, // Assuming 8-hour shifts
  };
}

function calculateAnalytics(workItems, users) {
  // Calculate efficiency by operator
  const operatorEfficiency = users.operators.map(operator => {
    const assignments = workItems.assignments.filter(a => a.operatorId === operator.id);
    const completions = workItems.completions.filter(c => c.operatorId === operator.id);
    
    return {
      operatorId: operator.id,
      operatorName: operator.name,
      totalAssignments: assignments.length,
      totalCompletions: completions.length,
      completionRate: assignments.length > 0 ? (completions.length / assignments.length) * 100 : 0,
      totalPieces: completions.reduce((sum, c) => sum + (c.pieces || 0), 0),
    };
  });
  
  return {
    operatorEfficiency,
    averageCompletionRate: operatorEfficiency.reduce((sum, op) => sum + op.completionRate, 0) / operatorEfficiency.length,
  };
}

// Selectors for commonly used data
export const useUsers = () => useAppStore((state) => state.users);
export const useWorkItems = () => useAppStore((state) => state.workItems);
export const useProduction = () => useAppStore((state) => state.production);
export const useSystem = () => useAppStore((state) => state.system);
export const useAppLoading = () => useAppStore((state) => state.isLoading);
export const useAppError = () => useAppStore((state) => state.error);

// Action selectors (use shallow comparison to prevent re-renders)
export const useAppActions = () => {
  return useAppStore((state) => ({
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
    loadUsers: state.loadUsers,
    updateUser: state.updateUser,
    loadWorkItems: state.loadWorkItems,
    assignWork: state.assignWork,
    completeWork: state.completeWork,
    loadProductionStats: state.loadProductionStats,
    updateProductionTargets: state.updateProductionTargets,
    updateSystemSettings: state.updateSystemSettings,
    refreshAll: state.refreshAll,
  }), shallow);
};

// Utility selectors
export const useAppUtils = () => useAppStore((state) => ({
  getOperatorsByMachine: state.getOperatorsByMachine,
  getAvailableOperators: state.getAvailableOperators,
  getWorkloadByOperator: state.getWorkloadByOperator,
}), shallow);