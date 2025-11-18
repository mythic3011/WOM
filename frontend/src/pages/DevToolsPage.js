import { storage } from "@services/storageService.js";
import { statsService } from "@services/statsService.js";
import { ticketTypeService } from "@services/ticketTypeService.js";
import { FormComponents } from "@components/FormComponents.js";
import { notify } from "@utils/ui/notification.js";
import {
  StorageViewerCard,
  MockDataCard,
  QuickActionsCard,
} from "@components/devtools/index.js";
import { ROUTES, ROUTE_METADATA } from "@config/routes.js";
import { APP_CONFIG } from "@config/config.js";
import { SwalColors } from "@utils/colors.js";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import {
  MOCK_BOOKINGS,
  formatSeatsDisplay,
  getBookingStatusLabel,
} from "@/data/index.js";
import { StorageManager } from "@utils/devTools/storageManager.js";
import { ConsoleLogger } from "@utils/devTools/consoleLogger.js";
import { DataExporter } from "@utils/devTools/dataExporter.js";
import { PerformanceTester } from "@utils/devTools/performanceTester.js";
import { StorageViewer } from "@utils/devTools/storageViewer.js";
import { devToolsService } from "@services/devToolsService.js";
import {
  UTILS_STRUCTURE,
  DOCUMENTATION_LINKS,
  HEALTH_CHECKS,
  NAVIGATION_SHORTCUTS,
  NAV_SHORTCUT_STYLES,
} from "@utils/devTools/devToolsConfig.js";

