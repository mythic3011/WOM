import { USER_ROLES } from "#config/constants.js";
import { UnauthorizedError, ForbiddenError } from "#utils/errors.js";

export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }

  throw new UnauthorizedError("Authentication required. Please login.");
};

export const isAdmin = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    throw new UnauthorizedError("Authentication required. Please login.");
  }

  if (req.session.userRole !== USER_ROLES.ADMIN) {
    throw new ForbiddenError("Admin access required.");
  }

  return next();
};

export const isOwnerOrAdmin = (resourceUserId) => (req, res, next) => {
  if (!req.session || !req.session.userId) {
    throw new UnauthorizedError("Authentication required. Please login.");
  }

  const currentUserId = req.session.userId;
  const currentUserRole = req.session.userRole;

  if (currentUserRole === USER_ROLES.ADMIN || currentUserId === resourceUserId) {
    return next();
  }

  throw new ForbiddenError("You do not have permission to access this resource.");
};

export const isOwnerOrAdminByParam = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    throw new UnauthorizedError("Authentication required. Please login.");
  }

  const currentUserId = req.session.userId;
  const currentUserRole = req.session.userRole;
  const targetUserId = req.params.id;

  if (currentUserRole === USER_ROLES.ADMIN || currentUserId === targetUserId) {
    return next();
  }

  throw new ForbiddenError("You do not have permission to access this resource.");
};

export const optionalAuth = (req, res, next) => {
  next();
};
