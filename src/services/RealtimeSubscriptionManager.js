// Real-time Subscription Manager
// Centralized management for all real-time data subscriptions

import { useEffect } from 'react';
import { onSnapshot, query, where, orderBy, collection } from '../config/firebase';
import { db } from '../config/firebase';
import { useAppStore } from '../store/AppStore';

class RealtimeSubscriptionManager {
  constructor() {
    this.subscriptions = new Map();
    this.store = null;
    this.isInitialized = false;
  }

  // Initialize with store reference
  initialize(store) {
    this.store = store;
    this.isInitialized = true;
    console.log('✅ Realtime Subscription Manager initialized');
  }

  // Subscribe to a collection with automatic store updates
  subscribe(subscriptionId, collectionName, options = {}) {
    if (!this.isInitialized) {
      console.error('❌ Subscription Manager not initialized');
      return null;
    }

    // Check if subscription already exists
    if (this.subscriptions.has(subscriptionId)) {
      console.log(`🔄 Reusing existing subscription: ${subscriptionId}`);
      return this.subscriptions.get(subscriptionId);
    }

    try {
      // Build query
      let queryRef = collection(db, collectionName);
      
      if (options.where) {
        options.where.forEach(([field, operator, value]) => {
          queryRef = query(queryRef, where(field, operator, value));
        });
      }
      
      if (options.orderBy) {
        options.orderBy.forEach(([field, direction = 'asc']) => {
          queryRef = query(queryRef, orderBy(field, direction));
        });
      }

      // Create subscription
      const unsubscribe = onSnapshot(
        queryRef,
        (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log(`🔄 Real-time update for ${subscriptionId}:`, data.length, 'items');
          
          // Update store based on collection type
          this.updateStore(collectionName, data, options);
          
          // Call custom callback if provided
          if (options.callback) {
            options.callback(data);
          }
        },
        (error) => {
          console.error(`❌ Real-time subscription error for ${subscriptionId}:`, error);
          
          // Handle specific Firestore errors gracefully
          if (error.code === 'unavailable' || error.code === 'deadline-exceeded') {
            console.log(`🔄 Firestore temporarily unavailable for ${subscriptionId}, will retry automatically`);
          } else if (error.code === 'permission-denied') {
            console.error(`🚫 Permission denied for ${subscriptionId}. Check Firestore rules.`);
            this.unsubscribe(subscriptionId); // Remove invalid subscription
          } else if (error.code === 'failed-precondition') {
            console.log(`⚠️ Firestore connection issue for ${subscriptionId}, keeping subscription for retry`);
          } else {
            console.log(`⚠️ Connection error for ${subscriptionId}: ${error.message}`);
          }
          
          if (this.store) {
            this.store.getState().setError(`Connection issue: ${error.message}`);
          }
        }
      );

      // Store subscription
      this.subscriptions.set(subscriptionId, {
        unsubscribe,
        collectionName,
        options,
        createdAt: new Date()
      });

      console.log(`✅ Created real-time subscription: ${subscriptionId}`);
      return unsubscribe;
    } catch (error) {
      console.error(`❌ Failed to create subscription ${subscriptionId}:`, error);
      return null;
    }
  }

  // Update store based on collection type
  updateStore(collectionName, data, options) {
    if (!this.store) return;

    const state = this.store.getState();

    switch (collectionName) {
      case 'operators':
        state.users.operators = data;
        state.users.lastUpdated = new Date().toISOString();
        break;
        
      case 'supervisors':
        state.users.supervisors = data;
        state.users.lastUpdated = new Date().toISOString();
        break;
        
      case 'management':
        state.users.management = data;
        state.users.lastUpdated = new Date().toISOString();
        break;
        
      case 'bundles':
        state.workItems.bundles = data;
        state.workItems.lastUpdated = new Date().toISOString();
        break;
        
      case 'work_assignments':
        state.workItems.assignments = data;
        state.workItems.lastUpdated = new Date().toISOString();
        break;
        
      case 'work_completions':
        state.workItems.completions = data;
        state.workItems.lastUpdated = new Date().toISOString();
        // Also update production stats
        this.updateProductionStats(data);
        break;
        
      default:
        console.log(`📊 Real-time update for ${collectionName}:`, data.length, 'items');
    }

    // Force store update
    this.store.setState(state);
  }

  // Update production stats when completions change
  updateProductionStats(completions) {
    if (!this.store || !completions) return;

    const today = new Date().toISOString().split('T')[0];
    const todayCompletions = completions.filter(c =>
      c.completedAt?.startsWith(today)
    );

    const stats = {
      todayPieces: todayCompletions.reduce((sum, c) => sum + (c.pieces || 0), 0),
      todayCompletions: todayCompletions.length,
      averageQuality: todayCompletions.length > 0 
        ? todayCompletions.reduce((sum, c) => sum + (c.quality || 100), 0) / todayCompletions.length 
        : 100,
    };

    const state = this.store.getState();
    state.production.stats = { ...state.production.stats, ...stats };
    state.production.lastUpdated = new Date().toISOString();
    this.store.setState(state);
  }

