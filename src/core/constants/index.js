// Core Constants - Centralized constant definitions
// This file serves as the single source of truth for all application constants

// ==================== APPLICATION CONFIG ====================
export const APP_CONFIG = {
  NAME: 'Garment ERP',
  VERSION: '2.0.0',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  BUILD_DATE: new Date().toISOString(),
  COMPANY: 'Garment Manufacturing',
  SUPPORT_EMAIL: 'support@garment-erp.com',
  DOCUMENTATION_URL: 'https://docs.garment-erp.com'
};

// ==================== USER ROLES & PERMISSIONS ====================
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGEMENT: 'management', 
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor',
  QUALITY_CONTROLLER: 'quality-controller',
  OPERATOR: 'operator',
  GUEST: 'guest'
};

export const ROLE_HIERARCHY = {
  [USER_ROLES.ADMIN]: 10,
  [USER_ROLES.MANAGEMENT]: 9,
  [USER_ROLES.MANAGER]: 8,
  [USER_ROLES.SUPERVISOR]: 6,
  [USER_ROLES.QUALITY_CONTROLLER]: 5,
  [USER_ROLES.OPERATOR]: 3,
  [USER_ROLES.GUEST]: 1
};

export const PERMISSIONS = {
  // System Administration
  SYSTEM_ADMIN: 'system_admin',
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  SYSTEM_SETTINGS: 'system_settings',
  
  // Work Management
  ASSIGN_WORK: 'assign_work',
  VIEW_ALL_WORK: 'view_all_work',
  MANAGE_WORKFLOWS: 'manage_workflows',
  APPROVE_WORK: 'approve_work',
  
  // Quality Control
  QUALITY_CHECK: 'quality_check',
  REJECT_WORK: 'reject_work',
  QUALITY_REPORTS: 'quality_reports',
  
  // Analytics & Reports
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_REPORTS: 'export_reports',
  FINANCIAL_REPORTS: 'financial_reports',
  
  // Operator Functions
  SELF_ASSIGN: 'self_assign',
  COMPLETE_WORK: 'complete_work',
  VIEW_OWN_WORK: 'view_own_work',
  
  // Management Functions
  PAYROLL_ACCESS: 'payroll_access',
  LOCATION_MANAGEMENT: 'location_management',
  MACHINE_MANAGEMENT: 'machine_management'
};

// ==================== WORK STATUSES ====================
export const WORK_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  QUALITY_CHECK: 'quality_check',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REWORK: 'rework',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled',
  SELF_ASSIGNED: 'self_assigned',
  OPERATOR_COMPLETED: 'operator_completed'
};

export const WORK_STATUS_CONFIG = {
  [WORK_STATUS.PENDING]: {
    label: 'Pending',
    labelNp: 'पेन्डिङ',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: '⏳'
  },
  [WORK_STATUS.ASSIGNED]: {
    label: 'Assigned',
    labelNp: 'तोकिएको',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: '📋'
  },
  [WORK_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    labelNp: 'जारी',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    icon: '⚡'
  },
  [WORK_STATUS.COMPLETED]: {
    label: 'Completed',
    labelNp: 'सम्पन्न',
    color: 'green',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    icon: '✅'
  },
  [WORK_STATUS.QUALITY_CHECK]: {
    label: 'Quality Check',
    labelNp: 'गुणस्तर जाँच',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    icon: '🔍'
  },
  [WORK_STATUS.REJECTED]: {
    label: 'Rejected',
    labelNp: 'अस्वीकार',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: '❌'
  }
};

// ==================== MACHINE TYPES ====================
export const MACHINE_TYPES = {
  SINGLE_NEEDLE: 'single-needle',
  OVERLOCK: 'overlock',
  COVERSTITCH: 'coverstitch',
  FLATSEAM: 'flatseam',
  BUTTONHOLE: 'buttonhole',
  BARTACK: 'bartack',
  BLIND_STITCH: 'blind-stitch',
  ZIGZAG: 'zigzag',
  CHAIN_STITCH: 'chain-stitch',
  CUTTING: 'cutting',
  PRESSING: 'pressing',
  FINISHING: 'finishing'
};

