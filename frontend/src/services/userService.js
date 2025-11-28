
import { hashPassword } from "@utils/core/crypto.js";
import { generateUUID } from "@utils/utils.js";

import { bookingAPI, handleApiError, userAPI } from "./apiClient.js";
import { ResponseExtractor } from "./responseExtractor.js";
import { storage } from "./storageService.js";

export const userService = {
  async getAllUsers() {
    try {
      return ResponseExtractor.extract(await userAPI.getAll(), "users").sort(
        (a, b) => a.userId.localeCompare(b.userId)
      );
    } catch (error) {
      handleApiError(error);
      return [];
    }
  },

  validateUsername(username) {
    if (!username) {return false;}
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(username);
  },

  validateEmail(email) {
    if (!email) {return false;}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePhone(phone) {
    if (!phone) {return true;}
    const phoneRegex = /^[2-9][0-9]{7}$/;
    return phoneRegex.test(phone);
  },

  validateAge(birthdate) {
    if (!birthdate) {return false;}
    const today = new Date();
    const birth = new Date(birthdate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      return age - 1 >= 13;
    }
    return age >= 13;
  },

  async checkDuplicateUsername(username) {
    try {
      const users = await userAPI.getAll();
      return users.some((u) => u.username === username);
    } catch (error) {
      handleApiError(error);
    }
  },

  async checkDuplicateEmail(email) {
    try {
      const users = await userAPI.getAll();
      return users.some((u) => u.email === email.toLowerCase());
    } catch (error) {
      handleApiError(error);
    }
  },

  async registerUser(userData) {
    try {
      if (!this.validateUsername(userData.username)) {
        return { success: false, error: "Invalid username format" };
      }

      if (!this.validateEmail(userData.email)) {
        return { success: false, error: "Invalid email format" };
      }

      if (this.checkDuplicateUsername(userData.username)) {
        return { success: false, error: "Username already exists" };
      }

      if (this.checkDuplicateEmail(userData.email)) {
        return { success: false, error: "Email already exists" };
      }

      if (userData.phone && !this.validatePhone(userData.phone)) {
        return { success: false, error: "Invalid phone number format" };
      }

      const hashedPassword = await hashPassword(userData.password);
      const users = await userService.getAllUsers();
      const userIdCounter = users.length + 1;

      const newUser = {
        id: generateUUID(),
        userId: String(userIdCounter).padStart(6, "0"),
        username: userData.username,
        email: userData.email.toLowerCase(),
        title: userData.title || "",
        name: userData.name,
        birthday: userData.birthday || null,
        gender: userData.gender || "prefer_not_to_say",
        password: hashedPassword,
        role: "user",
        status: "active",
        profileImage: userData.profileImage || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null,
        phone: userData.phone || null,
        address: userData.address || null,
      };

      await userAPI.create(newUser);
      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async loginUser(usernameOrEmail, password) {
    try {
      const users = await userService.getAllUsers();

      const user = users.find(
        (u) =>
          u.username === usernameOrEmail ||
          u.email === usernameOrEmail ||
          u.id === usernameOrEmail
      );

      if (!user) {
        return { success: false, error: "User not found" };
      }

      if (user.status === "suspended") {
        return { success: false, error: "Account is suspended" };
      }

      const { verifyPassword } = await import("@utils/core/crypto.js");
      const isValid = await verifyPassword(password, user.password);

      if (!isValid) {
        return { success: false, error: "Invalid password" };
      }

      user.lastLoginAt = new Date().toISOString();
      const userIndex = users.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = user;
        await userAPI.update(user.id, user);
      }

      const userSession = {
        id: user.id,
        userId: user.userId,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        profileImage: user.profileImage,
      };

      storage.setUser(userSession);

      return { success: true, user: userSession };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async updateUserProfile(userId, updates) {
    try {
      if (updates.email) {
        updates.email = updates.email.toLowerCase();
      }

      if (updates.phone && !this.validatePhone(updates.phone)) {
        return { success: false, error: "Invalid phone number format" };
      }

      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }

      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      await userAPI.update(userId, updatedData);

      const currentUser = storage.getUser();
      if (currentUser && currentUser.id === userId) {
        const updatedSession = {
          ...currentUser,
          name: updates.name || currentUser.name,
          email: updates.email || currentUser.email,
          profileImage: updates.profileImage !== undefined ? updates.profileImage : currentUser.profileImage,
        };
        storage.setUser(updatedSession);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  rememberUserId(userId) {
    localStorage.setItem("rememberedUserId", userId);
  },

  getRememberedUserId() {
    return localStorage.getItem("rememberedUserId") || "";
  },

  forgetUserId() {
    localStorage.removeItem("rememberedUserId");
  },
};
