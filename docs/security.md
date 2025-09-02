# Garment ERP PWA - Security Documentation

## Overview
This document outlines the comprehensive security measures, policies, and procedures implemented in the Garment ERP PWA system to protect data, ensure privacy, and maintain system integrity.

## Security Architecture

### Multi-Layer Security Model
```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT SECURITY                          │
├─────────────────────────────────────────────────────────────┤
│ • HTTPS/TLS Encryption    • CSP Headers                    │
│ • Input Validation        • XSS Protection                 │
│ • Authentication Tokens   • Session Management             │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                 APPLICATION SECURITY                        │
├─────────────────────────────────────────────────────────────┤
│ • Role-Based Access Control (RBAC)                         │
│ • Permission Validation    • API Rate Limiting             │
│ • Error Handling          • Audit Logging                  │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE SECURITY                          │
├─────────────────────────────────────────────────────────────┤
│ • Firestore Security Rules • Data Encryption               │
│ • Access Control           • Backup Encryption             │
│ • Query Validation         • Network Security              │
└─────────────────────────────────────────────────────────────┘
```

## Authentication & Authorization

### Firebase Authentication
The system uses Firebase Authentication for secure user management.

#### Supported Authentication Methods
- **Email/Password**: Primary authentication method
- **Multi-Factor Authentication (MFA)**: Optional for enhanced security
- **Session Management**: Automatic token refresh and validation

#### Authentication Flow
```javascript
// Authentication implementation
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

const AuthService = {
  // Secure login with validation
  login: async (email, password) => {
    try {
      // Input validation
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      if (!isValidEmail(email)) {
        throw new Error('Invalid email format');
      }
      
      // Attempt authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Get user role and permissions
      const userData = await getUserData(user.uid);
      
      // Log authentication event
      await logSecurityEvent('login_success', {
        userId: user.uid,
        email: user.email,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        ip: await getClientIP()
      });
      
      return {
        success: true,
        user: {
          ...user,
          role: userData.role,
          permissions: userData.permissions
        }
      };
    } catch (error) {
      // Log failed attempt
      await logSecurityEvent('login_failed', {
        email,
        error: error.message,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        ip: await getClientIP()
      });
      
      throw error;
    }
  },
  
  // Secure logout
  logout: async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await logSecurityEvent('logout', {
          userId: user.uid,
          timestamp: new Date()
        });
      }
      
      await signOut(auth);
      
      // Clear sensitive data from memory
      clearAuthenticationData();
      
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }
};
```

### Role-Based Access Control (RBAC)

#### User Roles and Permissions
```javascript
const ROLES = {
  OPERATOR: 'operator',
  SUPERVISOR: 'supervisor', 
  ADMIN: 'admin',
  MANAGEMENT: 'management'
};

const PERMISSIONS = {
  // Work Management
  'work:read': ['operator', 'supervisor', 'admin'],
  'work:create': ['supervisor', 'admin'],
  'work:assign': ['supervisor', 'admin'],
  'work:delete': ['admin'],
  
  // User Management
  'user:read': ['supervisor', 'admin', 'management'],
  'user:create': ['admin'],
  'user:update': ['admin'],
  'user:delete': ['admin'],
  
  // System Configuration
  'system:config': ['admin'],
  'system:backup': ['admin'],
  'system:logs': ['admin'],
  
  // Analytics and Reports
  'analytics:read': ['management', 'admin'],
  'analytics:export': ['management', 'admin'],
  
  // Quality Control
  'quality:read': ['operator', 'supervisor', 'admin'],
  'quality:create': ['operator', 'supervisor', 'admin'],
  'quality:approve': ['supervisor', 'admin'],
  
  // Self Assignment
  'self_assignment:request': ['operator'],
  'self_assignment:approve': ['supervisor', 'admin'],
  'self_assignment:reject': ['supervisor', 'admin']
};

// Permission validation utility
export const hasPermission = (userRole, requiredPermission) => {
  const allowedRoles = PERMISSIONS[requiredPermission];
  return allowedRoles && allowedRoles.includes(userRole);
};

// React hook for permission checking
export const usePermissions = () => {
  const { user } = useAuth();
  
  return {
    hasPermission: (permission) => hasPermission(user?.role, permission),
    
    canAccess: (permissions) => {
      return permissions.some(permission => 
        hasPermission(user?.role, permission)
      );
    },
    
    requirePermission: (permission) => {
      if (!hasPermission(user?.role, permission)) {
        throw new Error(`Permission denied: ${permission}`);
      }
    }
  };
};
```

