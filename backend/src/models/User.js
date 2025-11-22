import bcrypt from "bcryptjs";
import { DataTypes } from "sequelize";
import sequelize from "#config/database.js";

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
 * Get user object without large fields (for localStorage storage)
 * Excludes base64 images and other large data that exceed storage limits
 */
User.prototype.toStorageObject = function () {
  const safeUser = this.toSafeObject();

  // Remove large fields that shouldn't be stored in localStorage
  const {
    profileImage,
    avatar,
    photo,
    ...storageUser
  } = safeUser;

  // Keep a flag to indicate if user has a profile image
  if (profileImage || avatar || photo) {
    storageUser.hasProfileImage = true;
  }

  return storageUser;
};

User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.isAdmin = function () {
  return this.role === "admin";
};

User.prototype.isActive = function () {
  return this.status === "active";
};

User.prototype.getFullName = function () {
  return this.title ? `${this.title} ${this.name}` : this.name;
};

export default User;
