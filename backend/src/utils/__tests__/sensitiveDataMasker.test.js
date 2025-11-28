import {
  maskSensitiveData,
  maskSensitiveString,
  maskSensitiveObject,
  isSensitiveKey
} from "../sensitiveDataMasker.js";

describe("sensitiveDataMasker", () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.DB_PASSWORD = "secret_password_123";
    process.env.SESSION_SECRET = "my_session_secret_key";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("maskSensitiveString", () => {
    it("should mask sensitive values in strings", () => {
      const input = "Connection failed with password: secret_password_123";
      const result = maskSensitiveString(input);

      expect(result).toBe("Connection failed with password: ***");
      expect(result).not.toContain("secret_password_123");
    });

    it("should mask multiple sensitive values", () => {
      const input = "DB: secret_password_123, Session: my_session_secret_key";
      const result = maskSensitiveString(input);

      expect(result).not.toContain("secret_password_123");
      expect(result).not.toContain("my_session_secret_key");
      expect(result).toContain("***");
    });

    it("should return unchanged string if no sensitive data", () => {
      const input = "This is a safe string";
      const result = maskSensitiveString(input);

      expect(result).toBe(input);
    });
  });

  describe("maskSensitiveObject", () => {
    it("should mask sensitive keys in objects", () => {
      const input = {
        username: "admin",
        db_password: "secret123",
        session_secret: "mysecret",
        port: 3000
      };

      const result = maskSensitiveObject(input);

      expect(result.username).toBe("admin");
      expect(result.db_password).toBe("***");
      expect(result.session_secret).toBe("***");
      expect(result.port).toBe(3000);
    });

    it("should mask nested sensitive data", () => {
      const input = {
        database: {
          host: "localhost",
          password: "secret123"
        },
        session: {
          secret: "mysecret"
        }
      };

      const result = maskSensitiveObject(input);

      expect(result.database.host).toBe("localhost");
      expect(result.database.password).toBe("***");
      expect(result.session.secret).toBe("***");
    });

    it("should handle arrays", () => {
      const input = [
        { name: "user1", password: "pass1" },
        { name: "user2", password: "pass2" }
      ];

      const result = maskSensitiveObject(input);

      expect(result[0].name).toBe("user1");
      expect(result[0].password).toBe("***");
      expect(result[1].name).toBe("user2");
      expect(result[1].password).toBe("***");
    });

    it("should not modify original object", () => {
      const input = {
        password: "secret123"
      };

      maskSensitiveObject(input);

      expect(input.password).toBe("secret123");
    });
  });

  describe("isSensitiveKey", () => {
    it("should identify sensitive keys", () => {
      expect(isSensitiveKey("DB_PASSWORD")).toBe(true);
      expect(isSensitiveKey("SESSION_SECRET")).toBe(true);
      expect(isSensitiveKey("password")).toBe(true);
      expect(isSensitiveKey("secret")).toBe(true);
    });

    it("should identify non-sensitive keys", () => {
      expect(isSensitiveKey("DB_HOST")).toBe(false);
      expect(isSensitiveKey("PORT")).toBe(false);
      expect(isSensitiveKey("username")).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(isSensitiveKey("db_password")).toBe(true);
      expect(isSensitiveKey("Password")).toBe(true);
      expect(isSensitiveKey("SESSION_secret")).toBe(true);
    });
  });

  describe("maskSensitiveData", () => {
    it("should handle string input", () => {
      const input = "Password is secret_password_123";
      const result = maskSensitiveData(input);

      expect(typeof result).toBe("string");
      expect(result).not.toContain("secret_password_123");
    });

    it("should handle object input", () => {
      const input = {
        password: "secret123"
      };
      const result = maskSensitiveData(input);

      expect(typeof result).toBe("object");
      expect(result.password).toBe("***");
    });

    it("should handle primitive values", () => {
      expect(maskSensitiveData(123)).toBe(123);
      expect(maskSensitiveData(true)).toBe(true);
      expect(maskSensitiveData(null)).toBe(null);
    });
  });
});
