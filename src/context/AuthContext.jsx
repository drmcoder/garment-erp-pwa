// src/contexts/AuthContext.jsx
// Complete Authentication Context for Garment ERP

import React, { createContext, useState, useEffect, useContext } from 'react';
import { LanguageContext } from './LanguageContext';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { isNepali } = useContext(LanguageContext) || { isNepali: true };
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Complete mock user data - in real app, this would come from Firebase
  const mockUsers = [
    {
      id: 'op_001',
      username: 'ram.singh',
      name: isNepali ? 'राम सिंह' : 'Ram Singh',
      role: 'operator',
      speciality: 'overlock',
      specialityNepali: 'ओभरलक',
      experience: 5,
      efficiency: 92,
      qualityScore: 96,
      station: 'overlock_01',
      shift: 'morning',
      employeeId: 'EMP001',
      joinDate: '2020-01-15',
      skills: ['shoulder_join', 'side_seam', 'armhole'],
      preferences: {
        language: 'np',
        notifications: true,
        autoAssign: false
      },
      stats: {
        todayPieces: 85,
        todayEarnings: 237.50,
        weeklyPieces: 520,
        weeklyEarnings: 1456.00,
        monthlyPieces: 2480,
        monthlyEarnings: 6205.00
      },
      currentWork: {
        bundleId: 'bundle_001',
        articleNumber: '8085',
        operation: isNepali ? 'काँध जोड्ने' : 'Shoulder Join',
        pieces: 30,
        completed: 25,
        rate: 2.50
      }
    },
    {
      id: 'op_002',
      username: 'sita.devi',
      name: isNepali ? 'सीता देवी' : 'Sita Devi',
      role: 'operator',
      speciality: 'flatlock',
      specialityNepali: 'फ्ल्यालक',
      experience: 3,
      efficiency: 88,
      qualityScore: 94,
      station: 'flatlock_01',
      shift: 'morning',
      employeeId: 'EMP002',
      joinDate: '2021-03-10',
      skills: ['hem_fold', 'neckline', 'binding'],
      preferences: {
        language: 'np',
        notifications: true,
        autoAssign: true
      },
      stats: {
        todayPieces: 72,
        todayEarnings: 201.60,
        weeklyPieces: 456,
        weeklyEarnings: 1276.80,
        monthlyPieces: 2016,
        monthlyEarnings: 5644.80
      },
      currentWork: null
    },
    {
      id: 'op_003',
      username: 'hari.bahadur',
      name: isNepali ? 'हरि बहादुर' : 'Hari Bahadur',
      role: 'operator',
      speciality: 'single_needle',
      specialityNepali: 'एकल सुई',
      experience: 7,
      efficiency: 90,
      qualityScore: 98,
      station: 'single_needle_01',
      shift: 'morning',
      employeeId: 'EMP003',
      joinDate: '2019-05-20',
      skills: ['placket', 'buttonhole', 'top_stitch'],
      preferences: {
        language: 'np',
        notifications: true,
        autoAssign: false
      },
      stats: {
        todayPieces: 95,
        todayEarnings: 285.00,
        weeklyPieces: 612,
        weeklyEarnings: 1836.00,
        monthlyPieces: 2856,
        monthlyEarnings: 7140.00
      },
      currentWork: {
        bundleId: 'bundle_003',
        articleNumber: '6635',
        operation: isNepali ? 'प्लाकेट' : 'Placket',
        pieces: 40,
        completed: 35,
        rate: 1.90
      }
    },
    {
      id: 'op_004',
      username: 'mina.tamang',
      name: isNepali ? 'मिना तामाङ' : 'Mina Tamang',
      role: 'operator',
      speciality: 'overlock',
      specialityNepali: 'ओभरलक',
      experience: 2,
      efficiency: 78,
      qualityScore: 92,
      station: 'overlock_02',
      shift: 'morning',
      employeeId: 'EMP004',
      joinDate: '2022-08-10',
      skills: ['side_seam', 'hem_fold'],
      preferences: {
        language: 'np',
        notifications: true,
        autoAssign: true
      },
      stats: {
        todayPieces: 58,
        todayEarnings: 162.40,
        weeklyPieces: 378,
        weeklyEarnings: 1058.40,
        monthlyPieces: 1680,
        monthlyEarnings: 4704.00
      },
      currentWork: null
    },
    {
      id: 'op_005',
      username: 'kumar.gurung',
      name: isNepali ? 'कुमार गुरुङ' : 'Kumar Gurung',
      role: 'operator',
      speciality: 'buttonhole',
      specialityNepali: 'बटनहोल',
      experience: 4,
      efficiency: 85,
      qualityScore: 95,
      station: 'buttonhole_01',
      shift: 'morning',
      employeeId: 'EMP005',
      joinDate: '2020-12-15',
      skills: ['buttonhole', 'button_attach'],
      preferences: {
        language: 'np',
        notifications: true,
        autoAssign: false
      },
      stats: {
        todayPieces: 45,
        todayEarnings: 180.00,
        weeklyPieces: 315,
        weeklyEarnings: 1260.00,
        monthlyPieces: 1350,
        monthlyEarnings: 5400.00
      },
      currentWork: {
        bundleId: 'bundle_005',
        articleNumber: '2233',
        operation: isNepali ? 'बटनहोल' : 'Buttonhole',
        pieces: 20,
        completed: 15,
        rate: 4.00
      }
    },
    {
      id: 'sup_001',
      username: 'hari.supervisor',
      name: isNepali ? 'हरि बहादुर सुपरभाइजर' : 'Hari Bahadur Supervisor',
      role: 'supervisor',
      department: 'production_line_1',
      experience: 8,
      employeeId: 'SUP001',
      joinDate: '2018-06-01',
      permissions: ['assign_work', 'view_reports', 'manage_quality', 'view_line_status'],
      preferences: {
        language: 'np',
        notifications: true
      },
      lineAssigned: 'line_1',
      operatorsManaged: 25,
      stats: {
        lineEfficiency: 87,
        dailyProduction: 2450,
        qualityScore: 94,
        onTimeDelivery: 96
      }
    },
    {
      id: 'sup_002',
      username: 'gita.supervisor',
      name: isNepali ? 'गीता शर्मा सुपरभाइजर' : 'Gita Sharma Supervisor',
      role: 'supervisor',
      department: 'production_line_2',
      experience: 6,
      employeeId: 'SUP002',
      joinDate: '2019-03-15',
      permissions: ['assign_work', 'view_reports', 'manage_quality', 'view_line_status'],
      preferences: {
        language: 'np',
        notifications: true
      },
      lineAssigned: 'line_2',
      operatorsManaged: 25,
      stats: {
        lineEfficiency: 91,
        dailyProduction: 2680,
        qualityScore: 97,
        onTimeDelivery: 98
      }
    },
    {
      id: 'mgr_001',
      username: 'admin.manager',
      name: isNepali ? 'उत्पादन व्यवस्थापक' : 'Production Manager',
      role: 'manager',
      department: 'production',
      experience: 12,
      employeeId: 'MGR001',
      joinDate: '2015-01-01',
      permissions: ['all'],
      preferences: {
        language: 'en',
        notifications: true
      },
      stats: {
        totalEmployees: 50,
        dailyProduction: 5130,
        monthlyRevenue: 2850000,
        overallEfficiency: 89,
        qualityScore: 95.5
      }
    },
    {
      id: 'mgr_002',
      username: 'quality.manager',
      name: isNepali ? 'गुणस्तर व्यवस्थापक' : 'Quality Manager',
      role: 'manager',
      department: 'quality',
      experience: 10,
      employeeId: 'QMG001',
      joinDate: '2016-08-01',
      permissions: ['manage_quality', 'view_reports', 'quality_analysis'],
      preferences: {
        language: 'np',
        notifications: true
      },
      stats: {
        qualityScore: 96.2,
        defectRate: 3.8,
        reworkRate: 2.1,
        customerComplaints: 0.5
      }
    }
  ];

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      setLoading(true);
      try {
        // Check localStorage for saved session
        const savedUser = localStorage.getItem('garmentErpUser');
        const savedToken = localStorage.getItem('garmentErpToken');
        
        if (savedUser && savedToken) {
          const userData = JSON.parse(savedUser);
          
          // Validate token (in real app, verify with server)
          const tokenValid = await validateToken(savedToken);
          
          if (tokenValid) {
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            // Clear invalid session
            localStorage.removeItem('garmentErpUser');
            localStorage.removeItem('garmentErpToken');
          }
        } else {
          // Check sessionStorage for session-only login
          const sessionUser = sessionStorage.getItem('garmentErpUser');
          const sessionToken = sessionStorage.getItem('garmentErpToken');
          
          if (sessionUser && sessionToken) {
            const userData = JSON.parse(sessionUser);
            const tokenValid = await validateToken(sessionToken);
            
            if (tokenValid) {
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              sessionStorage.removeItem('garmentErpUser');
              sessionStorage.removeItem('garmentErpToken');
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Clear potentially corrupted session
        localStorage.removeItem('garmentErpUser');
        localStorage.removeItem('garmentErpToken');
        sessionStorage.removeItem('garmentErpUser');
        sessionStorage.removeItem('garmentErpToken');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Validate token (mock implementation)
  const validateToken = async (token) => {
    try {
      // Simulate API call to validate token
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if token is expired (simple check)
      const tokenData = JSON.parse(atob(token.split('.')[1] || '{}'));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return tokenData.exp > currentTime;
    } catch (error) {
      return false;
    }
  };

  // Login function
  const login = async (username, password, rememberMe = false) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user in mock data
      const foundUser = mockUsers.find(u => u.username === username);
      
      if (!foundUser) {
        throw new Error(isNepali ? 'प्रयोगकर्ता फेला परेन' : 'User not found');
      }
      
      // Simple password check (in real app, this would be handled by Firebase Auth)
      if (password !== 'password123') {
        throw new Error(isNepali ? 'गलत पासवर्ड' : 'Invalid password');
      }
      
      // Create mock JWT token
      const token = createMockToken(foundUser);
      
      // Save to localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem('garmentErpUser', JSON.stringify(foundUser));
        localStorage.setItem('garmentErpToken', token);
      } else {
        // Save to sessionStorage for session-only login
        sessionStorage.setItem('garmentErpUser', JSON.stringify(foundUser));
        sessionStorage.setItem('garmentErpToken', token);
      }
      
      setUser(foundUser);
      setIsAuthenticated(true);
      
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
      
      // Clear all storage
      localStorage.removeItem('garmentErpUser');
      localStorage.removeItem('garmentErpToken');
      sessionStorage.removeItem('garmentErpUser');
      sessionStorage.removeItem('garmentErpToken');
      
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
      
      // Update storage
      const storage = localStorage.getItem('garmentErpUser') ? localStorage : sessionStorage;
      storage.setItem('garmentErpUser', JSON.stringify(updatedUser));
      
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
        
        // Update storage
        const storage = localStorage.getItem('garmentErpUser') ? localStorage : sessionStorage;
        storage.setItem('garmentErpUser', JSON.stringify(updatedUser));
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
      
      // Update storage
      const storage = localStorage.getItem('garmentErpUser') ? localStorage : sessionStorage;
      storage.setItem('garmentErpUser', JSON.stringify(updatedUser));
      
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
      
      // Update storage
      const storage = localStorage.getItem('garmentErpUser') ? localStorage : sessionStorage;
      storage.setItem('garmentErpUser', JSON.stringify(updatedUser));
      
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
  }, [isAuthenticated]);

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