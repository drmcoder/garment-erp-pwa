// File: src/services/firebase-services.js
// Firebase Services - Data Operations Layer

import {
  db,
  auth,
  COLLECTIONS,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  signOut,
  writeBatch,
} from "../config/firebase";

// User Activity Logging Service
export class ActivityLogService {
  static async logActivity(userId, action, details = {}) {
    try {
      console.log('🔍 Attempting to log activity:', { userId, action, details });
      const currentUser = auth.currentUser;
      console.log('🔍 Current auth user:', currentUser?.uid);
      
      await addDoc(collection(db, 'activity_logs'), {
        userId,
        action,
        details,
        timestamp: serverTimestamp(),
        ip: await this.getClientIP()
      });
      console.log('✅ Activity logged successfully');
    } catch (error) {
      console.error('❌ Error logging activity:', {
        code: error.code,
        message: error.message,
        userId,
        action,
        isAuthenticated: !!auth.currentUser
      });
    }
  }

  static async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  static async getUserActivity(userId, limit = 50) {
    try {
      const q = query(
        collection(db, 'activity_logs'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return [];
    }
  }
}

// Firebase Connection Test Service  
export class ConnectionTestService {
  static async testFirestoreConnection() {
    try {
      console.log('🔍 Testing Firestore connection...');
      const currentUser = auth.currentUser;
      console.log('🔍 Current auth user:', currentUser?.uid);
      
      // Try to read from a simple collection
      const testRef = collection(db, 'connection_test');
      const testDoc = await getDocs(testRef);
      console.log('✅ Firestore connection successful');
      
      // Try a simple write operation
      await addDoc(collection(db, 'connection_test'), {
        test: true,
        timestamp: serverTimestamp(),
        user: currentUser?.uid || 'anonymous'
      });
      console.log('✅ Firestore write operation successful');
      
      return { success: true, authenticated: !!currentUser };
    } catch (error) {
      console.error('❌ Firestore connection test failed:', {
        code: error.code,
        message: error.message,
        isAuthenticated: !!auth.currentUser
      });
      return { success: false, error: error.message, authenticated: !!auth.currentUser };
    }
  }
}

// Enhanced Data Persistence Service
export class DataPersistenceService {
  static async saveWorkSession(data) {
    try {
      console.log('🔍 Attempting to save work session:', data);
      const currentUser = auth.currentUser;
      console.log('🔍 Current auth user:', currentUser?.uid);
      
      const docRef = await addDoc(collection(db, 'work_sessions'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log('✅ Work session saved successfully:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving work session:', {
        code: error.code,
        message: error.message,
        data,
        isAuthenticated: !!auth.currentUser
      });
      throw error;
    }
  }

  static async updateWorkSession(sessionId, updates) {
    try {
      await updateDoc(doc(db, 'work_sessions', sessionId), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating work session:', error);
      throw error;
    }
  }

  static async saveProductionData(data) {
    try {
      const batch = writeBatch(db);
      
      // Save main production record
      const prodRef = doc(collection(db, 'production_data'));
      batch.set(prodRef, {
        ...data,
        timestamp: serverTimestamp()
      });

      // Update daily stats
      const today = new Date().toISOString().split('T')[0];
      const statsRef = doc(db, 'daily_stats', today);
      batch.update(statsRef, {
        totalPieces: increment(data.pieces || 0),
        totalOperators: increment(data.operators || 0),
        efficiency: data.efficiency || 0
      });

      await batch.commit();
      return prodRef.id;
    } catch (error) {
      console.error('Error saving production data:', error);
      throw error;
    }
  }
}

// Authentication Service
export class AuthService {
  // Login with username/email
  static async login(usernameOrEmail, password, role = "operator") {
    try {
      // First, find user by username in the appropriate collection
      const userCollection =
        role === "operator"
          ? COLLECTIONS.OPERATORS
          : role === "supervisor"
          ? COLLECTIONS.SUPERVISORS
          : COLLECTIONS.MANAGEMENT;

      const userQuery = query(
        collection(db, userCollection),
        where("username", "==", usernameOrEmail)
      );

      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        throw new Error("User not found");
      }

      const userData = userSnapshot.docs[0].data();

      // For demo purposes, check password directly
      // In production, use Firebase Auth with email
      if (userData.password !== password) {
        throw new Error("Invalid password");
      }

      // Update last login
      await updateDoc(doc(db, userCollection, userData.id), {
        lastLogin: serverTimestamp(),
      });

      // Log activity
      await ActivityLogService.logActivity(userData.id, 'login', {
        role: userData.role,
        station: userData.station
      });

      return {
        success: true,
        user: {
          id: userData.id,
          username: userData.username,
          name: userData.name,
          nameEn: userData.nameEn,
          role: userData.role,
          machine: userData.machine,
          station: userData.station,
          department: userData.department,
          permissions: userData.permissions || [],
        },
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Logout
  static async logout() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  }

  // Get current user details
  static async getCurrentUser(userId, role) {
    try {
      const userCollection =
        role === "operator"
          ? COLLECTIONS.OPERATORS
          : role === "supervisor"
          ? COLLECTIONS.SUPERVISORS
          : COLLECTIONS.MANAGEMENT;

      const userDoc = await getDoc(doc(db, userCollection, userId));

      if (!userDoc.exists()) {
        throw new Error("User not found");
      }

      return {
        success: true,
        user: userDoc.data(),
      };
    } catch (error) {
      console.error("Get user error:", error);
      return { success: false, error: error.message };
    }
  }
}

// Bundle Service
export class BundleService {
  // Get all bundles
  static async getAllBundles() {
    try {
      const bundlesSnapshot = await getDocs(
        query(collection(db, COLLECTIONS.BUNDLES), orderBy("createdAt", "desc"))
      );

      const bundles = bundlesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, bundles };
    } catch (error) {
      console.error("Get bundles error:", error);
      return { success: false, error: error.message };
    }
  }

  // Get bundles for specific operator
  static async getOperatorBundles(operatorId, machineType = null) {
    try {
      // Base query for operator's assigned bundles
      let bundleQuery = query(
        collection(db, COLLECTIONS.BUNDLES),
        where("assignedOperator", "==", operatorId),
        orderBy("priority", "desc"),
        orderBy("createdAt", "asc")
      );

      // If machine type is specified, add machine filter for extra security
      if (machineType) {
        bundleQuery = query(
          collection(db, COLLECTIONS.BUNDLES),
          where("assignedOperator", "==", operatorId),
          where("machineType", "==", machineType),
          orderBy("priority", "desc"),
          orderBy("createdAt", "asc")
        );
      }

      const bundlesSnapshot = await getDocs(bundleQuery);

      const bundles = bundlesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, bundles };
    } catch (error) {
      console.error("Get operator bundles error:", error);
      return { success: false, error: error.message };
    }
  }

  // Get available bundles for assignment
  static async getAvailableBundles(machineType = null) {
    try {
      let bundleQuery = query(
        collection(db, COLLECTIONS.BUNDLES),
        where("status", "==", "pending"),
        orderBy("priority", "desc"),
        orderBy("createdAt", "asc")
      );

      if (machineType) {
        bundleQuery = query(
          collection(db, COLLECTIONS.BUNDLES),
          where("status", "==", "pending"),
          where("machineType", "==", machineType),
          orderBy("priority", "desc"),
          orderBy("createdAt", "asc")
        );
      }

      const bundlesSnapshot = await getDocs(bundleQuery);

      const bundles = bundlesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, bundles };
    } catch (error) {
      console.error("Get available bundles error:", error);
      return { success: false, error: error.message };
    }
  }

  // Assign bundle to operator
  static async assignBundle(bundleId, operatorId, supervisorId) {
    try {
      const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundleId);

      // Check if bundle exists first
      const bundleDoc = await getDoc(bundleRef);
      if (!bundleDoc.exists()) {
        return { success: false, error: `Bundle ${bundleId} not found` };
      }

      await updateDoc(bundleRef, {
        assignedOperator: operatorId,
        currentOperatorId: operatorId,
        status: "assigned",
        assignedAt: serverTimestamp(),
        assignedBy: supervisorId,
        updatedAt: serverTimestamp(),
      });

      // Update operator's current bundle
      const operatorRef = doc(db, COLLECTIONS.OPERATORS, operatorId);
      const operatorDoc = await getDoc(operatorRef);
      
      if (operatorDoc.exists()) {
        await updateDoc(operatorRef, {
          currentBundle: bundleId,
        });
      } else {
        console.warn(`Operator ${operatorId} not found, skipping operator update`);
      }

      // Create notification for operator
      await NotificationService.createNotification({
        title: "नयाँ काम तोकिएको",
        titleEn: "New Work Assigned",
        message: `बन्डल #${bundleId} तपाईंको स्टेसनमा तयार छ`,
        messageEn: `Bundle #${bundleId} ready at your station`,
        type: "work_assignment",
        priority: "high",
        targetUser: operatorId,
        targetRole: "operator",
        bundleId: bundleId,
        actionRequired: true,
      });

      return { success: true };
    } catch (error) {
      console.error("Assign bundle error:", error);
      return { success: false, error: error.message };
    }
  }

  // Start work on bundle
  static async startWork(bundleId, operatorId) {
    try {
      const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundleId);

      await updateDoc(bundleRef, {
        status: "in-progress",
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error("Start work error:", error);
      return { success: false, error: error.message };
    }
  }

  // Complete work on bundle
  static async completeWork(bundleId, completionData) {
    try {
      const {
        operatorId,
        completedPieces,
        defectivePieces,
        qualityGood,
        qualityNotes,
        actualTime,
      } = completionData;

      const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundleId);
      const bundleDoc = await getDoc(bundleRef);

      if (!bundleDoc.exists()) {
        throw new Error("Bundle not found");
      }

      const bundleData = bundleDoc.data();
      const earnings = completedPieces * bundleData.rate;
      const qualityScore =
        completedPieces > 0
          ? Math.round(
              ((completedPieces - defectivePieces) / completedPieces) * 100
            )
          : 100;

      // Update bundle
      await updateDoc(bundleRef, {
        status: qualityGood ? "completed" : "quality-check",
        completedAt: serverTimestamp(),
        completedPieces,
        defectivePieces,
        qualityStatus: qualityGood ? "passed" : "rework",
        qualityNotes: qualityNotes || "",
        actualTime,
        qualityScore,
        updatedAt: serverTimestamp(),
      });

      // Update operator stats
      const operatorRef = doc(db, COLLECTIONS.OPERATORS, operatorId);
      await updateDoc(operatorRef, {
        currentBundle: null,
        "todayStats.piecesCompleted": increment(completedPieces),
        "todayStats.earnings": increment(earnings),
        "todayStats.defects": increment(defectivePieces),
      });

      // Create wage record
      await addDoc(collection(db, COLLECTIONS.WAGE_RECORDS), {
        operatorId,
        bundleId,
        date: new Date().toISOString().split("T")[0],
        pieces: completedPieces,
        rate: bundleData.rate,
        earnings,
        article: bundleData.article,
        operation: bundleData.currentOperation,
        qualityScore,
        createdAt: serverTimestamp(),
      });

      return {
        success: true,
        earnings,
        qualityScore,
      };
    } catch (error) {
      console.error("Complete work error:", error);
      return { success: false, error: error.message };
    }
  }

  // Real-time bundle updates subscription
  static subscribeToOperatorBundles(operatorId, callback) {
    const q = query(
      collection(db, COLLECTIONS.BUNDLES),
      where("assignedOperator", "==", operatorId),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const bundles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(bundles);
    });
  }
}

// Notification Service
export class NotificationService {
  // Create notification
  static async createNotification(notificationData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
        ...notificationData,
        read: false,
        createdAt: serverTimestamp(),
      });

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Create notification error:", error);
      return { success: false, error: error.message };
    }
  }

  // Get notifications for user
  static async getUserNotifications(userId, role, limit_count = 20) {
    try {
      const notificationsSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.NOTIFICATIONS),
          where("targetUser", "==", userId),
          orderBy("createdAt", "desc"),
          limit(limit_count)
        )
      );

      const notifications = notificationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, notifications };
    } catch (error) {
      console.error("Get notifications error:", error);
      return { success: false, error: error.message };
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId) {
    try {
      await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), {
        read: true,
        readAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error("Mark notification read error:", error);
      return { success: false, error: error.message };
    }
  }

  // Real-time notifications subscription
  static subscribeToUserNotifications(userId, callback) {
    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where("targetUser", "==", userId),
      where("read", "==", false),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(notifications);
    });
  }
}

