// src/contexts/AuthContext.jsx
// Complete Authentication Context for TSA Production Management System

import React, { createContext, useState, useEffect, useContext } from 'react';
import { LanguageContext } from './LanguageContext';
import { ActivityLogService } from '../services/firebase-services';
import { db, collection, getDocs, COLLECTIONS } from '../config/firebase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { isNepali } = useContext(LanguageContext) || { isNepali: true };
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load users from Firestore
  const [allUsers, setAllUsers] = useState([]);

  // Function to load users from Firestore
  const loadUsersFromFirestore = async () => {
    try {
      const usersData = [];
      
      // Load operators
      const operatorsSnapshot = await getDocs(collection(db, COLLECTIONS.OPERATORS));
      operatorsSnapshot.forEach((doc) => {
        const userData = { ...doc.data(), id: doc.id, role: 'operator' };
        // Ensure stats object exists
        if (!userData.stats) {
          userData.stats = {
            todayPieces: 0,
            todayEarnings: 0,
            weeklyPieces: 0,
            weeklyEarnings: 0,
            monthlyPieces: 0,
            monthlyEarnings: 0
          };
        }
        usersData.push(userData);
      });

      // Load supervisors
      const supervisorsSnapshot = await getDocs(collection(db, COLLECTIONS.SUPERVISORS));
      supervisorsSnapshot.forEach((doc) => {
        const userData = { ...doc.data(), id: doc.id, role: 'supervisor' };
        // Ensure stats object exists
        if (!userData.stats) {
          userData.stats = {
            todayPieces: 0,
            todayEarnings: 0,
            weeklyPieces: 0,
            weeklyEarnings: 0,
            monthlyPieces: 0,
            monthlyEarnings: 0
          };
        }
        usersData.push(userData);
      });

      // Load management
      const managementSnapshot = await getDocs(collection(db, COLLECTIONS.MANAGEMENT));
      managementSnapshot.forEach((doc) => {
        const userData = { ...doc.data(), id: doc.id, role: 'manager' };
        // Ensure stats object exists
        if (!userData.stats) {
          userData.stats = {
            todayPieces: 0,
            todayEarnings: 0,
            weeklyPieces: 0,
            weeklyEarnings: 0,
            monthlyPieces: 0,
            monthlyEarnings: 0
          };
        }
        usersData.push(userData);
      });

      setAllUsers(usersData);
      return usersData;
    } catch (error) {
      console.error('Error loading users from Firestore:', error);
      setAllUsers([]); // No fallback - use empty array
      return [];
    }
  };

  useEffect(() => {
    loadUsersFromFirestore();
  }, [isNepali]);

  const mockUsers = allUsers;

  useEffect(() => {
    // No session persistence - users must login each time
    setLoading(false);
  }, []);


  // Login function
  const login = async (username, password, rememberMe = false) => {
    setLoading(true);
    try {
      // Ensure users are loaded from Firestore before attempting login
      if (allUsers.length === 0) {
        console.log('🔄 Users not loaded yet, refreshing from Firestore...');
        const freshUsers = await loadUsersFromFirestore();
        if (freshUsers.length > 0) {
          // Use the freshly loaded users for authentication
          const foundUser = freshUsers.find(u => u.username === username);
          
          if (!foundUser) {
            throw new Error(isNepali ? 'प्रयोगकर्ता फेला परेन' : 'User not found');
          }
          
          // Simple password check
          if (password !== 'password123') {
            throw new Error(isNepali ? 'गलत पासवर्ड' : 'Invalid password');
          }
          
          // Set user and return early
          setUser(foundUser);
          setIsAuthenticated(true);
          
          // Log activity
          await ActivityLogService.logActivity(foundUser.id, 'login', {
            role: foundUser.role,
            station: foundUser.station || 'unknown',
            timestamp: new Date().toISOString()
          });
          
          return { success: true, user: foundUser };
        }
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user in loaded data with better matching
      const foundUser = allUsers.find(u => 
        (u.username && u.username.toLowerCase() === username.toLowerCase()) ||
        (u.name && u.name.toLowerCase() === username.toLowerCase()) ||
        (u.nameEn && u.nameEn.toLowerCase() === username.toLowerCase()) ||
        (u.nameNepali && u.nameNepali.toLowerCase() === username.toLowerCase())
      );
      
      if (!foundUser) {
        console.log(`❌ User not found: ${username}. Available users:`, allUsers.map(u => ({ 
          username: u.username, 
          name: u.name, 
          nameEn: u.nameEn, 
          nameNepali: u.nameNepali 
        })));
        throw new Error(isNepali ? 'प्रयोगकर्ता फेला परेन। कृपया सही प्रयोगकर्ता नाम प्रविष्ट गर्नुहोस्।' : 'User not found. Please enter the correct username.');
      }
      
      // Check if user is active
      if (foundUser.active === false || foundUser.status === 'inactive') {
        throw new Error(isNepali ? 'यो खाता निष्क्रिय छ। कृपया व्यवस्थापकसँग सम्पर्क गर्नुहोस्।' : 'This account is inactive. Please contact administrator.');
      }
      
      // Enhanced password check with user-specific validation
      const userPassword = foundUser.password || 'password123'; // Use user's password or default
      if (password !== userPassword) {
        console.log(`❌ Password mismatch for user ${username}. Expected: ${userPassword}, Got: ${password}`);
        throw new Error(isNepali ? 'गलत पासवर्ड। कृपया सही पासवर्ड प्रविष्ट गर्नुहोस्।' : 'Incorrect password. Please enter the correct password.');
      }
      
      // No storage persistence - session exists only in memory
      
      setUser(foundUser);
      setIsAuthenticated(true);
      
      // Log activity
      await ActivityLogService.logActivity(foundUser.id, 'login', {
        role: foundUser.role,
        station: foundUser.station || 'unknown',
        timestamp: new Date().toISOString()
      });
      
      return { success: true, user: foundUser };
    } catch (error) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setLoading(true);
    try {
      // Simulate API call to invalidate token
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Log activity before clearing user data
      if (user) {
        await ActivityLogService.logActivity(user.id, 'logout', {
          role: user.role,
          station: user.station || 'unknown',
          timestamp: new Date().toISOString()
        });
      }
      
      // No storage to clear - session only exists in memory
      
      setUser(null);
      setIsAuthenticated(false);
      
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if API fails
      setUser(null);
      setIsAuthenticated(false);
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Create mock JWT token
  const createMockToken = (user) => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    // Simple base64 encoding (not secure, just for demo)
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = btoa(`${encodedHeader}.${encodedPayload}.secret`);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  };

  // Update user profile
  const updateProfile = async (updates) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...user, ...updates };
      
      // No storage updates - session only exists in memory
      
      setUser(updatedUser);
      
      return { success: true, user: updatedUser };
    } catch (error) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify current password
      if (currentPassword !== 'password123') {
        throw new Error(isNepali ? 'हालको पासवर्ड गलत छ' : 'Current password is incorrect');
      }
      
      // In real app, this would update password in database
      console.log('Password changed successfully');
      
      return { success: true };
    } catch (error) {
      throw new Error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data
  const refreshUserData = async () => {
    if (!user) return;
    
    try {
      // Simulate API call to get fresh user data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find updated user data
      const updatedUser = mockUsers.find(u => u.id === user.id);
      
      if (updatedUser) {
        setUser(updatedUser);
        
        // No storage updates - session only exists in memory
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!user) return false;
    
    // Managers have all permissions
    if (user.role === 'manager') return true;
    
    // Check specific permissions
    if (user.permissions && user.permissions.includes(permission)) return true;
    if (user.permissions && user.permissions.includes('all')) return true;
    
    // Role-based permissions
    const rolePermissions = {
      operator: ['view_own_work', 'complete_work', 'report_quality', 'self_assign_work'],
      supervisor: ['assign_work', 'view_reports', 'manage_quality', 'view_line_status', 'manage_operators'],
      manager: ['all']
    };
    
    return rolePermissions[user.role]?.includes(permission) || false;
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!user) return '';
    return user.name || user.username;
  };

  // Get user role display
  const getUserRoleDisplay = () => {
    if (!user) return '';
    
    const roleDisplays = {
      operator: isNepali ? 'ऑपरेटर' : 'Operator',
      supervisor: isNepali ? 'सुपरभाइजर' : 'Supervisor',
      manager: isNepali ? 'व्यवस्थापक' : 'Manager'
    };
    
    return roleDisplays[user.role] || user.role;
  };

  // Get user speciality display
  const getUserSpecialityDisplay = () => {
    if (!user || user.role !== 'operator') return '';
    return isNepali ? user.specialityNepali : user.speciality;
  };

  // Get all operators (for supervisor use)
  const getAllOperators = () => {
    return mockUsers.filter(user => user.role === 'operator');
  };

  // Get operators by speciality
  const getOperatorsBySpeciality = (speciality) => {
    return mockUsers.filter(user => 
      user.role === 'operator' && user.speciality === speciality
    );
  };

  // Update work assignment
  const updateWorkAssignment = async (workData) => {
    if (!user || user.role !== 'operator') return;
    
    try {
      const updatedUser = {
        ...user,
        currentWork: workData,
        stats: {
          ...user.stats,
          todayPieces: user.stats.todayPieces + (workData?.completed || 0),
          todayEarnings: user.stats.todayEarnings + (workData?.earnings || 0)
        }
      };
      
      setUser(updatedUser);
      
      // No storage updates - session only exists in memory
      
      return updatedUser;
    } catch (error) {
      console.error('Failed to update work assignment:', error);
      throw error;
    }
  };

  // Complete current work
  const completeCurrentWork = async (completionData) => {
    if (!user || !user.currentWork) return;
    
    try {
      const earnings = completionData.pieces * user.currentWork.rate;
      
      const updatedUser = {
        ...user,
        currentWork: null,
        stats: {
          ...user.stats,
          todayPieces: user.stats.todayPieces + completionData.pieces,
          todayEarnings: user.stats.todayEarnings + earnings,
          weeklyPieces: user.stats.weeklyPieces + completionData.pieces,
          weeklyEarnings: user.stats.weeklyEarnings + earnings,
          monthlyPieces: user.stats.monthlyPieces + completionData.pieces,
          monthlyEarnings: user.stats.monthlyEarnings + earnings
        }
      };
      
      setUser(updatedUser);
      
      // No storage updates - session only exists in memory
      
      return { success: true, earnings };
    } catch (error) {
      console.error('Failed to complete work:', error);
      throw error;
    }
  };

  // Auto-logout after inactivity
  useEffect(() => {
    let inactivityTimer;
    
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      
      // Auto-logout after 8 hours of inactivity
      inactivityTimer = setTimeout(() => {
        if (isAuthenticated) {
          logout();
        }
      }, 8 * 60 * 60 * 1000); // 8 hours
    };
    
    // Set up event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    if (isAuthenticated) {
      resetTimer();
      
      events.forEach(event => {
        window.addEventListener(event, resetTimer, true);
      });
    }
    
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer, true);
      });
    };
  }, [isAuthenticated, logout]);

  // Check if user is online
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOnline(navigator.onLine);
    
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const value = {
    // Auth state
    user,
    loading,
    isAuthenticated,
    isOnline,
    
    // Auth actions
    login,
    logout,
    updateProfile,
    changePassword,
    refreshUserData,
    
    // User utilities
    hasPermission,
    getUserDisplayName,
    getUserRoleDisplay,
    getUserSpecialityDisplay,
    
    // Operator specific
    updateWorkAssignment,
    completeCurrentWork,
    
    // Data access
    getAllOperators,
    getOperatorsBySpeciality,
    mockUsers // Expose for development/testing
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};