#### Component-Level Access Control
```javascript
// Higher-order component for access control
export const withPermission = (requiredPermissions, fallbackComponent = null) => {
  return (WrappedComponent) => {
    return (props) => {
      const { hasPermission } = usePermissions();
      const { user } = useAuth();
      
      // Check if user has required permissions
      const hasAccess = requiredPermissions.some(permission => 
        hasPermission(permission)
      );
      
      if (!user) {
        return <LoginRequired />;
      }
      
      if (!hasAccess) {
        return fallbackComponent || <AccessDenied permissions={requiredPermissions} />;
      }
      
      return <WrappedComponent {...props} />;
    };
  };
};

// Usage example
const AdminUserManagement = withPermission(
  ['user:create', 'user:update', 'user:delete'],
  <div>You don't have permission to manage users.</div>
)(UserManagementComponent);
```

## Database Security

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions for security validation
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function getUserRole() {
      return getUserData().role;
    }
    
    function hasRole(role) {
      return getUserRole() == role;
    }
    
    function hasAnyRole(roles) {
      return getUserRole() in roles;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isValidUserData(data) {
      return data.keys().hasAll(['name', 'email', 'role']) &&
             data.role in ['operator', 'supervisor', 'admin', 'management'];
    }
    
    function isValidWorkItem(data) {
      return data.keys().hasAll(['bundleId', 'operatorId', 'operation']) &&
             data.pieces is number &&
             data.pieces > 0;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (
        isOwner(userId) || 
        hasAnyRole(['supervisor', 'admin', 'management'])
      );
      
      allow create: if isAuthenticated() && 
        hasRole('admin') && 
        isValidUserData(request.resource.data);
      
      allow update: if isAuthenticated() && (
        (isOwner(userId) && request.resource.data.role == resource.data.role) ||
        hasRole('admin')
      );
      
      allow delete: if isAuthenticated() && hasRole('admin');
    }
    
    // Work items collection
    match /workItems/{workItemId} {
      allow read: if isAuthenticated();
      
      allow create: if isAuthenticated() && 
        hasAnyRole(['supervisor', 'admin']) &&
        isValidWorkItem(request.resource.data);
      
      allow update: if isAuthenticated() && (
        (resource.data.operatorId == request.auth.uid) ||
        hasAnyRole(['supervisor', 'admin'])
      );
      
      allow delete: if isAuthenticated() && hasAnyRole(['supervisor', 'admin']);
    }
    
    // Bundles collection
    match /bundles/{bundleId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && hasAnyRole(['supervisor', 'admin']);
    }
    
    // Analytics collection - read only for management
    match /analytics/{date} {
      allow read: if isAuthenticated() && hasAnyRole(['management', 'admin']);
      allow write: if false; // Only server-side writes allowed
    }
    
    // Damage reports
    match /damageReports/{reportId} {
      allow read: if isAuthenticated();
      
      allow create: if isAuthenticated() && (
        request.resource.data.operatorId == request.auth.uid ||
        hasAnyRole(['supervisor', 'admin'])
      );
      
      allow update: if isAuthenticated() && (
        resource.data.operatorId == request.auth.uid ||
        hasAnyRole(['supervisor', 'admin'])
      );
    }
    
    // System configuration - admin only
    match /system/{document=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && hasRole('admin');
    }
    
    // Security logs - admin only
    match /securityLogs/{logId} {
      allow read: if isAuthenticated() && hasRole('admin');
      allow write: if false; // Only server writes
    }
    
    // Notifications
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      
      allow update: if isAuthenticated() && 
        resource.data.userId == request.auth.uid &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['isRead']);
    }
  }
}
```

### Data Encryption

#### Encryption at Rest
- **Firebase Firestore**: Automatic encryption of all stored data
- **File Storage**: All uploaded files encrypted using AES-256
- **Backup Data**: Encrypted backups with separate key management

#### Encryption in Transit
- **HTTPS/TLS 1.3**: All client-server communication encrypted
- **Certificate Pinning**: Enhanced protection against man-in-the-middle attacks
- **Perfect Forward Secrecy**: Unique session keys for each connection

```javascript
// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production' && location.protocol !== 'https:') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}

