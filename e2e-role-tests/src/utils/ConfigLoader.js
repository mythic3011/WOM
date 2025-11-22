import fs from 'fs/promises';
import path from 'path';

/**
 * Configuration Loader
 * Loads and validates test configuration
 */
export class ConfigLoader {
  constructor(configPath = './test-config.json') {
    this.configPath = configPath;
    this.config = null;
  }

  /**
   * Load configuration
   */
  async load() {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(data);

      // Apply environment variable overrides
      this.applyEnvironmentOverrides();

      // Validate configuration
      this.validate();

      return this.config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  /**
   * Apply environment variable overrides
   */
  applyEnvironmentOverrides() {
    if (process.env.BASE_URL) {
      this.config.baseURL = process.env.BASE_URL;
    }

    if (process.env.ADMIN_USERNAME) {
      this.config.roles.admin.username = process.env.ADMIN_USERNAME;
    }

    if (process.env.ADMIN_PASSWORD) {
      this.config.roles.admin.password = process.env.ADMIN_PASSWORD;
    }

    if (process.env.USER_USERNAME) {
      this.config.roles.user.username = process.env.USER_USERNAME;
    }

    if (process.env.USER_PASSWORD) {
      this.config.roles.user.password = process.env.USER_PASSWORD;
    }

    if (process.env.OUTPUT_DIR) {
      this.config.output.directory = process.env.OUTPUT_DIR;
    }
  }

  /**
   * Validate configuration
   */
  validate() {
    if (!this.config.baseURL) {
      throw new Error('Configuration missing: baseURL');
    }

    if (!this.config.roles || !this.config.roles.admin || !this.config.roles.user) {
      throw new Error('Configuration missing: roles');
    }

    if (!this.config.output || !this.config.output.directory) {
      throw new Error('Configuration missing: output.directory');
    }

    // Provide defaults
    this.config.workflows = this.config.workflows || { enabled: [], disabled: [] };
    this.config.errorThresholds = this.config.errorThresholds || {
      critical: 0,
      high: 5,
      medium: 10,
      low: 20
    };
    this.config.screenshots = this.config.screenshots || {
      onError: true,
      onSuccess: false,
      quality: 80
    };
    this.config.timeouts = this.config.timeouts || {
      pageLoad: 30000,
      elementWait: 10000,
      networkIdle: 5000
    };
    this.config.output.formats = this.config.output.formats || ['html', 'json', 'markdown'];
  }

  /**
   * Get configuration
   */
  getConfig() {
    return this.config;
  }
}
