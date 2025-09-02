// Simple utility to load rates from Firestore operationTypes collection
import { db, collection, getDocs, doc, getDoc } from '../config/firebase';

// Cache for rates to avoid multiple Firestore calls
let rateCache = {};
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load all operation rates from Firestore and cache them
 */
export const loadAllRatesFromFirestore = async () => {
  try {
    // Check if cache is still valid
    if (cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
      console.log('🔄 Using cached operation rates');
      return { success: true, rates: rateCache };
    }

    console.log('📥 Loading operation rates from Firestore...');
    const operationsSnapshot = await getDocs(collection(db, 'operationTypes'));
    
    // Reset cache
    rateCache = {};
    
    operationsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      rateCache[doc.id] = {
        id: doc.id,
        rate: data.rate || 0,
        time: data.estimatedTimeMinutes || 0,
        english: data.english || doc.id,
        nepali: data.nepali || doc.id,
        machine: data.machine || 'overlock'
      };
    });
    
    cacheTimestamp = Date.now();
    console.log('✅ Loaded', Object.keys(rateCache).length, 'operation rates from Firestore');
    
    return { success: true, rates: rateCache };
  } catch (error) {
    console.error('❌ Failed to load rates from Firestore:', error);
    return { success: false, error: error.message, rates: {} };
  }
};

/**
 * Get rate for specific operation
 */
export const getFirestoreRate = async (operationName) => {
  if (!operationName) return 0;
  
  // Load all rates if not cached
  if (!cacheTimestamp || (Date.now() - cacheTimestamp) > CACHE_DURATION) {
    await loadAllRatesFromFirestore();
  }
  
  // Try exact match first
  if (rateCache[operationName]) {
    return rateCache[operationName].rate || 0;
  }
  
  // Try common variations
  const variations = [
    operationName.toLowerCase(),
    operationName.replace('_', ' ').toLowerCase(),
    operationName.replace(' ', '_').toLowerCase()
  ];
  
  for (const variation of variations) {
    for (const [key, value] of Object.entries(rateCache)) {
      if (key.toLowerCase() === variation || 
          value.english?.toLowerCase() === variation ||
          value.nepali?.toLowerCase() === variation) {
        console.log(`📍 Found rate for "${operationName}" as "${key}": ₹${value.rate}`);
        return value.rate || 0;
      }
    }
  }
  
  console.warn(`⚠️ No rate found for operation: ${operationName}`);
  return 0; // Return 0 instead of default to identify missing rates
};

/**
 * Get operation details including rate and time
 */
export const getFirestoreOperationDetails = async (operationName) => {
  if (!operationName) return null;
  
  // Load all rates if not cached
  if (!cacheTimestamp || (Date.now() - cacheTimestamp) > CACHE_DURATION) {
    await loadAllRatesFromFirestore();
  }
  
  // Try exact match first
  if (rateCache[operationName]) {
    return rateCache[operationName];
  }
  
  // Try common variations
  const variations = [
    operationName.toLowerCase(),
    operationName.replace('_', ' ').toLowerCase(),
    operationName.replace(' ', '_').toLowerCase()
  ];
  
  for (const variation of variations) {
    for (const [key, value] of Object.entries(rateCache)) {
      if (key.toLowerCase() === variation || 
          value.english?.toLowerCase() === variation ||
          value.nepali?.toLowerCase() === variation) {
        return value;
      }
    }
  }
  
  return null;
};

/**
 * Clear the cache (useful for testing or when rates are updated)
 */
export const clearRateCache = () => {
  rateCache = {};
  cacheTimestamp = null;
  console.log('🧹 Rate cache cleared');
};

/**
 * Get cached rates without making Firestore call
 */
export const getCachedRates = () => {
  return { rates: rateCache, timestamp: cacheTimestamp };
};