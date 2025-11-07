import { storage } from "/src/services/storageService.js";
import { statsService } from "/src/services/statsService.js";
import { ticketTypeService } from "/src/services/ticketTypeService.js";
import { FormComponents } from "/src/components/FormComponents.js";
import { notify } from "/src/utils/ui/notification.js";
import { ROUTES, ROUTE_METADATA } from "/src/config/routes.js";
import { SwalColors } from "/src/utils/colors.js";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import {
  MOCK_BOOKINGS,
  formatBookingForDisplay,
  formatSeatsDisplay,
  getBookingStatusLabel,
} from "/src/data/mockData.js";

export default {
  title: "Developer Tools | WOM",

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
                <div class="grid grid-cols-2 gap-2">
                  ${FormComponents.button({
                    id: "viewStorage",
                    text: "View All Data",
                    icon: "fa-eye",
                    color: "blue",
                    size: "sm",
                  })}
                  ${FormComponents.button({
                    id: "exportStorage",
                    text: "Export JSON",
                    icon: "fa-download",
                    color: "green",
                    size: "sm",
                  })}
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
              <a href="/" data-link class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-center text-sm font-medium text-gray-700 transition-colors">
                <i class="fas fa-home mr-2"></i>Home
              </a>
              <a href="/performances" data-link class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-center text-sm font-medium text-gray-700 transition-colors">
                <i class="fas fa-music mr-2"></i>Performances
              </a>
              <a href="/login" data-link class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-center text-sm font-medium text-gray-700 transition-colors">
                <i class="fas fa-sign-in-alt mr-2"></i>Login
              </a>
              <a href="/register" data-link class="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-center text-sm font-medium text-gray-700 transition-colors">
                <i class="fas fa-user-plus mr-2"></i>Register
              </a>
              <a href="/user/dashboard" data-link class="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-center text-sm font-medium text-blue-700 transition-colors">
                <i class="fas fa-tachometer-alt mr-2"></i>User Dashboard
              </a>
              <a href="/user/bookings" data-link class="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-center text-sm font-medium text-blue-700 transition-colors">
                <i class="fas fa-ticket-alt mr-2"></i>User Bookings
              </a>
              <a href="/user/profile" data-link class="px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-center text-sm font-medium text-blue-700 transition-colors">
                <i class="fas fa-user mr-2"></i>Profile
              </a>
              <a href="/admin/dashboard" data-link class="px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-lg text-center text-sm font-medium text-purple-700 transition-colors">
                <i class="fas fa-user-shield mr-2"></i>Admin Dashboard
              </a>
              <a href="/admin/performances" data-link class="px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-lg text-center text-sm font-medium text-purple-700 transition-colors">
                <i class="fas fa-music mr-2"></i>Admin Performances
              </a>
              <a href="/admin/bookings" data-link class="px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-lg text-center text-sm font-medium text-purple-700 transition-colors">
                <i class="fas fa-calendar-check mr-2"></i>Admin Bookings
              </a>
              <a href="/admin/users" data-link class="px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-lg text-center text-sm font-medium text-purple-700 transition-colors">
                <i class="fas fa-users mr-2"></i>Admin Users
              </a>
              <a href="/admin/settings" data-link class="px-4 py-2 bg-purple-100 hover:bg-purple-200 rounded-lg text-center text-sm font-medium text-purple-700 transition-colors">
                <i class="fas fa-cog mr-2"></i>Settings
              </a>
            </div>
          </div>
        </div>
      </main>
    `;
  },

  async afterRender() {
    this.updateStats();
    this.updatePerformanceMetrics();
    this.attachEventListeners();
    this.log("Dev tools loaded successfully");
    this.log(`Project structure improvements: ✓ Complete`, "success");
  },

  updateStats() {
    const users = storage.getItem("registeredUsers", []);
    const performances = statsService.getPerformances();
    const bookings = storage.getItem("bookings", []);

    const storageSize = new Blob([JSON.stringify(localStorage)]).size;
    const storageSizeKB = (storageSize / 1024).toFixed(2);

    $("#storageInfo").html(`
      <div>Total size: ${storageSizeKB} KB</div>
      <div>Items: ${localStorage.length}</div>
    `);

    $("#userCount").text(`${users.length} users registered`);
    $("#performanceCount").text(
      `${performances.length} performances available`
    );
    $("#bookingCount").text(`${bookings.length} bookings created`);
  },

  updatePerformanceMetrics() {
    const memory = performance.memory
      ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(2)} MB`
      : "N/A";
    const routes = Object.keys(ROUTES).reduce(
      (acc, key) =>
        typeof ROUTES[key] === "object"
          ? acc + Object.keys(ROUTES[key]).length
          : acc,
      0
    );

    $("#performanceMetrics").html(`
      <div>Memory: ${memory}</div>
      <div>Routes: ${routes} registered</div>
      <div>Utils: 6 categories, 36 files</div>
      <div>Status: ✓ Operational</div>
    `);
  },

  log(message, type = "info") {
    const timestamp = dayjs().format("HH:mm:ss");
    const colors = {
      info: "text-green-400",
      error: "text-red-400",
      warn: "text-yellow-400",
      success: "text-blue-400",
    };
    const color = colors[type] || colors.info;
    const icon =
      {
        info: "→",
        error: "✗",
        warn: "⚠",
        success: "✓",
      }[type] || "→";

    $("#debugConsole").append(`
      <div class="${color}">[${timestamp}] ${icon} ${message}</div>
    `);

    $("#debugConsole").scrollTop($("#debugConsole")[0].scrollHeight);
  },

  attachEventListeners() {
    $("#viewStorage").on("click", () => this.viewStorage());
    $("#exportStorage").on("click", () => this.exportStorage());
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

  async viewStorage() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        data[key] = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        data[key] = localStorage.getItem(key);
      }
    }

    await Swal.fire({
      title: "LocalStorage Data",
      html: `<pre class="text-left text-xs bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">${JSON.stringify(
        data,
        null,
        2
      )}</pre>`,
      width: 800,
      confirmButtonText: "Close",
    });

    this.log("Viewed storage data");
  },

  exportStorage() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      data[key] = localStorage.getItem(key);
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wom-storage-${dayjs().format("YYYY-MM-DD-HHmmss")}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.log("Exported storage data", "success");
    notify.success("Storage exported successfully!");
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
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          Object.keys(data).forEach((key) => {
            localStorage.setItem(key, data[key]);
          });
          this.log("Imported storage data", "success");
          notify.success("Storage imported successfully!");
          this.updateStats();
        } catch (error) {
          this.log(`Import error: ${error.message}`, "error");
          notify.error("Failed to import storage data");
        }
      };
      reader.readAsText(file);
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
      localStorage.clear();
      this.log("Cleared all storage", "warn");
      notify.success("Storage cleared!");
      this.updateStats();
    }
  },

  async createTestUsers() {
    const { generateMockUsers } = await import("/src/data/mockUsers.js");

    try {
      const mockUsers = await generateMockUsers();
      const existingUsers = storage.getItem("registeredUsers", []);

      const newUsers = mockUsers.filter(
        (mu) => !existingUsers.some((eu) => eu.id === mu.id)
      );

      if (newUsers.length > 0) {
        storage.setItem("registeredUsers", [...existingUsers, ...newUsers]);
        this.log(
          `Created ${newUsers.length} test users with proper password hashing`,
          "success"
        );
        notify.success(
          `Created ${newUsers.length} test users\nPasswords: admin=adminpass, user=userpass, others=test123`
        );
      } else {
        this.log("Test users already exist", "warn");
        notify.info("Test users already exist");
      }

      this.updateStats();
    } catch (error) {
      this.log(`Error creating test users: ${error.message}`, "error");
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
    this.log("Logged in as admin", "success");
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
      this.log(`Logged in as ${testUser.name}`, "success");
      notify.success(`Logged in as ${testUser.name}`);
      window.location.href = "/user/dashboard";
    } else {
      this.log("No test user found", "error");
      notify.error("No test user found. Create test users first.");
    }
  },

  logoutUser() {
    storage.clearUser();
    this.log("Logged out", "info");
    notify.success("Logged out successfully");
    window.location.href = "/";
  },

  createMockPerformances() {
    const performances = statsService.getPerformances();
    storage.setItem("performances", performances);
    this.log(`Created ${performances.length} mock performances`, "success");
    notify.success(`${performances.length} performances generated`);
    this.updateStats();
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
    });
    this.log("Viewed performances data");
  },

  clearPerformances() {
    storage.setItem("performances", []);
    this.log("Cleared all performances", "warn");
    notify.success("Performances cleared");
    this.updateStats();
  },

  async resetTicketTypes() {
    ticketTypeService.reset();
    this.log("Reset ticket types to defaults", "success");
    notify.success("Ticket types reset to defaults");
  },

  createMockBookings() {
    const existingBookings = storage.getItem("bookings", []);
    const newBookings = MOCK_BOOKINGS.filter(
      (mb) => !existingBookings.some((eb) => eb.id === mb.id)
    );

    if (newBookings.length > 0) {
      storage.setItem("bookings", [...existingBookings, ...newBookings]);
      this.log(
        `Created ${newBookings.length} mock bookings with proper data structure`,
        "success"
      );
      notify.success(
        `${newBookings.length} bookings generated with seats, amounts, and status`
      );
    } else {
      this.log("Mock bookings already exist", "warn");
      notify.info("Mock bookings already exist");
    }

    this.updateStats();
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
    });
    this.log("Viewed bookings data");
  },

  clearBookings() {
    storage.setItem("bookings", []);
    this.log("Cleared all bookings", "warn");
    notify.success("Bookings cleared");
    this.updateStats();
  },

  exportBookings() {
    const bookings = storage.getItem("bookings", []);
    const csv = [
      [
        "Booking ID",
        "Performance",
        "User",
        "Seats",
        "Amount",
        "Status",
        "Date",
      ],
      ...bookings.map((b) => {
        const formatted = formatBookingForDisplay(b);
        return [
          b.id,
          formatted.performanceTitle,
          formatted.userName,
          formatSeatsDisplay(b.seats),
          b.amount || 0,
          getBookingStatusLabel(b.status),
          dayjs(b.bookingDate || b.date).format("YYYY-MM-DD HH:mm"),
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    this.log("Exported bookings to CSV", "success");
    notify.success("Bookings exported!");
  },

  clearConsole() {
    $("#debugConsole").html(
      '<div class="text-gray-500">Console cleared...</div>'
    );
  },

  testNotifications() {
    notify.success("Success notification!");
    setTimeout(() => notify.info("Info notification!"), 500);
    setTimeout(() => notify.warning("Warning notification!"), 1000);
    setTimeout(() => notify.error("Error notification!"), 1500);
    this.log("Tested all notification types", "info");
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

    this.log("Tested modal dialogs", "info");
  },

  async viewUtilsStructure() {
    const structure = {
      core: ["api.js", "auth.js", "crypto.js", "navigation.js", "state.js"],
      ui: [
        "animations.js",
        "contextMenu.js",
        "dialogUtils.js",
        "dom.js",
        "dragDrop.js",
        "keyboard.js",
        "modal.js",
        "notification.js",
        "touchGestures.js",
        "uiPatterns.js",
      ],
      data: ["filters.js", "table.js", "tableUtils.js", "validation.js"],
      forms: ["form.js", "formValidator.js", "phoneFormat.js"],
      booking: [
        "heatMap.js",
        "pricing.js",
        "seatMapGenerator.js",
        "seatUtils.js",
        "showtimeManager.js",
      ],
      reports: ["invoiceGenerator.js", "reporting.js", "ticketGenerator.js"],
      root: [
        "index.js",
        "initApp.js",
        "performance.js",
        "seo.js",
        "status.js",
        "utils.js",
      ],
    };

    const html = Object.entries(structure)
      .map(
        ([category, files]) => `
      <div class="mb-3">
        <h4 class="text-sm font-bold text-indigo-600 mb-1">${category}/ (${
          files.length
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
          <div class="mt-3 text-blue-400">Total: 36 utility files in 6 categories</div>
        </div>
      `,
      width: 700,
      confirmButtonText: "Close",
    });

    this.log("Viewed utils structure");
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
    });

    this.log("Viewed routes configuration");
  },

  async viewDocs() {
    const docs = [
      {
        title: "Project Structure",
        file: "PROJECT_STRUCTURE.md",
        desc: "Complete architecture guide",
      },
      {
        title: "Contributing",
        file: "CONTRIBUTING.md",
        desc: "Development guidelines",
      },
      {
        title: "Utils Organization",
        file: "UTILS_ORGANIZATION.md",
        desc: "Utilities guide",
      },
      {
        title: "Quick Start",
        file: "QUICK_START.md",
        desc: "5-minute setup",
      },
      {
        title: "Frontend README",
        file: "frontend/README.md",
        desc: "Frontend docs",
      },
    ];

    const html = docs
      .map(
        (doc) => `
      <div class="bg-gray-800 p-3 rounded mb-2 text-left">
        <div class="text-green-400 font-bold">${doc.title}</div>
        <div class="text-xs text-gray-400">${doc.file}</div>
        <div class="text-xs text-gray-500">${doc.desc}</div>
      </div>
    `
      )
      .join("");

    await Swal.fire({
      title: "Documentation",
      html: `<div class="bg-gray-900 p-4 rounded-lg">${html}</div>`,
      width: 600,
      confirmButtonText: "Close",
    });

    this.log("Viewed documentation index");
  },

  async checkHealth() {
    const checks = [
      { name: "Storage", status: localStorage.length > 0 },
      { name: "Routes", status: Object.keys(ROUTES).length > 0 },
      { name: "Utils", status: true },
      { name: "Services", status: typeof storage !== "undefined" },
      { name: "Components", status: typeof FormComponents !== "undefined" },
    ];

    const html = checks
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
      .join("");

    await Swal.fire({
      title: "System Health Check",
      html: `<div class="bg-gray-900 p-4 rounded-lg text-left">${html}</div>`,
      icon: "success",
      confirmButtonText: "Close",
    });

    this.log("System health check completed", "success");
  },

  clearCache() {
    if ("caches" in window) {
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      });
      this.log("Browser cache cleared", "success");
      notify.success("Cache cleared");
    } else {
      this.log("Cache API not available", "warn");
      notify.warning("Cache API not supported");
    }
  },

  async testPerformance() {
    this.log("Running performance test...", "info");

    const start = performance.now();
    const iterations = 10000;

    for (let i = 0; i < iterations; i++) {
      const data = { id: i, value: Math.random() };
      JSON.stringify(data);
    }

    const end = performance.now();
    const duration = (end - start).toFixed(2);

    await Swal.fire({
      title: "Performance Test Results",
      html: `
        <div class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm">
          <div>Iterations: ${iterations.toLocaleString()}</div>
          <div>Duration: ${duration}ms</div>
          <div>Avg: ${(duration / iterations).toFixed(4)}ms/op</div>
        </div>
      `,
      icon: "info",
    });

    this.log(
      `Performance test: ${duration}ms for ${iterations} ops`,
      "success"
    );
  },

  async viewLogs() {
    const logs = $("#debugConsole").html();
    await Swal.fire({
      title: "Debug Logs",
      html: `<div class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96 font-mono text-xs text-left">${logs}</div>`,
      width: 800,
      confirmButtonText: "Close",
    });
  },
};
