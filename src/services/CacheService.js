// File: src/services/CacheService.js
// Centralized caching service to reduce Firestore reads

import { 
  db, 
  collection, 
  getDocs, 
  onSnapshot, 
  COLLECTIONS,
  DEMO_USERS 
} from '../config/firebase';

class CacheService {
  constructor() {
    this.cache = new Map();
    this.subscribers = new Map();
    this.timestamps = new Map();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  // Get cache key
  getCacheKey(collection, query = null) {
    return query ? `${collection}_${JSON.stringify(query)}` : collection;
  }

  // Check if cache is valid
  isCacheValid(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp) return false;
    return (Date.now() - timestamp) < this.CACHE_DURATION;
  }

  // Get cached data
  getCached(key) {
    if (this.isCacheValid(key)) {
      console.log(`📋 Cache HIT for ${key}`);
      return this.cache.get(key);
    }
    console.log(`📋 Cache MISS for ${key}`);
    return null;
  }

  // Set cache data
  setCache(key, data) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now());
    console.log(`📋 Cached ${key} with ${Array.isArray(data) ? data.length : 1} items`);
    
    // Notify subscribers
    const callbacks = this.subscribers.get(key) || [];
    callbacks.forEach(callback => callback(data));
  }

  // Subscribe to cache updates
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, []);
    }
    this.subscribers.get(key).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  // Clear specific cache entry
  clearCache(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    console.log(`📋 Cleared cache for ${key}`);
  }

  // Clear all cache
  clearAllCache() {
    this.cache.clear();
    this.timestamps.clear();
    console.log('📋 Cleared all cache');
  }

  // Generic collection fetcher with caching
  async getCollection(collectionName, useCache = true) {
    const cacheKey = this.getCacheKey(collectionName);
    
    // Return cached data if valid
    if (useCache) {
      const cached = this.getCached(cacheKey);
      if (cached) return { success: true, data: cached, fromCache: true };
    }

    try {
      console.log(`🔥 Firestore READ: ${collectionName}`);
      const snapshot = await getDocs(collection(db, collectionName));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Cache the result
      this.setCache(cacheKey, data);
      
      return { success: true, data, fromCache: false };
    } catch (error) {
      console.error(`❌ Error fetching ${collectionName}:`, error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Optimized user collections loader (most frequently accessed)
  async getAllUsers(useCache = true) {
    const cacheKey = 'all_users';
    
    if (useCache) {
      const cached = this.getCached(cacheKey);
      if (cached) return { success: true, data: cached, fromCache: true };
    }

    try {
      console.log('🔥 Firestore READ: Loading all users (operators, supervisors, management)');
      
      // Add timeout to prevent infinite loading
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - check network connection')), 15000)
      );

      const [operatorsSnapshot, supervisorsSnapshot, managementSnapshot] = await Promise.race([
        Promise.all([
          getDocs(collection(db, COLLECTIONS.OPERATORS)),
          getDocs(collection(db, COLLECTIONS.SUPERVISORS)),
          getDocs(collection(db, COLLECTIONS.MANAGEMENT))
        ]),
        timeout
      ]);

      const operators = operatorsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        role: 'operator' 
      }));
      
      const supervisors = supervisorsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        role: 'supervisor' 
      }));
      
      const management = managementSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(), 
        role: 'management' 
      }));

      const allUsers = [...operators, ...supervisors, ...management];
      
      // Cache individual collections too
      this.setCache('operators', operators);
      this.setCache('supervisors', supervisors);
      this.setCache('management', management);
      this.setCache(cacheKey, allUsers);

      return { success: true, data: allUsers, fromCache: false };
    } catch (error) {
      console.error('❌ Error loading users from Firestore, falling back to demo data:', error);
      
      // Fallback to demo users when Firestore fails
      const demoUsers = [
        ...DEMO_USERS.OPERATORS,
        ...DEMO_USERS.SUPERVISORS,
        ...DEMO_USERS.MANAGEMENT
      ];
      
      // Cache demo data
      this.setCache('operators', DEMO_USERS.OPERATORS);
      this.setCache('supervisors', DEMO_USERS.SUPERVISORS);
      this.setCache('management', DEMO_USERS.MANAGEMENT);
      this.setCache(cacheKey, demoUsers);
      
      console.log(`🔄 Using demo data: ${demoUsers.length} users`);
      return { success: true, data: demoUsers, fromCache: false, isDemo: true };
    }
  }

  // Get specific user collection with caching
  async getOperators(useCache = true) {
    const cached = this.getCached('operators');
    if (useCache && cached) {
      return { success: true, data: cached, fromCache: true };
    }
    
    // If not cached individually, try to get from all users cache
    const allUsers = this.getCached('all_users');
    if (useCache && allUsers) {
      const operators = allUsers.filter(user => user.role === 'operator');
      return { success: true, data: operators, fromCache: true };
    }

    return this.getCollection(COLLECTIONS.OPERATORS, useCache);
  }

  async getSupervisors(useCache = true) {
    const cached = this.getCached('supervisors');
    if (useCache && cached) {
      return { success: true, data: cached, fromCache: true };
    }
    
    const allUsers = this.getCached('all_users');
    if (useCache && allUsers) {
      const supervisors = allUsers.filter(user => user.role === 'supervisor');
      return { success: true, data: supervisors, fromCache: true };
    }

    return this.getCollection(COLLECTIONS.SUPERVISORS, useCache);
  }

  async getManagement(useCache = true) {
    const cached = this.getCached('management');
    if (useCache && cached) {
      return { success: true, data: cached, fromCache: true };
    }
    
    const allUsers = this.getCached('all_users');
    if (useCache && allUsers) {
      const management = allUsers.filter(user => user.role === 'management');
      return { success: true, data: management, fromCache: true };
    }

    return this.getCollection(COLLECTIONS.MANAGEMENT, useCache);
  }

  // Get templates with caching
  async getArticleTemplates(useCache = true) {
    return this.getCollection(COLLECTIONS.ARTICLE_TEMPLATES, useCache);
  }

  // Get machine configs with caching
  async getMachineConfigs(useCache = true) {
    return this.getCollection(COLLECTIONS.MACHINE_CONFIGS, useCache);
  }

  // Force refresh specific collection
  async refreshCollection(collectionName) {
    this.clearCache(collectionName);
    return this.getCollection(collectionName, false);
  }

  // Get cache statistics
  getCacheStats() {
    const stats = {
      totalEntries: this.cache.size,
      cacheHitRate: 0,
      entries: []
    };

    this.cache.forEach((value, key) => {
      const timestamp = this.timestamps.get(key);
      const age = timestamp ? Date.now() - timestamp : 0;
      const isValid = this.isCacheValid(key);
      
      stats.entries.push({
        key,
        size: Array.isArray(value) ? value.length : 1,
        ageSeconds: Math.round(age / 1000),
        isValid
      });
    });

    return stats;
  }
}

// Export singleton instance
export const cacheService = new CacheService();
export default cacheService;