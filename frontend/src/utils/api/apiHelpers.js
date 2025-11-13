import { showNotification } from "../ui/notification.js";

export class LoadingManager {
  constructor() {
    this.loadingStates = new Map();
  }

  start(key) {
    this.loadingStates.set(key, true);
    this.updateUI(key, true);
  }

  stop(key) {
    this.loadingStates.set(key, false);
    this.updateUI(key, false);
  }

  isLoading(key) {
    return this.loadingStates.get(key) || false;
  }

  updateUI(key, isLoading) {
    const button = document.querySelector(`[data-loading-key="${key}"]`);
    if (button) {
      button.disabled = isLoading;
      const spinner = button.querySelector(".spinner");
      if (spinner) {
        spinner.style.display = isLoading ? "inline-block" : "none";
      }
    }
  }
}

export const loadingManager = new LoadingManager();

export const withLoading = async (key, asyncFn) => {
  try {
    loadingManager.start(key);
    const result = await asyncFn();
    return result;
  } finally {
    loadingManager.stop(key);
  }
};

export const formatApiError = (error) => {
  if (error.data && error.data.errors && Array.isArray(error.data.errors)) {
    return error.data.errors.map((e) => e.message || e.msg).join(", ");
  }

  if (error.data && error.data.message) {
    return error.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return "An unexpected error occurred";
};

export const parseValidationErrors = (error) => {
  if (error.data && error.data.errors && Array.isArray(error.data.errors)) {
    const fieldErrors = {};
    error.data.errors.forEach((err) => {
      const field = err.field || err.param;
      if (field) {
        fieldErrors[field] = err.message || err.msg;
      }
    });
    return fieldErrors;
  }
  return {};
};

export const displayValidationErrors = (errors, formId) => {
  const form = document.getElementById(formId);
  if (!form) return;

  Object.keys(errors).forEach((field) => {
    const input = form.querySelector(`[name="${field}"]`);
    if (input) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "text-red-600 text-sm mt-1";
      errorDiv.textContent = errors[field];

      const existingError = input.parentElement.querySelector(".text-red-600");
      if (existingError) {
        existingError.remove();
      }

      input.parentElement.appendChild(errorDiv);
      input.classList.add("border-red-500");
    }
  });
};

export const clearValidationErrors = (formId) => {
  const form = document.getElementById(formId);
  if (!form) return;

  form.querySelectorAll(".text-red-600").forEach((el) => el.remove());
  form.querySelectorAll(".border-red-500").forEach((el) => {
    el.classList.remove("border-red-500");
  });
};

export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      if (
        error.status === 401 ||
        error.status === 403 ||
        error.status === 422
      ) {
        throw error;
      }

      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
};

export const handleApiSuccess = (message, options = {}) => {
  const {
    showNotif = true,
    callback = null,
    redirect = null,
    delay = 0,
  } = options;

  if (showNotif && message) {
    showNotification("success", message);
  }

  if (callback) {
    setTimeout(callback, delay);
  }

  if (redirect) {
    setTimeout(() => {
      window.location.href = redirect;
    }, delay || 500);
  }
};

export const handleApiFailure = (error, options = {}) => {
  const { showNotif = true, customMessage = null, callback = null } = options;

  const message = customMessage || formatApiError(error);

  if (showNotif) {
    if (error.status === 401) {
      showNotification("error", "Session expired. Please login again.");
    } else if (error.status === 403) {
      showNotification("error", "You don't have permission for this action.");
    } else if (error.status === 404) {
      showNotification("error", "Resource not found.");
    } else if (error.status >= 500) {
      showNotification("error", "Server error. Please try again later.");
    } else {
      showNotification("error", message);
    }
  }

  if (callback) {
    callback(error);
  }

  return error;
};

export const createQueryString = (params) => {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== "")
  );
  return new URLSearchParams(filtered).toString();
};

export const parseQueryString = (search = window.location.search) => {
  const params = new URLSearchParams(search);
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
};

export const downloadFile = (data, filename, mimeType = "application/json") => {
  const blob = new Blob([data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const uploadFile = (file, onProgress = null) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      resolve(e.target.result);
    };

    reader.onerror = (e) => {
      reject(new Error("Failed to read file"));
    };

    if (onProgress) {
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentLoaded = Math.round((e.loaded / e.total) * 100);
          onProgress(percentLoaded);
        }
      };
    }

    reader.readAsDataURL(file);
  });
};

export const debounceApiCall = (fn, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
};

export const batchApiCalls = async (calls, options = {}) => {
  const { concurrency = 5, stopOnError = false } = options;

  const results = [];
  const errors = [];

  for (let i = 0; i < calls.length; i += concurrency) {
    const batch = calls.slice(i, i + concurrency);
    const promises = batch.map(async (call, index) => {
      try {
        const result = await call();
        return { success: true, data: result, index: i + index };
      } catch (error) {
        return { success: false, error, index: i + index };
      }
    });

    const batchResults = await Promise.all(promises);

    for (const result of batchResults) {
      if (result.success) {
        results.push(result);
      } else {
        errors.push(result);
        if (stopOnError) {
          break;
        }
      }
    }

    if (stopOnError && errors.length > 0) {
      break;
    }
  }

  return { results, errors };
};

export const pollApi = async (requestFn, options = {}) => {
  const {
    interval = 5000,
    maxAttempts = 10,
    condition = (response) => response.status === "completed",
  } = options;

  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await requestFn();

      if (condition(response)) {
        return response;
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
      attempts++;
    } catch (error) {
      throw error;
    }
  }

  throw new Error("Polling timeout: Maximum attempts reached");
};

export const cacheApiResponse = (key, data, ttl = 300000) => {
  const item = {
    data,
    timestamp: Date.now(),
    ttl,
  };
  sessionStorage.setItem(`api_cache_${key}`, JSON.stringify(item));
};

export const getCachedResponse = (key) => {
  const cached = sessionStorage.getItem(`api_cache_${key}`);
  if (!cached) return null;

  try {
    const item = JSON.parse(cached);
    if (Date.now() - item.timestamp < item.ttl) {
      return item.data;
    }
    sessionStorage.removeItem(`api_cache_${key}`);
  } catch (error) {
    sessionStorage.removeItem(`api_cache_${key}`);
  }

  return null;
};

export const clearApiCache = (pattern = null) => {
  if (pattern) {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("api_cache_") && key.includes(pattern)) {
        sessionStorage.removeItem(key);
      }
    });
  } else {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith("api_cache_")) {
        sessionStorage.removeItem(key);
      }
    });
  }
};