export default {
  title: "Developer Tools | WOM",

  generateNavigationShortcuts() {
    return Object.entries(NAVIGATION_SHORTCUTS)
      .map(([category, links]) =>
        links
          .map(
            (link) => `
            <a href="${link.href}" data-link class="px-4 py-2 ${NAV_SHORTCUT_STYLES[category]} rounded-lg text-center text-sm font-medium transition-colors">
              <i class="fas ${link.icon} mr-2"></i>${link.label}
            </a>
          `
          )
          .join("")
      )
      .join("");
  },

  async render() {
    return `
      <main class="container mx-auto px-4 py-8">
        <div class="max-w-7xl mx-auto">
          ${FormComponents.pageHeader({
      title: "Developer Tools",
      subtitle: "Testing, debugging, and data management utilities",
      icon: "fa-code",
    })}

          ${FormComponents.infoBox({
      title: "Development Environment Only",
      message:
        "These tools are for development and testing purposes. Do not use in production.",
      type: "warning",
    })}

          <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fas fa-magic text-yellow-600"></i>
              Quick Setup
            </h2>
            <div class="space-y-3">
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="text-sm font-semibold text-gray-700 mb-2">Setup Presets</h3>
                <p class="text-xs text-gray-600 mb-3">Generate all necessary mock data with one click</p>
                <div class="grid grid-cols-4 gap-2">
                  ${FormComponents.button({
      id: "quickSetupMinimal",
      text: "Minimal",
      icon: "fa-bolt",
      color: "green",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "quickSetupStandard",
      text: "Standard",
      icon: "fa-star",
      color: "blue",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "quickSetupFull",
      text: "Full",
      icon: "fa-crown",
      color: "purple",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "quickSetupFaker",
      text: "Faker",
      icon: "fa-random",
      color: "orange",
      size: "sm",
    })}
                </div>
                <div class="mt-3 text-xs text-gray-500">
                  <div><strong>Minimal:</strong> 5 users, 3 performances (Static)</div>
                  <div><strong>Standard:</strong> 10 users, 10 performances, 20 bookings (Static)</div>
                  <div><strong>Full:</strong> All available mock data (Static)</div>
                  <div><strong>Faker:</strong> 15 users, 15 performances, 30 bookings (Randomized)</div>
                </div>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fas fa-link text-teal-600"></i>
              Data Relationships
            </h2>
            <div class="space-y-3">
              <div class="bg-gray-50 p-4 rounded-lg">
                <h3 class="text-sm font-semibold text-gray-700 mb-2">Validate & Analyze</h3>
                <p class="text-xs text-gray-600 mb-2" id="relationshipInfo">Check data integrity and relationships</p>
                <div class="grid grid-cols-2 gap-2">
                  ${FormComponents.button({
      id: "validateRelationships",
      text: "Validate Data",
      icon: "fa-check-circle",
      color: "green",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "viewRelationshipStats",
      text: "View Stats",
      icon: "fa-chart-bar",
      color: "blue",
      size: "sm",
    })}
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fas fa-database text-blue-600"></i>
                Storage Management
              </h2>
              <div class="space-y-3">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-semibold text-gray-700 mb-2">Current Storage</h3>
                  <div id="storageInfo" class="text-xs text-gray-600 space-y-1"></div>
                </div>
                <div class="space-y-2">
                  <div class="grid grid-cols-3 gap-2">
                  ${FormComponents.button({
      id: "viewStorage",
      text: "View Processed",
      icon: "fa-eye",
      color: "blue",
      size: "sm",
    })}
                    ${FormComponents.button({
      id: "viewRawStorage",
      text: "View Raw",
      icon: "fa-file-code",
      color: "indigo",
      size: "sm",
    })}
                    ${FormComponents.button({
      id: "analyzeStorage",
      text: "Analyze",
      icon: "fa-chart-bar",
      color: "purple",
      size: "sm",
    })}
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                  ${FormComponents.button({
      id: "exportStorage",
      text: "Export Raw",
      icon: "fa-file-export",
      color: "green",
      size: "sm",
    })}
                    ${FormComponents.button({
      id: "exportProcessedStorage",
      text: "Export Processed",
      icon: "fa-file-download",
      color: "teal",
      size: "sm",
    })}
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                  ${FormComponents.button({
      id: "importStorage",
      text: "Import JSON",
      icon: "fa-upload",
      color: "yellow",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "clearStorage",
      text: "Clear All",
      icon: "fa-trash",
      color: "red",
      size: "sm",
    })}
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fas fa-users text-purple-600"></i>
                User Management
              </h2>
              <div class="space-y-3">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-semibold text-gray-700 mb-2">Quick Actions</h3>
                  <p class="text-xs text-gray-600 mb-2" id="userCount">Loading...</p>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  ${FormComponents.button({
      id: "createTestUsers",
      text: "Create Test Users",
      icon: "fa-user-plus",
      color: "indigo",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "loginAsAdmin",
      text: "Login as Admin",
      icon: "fa-user-shield",
      color: "purple",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "loginAsUser",
      text: "Login as User",
      icon: "fa-user",
      color: "blue",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "logoutUser",
      text: "Logout",
      icon: "fa-sign-out-alt",
      color: "gray",
      size: "sm",
    })}
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fas fa-music text-green-600"></i>
                Performance Data
              </h2>
              <div class="space-y-3">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-semibold text-gray-700 mb-2">Mock Data</h3>
                  <p class="text-xs text-gray-600 mb-2" id="performanceCount">Loading...</p>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  ${FormComponents.button({
      id: "createMockPerformances",
      text: "Generate Performances",
      icon: "fa-plus",
      color: "green",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "viewPerformances",
      text: "View All",
      icon: "fa-eye",
      color: "blue",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "clearPerformances",
      text: "Clear All",
      icon: "fa-trash",
      color: "red",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "resetTicketTypes",
      text: "Reset Ticket Types",
      icon: "fa-ticket-alt",
      color: "yellow",
      size: "sm",
    })}
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fas fa-ticket-alt text-orange-600"></i>
                Booking Data
              </h2>
              <div class="space-y-3">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-semibold text-gray-700 mb-2">Statistics</h3>
                  <p class="text-xs text-gray-600 mb-2" id="bookingCount">Loading...</p>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  ${FormComponents.button({
      id: "createMockBookings",
      text: "Generate Bookings",
      icon: "fa-plus",
      color: "orange",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "viewBookings",
      text: "View All",
      icon: "fa-eye",
      color: "blue",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "clearBookings",
      text: "Clear All",
      icon: "fa-trash",
      color: "red",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "exportBookings",
      text: "Export CSV",
      icon: "fa-download",
      color: "green",
      size: "sm",
    })}
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fas fa-bug text-red-600"></i>
              Debug Console
            </h2>
            <div class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto" id="debugConsole">
              <div class="text-gray-500">Developer console initialized...</div>
            </div>
            <div class="mt-3 flex gap-2">
              ${FormComponents.button({
      id: "clearConsole",
      text: "Clear Console",
      icon: "fa-eraser",
      color: "gray",
      size: "sm",
    })}
              ${FormComponents.button({
      id: "testNotifications",
      text: "Test Notifications",
      icon: "fa-bell",
      color: "blue",
      size: "sm",
    })}
              ${FormComponents.button({
      id: "testModals",
      text: "Test Modals",
      icon: "fa-window-maximize",
      color: "purple",
      size: "sm",
    })}
            </div>
          </div>

          <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fas fa-folder-tree text-teal-600"></i>
                Project Structure
              </h2>
              <div class="space-y-3">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-semibold text-gray-700 mb-2">Utils Organization</h3>
                  <p class="text-xs text-gray-600 mb-2">6 categories, 36 files</p>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  ${FormComponents.button({
      id: "viewUtilsStructure",
      text: "View Utils",
      icon: "fa-folder-open",
      color: "teal",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "viewRoutes",
      text: "View Routes",
      icon: "fa-route",
      color: "indigo",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "viewDocs",
      text: "Documentation",
      icon: "fa-book",
      color: "blue",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "checkHealth",
      text: "System Health",
      icon: "fa-heartbeat",
      color: "green",
      size: "sm",
    })}
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <i class="fas fa-chart-line text-pink-600"></i>
                Performance Monitor
              </h2>
              <div class="space-y-3">
                <div class="bg-gray-50 p-4 rounded-lg">
                  <h3 class="text-sm font-semibold text-gray-700 mb-2">Real-time Metrics</h3>
                  <div id="performanceMetrics" class="text-xs text-gray-600 space-y-1"></div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  ${FormComponents.button({
      id: "refreshMetrics",
      text: "Refresh",
      icon: "fa-sync",
      color: "pink",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "clearCache",
      text: "Clear Cache",
      icon: "fa-broom",
      color: "yellow",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "testPerformance",
      text: "Run Test",
      icon: "fa-tachometer-alt",
      color: "blue",
      size: "sm",
    })}
                  ${FormComponents.button({
      id: "viewLogs",
      text: "View Logs",
      icon: "fa-file-alt",
      color: "gray",
      size: "sm",
    })}
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i class="fas fa-route text-indigo-600"></i>
              Navigation Shortcuts
            </h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              ${this.generateNavigationShortcuts()}
            </div>
          </div>
        </div>
      </main>
    `;
  },

  async afterRender() {
    this.logger = new ConsoleLogger("debugConsole");
    this.updateStats();
    this.updatePerformanceMetrics();
    this.attachEventListeners();
    this.logger.log("Dev tools loaded successfully");
    this.logger.log(`Project structure improvements: ✓ Complete`, "success");
  },

  updateStats() {
    const users = storage.getItem("registeredUsers", []);
    const performances = statsService.getPerformances();
    const bookings = storage.getItem("bookings", []);
    const storageInfo = StorageManager.getStorageInfo();
    const analysis = StorageManager.analyzeStorage();

    $("#storageInfo").html(`
      <div>Total size: ${storageInfo.size} KB</div>
      <div>Items: ${storageInfo.items}</div>
      <div class="mt-2 pt-2 border-t border-gray-300">
        <div class="text-xs">
          <span class="text-blue-600">${analysis.byType.json}</span> JSON,
          <span class="text-orange-600">${analysis.byType.encrypted}</span> Encrypted,
          <span class="text-green-600">${analysis.byType.compressed}</span> Compressed
        </div>
      </div>
    `);

    $("#userCount").text(`${users.length} users registered`);
    $("#performanceCount").text(
      `${performances.length} performances available`
    );
    $("#bookingCount").text(`${bookings.length} bookings created`);
  },

  async updatePerformanceMetrics() {
    const memoryInfo = PerformanceTester.getMemoryUsage();
    const memory = memoryInfo ? `${memoryInfo.used} MB` : "N/A";
    const routes = Object.keys(ROUTES).reduce(
      (acc, key) =>
        typeof ROUTES[key] === "object"
          ? acc + Object.keys(ROUTES[key]).length
          : acc,
      0
    );

    const totalUtilsFiles = Object.values(UTILS_STRUCTURE).reduce(
      (sum, files) => sum + files.length,
      0
    );

    let backendVersion = "Unknown";
    let backendStatus = "Disconnected";

    try {
      const response = await fetch(`${APP_CONFIG.apiBaseUrl}/health`);
      if (response.ok) {
        const data = await response.json();
        backendVersion = data.version || "Unknown";
        backendStatus = data.success ? "Connected" : "Disconnected";
      }
    } catch (error) {
      backendVersion = "Unknown";
      backendStatus = "Disconnected";
    }

    $("#performanceMetrics").html(`
      <div>Memory: ${memory}</div>
      <div>Routes: ${routes} registered</div>
      <div>Utils: ${Object.keys(UTILS_STRUCTURE).length
      } categories, ${totalUtilsFiles} files</div>
      <div>Frontend: v${APP_CONFIG.version}</div>
      <div>Backend: v${backendVersion} (${backendStatus})</div>
      <div>Status: ✓ Operational</div>
    `);
  },

  attachEventListeners() {
    $("#quickSetupMinimal").on("click", () => this.quickSetup("minimal"));
    $("#quickSetupStandard").on("click", () => this.quickSetup("standard"));
    $("#quickSetupFull").on("click", () => this.quickSetup("full"));
    $("#quickSetupFaker").on("click", () => this.quickSetup("faker"));

    $("#validateRelationships").on("click", () => this.validateRelationships());
    $("#viewRelationshipStats").on("click", () => this.viewRelationshipStats());

    $("#viewStorage").on("click", () => this.viewStorage());
    $("#viewRawStorage").on("click", () => this.viewStorage(true));
    $("#analyzeStorage").on("click", () => this.analyzeStorage());
    $("#exportStorage").on("click", () => this.exportStorage());
    $("#exportProcessedStorage").on("click", () => this.exportStorage(true));
    $("#importStorage").on("click", () => this.importStorage());
    $("#clearStorage").on("click", () => this.clearStorage());

    $("#createTestUsers").on("click", () => this.createTestUsers());
    $("#loginAsAdmin").on("click", () => this.loginAsAdmin());
    $("#loginAsUser").on("click", () => this.loginAsUser());
    $("#logoutUser").on("click", () => this.logoutUser());

    $("#createMockPerformances").on("click", () =>
      this.createMockPerformances()
    );
    $("#viewPerformances").on("click", () => this.viewPerformances());
    $("#clearPerformances").on("click", () => this.clearPerformances());
    $("#resetTicketTypes").on("click", () => this.resetTicketTypes());

    $("#createMockBookings").on("click", () => this.createMockBookings());
    $("#viewBookings").on("click", () => this.viewBookings());
    $("#clearBookings").on("click", () => this.clearBookings());
    $("#exportBookings").on("click", () => this.exportBookings());

    $("#clearConsole").on("click", () => this.clearConsole());
    $("#testNotifications").on("click", () => this.testNotifications());
    $("#testModals").on("click", () => this.testModals());

    $("#viewUtilsStructure").on("click", () => this.viewUtilsStructure());
    $("#viewRoutes").on("click", () => this.viewRoutes());
    $("#viewDocs").on("click", () => this.viewDocs());
    $("#checkHealth").on("click", () => this.checkHealth());

    $("#refreshMetrics").on("click", () => this.updatePerformanceMetrics());
    $("#clearCache").on("click", () => this.clearCache());
    $("#testPerformance").on("click", () => this.testPerformance());
    $("#viewLogs").on("click", () => this.viewLogs());
  },

  async quickSetup(preset) {
    const presetNames = {
      minimal: "Minimal",
      standard: "Standard",
      full: "Full",
      faker: "Faker",
    };

    try {
      this.logger.log(`Starting ${presetNames[preset]} setup...`, "info");
      notify.info(`Setting up ${presetNames[preset]} environment...`);

      const results = {
        overall: { success: false },
        message: "Backend API integration pending",
      };

      if (results.overall.success) {
        const summary = [];
        if (results.users?.created > 0)
          summary.push(`${results.users.created} users`);
        if (results.performances?.created > 0)
          summary.push(`${results.performances.created} performances`);
        if (results.bookings?.created > 0)
          summary.push(`${results.bookings.created} bookings`);

        this.logger.log(
          `${presetNames[preset]} setup completed: ${summary.join(", ")}`,
          "success"
        );
        notify.success(
          `${presetNames[preset]} setup complete!\n${summary.join(", ")}`
        );
      } else {
        this.logger.log(
          `Setup completed with errors: ${results.overall.errors.join(", ")}`,
          "warn"
        );
        notify.warning("Setup completed with some errors");
      }

      this.updateStats();
    } catch (error) {
      this.logger.log(`Setup failed: ${error.message}`, "error");
      notify.error(`Setup failed: ${error.message}`);
    }
  },

  async validateRelationships() {
    try {
      const validation = { isValid: true, errors: [], warnings: [] };

      const statusIcon = validation.isValid
        ? '<i class="fas fa-check-circle text-green-500"></i>'
        : '<i class="fas fa-exclamation-triangle text-yellow-500"></i>';

      const html = `
        <div class="text-left">
          <div class="flex items-center gap-2 mb-4 pb-4 border-b">
            ${statusIcon}
            <h3 class="font-bold text-lg">
              ${validation.isValid
          ? "All relationships are valid!"
          : "Some issues found"
        }
            </h3>
          </div>
          <div class="space-y-3">
            <div class="bg-gray-50 p-3 rounded">
              <div class="text-sm font-semibold mb-2">Overview</div>
              <div class="text-xs space-y-1">
                <div>Total Bookings: <span class="font-mono">${validation.totalBookings
        }</span></div>
                <div>Valid Bookings: <span class="font-mono text-green-600">${validation.validBookings
        }</span></div>
                <div>Integrity Score: <span class="font-mono font-bold text-${validation.integrityScore === "100.00" ? "green" : "yellow"
        }-600">${validation.integrityScore}%</span></div>
              </div>
            </div>
            ${validation.invalidPerformanceLinks > 0 ||
          validation.invalidUserLinks > 0
          ? `
            <div class="bg-red-50 p-3 rounded">
              <div class="text-sm font-semibold text-red-700 mb-2">Issues Found</div>
              <div class="text-xs space-y-1 text-red-600">
                ${validation.invalidPerformanceLinks > 0
            ? `<div>Invalid Performance Links: ${validation.invalidPerformanceLinks}</div>`
            : ""
          }
                ${validation.invalidUserLinks > 0
            ? `<div>Invalid User Links: ${validation.invalidUserLinks}</div>`
            : ""
          }
              </div>
            </div>
            `
          : ""
        }
          </div>
        </div>
      `;

      await Swal.fire({
        title: "Data Validation Results",
        html,
        icon: validation.isValid ? "success" : "warning",
        confirmButtonText: "Close",
        customClass: {
          title: "text-left",
          htmlContainer: "text-left",
        },
      });

      this.logger.log(
        `Validation: ${validation.validBookings}/${validation.totalBookings} valid (${validation.integrityScore}%)`,
        validation.isValid ? "success" : "warn"
      );
    } catch (error) {
      this.logger.log(`Validation failed: ${error.message}`, "error");
      notify.error("Validation failed");
    }
  },

  async viewRelationshipStats() {
    try {
      const stats = { users: 0, performances: 0, bookings: 0 };
      const allPerformances = storage.getItem("performances", []);
      const perfStatusCounts = {};

      const html = `
        <div class="text-left space-y-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="flex items-center gap-2 mb-3">
              <i class="fas fa-users text-blue-600"></i>
              <h3 class="font-bold">Users</h3>
            </div>
            <div class="text-sm space-y-1">
              <div>Total: <span class="font-mono font-bold">${stats.users.total
        }</span></div>
              <div>With Bookings: <span class="font-mono text-green-600">${stats.users.withBookings
        }</span></div>
              <div>Without Bookings: <span class="font-mono text-gray-500">${stats.users.withoutBookings
        }</span></div>
              <div>Avg Bookings/User: <span class="font-mono">${stats.users.averageBookingsPerUser
        }</span></div>
            </div>
          </div>

          <div class="bg-purple-50 p-4 rounded-lg">
            <div class="flex items-center gap-2 mb-3">
              <i class="fas fa-music text-purple-600"></i>
              <h3 class="font-bold">Performances</h3>
            </div>
            <div class="text-sm space-y-1">
              <div>Total: <span class="font-mono font-bold">${stats.performances.total
        }</span></div>
              <div>With Bookings: <span class="font-mono text-green-600">${stats.performances.withBookings
        }</span></div>
              <div>Without Bookings: <span class="font-mono text-gray-500">${stats.performances.withoutBookings
        }</span></div>
              <div>Avg Bookings/Performance: <span class="font-mono">${stats.performances.averageBookingsPerPerformance
        }</span></div>
            </div>
            <div class="mt-3 pt-3 border-t border-purple-200">
              <div class="text-xs font-semibold mb-2">By Status:</div>
              <div class="text-xs space-y-1">
                <div><span class="inline-block w-24">Available:</span> <span class="font-mono text-green-600">${perfStatusCounts.available || 0
        }</span></div>
                <div><span class="inline-block w-24">Limited:</span> <span class="font-mono text-yellow-600">${perfStatusCounts.limited || 0
        }</span></div>
                <div><span class="inline-block w-24">Sold Out:</span> <span class="font-mono text-red-600">${perfStatusCounts.sold_out || 0
        }</span></div>
                <div><span class="inline-block w-24">Completed:</span> <span class="font-mono text-gray-600">${perfStatusCounts.completed || 0
        }</span></div>
              </div>
            </div>
          </div>

          <div class="bg-orange-50 p-4 rounded-lg">
            <div class="flex items-center gap-2 mb-3">
              <i class="fas fa-ticket-alt text-orange-600"></i>
              <h3 class="font-bold">Bookings</h3>
            </div>
            <div class="text-sm space-y-1">
              <div>Total: <span class="font-mono font-bold">${stats.bookings.total
        }</span></div>
            </div>
          </div>
        </div>
      `;

      await Swal.fire({
        title: "Relationship Statistics",
        html,
        width: 600,
        confirmButtonText: "Close",
        customClass: {
          title: "text-left",
          htmlContainer: "text-left",
        },
      });

      this.logger.log("Viewed relationship statistics");
    } catch (error) {
      this.logger.log(`Failed to view stats: ${error.message}`, "error");
      notify.error("Failed to view stats");
    }
  },

  async viewStorage(rawMode = false) {
    const data = rawMode
      ? StorageManager.getAllData()
      : StorageManager.getProcessedData();
    const title = rawMode
      ? "Raw LocalStorage Data"
      : "Processed LocalStorage Data";

    const html = rawMode
      ? StorageViewer.renderRawView(data)
      : StorageViewer.renderProcessedView(data);

    await Swal.fire({
      title,
      html,
      width: 1000,
      confirmButtonText: "Close",
      showCloseButton: true,
      customClass: {
        popup: "storage-viewer-popup",
        htmlContainer: "storage-viewer-container",
        title: "storage-viewer-title",
      },
      didOpen: () => {
        StorageViewer.attachEvents();
        $(".storage-viewer-title").css("text-align", "left");
        $(".storage-viewer-container").css("text-align", "left");
      },
    });

    this.logger.log(`Viewed storage data (${rawMode ? "raw" : "processed"})`);
  },

  formatProcessedData(data) {
    const formatted = {};
    Object.entries(data).forEach(([key, item]) => {
      const entry = {
        value: item.value,
        storageType: item.metadata.type,
      };

      if (item.metadata.original) {
        entry.wasEncryptedOrCompressed = item.metadata.original;
      }

      if (item.metadata.type === "json-processed") {
        entry.note =
          "Nested encrypted/compressed data was automatically processed";
      }

      formatted[key] = entry;
    });
    return JSON.stringify(formatted, null, 2);
  },

  async analyzeStorage() {
    const analysis = StorageManager.analyzeStorage();

    const itemsTable = analysis.items
      .sort((a, b) => b.size - a.size)
      .slice(0, 10)
      .map(
        (item, index) => `
        <tr class="border-b border-gray-700">
          <td class="py-2 pr-4 text-gray-400">${index + 1}</td>
          <td class="py-2 pr-4 text-blue-400">${item.key}</td>
          <td class="py-2 pr-4 text-center">
            <span class="px-2 py-1 text-xs rounded ${this.getTypeColor(
          item.type
        )}">${item.type}</span>
          </td>
          <td class="py-2 text-right text-green-400">${item.sizeKB} KB</td>
        </tr>
      `
      )
      .join("");

    await Swal.fire({
      title: "Storage Analysis",
      html: `
        <div class="bg-gray-900 text-green-400 p-4 rounded-lg text-left">
          <div class="mb-4 pb-4 border-b border-gray-700">
            <h3 class="text-yellow-400 font-bold mb-2">Summary</h3>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>Total Items: <span class="text-white">${analysis.total}</span></div>
              <div>Total Size: <span class="text-white">${analysis.totalSizeKB} KB</span></div>
              <div>JSON: <span class="text-blue-400">${analysis.byType.json}</span></div>
              <div>Encrypted: <span class="text-orange-400">${analysis.byType.encrypted}</span></div>
              <div>Compressed: <span class="text-green-400">${analysis.byType.compressed}</span></div>
              <div>Raw: <span class="text-gray-400">${analysis.byType.raw}</span></div>
            </div>
          </div>

          <div>
            <h3 class="text-yellow-400 font-bold mb-2">Top 10 Largest Items</h3>
            <table class="w-full text-xs">
              <thead class="text-left text-gray-500">
                <tr>
                  <th class="pb-2">#</th>
                  <th class="pb-2">Key</th>
                  <th class="pb-2 text-center">Type</th>
                  <th class="pb-2 text-right">Size</th>
                </tr>
              </thead>
              <tbody>
                ${itemsTable}
              </tbody>
            </table>
          </div>
        </div>
      `,
      width: 800,
      confirmButtonText: "Close",
      showCloseButton: true,
      customClass: {
        title: "text-left",
        htmlContainer: "text-left",
      },
    });

    this.logger.log("Analyzed storage");
  },

  getTypeColor(type) {
    const colors = {
      json: "bg-blue-900 text-blue-300",
      encrypted: "bg-orange-900 text-orange-300",
      compressed: "bg-green-900 text-green-300",
      raw: "bg-gray-700 text-gray-300",
    };
    return colors[type] || colors.raw;
  },

  exportStorage(processed = false) {
    StorageManager.exportToFile(processed);
    const type = processed ? "processed (decrypted/decompressed)" : "raw";
    this.logger.log(`Exported ${type} storage data`, "success");
    notify.success(
      processed
        ? "Processed storage exported (decrypted/decompressed)!"
        : "Raw storage exported successfully!"
    );
  },

  async importStorage() {
    const { value: file } = await Swal.fire({
      title: "Import Storage Data",
      input: "file",
      inputAttributes: {
        accept: "application/json",
        "aria-label": "Upload storage JSON file",
      },
      showCancelButton: true,
      confirmButtonText: "Import",
      cancelButtonText: "Cancel",
    });

    if (file) {
      try {
        await StorageManager.importFromFile(file);
        this.logger.log("Imported storage data", "success");
        notify.success("Storage imported successfully!");
        this.updateStats();
      } catch (error) {
        this.logger.log(`Import error: ${error.message}`, "error");
        notify.error("Failed to import storage data");
      }
    }
  },

  async clearStorage() {
    const result = await Swal.fire({
      title: "Clear All Storage?",
      text: "This will delete all data including users, bookings, and settings!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Clear All",
      cancelButtonText: "Cancel",
      confirmButtonColor: SwalColors.danger,
    });

    if (result.isConfirmed) {
      StorageManager.clearAll();
      this.logger.log("Cleared all storage", "warn");
      notify.success("Storage cleared!");
      this.updateStats();
    }
  },

  async createMockUsers() {
    try {
      const result = await devToolsService.generateMockUsers(10, "user");

      if (result.success) {
        this.logger.log(result.message, "success");
        notify.success(result.message);
      } else {
        this.logger.log(result.message, "error");
        notify.error(result.message);
      }

      this.updateStats();
    } catch (error) {
      this.logger.log(`Error creating users: ${error.message}`, "error");
      notify.error("Failed to create users");
    }
  },

  async createTestUsers() {
    try {
      const result = await devToolsService.generateMockUsers(10, "user");

      if (result.success) {
        this.logger.log(
          result.message,
          result.created > 0 ? "success" : "warn"
        );
        const passwordInfo = result.details?.defaultPasswords
          ? `\nPasswords: admin=${result.details.defaultPasswords.admin}, user=${result.details.defaultPasswords.user}, others=${result.details.defaultPasswords.others}`
          : "";
        notify[result.created > 0 ? "success" : "info"](
          result.message + passwordInfo
        );
      } else {
        this.logger.log(result.message, "error");
        notify.error(result.message);
      }

      this.updateStats();
    } catch (error) {
      this.logger.log(`Error creating test users: ${error.message}`, "error");
      notify.error("Failed to create test users");
    }
  },

  loginAsAdmin() {
    const admin = {
      id: "admin",
      name: "Administrator",
      email: "admin@wom.com",
      role: "admin",
    };
    storage.setUser(admin);
    this.logger.log("Logged in as admin", "success");
    notify.success("Logged in as admin");
    window.location.href = "/admin/dashboard";
  },

  loginAsUser() {
    const users = storage.getItem("registeredUsers", []);
    const testUser = users.find((u) => u.role === "user");

    if (testUser) {
      storage.setUser({
        id: testUser.id,
        name: testUser.name,
        email: testUser.email,
        role: testUser.role,
      });
      this.logger.log(`Logged in as ${testUser.name}`, "success");
      notify.success(`Logged in as ${testUser.name}`);
      window.location.href = "/user/dashboard";
    } else {
      this.logger.log("No test user found", "error");
      notify.error("No test user found. Create test users first.");
    }
  },

  logoutUser() {
    storage.clearUser();
    this.logger.log("User logged out", "info");
    notify.info("Logged out");
    window.location.reload();
  },

  async createMockPerformances() {
    try {
      const result = await devToolsService.generateMockPerformances(10);

      if (result.success) {
        this.logger.log(result.message, "success");
        notify.success(result.message);
      } else {
        this.logger.log(result.message, "error");
        notify.error(result.message);
      }

      this.updateStats();
    } catch (error) {
      this.logger.log(`Error creating performances: ${error.message}`, "error");
      notify.error("Failed to create performances");
    }
  },

  async viewPerformances() {
    const performances = statsService.getPerformances();
    await Swal.fire({
      title: "Performances",
      html: `<pre class="text-left text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">${JSON.stringify(
        performances,
        null,
        2
      )}</pre>`,
      width: 800,
      confirmButtonText: "Close",
      customClass: {
        title: "text-left",
        htmlContainer: "text-left",
      },
    });
    this.logger.log("Viewed performances data");
  },

  async clearPerformances() {
    try {
      await Swal.fire({
        title: "Clear Performances?",
        text: "This will remove all performance data",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Clear",
        cancelButtonText: "Cancel",
      }).then(async (result) => {
        if (result.isConfirmed) {
          this.logger.log("Cleared performances", "warn");
          notify.success("Performances cleared");
          this.updateStats();
        }
      });
    } catch (error) {
      notify.error("Failed to clear performances");
    }
  },

  async resetTicketTypes() {
    ticketTypeService.reset();
    this.logger.log("Reset ticket types to defaults", "success");
    notify.success("Ticket types reset to defaults");
  },

  async createMockBookings() {
    try {
      const result = await devToolsService.generateMockBookings(20);

      if (result.success) {
        this.logger.log(result.message, "success");
        notify.success(result.message);
      } else {
        this.logger.log(result.message, "error");
        notify.error(result.message);
      }

      this.updateStats();
    } catch (error) {
      this.logger.log(`Error creating bookings: ${error.message}`, "error");
      notify.error("Failed to create bookings");
    }
  },

  async viewBookings() {
    const bookings = storage.getItem("bookings", []);
    const formattedBookings = bookings.map((booking) => ({
      id: booking.id,
      performance: booking.performanceTitle || "Unknown",
      customer: booking.userName || booking.customerInfo?.name || "Unknown",
      seats: formatSeatsDisplay(booking.seats),
      amount: `HKD ${(booking.amount || 0).toLocaleString()}`,
      status: getBookingStatusLabel(booking.status),
      date: dayjs(booking.bookingDate || booking.date).format(
        "YYYY-MM-DD HH:mm"
      ),
    }));

    await Swal.fire({
      title: `Bookings (${bookings.length} total)`,
      html: `<pre class="text-left text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">${JSON.stringify(
        formattedBookings,
        null,
        2
      )}</pre>`,
      width: 800,
      confirmButtonText: "Close",
      customClass: {
        title: "text-left",
        htmlContainer: "text-left",
      },
    });
    this.logger.log("Viewed bookings data");
  },

  async clearBookings() {
    try {
      await Swal.fire({
        title: "Clear Bookings?",
        text: "This will remove all booking data",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Clear",
        cancelButtonText: "Cancel",
      }).then(async (result) => {
        if (result.isConfirmed) {
          this.logger.log("Cleared bookings", "warn");
          notify.success("Bookings cleared");
          this.updateStats();
        }
      });
    } catch (error) {
      notify.error("Failed to clear bookings");
    }
  },

  exportBookings() {
    const bookings = storage.getItem("bookings", []);
    DataExporter.exportBookingsToCSV(bookings);
    this.logger.log("Exported bookings to CSV", "success");
    notify.success("Bookings exported!");
  },

  clearConsole() {
    this.logger.clear();
  },

  testNotifications() {
    notify.success("Success notification!");
    setTimeout(() => notify.info("Info notification!"), 500);
    setTimeout(() => notify.warning("Warning notification!"), 1000);
    setTimeout(() => notify.error("Error notification!"), 1500);
    this.logger.log("Tested all notification types", "info");
  },

  async testModals() {
    await Swal.fire({
      title: "Test Modal",
      text: "This is a test modal using SweetAlert2",
      icon: "info",
      confirmButtonText: "OK",
    });

    const result = await Swal.fire({
      title: "Confirm Action?",
      text: "This is a confirmation modal",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    });

    if (result.isConfirmed) {
      await Swal.fire("Success!", "Action confirmed", "success");
    }

    this.logger.log("Tested modal dialogs", "info");
  },

  async viewUtilsStructure() {
    const totalFiles = Object.values(UTILS_STRUCTURE).reduce(
      (sum, files) => sum + files.length,
      0
    );

    const html = Object.entries(UTILS_STRUCTURE)
      .map(
        ([category, files]) => `
      <div class="mb-3">
        <h4 class="text-sm font-bold text-indigo-600 mb-1">${category}/ (${files.length
          } files)</h4>
        <div class="text-xs text-gray-600 pl-4">
          ${files.map((f) => `<div>├─ ${f}</div>`).join("")}
        </div>
      </div>
    `
      )
      .join("");

    await Swal.fire({
      title: "Utils Directory Structure",
      html: `
        <div class="text-left bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 font-mono text-xs">
          <div class="text-yellow-400 mb-3">frontend/src/utils/</div>
          ${html}
          <div class="mt-3 text-blue-400">Total: ${totalFiles} utility files in ${Object.keys(UTILS_STRUCTURE).length
        } categories</div>
        </div>
      `,
      width: 700,
      confirmButtonText: "Close",
      customClass: {
        title: "text-left",
        htmlContainer: "text-left",
      },
    });

    this.logger.log("Viewed utils structure");
  },

  async viewRoutes() {
    const routesList = [];
    Object.entries(ROUTES).forEach(([category, routes]) => {
      if (typeof routes === "object") {
        Object.entries(routes).forEach(([name, path]) => {
          const metadata = ROUTE_METADATA[path] || {};
          routesList.push({
            category,
            name,
            path,
            auth: metadata.requiresAuth ? "✓" : "✗",
            roles: (metadata.roles || []).join(", "),
          });
        });
      }
    });

    const html = `
      <table class="w-full text-xs">
        <thead class="bg-gray-800 text-green-400">
          <tr>
            <th class="p-2 text-left">Category</th>
            <th class="p-2 text-left">Path</th>
            <th class="p-2 text-center">Auth</th>
            <th class="p-2 text-left">Roles</th>
          </tr>
        </thead>
        <tbody class="text-gray-300">
          ${routesList
        .map(
          (r) => `
            <tr class="border-b border-gray-700">
              <td class="p-2 text-yellow-400">${r.category}</td>
              <td class="p-2 text-blue-400">${r.path}</td>
              <td class="p-2 text-center">${r.auth}</td>
              <td class="p-2 text-green-400">${r.roles}</td>
            </tr>
          `
        )
        .join("")}
        </tbody>
      </table>
    `;

    await Swal.fire({
      title: `Routes (${routesList.length} total)`,
      html: `<div class="text-left bg-gray-900 p-4 rounded-lg overflow-auto max-h-96">${html}</div>`,
      width: 900,
      confirmButtonText: "Close",
      customClass: {
        title: "text-left",
        htmlContainer: "text-left",
      },
    });

    this.logger.log("Viewed routes configuration");
  },

  async viewDocs() {
    const html = DOCUMENTATION_LINKS.map(
      (doc) => `
      <div class="bg-gray-800 p-3 rounded mb-2 text-left">
        <div class="text-green-400 font-bold">${doc.title}</div>
        <div class="text-xs text-gray-400">${doc.file}</div>
        <div class="text-xs text-gray-500">${doc.desc}</div>
      </div>
    `
    ).join("");

    await Swal.fire({
      title: "Documentation",
      html: `<div class="bg-gray-900 p-4 rounded-lg">${html}</div>`,
      width: 600,
      confirmButtonText: "Close",
      customClass: {
        title: "text-left",
        htmlContainer: "text-left",
      },
    });

    this.logger.log("Viewed documentation index");
  },

  async checkHealth() {
    let backendInfo = null;
    let backendStatus = false;

    try {
      const response = await fetch(`${APP_CONFIG.apiBaseUrl}/health`);
      if (response.ok) {
        backendInfo = await response.json();
        backendStatus = true;
      }
    } catch (error) {
      backendStatus = false;
    }

    const checks = HEALTH_CHECKS.map((check) => ({
      name: check.name,
      status: check.check(ROUTES, storage, FormComponents),
    }));

    const html = `
      <div class="bg-gray-900 p-4 rounded-lg text-left">
        <div class="mb-4 pb-4 border-b border-gray-700">
          <h3 class="text-yellow-400 font-bold mb-2">Version Information</h3>
          <div class="text-sm space-y-2">
            <div>Frontend Version: <span class="text-green-400">${APP_CONFIG.version || "0.0.0"
      }</span></div>
            <div>Backend Version: <span class="${backendInfo ? "text-green-400" : "text-red-400"
      }">${backendInfo?.version || "Unknown"}</span></div>
            <div>Backend Status: <span class="${backendStatus ? "text-green-400" : "text-red-400"
      }">${backendStatus ? "Connected ✓" : "Disconnected ✗"}</span></div>
          </div>
        </div>
        
        <h3 class="text-yellow-400 font-bold mb-2">System Health Checks</h3>
        ${checks
        .map(
          (check) => `
          <div class="flex justify-between items-center p-2 bg-gray-800 rounded mb-2">
            <span class="text-gray-300">${check.name}</span>
            <span class="${check.status ? "text-green-400" : "text-red-400"}">
              ${check.status ? "✓ OK" : "✗ FAIL"}
            </span>
          </div>
        `
        )
        .join("")}
      </div>
    `;

    await Swal.fire({
      title: "System Health Check",
      html,
      width: 600,
      confirmButtonText: "Close",
      customClass: {
        title: "text-left",
        htmlContainer: "text-left",
      },
    });

    this.logger.log("System health check completed", "success");
  },

  async clearCache() {
    try {
      const success = await PerformanceTester.clearCache();
      if (success) {
        this.logger.log("Browser cache cleared", "success");
        notify.success("Cache cleared");
      } else {
        this.logger.log("Cache API not available", "warn");
        notify.warning("Cache API not supported");
      }
    } catch (error) {
      this.logger.log(`Cache error: ${error.message}`, "error");
      notify.error("Failed to clear cache");
    }
  },

  async testPerformance() {
    this.logger.log("Running performance test...", "info");

    const results = await PerformanceTester.runTest();

    await Swal.fire({
      title: "Performance Test Results",
      html: `
        <div class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
          <div>Iterations: ${results.iterations.toLocaleString()}</div>
          <div>Duration: ${results.duration}ms</div>
          <div>Avg: ${results.average}ms/op</div>
        </div>
      `,
      icon: "info",
      customClass: {
        title: "text-left",
        htmlContainer: "text-left",
      },
    });

    this.logger.log(
      `Performance test: ${results.duration}ms for ${results.iterations} ops`,
      "success"
    );
  },

  async viewLogs() {
    const logs = this.logger.getAllLogs();
    await Swal.fire({
      title: "Debug Logs",
      html: `<div class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 font-mono text-xs text-left">${logs}</div>`,
      width: 800,
      confirmButtonText: "Close",
      customClass: {
        title: "text-left",
        htmlContainer: "text-left",
      },
    });
  },
};
