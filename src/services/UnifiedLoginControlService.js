// Unified Login Control Service
// Merges Location and Time-based Login Controls into one system
// Location system is currently DEACTIVATED as requested

import { db, collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc } from '../config/firebase';

class UnifiedLoginControlService {
  constructor() {
    // Master control settings
    this.settings = {
      // System-wide controls
      systemControl: {
        maintenanceMode: {
          enabled: false,
          allowedRoles: ['management', 'supervisor'],
          message: 'System maintenance in progress. Please try again later.',
          scheduledStart: null,
          scheduledEnd: null
        },
        emergencyAccess: {
          enabled: false,
          reason: '',
          validUntil: null,
          allowedRoles: ['operator', 'supervisor'],
          enabledBy: null,
          enabledAt: null
        }
      },

      // Time-based controls
      timeControl: {
        enabled: false, // Currently disabled
        workingHours: {
          start: '08:00', // 8:00 AM
          end: '18:00',   // 6:00 PM
        },
        workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
        allowedShifts: [
          {
            id: 'morning',
            name: 'Morning Shift',
            start: '08:00',
            end: '16:00',
            active: true
          },
          {
            id: 'evening', 
            name: 'Evening Shift',
            start: '16:00',
            end: '00:00',
            active: true
          },
          {
            id: 'night',
            name: 'Night Shift', 
            start: '00:00',
            end: '08:00',
            active: false
          }
        ],
        timezone: 'Asia/Kathmandu'
      },

      // Location-based controls - CURRENTLY DEACTIVATED
      locationControl: {
        enabled: false, // DEACTIVATED as requested
        strictMode: false,
        enforceForRoles: ['operator'], // Which roles require location validation
        monitoringOnly: true, // Just log, don't block
        factoryLocations: [
          {
            id: 1,
            latitude: 27.7172,
            longitude: 85.3240,
            name: "TSA Garment Factory - Main",
            address: "Industrial Area, Kathmandu, Nepal",
            radius: 500,
            active: false // DEACTIVATED
          },
          {
            id: 2,
            latitude: 27.7100,
            longitude: 85.3300,
            name: "TSA Garment Factory - Branch",
            address: "Patan Industrial Area, Nepal",
            radius: 300,
            active: false // DEACTIVATED
          }
        ]
      },

      // Role-based controls
      roleControl: {
        enabled: true,
        restrictions: {
          operator: {
            allowedDevices: 'any',
            sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
            requiresApproval: false
          },
          supervisor: {
            allowedDevices: 'any', 
            sessionTimeout: 12 * 60 * 60 * 1000, // 12 hours
            requiresApproval: false
          },
          management: {
            allowedDevices: 'any',
            sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
            requiresApproval: false
          }
        }
      }
    };

    console.log('🔧 Unified Login Control initialized');
    console.log('📍 Location system: DEACTIVATED');
  }

  // Get current settings
  getSettings() {
    return JSON.parse(JSON.stringify(this.settings));
  }

  // Get system status summary
  getSystemStatus() {
    const now = new Date();
    return {
      timestamp: now.toISOString(),
      currentTime: now.toTimeString().slice(0, 8),
      currentDay: this.getDayName(now.getDay()),
      
      // System controls status
      maintenanceMode: this.settings.systemControl.maintenanceMode.enabled,
      emergencyAccess: this.settings.systemControl.emergencyAccess.enabled,
      
      // Feature controls status
      timeControl: this.settings.timeControl.enabled,
      locationControl: this.settings.locationControl.enabled, // Will show false (deactivated)
      roleControl: this.settings.roleControl.enabled,
      
      // Additional info
      activeShifts: this.settings.timeControl.allowedShifts.filter(s => s.active).length,
      locationSystemStatus: 'DEACTIVATED', // Clear status
      
      message: this.settings.locationControl.enabled 
        ? 'Location system active' 
        : 'Location system deactivated - login allowed from anywhere'
    };
  }

