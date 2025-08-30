// Environment-specific configurations
// This allows different settings for development, staging, and production

const environments = {
  development: {
    name: 'Development',
    apiUrl: 'http://localhost:3001/api',
    firebaseConfig: 'dev', // Use dev Firebase project
    debug: true,
    enableAnalytics: false,
    enableNotifications: true,
    cacheEnabled: false,
    logLevel: 'debug',
    features: {
      damageReporting: true,
      analytics: true,
      mockData: true,
      testingPanel: true,
      demoNotifications: false  // Disable demo notifications
    }
  },
  
  staging: {
    name: 'Staging',
    apiUrl: 'https://staging--garment-erp-nepal.netlify.app/api',
    firebaseConfig: 'staging', // Use staging Firebase project
    debug: true,
    enableAnalytics: false,
    enableNotifications: true,
    cacheEnabled: true,
    logLevel: 'info',
    features: {
      damageReporting: true,
      analytics: true,
      mockData: false,
      testingPanel: true
    }
  },
  
  production: {
    name: 'Production',
    apiUrl: 'https://garment-erp-nepal.netlify.app/api',
    firebaseConfig: 'prod', // Use production Firebase project
    debug: false,
    enableAnalytics: true,
    enableNotifications: true,
    cacheEnabled: true,
    logLevel: 'error',
    features: {
      damageReporting: true,
      analytics: true,
      mockData: false,
      testingPanel: false
    }
  }
};

// Determine current environment
const getCurrentEnvironment = () => {
  // Check environment variable first
  if (process.env.REACT_APP_ENVIRONMENT) {
    return process.env.REACT_APP_ENVIRONMENT;
  }
  
  // Fallback to hostname detection
  const hostname = window.location.hostname;
  
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return 'development';
  } else if (hostname.includes('staging') || hostname.includes('dev--')) {
    return 'staging';
  } else {
    return 'production';
  }
};

// Get current environment configuration
const currentEnv = getCurrentEnvironment();
const config = environments[currentEnv] || environments.development;

// Add environment info to config
config.environment = currentEnv;
config.isDevelopment = currentEnv === 'development';
config.isStaging = currentEnv === 'staging';
config.isProduction = currentEnv === 'production';

// Add build info if available
if (process.env.REACT_APP_VERSION) {
  config.version = process.env.REACT_APP_VERSION;
}

if (process.env.REACT_APP_BUILD_TIME) {
  config.buildTime = process.env.REACT_APP_BUILD_TIME;
}

// Console log environment info in development
if (config.debug) {
  console.log('🌍 Environment:', config.name);
  console.log('🔧 Config:', config);
}

export default config;
export { environments, getCurrentEnvironment };