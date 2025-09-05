// Bundle Service
// Handles bundle/work item operations and management

import { FirebaseBaseService, FirebaseUtils, COLLECTIONS } from '../core/firebase-base';
import WIPService from './wip-service';

export class BundleService extends FirebaseBaseService {
  constructor() {
    super(COLLECTIONS.BUNDLES);
  }

  /**
   * Get all bundles
   */
  static async getAllBundles() {
    try {
      const service = new BundleService();
      const result = await service.getAll([
        FirebaseUtils.orderDesc('createdAt')
      ]);

      if (result.success) {
        return { success: true, bundles: result.data };
      }

      return result;
    } catch (error) {
      console.error("Get bundles error:", error);
      return { success: false, error: error.message, bundles: [] };
    }
  }

  /**
   * Get bundles for specific operator
   */
  static async getOperatorBundles(operatorId, machineType = null) {
    try {
      console.log('📦 Getting operator bundles for:', operatorId, machineType);
      
      const service = new BundleService();
      const result = await service.getAll([
        FirebaseUtils.whereEqual('assignedOperator', operatorId),
        FirebaseUtils.orderDesc('createdAt'),
        FirebaseUtils.limitResults(50)
      ]);

      if (result.success) {
        let bundles = result.data.map((bundle) => ({
          ...bundle,
          createdAt: bundle.createdAt?.toDate?.() || new Date(bundle.createdAt)
        }));

        // Filter by machine type client-side if specified
        if (machineType) {
          bundles = bundles.filter(bundle => bundle.machineType === machineType);
        }

        // Sort client-side by priority (High > Medium > Low) then by creation date
        bundles = this.sortBundlesByPriority(bundles);

        console.log('✅ Retrieved', bundles.length, 'bundles for operator');
        return { success: true, bundles };
      }

      return { success: false, error: result.error, bundles: [] };
    } catch (error) {
      console.error("❌ Get operator bundles error:", error);
      return { success: false, error: error.message, bundles: [] };
    }
  }

  /**
   * Get available bundles for assignment
   */
  static async getAvailableBundles(machineType = null) {
    try {
      console.log('🔍 Loading available bundles/work items...');
      
      // First try to get work items from WIP
      const wipWorkItems = await WIPService.getWorkItemsFromWIP();
      
      if (wipWorkItems.success && wipWorkItems.workItems.length > 0) {
        console.log(`✅ Found ${wipWorkItems.workItems.length} work items from WIP`);
        
        // Filter available work items
        let filteredWorkItems = this.filterAvailableWorkItems(wipWorkItems.workItems);
        
        // Filter by machine type if specified
        if (machineType && machineType !== 'all') {
          const beforeCount = filteredWorkItems.length;
          filteredWorkItems = filteredWorkItems.filter(item => item.machineType === machineType);
          console.log(`🔧 Machine filter: ${beforeCount} → ${filteredWorkItems.length} items (machine: ${machineType})`);
        }
        
        // Format work items to match expected bundle structure
        const bundles = this.formatWorkItemsAsBundles(filteredWorkItems);
        
        console.log(`✅ Returning ${bundles.length} formatted work items as bundles`);
        return { success: true, bundles };
      }
      
      // Fallback to original bundle logic if no WIP work items
      return await this.getFallbackBundles(machineType);
    } catch (error) {
      console.error("❌ Get available bundles error:", error);
      return { success: false, error: error.message, bundles: [] };
    }
  }

