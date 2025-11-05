import { storage } from "./storageService.js";
import { hashPassword } from "/src/utils/core/crypto.js";

export const userService = {
  validateUsername(username) {
    if (!username) return false;
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    return usernameRegex.test(username);
  },

  validateEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePhone(phone) {
    if (!phone) return true;
    const phoneRegex = /^[2-9][0-9]{7}$/;
    return phoneRegex.test(phone);
  },

  validateAge(birthdate) {
    if (!birthdate) return false;
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

  checkDuplicateUsername(username) {
    const users = storage.getItem("registeredUsers", []);
    return users.some((u) => u.username === username);
  },

  checkDuplicateEmail(email) {
    const users = storage.getItem("registeredUsers", []);
    return users.some((u) => u.email === email.toLowerCase());
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
      const users = storage.getItem("registeredUsers", []);
      const userIdCounter = users.length + 1;

      const generateUUID = () => {
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          }
        );
      };

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

      users.push(newUser);
      storage.setItem("registeredUsers", users);

      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async loginUser(usernameOrEmail, password) {
    try {
      const users = storage.getItem("registeredUsers", []);

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

      const { verifyPassword } = await import("/src/utils/core/crypto.js");
      const isValid = await verifyPassword(password, user.password);

      if (!isValid) {
        return { success: false, error: "Invalid password" };
      }

      user.lastLoginAt = new Date().toISOString();
      const userIndex = users.findIndex((u) => u.id === user.id);
      if (userIndex !== -1) {
        users[userIndex] = user;
        storage.setItem("registeredUsers", users);
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
      const users = storage.getItem("registeredUsers", []);
      const userIndex = users.findIndex((u) => u.id === userId);

      if (userIndex === -1) {
        return { success: false, error: "User not found" };
      }

      if (updates.email) {
        const emailExists = users.some(
          (u) => u.id !== userId && u.email === updates.email.toLowerCase()
        );
        if (emailExists) {
          return { success: false, error: "Email already in use" };
        }
        updates.email = updates.email.toLowerCase();
      }

      if (updates.phone && !this.validatePhone(updates.phone)) {
        return { success: false, error: "Invalid phone number format" };
      }

      if (updates.password) {
        updates.password = await hashPassword(updates.password);
      }

      users[userIndex] = {
        ...users[userIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      storage.setItem("registeredUsers", users);

      const currentUser = storage.getUser();
      if (currentUser && currentUser.id === userId) {
        const updatedSession = {
          ...currentUser,
          username: users[userIndex].username,
          name: users[userIndex].name,
          email: users[userIndex].email,
          profileImage: users[userIndex].profileImage,
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
