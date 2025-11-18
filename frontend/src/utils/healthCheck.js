import { APP_CONFIG } from "@config/config.js";

const HEALTH_CHECK_INTERVAL = 30000;
const HEALTH_ENDPOINT = `${APP_CONFIG.apiBaseUrl}/health`;

let healthCheckInterval = null;
let lastHealthStatus = null;

export const healthCheck = {
  async check() {
    const startTime = performance.now();

    try {
      const response = await fetch(HEALTH_ENDPOINT, {
        method: "GET",
        credentials: "include",
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const data = await response.json();

      const status = {
        success: response.ok,
        statusCode: response.status,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        data,
      };

      lastHealthStatus = status;

      this.logHealth(status);

      return status;
    } catch (error) {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);

      const status = {
        success: false,
        statusCode: 0,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        error: error.message,
      };

      lastHealthStatus = status;

      this.logHealth(status);

      return status;
    }
  },

  logHealth(status) {
    const statusLabel = status.success ? "[OK]" : "[FAIL]";
    const color = status.success ? "color: #10b981" : "color: #ef4444";

    console.groupCollapsed(
      `%c${statusLabel} Health Check - ${status.timestamp}`,
      `${color}; font-weight: bold; font-size: 12px;`
    );

    console.log("Status:", status.success ? "Healthy" : "Unhealthy");
    console.log("Status Code:", status.statusCode);
    console.log("Response Time:", status.responseTime);

    if (status.data) {
      console.log("API Status:", status.data.status);
      console.log("Uptime:", `${Math.floor(status.data.uptime)}s`);

      if (status.data.services) {
        console.group("Services:");
        console.log("API:", status.data.services.api);
        console.log(
          "Database:",
          status.data.services.database === "healthy"
            ? "Connected"
            : "Disconnected"
        );
        console.groupEnd();
      }
    }

    if (status.error) {
      console.error("Error:", status.error);
    }

    console.groupEnd();
  },

  startMonitoring(interval = HEALTH_CHECK_INTERVAL) {
    if (healthCheckInterval) {
      this.stopMonitoring();
    }

    console.log(
      `%cHealth Monitoring Started`,
      "color: #3b82f6; font-weight: bold; font-size: 14px;"
    );
    console.log(`Checking every ${interval / 1000} seconds`);

    this.check();

    healthCheckInterval = setInterval(() => {
      this.check();
    }, interval);
  },

  stopMonitoring() {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
      console.log(
        "%cHealth Monitoring Stopped",
        "color: #ef4444; font-weight: bold;"
      );
    }
  },

  getLastStatus() {
    return lastHealthStatus;
  },

  async checkDatabase() {
    const status = await this.check();

    if (status.data && status.data.services) {
      const dbStatus = status.data.services.database;

      console.log(
        `%cDatabase: ${dbStatus}`,
        `color: ${dbStatus === "healthy" ? "#10b981" : "#ef4444"
        }; font-weight: bold;`
      );

      return dbStatus === "healthy";
    }

    return false;
  },

  displayDashboard() {
    const status = lastHealthStatus || { success: false };

    console.clear();

    console.log(
      "%c========================================",
      "color: #8b5cf6; font-weight: bold;"
    );
    console.log(
      "%c        SYSTEM HEALTH DASHBOARD        ",
      "color: #8b5cf6; font-weight: bold;"
    );
    console.log(
      "%c========================================",
      "color: #8b5cf6; font-weight: bold;"
    );
    console.log("");

    if (status.success) {
      console.log(
        "%c[OK] System Status: HEALTHY",
        "color: #10b981; font-weight: bold; font-size: 16px;"
      );
    } else {
      console.log(
        "%c[FAIL] System Status: UNHEALTHY",
        "color: #ef4444; font-weight: bold; font-size: 16px;"
      );
    }

    console.log("");

    if (status.data) {
      console.group("Metrics");
      console.log("Response Time:", status.responseTime);
      console.log("API Uptime:", `${Math.floor(status.data.uptime || 0)}s`);
      console.log("Last Check:", status.timestamp);
      console.groupEnd();

      console.log("");

      if (status.data.services) {
        console.group("Services");
        console.log(
          `API: ${status.data.services.api === "healthy" ? "[OK]" : "[FAIL]"} ${status.data.services.api
          }`
        );
        console.log(
          `Database: ${status.data.services.database === "healthy" ? "[OK]" : "[FAIL]"
          } ${status.data.services.database}`
        );
        console.groupEnd();
      }
    } else {
      console.log("No health data available");
    }

    console.log("");
    console.log(
      "%cRun healthCheck.check() to refresh",
      "color: #6b7280; font-style: italic;"
    );
  },
};

if (typeof window !== "undefined") {
  window.healthCheck = healthCheck;
}

export default healthCheck;