// Content Security Policy headers
const CSP_HEADERS = {
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com",
    "frame-src 'none'",
    "object-src 'none'"
  ].join("; ")
};
```

## Input Validation & Sanitization

### Client-Side Validation
```javascript
// Comprehensive input validation
export const ValidationService = {
  // Email validation
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    return email.trim().toLowerCase();
  },
  
  // Password strength validation
  validatePassword: (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    if (password.length < minLength) {
      throw new Error(`Password must be at least ${minLength} characters long`);
    }
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new Error('Password must contain uppercase, lowercase, numbers, and special characters');
    }
    
    return password;
  },
  
  // Sanitize HTML input
  sanitizeHtml: (input) => {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },
  
  // Validate work item data
  validateWorkItem: (data) => {
    const errors = {};
    
    if (!data.bundleId || typeof data.bundleId !== 'string') {
      errors.bundleId = 'Valid bundle ID is required';
    }
    
    if (!data.operatorId || typeof data.operatorId !== 'string') {
      errors.operatorId = 'Valid operator ID is required';
    }
    
    if (!data.pieces || !Number.isInteger(data.pieces) || data.pieces <= 0) {
      errors.pieces = 'Pieces must be a positive integer';
    }
    
    if (!['low', 'medium', 'high'].includes(data.priority)) {
      errors.priority = 'Priority must be low, medium, or high';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
};
```

### SQL Injection Prevention
While using Firestore (NoSQL), we still implement query parameterization:

```javascript
// Safe query building
const buildSafeQuery = (collection, filters) => {
  let query = collection(db, collectionName);
  
  filters.forEach(filter => {
    // Validate filter parameters
    if (!['==', '!=', '<', '<=', '>', '>=', 'array-contains'].includes(filter.operator)) {
      throw new Error('Invalid query operator');
    }
    
    // Sanitize filter values
    const sanitizedValue = sanitizeQueryValue(filter.value);
    query = query.where(filter.field, filter.operator, sanitizedValue);
  });
  
  return query;
};

const sanitizeQueryValue = (value) => {
  if (typeof value === 'string') {
    // Remove potentially dangerous characters
    return value.replace(/[<>'"]/g, '');
  }
  return value;
};
```

## Session Management

### Secure Session Handling
```javascript
// Session management service
export const SessionService = {
  // Session timeout (30 minutes)
  SESSION_TIMEOUT: 30 * 60 * 1000,
  
  // Initialize session monitoring
  init: () => {
    // Monitor authentication state
    onAuthStateChanged(auth, (user) => {
      if (user) {
        SessionService.startSessionTimer();
        SessionService.trackUserActivity();
      } else {
        SessionService.clearSession();
      }
    });
    
    // Monitor user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, SessionService.resetSessionTimer, true);
    });
  },
  
  // Start session timeout timer
  startSessionTimer: () => {
    SessionService.clearSessionTimer();
    
    SessionService.sessionTimer = setTimeout(() => {
      SessionService.handleSessionTimeout();
    }, SessionService.SESSION_TIMEOUT);
  },
  
  // Reset session timer on user activity
  resetSessionTimer: () => {
    if (auth.currentUser) {
      SessionService.startSessionTimer();
    }
  },
  
  // Clear session timer
  clearSessionTimer: () => {
    if (SessionService.sessionTimer) {
      clearTimeout(SessionService.sessionTimer);
      SessionService.sessionTimer = null;
    }
  },
  
  // Handle session timeout
  handleSessionTimeout: async () => {
    try {
      await logSecurityEvent('session_timeout', {
        userId: auth.currentUser?.uid,
        timestamp: new Date()
      });
      
      await signOut(auth);
      
      // Show timeout message
      showNotification('Session expired. Please log in again.', 'warning');
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error) {
      console.error('Session timeout handling failed:', error);
    }
  },
  
  // Clear all session data
  clearSession: () => {
    SessionService.clearSessionTimer();
    
    // Clear sensitive data
    if (window.sessionStorage) {
      sessionStorage.clear();
    }
    
    // Clear application state
    useAppStore.getState().clearAllData();
  }
};
```

## Security Monitoring & Logging

### Security Event Logging
```javascript
// Security event logging service
export const SecurityLogger = {
  // Log security events
  logEvent: async (eventType, data) => {
    const logEntry = {
      eventType,
      timestamp: new Date().toISOString(),
      userId: auth.currentUser?.uid || 'anonymous',
      sessionId: getSessionId(),
      userAgent: navigator.userAgent,
      ip: await getClientIP(),
      data: data || {},
      severity: getSeverityLevel(eventType)
    };
    
    try {
      // Store in Firestore for analysis
      await addDoc(collection(db, 'securityLogs'), logEntry);
      
      // Send to external monitoring if configured
      if (process.env.REACT_APP_SECURITY_WEBHOOK) {
        await sendToSecurityMonitoring(logEntry);
      }
      
      // Console log in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Security Event:', logEntry);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  },
  
  // Get severity level for event type
  getSeverityLevel: (eventType) => {
    const severityMap = {
      login_success: 'info',
      login_failed: 'warning', 
      logout: 'info',
      permission_denied: 'warning',
      unauthorized_access: 'critical',
      session_timeout: 'info',
      password_change: 'info',
      account_locked: 'critical',
      suspicious_activity: 'high',
      data_export: 'warning',
      admin_action: 'info'
    };
    
    return severityMap[eventType] || 'info';
  }
};

// Security events to monitor
export const SECURITY_EVENTS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed', 
  LOGOUT: 'logout',
  PERMISSION_DENIED: 'permission_denied',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  SESSION_TIMEOUT: 'session_timeout',
  PASSWORD_CHANGE: 'password_change',
  ACCOUNT_LOCKED: 'account_locked',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  DATA_EXPORT: 'data_export',
  ADMIN_ACTION: 'admin_action'
};
```

### Real-time Security Monitoring
```javascript
// Monitor for suspicious activities
export const SecurityMonitor = {
  // Failed login attempt tracking
  failedAttempts: new Map(),
  
  // Track failed login attempts
  trackFailedLogin: (email, ip) => {
    const key = `${email}-${ip}`;
    const attempts = SecurityMonitor.failedAttempts.get(key) || 0;
    SecurityMonitor.failedAttempts.set(key, attempts + 1);
    
    // Lock account after 5 failed attempts
    if (attempts >= 4) {
      SecurityMonitor.lockAccount(email, ip);
    }
  },
  
  // Lock account temporarily
  lockAccount: async (email, ip) => {
    await SecurityLogger.logEvent(SECURITY_EVENTS.ACCOUNT_LOCKED, {
      email,
      ip,
      reason: 'too_many_failed_attempts'
    });
    
    // Implement account lockout logic
    // This would typically involve server-side functionality
  },
  
  // Monitor unusual access patterns
  monitorAccess: (userId, action, resource) => {
    const now = new Date();
    const hour = now.getHours();
    
    // Flag access outside normal hours (6 AM - 10 PM)
    if (hour < 6 || hour > 22) {
      SecurityLogger.logEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
        userId,
        action,
        resource,
        reason: 'access_outside_normal_hours',
        time: now.toISOString()
      });
    }
  }
};
```

## Data Privacy & Protection

### Personal Data Handling
```javascript
// Data privacy compliance
export const PrivacyService = {
  // Classify data sensitivity
  classifyData: (data) => {
    const sensitiveFields = [
      'email', 'phone', 'address', 'nationalId', 
      'bankAccount', 'salary', 'personalNotes'
    ];
    
    const classification = {
      public: {},
      internal: {},
      confidential: {}
    };
    
    Object.keys(data).forEach(key => {
      if (sensitiveFields.includes(key)) {
        classification.confidential[key] = data[key];
      } else if (key.includes('internal') || key.includes('system')) {
        classification.internal[key] = data[key];
      } else {
        classification.public[key] = data[key];
      }
    });
    
    return classification;
  },
  
  // Anonymize personal data
  anonymizeData: (userData) => {
    return {
      ...userData,
      name: '***ANONYMIZED***',
      email: '***ANONYMIZED***',
      phone: '***ANONYMIZED***',
      address: '***ANONYMIZED***'
    };
  },
  
  // Data retention policy
  checkDataRetention: async () => {
    const retentionPeriods = {
      workItems: 7 * 365, // 7 years
      analytics: 5 * 365, // 5 years  
      securityLogs: 1 * 365, // 1 year
      damageReports: 3 * 365 // 3 years
    };
    
    // Implementation would check and archive old data
  }
};
```

### GDPR Compliance
```javascript
// GDPR compliance utilities
export const GDPRService = {
  // Right to access - export user data
  exportUserData: async (userId) => {
    if (!hasPermission(getCurrentUser().role, 'user:export')) {
      throw new Error('Permission denied');
    }
    
    // Log data export
    await SecurityLogger.logEvent(SECURITY_EVENTS.DATA_EXPORT, {
      requestedBy: getCurrentUser().id,
      targetUser: userId
    });
    
    // Collect all user data
    const userData = await getUserAllData(userId);
    
    return {
      exportDate: new Date().toISOString(),
      userData: userData,
      format: 'JSON'
    };
  },
  
  // Right to rectification - update user data
  updateUserData: async (userId, updates) => {
    // Validate permissions
    if (!canUpdateUser(getCurrentUser(), userId)) {
      throw new Error('Permission denied');
    }
    
    // Log data modification
    await SecurityLogger.logEvent('data_modification', {
      userId,
      modifiedBy: getCurrentUser().id,
      fields: Object.keys(updates)
    });
    
    // Update data
    await updateDoc(doc(db, 'users', userId), updates);
  },
  
  // Right to erasure - delete user data
  deleteUserData: async (userId) => {
    if (!hasPermission(getCurrentUser().role, 'user:delete')) {
      throw new Error('Permission denied');
    }
    
    // Log data deletion
    await SecurityLogger.logEvent('data_deletion', {
      userId,
      deletedBy: getCurrentUser().id
    });
    
    // Soft delete - mark as deleted but preserve for compliance
    await updateDoc(doc(db, 'users', userId), {
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: getCurrentUser().id
    });
  }
};
```

## Security Testing & Vulnerability Management

### Security Test Cases
```javascript
// Security test utilities
export const SecurityTestUtils = {
  // Test authentication bypass attempts
  testAuthBypass: async () => {
    const tests = [
      {
        name: 'Access protected route without authentication',
        test: () => {
          // Simulate unauthenticated request
          return fetch('/api/admin/users');
        },
        expectError: true
      },
      {
        name: 'Access resource with insufficient permissions',
        test: () => {
          // Test operator accessing admin functions
          return callAdminFunction();
        },
        expectError: true
      }
    ];
    
    return await runSecurityTests(tests);
  },
  
  // Test input validation
  testInputValidation: () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      "'; DROP TABLE users; --",
      '../../../etc/passwd',
      '{{constructor.constructor("return process")()}}',
      '<img src=x onerror=alert(1)>'
    ];
    
    return maliciousInputs.map(input => {
      try {
        ValidationService.sanitizeHtml(input);
        return { input, safe: true };
      } catch (error) {
        return { input, safe: false, error: error.message };
      }
    });
  }
};
```

### Vulnerability Scanning
```bash
# Regular security audits
npm audit --audit-level moderate
npm audit fix