  // Subscribe to user-specific data
  subscribeToUserData(userId, role) {
    const subscriptions = [];

    // Subscribe to user's work assignments
    subscriptions.push(
      this.subscribe(`user_assignments_${userId}`, 'work_assignments', {
        where: [['operatorId', '==', userId]],
        orderBy: [['assignedAt', 'desc']]
      })
    );

    // Subscribe to user's work completions
    subscriptions.push(
      this.subscribe(`user_completions_${userId}`, 'work_completions', {
        where: [['operatorId', '==', userId]],
        orderBy: [['completedAt', 'desc']]
      })
    );

    // For operators, subscribe to available work
    if (role === 'operator') {
      subscriptions.push(
        this.subscribe('available_bundles', 'bundles', {
          where: [['status', '==', 'active']],
          orderBy: [['createdAt', 'desc']]
        })
      );
    }

    // For supervisors, subscribe to line data
    if (role === 'supervisor') {
      subscriptions.push(
        this.subscribe('all_operators', 'operators', {
          orderBy: [['name', 'asc']]
        })
      );
      
      subscriptions.push(
        this.subscribe('pending_assignments', 'work_assignments', {
          where: [['status', '==', 'pending_approval']],
          orderBy: [['assignedAt', 'asc']]
        })
      );
    }

    return subscriptions;
  }

  // Subscribe to system-wide data
  subscribeToSystemData() {
    const subscriptions = [];

    // All users for system overview
    subscriptions.push(
      this.subscribe('all_users_operators', 'operators'),
      this.subscribe('all_users_supervisors', 'supervisors'),
      this.subscribe('all_users_management', 'management')
    );

    // Active work items
    subscriptions.push(
      this.subscribe('active_work_assignments', 'work_assignments', {
        where: [['status', 'in', ['assigned', 'in_progress']]],
        orderBy: [['assignedAt', 'desc']]
      })
    );

    // Recent completions for metrics
    subscriptions.push(
      this.subscribe('recent_completions', 'work_completions', {
        orderBy: [['completedAt', 'desc']],
        limit: 100
      })
    );

    return subscriptions;
  }

  // Unsubscribe from a specific subscription
  unsubscribe(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionId);
      console.log(`✅ Unsubscribed from: ${subscriptionId}`);
      return true;
    } else {
      console.log(`⚠️ Subscription not found: ${subscriptionId}`);
      return false;
    }
  }

  // Unsubscribe from user-specific subscriptions
  unsubscribeFromUserData(userId) {
    const userSubscriptions = [
      `user_assignments_${userId}`,
      `user_completions_${userId}`,
      'available_bundles'
    ];

    userSubscriptions.forEach(subscriptionId => {
      this.unsubscribe(subscriptionId);
    });
  }

  // Unsubscribe from all subscriptions
  unsubscribeAll() {
    console.log(`🔄 Unsubscribing from ${this.subscriptions.size} subscriptions...`);
    
    for (const [subscriptionId, subscription] of this.subscriptions) {
      try {
        subscription.unsubscribe();
        console.log(`✅ Unsubscribed from: ${subscriptionId}`);
      } catch (error) {
        console.error(`❌ Error unsubscribing from ${subscriptionId}:`, error);
      }
    }
    
    this.subscriptions.clear();
    console.log('✅ All subscriptions cleared');
  }

  // Get subscription status
  getSubscriptionStatus() {
    const subscriptions = Array.from(this.subscriptions.entries()).map(([id, subscription]) => ({
      id,
      collectionName: subscription.collectionName,
      createdAt: subscription.createdAt,
      options: subscription.options
    }));

    return {
      total: this.subscriptions.size,
      subscriptions,
      isInitialized: this.isInitialized
    };
  }

  // Pause all subscriptions (useful for offline mode)
  pause() {
    console.log('⏸️ Pausing all real-time subscriptions');
    this.unsubscribeAll();
  }

  // Resume subscriptions with stored configurations
  resume(userId, role) {
    console.log('▶️ Resuming real-time subscriptions');
    this.subscribeToUserData(userId, role);
    this.subscribeToSystemData();
  }
}

// Create singleton instance
export const realtimeSubscriptionManager = new RealtimeSubscriptionManager();

// React hook for managing subscriptions
export const useRealtimeSubscriptions = (userId, role) => {
  const store = useAppStore();

  useEffect(() => {
    if (!userId || !role) return;

    // Initialize subscription manager with store
    realtimeSubscriptionManager.initialize(store);

    // Subscribe to user and system data
    const userSubscriptions = realtimeSubscriptionManager.subscribeToUserData(userId, role);
    const systemSubscriptions = realtimeSubscriptionManager.subscribeToSystemData();

    console.log(`✅ Started ${userSubscriptions.length + systemSubscriptions.length} real-time subscriptions`);

    // Cleanup on unmount
    return () => {
      realtimeSubscriptionManager.unsubscribeFromUserData(userId);
      console.log('🔄 Cleaned up user subscriptions');
    };
  }, [userId, role, store]);

  // Return subscription status
  return realtimeSubscriptionManager.getSubscriptionStatus();
};

export default realtimeSubscriptionManager;