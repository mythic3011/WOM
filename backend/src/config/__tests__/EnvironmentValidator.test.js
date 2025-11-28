import EnvironmentValidator from "../EnvironmentValidator.js";

describe("EnvironmentValidator", () => {
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("validate", () => {
    it("should pass validation with all required variables", () => {
      process.env.NODE_ENV = "development";
      process.env.PORT = "3000";
      process.env.DB_NAME = "test_db";
      process.env.DB_USER = "test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "5432";
      process.env.SESSION_SECRET = "a".repeat(32);

      const validator = new EnvironmentValidator();
      const result = validator.validate();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail validation with missing required variables", () => {
      process.env = {};

      const validator = new EnvironmentValidator();
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain("Missing required environment variable");
    });

    it("should fail validation with short SESSION_SECRET", () => {
      process.env.NODE_ENV = "development";
      process.env.PORT = "3000";
      process.env.DB_NAME = "test_db";
      process.env.DB_USER = "test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "5432";
      process.env.SESSION_SECRET = "short";

      const validator = new EnvironmentValidator();
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("SESSION_SECRET must be at least 32 characters long");
    });

    it("should fail validation with invalid PORT", () => {
      process.env.NODE_ENV = "development";
      process.env.PORT = "invalid";
      process.env.DB_NAME = "test_db";
      process.env.DB_USER = "test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "5432";
      process.env.SESSION_SECRET = "a".repeat(32);

      const validator = new EnvironmentValidator();
      const result = validator.validate();

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("PORT must be a valid number"))).toBe(true);
    });

    it("should apply default values for optional variables", () => {
      process.env.NODE_ENV = "development";
      process.env.PORT = "3000";
      process.env.DB_NAME = "test_db";
      process.env.DB_USER = "test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "5432";
      process.env.SESSION_SECRET = "a".repeat(32);

      const validator = new EnvironmentValidator();
      const result = validator.validate();

      expect(result.valid).toBe(true);
      expect(result.config.LOG_LEVEL).toBe("info");
      expect(result.config.CORS_ORIGIN).toBe("http://localhost:5173");
    });
  });

  describe("maskSensitive", () => {
    it("should mask sensitive variables", () => {
      const config = {
        DB_PASSWORD: "secret123",
        SESSION_SECRET: "supersecret",
        DB_USER: "user",
        PORT: "3000"
      };

      const validator = new EnvironmentValidator();
      const masked = validator.maskSensitive(config);

      expect(masked.DB_PASSWORD).toBe("***");
      expect(masked.SESSION_SECRET).toBe("***");
      expect(masked.DB_USER).toBe("user");
      expect(masked.PORT).toBe("3000");
    });

    it("should not modify original config object", () => {
      const config = {
        DB_PASSWORD: "secret123",
        SESSION_SECRET: "supersecret"
      };

      const validator = new EnvironmentValidator();
      validator.maskSensitive(config);

      expect(config.DB_PASSWORD).toBe("secret123");
      expect(config.SESSION_SECRET).toBe("supersecret");
    });
  });

  describe("getConfig", () => {
    it("should return config when validation passes", () => {
      process.env.NODE_ENV = "development";
      process.env.PORT = "3000";
      process.env.DB_NAME = "test_db";
      process.env.DB_USER = "test_user";
      process.env.DB_PASSWORD = "test_password";
      process.env.DB_HOST = "localhost";
      process.env.DB_PORT = "5432";
      process.env.SESSION_SECRET = "a".repeat(32);

      const validator = new EnvironmentValidator();
      const config = validator.getConfig();

      expect(config).not.toBeNull();
      expect(config.DB_NAME).toBe("test_db");
    });

    it("should return null when validation fails", () => {
      process.env = {};

      const validator = new EnvironmentValidator();
      const config = validator.getConfig();

      expect(config).toBeNull();
    });
  });
});