// Production Statistics Service
export class ProductionService {
  // Get today's production stats
  static async getTodayStats() {
    try {
      const today = new Date().toISOString().split("T")[0];
      const statsDoc = await getDoc(
        doc(db, COLLECTIONS.PRODUCTION_STATS, today)
      );

      if (!statsDoc.exists()) {
        // Return default stats if none exist
        return {
          success: true,
          stats: {
            totalProduction: 0,
            targetProduction: 5000,
            efficiency: 0,
            qualityScore: 100,
            activeOperators: 0,
            completedBundles: 0,
            pendingBundles: 0,
          },
        };
      }

      return {
        success: true,
        stats: statsDoc.data(),
      };
    } catch (error) {
      console.error("Get today stats error:", error);
      return { success: false, error: error.message };
    }
  }

  // Update production stats
  static async updateProductionStats(updates) {
    try {
      const today = new Date().toISOString().split("T")[0];
      const statsRef = doc(db, COLLECTIONS.PRODUCTION_STATS, today);

      await updateDoc(statsRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error("Update production stats error:", error);
      return { success: false, error: error.message };
    }
  }

  // Get line status
  static async getLineStatus(lineId = "line-1") {
    try {
      const lineDoc = await getDoc(doc(db, COLLECTIONS.LINE_STATUS, lineId));

      if (!lineDoc.exists()) {
        throw new Error("Line status not found");
      }

      return {
        success: true,
        lineStatus: lineDoc.data(),
      };
    } catch (error) {
      console.error("Get line status error:", error);
      return { success: false, error: error.message };
    }
  }

  // Real-time line status subscription
  static subscribeToLineStatus(lineId, callback) {
    return onSnapshot(doc(db, COLLECTIONS.LINE_STATUS, lineId), (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      }
    });
  }
}

