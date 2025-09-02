// Operation Rate Mapping Utility
// Maps generic operation names to specific operation codes with rates

import { OPERATION_MODULES } from '../data/mockData.js';
import OperationRateService from '../services/OperationRateService';
import { getFirestoreRate, getFirestoreOperationDetails } from './firestoreRateLoader';

/**
 * Maps generic operation names to specific operations with rates
 */
export const OPERATION_RATE_MAP = {
  // Side seam operations
  'side_seam': 'side-seam-basic', // Rate: 2.5
  'sideSeam': 'side-seam-basic',
  'Side Seam': 'side-seam-basic',
  
  // Sleeve attach operations
  'sleeve_attach': 'sleeve-attach-basic', // Rate: 3.0
  'sleeveAttach': 'sleeve-attach-basic', 
  'Sleeve Attach': 'sleeve-attach-basic',
  
  // Shoulder join operations
  'shoulder_join': 'shoulder-join-basic', // Rate: 2.0
  'shoulderJoin': 'shoulder-join-basic',
  'Shoulder Join': 'shoulder-join-basic',
  
  // Other common operations
  'neck_bind': 'neck-bind-basic', // Rate: 4.0
  'neckBind': 'neck-bind-basic',
  'bottom_hem': 'bottom-hem-basic', // Rate: 3.0
  'bottomHem': 'bottom-hem-basic',
  'collar_attach': 'collar-attach-polo', // Rate: 5.0
  'collarAttach': 'collar-attach-polo',
  'pocket_attach': 'pocket-attach-basic', // Rate: 4.0
  'pocketAttach': 'pocket-attach-basic',
  'zipper_install': 'zipper-install', // Rate: 8.0
  'zipperInstall': 'zipper-install',
  'buttonhole': 'buttonhole-make', // Rate: 6.0
  'buttonhole_make': 'buttonhole-make',
  
  // Default fallbacks for common operations
  'cutting': 'shoulder-join-basic', // Default basic operation
  'sewing': 'side-seam-basic',
  'finishing': 'bottom-hem-basic',
};

/**
 * Gets the rate for a given operation name (async version using Firestore)
 * @param {string} operationName - Generic operation name
 * @returns {Promise<number>} Rate per piece
 */
export const getOperationRateAsync = async (operationName) => {
  if (!operationName) return 2.5; // Default rate
  
  try {
    // Try to get rate from Firestore first
    const result = await OperationRateService.getOperationRate(operationName);
    if (result.success && result.rate) {
      return result.rate;
    }
  } catch (error) {
    console.warn('Failed to get rate from Firestore, using fallback:', error);
  }
  
  // Fallback to synchronous method
  return getOperationRate(operationName);
};

/**
 * Gets the rate for a given operation name (synchronous fallback)
 * @param {string} operationName - Generic operation name
 * @returns {number} Rate per piece
 */
export const getOperationRate = (operationName) => {
  if (!operationName) return 2.5; // Default rate
  
  // Check if it's already a specific operation key
  if (OPERATION_MODULES[operationName]) {
    return OPERATION_MODULES[operationName].rate;
  }
  
  // Map generic name to specific operation
  const specificOperation = OPERATION_RATE_MAP[operationName] || OPERATION_RATE_MAP[operationName.toLowerCase()];
  
  if (specificOperation && OPERATION_MODULES[specificOperation]) {
    return OPERATION_MODULES[specificOperation].rate;
  }
  
  // Fallback based on operation type
  if (operationName.toLowerCase().includes('seam')) {
    return OPERATION_MODULES['side-seam-basic']?.rate || 2.5;
  }
  if (operationName.toLowerCase().includes('sleeve')) {
    return OPERATION_MODULES['sleeve-attach-basic']?.rate || 3.0;
  }
  if (operationName.toLowerCase().includes('shoulder')) {
    return OPERATION_MODULES['shoulder-join-basic']?.rate || 2.0;
  }
  if (operationName.toLowerCase().includes('neck')) {
    return OPERATION_MODULES['neck-bind-basic']?.rate || 4.0;
  }
  if (operationName.toLowerCase().includes('collar')) {
    return OPERATION_MODULES['collar-attach-polo']?.rate || 5.0;
  }
  
  // Default rate
  return 2.5;
};

/**
 * Gets the full operation details for display
 * @param {string} operationName - Generic operation name
 * @returns {object} Operation details
 */
export const getOperationDetails = (operationName) => {
  const specificOperation = OPERATION_RATE_MAP[operationName] || OPERATION_RATE_MAP[operationName?.toLowerCase()];
  
  if (specificOperation && OPERATION_MODULES[specificOperation]) {
    return {
      ...OPERATION_MODULES[specificOperation],
      key: specificOperation,
      originalName: operationName
    };
  }
  
  // Return default operation details
  return {
    name: operationName,
    nameNepali: operationName,
    rate: getOperationRate(operationName),
    time: 3,
    machine: 'overlock',
    key: 'default',
    originalName: operationName
  };
};

/**
 * Updates work assignment with proper rates (async version using Firestore)
 * @param {object} workAssignment - Work assignment object
 * @returns {Promise<object>} Updated work assignment with correct rate
 */
export const updateWorkAssignmentRateAsync = async (workAssignment) => {
  if (!workAssignment) return workAssignment;
  
  const rate = await getFirestoreRate(workAssignment.operation);
  const operationDetails = await getFirestoreOperationDetails(workAssignment.operation);
  
  return {
    ...workAssignment,
    rate: rate > 0 ? rate : getOperationRate(workAssignment.operation), // Fallback to mock data if Firestore rate is 0
    ratePerPiece: rate > 0 ? rate : getOperationRate(workAssignment.operation),
    estimatedEarnings: (workAssignment.pieces || 0) * (rate > 0 ? rate : getOperationRate(workAssignment.operation)),
    operationDetails: operationDetails || getOperationDetails(workAssignment.operation)
  };
};

/**
 * Updates work assignment with proper rates (synchronous fallback)
 * @param {object} workAssignment - Work assignment object
 * @returns {object} Updated work assignment with correct rate
 */
export const updateWorkAssignmentRate = (workAssignment) => {
  if (!workAssignment) return workAssignment;
  
  const rate = getOperationRate(workAssignment.operation);
  
  return {
    ...workAssignment,
    rate: rate,
    ratePerPiece: rate,
    estimatedEarnings: (workAssignment.pieces || 0) * rate,
    operationDetails: getOperationDetails(workAssignment.operation)
  };
};