const STORAGE_KEYS = {
  USER: "user",
  TOKEN: "token",
  THEME: "theme",
  LANGUAGE: "language",
  PREFERENCES: "preferences",
  LAST_VISIT: "lastVisit",
  REGISTERED_USERS: "registeredUsers",
  PERFORMANCES: "performances",
  BOOKINGS: "bookings",
  VENUES: "venues",
  TICKET_TYPES: "ticketTypes",
};

const STORAGE_VERSION = "3.0";
const STORAGE_NAMESPACE = "wom_";
const MAX_STORAGE_SIZE = 5 * 1024 * 1024;

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
    this.set(STORAGE_KEYS.LAST_VISIT, new Date().toISOString());
    this.cleanExpired();
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
      if (item === null) return defaultValue;

      const parsed = JSON.parse(item);

      if (this.isExpired(parsed)) {
        this.remove(key);
        return defaultValue;
      }

      return parsed.value !== undefined ? parsed.value : parsed;
    } catch (error) {
      console.error(`Error reading from localStorage (${key}):`, error);
      return defaultValue;
    }
  }

  set(key, value, options = {}) {
    try {
      const { ttl, compress = false } = options;

      if (this.getStorageSize() > MAX_STORAGE_SIZE * 0.9) {
        this.cleanOldData();
      }

      const data = {
        value,
        timestamp: Date.now(),
        ...(ttl && { expiresAt: Date.now() + ttl }),
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
    for (let key in localStorage) {
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
    if (!data || typeof data !== "object") return false;
    if (!data.expiresAt) return false;
    return Date.now() > data.expiresAt;
  }

  cleanExpired() {
    const keys = this.keys();
    let cleaned = 0;

    keys.forEach((fullKey) => {
      try {
        const item = localStorage.getItem(fullKey);
        const parsed = JSON.parse(item);
        if (this.isExpired(parsed)) {
          localStorage.removeItem(fullKey);
          cleaned++;
        }
      } catch (error) {
        console.error(`Error cleaning expired item: ${fullKey}`, error);
      }
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
      console.error("Invalid user data");
      return false;
    }
    return this.set(STORAGE_KEYS.USER, user);
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
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
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
    if (!value) return { valid: false, errors: ["Value not found"] };

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
}

class SessionStorageService {
  get(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(key);
      if (item === null) return defaultValue;
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