  /**
   * Create new bundle
   */
  static async createBundle(bundleData) {
    try {
      const service = new BundleService();
      const result = await service.create({
        ...bundleData,
        status: 'pending',
        completedPieces: 0,
        priority: bundleData.priority || 'medium'
      });

      return result;
    } catch (error) {
      console.error("❌ Create bundle error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update bundle status
   */
  static async updateBundleStatus(bundleId, status, completedPieces = null, additionalData = {}) {
    try {
      const service = new BundleService();
      const updateData = {
        status,
        ...additionalData
      };

      if (completedPieces !== null) {
        updateData.completedPieces = completedPieces;
      }

      if (status === 'completed') {
        updateData.completedAt = FirebaseUtils.now();
      }

      const result = await service.update(bundleId, updateData);
      return result;
    } catch (error) {
      console.error("❌ Update bundle status error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Assign bundle to operator
   */
  static async assignToOperator(bundleId, operatorId, assignedBy = null) {
    try {
      const service = new BundleService();
      const result = await service.update(bundleId, {
        assignedOperator: operatorId,
        assignedAt: FirebaseUtils.now(),
        assignedBy: assignedBy,
        status: 'assigned'
      });

      return result;
    } catch (error) {
      console.error("❌ Assign bundle error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get bundle by ID with enriched data
   */
  static async getBundleById(bundleId) {
    try {
      const service = new BundleService();
      const result = await service.getById(bundleId);

      if (result.success) {
        // Enrich with additional data if needed
        const enrichedBundle = await this.enrichBundleData(result.data);
        return { success: true, bundle: enrichedBundle };
      }

      return result;
    } catch (error) {
      console.error("❌ Get bundle by ID error:", error);
      return { success: false, error: error.message };
    }
  }

  // Helper Methods

  /**
   * Sort bundles by priority and creation date
   */
  static sortBundlesByPriority(bundles) {
    return bundles.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      const aPriority = priorityOrder[a.priority?.toLowerCase()] || 2;
      const bPriority = priorityOrder[b.priority?.toLowerCase()] || 2;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // If same priority, newer bundles first
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  /**
   * Filter available work items
   */
  static filterAvailableWorkItems(workItems) {
    const excludedStatuses = ['operator_completed', 'completed', 'in_progress', 'assigned'];
    
    return workItems.filter(item => {
      const isAvailable = !excludedStatuses.includes(item.status) && 
                         (!item.assignedOperator || item.status === 'self_assigned');
      
      if (!isAvailable) {
        console.log(`🚫 Filtering out work item ${item.id}: status=${item.status}, assignedOperator=${item.assignedOperator}`);
      }
      
      return isAvailable;
    });
  }

  /**
   * Format work items as bundles
   */
  static formatWorkItemsAsBundles(workItems) {
    return workItems.map((workItem, index) => {
      // Debug first few items during formatting
      if (index < 2) {
        console.log(`🔍 Formatting work item ${index}:`, {
          id: workItem.id,
          wipEntryId: workItem.wipEntryId,
          currentOperation: workItem.currentOperation
        });
      }
      
      return {
        id: workItem.id,
        article: workItem.article,
        articleNumber: workItem.article,
        articleName: workItem.articleName,
        size: workItem.size,
        color: workItem.color,
        pieces: workItem.pieces,
        quantity: workItem.pieces,
        completedPieces: workItem.completedPieces || 0,
        status: workItem.status,
        machineType: workItem.machineType,
        currentOperation: workItem.currentOperation,
        priority: workItem.priority || 'medium',
        deadline: workItem.deadline,
        assignedOperator: workItem.assignedOperator,
        assignedAt: workItem.assignedAt,
        lotNumber: workItem.lotNumber,
        rollNumber: workItem.rollNumber,
        wipEntryId: workItem.wipEntryId,
        createdAt: workItem.createdAt
      };
    });
  }

  /**
   * Get fallback bundles from traditional bundle collection
   */
  static async getFallbackBundles(machineType) {
    console.log('⚠️ No WIP work items found, falling back to original bundle logic');
    
    try {
      const service = new BundleService();
      const constraints = [
        FirebaseUtils.whereIn('status', ['pending', 'ready', 'waiting'])
      ];

      if (machineType && machineType !== 'all') {
        constraints.push(FirebaseUtils.whereEqual('machineType', machineType));
      }

      const result = await service.getAll(constraints);

      if (result.success) {
        // Enrich bundles with work history if needed
        const enrichedBundles = await Promise.all(
          result.data.map(bundle => this.enrichBundleData(bundle))
        );

        return { success: true, bundles: enrichedBundles };
      }

      return result;
    } catch (error) {
      console.error("❌ Fallback bundles error:", error);
      return { success: false, error: error.message, bundles: [] };
    }
  }

  /**
   * Enrich bundle data with additional information
   */
  static async enrichBundleData(bundle) {
    try {
      // Add any additional enrichment logic here
      // For now, just return the bundle as-is
      return bundle;
    } catch (error) {
      console.error("❌ Bundle enrichment error:", error);
      return bundle; // Return original bundle if enrichment fails
    }
  }
}

export default BundleService;