export const MACHINE_CONFIG = {
  [MACHINE_TYPES.SINGLE_NEEDLE]: {
    name: 'Single Needle',
    nameNp: 'एकल सुई',
    icon: '🪡',
    category: 'sewing',
    skillLevel: 'basic'
  },
  [MACHINE_TYPES.OVERLOCK]: {
    name: 'Overlock',
    nameNp: 'ओभरलक',
    icon: '✂️',
    category: 'sewing',
    skillLevel: 'intermediate'
  },
  [MACHINE_TYPES.CUTTING]: {
    name: 'Cutting',
    nameNp: 'काट्ने',
    icon: '✂️',
    category: 'cutting',
    skillLevel: 'advanced'
  }
};

// ==================== GARMENT SIZES ====================
export const GARMENT_SIZES = {
  XS: 'xs',
  S: 's',
  M: 'm', 
  L: 'l',
  XL: 'xl',
  XXL: 'xxl',
  XXXL: 'xxxl'
};

export const SIZE_CONFIG = {
  [GARMENT_SIZES.XS]: { label: 'XS', order: 1 },
  [GARMENT_SIZES.S]: { label: 'S', order: 2 },
  [GARMENT_SIZES.M]: { label: 'M', order: 3 },
  [GARMENT_SIZES.L]: { label: 'L', order: 4 },
  [GARMENT_SIZES.XL]: { label: 'XL', order: 5 },
  [GARMENT_SIZES.XXL]: { label: 'XXL', order: 6 },
  [GARMENT_SIZES.XXXL]: { label: 'XXXL', order: 7 }
};

// ==================== PRIORITY LEVELS ====================
export const PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
  CRITICAL: 'critical'
};

export const PRIORITY_CONFIG = {
  [PRIORITY.LOW]: {
    label: 'Low',
    labelNp: 'न्यून',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    value: 1
  },
  [PRIORITY.NORMAL]: {
    label: 'Normal',
    labelNp: 'सामान्य',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    value: 2
  },
  [PRIORITY.HIGH]: {
    label: 'High',
    labelNp: 'उच्च',
    color: 'yellow',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    value: 3
  },
  [PRIORITY.URGENT]: {
    label: 'Urgent',
    labelNp: 'तत्काल',
    color: 'orange',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    value: 4
  },
  [PRIORITY.CRITICAL]: {
    label: 'Critical',
    labelNp: 'अत्यावश्यक',
    color: 'red',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    value: 5
  }
};

// ==================== SHIFTS ====================
export const SHIFTS = {
  MORNING: 'morning',
  DAY: 'day',
  EVENING: 'evening',
  NIGHT: 'night',
  OVERTIME: 'overtime'
};

export const SHIFT_CONFIG = {
  [SHIFTS.MORNING]: {
    name: 'Morning',
    nameNp: 'बिहान',
    startTime: '06:00',
    endTime: '14:00',
    icon: '🌅'
  },
  [SHIFTS.DAY]: {
    name: 'Day',
    nameNp: 'दिन',
    startTime: '08:00', 
    endTime: '16:00',
    icon: '☀️'
  },
  [SHIFTS.EVENING]: {
    name: 'Evening',
    nameNp: 'साँझ',
    startTime: '16:00',
    endTime: '00:00',
    icon: '🌆'
  },
  [SHIFTS.NIGHT]: {
    name: 'Night',
    nameNp: 'रात',
    startTime: '22:00',
    endTime: '06:00',
    icon: '🌙'
  }
};

// ==================== SKILL LEVELS ====================
export const SKILL_LEVELS = {
  TRAINEE: 'trainee',
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
  MASTER: 'master'
};

export const SKILL_CONFIG = {
  [SKILL_LEVELS.TRAINEE]: {
    label: 'Trainee',
    labelNp: 'तालिमार्थी',
    level: 1,
    color: 'gray'
  },
  [SKILL_LEVELS.BEGINNER]: {
    label: 'Beginner',
    labelNp: 'सुरुवातकर्ता',
    level: 2,
    color: 'green'
  },
  [SKILL_LEVELS.INTERMEDIATE]: {
    label: 'Intermediate',
    labelNp: 'मध्यम',
    level: 3,
    color: 'blue'
  },
  [SKILL_LEVELS.ADVANCED]: {
    label: 'Advanced',
    labelNp: 'उन्नत',
    level: 4,
    color: 'purple'
  },
  [SKILL_LEVELS.EXPERT]: {
    label: 'Expert',
    labelNp: 'विशेषज्ञ',
    level: 5,
    color: 'orange'
  },
  [SKILL_LEVELS.MASTER]: {
    label: 'Master',
    labelNp: 'निपुण',
    level: 6,
    color: 'red'
  }
};

