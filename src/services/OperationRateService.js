// Operation Rate Management Service
// Handles rate-time calculations and Firestore operations

import { db, collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where } from '../config/firebase';

class OperationRateService {
  
  // Formula constants
  static TIME_MULTIPLIER = 1.9; // time = rate * 1.9 minutes
  
  /**
   * Calculate time from rate using formula: time = rate * 1.9
   * @param {number} rate - Rate per piece
   * @returns {number} Time in minutes
   */
  static calculateTimeFromRate(rate) {
    return parseFloat((rate * this.TIME_MULTIPLIER).toFixed(1));
  }
  
  /**
   * Calculate rate from time using formula: rate = time / 1.9
   * @param {number} time - Time in minutes
   * @returns {number} Rate per piece
   */
  static calculateRateFromTime(time) {
    return parseFloat((time / this.TIME_MULTIPLIER).toFixed(2));
  }
  
  /**
   * Get all operation types with rates from Firestore
   * @returns {Promise<{success: boolean, operations?: Array, error?: string}>}
   */
  static async getAllOperationRates() {
    try {
      const operationsSnapshot = await getDocs(collection(db, 'operationTypes'));
      const operations = operationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Loaded operation rates from Firestore:', operations.length);
      return { success: true, operations };
    } catch (error) {
      console.error('❌ Failed to load operation rates:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get rate for specific operation
   * @param {string} operationId - Operation identifier
   * @returns {Promise<{success: boolean, rate?: number, time?: number, error?: string}>}
   */
  static async getOperationRate(operationId) {
    try {
      const operationDoc = await getDoc(doc(db, 'operationTypes', operationId));
      
      if (operationDoc.exists()) {
        const data = operationDoc.data();
        return { 
          success: true, 
          rate: data.rate || 0,
          time: data.estimatedTimeMinutes || this.calculateTimeFromRate(data.rate || 0),
          operation: { id: operationDoc.id, ...data }
        };
      } else {
        // Return default values for unknown operations
        return { 
          success: true, 
          rate: 2.5, 
          time: this.calculateTimeFromRate(2.5) 
        };
      }
    } catch (error) {
      console.error('❌ Failed to get operation rate:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Update operation rate and recalculate time
   * @param {string} operationId - Operation identifier  
   * @param {number} rate - New rate per piece
   * @param {number} time - New time (optional, will be calculated if not provided)
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async updateOperationRate(operationId, rate, time = null) {
    try {
      const calculatedTime = time || this.calculateTimeFromRate(rate);
      
      const operationRef = doc(db, 'operationTypes', operationId);
      const updateData = {
        rate: parseFloat(rate),
        estimatedTimeMinutes: calculatedTime,
        lastUpdated: new Date(),
        updatedBy: 'supervisor' // Track who updated
      };
      
      // Check if document exists
      const docSnapshot = await getDoc(operationRef);
      
      if (docSnapshot.exists()) {
        // Update existing operation
        await updateDoc(operationRef, updateData);
        console.log(`✅ Updated operation rate: ${operationId} = ₹${rate} (${calculatedTime}min)`);
      } else {
        // Create new operation entry
        await setDoc(operationRef, {
          id: operationId,
          english: operationId.replace('_', ' '),
          nepali: operationId.replace('_', ' '),
          machine: 'overlock', // Default machine
          category: 'general',
          skillLevel: 'medium',
          ...updateData
        });
        console.log(`✅ Created new operation rate: ${operationId} = ₹${rate} (${calculatedTime}min)`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to update operation rate:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Batch update multiple operation rates
   * @param {Array<{id: string, rate: number, time?: number}>} operations
   * @returns {Promise<{success: boolean, updated?: number, error?: string}>}
   */
  static async batchUpdateRates(operations) {
    try {
      let updated = 0;
      
      for (const operation of operations) {
        const result = await this.updateOperationRate(operation.id, operation.rate, operation.time);
        if (result.success) updated++;
      }
      
      console.log(`✅ Batch updated ${updated} operation rates`);
      return { success: true, updated };
    } catch (error) {
      console.error('❌ Failed to batch update rates:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Search operations by name or machine type
   * @param {string} searchTerm - Search term
   * @param {string} machineType - Filter by machine type
   * @returns {Promise<{success: boolean, operations?: Array, error?: string}>}
   */
  static async searchOperations(searchTerm = '', machineType = '') {
    try {
      let q = collection(db, 'operationTypes');
      
      if (machineType) {
        q = query(q, where('machine', '==', machineType));
      }
      
      const snapshot = await getDocs(q);
      let operations = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter by search term if provided
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        operations = operations.filter(op => 
          op.english?.toLowerCase().includes(term) ||
          op.nepali?.toLowerCase().includes(term) ||
          op.id.toLowerCase().includes(term)
        );
      }
      
      return { success: true, operations };
    } catch (error) {
      console.error('❌ Failed to search operations:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Get rate statistics and analytics
   * @returns {Promise<{success: boolean, stats?: object, error?: string}>}
   */
  static async getRateStatistics() {
    try {
      const result = await this.getAllOperationRates();
      
      if (result.success) {
        const rates = result.operations.map(op => op.rate || 0);
        const times = result.operations.map(op => op.estimatedTimeMinutes || 0);
        
        const stats = {
          totalOperations: result.operations.length,
          averageRate: rates.reduce((sum, rate) => sum + rate, 0) / rates.length,
          minRate: Math.min(...rates),
          maxRate: Math.max(...rates),
          averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
          byMachine: {}
        };
        
        // Group by machine type
        result.operations.forEach(op => {
          const machine = op.machine || 'unknown';
          if (!stats.byMachine[machine]) {
            stats.byMachine[machine] = { count: 0, avgRate: 0, operations: [] };
          }
          stats.byMachine[machine].count++;
          stats.byMachine[machine].operations.push(op);
        });
        
        // Calculate average rates by machine
        Object.keys(stats.byMachine).forEach(machine => {
          const machineOps = stats.byMachine[machine].operations;
          stats.byMachine[machine].avgRate = 
            machineOps.reduce((sum, op) => sum + (op.rate || 0), 0) / machineOps.length;
        });
        
        return { success: true, stats };
      } else {
        return result;
      }
    } catch (error) {
      console.error('❌ Failed to get rate statistics:', error);
      return { success: false, error: error.message };
    }
  }
}

export default OperationRateService;