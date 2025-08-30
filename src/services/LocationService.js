// Location Service - Geolocation and Factory Location Management
// Handles operator location validation and admin approval system

import { db, collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc } from '../config/firebase';

class LocationService {
  constructor() {
    // Multiple factory locations (up to 3 locations)
    this.FACTORY_LOCATIONS = [
      {
        id: 1,
        latitude: 27.7172,
        longitude: 85.3240,
        name: "TSA Garment Factory - Main",
        address: "Industrial Area, Kathmandu, Nepal",
        radius: 500, // Individual radius for each location
        active: true
      },
      {
        id: 2,
        latitude: 27.7100,
        longitude: 85.3300,
        name: "TSA Garment Factory - Branch",
        address: "Patan Industrial Area, Nepal",
        radius: 300,
        active: true
      },
      {
        id: 3,
        latitude: 27.7050,
        longitude: 85.3350,
        name: "TSA Warehouse",
        address: "Bhaktapur Industrial Zone, Nepal",
        radius: 200,
        active: false // Can be activated/deactivated
      }
    ];
    
    // Backward compatibility - use first active location as primary
    this.FACTORY_LOCATION = this.FACTORY_LOCATIONS.find(loc => loc.active) || this.FACTORY_LOCATIONS[0];
    this.ALLOWED_RADIUS = this.FACTORY_LOCATION.radius;
    
    // Location accuracy threshold
    this.MIN_ACCURACY = 100; // meters
  }

  // Get all factory locations
  getAllLocations() {
    return this.FACTORY_LOCATIONS;
  }

  // Get active factory locations only
  getActiveLocations() {
    return this.FACTORY_LOCATIONS.filter(loc => loc.active);
  }

  // Add new factory location
  addLocation(location) {
    const newId = Math.max(...this.FACTORY_LOCATIONS.map(l => l.id)) + 1;
    const newLocation = {
      id: newId,
      ...location,
      active: location.active !== false // Default to true unless explicitly false
    };
    this.FACTORY_LOCATIONS.push(newLocation);
    return newLocation;
  }

  // Update existing location
  updateLocation(id, updates) {
    const index = this.FACTORY_LOCATIONS.findIndex(loc => loc.id === id);
    if (index !== -1) {
      this.FACTORY_LOCATIONS[index] = { ...this.FACTORY_LOCATIONS[index], ...updates };
      
      // Update backward compatibility references if primary location changed
      if (this.FACTORY_LOCATIONS[index].active) {
        this.FACTORY_LOCATION = this.FACTORY_LOCATIONS[index];
        this.ALLOWED_RADIUS = this.FACTORY_LOCATION.radius;
      }
      
      return this.FACTORY_LOCATIONS[index];
    }
    return null;
  }

  // Toggle location active status
  toggleLocation(id) {
    const location = this.FACTORY_LOCATIONS.find(loc => loc.id === id);
    if (location) {
      location.active = !location.active;
      
      // Ensure at least one location remains active
      const activeCount = this.FACTORY_LOCATIONS.filter(loc => loc.active).length;
      if (activeCount === 0) {
        // Reactivate this location
        location.active = true;
      }
      
      return location;
    }
    return null;
  }

  // Delete location (if more than 1 exists)
  deleteLocation(id) {
    if (this.FACTORY_LOCATIONS.length <= 1) {
      return { success: false, message: 'Cannot delete the last remaining location' };
    }
    
    const index = this.FACTORY_LOCATIONS.findIndex(loc => loc.id === id);
    if (index !== -1) {
      const deleted = this.FACTORY_LOCATIONS.splice(index, 1)[0];
      
      // Update primary location if deleted location was primary
      if (this.FACTORY_LOCATION.id === id) {
        this.FACTORY_LOCATION = this.FACTORY_LOCATIONS.find(loc => loc.active) || this.FACTORY_LOCATIONS[0];
        this.ALLOWED_RADIUS = this.FACTORY_LOCATION.radius;
      }
      
      return { success: true, deleted };
    }
    return { success: false, message: 'Location not found' };
  }