// ==================== NOTIFICATION TYPES ====================
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  WORK_ASSIGNED: 'work_assigned',
  WORK_COMPLETED: 'work_completed',
  QUALITY_ISSUE: 'quality_issue',
  SYSTEM_UPDATE: 'system_update',
  MAINTENANCE: 'maintenance'
};

// ==================== API ENDPOINTS ====================
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile'
  },
  
  // Users
  USERS: {
    BASE: '/users',
    PROFILE: '/users/profile',
    ROLES: '/users/roles',
    PERMISSIONS: '/users/permissions'
  },
  
  // Work Management
  WORK: {
    ITEMS: '/work/items',
    ASSIGNMENTS: '/work/assignments',
    BUNDLES: '/work/bundles',
    HISTORY: '/work/history'
  },
  
  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    REPORTS: '/analytics/reports',
    EXPORTS: '/analytics/exports'
  }
};

// ==================== STORAGE KEYS ====================
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  USER_PREFERENCES: 'user_preferences',
  LANGUAGE: 'selected_language',
  THEME: 'selected_theme',
  CACHE_TIMESTAMP: 'cache_timestamp',
  LAST_SYNC: 'last_sync'
};

// ==================== ERROR CODES ====================
export const ERROR_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  
  // Custom error codes
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED'
};

// ==================== UI CONSTANTS ====================
export const UI_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000,
  LOADING_TIMEOUT: 30000,
  PAGINATION_SIZE: 20,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  
  // Breakpoints (matches Tailwind)
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536
  }
};

// ==================== ANIMATION DURATIONS ====================
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  EXTRA_SLOW: 1000
};

// ==================== VALIDATION RULES ====================
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]{7,}$/,
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500
};

// ==================== FIREBASE COLLECTIONS ====================
export const COLLECTIONS = {
  USERS: 'users',
  OPERATORS: 'operators',
  SUPERVISORS: 'supervisors',
  MANAGEMENT: 'management',
  WORK_ITEMS: 'workItems',
  BUNDLES: 'bundles',
  ASSIGNMENTS: 'assignments',
  QUALITY_ISSUES: 'quality_issues',
  NOTIFICATIONS: 'notifications',
  ANALYTICS: 'analytics',
  SYSTEM_LOGS: 'system_logs',
  WIP_ENTRIES: 'wipEntries',
  WIP_ROLLS: 'wipRolls'
};

// ==================== FEATURE FLAGS ====================
export const FEATURES = {
  SELF_ASSIGNMENT: 'self_assignment',
  QUALITY_CONTROL: 'quality_control',
  ANALYTICS_DASHBOARD: 'analytics_dashboard',
  MOBILE_APP: 'mobile_app',
  OFFLINE_MODE: 'offline_mode',
  REAL_TIME_UPDATES: 'real_time_updates',
  MULTI_LANGUAGE: 'multi_language',
  DARK_MODE: 'dark_mode',
  ADVANCED_REPORTING: 'advanced_reporting',
  API_ACCESS: 'api_access'
};

// ==================== DEFAULT VALUES ====================
export const DEFAULTS = {
  LANGUAGE: 'en',
  THEME: 'light',
  CURRENCY: 'NPR',
  TIMEZONE: 'Asia/Kathmandu',
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:mm',
  PAGINATION_SIZE: 20,
  CACHE_TTL: 300000, // 5 minutes
  SESSION_TIMEOUT: 3600000 // 1 hour
};

// ==================== EXPORT ALL ====================
export default {
  APP_CONFIG,
  USER_ROLES,
  ROLE_HIERARCHY,
  PERMISSIONS,
  WORK_STATUS,
  WORK_STATUS_CONFIG,
  MACHINE_TYPES,
  MACHINE_CONFIG,
  GARMENT_SIZES,
  SIZE_CONFIG,
  PRIORITY,
  PRIORITY_CONFIG,
  SHIFTS,
  SHIFT_CONFIG,
  SKILL_LEVELS,
  SKILL_CONFIG,
  NOTIFICATION_TYPES,
  API_ENDPOINTS,
  STORAGE_KEYS,
  ERROR_CODES,
  UI_CONSTANTS,
  ANIMATION,
  VALIDATION,
  COLLECTIONS,
  FEATURES,
  DEFAULTS
};