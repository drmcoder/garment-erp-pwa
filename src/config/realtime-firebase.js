// File: src/config/realtime-firebase.js
// Firebase Realtime Database configuration and utilities

import { getDatabase, ref, set, get, push, onValue, off, remove, serverTimestamp } from 'firebase/database';
import { app } from './firebase';

// Initialize Realtime Database
export const rtdb = getDatabase(app);

// Realtime Database paths structure
export const RT_PATHS = {
  // Live operator status (frequent updates)
  OPERATOR_STATUS: 'operator_status',
  
  // Current work progress (real-time updates)
  WORK_PROGRESS: 'work_progress',
  
  // Station monitoring (live data)
  STATION_STATUS: 'station_status',
  
  // Live counters and metrics
  LIVE_METRICS: 'live_metrics',
  
  // Real-time notifications
  NOTIFICATIONS: 'notifications',
  
  // System health monitoring
  SYSTEM_HEALTH: 'system_health',
  
  // Active sessions tracking
  ACTIVE_SESSIONS: 'active_sessions'
};

// Helper functions for common operations
export const realtimeHelpers = {
  // Set data with timestamp
  setWithTimestamp: async (path, data) => {
    const dataWithTimestamp = {
      ...data,
      timestamp: serverTimestamp(),
      lastUpdated: new Date().toISOString()
    };
    
    try {
      await set(ref(rtdb, path), dataWithTimestamp);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error setting realtime data at ${path}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Get data once
  getData: async (path) => {
    try {
      const snapshot = await get(ref(rtdb, path));
      if (snapshot.exists()) {
        return { success: true, data: snapshot.val() };
      } else {
        return { success: true, data: null };
      }
    } catch (error) {
      console.error(`❌ Error getting realtime data from ${path}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Push new data (auto-generated key)
  pushData: async (path, data) => {
    try {
      const dataWithTimestamp = {
        ...data,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      };
      
      const newRef = await push(ref(rtdb, path), dataWithTimestamp);
      return { success: true, key: newRef.key };
    } catch (error) {
      console.error(`❌ Error pushing realtime data to ${path}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Remove data
  removeData: async (path) => {
    try {
      await remove(ref(rtdb, path));
      return { success: true };
    } catch (error) {
      console.error(`❌ Error removing realtime data at ${path}:`, error);
      return { success: false, error: error.message };
    }
  },

  // Subscribe to real-time updates
  subscribe: (path, callback) => {
    const dbRef = ref(rtdb, path);
    onValue(dbRef, callback);
    
    // Return unsubscribe function
    return () => off(dbRef, 'value', callback);
  },

  // Get server timestamp
  getServerTimestamp: () => serverTimestamp()
};

// Connection state monitoring
export const monitorConnection = (callback) => {
  const connectedRef = ref(rtdb, '.info/connected');
  return realtimeHelpers.subscribe('.info/connected', (snapshot) => {
    const connected = snapshot.val();
    callback(connected);
  });
};

// Presence system for tracking active users
export class PresenceService {
  constructor(userId, userInfo) {
    this.userId = userId;
    this.userInfo = userInfo;
    this.myPresenceRef = null;
    this.unsubscribe = null;
  }

  // Start presence tracking
  startPresence() {
    if (!this.userId) return;

    const presencePath = `${RT_PATHS.ACTIVE_SESSIONS}/${this.userId}`;
    this.myPresenceRef = ref(rtdb, presencePath);

    // Set presence data
    const presenceData = {
      ...this.userInfo,
      online: true,
      lastSeen: serverTimestamp(),
      sessionStart: new Date().toISOString()
    };

    // Set initial presence
    set(this.myPresenceRef, presenceData);

    // Remove presence on disconnect
    const disconnectRef = ref(rtdb, `${presencePath}/online`);
    set(disconnectRef, false);

    console.log(`✅ Started presence tracking for user: ${this.userId}`);
  }

  // Update presence data
  updatePresence(data) {
    if (this.myPresenceRef) {
      set(this.myPresenceRef, {
        ...this.userInfo,
        ...data,
        online: true,
        lastSeen: serverTimestamp(),
        lastUpdated: new Date().toISOString()
      });
    }
  }

  // Stop presence tracking
  stopPresence() {
    if (this.myPresenceRef) {
      set(this.myPresenceRef, {
        ...this.userInfo,
        online: false,
        lastSeen: serverTimestamp(),
        sessionEnd: new Date().toISOString()
      });
      
      console.log(`✅ Stopped presence tracking for user: ${this.userId}`);
    }
  }
}

export default rtdb;