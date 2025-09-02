import config from '../../config/config';
import logger from '../../utils/logger';
import CacheManager from '../cache/CacheManager';

class ApiClient {
  constructor() {
    this.baseUrl = config.get('apiUrl');
    this.timeout = config.get('api.timeout');
    this.retryAttempts = config.get('api.retryAttempts');
    this.retryDelay = config.get('api.retryDelay');
    this.cache = new CacheManager();
    this.interceptors = {
      request: [],
      response: [],
      error: []
    };
  }

  // Add request interceptor
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  // Add response interceptor
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  // Add error interceptor
  addErrorInterceptor(interceptor) {
    this.interceptors.error.push(interceptor);
  }

  // Build request options
  async buildRequestOptions(options = {}) {
    let requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Apply request interceptors
    for (const interceptor of this.interceptors.request) {
      requestOptions = await interceptor(requestOptions);
    }

    return requestOptions;
  }

  // Make request with retry logic
  async makeRequest(url, options, retryCount = 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (retryCount < this.retryAttempts) {
        logger.warn(`Request failed, retrying...`, {
          url,
          attempt: retryCount + 1,
          maxAttempts: this.retryAttempts
        });

        await this.delay(this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        return this.makeRequest(url, options, retryCount + 1);
      }

      throw error;
    }
  }

  // Delay helper for retry logic
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // GET request
  async get(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const cacheKey = `GET:${url}`;

    // Check cache
    if (options.cache !== false) {
      const cachedData = this.cache.get(cacheKey);
      if (cachedData) {
        logger.debug('Cache hit', { url });
        return cachedData;
      }
    }

    const requestOptions = await this.buildRequestOptions({
      method: 'GET',
      ...options
    });

    try {
      const response = await this.makeRequest(url, requestOptions);
      let data = await response.json();

      // Apply response interceptors
      for (const interceptor of this.interceptors.response) {
        data = await interceptor(data, response);
      }

      // Cache the response
      if (options.cache !== false) {
        this.cache.set(cacheKey, data, options.cacheTTL);
      }

      logger.info('API GET success', { url });
      return data;
    } catch (error) {
      // Apply error interceptors
      for (const interceptor of this.interceptors.error) {
        await interceptor(error, url, options);
      }

      logger.error('API GET failed', { url, error: error.message });
      throw error;
    }
  }

  // POST request
  async post(endpoint, data, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const requestOptions = await this.buildRequestOptions({
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });

    try {
      const response = await this.makeRequest(url, requestOptions);
      let responseData = await response.json();

      // Apply response interceptors
      for (const interceptor of this.interceptors.response) {
        responseData = await interceptor(responseData, response);
      }

      // Invalidate related cache
      this.cache.invalidatePattern(endpoint);

      logger.info('API POST success', { url });
      return responseData;
    } catch (error) {
      // Apply error interceptors
      for (const interceptor of this.interceptors.error) {
        await interceptor(error, url, options);
      }

      logger.error('API POST failed', { url, error: error.message });
      throw error;
    }
  }

  // PUT request
  async put(endpoint, data, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const requestOptions = await this.buildRequestOptions({
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });

    try {
      const response = await this.makeRequest(url, requestOptions);
      let responseData = await response.json();

      // Apply response interceptors
      for (const interceptor of this.interceptors.response) {
        responseData = await interceptor(responseData, response);
      }

      // Invalidate related cache
      this.cache.invalidatePattern(endpoint);

      logger.info('API PUT success', { url });
      return responseData;
    } catch (error) {
      // Apply error interceptors
      for (const interceptor of this.interceptors.error) {
        await interceptor(error, url, options);
      }

      logger.error('API PUT failed', { url, error: error.message });
      throw error;
    }
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const requestOptions = await this.buildRequestOptions({
      method: 'DELETE',
      ...options
    });

    try {
      const response = await this.makeRequest(url, requestOptions);
      let responseData = null;
      
      if (response.headers.get('content-length') !== '0') {
        responseData = await response.json();
      }

      // Apply response interceptors
      for (const interceptor of this.interceptors.response) {
        responseData = await interceptor(responseData, response);
      }

      // Invalidate related cache
      this.cache.invalidatePattern(endpoint);

      logger.info('API DELETE success', { url });
      return responseData;
    } catch (error) {
      // Apply error interceptors
      for (const interceptor of this.interceptors.error) {
        await interceptor(error, url, options);
      }

      logger.error('API DELETE failed', { url, error: error.message });
      throw error;
    }
  }

  // Batch requests
  async batch(requests) {
    const promises = requests.map(request => {
      const { method, endpoint, data, options } = request;
      
      switch (method.toUpperCase()) {
        case 'GET':
          return this.get(endpoint, options);
        case 'POST':
          return this.post(endpoint, data, options);
        case 'PUT':
          return this.put(endpoint, data, options);
        case 'DELETE':
          return this.delete(endpoint, options);
        default:
          return Promise.reject(new Error(`Unsupported method: ${method}`));
      }
    });

    return Promise.allSettled(promises);
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.get('/health', { cache: false });
      return { status: 'healthy', data: response };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }
}

export default ApiClient;