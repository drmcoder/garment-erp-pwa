import config from '../../config/config';
import logger from '../../utils/logger';

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.config = config.getCacheConfig();
    this.maxSize = this.config.maxSize * 1024 * 1024; // Convert MB to bytes
    this.currentSize = 0;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  // Generate cache key
  generateKey(key) {
    if (typeof key === 'object') {
      return JSON.stringify(key);
    }
    return String(key);
  }

  // Get item from cache
  get(key) {
    if (!this.config.enabled) {
      return null;
    }

    const cacheKey = this.generateKey(key);
    const item = this.cache.get(cacheKey);

    if (!item) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (item.expiry && Date.now() > item.expiry) {
      this.delete(cacheKey);
      this.stats.misses++;
      return null;
    }

    // Update LRU
    item.lastAccessed = Date.now();
    this.stats.hits++;
    
    logger.debug('Cache hit', { key: cacheKey });
    return item.data;
  }

  // Set item in cache
  set(key, data, ttl = null) {
    if (!this.config.enabled) {
      return;
    }

    const cacheKey = this.generateKey(key);
    const dataSize = this.estimateSize(data);
    
    // Check if data is too large
    if (dataSize > this.maxSize) {
      logger.warn('Data too large for cache', { key: cacheKey, size: dataSize });
      return;
    }

    // Evict items if needed
    while (this.currentSize + dataSize > this.maxSize) {
      this.evictLRU();
    }

    const item = {
      data,
      size: dataSize,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      expiry: ttl ? Date.now() + (ttl || this.config.ttl) : null
    };

    // Update existing or add new
    const existingItem = this.cache.get(cacheKey);
    if (existingItem) {
      this.currentSize -= existingItem.size;
    }

    this.cache.set(cacheKey, item);
    this.currentSize += dataSize;
    
    logger.debug('Cache set', { key: cacheKey, size: dataSize });
  }

  // Delete item from cache
  delete(key) {
    const cacheKey = this.generateKey(key);
    const item = this.cache.get(cacheKey);
    
    if (item) {
      this.currentSize -= item.size;
      this.cache.delete(cacheKey);
      logger.debug('Cache delete', { key: cacheKey });
      return true;
    }
    
    return false;
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.currentSize = 0;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
    logger.info('Cache cleared');
  }

  // Invalidate cache by pattern
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = [];
    
    for (const [key] of this.cache) {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    logger.debug('Cache invalidated by pattern', { pattern, count: keysToDelete.length });
  }

  // Evict least recently used item
  evictLRU() {
    let lruKey = null;
    let lruTime = Date.now();
    
    for (const [key, item] of this.cache) {
      if (item.lastAccessed < lruTime) {
        lruTime = item.lastAccessed;
        lruKey = key;
      }
    }
    
    if (lruKey) {
      this.delete(lruKey);
      this.stats.evictions++;
      logger.debug('Cache LRU eviction', { key: lruKey });
    }
  }

  // Estimate size of data
  estimateSize(data) {
    try {
      const str = JSON.stringify(data);
      return new Blob([str]).size;
    } catch (error) {
      // Fallback for circular references
      return 1024; // Default 1KB
    }
  }

  // Get cache statistics
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: `${(this.currentSize / 1024 / 1024).toFixed(2)} MB`,
      maxSize: `${this.config.maxSize} MB`,
      itemCount: this.cache.size
    };
  }

  // Prune expired items
  pruneExpired() {
    const now = Date.now();
    const keysToDelete = [];
    
    for (const [key, item] of this.cache) {
      if (item.expiry && now > item.expiry) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    
    if (keysToDelete.length > 0) {
      logger.debug('Pruned expired cache items', { count: keysToDelete.length });
    }
    
    return keysToDelete.length;
  }

  // Start auto-pruning
  startAutoPrune(interval = 60000) {
    this.prunInterval = setInterval(() => {
      this.pruneExpired();
    }, interval);
  }

  // Stop auto-pruning
  stopAutoPrune() {
    if (this.prunInterval) {
      clearInterval(this.prunInterval);
      this.prunInterval = null;
    }
  }
}

export default CacheManager;