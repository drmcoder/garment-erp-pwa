// Simple, clean Firebase service
import { 
  db, 
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
  serverTimestamp 
} from '../config/firebase';

class FirebaseService {
  // Generic CRUD operations
  static async create(collectionName, data) {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  static async getById(collectionName, id) {
    try {
      const docSnap = await getDoc(doc(db, collectionName, id));
      if (docSnap.exists()) {
        return { 
          success: true, 
          data: { id: docSnap.id, ...docSnap.data() } 
        };
      } else {
        return { success: false, error: 'Document not found' };
      }
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  static async update(collectionName, id, data) {
    try {
      await updateDoc(doc(db, collectionName, id), {
        ...data,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  static async delete(collectionName, id) {
    try {
      await deleteDoc(doc(db, collectionName, id));
      return { success: true };
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  static async getAll(collectionName, orderByField = 'createdAt', orderDirection = 'desc', limitCount = 100) {
    try {
      const q = query(
        collection(db, collectionName),
        orderBy(orderByField, orderDirection),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data };
    } catch (error) {
      console.error(`Error getting all documents from ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }

  static async getWhere(collectionName, field, operator, value, orderByField = 'createdAt', limitCount = 100) {
    try {
      const q = query(
        collection(db, collectionName),
        where(field, operator, value),
        orderBy(orderByField, 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data };
    } catch (error) {
      console.error(`Error querying ${collectionName}:`, error);
      return { success: false, error: error.message };
    }
  }
}

// Specific business logic services
export class BundleService {
  static async getAllBundles() {
    return FirebaseService.getAll('bundles');
  }

  static async getBundleById(id) {
    return FirebaseService.getById('bundles', id);
  }

  static async createBundle(bundleData) {
    return FirebaseService.create('bundles', bundleData);
  }

  static async updateBundle(id, bundleData) {
    return FirebaseService.update('bundles', id, bundleData);
  }

  static async getOperatorBundles(operatorId) {
    return FirebaseService.getWhere('bundles', 'assignedOperator', '==', operatorId);
  }

  static async getSelfAssignedBundles() {
    return FirebaseService.getWhere('bundles', 'status', '==', 'self_assigned');
  }

  static async approveSelfAssignment(bundleId, supervisorId) {
    return FirebaseService.update('bundles', bundleId, {
      status: 'approved',
      approvedBy: supervisorId,
      approvedAt: serverTimestamp()
    });
  }

  static async rejectSelfAssignment(bundleId, supervisorId, reason) {
    return FirebaseService.update('bundles', bundleId, {
      status: 'rejected',
      rejectedBy: supervisorId,
      rejectedAt: serverTimestamp(),
      rejectionReason: reason
    });
  }
}

export class WorkItemService {
  static async getAllWorkItems() {
    return FirebaseService.getAll('workItems');
  }

  static async getWorkItemById(id) {
    return FirebaseService.getById('workItems', id);
  }

  static async createWorkItem(workItemData) {
    return FirebaseService.create('workItems', workItemData);
  }

  static async updateWorkItem(id, workItemData) {
    return FirebaseService.update('workItems', id, workItemData);
  }

  static async getOperatorWorkItems(operatorId) {
    return FirebaseService.getWhere('workItems', 'assignedOperator', '==', operatorId);
  }

  static async getSelfAssignedWorkItems() {
    return FirebaseService.getWhere('workItems', 'status', '==', 'self_assigned');
  }

  static async approveSelfAssignment(workItemId, supervisorId) {
    return FirebaseService.update('workItems', workItemId, {
      status: 'approved',
      approvedBy: supervisorId,
      approvedAt: serverTimestamp()
    });
  }

  static async rejectSelfAssignment(workItemId, supervisorId, reason) {
    return FirebaseService.update('workItems', workItemId, {
      status: 'rejected',
      rejectedBy: supervisorId,
      rejectedAt: serverTimestamp(),
      rejectionReason: reason
    });
  }
}

export class OperatorService {
  static async getAllOperators() {
    return FirebaseService.getWhere('users', 'role', '==', 'operator');
  }

  static async getOperatorById(id) {
    return FirebaseService.getById('users', id);
  }

  static async updateOperator(id, operatorData) {
    return FirebaseService.update('users', id, operatorData);
  }
}

export class EarningsService {
  static async recordEarnings(earningsData) {
    return FirebaseService.create('earnings', earningsData);
  }

  static async getOperatorEarnings(operatorId, startDate, endDate) {
    return FirebaseService.getWhere('earnings', 'operatorId', '==', operatorId);
  }
}

export default FirebaseService;