// Quality Service
export class QualityService {
  // Report quality issue
  static async reportQualityIssue(issueData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.QUALITY_ISSUES), {
        ...issueData,
        status: "reported",
        createdAt: serverTimestamp(),
      });

      // Create notification for supervisor
      await NotificationService.createNotification({
        title: "गुणस्तर समस्या रिपोर्ट",
        titleEn: "Quality Issue Reported",
        message: `बन्डल #${issueData.bundleId} मा गुणस्तर समस्या`,
        messageEn: `Quality issue reported in Bundle #${issueData.bundleId}`,
        type: "quality_alert",
        priority: "high",
        targetUser: issueData.supervisorId,
        targetRole: "supervisor",
        bundleId: issueData.bundleId,
        actionRequired: true,
      });

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Report quality issue error:", error);
      return { success: false, error: error.message };
    }
  }

  // Get quality issues
  static async getQualityIssues(filters = {}) {
    try {
      let q = collection(db, COLLECTIONS.QUALITY_ISSUES);

      if (filters.bundleId) {
        q = query(q, where("bundleId", "==", filters.bundleId));
      }

      if (filters.operatorId) {
        q = query(q, where("reportedBy", "==", filters.operatorId));
      }

      q = query(q, orderBy("createdAt", "desc"));

      const issuesSnapshot = await getDocs(q);
      const issues = issuesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, issues };
    } catch (error) {
      console.error("Get quality issues error:", error);
      return { success: false, error: error.message };
    }
  }
}

