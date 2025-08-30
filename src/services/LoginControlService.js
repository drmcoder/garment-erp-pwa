// File: src/services/LoginControlService.js
// Time-based and Location-based Login Control System

class LoginControlService {
  constructor() {
    // Login control settings
    this.settings = {
      // Location-based controls
      locationControl: {
        enabled: true,
        enforceForRoles: ['operator'], // Roles that require location validation
        allowedLocations: [], // Will sync with LocationService
        strictMode: false // If true, deny all location requests outside factory
      },
      
      // Time-based controls
      timeControl: {
        enabled: false,
        workingHours: {
          start: '08:00', // 8:00 AM
          end: '18:00',   // 6:00 PM
        },
        workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday (0 = Sunday)
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

      // Emergency access
      emergencyAccess: {
        enabled: false,
        reason: '',
        validUntil: null,
        allowedRoles: ['operator', 'supervisor'],
        enabledBy: null,
        enabledAt: null
      },

      // Maintenance mode
      maintenanceMode: {
        enabled: false,
        allowedRoles: ['management', 'supervisor'], // Only these roles can login during maintenance
        message: 'System maintenance in progress. Please try again later.',
        scheduledStart: null,
        scheduledEnd: null
      }
    };
  }

  // Get current settings
  getSettings() {
    return { ...this.settings };
  }

  // Update location control settings
  updateLocationControl(updates) {
    this.settings.locationControl = {
      ...this.settings.locationControl,
      ...updates
    };
    return this.settings.locationControl;
  }

  // Update time control settings
  updateTimeControl(updates) {
    this.settings.timeControl = {
      ...this.settings.timeControl,
      ...updates
    };
    return this.settings.timeControl;
  }

  // Update shift configuration
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

  // Check if time-based login is allowed
  isTimeAllowed(userRole = 'operator') {
    if (!this.settings.timeControl.enabled) return { allowed: true };

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Check if today is a working day
    if (!this.settings.timeControl.workingDays.includes(currentDay)) {
      return {
        allowed: false,
        reason: 'Outside working days',
        currentDay: this.getDayName(currentDay),
        workingDays: this.settings.timeControl.workingDays.map(d => this.getDayName(d))
      };
    }

    // Check if current time falls within any active shift
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
      currentShift: currentShift,
      currentTime
    };
  }

  // Check if location-based login is allowed
  isLocationAllowed(userLocation, userRole = 'operator') {
    if (!this.settings.locationControl.enabled) return { allowed: true };

    // Skip location check for roles not in enforcement list
    if (!this.settings.locationControl.enforceForRoles.includes(userRole)) {
      return { allowed: true, reason: 'Role exempt from location check' };
    }

    // Use LocationService for validation (will be injected)
    return { allowed: true }; // Placeholder - will be replaced by LocationService validation
  }

  // Check maintenance mode
  isMaintenanceModeActive(userRole = 'operator') {
    if (!this.settings.maintenanceMode.enabled) return { active: false };

    const isAllowedRole = this.settings.maintenanceMode.allowedRoles.includes(userRole);
    
    return {
      active: true,
      allowed: isAllowedRole,
      message: this.settings.maintenanceMode.message,
      allowedRoles: this.settings.maintenanceMode.allowedRoles
    };
  }

  // Check emergency access
  isEmergencyAccessActive() {
    if (!this.settings.emergencyAccess.enabled) return { active: false };

    const now = new Date();
    const validUntil = new Date(this.settings.emergencyAccess.validUntil);

    if (now > validUntil) {
      // Auto-disable expired emergency access
      this.settings.emergencyAccess.enabled = false;
      return { active: false, reason: 'Emergency access expired' };
    }

    return {
      active: true,
      validUntil: this.settings.emergencyAccess.validUntil,
      reason: this.settings.emergencyAccess.reason
    };
  }

  // Master login validation
  validateLogin(userRole, userLocation = null, userInfo = {}) {
    const validation = {
      allowed: true,
      reasons: [],
      warnings: [],
      emergency: false,
      maintenance: false
    };

    // Check maintenance mode first
    const maintenance = this.isMaintenanceModeActive(userRole);
    if (maintenance.active) {
      if (!maintenance.allowed) {
        return {
          allowed: false,
          reason: 'System maintenance in progress',
          message: maintenance.message,
          maintenance: true
        };
      }
      validation.maintenance = true;
      validation.warnings.push('System in maintenance mode');
    }

    // Check emergency access
    const emergency = this.isEmergencyAccessActive();
    if (emergency.active) {
      validation.emergency = true;
      validation.warnings.push(`Emergency access active: ${emergency.reason}`);
      // Emergency access bypasses other restrictions
      return validation;
    }

    // Check time-based restrictions
    const timeCheck = this.isTimeAllowed(userRole);
    if (!timeCheck.allowed) {
      validation.allowed = false;
      validation.reasons.push(timeCheck.reason);
      validation.timeDetails = timeCheck;
    }

    // Check location-based restrictions
    if (userLocation) {
      const locationCheck = this.isLocationAllowed(userLocation, userRole);
      if (!locationCheck.allowed) {
        validation.allowed = false;
        validation.reasons.push('Location not allowed');
        validation.locationDetails = locationCheck;
      }
    }

    return validation;
  }

  // Enable emergency access
  enableEmergencyAccess(reason, validForHours = 2, enabledBy = 'admin') {
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + validForHours);

    this.settings.emergencyAccess = {
      enabled: true,
      reason,
      validUntil: validUntil.toISOString(),
      allowedRoles: ['operator', 'supervisor'],
      enabledBy,
      enabledAt: new Date().toISOString()
    };

    return this.settings.emergencyAccess;
  }

  // Disable emergency access
  disableEmergencyAccess() {
    this.settings.emergencyAccess.enabled = false;
    return this.settings.emergencyAccess;
  }

  // Enable maintenance mode
  enableMaintenanceMode(message = 'System maintenance in progress', allowedRoles = ['management']) {
    this.settings.maintenanceMode = {
      enabled: true,
      message,
      allowedRoles,
      enabledAt: new Date().toISOString()
    };
    return this.settings.maintenanceMode;
  }

  // Disable maintenance mode
  disableMaintenanceMode() {
    this.settings.maintenanceMode.enabled = false;
    return this.settings.maintenanceMode;
  }

  // Utility methods
  isTimeInRange(currentTime, startTime, endTime) {
    // Handle overnight shifts (e.g., 22:00 to 06:00)
    if (endTime < startTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }
    return currentTime >= startTime && currentTime <= endTime;
  }

  getDayName(dayIndex) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }

  // Get current status summary
  getStatusSummary() {
    const now = new Date();
    return {
      currentTime: now.toTimeString().slice(0, 8),
      currentDay: this.getDayName(now.getDay()),
      locationControl: this.settings.locationControl.enabled,
      timeControl: this.settings.timeControl.enabled,
      maintenanceMode: this.settings.maintenanceMode.enabled,
      emergencyAccess: this.settings.emergencyAccess.enabled,
      activeShifts: this.settings.timeControl.allowedShifts.filter(s => s.active).length
    };
  }
}

// Export singleton instance
export const loginControlService = new LoginControlService();
export default loginControlService;