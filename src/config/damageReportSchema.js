// src/config/damageReportSchema.js
// Database schema and Firestore setup for damage reporting system

export const DAMAGE_REPORT_COLLECTION = 'damage_reports';

// Firestore document structure for damage reports
export const DAMAGE_REPORT_SCHEMA = {
  // Document ID: auto-generated or custom format like "DR_YYYYMMDD_HHMMSS_BUNDLEID"
  
  // Basic identification
  reportId: 'string',                    // Unique identifier e.g., "DR_20250130_143025_B001"
  bundleId: 'string',                    // Reference to bundle
  bundleNumber: 'string',                // Human-readable bundle number
  workItemId: 'string',                  // Reference to work item if exists
  
  // Operator information
  operatorId: 'string',                  // Operator who reported damage
  operatorName: 'string',                // Operator display name
  operatorStation: 'string',             // Machine/station where damage found
  
  // Supervisor information  
  supervisorId: 'string',                // Assigned supervisor
  supervisorName: 'string',              // Supervisor display name
  
  // Damage details
  damageType: 'string',                  // From damageTypesConfig.js
  damageCategory: 'string',              // Category of damage
  pieceNumbers: 'array',                 // Array of affected piece numbers [15, 16]
  pieceCount: 'number',                  // Total pieces affected
  severity: 'string',                    // minor, major, severe
  urgency: 'string',                     // low, normal, high, urgent
  description: 'string',                 // Operator's description
  
  // Status tracking
  status: 'string',                      // See DAMAGE_STATUS enum
  currentStep: 'string',                 // Current workflow step
  
  // Timestamps
  reportedAt: 'timestamp',               // When damage was reported
  acknowledgedAt: 'timestamp',           // When supervisor acknowledged
  reworkStartedAt: 'timestamp',          // When rework began
  reworkCompletedAt: 'timestamp',        // When rework finished
  returnedToOperatorAt: 'timestamp',     // When returned to operator
  finalCompletionAt: 'timestamp',        // When operator completed final work
  
  // Rework details
  reworkDetails: {
    supervisorNotes: 'string',           // Supervisor's notes about rework
    partsReplaced: 'array',              // List of parts/materials replaced
    toolsUsed: 'array',                  // Tools used for rework
    timeSpentMinutes: 'number',          // Time spent on rework
    qualityCheckPassed: 'boolean',       // Quality check result
    photos: 'array',                     // Photo URLs if any
    costEstimate: 'number',              // Estimated cost of rework
  },
  
  // Payment implications
  paymentImpact: {
    operatorAtFault: 'boolean',          // Whether operator is at fault
    paymentAdjustment: 'number',         // Adjustment to operator payment (+ or -)
    adjustmentReason: 'string',          // Reason for payment adjustment
    supervisorCompensation: 'number',    // Compensation for supervisor time
  },
  
  // Analytics and tracking
  metadata: {
    articleNumber: 'string',             // For analytics
    operation: 'string',                 // Operation where damage occurred
    machineType: 'string',               // Type of machine used
    shift: 'string',                     // Shift when damage occurred
    lineNumber: 'string',                // Production line
    lotNumber: 'string',                 // Lot number for tracking
    color: 'string',                     // Garment color
    size: 'string',                      // Garment size
    fabricType: 'string',                // Type of fabric
    weatherConditions: 'string',         // If relevant (humidity, etc.)
  },
  
  // System tracking
  systemInfo: {
    createdAt: 'timestamp',              // Document creation
    updatedAt: 'timestamp',              // Last update
    version: 'number',                   // Schema version
    source: 'string',                    // web, mobile, api
    ipAddress: 'string',                 // For audit trail
    userAgent: 'string',                 // Browser/app info
  }
};

// Enum for damage report statuses
export const DAMAGE_STATUS = {
  REPORTED: 'reported_to_supervisor',    // Initial report submitted
  ACKNOWLEDGED: 'acknowledged',          // Supervisor has seen report
  IN_QUEUE: 'in_supervisor_queue',      // Waiting for rework
  REWORK_STARTED: 'rework_in_progress', // Supervisor working on fix
  REWORK_COMPLETED: 'rework_completed', // Fix complete, quality checked
  RETURNED: 'returned_to_operator',     // Piece returned to operator
  FINAL_COMPLETION: 'final_completed',  // Operator finished remaining work
  CLOSED: 'closed',                     // Report closed and paid
  ESCALATED: 'escalated',               // Escalated to management
  CANCELLED: 'cancelled'                // Report cancelled/invalid
};

// Firestore collection structure
export const FIRESTORE_COLLECTIONS = {
  DAMAGE_REPORTS: 'damage_reports',
  DAMAGE_ANALYTICS: 'damage_analytics',
  DAMAGE_NOTIFICATIONS: 'damage_notifications',
  DAMAGE_SETTINGS: 'damage_settings'
};

