/**
 * @file adminUserService.js
 * @description Service for admin user management operations
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency ./apiClient.js
 * @dependency ./responseExtractor.js
 * @see apiClient.js
 * @see userService.js
 */

import { userAPI } from "./apiClient.js";
import { ResponseExtractor } from "./responseExtractor.js";

/**
 * @description Admin user service for managing users
 */
export const adminUserService = {
  /**
   * @description Lists all users with optional filters
   * @param {Object} filters - Filter criteria
   * @returns {Promise<Array>} Array of users
   */
  async list(filters = {}) {
    const resp = await userAPI.getAll(filters);
    return ResponseExtractor.extract(resp, "users");
  },

  /**
   * @description Gets a user by ID
   * @param {number|string} id - User ID
   * @returns {Promise<Object>} User data
   */
  async get(id) {
    const resp = await userAPI.getById(id);
    return ResponseExtractor.extractSingle(resp, "user");
  },

  /**
   * @description Creates a new user
   * @param {Object} data - User data
   * @returns {Promise<Object>} Created user
   */
  async create(data) {
    const resp = await userAPI.create(data);
    return ResponseExtractor.extractSingle(resp, "user");
  },

  /**
   * @description Updates a user
   * @param {number|string} id - User ID
   * @param {Object} data - Updated user data
   * @returns {Promise<Object>} Updated user
   */
  async update(id, data) {
    const resp = await userAPI.update(id, data);
    return ResponseExtractor.extractSingle(resp, "user");
  },

  /**
   * @description Removes a user
   * @param {number|string} id - User ID
   * @returns {Promise<boolean>} Success status
   */
  async remove(id) {
    await userAPI.delete(id);
    return true;
  },

  /**
   * @description Toggles user status
   * @param {number|string} id - User ID
   * @param {string} status - New status
   * @returns {Promise<Object>} Updated user
   */
  async toggleStatus(id, status) {
    const resp = await userAPI.update(id, { status });
    return ResponseExtractor.extractSingle(resp, "user");
  },

  /**
   * @description Creates multiple users from CSV data
   * @param {Array} rows - Array of user data rows
   * @param {Array} existingUsers - Existing users for duplicate checking
   * @returns {Promise<Object>} Import results with created users and errors
   */
  async bulkCreate(rows, existingUsers = []) {
    const existingByUsername = new Set(
      existingUsers.map((u) => u.username?.toLowerCase())
    );
    const existingByEmail = new Set(
      existingUsers.map((u) => u.email?.toLowerCase())
    );

    const created = [];
    const errors = [];

    for (const row of rows) {
      try {
        const username = (row.Username || "").trim();
        const password = row.Password || "";
        const email = (row.Email || "").trim();

        if (!username || !password || !email) {
          errors.push("Missing required fields for a row");
          continue;
        }

        if (existingByUsername.has(username.toLowerCase())) {
          errors.push(`Username '${username}' already exists`);
          continue;
        }
        if (existingByEmail.has(email.toLowerCase())) {
          errors.push(`Email '${email}' already registered`);
          continue;
        }

        const newUserData = {
          username,
          password,
          name: row.Name || username,
          email,
          phone: row.Phone || "",
          gender: row.Gender || "prefer_not_to_say",
          birthday: row.Birthday || null,
          role: (row.Role || "user").toLowerCase(),
          status: "active",
          title: "",
          profileImage: null,
        };

        const createdUser = await this.create(newUserData);
        if (createdUser) {
          created.push(createdUser);
          existingByUsername.add(username.toLowerCase());
          existingByEmail.add(email.toLowerCase());
        }
      } catch (err) {
        errors.push(err.message || "Failed to create user");
      }
    }

    return { imported: created.length, errors, created };
  },
};
