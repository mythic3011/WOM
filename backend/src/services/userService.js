import { User } from "../models/index.js";
import { hashPassword } from "../utils/hash.js";
import { Op } from "sequelize";

export const getAllUsers = async (filters = {}) => {
  const where = {};

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${filters.search}%` } },
      { email: { [Op.iLike]: `%${filters.search}%` } },
      { username: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

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

  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email }, { username }],
    },
  });

  if (existingUser) {
    throw new Error("Email or username already exists");
  }

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
  const user = await User.findByPk(id);

  if (!user) {
    throw new Error("User not found");
  }

  if (updates.password) {
    updates.password = await hashPassword(updates.password);
  }

  if (updates.email && updates.email !== user.email) {
    const existingUser = await User.findOne({
      where: {
        email: updates.email,
        id: { [Op.ne]: id },
      },
    });

    if (existingUser) {
      throw new Error("Email already exists");
    }
  }

  if (updates.username && updates.username !== user.username) {
    const existingUser = await User.findOne({
      where: {
        username: updates.username,
        id: { [Op.ne]: id },
      },
    });

    if (existingUser) {
      throw new Error("Username already exists");
    }
  }

  await user.update(updates);

  return user.toSafeObject();
};

export const deleteUser = async (id) => {
  const user = await User.findByPk(id);

  if (!user) {
    throw new Error("User not found");
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
