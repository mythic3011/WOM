/**
 * @file hash.js
 * @description Password hashing utilities using bcrypt
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency bcryptjs
 * @see backend/src/services/authService.js
 * @see backend/src/models/User.js
 */

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) =>
  await bcrypt.hash(password, SALT_ROUNDS);

/**
 * @param {string} password - Plain text password to compare
 * @param {string} hashedPassword - Hashed password to compare against
 * @returns {Promise<boolean>} True if passwords match
 */
export const comparePassword = async (password, hashedPassword) =>
  await bcrypt.compare(password, hashedPassword);
