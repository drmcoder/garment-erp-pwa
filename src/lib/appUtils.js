// src/lib/appUtils.js
// Centralized application utility functions and common logic


// Role-based utilities
export const roleUtils = {
  isOperator: (userRole) => userRole === 'operator',
  isSupervisor: (userRole) => userRole === 'supervisor',
  isManager: (userRole) => userRole === 'manager' || userRole === 'management',
  isAdmin: (userRole) => userRole === 'admin',
  
  hasManagementAccess: (userRole) => {
    return ['manager', 'management', 'admin'].includes(userRole);
  },
  
  canAssignWork: (userRole) => {
    return ['supervisor', 'manager', 'management', 'admin'].includes(userRole);
  },
  
  canManageUsers: (userRole) => {
    return ['admin', 'manager', 'management'].includes(userRole);
  }
};

// Status checking utilities
export const statusUtils = {
  isCompleted: (status) => status === 'completed',
  isPending: (status) => status === 'pending',
  isInProgress: (status) => status === 'in_progress' || status === 'active',
  isActive: (status) => status === 'active',
  isInactive: (status) => status === 'inactive'
};

// Environment utilities
export const envUtils = {
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isProduction: () => process.env.NODE_ENV === 'production',
  isStaging: () => process.env.REACT_APP_ENVIRONMENT === 'staging',
  
  getApiUrl: () => {
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    
    const hostname = window.location.hostname;
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      return 'http://localhost:3001/api';
    } else if (hostname.includes('staging') || hostname.includes('dev--')) {
      return 'https://staging--garment-erp-nepal.netlify.app/api';
    } else {
      return 'https://garment-erp-nepal.netlify.app/api';
    }
  }
};

// Array manipulation utilities
export const arrayUtils = {
  findById: (array, id) => array.find(item => item.id === id),
  findByKey: (array, key, value) => array.find(item => item[key] === value),
  sortByKey: (array, key, ascending = true) => {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (ascending) {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  },
  groupBy: (array, key) => {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },
  filterByStatus: (array, status) => array.filter(item => item.status === status),
  filterByRole: (array, role) => array.filter(item => item.role === role)
};

// Date utilities
export const dateUtils = {
  formatDate: (date, locale = 'en-US') => {
    return new Date(date).toLocaleDateString(locale);
  },
  
  formatDateTime: (date, locale = 'en-US') => {
    return new Date(date).toLocaleString(locale);
  },
  
  isToday: (date) => {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate.toDateString() === today.toDateString();
  },
  
  isThisWeek: (date) => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const checkDate = new Date(date);
    return checkDate >= weekAgo && checkDate <= today;
  },
  
  getRelativeTime: (date) => {
    const now = Date.now();
    const diffMs = now - new Date(date).getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return dateUtils.formatDate(date);
  }
};

// Validation utilities
export const validationUtils = {
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  isPhoneNumber: (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{7,}$/;
    return phoneRegex.test(phone);
  },
  
  isNotEmpty: (value) => {
    return value !== null && value !== undefined && value.toString().trim() !== '';
  },
  
  isValidId: (id) => {
    return typeof id === 'string' && id.length > 0 && !id.includes(' ');
  },
  
  isPositiveNumber: (num) => {
    return typeof num === 'number' && num > 0;
  }
};

// URL utilities
export const urlUtils = {
  createSearchParams: (params) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        searchParams.set(key, value.toString());
      }
    });
    return searchParams.toString();
  },
  
  parseSearchParams: (searchString = window.location.search) => {
    const params = new URLSearchParams(searchString);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  },
  
  addQueryParam: (url, key, value) => {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${key}=${encodeURIComponent(value)}`;
  }
};

// Local storage utilities with error handling
export const storageUtils = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
      return false;
    }
  },
  
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
      return defaultValue;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
      return false;
    }
  }
};

// Format utilities
export const formatUtils = {
  currency: (amount, currency = 'NPR', locale = 'en-NP') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency
    }).format(amount);
  },
  
  percentage: (value, decimals = 1) => {
    return `${(value * 100).toFixed(decimals)}%`;
  },
  
  number: (value, decimals = 0) => {
    return Number(value).toFixed(decimals);
  },
  
  fileSize: (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
};

// Debounce and throttle utilities
export const performanceUtils = {
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  throttle: (func, wait) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, wait);
      }
    };
  }
};

// Export all utilities as a single object for easier importing
export default {
  roleUtils,
  statusUtils,
  envUtils,
  arrayUtils,
  dateUtils,
  validationUtils,
  urlUtils,
  storageUtils,
  formatUtils,
  performanceUtils
};