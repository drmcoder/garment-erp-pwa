/**
 * API Service for Garment ERP PWA
 * Integrates with Netlify Functions backend
 */

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || '/api';
    this.token = localStorage.getItem('authToken');
    
    // Request timeout (30 seconds)
    this.timeout = 30000;
  }

  // Helper method for making requests
  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please check your connection');
      }
      
      throw error;
    }
  }

  // =====================================================
  // AUTHENTICATION METHODS
  // =====================================================

  async login(username, password, role = 'operator', rememberMe = false) {
    const data = await this.makeRequest(`${this.baseURL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ username, password, role, rememberMe }),
    });

    if (data.success && data.token) {
      this.token = data.token;
      localStorage.setItem('authToken', data.token);
      
      if (rememberMe) {
        localStorage.setItem('garment_erp_user', JSON.stringify(data.user));
      }
    }

    return data;
  }

  async logout() {
    try {
      await this.makeRequest(`${this.baseURL}/auth/logout`, {
        method: 'POST',
      });
    } catch (error) {
      console.warn('Logout request failed:', error.message);
    } finally {
      this.token = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('garment_erp_user');
    }

    return { success: true };
  }

  async verifyToken() {
    if (!this.token) {
      throw new Error('No token available');
    }

    const data = await this.makeRequest(`${this.baseURL}/auth/verify`);
    return data;
  }

  async refreshToken() {
    const data = await this.makeRequest(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
    });

    if (data.success && data.token) {
      this.token = data.token;
      localStorage.setItem('authToken', data.token);
    }

    return data;
  }

  // =====================================================
  // BUNDLE MANAGEMENT METHODS
  // =====================================================

  async getBundles(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `${this.baseURL}/bundles?${queryParams}` : `${this.baseURL}/bundles`;
    
    return await this.makeRequest(url);
  }

  async getBundleById(bundleId) {
    return await this.makeRequest(`${this.baseURL}/bundles/${bundleId}`);
  }

  async createBundle(bundleData) {
    return await this.makeRequest(`${this.baseURL}/bundles`, {
      method: 'POST',
      body: JSON.stringify(bundleData),
    });
  }

  async updateBundle(bundleId, updateData) {
    return await this.makeRequest(`${this.baseURL}/bundles/${bundleId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteBundle(bundleId) {
    return await this.makeRequest(`${this.baseURL}/bundles/${bundleId}`, {
      method: 'DELETE',
    });
  }

  // Specialized bundle methods
  async assignBundle(bundleId, operatorId) {
    return await this.updateBundle(bundleId, {
      assignedOperator: operatorId,
      status: 'assigned',
    });
  }

  async startBundle(bundleId) {
    return await this.updateBundle(bundleId, {
      status: 'in-progress',
      startTime: new Date().toISOString(),
    });
  }

  async pauseBundle(bundleId) {
    return await this.updateBundle(bundleId, {
      status: 'paused',
    });
  }

  async completeBundle(bundleId, completionData) {
    return await this.updateBundle(bundleId, {
      status: 'completed',
      completedPieces: completionData.completedPieces,
      defectivePieces: completionData.defectivePieces || 0,
      qualityStatus: completionData.qualityGood ? 'pass' : 'fail',
      actualTime: completionData.actualTime,
    });
  }

  // =====================================================
  // NOTIFICATION METHODS
  // =====================================================

  async getNotifications(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `${this.baseURL}/notifications?${queryParams}` : `${this.baseURL}/notifications`;
    
    return await this.makeRequest(url);
  }

  async getUnreadNotifications(userId, role) {
    return await this.getNotifications({
      userId,
      role,
      unreadOnly: true,
    });
  }

  async markNotificationAsRead(notificationId) {
    return await this.makeRequest(`${this.baseURL}/notifications/${notificationId}`, {
      method: 'PUT',
    });
  }

  async createNotification(notificationData) {
    return await this.makeRequest(`${this.baseURL}/notifications`, {
      method: 'POST',
      body: JSON.stringify(notificationData),
    });
  }

  async deleteNotification(notificationId) {
    return await this.makeRequest(`${this.baseURL}/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  // =====================================================
  // QUALITY CONTROL METHODS (Placeholder)
  // =====================================================

  async reportQualityIssue(issueData) {
    // This will connect to quality.mts when implemented
    return await this.makeRequest(`${this.baseURL}/quality`, {
      method: 'POST',
      body: JSON.stringify(issueData),
    });
  }

  async getQualityIssues(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const url = queryParams ? `${this.baseURL}/quality?${queryParams}` : `${this.baseURL}/quality`;
    
    return await this.makeRequest(url);
  }

  // =====================================================
  // PRODUCTION STATISTICS METHODS (Placeholder)
  // =====================================================

  async getTodayStats() {
    return await this.makeRequest(`${this.baseURL}/production/today`);
  }

  async getDailyStats(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    
    const queryString = params.toString();
    const url = queryString ? `${this.baseURL}/production/daily?${queryString}` : `${this.baseURL}/production/daily`;
    
    return await this.makeRequest(url);
  }

  async getOperatorStats(operatorId, date) {
    const params = new URLSearchParams();
    if (operatorId) params.set('operatorId', operatorId);
    if (date) params.set('date', date);
    
    const queryString = params.toString();
    const url = queryString ? `${this.baseURL}/production/operator?${queryString}` : `${this.baseURL}/production/operator`;
    
    return await this.makeRequest(url);
  }

  // =====================================================
  // UTILITY METHODS
  // =====================================================

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Get stored user data
  getStoredUser() {
    try {
      const userData = localStorage.getItem('garment_erp_user');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      return null;
    }
  }

  // Clear all stored data
  clearStorage() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('garment_erp_user');
    this.token = null;
  }

  // Handle API errors consistently
  handleError(error) {
    console.error('API Error:', error);
    
    // If token expired, redirect to login
    if (error.message.includes('token expired') || error.message.includes('401')) {
      this.clearStorage();
      window.location.href = '/login';
      return;
    }

    // Show user-friendly error messages
    const friendlyMessages = {
      'Network request failed': 'कनेक्सन समस्या / Connection problem',
      'Request timeout': 'अनुरोध ढिलो / Request timeout',
      'Internal server error': 'सर्भर त्रुटि / Server error',
    };

    return friendlyMessages[error.message] || error.message;
  }

  // =====================================================
  // DEMO/TESTING METHODS
  // =====================================================

  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/auth/verify`);
      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Connection successful' : 'Connection failed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Unable to connect to server'
      };
    }
  }

  // Get API status and health
  async getApiStatus() {
    const endpoints = [
      '/auth/verify',
      '/bundles',
      '/notifications',
    ];

    const results = await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        try {
          const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'HEAD', // Just check if endpoint exists
          });
          return { endpoint, status: response.status, ok: response.ok };
        } catch (error) {
          return { endpoint, error: error.message, ok: false };
        }
      })
    );

    return {
      baseURL: this.baseURL,
      timestamp: new Date().toISOString(),
      endpoints: results.map(result => result.value),
    };
  }
}

// Create and export singleton instance
const apiService = new ApiService();
export default apiService;