// Operator Service for work assignment system
export class OperatorService {
  // Get all active operators
  static async getActiveOperators() {
    try {
      const operatorsSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.OPERATORS),
          orderBy("name", "asc")
        )
      );

      const operators = operatorsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, operators };
    } catch (error) {
      console.error("Get active operators error:", error);
      return { success: false, error: error.message };
    }
  }

  // Get operators by speciality
  static async getOperatorsBySpeciality(speciality) {
    try {
      const operatorsSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.OPERATORS),
          where("speciality", "==", speciality),
          orderBy("efficiency", "desc")
        )
      );

      const operators = operatorsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, operators };
    } catch (error) {
      console.error("Get operators by speciality error:", error);
      return { success: false, error: error.message };
    }
  }

  // Update operator workload
  static async updateOperatorWorkload(operatorId, workloadChange) {
    try {
      const operatorRef = doc(db, COLLECTIONS.OPERATORS, operatorId);
      await updateDoc(operatorRef, {
        currentWorkload: increment(workloadChange),
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error) {
      console.error("Update operator workload error:", error);
      return { success: false, error: error.message };
    }
  }

  // Get operator availability
  static async getOperatorAvailability(operatorId) {
    try {
      const operatorDoc = await getDoc(doc(db, COLLECTIONS.OPERATORS, operatorId));
      
      if (!operatorDoc.exists()) {
        throw new Error("Operator not found");
      }

      const operatorData = operatorDoc.data();
      const isAvailable = operatorData.currentWorkload < operatorData.maxWorkload;

      return { 
        success: true, 
        available: isAvailable,
        currentWorkload: operatorData.currentWorkload,
        maxWorkload: operatorData.maxWorkload
      };
    } catch (error) {
      console.error("Get operator availability error:", error);
      return { success: false, error: error.message };
    }
  }
}

// Work Assignment Service
export class WorkAssignmentService {
  // Get assignment history
  static async getAssignmentHistory(supervisorId = null, limit_count = 50) {
    try {
      let assignmentQuery = query(
        collection(db, COLLECTIONS.ASSIGNMENT_HISTORY),
        orderBy("assignedAt", "desc"),
        limit(limit_count)
      );

      if (supervisorId) {
        // Now we can use both where and orderBy since the composite index exists
        assignmentQuery = query(
          collection(db, COLLECTIONS.ASSIGNMENT_HISTORY),
          where("assignedBy", "==", supervisorId),
          orderBy("assignedAt", "desc"),
          limit(limit_count)
        );
      }

      const assignmentSnapshot = await getDocs(assignmentQuery);
      const assignments = assignmentSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return { success: true, assignments };
    } catch (error) {
      console.error("Get assignment history error:", error);
      return { success: false, error: error.message };
    }
  }

  // Create assignment record
  static async createAssignmentRecord(assignmentData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.ASSIGNMENT_HISTORY), {
        ...assignmentData,
        assignedAt: serverTimestamp(),
        status: "assigned",
        createdAt: serverTimestamp(),
      });

      return { success: true, id: docRef.id };
    } catch (error) {
      console.error("Create assignment record error:", error);
      return { success: false, error: error.message };
    }
  }

  // Get active work assignments
  static async getActiveWorkAssignments() {
    try {
      // Query for assigned bundles (without orderBy to avoid index requirement)
      const assignedSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.BUNDLES),
          where("status", "==", "assigned")
        )
      );

      // Query for in-progress bundles (without orderBy to avoid index requirement)
      const inProgressSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.BUNDLES),
          where("status", "==", "in-progress")
        )
      );

      // Combine results
      const assignedWork = assignedSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const inProgressWork = inProgressSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Merge and sort by assignedAt or createdAt as fallback
      const activeWork = [...assignedWork, ...inProgressWork].sort((a, b) => {
        const aTime = a.assignedAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(a.assignedAt || a.createdAt || 0);
        const bTime = b.assignedAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(b.assignedAt || b.createdAt || 0);
        return bTime - aTime;
      });

      return { success: true, activeWork };
    } catch (error) {
      console.error("Get active work assignments error:", error);
      return { success: false, error: error.message };
    }
  }

  // Mark work as completed
  static async markWorkAsCompleted(workId, completionData) {
    try {
      const workRef = doc(db, COLLECTIONS.BUNDLES, workId);
      await updateDoc(workRef, {
        status: "completed",
        completedAt: serverTimestamp(),
        completedPieces: completionData.completedPieces,
        actualTime: completionData.actualTime,
        earnings: completionData.earnings,
        updatedAt: serverTimestamp(),
      });

      // Update assignment history
      const historyQuery = query(
        collection(db, COLLECTIONS.ASSIGNMENT_HISTORY),
        where("bundleId", "==", workId),
        where("status", "==", "assigned")
      );

      const historySnapshot = await getDocs(historyQuery);
      if (!historySnapshot.empty) {
        const historyDoc = historySnapshot.docs[0];
        await updateDoc(historyDoc.ref, {
          status: "completed",
          completedAt: serverTimestamp(),
          ...completionData,
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Mark work as completed error:", error);
      return { success: false, error: error.message };
    }
  }
}

// All services are already exported individually above
