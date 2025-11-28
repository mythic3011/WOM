import LZString from "lz-string";
import { encrypt, decrypt } from "@utils/core/crypto.js";

const STORAGE_KEYS = {
  USER: "user",
  TOKEN: "token",
  THEME: "theme",
  LAST_VISIT: "lastVisit",
  PERFORMANCES: "performances",
  BOOKINGS: "bookings",
  VENUES: "venues",
  TICKET_TYPES: "ticketTypes",
};

const STORAGE_VERSION = "4.0";
const STORAGE_NAMESPACE = "wom_";
const MAX_STORAGE_SIZE = 5 * 1024 * 1024;
const COMPRESSION_THRESHOLD = 1024;
const SECURE_KEYS = ["USER", "TOKEN"];

class StorageService {
  constructor() {
    this.listeners = new Map();
    this.initStorage();
  }

  initStorage() {
    const version = this.get("storageVersion");
    if (version !== STORAGE_VERSION) {
      this.migrate(version, STORAGE_VERSION);
      this.set("storageVersion", STORAGE_VERSION);
    }

    // Clean up legacy "user" key (without namespace)
    const oldUserKey = "user";
    const oldUser = localStorage.getItem(oldUserKey);

    if (oldUser !== null) {
      // If empty or whitespace, just remove it
      if (!oldUser.trim()) {
        console.warn(
          "[StorageService] Legacy user data is empty, removing invalid entry"
        );
        localStorage.removeItem(oldUserKey);
      } else if (!this.has("USER")) {
        // Only migrate if we don't already have a USER in new storage
        try {
          const userData = JSON.parse(oldUser);
          if (userData && typeof userData === "object" && userData.id) {
            this.setUser(userData);
            localStorage.removeItem(oldUserKey);
            console.info(
              "[StorageService] Migrated user data from legacy storage to encrypted storage"
            );
          } else {
            console.warn(
              "[StorageService] Legacy user data has invalid format, skipping migration"
            );
            localStorage.removeItem(oldUserKey);
          }
        } catch (error) {
          console.error(
            "[StorageService] Failed to migrate legacy user data:",
            error
          );
          localStorage.removeItem(oldUserKey);
        }
      } else {
        // We have new USER storage, remove the old key
        localStorage.removeItem(oldUserKey);
        console.info("[StorageService] Removed legacy user key (already migrated)");
      }
    }

    // Clean up any corrupted entries in localStorage
    this.cleanCorrupted();

    this.set(STORAGE_KEYS.LAST_VISIT, new Date().toISOString());
    this.cleanExpired();
  }

  cleanCorrupted() {
    // Clean up corrupted entries in our namespaced storage
    const keys = this.keys();
    let cleaned = 0;

    keys.forEach((fullKey) => {
      try {
        const item = localStorage.getItem(fullKey);
        if (!item || !item.trim()) {
          localStorage.removeItem(fullKey);
          cleaned++;
          return;
        }

        // Try to parse to validate
        JSON.parse(item);
      } catch (error) {
        console.warn(`Removing corrupted key: ${fullKey}`);
        localStorage.removeItem(fullKey);
        cleaned++;
      }
    });

    if (cleaned > 0) {
      console.info(`[StorageService] Cleaned ${cleaned} corrupted items from storage`);
    }
  }

  migrate(fromVersion, toVersion) {
    return;
  }

  getKey(key) {
    return STORAGE_NAMESPACE + key;
  }

  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(this.getKey(key));
      if (item === null) {return defaultValue;}

      // Handle empty or whitespace-only values
      if (!item.trim()) {
        console.warn(`Empty value found for key: ${key}, removing invalid entry`);
        this.remove(key);
        return defaultValue;
      }

      const parsed = JSON.parse(item);

      if (parsed.compressed) {
        const decompressed = LZString.decompress(parsed.value);
        parsed.value = JSON.parse(decompressed);
      }

      if (parsed.encrypted) {
        // Validate encrypted value before attempting decryption
        if (!parsed.value || (typeof parsed.value === "string" && !parsed.value.trim())) {
          console.warn(`Empty encrypted value for key: ${key}, removing invalid entry`);
          this.remove(key);
          return defaultValue;
        }
        parsed.value = decrypt(parsed.value);
      }

      if (this.isExpired(parsed)) {
        this.remove(key);
        return defaultValue;
      }

