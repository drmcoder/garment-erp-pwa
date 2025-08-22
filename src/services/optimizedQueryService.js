// src/services/optimizedQueryService.js
// Optimized Firebase queries to minimize index requirements

import {
  db,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  startAfter,
  endBefore,
} from "../config/firebase";

class OptimizedQueryService {
  // Get bundles with minimal index requirements
  async getBundlesForOperator(operatorId, limitCount = 20) {
    try {
      // Split complex query into simpler ones
      const q1 = query(
        collection(db, "bundles"),
        where("assignedOperator", "==", operatorId),
        orderBy("updatedAt", "desc"),
        limit(limitCount)
      );

      const snapshot = await getDocs(q1);
      const bundles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));

      // Sort by priority in memory to avoid complex index
      return bundles.sort((a, b) => {
        const priorityOrder = { उच्च: 3, मध्यम: 2, सामान्य: 1 };
        return (
          (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1)
        );
      });
    } catch (error) {
      console.error("Error getting operator bundles:", error);
      return [];
    }
  }

  // Get available bundles with simple query
  async getAvailableBundles(machineType = null, limitCount = 50) {
    try {
      let q;

      if (machineType) {
        // Simple query with machine type filter
        q = query(
          collection(db, "bundles"),
          where("status", "==", "pending"),
          where("machineType", "==", machineType),
          limit(limitCount)
        );
      } else {
        // Even simpler query without machine type
        q = query(
          collection(db, "bundles"),
          where("status", "==", "pending"),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(q);
      const bundles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));

      // Sort by priority and creation time in memory
      return bundles.sort((a, b) => {
        const priorityOrder = { उच्च: 3, मध्यम: 2, सामान्य: 1 };
        const priorityDiff =
          (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);

        if (priorityDiff !== 0) return priorityDiff;

        // If same priority, sort by creation time
        return (a.createdAt || new Date()) - (b.createdAt || new Date());
      });
    } catch (error) {
      console.error("Error getting available bundles:", error);
      return [];
    }
  }

  // Get notifications with simple query
  async getNotificationsForUser(userId, limitCount = 50) {
    try {
      const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
    } catch (error) {
      console.error("Error getting notifications:", error);
      return [];
    }
  }

  // Get unread notifications count
  async getUnreadNotificationCount(userId) {
    try {
      const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", userId),
        where("read", "==", false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  // Get wage records with date range (simplified)
  async getWageRecords(operatorId, startDate, endDate, limitCount = 100) {
    try {
      // First get all records for operator
      const q = query(
        collection(db, "wage_records"),
        where("operatorId", "==", operatorId),
        orderBy("date", "desc"),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const allRecords = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
      }));

      // Filter by date range in memory
      return allRecords.filter((record) => {
        const recordDate = record.date;
        return recordDate >= startDate && recordDate <= endDate;
      });
    } catch (error) {
      console.error("Error getting wage records:", error);
      return [];
    }
  }

  // Get production stats with simple query
  async getProductionStats(dateRange = "today", lineId = null) {
    try {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      let q;
      if (lineId) {
        q = query(
          collection(db, "production_stats"),
          where("lineId", "==", lineId),
          orderBy("date", "desc"),
          limit(100)
        );
      } else {
        q = query(
          collection(db, "production_stats"),
          orderBy("date", "desc"),
          limit(200)
        );
      }

      const snapshot = await getDocs(q);
      const allStats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate(),
      }));

      // Filter by date in memory
      return allStats.filter((stat) => stat.date >= startDate);
    } catch (error) {
      console.error("Error getting production stats:", error);
      return [];
    }
  }

  // Real-time listener for bundles (simplified)
  subscribeToBundleUpdates(operatorId, callback) {
    try {
      const q = query(
        collection(db, "bundles"),
        where("assignedOperator", "==", operatorId),
        orderBy("updatedAt", "desc"),
        limit(20)
      );

      return onSnapshot(q, (snapshot) => {
        const bundles = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));

        callback(bundles);
      });
    } catch (error) {
      console.error("Error subscribing to bundle updates:", error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Real-time listener for notifications
  subscribeToNotifications(userId, callback) {
    try {
      const q = query(
        collection(db, "notifications"),
        where("recipientId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        }));

        callback(notifications);
      });
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
      return () => {};
    }
  }

  // Paginated query helper
  async getPaginatedBundles(lastDoc = null, limitCount = 20, filters = {}) {
    try {
      let q = collection(db, "bundles");

      // Apply filters
      if (filters.status) {
        q = query(q, where("status", "==", filters.status));
      }

      if (filters.operatorId) {
        q = query(q, where("assignedOperator", "==", filters.operatorId));
      }

      // Order by updatedAt for consistent pagination
      q = query(q, orderBy("updatedAt", "desc"));

      // Add pagination
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      q = query(q, limit(limitCount));

      const snapshot = await getDocs(q);
      const bundles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));

      const lastVisible = snapshot.docs[snapshot.docs.length - 1];

      return {
        bundles,
        lastDoc: lastVisible,
        hasMore: snapshot.docs.length === limitCount,
      };
    } catch (error) {
      console.error("Error getting paginated bundles:", error);
      return { bundles: [], lastDoc: null, hasMore: false };
    }
  }

  // Batch operations for better performance
  async getBundlesByIds(bundleIds) {
    try {
      // Firebase 'in' query supports up to 10 items
      const chunks = [];
      for (let i = 0; i < bundleIds.length; i += 10) {
        chunks.push(bundleIds.slice(i, i + 10));
      }

      const allBundles = [];

      for (const chunk of chunks) {
        const q = query(
          collection(db, "bundles"),
          where("__name__", "in", chunk)
        );

        const snapshot = await getDocs(q);
        const bundles = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        }));

        allBundles.push(...bundles);
      }

      return allBundles;
    } catch (error) {
      console.error("Error getting bundles by IDs:", error);
      return [];
    }
  }
}

// Create singleton instance
const optimizedQueryService = new OptimizedQueryService();

export default optimizedQueryService;
