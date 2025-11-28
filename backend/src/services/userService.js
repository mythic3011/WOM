import { User } from "#models/index.js";
import { hashPassword, comparePassword } from "#utils/hash.js";
import { buildWhereClause } from "./helpers/filters.js";
import { findEntityOrThrow, checkUniqueFields } from "./helpers/entityHelpers.js";

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

export const getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ["password"] },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

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

  await user.update(updates);

  return user.toSafeObject();
};

export const deleteUser = async (id) => {
  const user = await findEntityOrThrow(User, id, "User not found");

  await user.destroy();

  return true;
};

export const verifyAndDeleteUser = async (id, password) => {
  const user = await findEntityOrThrow(User, id, "User not found");

  const isValid = await comparePassword(password, user.password);
  if (!isValid) {
    throw new Error("Invalid password");
  }

  await user.destroy();
  return true;
};

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
 * Uploads a profile image file
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} Public URL for the uploaded image
 */
export const uploadProfileImage = async (file) => {
  const { validateImage, processProfileImage, saveImage } = await import("#utils/imageProcessor.js");
  const path = await import("path");
  const { fileURLToPath } = await import("url");
  const { dirname } = path;

  // Validate the image file
  validateImage(file);

  // Process the image (resize and optimize)
  const processedBuffer = await processProfileImage(file.buffer);

  // Determine upload directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const uploadDir = path.join(__dirname, "../../public/uploads/profiles");

  // Save the processed image
  const { filename } = await saveImage(processedBuffer, uploadDir);

  // Return the public URL
  return `/uploads/profiles/${filename}`;
};
