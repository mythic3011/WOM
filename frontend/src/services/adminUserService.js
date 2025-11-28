import { userAPI } from "./apiClient.js";
import { ResponseExtractor } from "./responseExtractor.js";

export const adminUserService = {
  async list(filters = {}) {
    const resp = await userAPI.getAll(filters);
    return ResponseExtractor.extract(resp, "users");
  },

  async get(id) {
    const resp = await userAPI.getById(id);
    return ResponseExtractor.extractSingle(resp, "user");
  },

  async create(data) {
    const resp = await userAPI.create(data);
    return ResponseExtractor.extractSingle(resp, "user");
  },

  async update(id, data) {
    const resp = await userAPI.update(id, data);
    return ResponseExtractor.extractSingle(resp, "user");
  },

  async remove(id) {
    await userAPI.delete(id);
    return true;
  },

  async toggleStatus(id, status) {
    const resp = await userAPI.update(id, { status });
    return ResponseExtractor.extractSingle(resp, "user");
  },

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
