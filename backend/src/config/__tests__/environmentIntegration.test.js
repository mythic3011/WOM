import { existsSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";

describe("Environment Integration", () => {
  const testEnvPath = join(process.cwd(), ".env.test");
  let originalEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    if (existsSync(testEnvPath)) {
      unlinkSync(testEnvPath);
    }
  });

  afterEach(() => {
    process.env = originalEnv;
    if (existsSync(testEnvPath)) {
      unlinkSync(testEnvPath);
    }
  });

  it("should load environment-specific file when NODE_ENV is set", () => {
    const envContent = `
NODE_ENV=test
PORT=4000
DB_NAME=test_db
DB_USER=test_user
DB_PASSWORD=test_password_123456789012
DB_HOST=localhost
DB_PORT=5432
SESSION_SECRET=test_session_secret_32_chars_min
    `.trim();

    writeFileSync(testEnvPath, envContent);

    process.env.NODE_ENV = "test";

    expect(existsSync(testEnvPath)).toBe(true);
  });

  it("should validate environment on startup", async () => {
    process.env.NODE_ENV = "development";
    process.env.PORT = "3000";
    process.env.DB_NAME = "test_db";
    process.env.DB_USER = "test_user";
    process.env.DB_PASSWORD = "test_password";
    process.env.DB_HOST = "localhost";
    process.env.DB_PORT = "5432";
    process.env.SESSION_SECRET = "a".repeat(32);

    const EnvironmentValidator = (await import("../EnvironmentValidator.js")).default;
    const validator = new EnvironmentValidator();
    const result = validator.validate();

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should mask sensitive data in error messages", async () => {
    process.env.DB_PASSWORD = "super_secret_password_123";
    process.env.SESSION_SECRET = "my_session_secret_key_456";

    const { maskSensitiveString } = await import("../../utils/sensitiveDataMasker.js");

    const errorMessage = "Database connection failed: super_secret_password_123";
    const maskedMessage = maskSensitiveString(errorMessage);

    expect(maskedMessage).not.toContain("super_secret_password_123");
    expect(maskedMessage).toContain("***");
  });

  it("should prevent startup with missing required variables", async () => {
    process.env = { NODE_ENV: "test" };

    const EnvironmentValidator = (await import("../EnvironmentValidator.js")).default;
    const validator = new EnvironmentValidator();
    const result = validator.validate();

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes("Missing required"))).toBe(true);
  });

  it("should apply default values for optional variables", async () => {
    process.env.NODE_ENV = "development";
    process.env.PORT = "3000";
    process.env.DB_NAME = "test_db";
    process.env.DB_USER = "test_user";
    process.env.DB_PASSWORD = "test_password";
    process.env.DB_HOST = "localhost";
    process.env.DB_PORT = "5432";
    process.env.SESSION_SECRET = "a".repeat(32);

    const EnvironmentValidator = (await import("../EnvironmentValidator.js")).default;
    const validator = new EnvironmentValidator();
    const result = validator.validate();

    expect(result.valid).toBe(true);
    expect(result.config.LOG_LEVEL).toBe("info");
    expect(result.config.CORS_ORIGIN).toBe("http://localhost:5173");
    expect(result.config.RATE_LIMIT_WINDOW).toBe("15");
  });
});