  // Master login validation - SIMPLIFIED with location deactivated
  async validateLogin(user, additionalData = {}) {
    console.log(`🔐 Validating login for ${user.name} (${user.role})`);
    
    const validation = {
      allowed: true,
      reasons: [],
      warnings: [],
      checks: {
        maintenance: false,
        emergency: false,
        time: false,
        location: false, // Always false since deactivated
        role: false
      },
      metadata: {
        timestamp: new Date().toISOString(),
        userRole: user.role,
        locationSystemActive: false // Always false
      }
    };

    try {
      // 1. Check maintenance mode first
      const maintenanceCheck = this.checkMaintenanceMode(user.role);
      if (maintenanceCheck.active) {
        validation.checks.maintenance = true;
        if (!maintenanceCheck.allowed) {
          validation.allowed = false;
          validation.reasons.push('System maintenance in progress');
          validation.maintenanceDetails = maintenanceCheck;
          return validation;
        }
        validation.warnings.push('System in maintenance mode');
      }

      // 2. Check emergency access
      const emergencyCheck = this.checkEmergencyAccess();
      if (emergencyCheck.active) {
        validation.checks.emergency = true;
        validation.warnings.push(`Emergency access active: ${emergencyCheck.reason}`);
        // Emergency access bypasses other restrictions
        console.log('✅ Emergency access active - bypassing other checks');
        return validation;
      }

      // 3. Check time-based restrictions (if enabled)
      if (this.settings.timeControl.enabled) {
        const timeCheck = this.checkTimeRestrictions(user.role);
        validation.checks.time = true;
        if (!timeCheck.allowed) {
          validation.allowed = false;
          validation.reasons.push(timeCheck.reason);
          validation.timeDetails = timeCheck;
        }
      }

      // 4. Location check - ALWAYS ALLOWED (deactivated)
      validation.checks.location = false; // Not checked since deactivated
      validation.locationDetails = {
        systemActive: false,
        message: 'Location validation deactivated - access allowed from anywhere',
        enforcement: 'none'
      };

      // 5. Role-based validation
      const roleCheck = this.checkRoleRestrictions(user.role);
      validation.checks.role = true;
      if (!roleCheck.allowed) {
        validation.allowed = false;
        validation.reasons.push(roleCheck.reason);
        validation.roleDetails = roleCheck;
      }

      // Log the login attempt
      await this.logLoginAttempt(user, validation, additionalData);

      console.log(validation.allowed ? '✅ Login validation passed' : '❌ Login validation failed');
      return validation;

    } catch (error) {
      console.error('❌ Login validation error:', error);
      
      // On error, allow login but log the issue
      validation.allowed = true;
      validation.warnings.push('Validation service error - allowing login');
      validation.error = error.message;
      
      return validation;
    }
  }

  // Check maintenance mode
  checkMaintenanceMode(userRole) {
    const maintenance = this.settings.systemControl.maintenanceMode;
    
    if (!maintenance.enabled) {
      return { active: false };
    }

    const isAllowedRole = maintenance.allowedRoles.includes(userRole);
    
    return {
      active: true,
      allowed: isAllowedRole,
      message: maintenance.message,
      allowedRoles: maintenance.allowedRoles
    };
  }

  // Check emergency access
  checkEmergencyAccess() {
    const emergency = this.settings.systemControl.emergencyAccess;
    
    if (!emergency.enabled) {
      return { active: false };
    }

    const now = new Date();
    const validUntil = new Date(emergency.validUntil);

    if (now > validUntil) {
      // Auto-disable expired emergency access
      this.settings.systemControl.emergencyAccess.enabled = false;
      return { active: false, reason: 'Emergency access expired' };
    }

    return {
      active: true,
      validUntil: emergency.validUntil,
      reason: emergency.reason
    };
  }

