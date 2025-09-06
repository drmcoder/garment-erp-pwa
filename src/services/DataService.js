// Centralized Data Service
// Handles all data operations with consistent error handling and caching

import { db, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit } from '../config/firebase';
import { LegacyActivityLogService as ActivityLogService } from './firebase-services-clean';

class DataService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
  }

  // Generic CRUD operations with caching
  async fetchCollection(collectionName, options = {}) {
    const cacheKey = `${collectionName}_${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      const cacheAge = Date.now() - cached.timestamp;
      const maxAge = options.maxAge || 5 * 60 * 1000; // 5 minutes default
      
      if (cacheAge < maxAge) {
        return { success: true, data: cached.data, cached: true };
      }
    }
    
    // Check for pending request
    if (this.pendingRequests.has(cacheKey)) {
      return await this.pendingRequests.get(cacheKey);
    }
    
    // Create new request
    const request = this.executeFetch(collectionName, options);
    this.pendingRequests.set(cacheKey, request);
    
    try {
      const result = await request;
      
      // Cache successful results
      if (result.success) {
        this.cache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now()
        });
      }
      
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }
  
  async executeFetch(collectionName, options = {}) {
    try {
      let q = collection(db, collectionName);
      
      // Apply query options
      if (options.where) {
        options.where.forEach(([field, operator, value]) => {
          q = query(q, where(field, operator, value));
        });
      }
      
      if (options.orderBy) {
        options.orderBy.forEach(([field, direction = 'asc']) => {
          q = query(q, orderBy(field, direction));
        });
      }
      
      if (options.limit) {
        q = query(q, limit(options.limit));
      }
      
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, data };
    } catch (error) {
      console.error(`Error fetching ${collectionName}:`, error);
      return { success: false, error: error.message, data: [] };
    }
  }
  
  async createDocument(collectionName, data, options = {}) {
    try {
      const docData = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(db, collectionName), docData);
      
      // Invalidate cache
      this.invalidateCache(collectionName);
      
      // Log activity if userId provided
      if (options.userId) {
        await ActivityLogService.logActivity(options.userId, 'document_created', {
          collection: collectionName,
          documentId: docRef.id,
        });
      }
      
      return { success: true, id: docRef.id, data: docData };
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async updateDocument(collectionName, docId, updates, options = {}) {
    try {
      const docData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await updateDoc(doc(db, collectionName, docId), docData);
      
      // Invalidate cache
      this.invalidateCache(collectionName);
      
      // Log activity if userId provided
      if (options.userId) {
        await ActivityLogService.logActivity(options.userId, 'document_updated', {
          collection: collectionName,
          documentId: docId,
          updates,
        });
      }
      
      return { success: true, data: docData };
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async deleteDocument(collectionName, docId, options = {}) {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      
      // Invalidate cache
      this.invalidateCache(collectionName);
      
      // Log activity if userId provided
      if (options.userId) {
        await ActivityLogService.logActivity(options.userId, 'document_deleted', {
          collection: collectionName,
          documentId: docId,
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error(`Error deleting document in ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  // Specialized methods for common operations
  async getAllUsers(options = {}) {
    const collections = ['operators', 'supervisors', 'management'];
    const results = await Promise.all(
      collections.map(collectionName => 
        this.fetchCollection(collectionName, options)
      )
    );
    
    const users = results.flatMap(result => 
      result.success ? result.data : []
    );
    
    // Ensure consistent user structure
    const normalizedUsers = users.map(user => ({
      ...user,
      role: user.role || (user.speciality ? 'operator' : 'management'),
      stats: user.stats || {
        todayPieces: 0,
        todayEarnings: 0,
        weeklyPieces: 0,
        weeklyEarnings: 0,
        monthlyPieces: 0,
        monthlyEarnings: 0,
      },
    }));
    
    return { success: true, data: normalizedUsers };
  }
  
  async getAllBundles(options = {}) {
    return await this.fetchCollection('bundles', {
      ...options,
      orderBy: [['createdAt', 'desc']],
    });
  }
  
  async getWorkAssignments(options = {}) {
    return await this.fetchCollection('work_assignments', {
      ...options,
      orderBy: [['assignedAt', 'desc']],
    });
  }
  
  async getWorkCompletions(options = {}) {
    return await this.fetchCollection('work_completions', {
      ...options,
      orderBy: [['completedAt', 'desc']],
    });
  }
  
  async getActiveAssignments(operatorId = null) {
    const options = {
      where: [['status', '==', 'assigned']],
    };
    
    if (operatorId) {
      options.where.push(['operatorId', '==', operatorId]);
    }
    
    return await this.fetchCollection('work_assignments', options);
  }
  
  async getOperatorStats(operatorId, dateRange = null) {
    const options = {
      where: [['operatorId', '==', operatorId]],
    };
    
    if (dateRange) {
      options.where.push(['completedAt', '>=', dateRange.start]);
      options.where.push(['completedAt', '<=', dateRange.end]);
    }
    
    const result = await this.fetchCollection('work_completions', options);
    
    if (result.success) {
      const completions = result.data;
      const stats = {
        totalCompletions: completions.length,
        totalPieces: completions.reduce((sum, c) => sum + (c.pieces || 0), 0),
        totalEarnings: completions.reduce((sum, c) => sum + (c.earnings || 0), 0),
        averagePiecesPerHour: 0,
        averageQuality: 0,
      };
      
      if (completions.length > 0) {
        stats.averageQuality = completions.reduce((sum, c) => sum + (c.quality || 100), 0) / completions.length;
        
        // Calculate hourly rate (simplified)
        const totalHours = completions.length * 1; // Assume 1 hour per completion for now
        stats.averagePiecesPerHour = totalHours > 0 ? stats.totalPieces / totalHours : 0;
      }
      
      return { success: true, data: stats };
    }
    
    return result;
  }
  
  async getProductionStats(dateRange = null) {
    const options = {};
    
    if (dateRange) {
      options.where = [
        ['completedAt', '>=', dateRange.start],
        ['completedAt', '<=', dateRange.end],
      ];
    }
    
    const [completionsResult, usersResult] = await Promise.all([
      this.fetchCollection('work_completions', options),
      this.getAllUsers(),
    ]);
    
    if (completionsResult.success && usersResult.success) {
      const completions = completionsResult.data;
      const operators = usersResult.data.filter(u => u.role === 'operator');
      
      const stats = {
        totalPieces: completions.reduce((sum, c) => sum + (c.pieces || 0), 0),
        totalCompletions: completions.length,
        totalOperators: operators.length,
        activeOperators: new Set(completions.map(c => c.operatorId)).size,
        averageQuality: completions.length > 0 
          ? completions.reduce((sum, c) => sum + (c.quality || 100), 0) / completions.length 
          : 100,
      };
      
      stats.efficiency = stats.totalOperators > 0 
        ? (stats.activeOperators / stats.totalOperators) * 100 
        : 0;
      
      return { success: true, data: stats };
    }
    
    return { success: false, error: 'Failed to fetch production data' };
  }
  
  // Batch operations
  async batchCreate(collectionName, documents, options = {}) {
    try {
      const results = await Promise.all(
        documents.map(doc => this.createDocument(collectionName, doc, options))
      );
      
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      return {
        success: failed.length === 0,
        successful: successful.length,
        failed: failed.length,
        errors: failed.map(f => f.error),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  async batchUpdate(collectionName, updates, options = {}) {
    try {
      const results = await Promise.all(
        updates.map(({ id, data }) => 
          this.updateDocument(collectionName, id, data, options)
        )
      );
      
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      return {
        success: failed.length === 0,
        successful: successful.length,
        failed: failed.length,
        errors: failed.map(f => f.error),
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  // Cache management
  invalidateCache(pattern = null) {
    if (pattern) {
      // Invalidate specific pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }
  
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      pendingRequests: this.pendingRequests.size,
    };
  }
  
  // Real-time subscriptions (for future implementation)
  subscribeToCollection(collectionName, callback, options = {}) {
    // This would implement real-time listeners
    // For now, return a mock unsubscribe function
    return () => {
      console.log(`Unsubscribed from ${collectionName}`);
    };
  }
}

// Create singleton instance
export const dataService = new DataService();

// Convenience exports
export const {
  fetchCollection,
  createDocument,
  updateDocument,
  deleteDocument,
  getAllUsers,
  getAllBundles,
  getWorkAssignments,
  getWorkCompletions,
  getActiveAssignments,
  getOperatorStats,
  getProductionStats,
  batchCreate,
  batchUpdate,
  invalidateCache,
  getCacheStats,
} = dataService;

export default dataService;