# Dependency vulnerability scanning
npx audit-ci --moderate

# OWASP dependency check
dependency-check --project "Garment ERP" --scan ./
```

## Incident Response Plan

### Security Incident Categories
- **Critical**: Data breach, system compromise
- **High**: Unauthorized access, privilege escalation  
- **Medium**: Suspicious activity, failed intrusion attempts
- **Low**: Policy violations, minor security events

### Incident Response Procedure
1. **Detection & Analysis**
   - Monitor security logs and alerts
   - Assess incident severity and impact
   - Document initial findings

2. **Containment**
   - Isolate affected systems
   - Prevent further damage
   - Preserve evidence

3. **Eradication**
   - Remove threat source
   - Fix vulnerabilities
   - Update security controls

4. **Recovery**
   - Restore systems safely
   - Verify system integrity
   - Resume normal operations

5. **Post-Incident**
   - Document lessons learned
   - Update security policies
   - Conduct training if needed

### Emergency Contacts
```javascript
const SECURITY_CONTACTS = {
  securityTeam: 'security@company.com',
  emergencyPhone: '+977-1-SECURITY',
  incidentReporting: 'incidents@company.com',
  externalSupport: 'firebase-support@google.com'
};
```

## Security Maintenance

### Regular Security Tasks
- [ ] **Weekly**: Review security logs and alerts
- [ ] **Monthly**: Update dependencies and security patches
- [ ] **Quarterly**: Conduct vulnerability assessments
- [ ] **Annually**: Complete security audit and penetration testing

### Security Checklist for Deployments
- [ ] All dependencies updated and vulnerability-free
- [ ] Security rules tested and validated
- [ ] HTTPS/TLS certificates valid
- [ ] Environment variables secured
- [ ] Backup and recovery tested
- [ ] Monitoring and alerting configured
- [ ] Access controls verified
- [ ] Security documentation updated

This comprehensive security documentation ensures the Garment ERP PWA maintains the highest standards of data protection, user privacy, and system security.