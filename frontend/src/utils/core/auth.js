import { USER_ROLES } from "../../config/config.js";
import { ROUTES } from "../../config/routes.js";
import { authAPI } from "../../services/apiClient.js";
import { storage } from "../../services/storageService.js";

let currentUser = null;
let sessionChecked = false;

export async function checkSession() {
  try {
    const response = await authAPI.checkSession();
    if (response.success && response.authenticated && response.user) {
      currentUser = response.user;
      storage.setUser(response.user);
      sessionChecked = true;
      return response.user;
    }
  } catch (error) {
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

export function setUser(user) {
  currentUser = user;
  storage.setUser(user);
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
      setUser(response.data.user);
      return response.data.user;
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
