// WIP (Work In Progress) Service
// Handles WIP entries and work items management

import { FirebaseBaseService, FirebaseUtils, COLLECTIONS } from '../core/firebase-base';

export class WIPService extends FirebaseBaseService {
  constructor() {
    super(COLLECTIONS.WIP_ENTRIES);
  }

  /**
   * Get work items from WIP data
   */
  static async getWorkItemsFromWIP() {
    try {
      console.log('🔍 Loading work items from WIP data...');
      
      const service = new WIPService();
      const result = await service.getAll([
        FirebaseUtils.orderDesc('createdAt')
      ]);

      if (result.success) {
        // Convert WIP entries to work items format
        const workItems = result.data.map(wipEntry => {
          return {
            id: `${wipEntry.id}-work-item`,
            wipEntryId: wipEntry.id,
            article: wipEntry.article,
            articleName: wipEntry.articleName || `Article ${wipEntry.article}`,
            size: wipEntry.size,
            color: wipEntry.color,
            pieces: wipEntry.pieces,
            completedPieces: wipEntry.completedPieces || 0,
            status: wipEntry.status || 'pending',
            machineType: wipEntry.machineType || this.detectMachineType(wipEntry),
            currentOperation: wipEntry.currentOperation || 'sideSeam',
            priority: wipEntry.priority || 'medium',
            deadline: wipEntry.deadline,
            assignedOperator: wipEntry.assignedOperator,
            assignedAt: wipEntry.assignedAt,
            lotNumber: wipEntry.lotNumber,
            rollNumber: wipEntry.rollNumber,
            createdAt: wipEntry.createdAt,
            updatedAt: wipEntry.updatedAt
          };
        });

        console.log(`✅ Converted ${workItems.length} WIP entries to work items`);
        return { success: true, workItems };
      }

      return { success: false, error: result.error, workItems: [] };
    } catch (error) {
      console.error('❌ Get work items from WIP error:', error);
      return { success: false, error: error.message, workItems: [] };
    }
  }

  /**
   * Create new WIP entry
   */
  static async createWIPEntry(wipData) {
    try {
      const service = new WIPService();
      const result = await service.create({
        ...wipData,
        status: wipData.status || 'pending',
        completedPieces: 0,
        createdBy: wipData.createdBy || 'system'
      });

      return result;
    } catch (error) {
      console.error('❌ Create WIP entry error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update WIP entry
   */
  static async updateWIPEntry(wipId, updateData) {
    try {
      const service = new WIPService();
      const result = await service.update(wipId, updateData);

      return result;
    } catch (error) {
      console.error('❌ Update WIP entry error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get WIP entries by status
   */
  static async getWIPEntriesByStatus(status) {
    try {
      const service = new WIPService();
      const result = await service.getAll([
        FirebaseUtils.whereEqual('status', status),
        FirebaseUtils.orderDesc('createdAt')
      ]);

      if (result.success) {
        return { success: true, wipEntries: result.data };
      }

      return result;
    } catch (error) {
      console.error('❌ Get WIP entries by status error:', error);
      return { success: false, error: error.message, wipEntries: [] };
    }
  }

  /**
   * Get available work items for operator
   */
  static async getAvailableWorkItems(machineType = null) {
    try {
      const workItemsResult = await this.getWorkItemsFromWIP();
      
      if (workItemsResult.success) {
        let availableItems = workItemsResult.workItems.filter(item => {
          const availableStatuses = ['pending', 'ready', 'waiting'];
          return availableStatuses.includes(item.status) && !item.assignedOperator;
        });

        // Filter by machine type if specified
        if (machineType && machineType !== 'all') {
          availableItems = availableItems.filter(item => item.machineType === machineType);
        }

        return { success: true, workItems: availableItems };
      }

      return workItemsResult;
    } catch (error) {
      console.error('❌ Get available work items error:', error);
      return { success: false, error: error.message, workItems: [] };
    }
  }

  /**
   * Assign work item to operator
   */
  static async assignWorkItemToOperator(workItemId, operatorId) {
    try {
      // Extract WIP entry ID from work item ID
      const wipEntryId = workItemId.replace('-work-item', '');
      
      const result = await this.updateWIPEntry(wipEntryId, {
        assignedOperator: operatorId,
        assignedAt: FirebaseUtils.now(),
        status: 'assigned'
      });

      return result;
    } catch (error) {
      console.error('❌ Assign work item error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Complete work item
   */
  static async completeWorkItem(workItemId, completedPieces) {
    try {
      const wipEntryId = workItemId.replace('-work-item', '');
      
      const result = await this.updateWIPEntry(wipEntryId, {
        completedPieces,
        status: 'completed',
        completedAt: FirebaseUtils.now()
      });

      return result;
    } catch (error) {
      console.error('❌ Complete work item error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get WIP summary statistics
   */
  static async getWIPSummary() {
    try {
      const service = new WIPService();
      const result = await service.getAll();

      if (result.success) {
        const summary = result.data.reduce((acc, wip) => {
          acc.total++;
          acc.totalPieces += wip.pieces || 0;
          acc.completedPieces += wip.completedPieces || 0;
          
          const status = wip.status || 'pending';
          acc.statusCounts[status] = (acc.statusCounts[status] || 0) + 1;
          
          return acc;
        }, {
          total: 0,
          totalPieces: 0,
          completedPieces: 0,
          statusCounts: {}
        });

        summary.completionRate = summary.totalPieces > 0 
          ? (summary.completedPieces / summary.totalPieces) * 100 
          : 0;

        return { success: true, summary };
      }

      return result;
    } catch (error) {
      console.error('❌ Get WIP summary error:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper Methods

  /**
   * Detect machine type based on WIP entry data
   */
  static detectMachineType(wipEntry) {
    // Simple logic to detect machine type based on article or operation
    if (wipEntry.currentOperation) {
      const operation = wipEntry.currentOperation.toLowerCase();
      if (operation.includes('overlock') || operation.includes('shoulder') || operation.includes('side')) {
        return 'overlock';
      }
      if (operation.includes('flatlock') || operation.includes('hem')) {
        return 'flatlock';
      }
      if (operation.includes('collar') || operation.includes('button')) {
        return 'singleNeedle';
      }
    }

    // Default fallback
    return 'overlock';
  }

  /**
   * Validate WIP entry data
   */
  static validateWIPData(wipData) {
    const required = ['article', 'size', 'color', 'pieces'];
    const missing = required.filter(field => !wipData[field]);
    
    if (missing.length > 0) {
      return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
    }

    if (wipData.pieces <= 0) {
      return { valid: false, error: 'Pieces must be greater than 0' };
    }

    return { valid: true };
  }

  /**
   * Calculate WIP efficiency
   */
  static calculateWIPEfficiency(wipEntries) {
    if (!wipEntries || wipEntries.length === 0) {
      return { efficiency: 0, metrics: {} };
    }

    const totalPieces = wipEntries.reduce((sum, wip) => sum + (wip.pieces || 0), 0);
    const completedPieces = wipEntries.reduce((sum, wip) => sum + (wip.completedPieces || 0), 0);
    const inProgress = wipEntries.filter(wip => wip.status === 'in_progress').length;
    const completed = wipEntries.filter(wip => wip.status === 'completed').length;

    const efficiency = totalPieces > 0 ? (completedPieces / totalPieces) * 100 : 0;

    return {
      efficiency: Math.round(efficiency * 100) / 100,
      metrics: {
        totalEntries: wipEntries.length,
        totalPieces,
        completedPieces,
        inProgress,
        completed,
        pending: wipEntries.length - inProgress - completed
      }
    };
  }
}

export default WIPService;