// src/context/PermissionsContext.jsx
// Permissions Context for Role-Based Access Control

import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { PermissionService, PERMISSIONS } from '../services/permissions-service';

const PermissionsContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  const { user } = useAuth();
  
  const hasPermission = (permission) => {
    return PermissionService.hasPermission(user, permission);
  };
  
  const hasAnyPermission = (permissions) => {
    return PermissionService.hasAnyPermission(user, permissions);
  };
  
  const hasAllPermissions = (permissions) => {
    return PermissionService.hasAllPermissions(user, permissions);
  };
  
  const canAccessView = (viewName) => {
    return PermissionService.canAccessView(user, viewName);
  };
  
  const getUserPermissions = () => {
    return PermissionService.getUserPermissions(user);
  };
  
  const getPermissionsByCategory = (category) => {
    return PermissionService.getPermissionsByCategory(user, category);
  };
  
  const filterByPermissions = (items, permissionField = 'requiredPermission') => {
    return PermissionService.filterByPermissions(user, items, permissionField);
  };
  
  const getAvailableRoles = () => {
    return PermissionService.getAvailableRoles(user);
  };
  
  const value = {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessView,
    getUserPermissions,
    getPermissionsByCategory,
    filterByPermissions,
    getAvailableRoles,
    PERMISSIONS,
    currentUser: user
  };
  
  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};

// Higher-order component for permission-based rendering
export const withPermissions = (Component, requiredPermissions = []) => {
  return function PermissionWrappedComponent(props) {
    const { hasAnyPermission } = usePermissions();
    
    if (requiredPermissions.length === 0 || hasAnyPermission(requiredPermissions)) {
      return <Component {...props} />;
    }
    
    return (
      <div className="text-center p-8">
        <div className="text-4xl mb-4">🚫</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You don't have permission to access this feature.</p>
      </div>
    );
  };
};

// Component for conditional rendering based on permissions
export const PermissionGate = ({ 
  children, 
  permission, 
  permissions, 
  fallback = null, 
  requireAll = false 
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  
  let hasAccess = false;
  
  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else {
    hasAccess = true; // No permissions required
  }
  
  return hasAccess ? children : fallback;
};

export default PermissionsProvider;