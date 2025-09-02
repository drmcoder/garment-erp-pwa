import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, startAfter, runTransaction } from 'firebase/firestore';
import { db } from '../../config/firebase';
import logger from '../../utils/logger';

class BaseService {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.collectionRef = collection(db, collectionName);
  }

  // Create
  async create(data) {
    try {
      const docRef = await addDoc(this.collectionRef, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      logger.info(`Document created in ${this.collectionName}`, { id: docRef.id });
      return { success: true, id: docRef.id, data };
    } catch (error) {
      logger.error(`Error creating document in ${this.collectionName}`, error);
      return { success: false, error: error.message };
    }
  }

  // Read single document
  async getById(id) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Document not found' };
      }
    } catch (error) {
      logger.error(`Error getting document from ${this.collectionName}`, error);
      return { success: false, error: error.message };
    }
  }

  // Read all with pagination
  async getAll(options = {}) {
    try {
      const { 
        filters = [], 
        orderByField = 'createdAt', 
        orderDirection = 'desc', 
        pageSize = 20, 
        lastDoc = null 
      } = options;

      let q = this.collectionRef;

      // Apply filters
      filters.forEach(filter => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });

      // Apply ordering
      q = query(q, orderBy(orderByField, orderDirection));

      // Apply pagination
      if (pageSize) {
        q = query(q, limit(pageSize));
      }
      
      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { 
        success: true, 
        data, 
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      logger.error(`Error getting documents from ${this.collectionName}`, error);
      return { success: false, error: error.message };
    }
  }

  // Update
  async update(id, data) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });
      logger.info(`Document updated in ${this.collectionName}`, { id });
      return { success: true, id, data };
    } catch (error) {
      logger.error(`Error updating document in ${this.collectionName}`, error);
      return { success: false, error: error.message };
    }
  }

  // Delete
  async delete(id) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      logger.info(`Document deleted from ${this.collectionName}`, { id });
      return { success: true, id };
    } catch (error) {
      logger.error(`Error deleting document from ${this.collectionName}`, error);
      return { success: false, error: error.message };
    }
  }

  // Batch operations
  async batchCreate(items) {
    try {
      const results = await runTransaction(db, async (transaction) => {
        const ids = [];
        items.forEach(item => {
          const docRef = doc(this.collectionRef);
          transaction.set(docRef, {
            ...item,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          ids.push(docRef.id);
        });
        return ids;
      });
      
      logger.info(`Batch created ${results.length} documents in ${this.collectionName}`);
      return { success: true, ids: results };
    } catch (error) {
      logger.error(`Error in batch create for ${this.collectionName}`, error);
      return { success: false, error: error.message };
    }
  }

  // Custom query
  async customQuery(queryBuilder) {
    try {
      const q = queryBuilder(this.collectionRef);
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return { success: true, data };
    } catch (error) {
      logger.error(`Error in custom query for ${this.collectionName}`, error);
      return { success: false, error: error.message };
    }
  }
}

export default BaseService;