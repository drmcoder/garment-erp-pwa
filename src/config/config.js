const environments = {
  development: {
    name: 'Development',
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
    firebaseConfig: {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID
    },
    features: {
      logging: true,
      debugMode: true,
      performanceMonitoring: true,
      errorReporting: true,
      analytics: false,
      mockData: false
    },
    cache: {
      enabled: true,
      ttl: 300000, // 5 minutes
      maxSize: 50 // MB
    },
    api: {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000
    }
  },
  
  staging: {
    name: 'Staging',
    apiUrl: process.env.REACT_APP_API_URL || 'https://staging-api.garment-erp.com/api',
    firebaseConfig: {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID
    },
    features: {
      logging: true,
      debugMode: false,
      performanceMonitoring: true,
      errorReporting: true,
      analytics: true,
      mockData: false
    },
    cache: {
      enabled: true,
      ttl: 600000, // 10 minutes
      maxSize: 100 // MB
    },
    api: {
      timeout: 20000,
      retryAttempts: 3,
      retryDelay: 2000
    }
  },
  
  production: {
    name: 'Production',
    apiUrl: process.env.REACT_APP_API_URL || 'https://api.garment-erp.com/api',
    firebaseConfig: {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID
    },
    features: {
      logging: false,
      debugMode: false,
      performanceMonitoring: true,
      errorReporting: true,
      analytics: true,
      mockData: false
    },
    cache: {
      enabled: true,
      ttl: 900000, // 15 minutes
      maxSize: 200 // MB
    },
    api: {
      timeout: 15000,
      retryAttempts: 5,
      retryDelay: 3000
    }
  }
};

class Config {
  constructor() {
    this.env = process.env.REACT_APP_ENV || process.env.NODE_ENV || 'development';
    this.config = environments[this.env] || environments.development;
    this.overrides = {};
  }

  get(path) {
    const keys = path.split('.');
    let value = { ...this.config, ...this.overrides };
    
    for (const key of keys) {
      value = value[key];
      if (value === undefined) {
        return undefined;
      }
    }
    
    return value;
  }

  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let obj = this.overrides;
    
    for (const key of keys) {
      if (!obj[key]) {
        obj[key] = {};
      }
      obj = obj[key];
    }
    
    obj[lastKey] = value;
  }

  getEnvironment() {
    return this.env;
  }

  isDevelopment() {
    return this.env === 'development';
  }

  isStaging() {
    return this.env === 'staging';
  }

  isProduction() {
    return this.env === 'production';
  }

  getFirebaseConfig() {
    return this.config.firebaseConfig;
  }

  getApiConfig() {
    return this.config.api;
  }

  isFeatureEnabled(feature) {
    return this.config.features[feature] || false;
  }

  getCacheConfig() {
    return this.config.cache;
  }

  getAllConfig() {
    return { ...this.config, ...this.overrides };
  }
}

const config = new Config();
export default config;