      return parsed.value !== undefined ? parsed.value : parsed;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      // Clean up corrupted data
      try {
        this.remove(key);
        console.warn(`Removed corrupted data for key: ${key}`);
      } catch (cleanupError) {
        console.error(`Failed to cleanup corrupted key: ${key}`, cleanupError);
      }
      return defaultValue;
    }
  }

  set(key, value, options = {}) {
    try {
      // Validate input - prevent storing null, undefined, or empty strings
      if (value === null || value === undefined) {
        console.warn(`Attempted to store null/undefined for key: ${key}`);
        return false;
      }

      if (typeof value === "string" && !value.trim()) {
        console.warn(`Attempted to store empty string for key: ${key}`);
        return false;
      }

      let { ttl, compress = false, encrypt: encryptData = false } = options;

      if (this.getStorageSize() > MAX_STORAGE_SIZE * 0.9) {
        this.cleanOldData();
      }

      const isSecureKey = SECURE_KEYS.includes(key.toUpperCase());
      if (isSecureKey && !encryptData) {
        encryptData = true;
      }

      let processedValue = value;
      let isCompressed = false;
      let isEncrypted = false;

      const tempSerialized = JSON.stringify({ value });

      if (compress || tempSerialized.length > COMPRESSION_THRESHOLD) {
        processedValue = LZString.compress(JSON.stringify(value));
        isCompressed = true;
      }

      if (encryptData) {
        processedValue = encrypt(isCompressed ? processedValue : value);
        isEncrypted = true;

        // Validate encryption output
        if (!processedValue || (typeof processedValue === "string" && !processedValue.trim())) {
          console.error(`Encryption produced invalid output for key: ${key}`);
          return false;
        }
      }

      const data = {
        value: processedValue,
        timestamp: Date.now(),
        ...(ttl && { expiresAt: Date.now() + ttl }),
        ...(isCompressed && { compressed: true }),
        ...(isEncrypted && { encrypted: true }),
      };

      const serialized = JSON.stringify(data);

      if (serialized.length > MAX_STORAGE_SIZE * 0.1) {
        console.warn(`Large data being stored for key: ${key}`);
      }

      localStorage.setItem(this.getKey(key), serialized);
      this.emit("change", { key, value, action: "set" });
      return true;
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        console.error("Storage quota exceeded. Cleaning old data...");
        this.cleanOldData();
        return this.set(key, value, options);
      }
      console.error(`Error writing to localStorage (${key}):`, error);
      return false;
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(this.getKey(key));
      this.emit("change", { key, action: "remove" });
      return true;
    } catch (error) {
      console.error(`Error removing from localStorage (${key}):`, error);
      return false;
    }
  }

  clear() {
    try {
      const keys = this.keys();
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_NAMESPACE)) {
          localStorage.removeItem(key);
        }
      });
      this.initStorage();
      this.emit("change", { action: "clear" });
      return true;
    } catch (error) {
      console.error("Error clearing localStorage:", error);
      return false;
    }
  }

  has(key) {
    return localStorage.getItem(this.getKey(key)) !== null;
  }

  keys() {
    return Object.keys(localStorage).filter((key) =>
      key.startsWith(STORAGE_NAMESPACE)
    );
  }

  getStorageSize() {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }

  getStorageInfo() {
    const size = this.getStorageSize();
    const keys = this.keys();
    const percentage = ((size / MAX_STORAGE_SIZE) * 100).toFixed(2);

    return {
      size,
      maxSize: MAX_STORAGE_SIZE,
      used: percentage + "%",
      keys: keys.length,
      available: MAX_STORAGE_SIZE - size,
    };
  }

  isExpired(data) {
    if (!data || typeof data !== "object") {return false;}
    if (!data.expiresAt) {return false;}
    return Date.now() > data.expiresAt;
  }

  cleanExpired() {
    const keys = this.keys();
    let cleaned = 0;

    keys.forEach((fullKey) => {
      try {
        const item = localStorage.getItem(fullKey);
        if (!item) {return;}

        const parsed = JSON.parse(item);
        if (this.isExpired(parsed)) {
          localStorage.removeItem(fullKey);
          cleaned++;
        }
      } catch (error) { }
    });

    if (cleaned > 0) {
      console.info(`Cleaned ${cleaned} expired items from storage`);
    }
  }

  cleanOldData() {
    const items = [];

    this.keys().forEach((fullKey) => {
      try {
        const item = localStorage.getItem(fullKey);
        const parsed = JSON.parse(item);
        items.push({
          key: fullKey,
          timestamp: parsed.timestamp || 0,
          size: item.length,
        });
      } catch (error) {
        items.push({ key: fullKey, timestamp: 0, size: 0 });
      }
    });

    items.sort((a, b) => a.timestamp - b.timestamp);

    const toRemove = Math.ceil(items.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(items[i].key);
    }

    console.info(`Cleaned ${toRemove} old items to free up space`);
  }

  backup() {
    const timestamp = new Date().toISOString();
    const data = {};

    this.keys().forEach((fullKey) => {
      const key = fullKey.replace(STORAGE_NAMESPACE, "");
      data[key] = this.get(key);
    });

    return {
      version: STORAGE_VERSION,
      timestamp,
      data,
    };
  }

  restore(backup, options = { merge: false }) {
    try {
      if (!backup || !backup.data) {
        throw new Error("Invalid backup format");
      }

      if (!options.merge) {
        this.clear();
      }

      Object.entries(backup.data).forEach(([key, value]) => {
        this.set(key, value);
      });

      return { success: true, restored: Object.keys(backup.data).length };
    } catch (error) {
      console.error("Error restoring backup:", error);
      return { success: false, error: error.message };
    }
  }

  getUser() {
    return this.get(STORAGE_KEYS.USER);
  }

  setUser(user) {
    if (!user || !user.id) {
      console.error("Invalid user data - missing required fields");
      return false;
    }

    // Sanitize user data to prevent corruption
    const sanitized = { ...user };

    // Remove empty string fields that can cause JSON parse errors
    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key];
      if (typeof value === "string" && !value.trim()) {
        console.warn(`Removing empty field from user data: ${key}`);
        delete sanitized[key];
      }
    });

    // Validate critical fields
    if (!sanitized.id || !sanitized.username) {
      console.error("User data missing critical fields after sanitization");
      return false;
    }

    return this.set(STORAGE_KEYS.USER, sanitized);
  }

  removeUser() {
    return this.remove(STORAGE_KEYS.USER);
  }

  getToken() {
    const token = this.get(STORAGE_KEYS.TOKEN);
    return typeof token === "string" ? token : null;
  }

  setToken(token) {
    return this.set(STORAGE_KEYS.TOKEN, token);
  }

  removeToken() {
    return this.remove(STORAGE_KEYS.TOKEN);
  }

  isAuthenticated() {
    const user = this.getUser();
    return !!user && !!user.id;
  }

  getAuthData() {
    return {
      user: this.getUser(),
      token: this.getToken(),
      isAuthenticated: this.isAuthenticated(),
    };
  }

  setAuthData(user, token) {
    this.setUser(user);
    if (token) {
      this.setToken(token);
    }
  }

  clearAuthData() {
    this.removeUser();
    this.removeToken();
    sessionStorage.clear();
  }

  clearUser() {
    this.clearAuthData();
  }

  isAdmin() {
    const user = this.getUser();
    return user?.role === "admin";
  }

  setItem(key, value, options) {
    return this.set(key, value, options);
  }

  getItem(key, defaultValue = null) {
    return this.get(key, defaultValue);
  }

  removeItem(key) {
    return this.remove(key);
  }

  getPreferences() {
    return this.get(STORAGE_KEYS.PREFERENCES, {
      theme: "light",
      language: "en",
      notifications: true,
      emailUpdates: true,
      smsAlerts: false,
    });
  }

  setPreferences(preferences) {
    const current = this.getPreferences();
    return this.set(STORAGE_KEYS.PREFERENCES, { ...current, ...preferences });
  }

  exportData() {
    const backup = this.backup();
    return JSON.stringify(backup, null, 2);
  }

  importData(jsonString) {
    try {
      const backup = JSON.parse(jsonString);
      return this.restore(backup, { merge: false });
    } catch (error) {
      console.error("Error importing data:", error);
      return { success: false, error: error.message };
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) {return;}
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) {return;}
    this.listeners.get(event).forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in storage listener for ${event}:`, error);
      }
    });
  }

  validate(key, schema) {
    const value = this.get(key);
    if (!value) {return { valid: false, errors: ["Value not found"] };}

    const errors = [];

    if (schema.type && typeof value !== schema.type) {
      errors.push(`Expected type ${schema.type}, got ${typeof value}`);
    }

    if (schema.required && Array.isArray(schema.required)) {
      schema.required.forEach((field) => {
        if (!(field in value)) {
          errors.push(`Required field missing: ${field}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  setSecure(key, value, options = {}) {
    return this.set(key, value, { ...options, encrypt: true });
  }

  getSecure(key, defaultValue = null) {
    return this.get(key, defaultValue);
  }

  setCompressed(key, value, options = {}) {
    return this.set(key, value, { ...options, compress: true });
  }

  setMultiple(items) {
    try {
      items.forEach(({ key, value, options = {} }) => {
        this.set(key, value, options);
      });
      return true;
    } catch (error) {
      console.error("Error setting multiple items:", error);
      return false;
    }
  }

  getMultiple(keys) {
    try {
      return keys.reduce((acc, key) => {
        acc[key] = this.get(key);
        return acc;
      }, {});
    } catch (error) {
      console.error("Error getting multiple items:", error);
      return {};
    }
  }

  removeMultiple(keys) {
    try {
      keys.forEach((key) => this.remove(key));
      return true;
    } catch (error) {
      console.error("Error removing multiple items:", error);
      return false;
    }
  }

  compressAndStore(key, value, options = {}) {
    return this.setCompressed(key, value, options);
  }

  encryptAndStore(key, value, options = {}) {
    return this.setSecure(key, value, options);
  }

  getStorageStats() {
    const info = this.getStorageInfo();
    const keys = this.keys();

    let compressed = 0;
    let encrypted = 0;
    let expired = 0;
    let corrupted = 0;

    keys.forEach((fullKey) => {
      try {
        const item = localStorage.getItem(fullKey);
        if (!item || !item.trim()) {
          corrupted++;
          return;
        }
        const parsed = JSON.parse(item);
        if (parsed.compressed) {compressed++;}
        if (parsed.encrypted) {encrypted++;}
        if (this.isExpired(parsed)) {expired++;}
      } catch (error) {
        corrupted++;
        console.error(`Error analyzing key: ${fullKey}`, error);
      }
    });

    return {
      ...info,
      compressed,
      encrypted,
      expired,
      corrupted,
      compressionRate:
        keys.length > 0
          ? ((compressed / keys.length) * 100).toFixed(2) + "%"
          : "0%",
      encryptionRate:
        keys.length > 0
          ? ((encrypted / keys.length) * 100).toFixed(2) + "%"
          : "0%",
    };
  }

  /**
   * Force cleanup of all corrupted data in localStorage
   * This is a utility method that can be called manually to fix storage issues
   * @returns {Object} Cleanup results with counts
   */
  forceCleanup() {
    console.info("[StorageService] Starting force cleanup...");

    const cleaned = {
      corrupted: 0,
      expired: 0,
      legacy: 0,
      total: 0
    };

    // Clean legacy keys (without namespace)
    const legacyKeys = ["user", "token", "theme", "language", "preferences"];
    legacyKeys.forEach(key => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        cleaned.legacy++;
        cleaned.total++;
      }
    });

    // Clean corrupted and expired namespaced keys
    const keys = this.keys();
    keys.forEach((fullKey) => {
      try {
        const item = localStorage.getItem(fullKey);

        // Remove empty values
        if (!item || !item.trim()) {
          localStorage.removeItem(fullKey);
          cleaned.corrupted++;
          cleaned.total++;
          return;
        }

        // Try to parse and check expiration
        const parsed = JSON.parse(item);
        if (this.isExpired(parsed)) {
          localStorage.removeItem(fullKey);
          cleaned.expired++;
          cleaned.total++;
        }
      } catch (error) {
        // Remove corrupted entries
        localStorage.removeItem(fullKey);
        cleaned.corrupted++;
        cleaned.total++;
      }
    });

    console.info("[StorageService] Force cleanup complete:", cleaned);
    return cleaned;
  }

  /**
   * Diagnose storage issues and return a report
   * @returns {Object} Diagnostic report
   */
  diagnose() {
    const report = {
      healthy: true,
      issues: [],
      stats: this.getStorageStats()
    };

    // Check for corrupted data
    if (report.stats.corrupted > 0) {
      report.healthy = false;
      report.issues.push(`Found ${report.stats.corrupted} corrupted entries`);
    }

    // Check for expired data
    if (report.stats.expired > 0) {
      report.issues.push(`Found ${report.stats.expired} expired entries`);
    }

    // Check for legacy keys
    const legacyKeys = ["user", "token", "theme", "language", "preferences"];
    const foundLegacy = legacyKeys.filter(key => localStorage.getItem(key) !== null);
    if (foundLegacy.length > 0) {
      report.healthy = false;
      report.issues.push(`Found ${foundLegacy.length} legacy keys: ${foundLegacy.join(", ")}`);
    }

    // Check storage usage
    const usagePercent = parseFloat(report.stats.used);
    if (usagePercent > 90) {
      report.healthy = false;
      report.issues.push(`Storage usage is high: ${report.stats.used}`);
    } else if (usagePercent > 75) {
      report.issues.push(`Storage usage is moderate: ${report.stats.used}`);
    }

    return report;
  }
}

class SessionStorageService {
  get(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(key);
      if (item === null) {return defaultValue;}
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading from sessionStorage (${key}):`, error);
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error writing to sessionStorage (${key}):`, error);
      return false;
    }
  }

  remove(key) {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing from sessionStorage (${key}):`, error);
      return false;
    }
  }

  clear() {
    try {
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.error("Error clearing sessionStorage:", error);
      return false;
    }
  }

  has(key) {
    return sessionStorage.getItem(key) !== null;
  }
}

export const storage = new StorageService();
export const sessionStore = new SessionStorageService();
export { STORAGE_KEYS };