// Firestore indexes needed (for firestore.indexes.json)
export const REQUIRED_FIRESTORE_INDEXES = [
  {
    collectionGroup: "damage_reports",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "supervisorId", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "reportedAt", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "damage_reports", 
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "operatorId", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "reportedAt", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "damage_reports",
    queryScope: "COLLECTION", 
    fields: [
      { fieldPath: "damageCategory", order: "ASCENDING" },
      { fieldPath: "reportedAt", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "damage_reports",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "urgency", order: "ASCENDING" },
      { fieldPath: "status", order: "ASCENDING" },
      { fieldPath: "reportedAt", order: "ASCENDING" }
    ]
  }
];

// Validation schema for damage reports
export const validateDamageReport = (reportData) => {
  const errors = [];
  const warnings = [];
  
  // Required fields validation
  const requiredFields = [
    'bundleId', 'bundleNumber', 'operatorId', 'operatorName',
    'damageType', 'pieceNumbers', 'urgency', 'supervisorId'
  ];
  
  requiredFields.forEach(field => {
    if (!reportData[field] || reportData[field] === '') {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Piece count validation
  if (reportData.pieceNumbers && reportData.pieceNumbers.length === 0) {
    errors.push('At least one piece number must be specified');
  }
  
  if (reportData.pieceNumbers && reportData.pieceNumbers.length > 5) {
    warnings.push('More than 5 pieces reported - consider splitting into multiple reports');
  }
  
  // Status validation
  if (reportData.status && !Object.values(DAMAGE_STATUS).includes(reportData.status)) {
    errors.push(`Invalid status: ${reportData.status}`);
  }
  
  // Timestamp validation
  if (reportData.reportedAt && reportData.reportedAt > new Date()) {
    errors.push('Reported timestamp cannot be in the future');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Helper function to create a new damage report
export const createDamageReportDocument = (reportData) => {
  const timestamp = new Date();
  
  return {
    reportId: generateReportId(reportData.bundleId, timestamp),
    ...reportData,
    status: DAMAGE_STATUS.REPORTED,
    currentStep: 'reported',
    reportedAt: timestamp,
    
    // Initialize empty rework details
    reworkDetails: {
      supervisorNotes: '',
      partsReplaced: [],
      toolsUsed: [],
      timeSpentMinutes: 0,
      qualityCheckPassed: false,
      photos: [],
      costEstimate: 0,
    },
    
    // Initialize payment impact
    paymentImpact: {
      operatorAtFault: false, // Default to not operator fault
      paymentAdjustment: 0,
      adjustmentReason: '',
      supervisorCompensation: 0,
    },
    
    // System info
    systemInfo: {
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1,
      source: 'web',
      ipAddress: null,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    }
  };
};

// Generate unique report ID
export const generateReportId = (bundleId, timestamp = new Date()) => {
  const dateStr = timestamp.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
  const timeStr = timestamp.toTimeString().slice(0, 8).replace(/:/g, ''); // HHMMSS
  const bundleShort = bundleId.slice(-8); // Last 8 chars of bundle ID
  
  return `DR_${dateStr}_${timeStr}_${bundleShort}`;
};

// Analytics aggregation schema
export const DAMAGE_ANALYTICS_SCHEMA = {
  // Document ID: date (YYYY-MM-DD) or operator_YYYY-MM-DD
  
  date: 'string',                        // Date in YYYY-MM-DD format
  
  // Daily aggregations
  totalReports: 'number',                // Total damage reports
  reportsByCategory: 'map',              // Category -> count
  reportsByOperator: 'map',              // OperatorId -> count
  reportsBySeverity: 'map',              // Severity -> count
  reportsByUrgency: 'map',               // Urgency -> count
  
  // Resolution metrics
  averageResolutionTime: 'number',       // Average time to resolve (hours)
  resolutionTimeByCategory: 'map',       // Category -> avg resolution time
  
  // Cost implications
  totalReworkCost: 'number',             // Total estimated rework costs
  totalPaymentAdjustments: 'number',     // Total payment adjustments
  
  // Quality metrics
  operatorFaultRate: 'number',           // Percentage of operator-fault damages
  mostCommonDamageTypes: 'array',        // Top 5 damage types
  
  lastUpdated: 'timestamp'
};

// Notification schema for real-time updates
export const DAMAGE_NOTIFICATION_SCHEMA = {
  // Document ID: auto-generated
  
  notificationId: 'string',              // Unique ID
  recipientId: 'string',                 // User who should receive notification
  recipientRole: 'string',               // operator, supervisor, manager
  
  type: 'string',                        // notification type
  title: 'string',                       // Notification title
  message: 'string',                     // Notification body
  
  damageReportId: 'string',              // Related damage report
  bundleNumber: 'string',                // For quick reference
  operatorName: 'string',                // For display
  
  priority: 'string',                    // low, normal, high, urgent
  read: 'boolean',                       // Whether notification has been read
  
  createdAt: 'timestamp',
  readAt: 'timestamp',
  expiresAt: 'timestamp'                 // Auto-delete after this time
};

const schema = {
  DAMAGE_REPORT_SCHEMA,
  DAMAGE_STATUS,
  FIRESTORE_COLLECTIONS,
  REQUIRED_FIRESTORE_INDEXES,
  validateDamageReport,
  createDamageReportDocument,
  generateReportId
};

export default schema;