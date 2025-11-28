class EnvironmentValidator {
  constructor(schema) {
    this.schema = schema || this.getDefaultSchema();
  }

  getDefaultSchema() {
    return {
      required: [
        "NODE_ENV",
        "PORT",
        "DB_NAME",
        "DB_USER",
        "DB_PASSWORD",
        "DB_HOST",
        "DB_PORT",
        "SESSION_SECRET"
      ],
      optional: [
        "CORS_ORIGIN",
        "RATE_LIMIT_WINDOW",
        "RATE_LIMIT_MAX",
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_SECURE",
        "SMTP_USER",
        "SMTP_PASS",
        "SMTP_FROM",
        "FRONTEND_URL",
        "FRONTEND_PORT",
        "VITE_API_URL",
        "LOG_LEVEL",
        "PGADMIN_EMAIL",
        "PGADMIN_PASSWORD",
        "PHPPGADMIN_PORT",
        "DB_SYNC_FORCE",
        "DB_AUTOSETUP",
        "AUTO_SETUP",
        "RESET_DB",
        "SEED_DATA_AMOUNT",
        "DB_POOL_MAX",
        "DB_POOL_MIN",
        "DB_LOGGING",
        "QUERY_LOGGING",
        "SLOW_QUERY_THRESHOLD",
        "POSTGRES_DB",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "POSTGRES_HOST"
      ],
      sensitive: [
        "DB_PASSWORD",
        "SESSION_SECRET",
        "SMTP_PASS",
        "PGADMIN_PASSWORD",
        "POSTGRES_PASSWORD"
      ],
      defaults: {
        PORT: "3000",
        NODE_ENV: "development",
        LOG_LEVEL: "info",
        CORS_ORIGIN: "http://localhost:5173",
        RATE_LIMIT_WINDOW: "15",
        RATE_LIMIT_MAX: "100",
        DB_PORT: "5432",
        DB_SYNC_FORCE: "false",
        DB_AUTOSETUP: "false",
        AUTO_SETUP: "false",
        RESET_DB: "false",
        SEED_DATA_AMOUNT: "full",
        DB_POOL_MAX: "5",
        DB_POOL_MIN: "0",
        DB_LOGGING: "true",
        QUERY_LOGGING: "verbose",
        SLOW_QUERY_THRESHOLD: "100"
      }
    };
  }

  validate() {
    const errors = [];
    const warnings = [];
    const config = {};

    for (const key of this.schema.required) {
      const value = process.env[key];
      
      if (!value || value.trim() === "") {
        errors.push(`Missing required environment variable: ${key}`);
      } else {
        config[key] = value;
      }
    }

    for (const key of this.schema.optional) {
      const value = process.env[key];
      
      if (value !== undefined && value !== null) {
        config[key] = value;
      } else if (this.schema.defaults[key] !== undefined) {
        config[key] = this.schema.defaults[key];
        warnings.push(`Using default value for ${key}: ${this.schema.defaults[key]}`);
      }
    }

    this.validateSessionSecret(config, errors);
    this.validatePort(config, errors);
    this.validateNodeEnv(config, warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      config
    };
  }

  validateSessionSecret(config, errors) {
    if (config.SESSION_SECRET && config.SESSION_SECRET.length < 32) {
      errors.push("SESSION_SECRET must be at least 32 characters long");
    }
  }

  validatePort(config, errors) {
    if (config.PORT) {
      const port = parseInt(config.PORT, 10);
      if (isNaN(port) || port < 1 || port > 65535) {
        errors.push(`PORT must be a valid number between 1 and 65535, got: ${config.PORT}`);
      }
    }
  }

  validateNodeEnv(config, warnings) {
    const validEnvs = ["development", "production", "test", "staging"];
    if (config.NODE_ENV && !validEnvs.includes(config.NODE_ENV)) {
      warnings.push(`NODE_ENV value "${config.NODE_ENV}" is not standard. Expected: ${validEnvs.join(", ")}`);
    }
  }

  getConfig() {
    const result = this.validate();
    if (!result.valid) {
      return null;
    }
    return result.config;
  }

  maskSensitive(config) {
    const masked = { ...config };
    
    for (const key of this.schema.sensitive) {
      if (masked[key]) {
        masked[key] = "***";
      }
    }
    
    return masked;
  }

  logConfig(config) {
    const masked = this.maskSensitive(config);
    console.log("Environment Configuration:");
    
    const sortedKeys = Object.keys(masked).sort();
    for (const key of sortedKeys) {
      console.log(`  ${key}: ${masked[key]}`);
    }
  }
}

export default EnvironmentValidator;
