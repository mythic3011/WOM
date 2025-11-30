/**
 * @file authService.js
 * @description Authentication service handling user registration, login, and session management
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency bcryptjs - Password hashing
 * @dependency jsonwebtoken - JWT token generation
 * @dependency #models/User.js - User model
 * @see #controllers/authController.js
 */

import { User } from "#models/index.js";
import { hashPassword } from "#utils/hash.js";
import { ConflictError, UnauthorizedError } from "#utils/errors.js";

/**
 * @param {Object} userData
 * @param {string} userData.email
 * @param {string} userData.username
 * @param {string} userData.password
 * @param {string} userData.name
 * @param {string} userData.phone
 * @param {string} [userData.role='user']
 * @param {string} [userData.title]
 * @param {string} [userData.gender]
 * @param {string} [userData.birthday]
 * @param {string} [userData.profileImage]
 * @returns {Promise<Object>}
 * @throws {ConflictError}
 */
export const register = async (userData) => {
  const { email, username, password, name, phone, role = "user", title, gender, birthday, profileImage } = userData;

  const existingUser = await User.findOne({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new ConflictError("Email already registered");
  }

  const existingUsername = await User.findOne({
    where: {
      username,
    },
  });

  if (existingUsername) {
    throw new ConflictError("Username already taken");
  }

  const hashedPassword = await hashPassword(password);

  const userCount = await User.count();
  const userId = String(userCount + 1).padStart(6, "0");

  const user = await User.create({
    userId,
    username,
    email,
    password: hashedPassword,
    name,
    phone,
    role,
    status: "active",
    title,
    gender,
    birthday,
    profileImage,
  });

  return user.toSafeObject();
};

/**
 * @param {string} identifier
 * @param {string} password
 * @returns {Promise<Object>}
 * @throws {UnauthorizedError}
 */
export const login = async (identifier, password) => {
  const user = await User.findOne({
    where: {
      [User.sequelize.Sequelize.Op.or]: [
        { email: identifier },
        { username: identifier },
      ],
    },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid username/email or password");
  }

  if (!user.isActive()) {
    throw new UnauthorizedError("Account is not active");
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    throw new UnauthorizedError("Invalid username/email or password");
  }

  await user.update({
    lastLoginAt: new Date(),
  });

  return user.toStorageObject();
};

/**
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export const getUserById = async (userId) => {
  const user = await User.findByPk(userId);

  if (!user) {
    return null;
  }

  return user.toStorageObject();
};

/**
 * @param {string} userId
 * @returns {Promise<Object|null>}
 */
export const getUserWithImage = async (userId) => {
  const user = await User.findByPk(userId);

  if (!user) {
    return null;
  }

  return user.toSafeObject();
};
