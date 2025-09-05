// Authentication Service
// Handles user authentication and authorization

import { FirebaseBaseService, FirebaseUtils, COLLECTIONS } from './firebase-base';
import { auth, signInWithEmailAndPassword, signOut } from "../../config/firebase";
import ActivityLogService from './activity-service';

export class AuthService extends FirebaseBaseService {
  constructor() {
    super(COLLECTIONS.OPERATORS); // Default collection, but we'll use multiple
  }

  /**
   * Login user
   */
  static async login(username, password) {
    try {
      console.log('🔐 Attempting login for:', username);

      // Find user in all user collections
      const user = await this.findUser(username);
      
      if (!user.success) {
        console.error('❌ User not found:', username);
        return { success: false, error: 'Invalid credentials' };
      }

      console.log('✅ User found:', user.userData.name);

      // Verify password
      if (user.userData.password !== password) {
        console.error('❌ Invalid password for:', username);
        await ActivityLogService.logActivity(user.userData.id, 'login_failed', { reason: 'invalid_password' });
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if user is active
      if (!user.userData.active && user.userData.status !== 'active') {
        console.error('❌ User account is inactive:', username);
        await ActivityLogService.logActivity(user.userData.id, 'login_failed', { reason: 'account_inactive' });
        return { success: false, error: 'Account is inactive' };
      }

      // Log successful login
      await ActivityLogService.logActivity(user.userData.id, 'login_success', {
        role: user.userData.role,
        userAgent: navigator.userAgent
      });

      console.log('✅ Login successful for:', user.userData.name);
      
      return {
        success: true,
        user: {
          ...user.userData,
          // Don't return password in the response
          password: undefined
        }
      };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  /**
   * Logout user
   */
  static async logout(userId = null) {
    try {
      if (userId) {
        await ActivityLogService.logActivity(userId, 'logout', {
          timestamp: new Date().toISOString()
        });
      }

      // Sign out from Firebase Auth if using it
      if (auth.currentUser) {
        await signOut(auth);
      }

      console.log('✅ Logout successful');
      return { success: true };
    } catch (error) {
      console.error('❌ Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find user across all user collections
   */
  static async findUser(username) {
    try {
      // Search in operators
      const operatorService = new FirebaseBaseService(COLLECTIONS.OPERATORS);
      const operatorResult = await operatorService.getAll([
        FirebaseUtils.whereEqual('username', username)
      ]);

      if (operatorResult.success && operatorResult.data.length > 0) {
        return {
          success: true,
          userData: { ...operatorResult.data[0], role: 'operator' },
          collection: COLLECTIONS.OPERATORS
        };
      }

      // Search in supervisors
      const supervisorService = new FirebaseBaseService(COLLECTIONS.SUPERVISORS);
      const supervisorResult = await supervisorService.getAll([
        FirebaseUtils.whereEqual('username', username)
      ]);

      if (supervisorResult.success && supervisorResult.data.length > 0) {
        return {
          success: true,
          userData: { ...supervisorResult.data[0], role: 'supervisor' },
          collection: COLLECTIONS.SUPERVISORS
        };
      }

      // Search in management
      const managementService = new FirebaseBaseService(COLLECTIONS.MANAGEMENT);
      const managementResult = await managementService.getAll([
        FirebaseUtils.whereEqual('username', username)
      ]);

      if (managementResult.success && managementResult.data.length > 0) {
        return {
          success: true,
          userData: { ...managementResult.data[0], role: 'management' },
          collection: COLLECTIONS.MANAGEMENT
        };
      }

      return { success: false, error: 'User not found' };
    } catch (error) {
      console.error('❌ Find user error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId, role) {
    try {
      const collection = this.getCollectionForRole(role);
      const service = new FirebaseBaseService(collection);
      const result = await service.getById(userId);

      if (result.success) {
        return {
          success: true,
          user: {
            ...result.data,
            role,
            password: undefined // Don't return password
          }
        };
      }

      return result;
    } catch (error) {
      console.error('❌ Get user by ID error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId, role, updateData) {
    try {
      const collection = this.getCollectionForRole(role);
      const service = new FirebaseBaseService(collection);
      
      // Don't allow updating sensitive fields directly
      const { id, username, role: userRole, ...safeUpdateData } = updateData;
      
      const result = await service.update(userId, safeUpdateData);

      if (result.success) {
        await ActivityLogService.logActivity(userId, 'profile_updated', {
          updatedFields: Object.keys(safeUpdateData)
        });
      }

      return result;
    } catch (error) {
      console.error('❌ Update user profile error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Change user password
   */
  static async changePassword(userId, role, currentPassword, newPassword) {
    try {
      const collection = this.getCollectionForRole(role);
      const service = new FirebaseBaseService(collection);
      
      // Get current user data to verify current password
      const userResult = await service.getById(userId);
      
      if (!userResult.success) {
        return { success: false, error: 'User not found' };
      }

      if (userResult.data.password !== currentPassword) {
        await ActivityLogService.logActivity(userId, 'password_change_failed', { reason: 'invalid_current_password' });
        return { success: false, error: 'Current password is incorrect' };
      }

      // Update password
      const updateResult = await service.update(userId, {
        password: newPassword,
        passwordChangedAt: FirebaseUtils.now()
      });

      if (updateResult.success) {
        await ActivityLogService.logActivity(userId, 'password_changed', {
          timestamp: new Date().toISOString()
        });
      }

      return updateResult;
    } catch (error) {
      console.error('❌ Change password error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all users of a specific role
   */
  static async getUsersByRole(role) {
    try {
      const collection = this.getCollectionForRole(role);
      const service = new FirebaseBaseService(collection);
      const result = await service.getAll([
        FirebaseUtils.orderAsc('name')
      ]);

      if (result.success) {
        // Remove passwords from user data
        const users = result.data.map(user => ({
          ...user,
          role,
          password: undefined
        }));

        return { success: true, users };
      }

      return result;
    } catch (error) {
      console.error('❌ Get users by role error:', error);
      return { success: false, error: error.message, users: [] };
    }
  }

  /**
   * Check user permissions
   */
  static hasPermission(user, permission) {
    if (!user || !user.permissions) {
      return false;
    }

    if (Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }

    if (typeof user.permissions === 'object') {
      return user.permissions[permission] === true;
    }

    return false;
  }

  /**
   * Get collection name for role
   */
  static getCollectionForRole(role) {
    switch (role) {
      case 'operator':
        return COLLECTIONS.OPERATORS;
      case 'supervisor':
        return COLLECTIONS.SUPERVISORS;
      case 'management':
        return COLLECTIONS.MANAGEMENT;
      default:
        throw new Error(`Unknown role: ${role}`);
    }
  }

  /**
   * Validate user session
   */
  static async validateSession(userId, role) {
    try {
      const userResult = await this.getUserById(userId, role);
      
      if (userResult.success && userResult.user.active && userResult.user.status === 'active') {
        return { success: true, valid: true, user: userResult.user };
      }

      return { success: true, valid: false, error: 'Invalid session' };
    } catch (error) {
      console.error('❌ Session validation error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default AuthService;