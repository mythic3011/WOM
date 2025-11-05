import { STORAGE_KEYS, USER_ROLES, ROUTES } from '../config/config.js';

export function getCurrentUser() {
  const userStr = localStorage.getItem(STORAGE_KEYS.user);
  return userStr ? JSON.parse(userStr) : null;
}

export function getToken() {
  return localStorage.getItem(STORAGE_KEYS.token);
}

export function setUser(user, token) {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
  if (token) {
    localStorage.setItem(STORAGE_KEYS.token, token);
  }
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.token);
  window.location.href = ROUTES.auth.login;
}

export function isAuthenticated() {
  return getCurrentUser() !== null && getToken() !== null;
}

export function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === USER_ROLES.ADMIN;
}

export function isUser() {
  const user = getCurrentUser();
  return user && user.role === USER_ROLES.USER;
}

export function requireAuth(redirectUrl = null) {
  if (!isAuthenticated()) {
    const redirect = redirectUrl || ROUTES.auth.login;
    window.location.href = `${redirect}?error=unauthorized`;
    return false;
  }
  return true;
}

export function requireAdmin() {
  if (!requireAuth()) return false;
  
  if (!isAdmin()) {
    window.location.href = ROUTES.user.dashboard;
    return false;
  }
  return true;
}

export function requireUser() {
  if (!requireAuth()) return false;
  
  if (!isUser()) {
    window.location.href = ROUTES.admin.dashboard;
    return false;
  }
  return true;
}

export function redirectBasedOnRole() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = ROUTES.auth.login;
    return;
  }

  if (user.role === USER_ROLES.ADMIN) {
    window.location.href = ROUTES.admin.dashboard;
  } else {
    window.location.href = ROUTES.user.dashboard;
  }
}

export function generateToken() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