  // Check time-based restrictions
  checkTimeRestrictions(userRole) {
    if (!this.settings.timeControl.enabled) {
      return { allowed: true };
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Check working days
    if (!this.settings.timeControl.workingDays.includes(currentDay)) {
      return {
        allowed: false,
        reason: 'Outside working days',
        currentDay: this.getDayName(currentDay),
        workingDays: this.settings.timeControl.workingDays.map(d => this.getDayName(d))
      };
    }

    // Check active shifts
    const activeShifts = this.settings.timeControl.allowedShifts.filter(s => s.active);
    let withinShift = false;
    let currentShift = null;

    for (const shift of activeShifts) {
      if (this.isTimeInRange(currentTime, shift.start, shift.end)) {
        withinShift = true;
        currentShift = shift;
        break;
      }
    }

    if (!withinShift) {
      return {
        allowed: false,
        reason: 'Outside working hours',
        currentTime,
        activeShifts: activeShifts.map(s => `${s.name}: ${s.start}-${s.end}`)
      };
    }

    return {
      allowed: true,
      currentShift,
      currentTime
    };
  }

  // Check role-based restrictions
  checkRoleRestrictions(userRole) {
    if (!this.settings.roleControl.enabled) {
      return { allowed: true };
    }

    const roleConfig = this.settings.roleControl.restrictions[userRole];
    
    if (!roleConfig) {
      return {
        allowed: false,
        reason: 'Role not configured',
        role: userRole
      };
    }

    return {
      allowed: true,
      role: userRole,
      config: roleConfig
    };
  }

  // LOCATION METHODS - All return "allowed" since deactivated

  // Location validation - DEACTIVATED (always returns allowed)
  async validateLocation(user, forceCheck = false) {
    console.log('📍 Location validation called but DEACTIVATED - allowing access');
    
    return {
      success: true,
      allowed: true,
      systemActive: false,
      message: 'Location validation is deactivated - access allowed from anywhere',
      location: null,
      validation: {
        isValid: true, // Always true
        distance: 0,
        enforcement: 'none'
      }
    };
  }

  // Get location status - shows deactivated
  getLocationStatus() {
    return {
      enabled: false,
      status: 'DEACTIVATED',
      message: 'Location-based login control is currently deactivated',
      factoryLocations: this.settings.locationControl.factoryLocations.length,
      activeLocations: 0, // None active since deactivated
      enforcement: 'none'
    };
  }

  // ADMIN CONTROLS

  // Toggle location system (currently forced to OFF)
  toggleLocationSystem(enable = false, adminUser = null) {
    // Force to false as per requirements
    this.settings.locationControl.enabled = false;
    
    console.log('📍 Location system toggle requested but forced to DEACTIVATED');
    
    return {
      success: true,
      enabled: false,
      message: 'Location system is currently deactivated by system configuration',
      changedBy: adminUser?.name || 'system',
      timestamp: new Date().toISOString()
    };
  }

  // Enable/disable time control
  toggleTimeControl(enable, adminUser = null) {
    this.settings.timeControl.enabled = enable;
    
    console.log(`⏰ Time control ${enable ? 'enabled' : 'disabled'}`);
    
    return {
      success: true,
      enabled: enable,
      message: `Time-based login control ${enable ? 'enabled' : 'disabled'}`,
      changedBy: adminUser?.name || 'admin',
      timestamp: new Date().toISOString()
    };
  }

  // Enable maintenance mode
  enableMaintenanceMode(message = 'System maintenance in progress', allowedRoles = ['management'], adminUser = null) {
    this.settings.systemControl.maintenanceMode = {
      enabled: true,
      message,
      allowedRoles,
      enabledBy: adminUser?.id || 'admin',
      enabledAt: new Date().toISOString()
    };

    console.log('🔧 Maintenance mode enabled');
    return this.settings.systemControl.maintenanceMode;
  }

  // Disable maintenance mode
  disableMaintenanceMode(adminUser = null) {
    this.settings.systemControl.maintenanceMode.enabled = false;
    
    console.log('🔧 Maintenance mode disabled');
    return this.settings.systemControl.maintenanceMode;
  }

  // Enable emergency access
  enableEmergencyAccess(reason, validForHours = 2, adminUser = null) {
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + validForHours);

    this.settings.systemControl.emergencyAccess = {
      enabled: true,
      reason,
      validUntil: validUntil.toISOString(),
      allowedRoles: ['operator', 'supervisor'],
      enabledBy: adminUser?.id || 'admin',
      enabledAt: new Date().toISOString()
    };

    console.log(`🚨 Emergency access enabled for ${validForHours} hours`);
    return this.settings.systemControl.emergencyAccess;
  }

