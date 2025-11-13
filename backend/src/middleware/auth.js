import { USER_ROLES } from "../config/constants.js";

export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Authentication required. Please login.",
  });
};

export const isAdmin = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please login.",
    });
  }

  if (req.session.userRole !== USER_ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  return next();
};

export const isOwnerOrAdmin = (resourceUserId) => (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication required. Please login.",
    });
  }

  const currentUserId = req.session.userId;
  const currentUserRole = req.session.userRole;

  if (currentUserRole === USER_ROLES.ADMIN || currentUserId === resourceUserId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "You do not have permission to access this resource.",
  });
};

export const optionalAuth = (req, res, next) => {
  next();
};
