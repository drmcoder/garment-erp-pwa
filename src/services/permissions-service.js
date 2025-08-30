// src/services/permissions-service.js
// Granular Role-Based Access Control System

export const PERMISSIONS = {
  // Dashboard permissions
  DASHBOARD_VIEW: 'dashboard.view',
  DASHBOARD_ANALYTICS: 'dashboard.analytics',
  
  // Work management
  WORK_ASSIGN: 'work.assign',
  WORK_VIEW_ALL: 'work.view.all',
  WORK_VIEW_OWN: 'work.view.own',
  WORK_COMPLETE: 'work.complete',
  WORK_CANCEL: 'work.cancel',
  
  // User management
  USER_CREATE: 'user.create',
  USER_EDIT: 'user.edit',
  USER_DELETE: 'user.delete',
  USER_VIEW_ALL: 'user.view.all',
  USER_MANAGE_ROLES: 'user.manage.roles',
  
  // WIP management
  WIP_IMPORT: 'wip.import',
  WIP_EDIT: 'wip.edit',
  WIP_DELETE: 'wip.delete',
  WIP_EXPORT: 'wip.export',
  
  // Production data
  PRODUCTION_VIEW: 'production.view',
  PRODUCTION_EDIT: 'production.edit',
  PRODUCTION_REPORTS: 'production.reports',
  
  // System settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
  SETTINGS_SYSTEM: 'settings.system',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics.view',
  ANALYTICS_ADVANCED: 'analytics.advanced',
  
  // Payroll
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_EDIT: 'payroll.edit',
  PAYROLL_APPROVE: 'payroll.approve',
  
  // Quality control
  QUALITY_VIEW: 'quality.view',
  QUALITY_REPORT: 'quality.report',
  QUALITY_APPROVE: 'quality.approve',
  
  // Machine management
  MACHINE_VIEW: 'machine.view',
  MACHINE_EDIT: 'machine.edit',
  MACHINE_MAINTENANCE: 'machine.maintenance'
};

// Define role permissions without circular dependencies
const operatorPermissions = [
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.WORK_VIEW_OWN,
  PERMISSIONS.WORK_COMPLETE,
  PERMISSIONS.QUALITY_REPORT,
  PERMISSIONS.PRODUCTION_VIEW
];

const supervisorPermissions = [
  PERMISSIONS.DASHBOARD_VIEW,
  PERMISSIONS.DASHBOARD_ANALYTICS,
  PERMISSIONS.WORK_ASSIGN,
  PERMISSIONS.WORK_VIEW_ALL,
  PERMISSIONS.WORK_CANCEL,
  PERMISSIONS.USER_CREATE,
  PERMISSIONS.USER_EDIT,
  PERMISSIONS.USER_VIEW_ALL,
  PERMISSIONS.WIP_IMPORT,
  PERMISSIONS.WIP_EDIT,
  PERMISSIONS.WIP_EXPORT,
  PERMISSIONS.PRODUCTION_VIEW,
  PERMISSIONS.PRODUCTION_EDIT,
  PERMISSIONS.QUALITY_VIEW,
  PERMISSIONS.QUALITY_APPROVE,
  PERMISSIONS.MACHINE_VIEW
];

const productionManagerPermissions = [
  ...supervisorPermissions,
  PERMISSIONS.USER_DELETE,
  PERMISSIONS.USER_MANAGE_ROLES,
  PERMISSIONS.WIP_DELETE,
  PERMISSIONS.PRODUCTION_REPORTS,
  PERMISSIONS.SETTINGS_VIEW,
  PERMISSIONS.ANALYTICS_VIEW,
  PERMISSIONS.PAYROLL_VIEW,
  PERMISSIONS.MACHINE_EDIT
];

const managementPermissions = [
  ...productionManagerPermissions,
  PERMISSIONS.SETTINGS_EDIT,
  PERMISSIONS.SETTINGS_SYSTEM,
  PERMISSIONS.ANALYTICS_ADVANCED,
  PERMISSIONS.PAYROLL_EDIT,
  PERMISSIONS.PAYROLL_APPROVE,
  PERMISSIONS.MACHINE_MAINTENANCE
];

export const ROLE_PERMISSIONS = {
  operator: operatorPermissions,
  
  senior_operator: [
    ...operatorPermissions,
    PERMISSIONS.WORK_ASSIGN,
    PERMISSIONS.USER_VIEW_ALL,
    PERMISSIONS.QUALITY_APPROVE
  ],
  
  supervisor: supervisorPermissions,
  
  production_manager: productionManagerPermissions,
  
  management: [
    // Management now has all admin permissions
    ...Object.values(PERMISSIONS)
  ]
};

export class PermissionService {
  /**
   * Check if user has a specific permission
   */
  static hasPermission(user, permission) {
    if (!user || !user.role) return false;
    
    // Check role-based permissions
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    if (rolePermissions.includes(permission)) return true;
    
    // Check custom user permissions
    const customPermissions = user.permissions || [];
    if (customPermissions.includes(permission)) return true;
    
    return false;
  }
  
  /**
   * Check if user has any of the provided permissions
   */
  static hasAnyPermission(user, permissions) {
    return permissions.some(permission => this.hasPermission(user, permission));
  }
  
  /**
   * Check if user has all of the provided permissions
   */
  static hasAllPermissions(user, permissions) {
    return permissions.every(permission => this.hasPermission(user, permission));
  }
  
  /**
   * Get all permissions for a user
   */
  static getUserPermissions(user) {
    if (!user || !user.role) return [];
    
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    const customPermissions = user.permissions || [];
    
    return [...new Set([...rolePermissions, ...customPermissions])];
  }
  
  /**
   * Get permissions by category
   */
  static getPermissionsByCategory(user, category) {
    const userPermissions = this.getUserPermissions(user);
    return userPermissions.filter(permission => permission.startsWith(category));
  }
  
  /**
   * Check if user can access a specific view/route
   */
  static canAccessView(user, viewName) {
    const viewPermissions = {
      'dashboard': [PERMISSIONS.DASHBOARD_VIEW],
      'analytics': [PERMISSIONS.ANALYTICS_VIEW],
      'payroll': [PERMISSIONS.PAYROLL_VIEW],
      'work-assignment': [PERMISSIONS.WORK_ASSIGN],
      'user-management': [PERMISSIONS.USER_VIEW_ALL],
      'settings': [PERMISSIONS.SETTINGS_VIEW],
      'template-builder': [PERMISSIONS.WIP_IMPORT, PERMISSIONS.WORK_ASSIGN],
    };
    
    const requiredPermissions = viewPermissions[viewName] || [];
    return this.hasAnyPermission(user, requiredPermissions);
  }
  
  /**
   * Filter items based on permissions
   */
  static filterByPermissions(user, items, permissionField = 'requiredPermission') {
    return items.filter(item => {
      const requiredPermission = item[permissionField];
      if (!requiredPermission) return true; // No permission required
      return this.hasPermission(user, requiredPermission);
    });
  }
  
  /**
   * Get available roles based on current user's permissions
   */
  static getAvailableRoles(currentUser) {
    if (this.hasPermission(currentUser, PERMISSIONS.USER_MANAGE_ROLES)) {
      return {
        operator: 'Operator',
        senior_operator: 'Senior Operator', 
        supervisor: 'Supervisor',
        production_manager: 'Production Manager',
        management: 'Management',
        admin: 'Administrator'
      };
    }
    
    // Limited role assignment for supervisors
    if (currentUser.role === 'supervisor') {
      return {
        operator: 'Operator',
        senior_operator: 'Senior Operator'
      };
    }
    
    return {};
  }
}

export default PermissionService;