import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Database, 
  Wifi, 
  Server, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Clock,
  HardDrive,
  Zap,
  Globe,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { db, collection, getDocs, connectionsCount } from '../../config/firebase';

const SystemHealthCheck = () => {
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const isNepali = currentLanguage === 'np';

  const [healthStatus, setHealthStatus] = useState({
    overall: 'checking',
    services: [],
    lastUpdated: null,
    uptime: 0
  });
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    performHealthCheck();
    
    // Auto-refresh every 30 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(performHealthCheck, 30000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const performHealthCheck = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const services = await Promise.allSettled([
        checkFirebaseConnection(),
        checkDatabaseHealth(),
        checkAuthService(),
        checkStorageService(),
        checkNetworkLatency(),
        checkUserSessions(),
        checkSystemResources(),
        checkSecurityStatus()
      ]);

      const serviceResults = services.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            name: getServiceName(index),
            status: 'error',
            responseTime: 0,
            error: result.reason.message,
            details: 'Service check failed'
          };
        }
      });

      // Calculate overall health
      const healthyServices = serviceResults.filter(service => service.status === 'healthy').length;
      const totalServices = serviceResults.length;
      const healthPercentage = (healthyServices / totalServices) * 100;
      
      let overallStatus = 'healthy';
      if (healthPercentage < 60) overallStatus = 'critical';
      else if (healthPercentage < 80) overallStatus = 'warning';

      setHealthStatus({
        overall: overallStatus,
        services: serviceResults,
        lastUpdated: new Date(),
        uptime: Date.now() - startTime,
        healthPercentage: Math.round(healthPercentage)
      });

    } catch (error) {
      console.error('Health check failed:', error);
      setHealthStatus(prev => ({
        ...prev,
        overall: 'error',
        lastUpdated: new Date()
      }));
    } finally {
      setLoading(false);
    }
  };

  const getServiceName = (index) => {
    const names = [
      'Firebase Connection',
      'Database Health', 
      'Auth Service',
      'Storage Service',
      'Network Latency',
      'User Sessions',
      'System Resources',
      'Security Status'
    ];
    return names[index] || 'Unknown Service';
  };

  const checkFirebaseConnection = async () => {
    const startTime = Date.now();
    try {
      // Simple connection test
      const testCollection = collection(db, 'systemHealth');
      const testQuery = await getDocs(testCollection);
      
      return {
        name: 'Firebase Connection',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: `Connected successfully`,
        icon: Database,
        color: 'text-green-600'
      };
    } catch (error) {
      return {
        name: 'Firebase Connection',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message,
        details: 'Connection failed',
        icon: Database,
        color: 'text-red-600'
      };
    }
  };

  const checkDatabaseHealth = async () => {
    const startTime = Date.now();
    try {
      // Check multiple collections
      const collections = ['operators', 'bundles', 'workItems', 'locationLogs'];
      const promises = collections.map(col => getDocs(collection(db, col)));
      const results = await Promise.all(promises);
      
      const totalDocs = results.reduce((sum, snapshot) => sum + snapshot.size, 0);
      
      return {
        name: 'Database Health',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: `${totalDocs} documents across ${collections.length} collections`,
        metrics: { totalDocuments: totalDocs, collections: collections.length },
        icon: HardDrive,
        color: 'text-blue-600'
      };
    } catch (error) {
      return {
        name: 'Database Health',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message,
        details: 'Database query failed',
        icon: HardDrive,
        color: 'text-red-600'
      };
    }
  };

  const checkAuthService = async () => {
    const startTime = Date.now();
    try {
      // Check if current user is authenticated
      const isAuthenticated = !!user;
      const hasValidToken = user && user.id;
      
      return {
        name: 'Authentication Service',
        status: isAuthenticated && hasValidToken ? 'healthy' : 'warning',
        responseTime: Date.now() - startTime,
        details: isAuthenticated ? `User: ${user.name} (${user.role})` : 'No active user',
        metrics: { authenticated: isAuthenticated, hasToken: hasValidToken },
        icon: Shield,
        color: isAuthenticated ? 'text-green-600' : 'text-yellow-600'
      };
    } catch (error) {
      return {
        name: 'Authentication Service',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message,
        details: 'Auth check failed',
        icon: Shield,
        color: 'text-red-600'
      };
    }
  };

  const checkStorageService = async () => {
    const startTime = Date.now();
    try {
      // Check localStorage availability
      const testKey = 'healthcheck_' + Date.now();
      localStorage.setItem(testKey, 'test');
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      const storageWorking = retrieved === 'test';
      
      return {
        name: 'Storage Service',
        status: storageWorking ? 'healthy' : 'warning',
        responseTime: Date.now() - startTime,
        details: storageWorking ? 'Local storage working' : 'Storage issues detected',
        icon: Server,
        color: storageWorking ? 'text-green-600' : 'text-yellow-600'
      };
    } catch (error) {
      return {
        name: 'Storage Service',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message,
        details: 'Storage unavailable',
        icon: Server,
        color: 'text-red-600'
      };
    }
  };

  const checkNetworkLatency = async () => {
    const startTime = Date.now();
    try {
      // Simple network test using fetch to a reliable endpoint
      const response = await fetch('https://www.google.com/favicon.ico', { 
        mode: 'no-cors',
        cache: 'no-cache'
      });
      
      const latency = Date.now() - startTime;
      let status = 'healthy';
      if (latency > 2000) status = 'warning';
      if (latency > 5000) status = 'error';
      
      return {
        name: 'Network Latency',
        status,
        responseTime: latency,
        details: `${latency}ms response time`,
        metrics: { latency },
        icon: Globe,
        color: status === 'healthy' ? 'text-green-600' : status === 'warning' ? 'text-yellow-600' : 'text-red-600'
      };
    } catch (error) {
      return {
        name: 'Network Latency',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message,
        details: 'Network unreachable',
        icon: Globe,
        color: 'text-red-600'
      };
    }
  };

  const checkUserSessions = async () => {
    const startTime = Date.now();
    try {
      // Get active operators (simplified check)
      const operatorsSnapshot = await getDocs(collection(db, 'operators'));
      const supervisorsSnapshot = await getDocs(collection(db, 'supervisors'));
      
      const activeOperators = operatorsSnapshot.size;
      const activeSupervisors = supervisorsSnapshot.size;
      const totalUsers = activeOperators + activeSupervisors;
      
      return {
        name: 'User Sessions',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        details: `${totalUsers} registered users (${activeOperators} operators, ${activeSupervisors} supervisors)`,
        metrics: { operators: activeOperators, supervisors: activeSupervisors, total: totalUsers },
        icon: Users,
        color: 'text-green-600'
      };
    } catch (error) {
      return {
        name: 'User Sessions',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message,
        details: 'Unable to check user sessions',
        icon: Users,
        color: 'text-red-600'
      };
    }
  };

  const checkSystemResources = async () => {
    const startTime = Date.now();
    try {
      // Check browser resources
      const memory = performance.memory;
      const connection = navigator.connection;
      
      const memoryUsage = memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : 0;
      const memoryLimit = memory ? Math.round(memory.jsHeapSizeLimit / 1024 / 1024) : 0;
      const memoryPercent = memory ? Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) : 0;
      
      let status = 'healthy';
      if (memoryPercent > 80) status = 'warning';
      if (memoryPercent > 95) status = 'error';
      
      return {
        name: 'System Resources',
        status,
        responseTime: Date.now() - startTime,
        details: `Memory: ${memoryUsage}MB / ${memoryLimit}MB (${memoryPercent}%)`,
        metrics: { 
          memoryUsage, 
          memoryLimit, 
          memoryPercent,
          connectionType: connection?.effectiveType || 'unknown'
        },
        icon: Zap,
        color: status === 'healthy' ? 'text-green-600' : status === 'warning' ? 'text-yellow-600' : 'text-red-600'
      };
    } catch (error) {
      return {
        name: 'System Resources',
        status: 'warning',
        responseTime: Date.now() - startTime,
        error: error.message,
        details: 'Resource monitoring unavailable',
        icon: Zap,
        color: 'text-yellow-600'
      };
    }
  };

  const checkSecurityStatus = async () => {
    const startTime = Date.now();
    try {
      // Basic security checks
      const isHTTPS = location.protocol === 'https:';
      const hasSecureContext = window.isSecureContext;
      const serviceWorkerSupported = 'serviceWorker' in navigator;
      
      let status = 'healthy';
      let issues = [];
      
      if (!isHTTPS && location.hostname !== 'localhost') {
        status = 'warning';
        issues.push('Not using HTTPS');
      }
      
      if (!hasSecureContext) {
        status = 'warning';
        issues.push('No secure context');
      }
      
      return {
        name: 'Security Status',
        status,
        responseTime: Date.now() - startTime,
        details: issues.length > 0 ? `Issues: ${issues.join(', ')}` : 'All security checks passed',
        metrics: { 
          isHTTPS, 
          hasSecureContext, 
          serviceWorkerSupported,
          issues: issues.length
        },
        icon: Shield,
        color: status === 'healthy' ? 'text-green-600' : 'text-yellow-600'
      };
    } catch (error) {
      return {
        name: 'Security Status',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message,
        details: 'Security check failed',
        icon: Shield,
        color: 'text-red-600'
      };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'checking': return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      default: return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'checking': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatUptime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            healthStatus.overall === 'healthy' ? 'bg-green-100' :
            healthStatus.overall === 'warning' ? 'bg-yellow-100' :
            healthStatus.overall === 'error' ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            <Activity className={`w-6 h-6 ${
              healthStatus.overall === 'healthy' ? 'text-green-600' :
              healthStatus.overall === 'warning' ? 'text-yellow-600' :
              healthStatus.overall === 'error' ? 'text-red-600' : 'text-blue-600'
            }`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNepali ? 'सिस्टम स्वास्थ्य जाँच' : 'System Health Check'}
            </h1>
            <p className="text-gray-600">
              {isNepali ? 'रियल-टाइम सिस्टम मनिटरिंग र निदान' : 'Real-time system monitoring and diagnostics'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-600">
              {isNepali ? 'स्वचालित रिफ्रेस' : 'Auto Refresh'}
            </span>
          </label>
          
          <button
            onClick={performHealthCheck}
            disabled={loading}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{isNepali ? 'जाँच गर्नुहोस्' : 'Check Now'}</span>
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className="bg-white rounded-2xl shadow-sm border mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              {getStatusIcon(healthStatus.overall)}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              {isNepali ? 'समग्र स्थिति' : 'Overall Status'}
            </h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(healthStatus.overall)}`}>
              {healthStatus.overall?.toUpperCase() || 'CHECKING'}
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {healthStatus.healthPercentage || 0}%
            </div>
            <p className="text-gray-600">
              {isNepali ? 'स्वास्थ्य स्कोर' : 'Health Score'}
            </p>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {healthStatus.services.filter(s => s.status === 'healthy').length}
            </div>
            <p className="text-gray-600">
              {isNepali ? 'स्वस्थ सेवाहरू' : 'Healthy Services'}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-gray-600" />
            </div>
            <p className="font-semibold text-gray-800">
              {healthStatus.lastUpdated ? 
                healthStatus.lastUpdated.toLocaleTimeString() : 
                '--:--'
              }
            </p>
            <p className="text-sm text-gray-600">
              {isNepali ? 'अन्तिम जाँच' : 'Last Check'}
            </p>
          </div>
        </div>
      </div>

      {/* Services Status */}
      <div className="bg-white rounded-2xl shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {isNepali ? 'सेवा विवरण' : 'Service Details'}
          </h2>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {healthStatus.services.map((service, index) => {
              const IconComponent = service.icon || Activity;
              return (
                <div key={index} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`w-6 h-6 ${service.color || 'text-gray-600'}`} />
                      <div>
                        <h3 className="font-semibold text-gray-800">{service.name}</h3>
                        <p className="text-sm text-gray-600">{service.details}</p>
                      </div>
                    </div>
                    {getStatusIcon(service.status)}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className={`px-2 py-1 rounded border ${getStatusColor(service.status)}`}>
                      {service.status?.toUpperCase()}
                    </span>
                    <span className="text-gray-500">
                      {service.responseTime}ms
                    </span>
                  </div>

                  {service.error && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      <strong>{isNepali ? 'त्रुटि:' : 'Error:'}</strong> {service.error}
                    </div>
                  )}

                  {service.metrics && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                      <strong>{isNepali ? 'मेट्रिक्स:' : 'Metrics:'}</strong>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {Object.entries(service.metrics).map(([key, value]) => (
                          <span key={key} className="bg-white px-2 py-1 rounded border">
                            {key}: {typeof value === 'number' ? value.toLocaleString() : value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthCheck;