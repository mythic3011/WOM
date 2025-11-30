import { User } from "#models/index.js";
import { hashPassword } from "#utils/hash.js";
import { ConflictError, UnauthorizedError } from "#utils/errors.js";

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

  // Return storage-optimized object without large base64 images
  // This prevents localStorage quota exceeded errors
  return user.toStorageObject();
};

export const getUserById = async (userId) => {
  const user = await User.findByPk(userId);

  if (!user) {
    return null;
  }

  // Return storage-optimized object for session/localStorage
  return user.toStorageObject();
};

/**
 * Get user with full data including profile image
 * Use this only when you specifically need the image
 */
export const getUserWithImage = async (userId) => {
  const user = await User.findByPk(userId);

  if (!user) {
    return null;
  }

  // Return full safe object including profile image
  return user.toSafeObject();
};
