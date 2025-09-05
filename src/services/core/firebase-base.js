// Core Firebase Base Service
// Provides common Firebase utilities and error handling

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
  writeBatch,
} from "../../config/firebase";

import FirebaseErrorHandler from '../../utils/firebaseErrorHandler';

/**
 * Base Firebase Service Class
 * Provides common CRUD operations and error handling
 */
export class FirebaseBaseService {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.collection = collection(db, collectionName);
  }

  /**
   * Create a new document
   */
  async create(data) {
    try {
      const docRef = await addDoc(this.collection, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      const errorInfo = FirebaseErrorHandler.handleFirestoreError(error, `Create ${this.collectionName}`);
      return { success: false, error: errorInfo.message };
    }
  }

  /**
   * Get document by ID
   */
  async getById(id) {
    try {
      const docRef = doc(this.collection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Document not found' };
      }
    } catch (error) {
      const errorInfo = FirebaseErrorHandler.handleFirestoreError(error, `Get ${this.collectionName}`);
      return { success: false, error: errorInfo.message };
    }
  }

  /**
   * Get all documents with optional query
   */
  async getAll(constraints = []) {
    try {
      const q = constraints.length > 0 ? query(this.collection, ...constraints) : this.collection;
      const querySnapshot = await getDocs(q);
      
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      return { success: true, data };
    } catch (error) {
      const errorInfo = FirebaseErrorHandler.handleFirestoreError(error, `Get all ${this.collectionName}`);
      return { success: false, error: errorInfo.message, data: [] };
    }
  }

  /**
   * Update document by ID
   */
  async update(id, data) {
    try {
      const docRef = doc(this.collection, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      const errorInfo = FirebaseErrorHandler.handleFirestoreError(error, `Update ${this.collectionName}`);
      return { success: false, error: errorInfo.message };
    }
  }

  /**
   * Delete document by ID
   */
  async delete(id) {
    try {
      const docRef = doc(this.collection, id);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      const errorInfo = FirebaseErrorHandler.handleFirestoreError(error, `Delete ${this.collectionName}`);
      return { success: false, error: errorInfo.message };
    }
  }

  /**
   * Listen to collection changes
   */
  onSnapshot(callback, constraints = []) {
    try {
      const q = constraints.length > 0 ? query(this.collection, ...constraints) : this.collection;
      return onSnapshot(q, 
        (querySnapshot) => {
          const data = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback({ success: true, data });
        },
        (error) => {
          const errorInfo = FirebaseErrorHandler.handleFirestoreError(error, `Listen to ${this.collectionName}`);
          callback({ success: false, error: errorInfo.message, data: [] });
        }
      );
    } catch (error) {
      const errorInfo = FirebaseErrorHandler.handleFirestoreError(error, `Setup listener for ${this.collectionName}`);
      callback({ success: false, error: errorInfo.message, data: [] });
      return () => {}; // Return no-op function
    }
  }

  /**
   * Batch operations
   */
  async batchWrite(operations) {
    try {
      const batch = writeBatch(db);
      
      operations.forEach(operation => {
        const { type, docId, data } = operation;
        const docRef = docId ? doc(this.collection, docId) : doc(this.collection);
        
        switch (type) {
          case 'set':
            batch.set(docRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
            break;
          case 'update':
            batch.update(docRef, { ...data, updatedAt: serverTimestamp() });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
          default:
            throw new Error(`Unknown batch operation: ${type}`);
        }
      });
      
      await batch.commit();
      return { success: true };
    } catch (error) {
      const errorInfo = FirebaseErrorHandler.handleFirestoreError(error, `Batch operations on ${this.collectionName}`);
      return { success: false, error: errorInfo.message };
    }
  }

  /**
   * Transaction operations
   */
  async transaction(callback) {
    try {
      const result = await runTransaction(db, callback);
      return { success: true, data: result };
    } catch (error) {
      const errorInfo = FirebaseErrorHandler.handleFirestoreError(error, `Transaction on ${this.collectionName}`);
      return { success: false, error: errorInfo.message };
    }
  }
}

/**
 * Common Firebase utilities
 */
export const FirebaseUtils = {
  // Query builders
  createQuery: (collectionRef, ...constraints) => query(collectionRef, ...constraints),
  
  // Common constraints
  whereEqual: (field, value) => where(field, '==', value),
  whereIn: (field, values) => where(field, 'in', values),
  whereGreater: (field, value) => where(field, '>', value),
  whereLess: (field, value) => where(field, '<', value),
  orderAsc: (field) => orderBy(field, 'asc'),
  orderDesc: (field) => orderBy(field, 'desc'),
  limitResults: (count) => limit(count),
  
  // Timestamps
  now: () => serverTimestamp(),
  increment: (value) => increment(value),
  
  // Collection references
  getCollection: (name) => collection(db, name),
  getCollectionById: (name) => collection(db, COLLECTIONS[name] || name),
  
  // Document references
  getDoc: (collectionName, docId) => doc(db, collectionName, docId),
  
  // Auth utilities
  getCurrentUser: () => auth.currentUser,
  isAuthenticated: () => !!auth.currentUser,
};

export { COLLECTIONS } from "../../config/firebase";
export default FirebaseBaseService;