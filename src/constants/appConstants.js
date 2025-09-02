// src/constants/appConstants.js
// Additional application constants not covered by domain-specific constants

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  BASE_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Cache Configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
  USER_DATA_TTL: 30 * 60 * 1000, // 30 minutes
  STATIC_DATA_TTL: 24 * 60 * 60 * 1000, // 24 hours
  KEYS: {
    USER_PREFERENCES: 'user_preferences',
    WORK_ASSIGNMENTS: 'work_assignments',
    MACHINE_STATUS: 'machine_status',
    OPERATION_TYPES: 'operation_types'
  }
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  WORKFLOW: 'workflow',
  MACHINE_GROUP: 'machine_group'
};

// Queue and Processing Constants
export const QUEUE_CONFIG = {
  MAX_PROCESSING_TIME: 10000, // 10 seconds
  CLEANUP_INTERVAL: 30000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
  PRIORITIES: {
    URGENT: 1,
    HIGH: 2,
    NORMAL: 3,
    LOW: 4,
    BACKGROUND: 5
  }
};

// Work Assignment Constants
export const ASSIGNMENT_TYPES = {
  SELF_ASSIGNED: 'self_assigned',
  SUPERVISOR_ASSIGNED: 'supervisor_assigned',
  QUEUE_ASSIGNED: 'queue_assigned',
  BATCH_ASSIGNED: 'batch_assigned'
};

// Workflow Types
export const WORKFLOW_TYPES = {
  SEQUENTIAL: 'sequential',
  PARALLEL: 'parallel',
  CONDITIONAL: 'conditional',
  LOOP: 'loop'
};

// Insertion Points for Operations
export const INSERTION_POINTS = {
  PARALLEL: 'parallel',
  AFTER_CURRENT: 'after_current',
  BEFORE_NEXT: 'before_next',
  AT_END: 'at_end',
  AT_BEGINNING: 'at_beginning'
};

// Mock Data Constants
export const MOCK_DATA = {
  OPERATION_TYPES: [
    { id: 'overlock', english: 'Overlock Stitching', nepali: 'ओभरलक सिलाई', machine: 'Overlock' },
    { id: 'flatlock', english: 'Flatlock Stitching', nepali: 'फ्ल्याटलक सिलाई', machine: 'Flatlock' },
    { id: 'singleNeedle', english: 'Single Needle', nepali: 'एकल सुई', machine: 'Single Needle' },
    { id: 'buttonhole', english: 'Buttonhole', nepali: 'बटनहोल', machine: 'Buttonhole' }
  ]
};

// Filter Options
export const FILTER_OPTIONS = {
  MACHINE_TYPE: 'machineType',
  PRIORITY: 'priority',
  ARTICLE_TYPE: 'articleType',
  STATUS: 'status',
  DATE_RANGE: 'dateRange',
  OPERATOR: 'operator'
};

// Sort Options
export const SORT_OPTIONS = {
  DATE_ASC: 'date_asc',
  DATE_DESC: 'date_desc',
  PRIORITY_ASC: 'priority_asc',
  PRIORITY_DESC: 'priority_desc',
  NAME_ASC: 'name_asc',
  NAME_DESC: 'name_desc',
  STATUS_ASC: 'status_asc',
  STATUS_DESC: 'status_desc'
};

// Firebase Collection Names (centralized)
export const COLLECTIONS = {
  USERS: 'users',
  WORK_ITEMS: 'workItems',
  BUNDLES: 'bundles',
  WIP: 'wip',
  OPERATIONS: 'operations',
  MACHINES: 'machines',
  ACTIVITY_LOGS: 'activityLogs',
  NOTIFICATIONS: 'notifications',
  DAMAGE_REPORTS: 'damageReports',
  OPERATION_TYPES: 'operationTypes',
  ASSIGNMENTS: 'assignments',
  QUEUE: 'queue',
  LOCATIONS: 'locations'
};

// Realtime Database Paths
export const RT_PATHS = {
  USERS_ONLINE: 'users_online',
  WORK_ASSIGNMENTS: 'work_assignments',
  MACHINE_STATUS: 'machine_status',
  NOTIFICATIONS: 'notifications',
  ASSIGNMENT_QUEUE: 'assignment_queue',
  LIVE_UPDATES: 'live_updates'
};

// Component States
export const COMPONENT_STATES = {
  LOADING: 'loading',
  LOADED: 'loaded',
  ERROR: 'error',
  EMPTY: 'empty',
  SUBMITTING: 'submitting'
};

// Modal Types
export const MODAL_TYPES = {
  CONFIRM: 'confirm',
  ALERT: 'alert',
  FORM: 'form',
  PREVIEW: 'preview',
  WORKFLOW: 'workflow'
};

// Theme Constants
export const THEME = {
  COLORS: {
    PRIMARY: 'blue',
    SECONDARY: 'gray',
    SUCCESS: 'green',
    WARNING: 'yellow',
    ERROR: 'red',
    INFO: 'blue'
  },
  SIZES: {
    XS: 'xs',
    SM: 'sm',
    MD: 'md',
    LG: 'lg',
    XL: 'xl'
  }
};

// Language Constants
export const LANGUAGES = {
  ENGLISH: 'en',
  NEPALI: 'np'
};

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MM/dd/yyyy',
  LONG: 'MMMM do, yyyy',
  WITH_TIME: 'MM/dd/yyyy HH:mm',
  ISO: 'yyyy-MM-dd',
  DISPLAY: 'MMM dd, yyyy'
};

// File Types
export const FILE_TYPES = {
  IMAGE: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  DOCUMENT: ['pdf', 'doc', 'docx', 'txt'],
  SPREADSHEET: ['xls', 'xlsx', 'csv'],
  ARCHIVE: ['zip', 'rar', '7z']
};

// Validation Rules
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_UPLOAD_FILES: 10,
  PHONE_REGEX: /^\+?[\d\s\-\(\)]{7,}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

// Export all constants as a single object
export default {
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
};