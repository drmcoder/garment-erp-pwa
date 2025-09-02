// Master Constants Export
// Import all constants from individual files

// Import specific functions for utility functions
import { 
  getMachineTypeIcon as _getMachineTypeIcon,
  getMachineTypeName,
  getMachineTypeOptions
} from './machineTypes';
import { 
  getWorkStatus as _getWorkStatus,
  getWorkStatusName,
  getWorkStatusOptions
} from './workStatuses';
import { 
  getUserRole as _getUserRole,
  getUserRoleName,
  getUserRoleOptions
} from './userRoles';
import { 
  getSkillLevel as _getSkillLevel,
  getSkillLevelName,
  getSkillLevelOptions
} from './skillLevels';
import { 
  getGarmentSize as _getGarmentSize,
  getGarmentSizeName,
  getSizeOptions
} from './garmentSizes';
import { 
  getPriority as _getPriority,
  getPriorityName,
  getPriorityOptions
} from './priorities';
import { 
  getShift as _getShift,
  getShiftName,
  getShiftOptions
} from './shifts';

// Machine Types
export {
  MACHINE_TYPES,
  getMachineTypeIcon,
  getMachineTypeName,
  getAllMachineTypes,
  getMachineTypeOptions
} from './machineTypes';

// Work Statuses
export {
  WORK_STATUSES,
  getWorkStatus,
  getWorkStatusName,
  getAllWorkStatuses,
  getWorkStatusOptions
} from './workStatuses';

// User Roles
export {
  USER_ROLES,
  getUserRole,
  getUserRoleName,
  hasPermission,
  getAllUserRoles,
  getUserRoleOptions
} from './userRoles';

// Skill Levels
export {
  SKILL_LEVELS,
  getSkillLevel,
  getSkillLevelName,
  getSkillMultiplier,
  getTargetEfficiency,
  getAllSkillLevels,
  getSkillLevelOptions
} from './skillLevels';

// Garment Sizes
export {
  GARMENT_SIZES,
  KIDS_SIZES,
  getGarmentSize,
  getGarmentSizeName,
  getAllAdultSizes,
  getAllKidsSizes,
  getAllSizes,
  getSizeOptions
} from './garmentSizes';

// Priorities
export {
  PRIORITIES,
  getPriority,
  getPriorityName,
  getPriorityLevel,
  isHigherPriority,
  getAllPriorities,
  getPriorityOptions,
  getPriorityClasses
} from './priorities';

// Shifts
export {
  SHIFTS,
  getShift,
  getShiftName,
  getShiftTimeRange,
  isCurrentShift,
  getCurrentShift,
  getAllShifts,
  getShiftOptions
} from './shifts';

// App Constants
export {
  API_CONFIG,
  CACHE_CONFIG,
  NOTIFICATION_TYPES,
  QUEUE_CONFIG,
  ASSIGNMENT_TYPES,
  WORKFLOW_TYPES,
  INSERTION_POINTS,
  MOCK_DATA,
  FILTER_OPTIONS,
  SORT_OPTIONS,
  COLLECTIONS,
  RT_PATHS,
  COMPONENT_STATES,
  MODAL_TYPES,
  THEME,
  LANGUAGES,
  DATE_FORMATS,
  FILE_TYPES,
  VALIDATION_RULES
} from './appConstants';

// Common utility function to get any constant by type and id
export const getConstant = (type, id) => {
  const getters = {
    'machine': _getMachineTypeIcon,
    'status': _getWorkStatus,
    'role': _getUserRole,
    'skill': _getSkillLevel,
    'size': _getGarmentSize,
    'priority': _getPriority,
    'shift': _getShift
  };
  
  const getter = getters[type];
  return getter ? getter(id) : null;
};

// Get display name for any constant
export const getConstantName = (type, id, language = 'en') => {
  const getters = {
    'machine': getMachineTypeName,
    'status': getWorkStatusName,
    'role': getUserRoleName,
    'skill': getSkillLevelName,
    'size': getGarmentSizeName,
    'priority': getPriorityName,
    'shift': getShiftName
  };
  
  const getter = getters[type];
  return getter ? getter(id, language) : id || 'Unknown';
};

// Get all options for any constant type
export const getConstantOptions = (type, language = 'en') => {
  const getters = {
    'machine': getMachineTypeOptions,
    'status': getWorkStatusOptions,
    'role': getUserRoleOptions,
    'skill': getSkillLevelOptions,
    'size': getSizeOptions,
    'priority': getPriorityOptions,
    'shift': getShiftOptions
  };
  
  const getter = getters[type];
  return getter ? getter(language) : [];
};