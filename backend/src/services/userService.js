/**
 * @file userService.js
 * @description User management service handling CRUD operations for users
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency #models/User.js - User model
 * @dependency #utils/hash.js - Password hashing utilities
 * @see #controllers/userController.js
 */

import { User } from "#models/index.js";
import { hashPassword, comparePassword } from "#utils/hash.js";
import { buildWhereClause } from "./helpers/filters.js";
import { findEntityOrThrow, checkUniqueFields } from "./helpers/entityHelpers.js";
import { deleteProfileImageFile } from "#utils/fileCleanup.js";

/**
 * @param {Object} [filters={}]
 * @param {string} [filters.status]
 * @param {string} [filters.role]
 * @param {string} [filters.search]
 * @returns {Promise<Array>}
 */
export const getAllUsers = async (filters = {}) => {
  const where = buildWhereClause(filters, {
    statusField: "status",
    searchFields: ["name", "email", "username"],
    additionalFilters: (f) => (f.role ? { role: f.role } : {}),
  });

  const users = await User.findAll({
    where,
    attributes: { exclude: ["password"] },
    order: [["createdAt", "DESC"]],
  });

  return users;
};

/**
 * @param {string} id
 * @returns {Promise<Object>}
 * @throws {Error}
 */
export const getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ["password"] },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/**
 * @param {Object} userData
 * @param {string} userData.email
 * @param {string} userData.username
 * @param {string} userData.password
 * @returns {Promise<Object>}
 * @throws {Error}
 */
export const createUser = async (userData) => {
  const { email, username, password, ...rest } = userData;

  await checkUniqueFields(User, { email, username });

  const hashedPassword = await hashPassword(password);

  const userCount = await User.count();
  const userId = String(userCount + 1).padStart(6, "0");

  const user = await User.create({
    ...rest,
    userId,
    username,
    email,
    password: hashedPassword,
  });

  return user.toSafeObject();
};

/**
 * @param {string} id
 * @param {Object} updates
 * @param {string} [updates.password]
 * @param {string} [updates.email]
 * @param {string} [updates.username]
 * @param {string} [updates.profileImage]
 * @returns {Promise<Object>}
 * @throws {Error}
 */
export const updateUser = async (id, updates) => {
  const user = await findEntityOrThrow(User, id, "User not found");

  if (updates.password) {
    updates.password = await hashPassword(updates.password);
  }

  const fieldsToCheck = {};
  if (updates.email && updates.email !== user.email) {
    fieldsToCheck.email = updates.email;
  }
  if (updates.username && updates.username !== user.username) {
    fieldsToCheck.username = updates.username;
  }

  if (Object.keys(fieldsToCheck).length > 0) {
    await checkUniqueFields(User, fieldsToCheck, id);
  }

  if (updates.profileImage && updates.profileImage !== user.profileImage) {
    const oldImageUrl = user.profileImage;
    if (oldImageUrl && !oldImageUrl.startsWith("data:image/")) {
      await deleteProfileImageFile(oldImageUrl);
    }
  }

  await user.update(updates);

  return user.toSafeObject();
};

/**
 * @param {string} id
 * @returns {Promise<boolean>}
 * @throws {Error}
 */
export const deleteUser = async (id) => {
  const user = await findEntityOrThrow(User, id, "User not found");

  const { Booking } = await import("#models/index.js");
  await Booking.destroy({ where: { userId: id } });

  if (user.profileImage && !user.profileImage.startsWith("data:image/")) {
    await deleteProfileImageFile(user.profileImage);
  }

  await user.destroy();

  return true;
};

/**
 * @param {string} id
 * @param {string} password
 * @returns {Promise<boolean>}
 * @throws {Error}
 */
export const verifyAndDeleteUser = async (id, password) => {
  const user = await findEntityOrThrow(User, id, "User not found");

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new Error("Invalid password");
  }

  const { Booking } = await import("#models/index.js");
  await Booking.destroy({ where: { userId: id } });

  if (user.profileImage && !user.profileImage.startsWith("data:image/")) {
    await deleteProfileImageFile(user.profileImage);
  }

  await user.destroy();
  return true;
};

/**
 * @param {string} userId
 * @returns {Promise<Array>}
 * @throws {Error}
 */
export const getUserBookings = async (userId) => {
  const user = await User.findByPk(userId, {
    include: ["bookings"],
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user.bookings;
};

/**
 * @param {string} userId
 * @param {Object} file
 * @returns {Promise<Object>}
 * @throws {Error}
 */
export const updateProfileImage = async (userId, file) => {
  const user = await findEntityOrThrow(User, userId, "User not found");

  const oldImageUrl = user.profileImage;

  const newImageUrl = await uploadProfileImage(file);

  await user.update({ profileImage: newImageUrl });

  if (oldImageUrl && !oldImageUrl.startsWith("data:image/")) {
    await deleteProfileImageFile(oldImageUrl);
  }

  return user.toSafeObject();
};

/**
 * @param {Object} file
 * @returns {Promise<string>}
 */
export const uploadProfileImage = async (file) => {
  const { validateImage, processProfileImage, saveImage } = await import("#utils/imageProcessor.js");
  const path = await import("path");
  const { fileURLToPath } = await import("url");
  const { dirname } = path;

  validateImage(file);

  const processedBuffer = await processProfileImage(file.buffer);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const uploadDir = path.join(__dirname, "../../public/uploads/profiles");

  const { filename } = await saveImage(processedBuffer, uploadDir);

  return `/uploads/profiles/${filename}`;
};
