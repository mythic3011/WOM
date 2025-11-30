/**
 * @file authController.js
 * @description Authentication controller handling user registration, login, logout, and session management
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency #services/authService.js
 */

import * as authService from "#services/authService.js";

/**
 * @param {Object} user
 * @returns {Object}
 */
const serializeUserData = (user) => ({
  id: user.id,
  userId: user.userId,
  username: user.username,
  email: user.email,
  name: user.name,
  role: user.role,
  profileImage: user.profileImage || null,
});

/**
 * @param {Object} req
 * @param {Object} user
 * @returns {void}
 */
const setUserSession = (req, user) => {
  req.session.userId = user.id;
  req.session.userRole = user.role;
  req.session.userName = user.name;
};

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @param {number} statusCode
 * @param {string} message
 * @param {Object} user
 * @returns {void}
 */
const saveSessionAndRespond = (req, res, next, statusCode, message, user) => {
  req.session.save((err) => {
    if (err) {
      return next(err);
    }
    res.status(statusCode).json({
      success: true,
      message,
      data: {
        user: serializeUserData(user),
      },
    });
  });
};

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    setUserSession(req, user);

    const userWithImage = await authService.getUserWithImage(user.id);
    saveSessionAndRespond(req, res, next, 201, "User registered successfully", userWithImage);
  } catch (error) {
    next(error);
  }
};

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const login = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const identifier = username || email;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Username or email is required",
      });
    }

    const user = await authService.login(identifier, password);
    setUserSession(req, user);

    const userWithImage = await authService.getUserWithImage(user.id);
    saveSessionAndRespond(req, res, next, 200, "Login successful", userWithImage);
  } catch (error) {
    if (error.message.includes("Invalid") || error.message.includes("not active")) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const logout = async (req, res, next) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }

      res.clearCookie("wom.sid");

      res.json({
        success: true,
        message: "Logout successful",
      });
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.session.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const checkSession = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      const user = await authService.getUserWithImage(req.session.userId);

      if (!user) {
        return res.json({
          success: true,
          authenticated: false,
        });
      }

      return res.json({
        success: true,
        authenticated: true,
        user: serializeUserData(user),
      });
    }

    res.json({
      success: true,
      authenticated: false,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 * @returns {Promise<void>}
 */
export const getProfileImage = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.session.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const fullUser = await authService.getUserWithImage(req.session.userId);

    res.json({
      success: true,
      data: {
        profileImage: fullUser?.profileImage || null,
        hasProfileImage: !!fullUser?.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};
