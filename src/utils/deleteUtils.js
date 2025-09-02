// Universal Delete Utilities with Permission Management
// Provides consistent delete functionality across the application

import { 
  db, 
  doc, 
  deleteDoc, 
  collection, 
  getDocs, 
  query, 
  where 
} from '../config/firebase';

/**
 * Permission levels for delete operations
 */
export const DELETE_PERMISSIONS = {
  OWNER_ONLY: 'owner_only',           // Only the creator can delete
  ROLE_BASED: 'role_based',           // Based on user role
  ADMIN_ONLY: 'admin_only',           // Only admin/management
  SUPERVISOR_PLUS: 'supervisor_plus', // Supervisor and above
  UNRESTRICTED: 'unrestricted'        // Anyone can delete (use carefully)
};

/**
 * Check if user has permission to delete an item
 */
export const checkDeletePermission = (user, item, permissionLevel, options = {}) => {
  if (!user) return false;

  switch (permissionLevel) {
    case DELETE_PERMISSIONS.OWNER_ONLY:
      return item.createdBy === user.id || item.ownerId === user.id;

    case DELETE_PERMISSIONS.ADMIN_ONLY:
      return user.role === 'management' || user.role === 'admin';

    case DELETE_PERMISSIONS.SUPERVISOR_PLUS:
      return ['management', 'admin', 'supervisor'].includes(user.role);

    case DELETE_PERMISSIONS.ROLE_BASED:
      const allowedRoles = options.allowedRoles || ['management', 'admin'];
      return allowedRoles.includes(user.role);

    case DELETE_PERMISSIONS.UNRESTRICTED:
      return true;

    default:
      return false;
  }
};

/**
 * Show confirmation dialog for delete operations
 */
export const showDeleteConfirmation = (itemName, language = 'en', customMessage = null) => {
  const messages = {
    en: {
      title: `Delete ${itemName}?`,
      message: customMessage || `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`,
      confirm: 'Delete',
      cancel: 'Cancel'
    },
    np: {
      title: `${itemName} मेटाउनुहोस्?`,
      message: customMessage || `के तपाइँ यो ${itemName} मेटाउन चाहनुहुन्छ? यो कार्य फिर्ता गर्न सकिँदैन।`,
      confirm: 'मेटाउनुहोस्',
      cancel: 'रद्द गर्नुहोस्'
    }
  };

  const msg = messages[language] || messages.en;
  
  return new Promise((resolve) => {
    // Use browser confirm for now, can be enhanced with custom modal
    const result = window.confirm(`${msg.title}\n\n${msg.message}`);
    resolve(result);
  });
};

/**
 * Universal delete function for Firebase documents
 */
export const deleteFirebaseDocument = async (collectionName, documentId, options = {}) => {
  try {
    console.log(`🗑️ Deleting document ${documentId} from ${collectionName}`);
    
    // Check for dependencies if specified
    if (options.checkDependencies) {
      for (const dep of options.checkDependencies) {
        const depQuery = query(
          collection(db, dep.collection),
          where(dep.field, '==', documentId)
        );
        const depSnapshot = await getDocs(depQuery);
        
        if (!depSnapshot.empty) {
          throw new Error(`Cannot delete: ${depSnapshot.size} ${dep.name} depend on this item`);
        }
      }
    }

    // Perform the deletion
    await deleteDoc(doc(db, collectionName, documentId));
    console.log(`✅ Successfully deleted document ${documentId} from ${collectionName}`);
    
    return { success: true };
  } catch (error) {
    console.error(`❌ Error deleting document ${documentId} from ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * Universal delete function with all safeguards
 */
export const universalDelete = async ({
  item,
  itemName,
  user,
  permissionLevel = DELETE_PERMISSIONS.ROLE_BASED,
  permissionOptions = {},
  language = 'en',
  confirmationMessage = null,
  collectionName = null,
  deleteOptions = {},
  onSuccess = null,
  onError = null
}) => {
  try {
    // Step 1: Check permissions
    if (!checkDeletePermission(user, item, permissionLevel, permissionOptions)) {
      const errorMsg = language === 'np' 
        ? 'तपाइँलाई यो मेटाउने अनुमति छैन'
        : 'You do not have permission to delete this item';
      
      if (onError) onError(errorMsg);
      return { success: false, error: errorMsg };
    }

    // Step 2: Show confirmation dialog
    const confirmed = await showDeleteConfirmation(itemName, language, confirmationMessage);
    if (!confirmed) {
      return { success: false, cancelled: true };
    }

    // Step 3: Perform deletion
    let result = { success: true };
    
    if (collectionName && item.id) {
      // Firebase deletion
      result = await deleteFirebaseDocument(collectionName, item.id, deleteOptions);
    }

    // Step 4: Handle success/error
    if (result.success) {
      console.log(`✅ Successfully deleted ${itemName}: ${item.id}`);
      if (onSuccess) onSuccess(item);
    } else {
      console.error(`❌ Failed to delete ${itemName}:`, result.error);
      if (onError) onError(result.error);
    }

    return result;
  } catch (error) {
    console.error(`❌ Universal delete error for ${itemName}:`, error);
    if (onError) onError(error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Enhanced confirmation modal component (React)
 */
export const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName, 
  language = 'en',
  customMessage = null 
}) => {
  if (!isOpen) return null;

  const messages = {
    en: {
      title: `Delete ${itemName}?`,
      message: customMessage || `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`,
      confirm: 'Delete',
      cancel: 'Cancel'
    },
    np: {
      title: `${itemName} मेटाउनुहोस्?`,
      message: customMessage || `के तपाइँ यो ${itemName} मेटाउन चाहनुहुन्छ? यो कार्य फिर्ता गर्न सकिँदैन।`,
      confirm: 'मेटाउनुहोस्',
      cancel: 'रद्द गर्नुहोस्'
    }
  };

  const msg = messages[language] || messages.en;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="text-red-600 text-2xl mr-3">🗑️</div>
          <h3 className="text-lg font-semibold text-gray-900">{msg.title}</h3>
        </div>
        
        <p className="text-gray-600 mb-6">{msg.message}</p>
        
        <div className="flex space-x-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            {msg.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {msg.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};

const deleteUtils = {
  DELETE_PERMISSIONS,
  checkDeletePermission,
  showDeleteConfirmation,
  deleteFirebaseDocument,
  universalDelete,
  DeleteConfirmationModal
};

export default deleteUtils;