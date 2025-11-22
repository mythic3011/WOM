import { USER_ROLES } from "@config/config.js";
import { ROUTES } from "@config/routes.js";
import { authAPI, storage } from "@services/index.js";

let currentUser = null;
let sessionChecked = false;

export async function checkSession() {
  try {
    const response = await authAPI.checkSession();
    if (response.success && response.authenticated && response.user) {
      const success = setUser(response.user);
      sessionChecked = true;
      return success ? currentUser : null;
    }
  } catch (error) {
    console.error('Session check error:', error);
    currentUser = null;
    storage.removeUser();
  }
  sessionChecked = true;
  return null;
}

export function getCurrentUser() {
  if (currentUser) {
    return currentUser;
  }

  const user = storage.getUser();
  if (user) {
    currentUser = user;
    return currentUser;
  }
  return null;
}

/**
 * Sanitize user data to prevent storage corruption
 * Removes empty strings and invalid values
 */
function sanitizeUserData(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  const sanitized = { ...user };

  // Remove or fix problematic fields
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];

    // Remove empty strings
    if (typeof value === 'string' && !value.trim()) {
      delete sanitized[key];
    }

    // Handle null/undefined
    if (value === null || value === undefined) {
      delete sanitized[key];
    }

    // Handle nested objects (like profile)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedSanitized = sanitizeUserData(value);
      if (nestedSanitized && Object.keys(nestedSanitized).length > 0) {
        sanitized[key] = nestedSanitized;
      } else {
        delete sanitized[key];
      }
    }
  });

  // Ensure required fields exist
  if (!sanitized.id) {
    console.error('User data missing required id field');
    return null;
  }

  return sanitized;
}

export function setUser(user) {
  const sanitized = sanitizeUserData(user);

  if (!sanitized) {
    console.error('Failed to sanitize user data:', user);
    return false;
  }

  currentUser = sanitized;
  return storage.setUser(sanitized);
}

export function clearUser() {
  currentUser = null;
  sessionChecked = false;
  storage.clearUser();
}

export async function login(email, password) {
  try {
    const response = await authAPI.login(email, password);
    if (response.success && response.data && response.data.user) {
      const success = setUser(response.data.user);
      if (!success) {
        throw new Error("Failed to store user data - data may be corrupted");
      }
      return currentUser;
    }
    throw new Error("Invalid response from server");
  } catch (error) {
    clearUser();
    throw error;
  }
}

export async function logout() {
  try {
    await authAPI.logout();
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    clearUser();
    window.location.href = ROUTES.AUTH.LOGIN;
  }
}

export function isAuthenticated() {
  return getCurrentUser() !== null;
}

export function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === USER_ROLES.ADMIN;
}

export function isUser() {
  const user = getCurrentUser();
  return user && user.role === USER_ROLES.USER;
}

export async function requireAuth(redirectUrl = null) {
  if (!sessionChecked) {
    await checkSession();
  }

  if (!isAuthenticated()) {
    const redirect = redirectUrl || ROUTES.AUTH.LOGIN;
    const currentPath = window.location.pathname;
    window.location.href = `${redirect}?redirect=${encodeURIComponent(
      currentPath
    )}`;
    return false;
  }
  return true;
}

export async function requireAdmin() {
  if (!(await requireAuth())) return false;

  if (!isAdmin()) {
    window.location.href = ROUTES.USER.DASHBOARD;
    return false;
  }
  return true;
}

export async function requireUser() {
  if (!(await requireAuth())) return false;

  if (!isUser()) {
    window.location.href = ROUTES.ADMIN.DASHBOARD;
    return false;
  }
  return true;
}

export function redirectBasedOnRole() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = ROUTES.AUTH.LOGIN;
    return;
  }

  if (user.role === USER_ROLES.ADMIN) {
    window.location.href = ROUTES.ADMIN.DASHBOARD;
  } else {
    window.location.href = ROUTES.USER.DASHBOARD;
  }
}

export async function initAuth() {
  if (!sessionChecked) {
    await checkSession();
  }
  return getCurrentUser();
}