  // Disable emergency access
  disableEmergencyAccess(adminUser = null) {
    this.settings.systemControl.emergencyAccess.enabled = false;
    
    console.log('🚨 Emergency access disabled');
    return this.settings.systemControl.emergencyAccess;
  }

  // LOGGING AND MONITORING

  // Log login attempt
  async logLoginAttempt(user, validation, additionalData = {}) {
    try {
      const logEntry = {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        timestamp: new Date(),
        validation: {
          allowed: validation.allowed,
          reasons: validation.reasons,
          warnings: validation.warnings,
          checks: validation.checks
        },
        system: {
          locationSystemActive: false, // Always false since deactivated
          timeControlActive: this.settings.timeControl.enabled,
          maintenanceMode: this.settings.systemControl.maintenanceMode.enabled,
          emergencyAccess: this.settings.systemControl.emergencyAccess.enabled
        },
        deviceInfo: {
          userAgent: navigator?.userAgent || 'unknown',
          platform: navigator?.platform || 'unknown',
          language: navigator?.language || 'unknown'
        },
        additionalData
      };

      // Only log to database if available
      if (db) {
        await addDoc(collection(db, 'loginAttempts'), logEntry);
      }

      return { success: true, logEntry };
    } catch (error) {
      console.error('Failed to log login attempt:', error);
      return { success: false, error: error.message };
    }
  }

  // Get recent login attempts
  async getRecentLoginAttempts(limit = 50) {
    try {
      if (!db) {
        return { success: false, error: 'Database not available' };
      }

      const q = query(
        collection(db, 'loginAttempts'),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const attempts = [];
      
      let count = 0;
      snapshot.forEach(doc => {
        if (count < limit) {
          attempts.push({
            id: doc.id,
            ...doc.data()
          });
          count++;
        }
      });

      return { success: true, attempts };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // UTILITY METHODS

  isTimeInRange(currentTime, startTime, endTime) {
    if (endTime < startTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    return currentTime >= startTime && currentTime <= endTime;
  }

  getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }

  // Update shift settings
  updateShift(shiftId, updates) {
    const shiftIndex = this.settings.timeControl.allowedShifts.findIndex(s => s.id === shiftId);
    if (shiftIndex !== -1) {
      this.settings.timeControl.allowedShifts[shiftIndex] = {
        ...this.settings.timeControl.allowedShifts[shiftIndex],
        ...updates
      };
      return this.settings.timeControl.allowedShifts[shiftIndex];
    }
    return null;
  }

  // Get configuration summary for admin
  getConfigurationSummary() {
    return {
      systemStatus: 'OPERATIONAL',
      controls: {
        location: {
          enabled: false, // Deactivated
          status: 'DEACTIVATED',
          message: 'Location-based access control is deactivated'
        },
        time: {
          enabled: this.settings.timeControl.enabled,
          status: this.settings.timeControl.enabled ? 'ACTIVE' : 'INACTIVE',
          shifts: this.settings.timeControl.allowedShifts.filter(s => s.active).length
        },
        maintenance: {
          enabled: this.settings.systemControl.maintenanceMode.enabled,
          status: this.settings.systemControl.maintenanceMode.enabled ? 'ACTIVE' : 'INACTIVE'
        },
        emergency: {
          enabled: this.settings.systemControl.emergencyAccess.enabled,
          status: this.settings.systemControl.emergencyAccess.enabled ? 'ACTIVE' : 'INACTIVE'
        }
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const unifiedLoginControlService = new UnifiedLoginControlService();

// Also export for backward compatibility
export const loginControlService = unifiedLoginControlService;
export const locationService = {
  // Dummy methods that always allow access (for backward compatibility)
  validateLocation: () => Promise.resolve({
    success: true,
    access: 'granted',
    message: 'Location validation deactivated'
  }),
  isMonitoringEnabled: () => false,
  toggleMonitoring: () => false,
  getLocationStatus: () => ({ enabled: false, status: 'DEACTIVATED' })
};

export default unifiedLoginControlService;