  // Get current location with high accuracy
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      const options = {
        enableHighAccuracy: true,
        timeout: 30000, // 30 seconds
        maximumAge: 60000 // 1 minute
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date(),
            speed: position.coords.speed,
            heading: position.coords.heading
          };
          resolve(location);
        },
        (error) => {
          let message = 'Location access failed';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied by user';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              message = 'Location request timeout';
              break;
          }
          reject(new Error(message));
        },
        options
      );
    });
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  // Check if location is within any active factory bounds
  isLocationValid(userLocation) {
    const activeLocations = this.FACTORY_LOCATIONS.filter(loc => loc.active);
    let closestValidLocation = null;
    let minDistance = Infinity;
    let isValid = false;

    // Check against all active factory locations
    for (const factoryLocation of activeLocations) {
      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        factoryLocation.latitude,
        factoryLocation.longitude
      );

      // Update closest location regardless of validity
      if (distance < minDistance) {
        minDistance = distance;
        closestValidLocation = factoryLocation;
      }

      // Check if within this location's radius
      if (distance <= factoryLocation.radius) {
        isValid = true;
        // If valid, use this as the closest location
        closestValidLocation = factoryLocation;
        minDistance = distance;
        break; // Found a valid location, no need to check others
      }
    }

    return {
      isValid,
      distance: Math.round(minDistance),
      allowedRadius: closestValidLocation?.radius || this.ALLOWED_RADIUS,
      factoryLocation: closestValidLocation || this.FACTORY_LOCATION,
      accuracy: userLocation.accuracy,
      isAccurate: userLocation.accuracy <= this.MIN_ACCURACY,
      checkedLocations: activeLocations.length,
      allLocations: activeLocations.map(loc => ({
        name: loc.name,
        distance: Math.round(this.calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          loc.latitude,
          loc.longitude
        ))
      }))
    };
  }

  // Log location access attempt
  async logLocationAttempt(userId, userName, userRole, location, validation, deviceInfo = {}) {
    try {
      const locationLog = {
        userId,
        userName,
        userRole,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp
        },
        validation: {
          isValid: validation.isValid,
          distance: validation.distance,
          allowedRadius: validation.allowedRadius,
          isAccurate: validation.isAccurate
        },
        factoryLocation: this.FACTORY_LOCATION,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          ...deviceInfo
        },
        timestamp: new Date(),
        status: validation.isValid ? 'approved' : 'denied',
        requiresAdminApproval: !validation.isValid
      };

      const docRef = await addDoc(collection(db, 'locationLogs'), locationLog);
      
      // If location is invalid, create admin alert
      if (!validation.isValid) {
        await this.createLocationAlert(userId, userName, locationLog, docRef.id);
      }

      return {
        success: true,
        logId: docRef.id,
        ...locationLog
      };
    } catch (error) {
      console.error('Failed to log location attempt:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create alert for admin when invalid location detected
  async createLocationAlert(userId, userName, locationLog, logId) {
    try {
      const alert = {
        type: 'LOCATION_VIOLATION',
        severity: 'HIGH',
        userId,
        userName,
        userRole: locationLog.userRole,
        title: `Unauthorized Location Access - ${userName}`,
        message: `${userName} attempted to access system from ${locationLog.validation.distance}m away from factory`,
        location: locationLog.location,
        distance: locationLog.validation.distance,
        timestamp: new Date(),
        status: 'unread',
        logId,
        requiresAction: true,
        actionTaken: false
      };

      await addDoc(collection(db, 'adminAlerts'), alert);
      
      // Also log in security events
      await addDoc(collection(db, 'securityEvents'), {
        ...alert,
        eventType: 'LOCATION_VIOLATION',
        riskLevel: 'HIGH'
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to create location alert:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate operator access with location
  async validateOperatorAccess(user, requestApproval = true) {
    try {
      // Get current location
      const location = await this.getCurrentLocation();
      
      // Validate location
      const validation = this.isLocationValid(location);
      
      // Log the attempt
      const logResult = await this.logLocationAttempt(
        user.id, 
        user.name, 
        user.role, 
        location, 
        validation
      );

      if (validation.isValid) {
        return {
          success: true,
          access: 'granted',
          location,
          validation,
          message: 'Access granted from factory location'
        };
      } else {
        // Location is invalid
        if (requestApproval) {
          // Create approval request
          const approvalResult = await this.requestLocationApproval(user, location, validation, logResult.logId);
          
          return {
            success: false,
            access: 'pending_approval',
            location,
            validation,
            approvalId: approvalResult.approvalId,
            message: `Access denied. You are ${validation.distance}m from factory. Admin approval requested.`
          };
        } else {
          return {
            success: false,
            access: 'denied',
            location,
            validation,
            message: `Access denied. You must be within ${this.ALLOWED_RADIUS}m of factory location.`
          };
        }
      }
    } catch (error) {
      console.error('Location validation failed:', error);
      return {
        success: false,
        access: 'error',
        error: error.message,
        message: 'Unable to verify location. Please enable location services.'
      };
    }
  }

  // Request admin approval for remote access
  async requestLocationApproval(user, location, validation, logId) {
    try {
      const approval = {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        requestedAt: new Date(),
        location,
        validation,
        logId,
        status: 'pending',
        reason: 'Remote location access request',
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform
        },
        requiresApproval: true,
        approvedBy: null,
        approvedAt: null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      const docRef = await addDoc(collection(db, 'locationApprovals'), approval);

      return {
        success: true,
        approvalId: docRef.id
      };
    } catch (error) {
      console.error('Failed to request approval:', error);
      return { success: false, error: error.message };
    }
  }

  // Get pending location approvals (for admin)
  async getPendingApprovals() {
    try {
      const q = query(
        collection(db, 'locationApprovals'),
        where('status', '==', 'pending'),
        orderBy('requestedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const approvals = [];
      
      snapshot.forEach(doc => {
        approvals.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        approvals
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Approve/deny location request (admin function)
  async processLocationApproval(approvalId, action, adminId, adminName, reason = '') {
    try {
      const approval = doc(db, 'locationApprovals', approvalId);
      
      const updateData = {
        status: action, // 'approved' or 'denied'
        processedAt: new Date(),
        processedBy: adminId,
        adminName,
        adminReason: reason
      };

      if (action === 'approved') {
        updateData.approvedAt = new Date();
        updateData.approvedBy = adminId;
        // Set expiry for approved access (e.g., 8 hours)
        updateData.accessExpiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
      }

      await updateDoc(approval, updateData);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get location alerts for admin dashboard
  async getLocationAlerts() {
    try {
      const q = query(
        collection(db, 'adminAlerts'),
        where('type', '==', 'LOCATION_VIOLATION'),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const alerts = [];
      
      snapshot.forEach(doc => {
        alerts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return {
        success: true,
        alerts
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Check if user has valid location approval
  async checkLocationApproval(userId) {
    try {
      const q = query(
        collection(db, 'locationApprovals'),
        where('userId', '==', userId),
        where('status', '==', 'approved'),
        orderBy('approvedAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        return { success: true, hasValidApproval: false };
      }

      const latestApproval = snapshot.docs[0].data();
      const now = new Date();
      const expiresAt = latestApproval.accessExpiresAt?.toDate();

      const isValid = expiresAt && expiresAt > now;

      return {
        success: true,
        hasValidApproval: isValid,
        approval: isValid ? latestApproval : null
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get location statistics for admin
  async getLocationStats(days = 30) {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      
      const q = query(
        collection(db, 'locationLogs'),
        where('timestamp', '>=', fromDate),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const logs = [];
      
      snapshot.forEach(doc => {
        logs.push(doc.data());
      });

      // Calculate statistics
      const stats = {
        totalAttempts: logs.length,
        validAttempts: logs.filter(log => log.validation.isValid).length,
        invalidAttempts: logs.filter(log => !log.validation.isValid).length,
        uniqueUsers: [...new Set(logs.map(log => log.userId))].length,
        averageDistance: logs.length > 0 ? 
          Math.round(logs.reduce((sum, log) => sum + log.validation.distance, 0) / logs.length) : 0,
        recentViolations: logs.filter(log => !log.validation.isValid).slice(0, 10)
      };

      return {
        success: true,
        stats,
        logs: logs.slice(0, 100) // Return latest 100 logs
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export const locationService = new LocationService();
export default locationService;