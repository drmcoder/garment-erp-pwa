// src/services/OperatorWalletService.js
// Service for managing operator wallet and payment holds

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

export class OperatorWalletService {
  constructor() {
    this.collectionName = 'operatorWallets';
    this.wageRecordsCollection = 'wageRecords';
  }

  /**
   * Get operator wallet balance and held amounts
   */
  async getWalletBalance(operatorId) {
    try {
      const walletRef = doc(db, this.collectionName, operatorId);
      const walletSnap = await getDoc(walletRef);

      if (walletSnap.exists()) {
        const walletData = walletSnap.data();
        return {
          success: true,
          wallet: {
            operatorId,
            availableAmount: walletData.availableAmount || 0,
            heldAmount: walletData.heldAmount || 0,
            totalEarned: walletData.totalEarned || 0,
            heldBundles: walletData.heldBundles || [],
            canWithdraw: (walletData.availableAmount || 0) > 0,
            lastUpdated: walletData.lastUpdated?.toDate?.() || walletData.lastUpdated
          }
        };
      } else {
        // Initialize wallet if doesn't exist
        return {
          success: true,
          wallet: {
            operatorId,
            availableAmount: 0,
            heldAmount: 0,
            totalEarned: 0,
            heldBundles: [],
            canWithdraw: false,
            lastUpdated: new Date()
          }
        };
      }
    } catch (error) {
      console.error('❌ Error getting wallet balance:', error);
      return {
        success: false,
        error: error.message,
        wallet: null
      };
    }
  }

  /**
   * Get detailed breakdown of held bundles
   */
  async getHeldBundlesDetails(operatorId) {
    try {
      const walletResult = await this.getWalletBalance(operatorId);
      if (!walletResult.success) {
        return walletResult;
      }

      const heldBundles = walletResult.wallet.heldBundles || [];
      if (heldBundles.length === 0) {
        return {
          success: true,
          heldBundles: []
        };
      }

      // Get details of held bundles from workItems collection
      const bundleDetails = [];
      for (const bundleId of heldBundles) {
        try {
          const bundleRef = doc(db, 'workItems', bundleId);
          const bundleSnap = await getDoc(bundleRef);
          
          if (bundleSnap.exists()) {
            const bundleData = bundleSnap.data();
            bundleDetails.push({
              bundleId,
              bundleNumber: bundleData.bundleNumber || bundleId,
              heldAmount: bundleData.heldAmount || 0,
              heldPieces: bundleData.heldPieces || 0,
              damageReportId: bundleData.damageReportId,
              paymentHoldReason: bundleData.paymentHoldReason,
              paymentHeldAt: bundleData.paymentHeldAt?.toDate?.() || bundleData.paymentHeldAt,
              operation: bundleData.operation || 'N/A',
              article: bundleData.article || 'N/A'
            });
          }
        } catch (bundleError) {
          console.warn(`⚠️ Could not load bundle details for ${bundleId}:`, bundleError.message);
        }
      }

      return {
        success: true,
        heldBundles: bundleDetails
      };
    } catch (error) {
      console.error('❌ Error getting held bundles details:', error);
      return {
        success: false,
        error: error.message,
        heldBundles: []
      };
    }
  }

  /**
   * Get recent wage records for operator
   */
  async getWageHistory(operatorId, limitCount = 20) {
    try {
      const q = query(
        collection(db, this.wageRecordsCollection),
        where('operatorId', '==', operatorId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const wageRecords = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        wageRecords.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          paymentDate: data.date // Keep the date string for grouping
        });
      });

      // Group by date for better display
      const groupedWages = {};
      wageRecords.forEach(record => {
        const date = record.paymentDate || 'Unknown';
        if (!groupedWages[date]) {
          groupedWages[date] = {
            date,
            records: [],
            totalAmount: 0
          };
        }
        groupedWages[date].records.push(record);
        groupedWages[date].totalAmount += record.amount || 0;
      });

      return {
        success: true,
        wageRecords,
        groupedWages: Object.values(groupedWages)
      };
    } catch (error) {
      console.error('❌ Error getting wage history:', error);
      return {
        success: false,
        error: error.message,
        wageRecords: []
      };
    }
  }

  /**
   * Real-time subscription to wallet changes
   */
  subscribeToWallet(operatorId, callback) {
    const walletRef = doc(db, this.collectionName, operatorId);
    
    return onSnapshot(walletRef, (doc) => {
      if (doc.exists()) {
        const walletData = doc.data();
        callback({
          operatorId,
          availableAmount: walletData.availableAmount || 0,
          heldAmount: walletData.heldAmount || 0,
          totalEarned: walletData.totalEarned || 0,
          heldBundles: walletData.heldBundles || [],
          canWithdraw: (walletData.availableAmount || 0) > 0,
          lastUpdated: walletData.lastUpdated?.toDate?.() || walletData.lastUpdated
        });
      } else {
        callback({
          operatorId,
          availableAmount: 0,
          heldAmount: 0,
          totalEarned: 0,
          heldBundles: [],
          canWithdraw: false,
          lastUpdated: new Date()
        });
      }
    });
  }

  /**
   * Calculate operator's earning summary
   */
  async getEarningSummary(operatorId, dateRange = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - dateRange);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const q = query(
        collection(db, this.wageRecordsCollection),
        where('operatorId', '==', operatorId),
        where('date', '>=', startDateStr),
        where('date', '<=', endDateStr),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      let totalEarnings = 0;
      let totalPieces = 0;
      let workDays = 0;
      const dailyEarnings = {};
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const amount = data.amount || 0;
        const pieces = data.pieces || 0;
        const date = data.date;

        totalEarnings += amount;
        totalPieces += pieces;
        
        if (!dailyEarnings[date]) {
          dailyEarnings[date] = { amount: 0, pieces: 0 };
          workDays++;
        }
        dailyEarnings[date].amount += amount;
        dailyEarnings[date].pieces += pieces;
      });

      const walletResult = await this.getWalletBalance(operatorId);
      const currentWallet = walletResult.wallet || {};

      return {
        success: true,
        summary: {
          periodDays: dateRange,
          totalEarnings,
          totalPieces,
          workDays,
          averageDailyEarning: workDays > 0 ? totalEarnings / workDays : 0,
          averagePieceRate: totalPieces > 0 ? totalEarnings / totalPieces : 0,
          currentAvailable: currentWallet.availableAmount || 0,
          currentHeld: currentWallet.heldAmount || 0,
          heldBundleCount: (currentWallet.heldBundles || []).length,
          dailyBreakdown: dailyEarnings
        }
      };
    } catch (error) {
      console.error('❌ Error calculating earning summary:', error);
      return {
        success: false,
        error: error.message,
        summary: null
      };
    }
  }
}

// Export singleton instance
export const operatorWalletService = new OperatorWalletService();
export default operatorWalletService;