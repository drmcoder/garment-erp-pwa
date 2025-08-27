// User Roles Configuration
export const USER_ROLES = {
  'admin': {
    id: 'admin',
    name: 'Admin',
    nameNp: 'प्रशासक',
    icon: '👑',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-300',
    description: 'Full system access and management',
    permissions: ['all'],
    level: 5
  },
  'supervisor': {
    id: 'supervisor',
    name: 'Supervisor',
    nameNp: 'पर्यवेक्षक',
    icon: '👨‍💼',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    description: 'Supervises operators and manages work assignments',
    permissions: ['assign_work', 'view_reports', 'manage_operators'],
    level: 4
  },
  'operator': {
    id: 'operator',
    name: 'Operator',
    nameNp: 'संचालक',
    icon: '👷',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
    description: 'Performs production work',
    permissions: ['view_work', 'complete_work', 'view_profile'],
    level: 2
  },
  'quality-controller': {
    id: 'quality-controller',
    name: 'Quality Controller',
    nameNp: 'गुणस्तर नियन्त्रक',
    icon: '🔍',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300',
    description: 'Checks and ensures quality standards',
    permissions: ['quality_check', 'reject_work', 'view_reports'],
    level: 3
  },
  'manager': {
    id: 'manager',
    name: 'Manager',
    nameNp: 'प्रबन्धक',
    icon: '👨‍💻',
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-300',
    description: 'Manages overall operations and planning',
    permissions: ['view_analytics', 'manage_schedules', 'view_all_reports'],
    level: 4
  },
  'guest': {
    id: 'guest',
    name: 'Guest',
    nameNp: 'अतिथि',
    icon: '👤',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-300',
    description: 'Limited read-only access',
    permissions: ['view_basic'],
    level: 1
  }
};

// Get user role info
export const getUserRole = (roleId) => {
  return USER_ROLES[roleId] || USER_ROLES['guest'];
};

// Get user role name
export const getUserRoleName = (roleId, language = 'en') => {
  const role = USER_ROLES[roleId];
  if (!role) return roleId || 'Unknown';
  return language === 'np' ? role.nameNp : role.name;
};

// Check if user has permission
export const hasPermission = (userRole, permission) => {
  const role = USER_ROLES[userRole];
  if (!role) return false;
  return role.permissions.includes('all') || role.permissions.includes(permission);
};

// Get all user roles as array
export const getAllUserRoles = () => {
  return Object.values(USER_ROLES);
};

// Get user role options for dropdowns
export const getUserRoleOptions = (language = 'en') => {
  return Object.values(USER_ROLES).map(role => ({
    value: role.id,
    label: language === 'np' ? role.nameNp : role.name,
    icon: role.icon,
    color: role.color,
    level: role.level
  }));
};