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
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction,
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
      // Use local network information instead of external service to comply with CSP
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const networkInfo = connection ? `${connection.effectiveType}-${connection.downlink}mbps` : 'unknown';
      return `local-${networkInfo}`;
    } catch {
      return 'local-unknown';
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
      await getDocs(testRef);
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
      console.log('🔍 Loading available bundles/work items from WIP data...');
      
      // First try to get work items from WIP
      const wipWorkItems = await WIPService.getWorkItemsFromWIP();
      
      if (wipWorkItems.success && wipWorkItems.workItems.length > 0) {
        console.log(`✅ Found ${wipWorkItems.workItems.length} work items from WIP`);
        
        // Filter by machine type if specified
        let filteredWorkItems = wipWorkItems.workItems.filter(item => {
          // For self-assignment, only include unassigned work that's available for assignment
          // Exclude completed, in_progress, or assigned statuses but INCLUDE self_assigned for supervisor review
          const excludedStatuses = ['operator_completed', 'completed', 'in_progress', 'assigned'];
          const isAvailable = !excludedStatuses.includes(item.status) && (!item.assignedOperator || item.status === 'self_assigned');
          
          // Debug logging to see what's being filtered
          if (!isAvailable) {
            console.log(`🚫 Filtering out work item ${item.id}: status=${item.status}, assignedOperator=${item.assignedOperator}`);
          }
          
          return isAvailable;
        });
        
        if (machineType && machineType !== 'all') {
          const beforeCount = filteredWorkItems.length;
          filteredWorkItems = filteredWorkItems.filter(item => {
            const machineMatch = item.machineType === machineType;
            if (!machineMatch) {
              console.log(`🚫 Machine mismatch for ${item.id}: expected=${machineType}, actual=${item.machineType}`);
            }
            return machineMatch;
          });
          console.log(`🔧 Machine filter: ${beforeCount} → ${filteredWorkItems.length} items (machine: ${machineType})`);
        }
        
        // Format work items to match expected bundle structure
        const bundles = filteredWorkItems.map((workItem, index) => {
          // Debug first few items during formatting
          if (index < 2) {
            console.log(`🔍 Formatting work item ${index}:`, {
              id: workItem.id,
              wipEntryId: workItem.wipEntryId,
              currentOperation: workItem.currentOperation,
              beforeFormatting: 'Has these fields'
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
        
        // Debug: check first formatted bundle
        if (bundles.length > 0) {
          console.log(`🔍 First formatted bundle:`, {
            id: bundles[0].id,
            wipEntryId: bundles[0].wipEntryId,
            currentOperation: bundles[0].currentOperation,
            afterFormatting: 'Final result'
          });
        }
        
        console.log(`✅ Returning ${bundles.length} formatted work items as bundles`);
        return { success: true, bundles };
      }
      
      // Fallback to original bundle logic if no WIP work items
      console.log('⚠️ No WIP work items found, falling back to original bundle logic');
      
      let bundleQuery;
      
      // Simplified query to avoid composite index requirements
      if (machineType && machineType !== 'all') {
        bundleQuery = query(
          collection(db, COLLECTIONS.BUNDLES),
          where("machineType", "==", machineType),
          where("status", "in", ["pending", "ready", "waiting"])
        );
      } else {
        bundleQuery = query(
          collection(db, COLLECTIONS.BUNDLES),
          where("status", "in", ["pending", "ready", "waiting"])
        );
      }

      const bundlesSnapshot = await getDocs(bundleQuery);

      const bundles = bundlesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Enrich bundles with work history
      const enrichedBundles = await Promise.all(bundles.map(async (bundle) => {
        try {
          // Get latest assignment history for this bundle
          const historyQuery = query(
            collection(db, COLLECTIONS.ASSIGNMENT_HISTORY),
            where("bundleId", "==", bundle.id)
          );
          
          const historySnapshot = await getDocs(historyQuery);
          let lastWorker = null;
          let lastAction = null;
          let lastActionDate = null;

          if (!historySnapshot.empty) {
            // Sort by assignedAt desc to get latest
            const histories = historySnapshot.docs
              .map(doc => doc.data())
              .sort((a, b) => {
                const aTime = a.assignedAt?.toDate?.() || new Date(0);
                const bTime = b.assignedAt?.toDate?.() || new Date(0);
                return bTime - aTime;
              });

            if (histories.length > 0) {
              const latestHistory = histories[0];
              lastWorker = latestHistory.operatorName || latestHistory.operatorId;
              lastAction = latestHistory.status === 'completed' ? 'Completed' : 'Worked on';
              lastActionDate = latestHistory.assignedAt;
            }
          }

          return {
            ...bundle,
            lastWorker,
            lastAction,
            lastActionDate
          };
        } catch (error) {
          console.warn('Failed to get history for bundle', bundle.id, error);
          return bundle;
        }
      }));

      // Sort client-side: priority desc, then createdAt asc
      enrichedBundles.sort((a, b) => {
        // First by priority (desc)
        if (b.priority !== a.priority) {
          return (b.priority || 0) - (a.priority || 0);
        }
        // Then by createdAt (asc)
        const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return new Date(aTime) - new Date(bTime);
      });

      return { success: true, bundles: enrichedBundles };
    } catch (error) {
      console.error("Get available bundles error:", error);
      return { success: false, error: error.message };
    }
  }

  // Atomic self-assignment with race condition protection
  static async selfAssignBundle(bundleId, operatorId) {
    try {
      // Use atomic transaction to prevent race conditions
      const result = await runTransaction(db, async (transaction) => {
        const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundleId);
        const bundleDoc = await transaction.get(bundleRef);
        
        if (!bundleDoc.exists()) {
          throw new Error(`Work no longer available - not found in system`);
        }
        
        const bundleData = bundleDoc.data();
        
        // Only allow self-assignment if work is available
        if (!['ready', 'pending'].includes(bundleData.status)) {
          throw new Error(`Work no longer available - already ${bundleData.status}`);
        }
        
        // Check if already assigned to someone else
        if (bundleData.assignedOperator && bundleData.assignedOperator !== operatorId) {
          throw new Error(`Work already requested by another operator`);
        }
        
        // Atomic update to self_assigned status
        transaction.update(bundleRef, {
          assignedOperator: operatorId,
          currentOperatorId: operatorId,
          status: 'self_assigned',
          selfAssignedAt: serverTimestamp(),
          requestedBy: operatorId,
          assignedBy: operatorId, // Self-assignment
          updatedAt: serverTimestamp(),
        });
        
        return { success: true, bundleData };
      });
      
      // Send immediate notification to supervisors
      await NotificationService.createNotification({
        title: "नयाँ स्वयं असाइनमेन्ट अनुरोध",
        titleEn: "New Self-Assignment Request",
        message: `${operatorId} ले बन्डल #${bundleId} का लागि अनुरोध गर्यो`,
        messageEn: `${operatorId} requested Bundle #${bundleId}`,
        type: "self_assignment_request",
        priority: "medium", 
        targetRole: "supervisor",
        bundleId: bundleId,
        requestedBy: operatorId,
        actionRequired: true
      });

      console.log(`✅ Bundle ${bundleId} atomically self-assigned to ${operatorId} with supervisor notification`);
      return result;
      
    } catch (error) {
      console.log(`❌ Self-assignment failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Get all self-assigned work for supervisor review
  static async getSelfAssignedWork() {
    try {
      const q = query(
        collection(db, COLLECTIONS.BUNDLES),
        where('status', '==', 'self_assigned'),
        orderBy('selfAssignedAt', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const workItems = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Get operator name
        const operatorDoc = await getDoc(doc(db, COLLECTIONS.OPERATORS, data.requestedBy));
        const operatorName = operatorDoc.exists() ? operatorDoc.data().name : 'Unknown Operator';
        
        workItems.push({
          id: doc.id,
          ...data,
          requestedByName: operatorName
        });
      }
      
      return { success: true, workItems };
    } catch (error) {
      console.error('Failed to get self-assigned work:', error);
      return { success: false, error: error.message };
    }
  }

  // Approve self-assignment
  static async approveSelfAssignment(bundleId, supervisorId) {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundleId);
        const bundleDoc = await transaction.get(bundleRef);
        
        if (!bundleDoc.exists()) {
          throw new Error('Bundle not found');
        }
        
        const bundleData = bundleDoc.data();
        
        if (bundleData.status !== 'self_assigned') {
          throw new Error('Bundle is not in self_assigned status');
        }
        
        // Update to assigned status
        transaction.update(bundleRef, {
          status: 'assigned',
          approvedBy: supervisorId,
          approvedAt: serverTimestamp(),
          assignedBy: supervisorId, // Supervisor becomes the assigner
          assignedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        return { success: true, bundleData };
      });
      
      // Create notification for operator
      await NotificationService.createNotification({
        title: "काम अनुमोदन भयो",
        titleEn: "Work Approved",
        message: `बन्डल #${bundleId} अनुमोदन भयो - काम सुरु गर्न सक्नुहुन्छ`,
        messageEn: `Bundle #${bundleId} approved - you can start working`,
        type: "work_approved",
        priority: "high",
        targetUser: result.bundleData.requestedBy,
        targetRole: "operator",
        bundleId: bundleId
      });
      
      console.log(`✅ Bundle ${bundleId} self-assignment approved by ${supervisorId}`);
      return result;
      
    } catch (error) {
      console.error('Failed to approve self-assignment:', error);
      return { success: false, error: error.message };
    }
  }

  // Reject self-assignment
  static async rejectSelfAssignment(bundleId, supervisorId, reason = '') {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundleId);
        const bundleDoc = await transaction.get(bundleRef);
        
        if (!bundleDoc.exists()) {
          throw new Error('Bundle not found');
        }
        
        const bundleData = bundleDoc.data();
        
        if (bundleData.status !== 'self_assigned') {
          throw new Error('Bundle is not in self_assigned status');
        }
        
        // Reset to ready status and clear assignment
        transaction.update(bundleRef, {
          status: 'ready',
          assignedOperator: null,
          currentOperatorId: null,
          requestedBy: null,
          selfAssignedAt: null,
          rejectedBy: supervisorId,
          rejectedAt: serverTimestamp(),
          rejectionReason: reason,
          updatedAt: serverTimestamp()
        });
        
        return { success: true, bundleData };
      });
      
      // Create notification for operator
      await NotificationService.createNotification({
        title: "काम अस्वीकार गरियो",
        titleEn: "Work Rejected",
        message: reason ? 
          `बन्डल #${bundleId} अस्वीकार: ${reason}` :
          `बन्डल #${bundleId} अस्वीकार गरियो`,
        messageEn: reason ?
          `Bundle #${bundleId} rejected: ${reason}` :
          `Bundle #${bundleId} was rejected`,
        type: "work_rejected",
        priority: "medium",
        targetUser: result.bundleData.requestedBy,
        targetRole: "operator",
        bundleId: bundleId
      });
      
      console.log(`❌ Bundle ${bundleId} self-assignment rejected by ${supervisorId}`);
      return result;
      
    } catch (error) {
      console.error('Failed to reject self-assignment:', error);
      return { success: false, error: error.message };
    }
  }

  // Reassign work to different operator
  static async reassignWork(bundleId, newOperatorId, supervisorId) {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundleId);
        const bundleDoc = await transaction.get(bundleRef);
        
        if (!bundleDoc.exists()) {
          throw new Error('Bundle not found');
        }
        
        const bundleData = bundleDoc.data();
        const originalOperator = bundleData.requestedBy;
        
        // Update assignment to new operator
        transaction.update(bundleRef, {
          status: 'assigned',
          assignedOperator: newOperatorId,
          currentOperatorId: newOperatorId,
          assignedBy: supervisorId,
          assignedAt: serverTimestamp(),
          reassignedFrom: originalOperator,
          reassignedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        return { success: true, bundleData, originalOperator, newOperatorId };
      });
      
      // Get operator names for notifications
      const [originalOpDoc, newOpDoc] = await Promise.all([
        getDoc(doc(db, COLLECTIONS.OPERATORS, result.originalOperator)),
        getDoc(doc(db, COLLECTIONS.OPERATORS, result.newOperatorId))
      ]);
      
      const originalOpName = originalOpDoc.exists() ? originalOpDoc.data().name : 'Unknown';
      const newOpName = newOpDoc.exists() ? newOpDoc.data().name : 'Unknown';
      
      // Notify original operator
      await NotificationService.createNotification({
        title: "काम पुनः असाइन गरियो",
        titleEn: "Work Reassigned",
        message: `बन्डल #${bundleId} ${newOpName} लाई दिइयो`,
        messageEn: `Bundle #${bundleId} was assigned to ${newOpName}`,
        type: "work_reassigned",
        priority: "medium",
        targetUser: result.originalOperator,
        targetRole: "operator",
        bundleId: bundleId
      });
      
      // Notify new operator
      await NotificationService.createNotification({
        title: "नयाँ काम असाइन",
        titleEn: "New Work Assigned",
        message: `बन्डल #${bundleId} तपाईंलाई असाइन गरियो`,
        messageEn: `Bundle #${bundleId} has been assigned to you`,
        type: "work_assignment",
        priority: "high",
        targetUser: result.newOperatorId,
        targetRole: "operator",
        bundleId: bundleId
      });
      
      console.log(`🔄 Bundle ${bundleId} reassigned from ${originalOpName} to ${newOpName}`);
      return result;
      
    } catch (error) {
      console.error('Failed to reassign work:', error);
      return { success: false, error: error.message };
    }
  }

  // Assign bundle to operator
  static async assignBundle(bundleId, operatorId, supervisorId) {
    try {
      const bundleRef = doc(db, COLLECTIONS.BUNDLES, bundleId);

      // Check if bundle exists and is available
      const bundleDoc = await getDoc(bundleRef);
      if (!bundleDoc.exists()) {
        return { 
          success: false, 
          error: `Bundle ${bundleId} not found in Firestore`,
          errorCode: 'BUNDLE_NOT_FOUND'
        };
      }

      const bundleData = bundleDoc.data();
      if (bundleData.status !== 'pending') {
        return { 
          success: false, 
          error: `Bundle ${bundleId} is not available (status: ${bundleData.status})` 
        };
      }

      if (bundleData.assignedOperator && bundleData.assignedOperator !== operatorId) {
        return { 
          success: false, 
          error: `Bundle ${bundleId} is already assigned to another operator` 
        };
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
  // Get all active operators with machine assignments from User Management
  static async getActiveOperators() {
    try {
      const operatorsSnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.OPERATORS),
          orderBy("name", "asc")
        )
      );

      const operators = operatorsSnapshot.docs
        .map((doc) => {
          const userData = doc.data();
          return {
            id: doc.id,
            username: userData.username,
            name: userData.name || userData.nameEn,
            nameNp: userData.nameNepali || userData.name,
            nameEn: userData.nameEn || userData.name,
            photo: userData.photo || '👨‍🏭',
            role: 'operator',
            station: userData.station,
            stationNp: userData.stationNp || userData.station,
            // Get machine assignment from User Management data
            machine: userData.assignedMachine || (userData.machines && userData.machines[0]) || 'manual',
            machines: userData.assignedMachine ? [userData.assignedMachine] : userData.machines || ['manual'],
            skillLevel: userData.skillLevel || 'medium',
            efficiency: userData.efficiency || 75,
            currentLoad: userData.currentLoad || 0,
            maxLoad: userData.maxLoad || 5,
            status: userData.active !== false ? 'available' : 'inactive',
            active: userData.active !== false,
            createdAt: userData.createdAt?.toDate() || new Date()
          };
        })
        .filter(operator => operator.active); // Only return active operators

      console.log('🔍 OperatorService.getActiveOperators loaded operators with machines:', operators.length);
      console.log('🔍 Sample operator with machine assignment:', operators[0]);

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

  // Delete operator (soft delete - set active to false)
  static async deleteOperator(operatorId) {
    try {
      console.log('🗑️ Deleting operator:', operatorId);
      
      // Soft delete - set active to false instead of actual deletion
      await updateDoc(doc(db, COLLECTIONS.OPERATORS, operatorId), {
        active: false,
        deletedAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      console.log('✅ Operator deleted successfully (soft delete)');
      return { success: true };
    } catch (error) {
      console.error("❌ Delete operator error:", error);
      return { success: false, error: error.message };
    }
  }

  // Permanently delete operator (hard delete)
  static async permanentlyDeleteOperator(operatorId) {
    try {
      console.log('🗑️ Permanently deleting operator:', operatorId);
      
      await deleteDoc(doc(db, COLLECTIONS.OPERATORS, operatorId));

      console.log('✅ Operator permanently deleted');
      return { success: true };
    } catch (error) {
      console.error("❌ Permanently delete operator error:", error);
      return { success: false, error: error.message };
    }
  }

  // Get operators by machine type for emergency work assignment
  static async getOperatorsByMachine(machineType) {
    try {
      const operatorsQuery = query(
        collection(db, COLLECTIONS.OPERATORS),
        where("machine", "==", machineType)
      );
      
      const snapshot = await getDocs(operatorsQuery);
      const operators = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      
      return { success: true, operators };
    } catch (error) {
      console.error('Failed to get operators by machine:', error);
      return { success: false, error: error.message };
    }
  }
}

// Work Assignment Service
// WIP (Work in Progress) Service
export class WIPService {
  static async saveWIPEntry(wipData) {
    try {
      console.log('🏗️ Saving WIP entry:', wipData);
      
      const currentUser = auth.currentUser;
      const wipEntry = {
        lotNumber: wipData.lotNumber,
        nepaliDate: wipData.nepaliDate,
        fabricName: wipData.fabricName,
        fabricWidth: wipData.fabricWidth,
        fabricStore: wipData.fabricStore,
        totalRolls: wipData.totalRolls,
        totalPieces: wipData.totalPieces,
        parsedStyles: wipData.parsedStyles,
        articleSizes: wipData.articleSizes,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser?.uid || 'anonymous'
      };

      // Save main WIP entry
      const wipRef = await addDoc(collection(db, COLLECTIONS.WIP_ENTRIES), wipEntry);
      console.log('✅ WIP entry saved with ID:', wipRef.id);

      // Save individual rolls
      const rollPromises = wipData.rolls.map(roll => 
        addDoc(collection(db, COLLECTIONS.WIP_ROLLS), {
          wipEntryId: wipRef.id,
          rollNumber: roll.rollNumber,
          colorName: roll.colorName,
          layerCount: roll.layerCount,
          markedWeight: roll.markedWeight,
          actualWeight: roll.actualWeight,
          pieces: roll.pieces,
          createdAt: serverTimestamp()
        })
      );

      await Promise.all(rollPromises);
      console.log('✅ All rolls saved successfully');

      // Generate work items from WIP
      await this.generateWorkItemsFromWIP(wipRef.id, wipData);

      return { success: true, wipId: wipRef.id };
    } catch (error) {
      console.error('❌ Error saving WIP entry:', error);
      return { success: false, error: error.message };
    }
  }

  static async generateWorkItemsFromWIP(wipEntryId, wipData) {
    try {
      console.log('🔧 Generating work items from WIP:', wipEntryId);
      
      // Process each style and roll combination
      for (const style of wipData.parsedStyles) {
        const articleConfig = wipData.articleSizes[style.articleNumber];
        if (!articleConfig) continue;

        // Parse sizes and ratios intelligently - handle multiple separators
        const parseSmartInput = (input) => {
          if (!input) return [];
          return input
            .replace(/[;,|]/g, ':')
            .split(':')
            .map(s => s.trim())
            .filter(s => s.length > 0);
        };
        
        const sizes = parseSmartInput(articleConfig.sizes);
        const ratios = parseSmartInput(articleConfig.ratios).map(r => parseInt(r) || 0);

        // Create bundles/work items for each roll
        for (const roll of wipData.rolls) {
          // Calculate pieces per size for this roll
          for (let index = 0; index < sizes.length; index++) {
            const size = sizes[index];
            if (index < ratios.length) {
              const piecesForSize = ratios[index] * roll.layerCount;
              
              if (piecesForSize > 0) {
                // Detect garment type and get complete production workflow
                const garmentTypeId = ConfigService.detectGarmentType(style.styleName);
                const operationWorkflow = await ConfigService.getOperationsForGarment(garmentTypeId);
                
                console.log(`📋 Creating ${operationWorkflow.length} operations for ${style.styleName} (${garmentTypeId})`);
                
                // Create separate work item for EACH operation (realistic flexible garment production)
                for (const operationStep of operationWorkflow) {
                  // Determine work item availability status based on workflow type
                  let workItemStatus = 'pending';
                  let canStartImmediately = false;
                  
                  // Check if this operation can start immediately (no dependencies)
                  if (!operationStep.dependencies || operationStep.dependencies.length === 0) {
                    canStartImmediately = true;
                    workItemStatus = 'ready'; // Can be assigned immediately
                  }
                  
                  // For parallel operations, they can start as soon as their dependencies are met
                  if (operationStep.workflowType === 'parallel') {
                    workItemStatus = 'pending'; // Will be available when dependencies are done
                  }
                  
                  const workItem = {
                    wipEntryId,
                    lotNumber: wipData.lotNumber,
                    article: style.articleNumber,
                    articleName: style.styleName,
                    size: size,
                    color: roll.colorName,
                    pieces: piecesForSize,
                    rollNumber: roll.rollNumber,
                    status: workItemStatus,
                    
                    // Real production workflow: each operation on specific machine
                    currentOperation: operationStep.operation,
                    machineType: operationStep.machine,
                    operationSequence: operationStep.sequence,
                    estimatedTime: operationStep.estimatedTime,
                    
                    // Flexible workflow properties
                    workflowType: operationStep.workflowType || 'sequential',
                    dependencies: operationStep.dependencies || [],
                    parallelGroup: operationStep.parallelGroup || null,
                    canStartImmediately: canStartImmediately,
                    
                    priority: 'medium',
                    createdAt: serverTimestamp(),
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    completedPieces: 0,
                    assignedOperator: null,
                    assignedAt: null,
                    
                    // Production workflow context
                    garmentType: garmentTypeId,
                    totalOperations: operationWorkflow.length,
                    workflowStep: `${operationStep.sequence}/${operationWorkflow.length}`,
                    
                    // Bundle reference for parallel workflow tracking
                    bundleId: `${wipData.lotNumber}-${style.articleNumber}-${size}-${roll.colorName}`,
                    workflowId: `${wipEntryId}-${style.articleNumber}-${size}-${roll.colorName}`
                  };
                  
                  await addDoc(collection(db, COLLECTIONS.WORK_ITEMS), workItem);
                  const workTypeEmoji = operationStep.workflowType === 'parallel' ? '🔄' : '➡️';
                  console.log(`✅ Created: ${workTypeEmoji} ${operationStep.operation} → ${operationStep.machine} (${piecesForSize} pcs) [${operationStep.workflowType}]`);
                }
              }
            }
          }
        }
      }

      console.log('✅ Work items generated successfully');
    } catch (error) {
      console.error('❌ Error generating work items:', error);
      throw error;
    }
  }

  // Smart operation assignment based on style using ConfigService
  static async getOperationForStyle(styleName) {
    const lowerStyle = styleName?.toLowerCase() || '';
    const operations = await ConfigService.getOperations();
    
    // Smart matching based on style
    if (lowerStyle.includes('t-shirt') || lowerStyle.includes('polo')) {
      return operations.find(op => op.id === 'shoulder_join')?.name || 'shoulder join';
    } else if (lowerStyle.includes('pant') || lowerStyle.includes('trouser')) {
      return operations.find(op => op.id === 'side_seam')?.name || 'side seam';
    } else if (lowerStyle.includes('shirt')) {
      return operations.find(op => op.id === 'collar')?.name || 'collar';
    } else if (lowerStyle.includes('jacket') || lowerStyle.includes('coat')) {
      return operations.find(op => op.id === 'sleeve_attach')?.name || 'sleeve attach';
    } else {
      // Return a random operation for variety
      const randomOp = operations[Math.floor(Math.random() * operations.length)];
      return randomOp?.name || 'sewing';
    }
  }

  // Smart machine assignment based on style using ConfigService
  static async getMachineTypeForStyle(styleName) {
    const lowerStyle = styleName?.toLowerCase() || '';
    const machines = await ConfigService.getMachines();
    
    // Smart matching based on style
    if (lowerStyle.includes('t-shirt') || lowerStyle.includes('polo')) {
      return machines.find(m => m.id === 'overlock')?.id || 'overlock';
    } else if (lowerStyle.includes('pant') || lowerStyle.includes('trouser')) {
      return machines.find(m => m.id === 'flatlock')?.id || 'flatlock';
    } else if (lowerStyle.includes('shirt')) {
      return machines.find(m => m.id === 'single-needle')?.id || 'single-needle';
    } else if (lowerStyle.includes('jacket') || lowerStyle.includes('coat')) {
      return machines.find(m => m.id === 'single-needle')?.id || 'single-needle';
    } else {
      // Return random active machine for variety
      const activeMachines = machines.filter(m => m.active !== false);
      const randomMachine = activeMachines[Math.floor(Math.random() * activeMachines.length)];
      return randomMachine?.id || 'single-needle';
    }
  }

  static async getAllWIPEntries() {
    try {
      console.log('📋 Loading all WIP entries...');
      
      const q = query(
        collection(db, COLLECTIONS.WIP_ENTRIES),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const wipEntries = [];
      
      for (const doc of snapshot.docs) {
        const wipData = { id: doc.id, ...doc.data() };
        
        // Load associated rolls
        const rollsQuery = query(
          collection(db, COLLECTIONS.WIP_ROLLS),
          where('wipEntryId', '==', doc.id),
          orderBy('rollNumber', 'asc')
        );
        
        const rollsSnapshot = await getDocs(rollsQuery);
        wipData.rolls = rollsSnapshot.docs.map(rollDoc => ({
          id: rollDoc.id,
          ...rollDoc.data()
        }));
        
        wipEntries.push(wipData);
      }
      
      console.log(`✅ Loaded ${wipEntries.length} WIP entries`);
      return { success: true, wipEntries };
    } catch (error) {
      console.error('❌ Error loading WIP entries:', error);
      return { success: false, error: error.message, wipEntries: [] };
    }
  }

  static async getWorkItemsFromWIP() {
    try {
      console.log('📋 Loading work items from WIP...');
      
      const q = query(
        collection(db, COLLECTIONS.WORK_ITEMS),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const workItems = snapshot.docs.map(doc => {
        const data = doc.data();
        // Debug: log a sample work item to see what fields it has
        if (snapshot.docs.indexOf(doc) === 0) {
          console.log('🔍 Sample work item from WIP:', {
            id: doc.id,
            wipEntryId: data.wipEntryId,
            currentOperation: data.currentOperation,
            operation: data.operation,
            machineType: data.machineType,
            allFields: Object.keys(data)
          });
        }
        return {
          id: doc.id,
          ...data
        };
      });
      
      console.log(`✅ Loaded ${workItems.length} work items from WIP`);
      
      // Debug: show field names of first work item
      if (workItems.length > 0) {
        console.log('🔍 First work item fields:', Object.keys(workItems[0]));
        console.log('🔍 First work item sample data:', {
          id: workItems[0].id,
          wipEntryId: workItems[0].wipEntryId,
          currentOperation: workItems[0].currentOperation,
          operation: workItems[0].operation,
          machineType: workItems[0].machineType
        });
      }
      
      return { success: true, workItems };
    } catch (error) {
      console.error('❌ Error loading work items:', error);
      return { success: false, error: error.message, workItems: [] };
    }
  }

  static async deleteWIPEntry(wipEntryId) {
    try {
      console.log('🗑️ Deleting WIP entry:', wipEntryId);
      
      // Delete associated rolls
      const rollsQuery = query(
        collection(db, COLLECTIONS.WIP_ROLLS),
        where('wipEntryId', '==', wipEntryId)
      );
      
      const rollsSnapshot = await getDocs(rollsQuery);
      const deleteRollPromises = rollsSnapshot.docs.map(rollDoc =>
        deleteDoc(doc(db, COLLECTIONS.WIP_ROLLS, rollDoc.id))
      );
      
      await Promise.all(deleteRollPromises);
      
      // Delete associated work items
      const workItemsQuery = query(
        collection(db, COLLECTIONS.WORK_ITEMS),
        where('wipEntryId', '==', wipEntryId)
      );
      
      const workItemsSnapshot = await getDocs(workItemsQuery);
      const deleteWorkItemPromises = workItemsSnapshot.docs.map(workItemDoc =>
        deleteDoc(doc(db, COLLECTIONS.WORK_ITEMS, workItemDoc.id))
      );
      
      await Promise.all(deleteWorkItemPromises);
      
      // Delete main WIP entry
      await deleteDoc(doc(db, COLLECTIONS.WIP_ENTRIES, wipEntryId));
      
      console.log('✅ WIP entry and associated data deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting WIP entry:', error);
      return { success: false, error: error.message };
    }
  }

  // Assign work item to operator (handles WIP-generated work items)
  static async assignWorkItem(workItemId, operatorId, supervisorId, status = 'assigned') {
    try {
      console.log(`🔄 Assigning work item ${workItemId} to operator ${operatorId}`);
      
      const workItemRef = doc(db, COLLECTIONS.WORK_ITEMS, workItemId);
      
      // Check if work item exists and is available
      const workItemDoc = await getDoc(workItemRef);
      if (!workItemDoc.exists()) {
        return { 
          success: false, 
          error: `Work item ${workItemId} not found in Firestore`,
          errorCode: 'WORK_ITEM_NOT_FOUND'
        };
      }

      const workItemData = workItemDoc.data();
      if (workItemData.status !== 'pending' && workItemData.status !== 'ready') {
        return {
          success: false,
          error: `Work item ${workItemId} is not available for assignment (status: ${workItemData.status})`,
          errorCode: 'WORK_ITEM_NOT_AVAILABLE'
        };
      }

      // MACHINE TYPE VALIDATION - Check if operator can handle this machine type
      if (workItemData.machineType && workItemData.machineType !== 'manual') {
        try {
          // Get operator information to check machine compatibility
          const operatorRef = doc(db, COLLECTIONS.OPERATORS, operatorId);
          const operatorDoc = await getDoc(operatorRef);
          
          if (!operatorDoc.exists()) {
            return {
              success: false,
              error: `Operator ${operatorId} not found in system`,
              errorCode: 'OPERATOR_NOT_FOUND'
            };
          }

          const operatorData = operatorDoc.data();
          const operatorMachines = operatorData.assignedMachine 
            ? [operatorData.assignedMachine] 
            : (operatorData.machines || ['manual']);

          console.log(`🔍 Work item machine type: ${workItemData.machineType}`);
          console.log(`🔍 Operator ${operatorId} machines:`, operatorMachines);

          // Check if operator's machines are compatible with work item machine type
          const isCompatible = operatorMachines.includes(workItemData.machineType) || 
                               operatorMachines.includes('multi-machine') ||
                               (workItemData.machineType === 'single-needle' && operatorMachines.includes('singleNeedle')) ||
                               (workItemData.machineType === 'single-needle' && operatorMachines.includes('single_needle')) ||
                               (workItemData.machineType === 'overlock' && operatorMachines.includes('overlock')) ||
                               (workItemData.machineType === 'flatlock' && operatorMachines.includes('flatlock')) ||
                               (workItemData.machineType === 'buttonAttach' && operatorMachines.includes('buttonAttach')) ||
                               (workItemData.machineType === 'buttonhole' && operatorMachines.includes('buttonhole'));

          if (!isCompatible) {
            const operatorName = operatorData.name || operatorId;
            return {
              success: false,
              error: `❌ MACHINE TYPE MISMATCH: Cannot assign ${workItemData.machineType} work to operator ${operatorName} who is assigned to ${operatorMachines.join(', ')} machines`,
              errorCode: 'MACHINE_TYPE_MISMATCH',
              details: {
                workItemMachine: workItemData.machineType,
                operatorMachines: operatorMachines,
                operationName: workItemData.operationName || workItemData.currentOperation
              }
            };
          }

          console.log(`✅ Machine type validation passed: ${workItemData.machineType} compatible with operator machines`);
        } catch (validationError) {
          console.error('❌ Error during machine type validation:', validationError);
          // Continue with assignment if validation fails due to system error
          console.warn('⚠️ Continuing with assignment despite validation error');
        }
      }

      // Update work item with assignment
      await updateDoc(workItemRef, {
        status: status,
        assignedOperator: operatorId,
        assignedAt: serverTimestamp(),
        assignedBy: supervisorId,
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Work item ${workItemId} assigned to operator ${operatorId}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error assigning work item:', error);
      return { success: false, error: error.message };
    }
  }

  // Start work item (update status to in_progress/working)
  static async startWorkItem(workItemId, operatorId) {
    try {
      console.log(`🚀 Starting work item ${workItemId} for operator ${operatorId}`);
      
      const workItemRef = doc(db, COLLECTIONS.WORK_ITEMS, workItemId);
      
      // Check if work item exists and is assigned to this operator
      const workItemDoc = await getDoc(workItemRef);
      if (!workItemDoc.exists()) {
        return { 
          success: false, 
          error: `Work item ${workItemId} not found in Firestore`,
          errorCode: 'WORK_ITEM_NOT_FOUND'
        };
      }

      const workItemData = workItemDoc.data();
      if (workItemData.assignedOperator !== operatorId) {
        return {
          success: false,
          error: `Work item ${workItemId} is not assigned to operator ${operatorId}`,
          errorCode: 'NOT_ASSIGNED_TO_OPERATOR'
        };
      }

      // Update work item status to in_progress (working)
      await updateDoc(workItemRef, {
        status: 'in_progress',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log(`✅ Work item ${workItemId} started - status updated to 'in_progress'`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error starting work item:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all self-assigned WIP work items for supervisor review
  static async getSelfAssignedWorkItems() {
    try {
      const q = query(
        collection(db, COLLECTIONS.WORK_ITEMS),
        where('status', '==', 'self_assigned'),
        orderBy('selfAssignedAt', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const workItems = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Get operator name
        const operatorDoc = await getDoc(doc(db, COLLECTIONS.OPERATORS, data.requestedBy));
        const operatorName = operatorDoc.exists() ? operatorDoc.data().name : 'Unknown Operator';
        
        workItems.push({
          id: doc.id,
          ...data,
          requestedByName: operatorName
        });
      }
      
      return { success: true, workItems };
    } catch (error) {
      console.error('Failed to get self-assigned WIP work items:', error);
      return { success: false, error: error.message };
    }
  }

  // Approve WIP self-assignment
  static async approveSelfAssignment(workItemId, supervisorId) {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const workItemRef = doc(db, COLLECTIONS.WORK_ITEMS, workItemId);
        const workItemDoc = await transaction.get(workItemRef);
        
        if (!workItemDoc.exists()) {
          throw new Error('Work item not found');
        }
        
        const workItemData = workItemDoc.data();
        
        if (workItemData.status !== 'self_assigned') {
          throw new Error('Work item is not in self_assigned status');
        }
        
        // Update to assigned status
        transaction.update(workItemRef, {
          status: 'assigned',
          approvedBy: supervisorId,
          approvedAt: serverTimestamp(),
          assignedBy: supervisorId,
          assignedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        return { success: true, workItemData };
      });
      
      // Create notification for operator
      await NotificationService.createNotification({
        title: "काम अनुमोदन भयो",
        titleEn: "Work Approved",
        message: `काम आइटम #${workItemId} अनुमोदन भयो`,
        messageEn: `Work item #${workItemId} approved`,
        type: "work_approved",
        priority: "high",
        targetUser: result.workItemData.requestedBy,
        targetRole: "operator",
        workItemId: workItemId
      });
      
      console.log(`✅ WIP work item ${workItemId} self-assignment approved by ${supervisorId}`);
      return result;
      
    } catch (error) {
      console.error('Failed to approve WIP self-assignment:', error);
      return { success: false, error: error.message };
    }
  }

  // Reject WIP self-assignment
  static async rejectSelfAssignment(workItemId, supervisorId, reason = '') {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const workItemRef = doc(db, COLLECTIONS.WORK_ITEMS, workItemId);
        const workItemDoc = await transaction.get(workItemRef);
        
        if (!workItemDoc.exists()) {
          throw new Error('Work item not found');
        }
        
        const workItemData = workItemDoc.data();
        
        if (workItemData.status !== 'self_assigned') {
          throw new Error('Work item is not in self_assigned status');
        }
        
        // Reset to ready status and clear assignment
        transaction.update(workItemRef, {
          status: 'ready',
          assignedOperator: null,
          requestedBy: null,
          selfAssignedAt: null,
          rejectedBy: supervisorId,
          rejectedAt: serverTimestamp(),
          rejectionReason: reason,
          updatedAt: serverTimestamp()
        });
        
        return { success: true, workItemData };
      });
      
      // Create notification for operator
      await NotificationService.createNotification({
        title: "काम अस्वीकार गरियो",
        titleEn: "Work Rejected",
        message: reason ? 
          `काम आइटम #${workItemId} अस्वीकार: ${reason}` :
          `काम आइटम #${workItemId} अस्वीकार गरियो`,
        messageEn: reason ?
          `Work item #${workItemId} rejected: ${reason}` :
          `Work item #${workItemId} was rejected`,
        type: "work_rejected",
        priority: "medium",
        targetUser: result.workItemData.requestedBy,
        targetRole: "operator",
        workItemId: workItemId
      });
      
      console.log(`❌ WIP work item ${workItemId} self-assignment rejected by ${supervisorId}`);
      return result;
      
    } catch (error) {
      console.error('Failed to reject WIP self-assignment:', error);
      return { success: false, error: error.message };
    }
  }

  // Reassign WIP work to different operator
  static async reassignWork(workItemId, newOperatorId, supervisorId) {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const workItemRef = doc(db, COLLECTIONS.WORK_ITEMS, workItemId);
        const workItemDoc = await transaction.get(workItemRef);
        
        if (!workItemDoc.exists()) {
          throw new Error('Work item not found');
        }
        
        const workItemData = workItemDoc.data();
        const originalOperator = workItemData.requestedBy;
        
        // Update assignment to new operator
        transaction.update(workItemRef, {
          status: 'assigned',
          assignedOperator: newOperatorId,
          assignedBy: supervisorId,
          assignedAt: serverTimestamp(),
          reassignedFrom: originalOperator,
          reassignedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        return { success: true, workItemData, originalOperator, newOperatorId };
      });
      
      // Get operator names for notifications
      const [originalOpDoc, newOpDoc] = await Promise.all([
        getDoc(doc(db, COLLECTIONS.OPERATORS, result.originalOperator)),
        getDoc(doc(db, COLLECTIONS.OPERATORS, result.newOperatorId))
      ]);
      
      const originalOpName = originalOpDoc.exists() ? originalOpDoc.data().name : 'Unknown';
      const newOpName = newOpDoc.exists() ? newOpDoc.data().name : 'Unknown';
      
      // Notify original operator
      await NotificationService.createNotification({
        title: "काम पुनः असाइन गरियो",
        titleEn: "Work Reassigned",
        message: `काम आइटम #${workItemId} ${newOpName} लाई दिइयो`,
        messageEn: `Work item #${workItemId} was assigned to ${newOpName}`,
        type: "work_reassigned",
        priority: "medium",
        targetUser: result.originalOperator,
        targetRole: "operator",
        workItemId: workItemId
      });
      
      // Notify new operator
      await NotificationService.createNotification({
        title: "नयाँ काम असाइन",
        titleEn: "New Work Assigned",
        message: `काम आइटम #${workItemId} तपाईंलाई असाइन गरियो`,
        messageEn: `Work item #${workItemId} has been assigned to you`,
        type: "work_assignment",
        priority: "high",
        targetUser: result.newOperatorId,
        targetRole: "operator",
        workItemId: workItemId
      });
      
      console.log(`🔄 WIP work item ${workItemId} reassigned from ${originalOpName} to ${newOpName}`);
      return result;
      
    } catch (error) {
      console.error('Failed to reassign WIP work:', error);
      return { success: false, error: error.message };
    }
  }

  // Self-assign WIP work item (atomic operation)
  static async selfAssignWorkItem(workItemId, operatorId) {
    try {
      const result = await runTransaction(db, async (transaction) => {
        const workItemRef = doc(db, COLLECTIONS.WORK_ITEMS, workItemId);
        const workItemDoc = await transaction.get(workItemRef);
        
        if (!workItemDoc.exists()) {
          throw new Error(`Work no longer available - not found in system`);
        }
        
        const workItemData = workItemDoc.data();
        
        if (!['ready', 'pending'].includes(workItemData.status)) {
          throw new Error(`Work no longer available - already ${workItemData.status}`);
        }
        
        if (workItemData.assignedOperator && workItemData.assignedOperator !== operatorId) {
          throw new Error(`Work already requested by another operator`);
        }
        
        transaction.update(workItemRef, {
          assignedOperator: operatorId,
          status: 'self_assigned',
          selfAssignedAt: serverTimestamp(),
          requestedBy: operatorId,
          updatedAt: serverTimestamp(),
        });
        
        return { success: true, workItemData };
      });
      
      // Send notification to supervisors
      await NotificationService.createNotification({
        title: "नयाँ स्वयं असाइनमेन्ट अनुरोध",
        titleEn: "New Self-Assignment Request",
        message: `${operatorId} ले काम आइटम #${workItemId} का लागि अनुरोध गर्यो`,
        messageEn: `${operatorId} requested Work Item #${workItemId}`,
        type: "self_assignment_request",
        priority: "medium",
        targetRole: "supervisor",
        workItemId: workItemId,
        requestedBy: operatorId,
        actionRequired: true
      });
      
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Insert emergency work item (for dynamic production changes)
  static async insertEmergencyWorkItem(emergencyWork) {
    try {
      // Validate required fields
      if (!emergencyWork.lotNumber) {
        throw new Error('lotNumber is required');
      }
      
      // Calculate workflow position first to avoid circular dependency
      const workflowPosition = await this.calculateInsertionPosition(emergencyWork.lotNumber, emergencyWork.insertionPoint);
      
      // Clean the emergency work data to ensure no undefined values
      const cleanedEmergencyWork = {};
      for (const [key, value] of Object.entries(emergencyWork)) {
        if (value !== undefined && value !== null) {
          cleanedEmergencyWork[key] = value;
        }
      }
      
      const workItemRef = await addDoc(collection(db, COLLECTIONS.WORK_ITEMS), {
        ...cleanedEmergencyWork,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isEmergencyInsertion: true,
        workflowPosition: workflowPosition
      });

      console.log(`🚨 Emergency work item inserted: ${workItemRef.id}`);

      // Phase 2: Auto-recalculate workflow after insertion
      if (emergencyWork.insertionPoint !== 'parallel') {
        setTimeout(async () => {
          await this.recalculateWorkflowAfterInsertion(
            emergencyWork.lotNumber, 
            workItemRef.id, 
            emergencyWork.insertionPoint
          );
        }, 1000); // Small delay to ensure insertion is complete
      }

      return { success: true, workItemId: workItemRef.id };
    } catch (error) {
      console.error('Failed to insert emergency work:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate optimal position for work insertion
  static async calculateInsertionPosition(lotNumber, insertionPoint) {
    try {
      const workItemsQuery = query(
        collection(db, COLLECTIONS.WORK_ITEMS),
        where("lotNumber", "==", lotNumber),
        orderBy("createdAt", "asc")
      );
      
      const snapshot = await getDocs(workItemsQuery);
      const workItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (insertionPoint === 'parallel') {
        return 999; // Independent work, no specific position
      } else if (insertionPoint === 'after_current') {
        const currentWork = workItems.find(item => item.status === 'in_progress');
        return currentWork ? currentWork.workflowPosition + 0.5 : workItems.length;
      } else if (insertionPoint === 'before_next') {
        const nextWork = workItems.find(item => item.status === 'ready' || item.status === 'assigned');
        return nextWork ? nextWork.workflowPosition - 0.5 : workItems.length;
      }
      
      return workItems.length; // Default to end
    } catch (error) {
      console.error('Failed to calculate insertion position:', error);
      return 999;
    }
  }

  // Pause downstream assignments for workflow changes
  static async pauseDownstreamAssignments(lotNumber, insertedWorkItemId) {
    try {
      const workItemsQuery = query(
        collection(db, COLLECTIONS.WORK_ITEMS),
        where("lotNumber", "==", lotNumber),
        where("status", "in", ["ready", "assigned"])
      );
      
      const snapshot = await getDocs(workItemsQuery);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          status: 'paused_for_insertion',
          pausedBy: insertedWorkItemId,
          pausedAt: serverTimestamp(),
          originalStatus: doc.data().status
        });
      });
      
      await batch.commit();
      console.log(`⏸️ Paused ${snapshot.docs.length} downstream work items for lot ${lotNumber}`);
      return { success: true, pausedCount: snapshot.docs.length };
    } catch (error) {
      console.error('Failed to pause downstream assignments:', error);
      return { success: false, error: error.message };
    }
  }

  // Resume downstream assignments after emergency work completion
  static async resumeDownstreamAssignments(insertedWorkItemId) {
    try {
      const workItemsQuery = query(
        collection(db, COLLECTIONS.WORK_ITEMS),
        where("pausedBy", "==", insertedWorkItemId),
        where("status", "==", "paused_for_insertion")
      );
      
      const snapshot = await getDocs(workItemsQuery);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(doc => {
        const originalStatus = doc.data().originalStatus || 'ready';
        batch.update(doc.ref, {
          status: originalStatus,
          pausedBy: null,
          pausedAt: null,
          originalStatus: null,
          resumedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log(`▶️ Resumed ${snapshot.docs.length} downstream work items`);
      return { success: true, resumedCount: snapshot.docs.length };
    } catch (error) {
      console.error('Failed to resume downstream assignments:', error);
      return { success: false, error: error.message };
    }
  }

  // Get work items for specific lot
  static async getWorkItemsForLot(lotNumber) {
    try {
      const workItemsQuery = query(
        collection(db, COLLECTIONS.WORK_ITEMS),
        where("lotNumber", "==", lotNumber),
        orderBy("createdAt", "asc")
      );
      
      const snapshot = await getDocs(workItemsQuery);
      const workItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      return { success: true, workItems };
    } catch (error) {
      console.error('Failed to get work items for lot:', error);
      return { success: false, error: error.message };
    }
  }

  // Recalculate workflow after emergency insertion (Phase 2)
  static async recalculateWorkflowAfterInsertion(lotNumber, insertedWorkItemId, insertionPoint) {
    try {
      console.log(`🔧 Recalculating workflow for lot ${lotNumber} after insertion`);
      
      const workItems = await this.getWorkItemsForLot(lotNumber);
      if (!workItems.success) {
        throw new Error(workItems.error);
      }

      const items = workItems.workItems;
      const insertedItem = items.find(item => item.id === insertedWorkItemId);
      
      if (!insertedItem) {
        throw new Error('Inserted work item not found');
      }

      // Recalculate workflow sequence and dependencies
      const updatedWorkflow = await this.calculateNewWorkflowSequence(items, insertedItem, insertionPoint);
      
      // Update operator queues with new sequence
      await this.updateOperatorQueues(lotNumber, updatedWorkflow);
      
      // Update dependencies and prerequisites
      await this.updateWorkItemDependencies(updatedWorkflow);
      
      console.log(`✅ Workflow recalculated for lot ${lotNumber}`);
      return { success: true, updatedWorkflow };
      
    } catch (error) {
      console.error('Failed to recalculate workflow:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate new workflow sequence after insertion
  static async calculateNewWorkflowSequence(workItems, insertedItem, insertionPoint) {
    const sequence = [];
    
    // Sort existing items by workflow position
    const existingItems = workItems
      .filter(item => item.id !== insertedItem.id && !item.isEmergencyInsertion)
      .sort((a, b) => (a.workflowPosition || 0) - (b.workflowPosition || 0));
    
    if (insertionPoint === 'parallel') {
      // Independent work - no sequence change needed
      return workItems.map((item, index) => ({
        ...item,
        workflowPosition: item.id === insertedItem.id ? 999 : index + 1,
        sequenceOrder: item.id === insertedItem.id ? 999 : index + 1
      }));
    }
    
    // Find insertion point in existing workflow
    let insertIndex = 0;
    if (insertionPoint === 'after_current') {
      const currentWorkIndex = existingItems.findIndex(item => item.status === 'in_progress');
      insertIndex = currentWorkIndex >= 0 ? currentWorkIndex + 1 : 0;
    } else if (insertionPoint === 'before_next') {
      const nextWorkIndex = existingItems.findIndex(item => 
        item.status === 'ready' || item.status === 'assigned'
      );
      insertIndex = nextWorkIndex >= 0 ? nextWorkIndex : existingItems.length;
    }
    
    // Rebuild sequence with inserted work
    for (let i = 0; i < existingItems.length; i++) {
      if (i === insertIndex) {
        sequence.push({
          ...insertedItem,
          workflowPosition: i + 1,
          sequenceOrder: i + 1,
          predecessors: i > 0 ? [existingItems[i - 1].id] : [],
          successors: i < existingItems.length ? [existingItems[i].id] : []
        });
      }
      
      sequence.push({
        ...existingItems[i],
        workflowPosition: sequence.length + 1,
        sequenceOrder: sequence.length + 1,
        predecessors: sequence.length > 0 ? [sequence[sequence.length - 1].id] : [],
        successors: i < existingItems.length - 1 ? [existingItems[i + 1].id] : []
      });
    }
    
    // Handle case where insertion is at the end
    if (insertIndex >= existingItems.length) {
      sequence.push({
        ...insertedItem,
        workflowPosition: sequence.length + 1,
        sequenceOrder: sequence.length + 1,
        predecessors: sequence.length > 0 ? [sequence[sequence.length - 1].id] : [],
        successors: []
      });
    }
    
    return sequence;
  }

  // Update operator queues with new workflow sequence
  static async updateOperatorQueues(lotNumber, updatedWorkflow) {
    try {
      const batch = writeBatch(db);
      
      // Group work items by assigned operators
      const operatorQueues = {};
      
      updatedWorkflow.forEach(workItem => {
        if (workItem.assignedOperator && workItem.status !== 'completed') {
          if (!operatorQueues[workItem.assignedOperator]) {
            operatorQueues[workItem.assignedOperator] = [];
          }
          operatorQueues[workItem.assignedOperator].push(workItem);
        }
      });
      
      // Update each operator's queue with new sequence
      for (const [operatorId, queuedWork] of Object.entries(operatorQueues)) {
        // Sort by new workflow position
        queuedWork.sort((a, b) => a.workflowPosition - b.workflowPosition);
        
        // Update work items with new queue positions
        queuedWork.forEach((workItem, index) => {
          const workItemRef = doc(db, COLLECTIONS.WORK_ITEMS, workItem.id);
          batch.update(workItemRef, {
            queuePosition: index + 1,
            workflowPosition: workItem.workflowPosition,
            sequenceOrder: workItem.sequenceOrder,
            predecessors: workItem.predecessors || [],
            successors: workItem.successors || [],
            updatedAt: serverTimestamp(),
            workflowRecalculated: true
          });
        });
        
        // Notify operator about queue changes
        await NotificationService.createNotification({
          title: "काम अनुक्रम परिवर्तन",
          titleEn: "Work Sequence Changed",
          message: `लट ${lotNumber} को काम अनुक्रम परिवर्तन भएको छ`,
          messageEn: `Work sequence for Lot ${lotNumber} has been updated`,
          type: "workflow_change",
          priority: "medium",
          targetUser: operatorId,
          targetRole: "operator",
          lotNumber: lotNumber,
          queueLength: queuedWork.length
        });
      }
      
      await batch.commit();
      console.log(`✅ Updated operator queues for lot ${lotNumber}`);
      return { success: true };
      
    } catch (error) {
      console.error('Failed to update operator queues:', error);
      return { success: false, error: error.message };
    }
  }

  // Update work item dependencies after workflow change
  static async updateWorkItemDependencies(updatedWorkflow) {
    try {
      const batch = writeBatch(db);
      
      updatedWorkflow.forEach(workItem => {
        const workItemRef = doc(db, COLLECTIONS.WORK_ITEMS, workItem.id);
        
        // Update dependencies based on new sequence
        const dependencies = [];
        if (workItem.predecessors && workItem.predecessors.length > 0) {
          dependencies.push(...workItem.predecessors);
        }
        
        batch.update(workItemRef, {
          dependencies: dependencies,
          workflowPosition: workItem.workflowPosition,
          sequenceOrder: workItem.sequenceOrder,
          canStartImmediately: dependencies.length === 0,
          updatedAt: serverTimestamp()
        });
      });
      
      await batch.commit();
      console.log(`✅ Updated work item dependencies`);
      return { success: true };
      
    } catch (error) {
      console.error('Failed to update work item dependencies:', error);
      return { success: false, error: error.message };
    }
  }
}

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

//===============================================
// COMPREHENSIVE SCALABLE CONFIGURATION SERVICE  
//===============================================

export class ConfigService {
  // Cache for configurations to improve performance
  static configCache = new Map();
  static cacheExpiry = 5 * 60 * 1000; // 5 minutes
  
  // Master configuration types - ALL dynamic data in the app
  static CONFIG_TYPES = {
    MACHINES: 'machines',
    OPERATIONS: 'operations', 
    PRIORITIES: 'priorities',
    STATUSES: 'statuses',
    SIZES: 'sizes',
    COLORS: 'colors',
    DEPARTMENTS: 'departments',
    SHIFTS: 'shifts',
    GARMENT_TYPES: 'garmentTypes',
    SKILLS: 'skills',
    USER_ROLES: 'userRoles'
  };

  // Get configuration data with caching
  static async getConfig(configType) {
    const cacheKey = configType;
    const cached = this.configCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      console.log(`✅ Using cached config for ${configType}`);
      return { success: true, data: cached.data };
    }

    try {
      console.log(`🔄 Loading ${configType} config from Firestore...`);
      
      const configRef = collection(db, 'app_configurations');
      const q = query(configRef, where('type', '==', configType));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const configDoc = snapshot.docs[0];
        const configData = configDoc.data();
        
        // Cache the result
        this.configCache.set(cacheKey, {
          data: configData.items || [],
          timestamp: Date.now()
        });
        
        console.log(`✅ Loaded ${configType} config:`, configData.items?.length, 'items');
        return { success: true, data: configData.items || [] };
      } else {
        // Create default configuration if doesn't exist
        console.log(`📝 Creating default ${configType} config...`);
        const defaultData = await this.createDefaultConfig(configType);
        return { success: true, data: defaultData };
      }
    } catch (error) {
      console.error(`❌ Error loading ${configType} config:`, error);
      return { success: false, error: error.message, data: [] };
    }
  }

  // Create default configurations for ALL app data
  static async createDefaultConfig(configType) {
    const defaultConfigs = {
      [this.CONFIG_TYPES.MACHINES]: [
        { id: 'overlock', name: 'Overlock Machine', nameNp: 'ओभरलक मेसिन', category: 'sewing', active: true, avgSpeed: 45, icon: '🔗', color: '#3B82F6' },
        { id: 'flatlock', name: 'Flatlock Machine', nameNp: 'फ्ल्याटलक मेसिन', category: 'sewing', active: true, avgSpeed: 40, icon: '📎', color: '#10B981' },
        { id: 'single-needle', name: 'Single Needle', nameNp: 'एकल सुई', category: 'sewing', active: true, avgSpeed: 35, icon: '🪡', color: '#8B5CF6' },
        { id: 'buttonhole', name: 'Buttonhole Machine', nameNp: 'बटनहोल मेसिन', category: 'finishing', active: true, avgSpeed: 20, icon: '🕳️', color: '#F59E0B' },
        { id: 'buttonAttach', name: 'Button Attach', nameNp: 'बटन जोड्ने', category: 'finishing', active: true, avgSpeed: 25, icon: '🔘', color: '#EF4444' },
        { id: 'iron', name: 'Iron Press', nameNp: 'इस्त्री प्रेस', category: 'finishing', active: true, avgSpeed: 30, icon: '🔥', color: '#F97316' },
        { id: 'cutting', name: 'Cutting Machine', nameNp: 'काट्ने मेसिन', category: 'cutting', active: true, avgSpeed: 50, icon: '✂️', color: '#6B7280' },
        { id: 'embroidery', name: 'Embroidery Machine', nameNp: 'कसिदाकारी मेसिन', category: 'decoration', active: true, avgSpeed: 30, icon: '🎨', color: '#EC4899' },
        { id: 'manual', name: 'Manual Work', nameNp: 'हस्तकला काम', category: 'manual', active: true, avgSpeed: 25, icon: '✋', color: '#84CC16' }
      ],
      [this.CONFIG_TYPES.OPERATIONS]: [
        { id: 'shoulder_join', name: 'Shoulder Join', nameNp: 'काँध जोडाइ', machineTypes: ['overlock'], estimatedTime: 15 },
        { id: 'side_seam', name: 'Side Seam', nameNp: 'छेउको सिलाई', machineTypes: ['overlock', 'flatlock'], estimatedTime: 20 },
        { id: 'collar', name: 'Collar', nameNp: 'कलर', machineTypes: ['single-needle'], estimatedTime: 25 },
        { id: 'sleeve_attach', name: 'Sleeve Attach', nameNp: 'बाहुला जोडाइ', machineTypes: ['overlock'], estimatedTime: 18 },
        { id: 'hemming', name: 'Hemming', nameNp: 'हेमिङ', machineTypes: ['flatlock'], estimatedTime: 10 },
        { id: 'buttonhole', name: 'Buttonhole', nameNp: 'बटनहोल', machineTypes: ['buttonhole'], estimatedTime: 5 },
        { id: 'button_attach', name: 'Button Attach', nameNp: 'बटन जोडाइ', machineTypes: ['buttonAttach'], estimatedTime: 3 },
        { id: 'pressing', name: 'Pressing', nameNp: 'इस्त्री', machineTypes: ['iron'], estimatedTime: 8 },
        { id: 'sewing', name: 'General Sewing', nameNp: 'सामान्य सिलाई', machineTypes: ['single-needle', 'overlock'], estimatedTime: 20 },
        { id: 'placket', name: 'Placket Making', nameNp: 'प्लाकेट बनाउने', machineTypes: ['single-needle'], estimatedTime: 15, workType: 'machine' },
        { id: 'collar_attach', name: 'Collar Attachment', nameNp: 'कलर जोडाइ', machineTypes: ['single-needle'], estimatedTime: 18, workType: 'machine' },
        { id: 'placket_attach', name: 'Placket Attachment', nameNp: 'प्लाकेट जोडाइ', machineTypes: ['single-needle'], estimatedTime: 12, workType: 'machine' },
        { id: 'label_attach', name: 'Label Attachment', nameNp: 'लेबल जोडाइ', machineTypes: ['single-needle'], estimatedTime: 5, workType: 'machine' },
        { id: 'printing', name: 'Screen Printing', nameNp: 'प्रिन्टिङ', machineTypes: ['manual'], estimatedTime: 15, workType: 'manual' },
        { id: 'embroidery', name: 'Embroidery', nameNp: 'कसिदाकारी', machineTypes: ['embroidery'], estimatedTime: 25, workType: 'machine' },
        { id: 'applique', name: 'Applique Work', nameNp: 'एप्लिक्यू काम', machineTypes: ['manual'], estimatedTime: 20, workType: 'manual' },
        { id: 'washing', name: 'Garment Washing', nameNp: 'लुगा धुलाई', machineTypes: ['washing'], estimatedTime: 30, workType: 'machine' },
        { id: 'quality_check', name: 'Quality Check', nameNp: 'गुणस्तर जाँच', machineTypes: ['manual'], estimatedTime: 10, workType: 'manual' }
      ],
      [this.CONFIG_TYPES.PRIORITIES]: [
        { id: 'urgent', name: 'Urgent', nameNp: 'जरुरी', level: 4, color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800', borderColor: 'border-red-300' },
        { id: 'high', name: 'High', nameNp: 'उच्च', level: 3, color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800', borderColor: 'border-orange-300' },
        { id: 'medium', name: 'Medium', nameNp: 'मध्यम', level: 2, color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-300' },
        { id: 'low', name: 'Low', nameNp: 'कम', level: 1, color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800', borderColor: 'border-green-300' }
      ],
      [this.CONFIG_TYPES.STATUSES]: [
        { id: 'pending', name: 'Pending', nameNp: 'पेन्डिङ', category: 'work', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' },
        { id: 'ready', name: 'Ready', nameNp: 'तयार', category: 'work', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' },
        { id: 'assigned', name: 'Assigned', nameNp: 'असाइन गरिएको', category: 'work', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-800' },
        { id: 'in_progress', name: 'In Progress', nameNp: 'काम गर्दै', category: 'work', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
        { id: 'completed', name: 'Completed', nameNp: 'सम्पन्न', category: 'work', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' },
        { id: 'on_hold', name: 'On Hold', nameNp: 'रोकिएको', category: 'work', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' }
      ],
      [this.CONFIG_TYPES.SKILLS]: [
        { id: 'single_needle', name: 'Single Needle Specialist', nameNp: 'एकल सुई विशेषज्ञ', machineTypes: ['single-needle'], level: 'intermediate' },
        { id: 'overlock', name: 'Overlock Specialist', nameNp: 'ओभरलक विशेषज्ञ', machineTypes: ['overlock'], level: 'intermediate' },
        { id: 'flatlock', name: 'Flatlock Specialist', nameNp: 'फ्ल्याटलक विशेषज्ञ', machineTypes: ['flatlock'], level: 'intermediate' },
        { id: 'multi_machine', name: 'Multi-Machine Operator', nameNp: 'बहु-मेसिन अपरेटर', machineTypes: ['single-needle', 'overlock'], level: 'advanced' },
        { id: 'finishing', name: 'Finishing Specialist', nameNp: 'फिनिसिङ विशेषज्ञ', machineTypes: ['buttonhole', 'buttonAttach', 'iron'], level: 'intermediate' },
        { id: 'collar_expert', name: 'Collar Expert', nameNp: 'कलर विशेषज्ञ', machineTypes: ['single-needle'], level: 'advanced', operations: ['collar'] },
        { id: 'sleeve_expert', name: 'Sleeve Expert', nameNp: 'बाहुला विशेषज्ञ', machineTypes: ['overlock'], level: 'advanced', operations: ['sleeve_attach'] },
        { id: 'printing_specialist', name: 'Printing Specialist', nameNp: 'प्रिन्टिङ विशेषज्ञ', machineTypes: ['manual'], level: 'intermediate', operations: ['printing'] },
        { id: 'embroidery_specialist', name: 'Embroidery Specialist', nameNp: 'कसिदाकारी विशेषज्ञ', machineTypes: ['embroidery'], level: 'intermediate', operations: ['embroidery'] },
        { id: 'quality_inspector', name: 'Quality Inspector', nameNp: 'गुणस्तर निरीक्षक', machineTypes: ['manual'], level: 'intermediate', operations: ['quality_check'] },
        { id: 'manual_worker', name: 'Manual Worker', nameNp: 'म्यानुअल कामदार', machineTypes: ['manual'], level: 'beginner', operations: ['printing', 'applique', 'quality_check'] },
        { id: 'general', name: 'General Operator', nameNp: 'सामान्य अपरेटर', machineTypes: ['single-needle'], level: 'beginner' }
      ],
      [this.CONFIG_TYPES.GARMENT_TYPES]: [
        { 
          id: 'polo', 
          name: 'Polo T-Shirt', 
          nameNp: 'पोलो टी-शर्ट', 
          operations: [
            // Phase 1: Parallel preparation work (can all happen simultaneously after cutting)
            { operation: 'placket', machine: 'single-needle', sequence: 1.1, estimatedTime: 15, dependencies: [], workflowType: 'parallel', parallelGroup: 'preparation' },
            { operation: 'shoulder_join', machine: 'overlock', sequence: 1.2, estimatedTime: 12, dependencies: [], workflowType: 'parallel', parallelGroup: 'preparation' },
            { operation: 'collar', machine: 'single-needle', sequence: 1.3, estimatedTime: 20, dependencies: [], workflowType: 'parallel', parallelGroup: 'preparation' },
            
            // Phase 2: Assembly (requires completion of preparation work)
            { operation: 'collar_attach', machine: 'single-needle', sequence: 2.1, estimatedTime: 18, dependencies: ['collar', 'shoulder_join'], workflowType: 'sequential' },
            { operation: 'placket_attach', machine: 'single-needle', sequence: 2.2, estimatedTime: 12, dependencies: ['placket', 'collar_attach'], workflowType: 'sequential' },
            { operation: 'side_seam', machine: 'overlock', sequence: 2.3, estimatedTime: 15, dependencies: ['shoulder_join'], workflowType: 'sequential' },
            
            // Phase 3: Parallel decoration (can happen while other operations continue)
            { operation: 'printing', machine: 'manual', sequence: 2.5, estimatedTime: 15, dependencies: ['side_seam'], workflowType: 'parallel', parallelGroup: 'decoration' },
            { operation: 'embroidery', machine: 'embroidery', sequence: 2.6, estimatedTime: 25, dependencies: ['side_seam'], workflowType: 'parallel', parallelGroup: 'decoration' },
            
            // Phase 4: Final assembly
            { operation: 'sleeve_attach', machine: 'overlock', sequence: 3.1, estimatedTime: 18, dependencies: ['collar_attach', 'side_seam'], workflowType: 'sequential' },
            { operation: 'hemming', machine: 'flatlock', sequence: 3.2, estimatedTime: 10, dependencies: ['sleeve_attach'], workflowType: 'sequential' },
            
            // Phase 5: Finishing (can happen in parallel)
            { operation: 'buttonhole', machine: 'buttonhole', sequence: 4.1, estimatedTime: 5, dependencies: ['placket_attach'], workflowType: 'parallel', parallelGroup: 'finishing' },
            { operation: 'button_attach', machine: 'buttonAttach', sequence: 4.2, estimatedTime: 3, dependencies: ['buttonhole'], workflowType: 'sequential' },
            { operation: 'label_attach', machine: 'single-needle', sequence: 4.3, estimatedTime: 5, dependencies: ['hemming'], workflowType: 'parallel', parallelGroup: 'finishing' },
            
            // Final quality check
            { operation: 'quality_check', machine: 'manual', sequence: 5, estimatedTime: 10, dependencies: ['button_attach', 'label_attach'], workflowType: 'sequential' }
          ]
        },
        { 
          id: 'tshirt', 
          name: 'T-Shirt', 
          nameNp: 'टी-शर्ट', 
          operations: [
            // Sequential basic construction
            { operation: 'shoulder_join', machine: 'overlock', sequence: 1, estimatedTime: 10, dependencies: [], workflowType: 'sequential' },
            { operation: 'side_seam', machine: 'overlock', sequence: 2, estimatedTime: 15, dependencies: ['shoulder_join'], workflowType: 'sequential' },
            { operation: 'sleeve_attach', machine: 'overlock', sequence: 3, estimatedTime: 18, dependencies: ['side_seam'], workflowType: 'sequential' },
            
            // Parallel decoration (can happen after shoulder join)
            { operation: 'printing', machine: 'manual', sequence: 1.5, estimatedTime: 15, dependencies: ['shoulder_join'], workflowType: 'parallel', parallelGroup: 'decoration' },
            { operation: 'applique', machine: 'manual', sequence: 1.7, estimatedTime: 20, dependencies: ['shoulder_join'], workflowType: 'parallel', parallelGroup: 'decoration' },
            
            // Final operations
            { operation: 'hemming', machine: 'flatlock', sequence: 4, estimatedTime: 8, dependencies: ['sleeve_attach'], workflowType: 'sequential' },
            { operation: 'label_attach', machine: 'single-needle', sequence: 5, estimatedTime: 5, dependencies: ['hemming'], workflowType: 'sequential' },
            { operation: 'quality_check', machine: 'manual', sequence: 6, estimatedTime: 8, dependencies: ['label_attach'], workflowType: 'sequential' }
          ]
        },
        { 
          id: 'shirt', 
          name: 'Dress Shirt', 
          nameNp: 'ड्रेस शर्ट', 
          operations: [
            { operation: 'collar', machine: 'single-needle', sequence: 1, estimatedTime: 25 },
            { operation: 'sleeve_attach', machine: 'single-needle', sequence: 2, estimatedTime: 22 },
            { operation: 'side_seam', machine: 'single-needle', sequence: 3, estimatedTime: 20 },
            { operation: 'buttonhole', machine: 'buttonhole', sequence: 4, estimatedTime: 8 },
            { operation: 'button_attach', machine: 'buttonAttach', sequence: 5, estimatedTime: 12 },
            { operation: 'pressing', machine: 'iron', sequence: 6, estimatedTime: 15 }
          ]
        },
        { 
          id: 'pants', 
          name: 'Pants/Trousers', 
          nameNp: 'प्यान्ट', 
          operations: [
            { operation: 'waistband', machine: 'single-needle', sequence: 1, estimatedTime: 18 },
            { operation: 'side_seam', machine: 'overlock', sequence: 2, estimatedTime: 25 },
            { operation: 'inseam', machine: 'overlock', sequence: 3, estimatedTime: 20 },
            { operation: 'hemming', machine: 'flatlock', sequence: 4, estimatedTime: 12 },
            { operation: 'buttonhole', machine: 'buttonhole', sequence: 5, estimatedTime: 5 },
            { operation: 'button_attach', machine: 'buttonAttach', sequence: 6, estimatedTime: 3 },
            { operation: 'pressing', machine: 'iron', sequence: 7, estimatedTime: 12 }
          ]
        },
        { 
          id: 'jacket', 
          name: 'Jacket/Blazer', 
          nameNp: 'ज्याकेट', 
          operations: [
            { operation: 'collar', machine: 'single-needle', sequence: 1, estimatedTime: 30 },
            { operation: 'shoulder_join', machine: 'single-needle', sequence: 2, estimatedTime: 25 },
            { operation: 'sleeve_attach', machine: 'single-needle', sequence: 3, estimatedTime: 35 },
            { operation: 'side_seam', machine: 'single-needle', sequence: 4, estimatedTime: 28 },
            { operation: 'buttonhole', machine: 'buttonhole', sequence: 5, estimatedTime: 15 },
            { operation: 'button_attach', machine: 'buttonAttach', sequence: 6, estimatedTime: 20 },
            { operation: 'pressing', machine: 'iron', sequence: 7, estimatedTime: 25 }
          ]
        }
      ]
    };

    const defaultItems = defaultConfigs[configType] || [];
    
    if (defaultItems.length > 0) {
      try {
        await addDoc(collection(db, 'app_configurations'), {
          type: configType,
          items: defaultItems,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          version: 1
        });
        console.log(`✅ Created default ${configType} config with ${defaultItems.length} items`);
      } catch (error) {
        console.error(`❌ Error creating default ${configType} config:`, error);
      }
    }

    return defaultItems;
  }

  // Helper methods for specific configurations
  static async getMachines() {
    const result = await this.getConfig(this.CONFIG_TYPES.MACHINES);
    return result.data.filter(machine => machine.active !== false);
  }

  static async getOperations() {
    const result = await this.getConfig(this.CONFIG_TYPES.OPERATIONS);
    return result.data;
  }

  static async getPriorities() {
    const result = await this.getConfig(this.CONFIG_TYPES.PRIORITIES);
    return result.data.sort((a, b) => b.level - a.level);
  }

  static async getStatuses(category = null) {
    const result = await this.getConfig(this.CONFIG_TYPES.STATUSES);
    return category 
      ? result.data.filter(status => status.category === category)
      : result.data;
  }

  static async getSkills() {
    const result = await this.getConfig(this.CONFIG_TYPES.SKILLS);
    return result.data;
  }

  // Get operations compatible with a machine
  static async getOperationsForMachine(machineType) {
    const operations = await this.getOperations();
    return operations.filter(op => op.machineTypes && op.machineTypes.includes(machineType));
  }

  // Get best machine for an operation
  static async getMachineTypeForOperation(operationId) {
    const operations = await this.getOperations();
    const operation = operations.find(op => op.id === operationId);
    return operation?.machineTypes?.[0] || 'single-needle';
  }

  // Get garment types and their operation workflows
  static async getGarmentTypes() {
    const result = await this.getConfig(this.CONFIG_TYPES.GARMENT_TYPES);
    return result.data;
  }

  // Get operation workflow for a specific garment type
  static async getOperationsForGarment(garmentTypeId) {
    const garmentTypes = await this.getGarmentTypes();
    const garmentType = garmentTypes.find(g => g.id === garmentTypeId);
    return garmentType?.operations || [];
  }

  // Detect garment type from style name
  static detectGarmentType(styleName) {
    const lowerStyle = styleName?.toLowerCase() || '';
    
    if (lowerStyle.includes('polo')) {
      return 'polo';
    } else if (lowerStyle.includes('t-shirt') || lowerStyle.includes('tshirt')) {
      return 'tshirt';
    } else if (lowerStyle.includes('shirt')) {
      return 'shirt';
    } else if (lowerStyle.includes('pant') || lowerStyle.includes('trouser')) {
      return 'pants';
    } else if (lowerStyle.includes('jacket') || lowerStyle.includes('blazer') || lowerStyle.includes('coat')) {
      return 'jacket';
    } else {
      return 'tshirt'; // Default fallback
    }
  }

  // Clear cache when configs are updated
  static clearCache() {
    this.configCache.clear();
    console.log('🧹 Configuration cache cleared');
  }
}

// All services are already exported individually above
