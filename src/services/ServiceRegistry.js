import logger from '../utils/logger';

class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
    this.middlewares = [];
  }

  // Register a service
  register(name, serviceClass, options = {}) {
    const { singleton = true, dependencies = [] } = options;
    
    this.services.set(name, {
      class: serviceClass,
      singleton,
      dependencies,
      initialized: false
    });
    
    logger.info(`Service registered: ${name}`, { singleton, dependencies });
  }

  // Get a service instance
  get(name) {
    const serviceConfig = this.services.get(name);
    
    if (!serviceConfig) {
      throw new Error(`Service not found: ${name}`);
    }

    // Return singleton if exists
    if (serviceConfig.singleton && this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Resolve dependencies
    const deps = serviceConfig.dependencies.map(depName => this.get(depName));
    
    // Create instance
    const instance = new serviceConfig.class(...deps);
    
    // Apply middlewares
    this.applyMiddlewares(instance, name);
    
    // Store singleton
    if (serviceConfig.singleton) {
      this.singletons.set(name, instance);
    }
    
    serviceConfig.initialized = true;
    return instance;
  }

  // Add middleware for all services
  use(middleware) {
    this.middlewares.push(middleware);
  }

  // Apply middlewares to service instance
  applyMiddlewares(instance, serviceName) {
    this.middlewares.forEach(middleware => {
      middleware(instance, serviceName);
    });
  }

  // Check if service exists
  has(name) {
    return this.services.has(name);
  }

  // Get all registered services
  getAll() {
    return Array.from(this.services.keys());
  }

  // Clear all services
  clear() {
    this.services.clear();
    this.singletons.clear();
    this.middlewares = [];
  }

  // Health check for all services
  async healthCheck() {
    const results = {};
    
    for (const [name, config] of this.services) {
      try {
        if (config.initialized) {
          const instance = this.get(name);
          if (typeof instance.healthCheck === 'function') {
            results[name] = await instance.healthCheck();
          } else {
            results[name] = { status: 'ok', message: 'No health check available' };
          }
        } else {
          results[name] = { status: 'not_initialized' };
        }
      } catch (error) {
        results[name] = { status: 'error', error: error.message };
      }
    }
    
    return results;
  }
}

// Create singleton instance
const serviceRegistry = new ServiceRegistry();

// Add performance monitoring middleware
serviceRegistry.use((instance, serviceName) => {
  const originalMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
    .filter(name => typeof instance[name] === 'function' && name !== 'constructor');
  
  originalMethods.forEach(methodName => {
    const originalMethod = instance[methodName];
    instance[methodName] = async function(...args) {
      const startTime = performance.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - startTime;
        
        if (duration > 1000) {
          logger.warn(`Slow operation detected`, {
            service: serviceName,
            method: methodName,
            duration: `${duration.toFixed(2)}ms`
          });
        }
        
        return result;
      } catch (error) {
        logger.error(`Service method error`, {
          service: serviceName,
          method: methodName,
          error: error.message
        });
        throw error;
      }
    };
  });
});

export default serviceRegistry;