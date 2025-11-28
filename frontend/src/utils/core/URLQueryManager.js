class URLQueryManager {
  constructor(defaultParams = {}) {
    this.defaultParams = defaultParams;
    this.subscribers = [];
    this.currentParams = {};
    this.syncFromURL();
    this.setupPopStateListener();
  }

  setupPopStateListener() {
    window.addEventListener("popstate", () => {
      this.syncFromURL();
      this.notifySubscribers();
    });
  }

  syncFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    this.currentParams = {};

    for (const [key, value] of urlParams.entries()) {
      this.currentParams[key] = this.parseValue(value);
    }

    Object.keys(this.defaultParams).forEach((key) => {
      if (this.currentParams[key] === undefined) {
        this.currentParams[key] = this.defaultParams[key];
      }
    });
  }

  syncToURL(replaceState = false) {
    const urlParams = new URLSearchParams();

    Object.entries(this.currentParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        const defaultValue = this.defaultParams[key];
        if (value !== defaultValue) {
          urlParams.set(key, String(value));
        }
      }
    });

    const queryString = urlParams.toString();
    const newURL = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;

    if (replaceState) {
      window.history.replaceState({}, "", newURL);
    } else {
      window.history.pushState({}, "", newURL);
    }
  }

  parseValue(value) {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    if (value === "null") {
      return null;
    }
    const num = Number(value);
    if (!isNaN(num) && value !== "") {
      return num;
    }
    return value;
  }

  getParams() {
    return { ...this.currentParams };
  }

  getParam(key) {
    return this.currentParams[key] ?? this.defaultParams[key] ?? null;
  }

  setParam(key, value, options = {}) {
    const { silent = false, replaceState = false } = options;
    const oldValue = this.currentParams[key];

    if (oldValue === value) {
      return;
    }

    if (value === null || value === undefined || value === "") {
      delete this.currentParams[key];
    } else {
      this.currentParams[key] = value;
    }

    this.syncToURL(replaceState);

    if (!silent) {
      this.notifySubscribers();
    }
  }

  setParams(params, options = {}) {
    const { silent = false, replaceState = false } = options;
    let hasChanges = false;

    Object.entries(params).forEach(([key, value]) => {
      const oldValue = this.currentParams[key];
      if (oldValue !== value) {
        hasChanges = true;
        if (value === null || value === undefined || value === "") {
          delete this.currentParams[key];
        } else {
          this.currentParams[key] = value;
        }
      }
    });

    if (hasChanges) {
      this.syncToURL(replaceState);
      if (!silent) {
        this.notifySubscribers();
      }
    }
  }

  removeParam(key, options = {}) {
    const { silent = false, replaceState = false } = options;

    if (this.currentParams[key] === undefined) {
      return;
    }

    delete this.currentParams[key];
    this.syncToURL(replaceState);

    if (!silent) {
      this.notifySubscribers();
    }
  }

  clearAll(options = {}) {
    const { silent = false, replaceState = false } = options;

    this.currentParams = {};
    this.syncToURL(replaceState);

    if (!silent) {
      this.notifySubscribers();
    }
  }

  subscribe(callback) {
    if (typeof callback !== "function") {
      throw new Error("Subscriber must be a function");
    }

    this.subscribers.push(callback);

    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  notifySubscribers() {
    const params = this.getParams();
    this.subscribers.forEach((callback) => {
      try {
        callback(params);
      } catch (error) {
        console.error("Error in URLQueryManager subscriber:", error);
      }
    });
  }

  hasParam(key) {
    return this.currentParams[key] !== undefined;
  }

  isDefault(key) {
    return this.currentParams[key] === this.defaultParams[key];
  }

  getQueryString() {
    const urlParams = new URLSearchParams();

    Object.entries(this.currentParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        const defaultValue = this.defaultParams[key];
        if (value !== defaultValue) {
          urlParams.set(key, String(value));
        }
      }
    });

    return urlParams.toString();
  }

  getFullURL() {
    const queryString = this.getQueryString();
    return queryString
      ? `${window.location.origin}${window.location.pathname}?${queryString}`
      : `${window.location.origin}${window.location.pathname}`;
  }

  destroy() {
    this.subscribers = [];
  }
}

export { URLQueryManager };
export default URLQueryManager;
