/**
 * @file cache.js
 * @description In-memory caching utilities with TTL support and cache middleware
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @see backend/src/services
 */

/**
 * @class MemoryCache
 */
class MemoryCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} [ttl=300000] - Time to live in milliseconds (default 5 minutes)
   */
  set(key, value, ttl = 300000) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * @param {string} key - Cache key
   * @returns {*|null} Cached value or null if not found or expired
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * @param {string} key - Cache key to delete
   */
  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  /**
   * @param {string} key - Cache key to check
   * @returns {boolean} True if key exists and not expired
   */
  has(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new MemoryCache();

setInterval(() => {
  cache.cleanup();
}, 60000);

/**
 * @param {number} [ttl=300000] - Time to live in milliseconds (default 5 minutes)
 * @returns {Function} Express middleware function
 */
export const cacheMiddleware = (ttl = 300000) => (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    const key = `${req.originalUrl}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      return res.json(cachedResponse);
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, data, ttl);
      return originalJson(data);
    };

    next();
  };
