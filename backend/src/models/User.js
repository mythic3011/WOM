/**
 * @file User.js
 * @description User model definition with authentication and profile management
 * @author A: LI Ning 25127563d
 * @author B: SHEK chinhei 25017482d
 * @dependency bcryptjs, sequelize
 * @see #config/database.js, #models/Booking.js
 */

import bcrypt from "bcryptjs";
import { DataTypes } from "sequelize";
import sequelize from "#config/database.js";

/**
 * User model representing system users with authentication and profile data
 * Supports two roles: admin and user
 * Includes automatic password hashing and email normalization
 */
const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.STRING(6),
      unique: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    birthday: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("male", "female", "prefer_not_to_say"),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM("admin", "user"),
      defaultValue: "user",
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "suspended", "deleted"),
      defaultValue: "active",
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    profileImage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeValidate: (user) => {
        if (user.email) {
          user.email = user.email.toLowerCase().trim();
        }
        if (user.username) {
          user.username = user.username.trim();
        }
      },
      beforeCreate: async (user) => {
        if (user.password && !user.password.startsWith("$2a$")) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password") && !user.password.startsWith("$2a$")) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      },
    },
    scopes: {
      active: {
        where: { status: "active" },
      },
      admin: {
        where: { role: "admin" },
      },
      users: {
        where: { role: "user" },
      },
      withBookings: {
        include: [{ association: "bookings" }],
      },
    },
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
      {
        unique: true,
        fields: ["username"],
      },
      {
        unique: true,
        fields: ["userId"],
      },
    ],
  }
);

/**
 * Converts user instance to safe object without password
 * Removes empty string fields for cleaner data
 * @returns {Object} User object without password and empty fields
 */
User.prototype.toSafeObject = function () {
  const { password: _password, ...safeUser } = this.toJSON();

  Object.keys(safeUser).forEach(key => {
    const value = safeUser[key];
    if (typeof value === 'string' && value.trim() === '') {
      delete safeUser[key];
    }
  });

  return safeUser;
};

/**
 * Converts user instance to storage-safe object
 * Uses toSafeObject to ensure password is excluded
 * @returns {Object} User object suitable for storage
 */
User.prototype.toStorageObject = function () {
  const safeUser = this.toSafeObject();
  return safeUser;
};

/**
 * Checks if profile image is stored as base64 data URL
 * @returns {boolean} True if profile image is base64 encoded
 */
User.prototype.isBase64ProfileImage = function () {
  if (!this.profileImage) {
    return false;
  }
  return this.profileImage.startsWith("data:image/");
};

/**
 * Gets profile image URL if it's a file path (not base64)
 * @returns {string|null} Profile image URL or null if base64 or missing
 */
User.prototype.getProfileImageUrl = function () {
  if (!this.profileImage) {
    return null;
  }
  if (this.isBase64ProfileImage()) {
    return null;
  }
  return this.profileImage;
};

/**
 * Compares plain text password with hashed password
 * @param {string} password - Plain text password to compare
 * @returns {Promise<boolean>} True if password matches
 */
User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

/**
 * Checks if user has admin role
 * @returns {boolean} True if user is an admin
 */
User.prototype.isAdmin = function () {
  return this.role === "admin";
};

/**
 * Checks if user account is active
 * @returns {boolean} True if user status is active
 */
User.prototype.isActive = function () {
  return this.status === "active";
};

/**
 * Gets user's full name with title if available
 * @returns {string} Full name with title (e.g., "Mr. John Doe") or just name
 */
User.prototype.getFullName = function () {
  return this.title ? `${this.title} ${this.name}` : this.name;
};

export default User;
