
import Swal from "sweetalert2";

import { createEmptyState } from "@components/EmptyState.js";
import { FormComponents } from "@components/FormComponents.js";
import { Toast } from "@components/Toast.js";
import { ticketTypeAPI, handleApiError } from "@services/apiClient.js";
import { ResponseExtractor } from "@services/responseExtractor.js";
import { SwalColors } from "@utils/colors.js";

// System default ticket type IDs (from seeder)
const SYSTEM_TICKET_TYPE_IDS = ["adult", "child", "senior", "student", "vip"];

export default {
  title: "Settings | Admin",
  ticketTypes: [],
  notificationSettings: {
    bookings: {
      newBooking: true,
      bookingConfirmed: true,
      bookingCancelled: true,
      bookingRefunded: false,
    },
    performances: {
      newPerformance: true,
      performanceUpdated: false,
      performanceCancelled: true,
      lowAvailability: true,
    },
    users: {
      newRegistration: false,
      accountSuspended: true,
      passwordReset: false,
    },
    system: {
      dailySummary: true,
      weeklySummary: false,
      errorAlerts: true,
      maintenanceMode: true,
    },
  },

  renderInfoBox(type, icon, title, message) {
    const colors = {
      info: {
        bg: "from-blue-50 to-indigo-50",
        border: "border-blue-200",
        iconBg: "bg-blue-500",
        text: "text-blue-800",
        titleText: "text-blue-900",
      },
      warning: {
        bg: "from-amber-50 to-orange-50",
        border: "border-amber-200",
        iconBg: "bg-amber-500",
        text: "text-amber-800",
        titleText: "text-amber-900",
      },
    };
    const c = colors[type] || colors.info;
    return `
      <div class="bg-gradient-to-br ${c.bg} rounded-lg p-4 border ${c.border}">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 ${c.iconBg} rounded-lg flex items-center justify-center flex-shrink-0">
            <i class="fas ${icon} text-white text-lg"></i>
          </div>
          <div class="flex-1">
            <h3 class="font-semibold ${c.titleText} text-sm mb-1">${title}</h3>
            <p class="text-xs ${c.text} leading-relaxed">${message}</p>
          </div>
        </div>
      </div>
    `;
  },

  renderNotificationCategory(categoryKey, title, icon, notifications) {
    return `
      <div class="bg-gray-50 rounded-lg p-5 border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i class="fas ${icon} text-indigo-600 mr-2"></i>${title}
        </h3>
        <div class="space-y-4">
          ${notifications
        .map(
          (notif) => `
            <div class="flex items-start justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors">
              <div class="flex-1">
                <label for="notif-${categoryKey}-${notif.key
            }" class="flex items-start cursor-pointer">
                  <div class="flex-1">
                    <p class="font-medium text-gray-900">${notif.label}</p>
                    <p class="text-sm text-gray-600 mt-1">${notif.description
            }</p>
                  </div>
                </label>
              </div>
              <div class="ml-4">
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="notif-${categoryKey}-${notif.key}"
                    class="sr-only peer notification-toggle"
                    data-category="${categoryKey}"
                    data-key="${notif.key}"
                    ${this.notificationSettings[categoryKey][notif.key]
              ? "checked"
              : ""
            }
                  >
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          `
        )
        .join("")}
        </div>
      </div>
    `;
  },

  renderTicketTypeCard(type, index, isDefault) {
    const badge = isDefault
      ? "<span class=\"bg-green-100 text-green-800 text-[10px] font-semibold px-2 py-0.5 rounded-full\">Default</span>"
      : "<span class=\"bg-yellow-100 text-yellow-800 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1\"><i class=\"fas fa-star text-[8px]\"></i>Custom</span>";

    const discount = parseFloat(type.discount || 1.0);
    let pricingInfo = "";

    if (discount === 1.0) {
      pricingInfo = `<span class="flex items-center gap-1 text-gray-600">
        <i class="fas fa-tag"></i>
        Full Price
      </span>`;
    } else if (discount < 1.0) {
      const discountPercent = Math.round((1.0 - discount) * 100);
      pricingInfo = `<span class="flex items-center gap-1 text-green-600">
        <i class="fas fa-tag"></i>
        ${discountPercent}% off
      </span>`;
    } else {
      const markup = Math.round((discount - 1.0) * 100);
      pricingInfo = `<span class="flex items-center gap-1 text-blue-600">
        <i class="fas fa-tag"></i>
        +${markup}% markup
      </span>`;
    }

    const statusBadge =
      type.isActive !== false
        ? "<span class=\"text-green-600 text-xs\"><i class=\"fas fa-check-circle\"></i> Active</span>"
        : "<span class=\"text-gray-400 text-xs\"><i class=\"fas fa-pause-circle\"></i> Inactive</span>";

    const groupBadge = type.minGroupSize
      ? `<span class="flex items-center gap-1 text-purple-600">
          <i class="fas fa-users"></i>
          Min ${type.minGroupSize} seats
        </span>`
      : "";

    return `
      <div class="ticket-type-item group bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-400 hover:shadow-md transition-all" data-type-id="${type.id
      }">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-4 flex-1">
            <div class="flex flex-col items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg text-white text-lg font-bold shadow-sm">
              ${index + 1}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-bold text-gray-900 text-base">${type.name}</h3>
                ${badge}
                ${statusBadge}
              </div>
              ${type.description ? `<p class="text-xs text-gray-600 mb-1.5">${type.description}</p>` : ""}
              <div class="flex items-center gap-3 text-xs text-gray-500">
                <span class="flex items-center gap-1">
                  <i class="fas fa-fingerprint"></i>
                  <span class="font-mono">${type.id}</span>
                </span>
                ${pricingInfo}
                ${groupBadge}
                ${type.eligibility ? `<span class="flex items-center gap-1"><i class="fas fa-user-check"></i>${type.eligibility.substring(0, 30)}${type.eligibility.length > 30 ? "..." : ""}</span>` : ""}
              </div>
            </div>
          </div>
          <div class="flex gap-2 opacity-100 group-hover:opacity-100 transition-opacity">
            ${FormComponents.actionButton({
        icon: "fa-copy",
        tooltip: "Duplicate",
        color: "green",
        dataAttributes: { id: type.id },
      }).replace("<button", "<button class=\"duplicate-ticket-type-btn\"")}
            ${FormComponents.actionButton({
        icon: "fa-edit",
        tooltip: "Edit",
        color: "blue",
        dataAttributes: { id: type.id },
      }).replace("<button", "<button class=\"edit-ticket-type-btn\"")}
            ${FormComponents.actionButton({
        icon: "fa-trash",
        tooltip: isDefault ? "Cannot delete default types" : "Delete",
        color: isDefault ? "gray" : "red",
        disabled: isDefault,
        dataAttributes: { id: type.id },
      }).replace("<button", "<button class=\"delete-ticket-type-btn\"")}
          </div>
        </div>
      </div>
    `;
  },

  async render() {
    return `
      <main class="container mx-auto px-4 py-8 max-w-7xl">
        <div class="mb-8 flex justify-between items-start">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 flex items-center">
              <i class="fas fa-cog text-indigo-600 mr-3"></i>System Settings
            </h1>
            <p class="text-gray-600 mt-2">Manage system-wide configurations and preferences</p>
          </div>
          <a href="/admin/performances" data-link class="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <i class="fas fa-arrow-left mr-2"></i>Back to Performances
          </a>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-5 sticky top-4">
              <h2 class="text-base font-semibold text-gray-900 mb-4 flex items-center">
                <i class="fas fa-th-list text-indigo-600 mr-2"></i>Categories
              </h2>
              <nav class="space-y-1.5">
                <button class="settings-tab w-full text-left px-4 py-2.5 rounded-lg bg-indigo-600 text-white font-medium shadow-sm" data-tab="ticket-types">
                  <i class="fas fa-ticket-alt mr-2"></i>Ticket Types
                  <span class="float-right bg-indigo-500 text-xs px-2 py-0.5 rounded-full" id="ticket-count-badge">0</span>
                </button>
                <button class="settings-tab w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors" data-tab="notifications">
                  <i class="fas fa-bell mr-2"></i>Notifications
                </button>
              </nav>
            </div>
          </div>

          <div class="lg:col-span-3">
            <div id="settings-content">
              <div id="ticket-types-content" class="settings-panel">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div class="flex-1">
                      <h2 class="text-2xl font-bold text-gray-900 flex items-center">
                        <i class="fas fa-ticket-alt text-indigo-600 mr-3"></i>Ticket Types
                      </h2>
                      <p class="text-gray-600 text-sm mt-1">Configure ticket categories and pricing tiers for your performances</p>
                    </div>
                    ${FormComponents.button({
      id: "addTicketTypeBtn",
      text: "Add Type",
      icon: "fa-plus",
      color: "indigo",
    })}
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    ${this.renderInfoBox(
      "info",
      "fa-info-circle",
      "How It Works",
      "Ticket types are used in pricing sections when creating performances. Add custom types like \"Military\", \"Group\", or \"Family Pass\" to fit your needs."
    )}
                    ${this.renderInfoBox(
      "warning",
      "fa-exclamation-triangle",
      "Important Note",
      "Changes only affect new performances. Existing performances retain their original ticket types and pricing."
    )}
                  </div>

                  <div id="ticketTypesList" class="space-y-3 mb-6"></div>

                  <div class="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    ${FormComponents.button({
      id: "resetTicketTypesBtn",
      text: "Reset to Defaults",
      icon: "fa-undo",
      color: "gray",
      size: "sm",
    })}
                    ${FormComponents.button({
      id: "exportTicketTypesBtn",
      text: "Export",
      icon: "fa-download",
      color: "green",
      size: "sm",
    })}
                    ${FormComponents.button({
      id: "importTicketTypesBtn",
      text: "Import",
      icon: "fa-upload",
      color: "blue",
      size: "sm",
    })}
                  </div>
                </div>
              </div>

              <div id="notifications-content" class="settings-panel hidden">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div class="mb-6">
                    <h2 class="text-2xl font-bold text-gray-900 flex items-center">
                      <i class="fas fa-bell text-indigo-600 mr-3"></i>Notification Settings
                    </h2>
                    <p class="text-gray-600 text-sm mt-1">Configure email and system notifications for different events</p>
                  </div>

                  ${this.renderInfoBox(
      "info",
      "fa-envelope",
      "Email Notifications",
      "These settings control when the system sends email notifications to administrators. Users have separate notification preferences in their account settings."
    )}

                  <div class="mt-6 space-y-6">
                    ${this.renderNotificationCategory(
      "bookings",
      "Booking Notifications",
      "fa-ticket-alt",
      [
        {
          key: "newBooking",
          label: "New Booking Created",
          description:
            "Notify when a customer makes a new booking",
        },
        {
          key: "bookingConfirmed",
          label: "Booking Confirmed",
          description: "Notify when a booking is confirmed",
        },
        {
          key: "bookingCancelled",
          label: "Booking Cancelled",
          description:
            "Notify when a customer cancels their booking",
        },
        {
          key: "bookingRefunded",
          label: "Booking Refunded",
          description: "Notify when a refund is processed",
        },
      ]
    )}

                    ${this.renderNotificationCategory(
      "performances",
      "Performance Notifications",
      "fa-music",
      [
        {
          key: "newPerformance",
          label: "New Performance Added",
          description:
            "Notify when a new performance is created",
        },
        {
          key: "performanceUpdated",
          label: "Performance Updated",
          description:
            "Notify when performance details are modified",
        },
        {
          key: "performanceCancelled",
          label: "Performance Cancelled",
          description: "Notify when a performance is cancelled",
        },
        {
          key: "lowAvailability",
          label: "Low Seat Availability",
          description:
            "Notify when remaining seats fall below 10%",
        },
      ]
    )}

                    ${this.renderNotificationCategory(
      "users",
      "User Account Notifications",
      "fa-users",
      [
        {
          key: "newRegistration",
          label: "New User Registration",
          description:
            "Notify when a new user creates an account",
        },
        {
          key: "accountSuspended",
          label: "Account Suspended",
          description:
            "Notify when a user account is suspended",
        },
        {
          key: "passwordReset",
          label: "Password Reset Request",
          description:
            "Notify when a user requests password reset",
        },
      ]
    )}

                    ${this.renderNotificationCategory(
      "system",
      "System Notifications",
      "fa-cog",
      [
        {
          key: "dailySummary",
          label: "Daily Summary Report",
          description:
            "Receive daily booking and revenue summary",
        },
        {
          key: "weeklySummary",
          label: "Weekly Summary Report",
          description: "Receive weekly performance analytics",
        },
        {
          key: "errorAlerts",
          label: "System Error Alerts",
          description:
            "Notify when critical system errors occur",
        },
        {
          key: "maintenanceMode",
          label: "Maintenance Mode",
          description:
            "Notify when system enters maintenance mode",
        },
      ]
    )}
                  </div>

                  <div class="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                    ${FormComponents.button({
      id: "saveNotificationSettings",
      text: "Save Changes",
      icon: "fa-save",
      color: "indigo",
    })}
                    ${FormComponents.button({
      id: "resetNotificationSettings",
      text: "Reset to Defaults",
      icon: "fa-undo",
      color: "gray",
    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    `;
  },

  async afterRender() {
    await this.loadTicketTypes();
    this.loadNotificationSettings();
    this.attachEventListeners();
  },

  loadNotificationSettings() {
    const saved = localStorage.getItem("notificationSettings");
    if (saved) {
      this.notificationSettings = JSON.parse(saved);
    }
  },

  saveNotificationSettings() {
    localStorage.setItem(
      "notificationSettings",
      JSON.stringify(this.notificationSettings)
    );
    Toast.success("Your notification preferences have been saved", "Settings Saved");
  },

  resetNotificationDefaults() {
    this.notificationSettings = {
      bookings: {
        newBooking: true,
        bookingConfirmed: true,
        bookingCancelled: true,
        bookingRefunded: false,
      },
      performances: {
        newPerformance: true,
        performanceUpdated: false,
        performanceCancelled: true,
        lowAvailability: true,
      },
      users: {
        newRegistration: false,
        accountSuspended: true,
        passwordReset: false,
      },
      system: {
        dailySummary: true,
        weeklySummary: false,
        errorAlerts: true,
        maintenanceMode: true,
      },
    };
    localStorage.setItem(
      "notificationSettings",
      JSON.stringify(this.notificationSettings)
    );
    Toast.success("All notification settings have been restored to defaults", "Reset Complete");
    this.switchTab("notifications");
  },

  attachEventListeners() {
    $(".settings-tab").on("click", (e) => {
      const tab = $(e.currentTarget).data("tab");
      this.switchTab(tab);
    });

    $("#addTicketTypeBtn").on("click", () => this.showTicketTypeModal());
    $("#resetTicketTypesBtn").on("click", () => this.resetTicketTypes());
    $("#exportTicketTypesBtn").on("click", () => this.exportTicketTypes());
    $("#importTicketTypesBtn").on("click", () => this.importTicketTypes());

    $("#saveNotificationSettings").on("click", () =>
      this.saveNotificationSettings()
    );
    $("#resetNotificationSettings").on("click", () =>
      this.resetNotificationDefaults()
    );

    $(document).on("change", ".notification-toggle", (e) => {
      const $toggle = $(e.currentTarget);
      const category = $toggle.data("category");
      const key = $toggle.data("key");
      const isChecked = $toggle.is(":checked");
      this.notificationSettings[category][key] = isChecked;
    });

    $(document).on("click", ".edit-ticket-type-btn", (e) => {
      const typeId = $(e.currentTarget).attr("data-id");
      this.editTicketType(typeId);
    });

    $(document).on("click", ".delete-ticket-type-btn", (e) => {
      const $btn = $(e.currentTarget);
      if ($btn.prop("disabled") || $btn.hasClass("cursor-not-allowed")) {
        e.preventDefault();
        return;
      }
      const typeId = $btn.attr("data-id");
      this.deleteTicketType(typeId);
    });

    $(document).on("click", ".duplicate-ticket-type-btn", (e) => {
      const typeId = $(e.currentTarget).attr("data-id");
      this.duplicateTicketType(typeId);
    });
  },

  switchTab(tab) {
    $(".settings-tab")
      .removeClass("bg-indigo-600 text-white shadow-sm")
      .addClass("text-gray-700 hover:bg-gray-50");
    $(`.settings-tab[data-tab="${tab}"]`)
      .addClass("bg-indigo-600 text-white shadow-sm")
      .removeClass("text-gray-700 hover:bg-gray-50");

    $(".settings-panel").addClass("hidden");
    $(`#${tab}-content`).removeClass("hidden");
  },

  async loadTicketTypes() {
    try {
      const response = await ticketTypeAPI.getAll();
      this.ticketTypes = ResponseExtractor.extract(response, "ticketTypes");
      this.renderTicketTypes();
      $("#ticket-count-badge").text(this.ticketTypes.length);
    } catch (error) {
      console.error("Failed to load ticket types:", error);
      handleApiError(error, "Failed to load ticket types");
      this.ticketTypes = [];
      this.renderTicketTypes();
    }
  },

  renderTicketTypes() {
    if (this.ticketTypes.length === 0) {
      $("#ticketTypesList").html(
        createEmptyState({
          icon: "fa-ticket-alt",
          title: "No Ticket Types Yet",
          message:
            "Get started by adding your first ticket type or reset to system defaults.",
          actionText: "Add First Type",
          actionCallback: () => this.showTicketTypeModal(),
          secondaryActionText: "Load Defaults",
          secondaryActionCallback: () => this.resetTicketTypes(),
        })
      );
      return;
    }

    const html = this.ticketTypes
      .sort((a, b) => a.order - b.order)
      .map((type, index) => {
        const isDefault = SYSTEM_TICKET_TYPE_IDS.includes(type.id);
        return this.renderTicketTypeCard(type, index, isDefault);
      })
      .join("");

    $("#ticketTypesList").html(html);
  },

  async showTicketTypeModal(typeId = null) {
    try {
      const response = typeId ? await ticketTypeAPI.getById(typeId) : null;
      const type = response
        ? ResponseExtractor.extractSingle(response, "ticketType")
        : null;
      const isEdit = !!type;

      const result = await Swal.fire({
        title: isEdit
          ? "<div class=\"text-left\"><h2 class=\"text-2xl font-bold text-gray-900\">Edit Ticket Type</h2><p class=\"text-sm text-gray-600 mt-1\">Update ticket type details and pricing</p></div>"
          : "<div class=\"text-left\"><h2 class=\"text-2xl font-bold text-gray-900\">Create Ticket Type</h2><p class=\"text-sm text-gray-600 mt-1\">Add a new ticket category for your performances</p></div>",
        html: `
          <div class="text-left space-y-6 mt-6">
            ${!isEdit
            ? `
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-fingerprint text-gray-400 mr-1"></i>
                Type ID <span class="text-red-500">*</span>
              </label>
              <input type="text" id="typeId" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all font-mono text-sm" placeholder="e.g., student, family-pack" value="${type?.id || ""
            }" style="margin: 0; box-shadow: none;">
              <p class="text-xs text-gray-500 mt-2">Unique identifier (lowercase, use hyphens). Cannot be changed later.</p>
            </div>
            `
            : `
            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p class="text-xs font-medium text-gray-600 mb-1">Type ID</p>
              <p class="font-mono font-semibold text-gray-900">${type.id}</p>
            </div>
            `
          }
            
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-tag text-gray-400 mr-1"></i>
                Name <span class="text-red-500">*</span>
              </label>
              <input type="text" id="typeName" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all" placeholder="e.g., Student, Family Pack" value="${type?.name || ""
          }" style="margin: 0; box-shadow: none;">
              <p class="text-xs text-gray-500 mt-2">Display name shown to customers</p>
            </div>
            
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-align-left text-gray-400 mr-1"></i>
                Description
              </label>
              <textarea id="typeDescription" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all resize-none" placeholder="e.g., 50% discount for children" rows="2" style="margin: 0; box-shadow: none;">${type?.description || ""
          }</textarea>
              <p class="text-xs text-gray-500 mt-2">Help customers understand this ticket type</p>
            </div>

            <div class="border-t border-gray-200 pt-6">
              <h3 class="text-base font-bold text-gray-900 mb-4">Pricing Type</h3>
              
              <select id="pricingType" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all mb-4" style="margin: 0; box-shadow: none;">
                <option value="multiplier" ${!type || type.discount <= 1.0 ? "selected" : ""}>Multiplier (discount from base price)</option>
                <option value="percentage" ${type && type.discount > 1.0 ? "selected" : ""}>Percentage (% of base price)</option>
              </select>
              
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  <span id="discountLabel">Discount Multiplier</span> <span class="text-red-500">*</span>
                </label>
                <input type="number" id="typeDiscount" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all text-lg font-semibold" 
                  placeholder="1.0" step="0.01" min="0" max="2" 
                  value="${type?.discount || "1.0"}" style="margin: 0; box-shadow: none;">
                <p class="text-xs text-gray-500 mt-2" id="discountHelp">
                  1.0 = full price, 0.5 = 50% off, 1.5 = 150% of base
                </p>
              </div>
            </div>

            <div class="border-t border-gray-200 pt-6">
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-user-check text-gray-400 mr-1"></i>
                Eligibility Requirements
              </label>
              <textarea id="typeEligibility" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all resize-none" placeholder="e.g., Age 12 or below" rows="2" style="margin: 0; box-shadow: none;">${type?.eligibility || ""
          }</textarea>
              <p class="text-xs text-gray-500 mt-2">Who can purchase this ticket type?</p>
            </div>
            
            <div class="border-t border-gray-200 pt-6">
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                <i class="fas fa-users text-gray-400 mr-1"></i>
                Minimum Group Size (Optional)
              </label>
              <input type="number" id="typeMinGroupSize" class="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none transition-all" 
                placeholder="Leave empty for individual tickets" min="1" max="100" 
                value="${type?.minGroupSize || ""}" style="margin: 0; box-shadow: none;">
              <p class="text-xs text-gray-500 mt-2">
                <i class="fas fa-users text-gray-400 mr-1"></i>
                Set minimum seats required (e.g., 4 for family pack, 10 for group discount)
              </p>
            </div>
            
            <div class="border-t border-gray-200 pt-6">
              <label class="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" id="typeIsActive" class="mt-1 w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 transition-all" ${type?.isActive !== false ? "checked" : ""
          }>
                <div class="flex-1">
                  <p class="text-sm font-semibold text-gray-900">Active (available for new performances)</p>
                </div>
              </label>
            </div>

            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <p class="text-xs text-blue-800 flex items-start gap-2">
                <i class="fas fa-info-circle mt-0.5"></i>
                <span>This ticket type will be available when creating new performances.</span>
              </p>
            </div>
          </div>
        `,
        width: "650px",
        showCancelButton: true,
        confirmButtonText: isEdit ? "Save Changes" : "Create Ticket Type",
        cancelButtonText: "Cancel",
        customClass: {
          popup: "rounded-xl shadow-2xl",
          title: "text-left p-6 pb-0",
          htmlContainer: "px-6 pb-2",
          actions: "px-6 pb-6 pt-4 gap-3",
          confirmButton: "px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm",
          cancelButton: "px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
        },
        buttonsStyling: false,
        didOpen: () => {
          const pricingTypeSelect = document.getElementById("pricingType");
          const discountInput = document.getElementById("typeDiscount");
          const discountLabel = document.getElementById("discountLabel");
          const discountHelp = document.getElementById("discountHelp");

          const updateDiscountUI = () => {
            const isPercentage = pricingTypeSelect.value === "percentage";
            if (isPercentage) {
              discountLabel.textContent = "Percentage of Base Price";
              discountHelp.textContent =
                "Enter percentage (e.g., 50 for 50% of base, 100 for full price, 150 for 150%)";
              discountInput.setAttribute("max", "200");
              discountInput.setAttribute("step", "1");
              discountInput.setAttribute("placeholder", "100");
              if (!type || type.discount <= 1.0) {
                discountInput.value = (
                  parseFloat(type?.discount || 1.0) * 100
                ).toFixed(0);
              }
            } else {
              discountLabel.textContent = "Discount Multiplier";
              discountHelp.textContent =
                "1.0 = full price, 0.5 = 50% off, 1.5 = 150% of base";
              discountInput.setAttribute("max", "2");
              discountInput.setAttribute("step", "0.01");
              discountInput.setAttribute("placeholder", "1.0");
              if (type && type.discount > 1.0) {
                discountInput.value = (parseFloat(type.discount) / 100).toFixed(
                  2
                );
              }
            }
          };

          // Add event listeners
          pricingTypeSelect.addEventListener("change", updateDiscountUI);

          // Initial update
          updateDiscountUI();
        },
        preConfirm: () => {
          const id = isEdit
            ? type.id
            : document.getElementById("typeId")?.value.trim().toUpperCase();
          const name = document.getElementById("typeName").value.trim();
          const description = document
            .getElementById("typeDescription")
            .value.trim();
          const pricingType = document.getElementById("pricingType").value;
          let discount = parseFloat(
            document.getElementById("typeDiscount").value
          );
          const eligibility = document
            .getElementById("typeEligibility")
            .value.trim();
          const minGroupSizeValue = document.getElementById("typeMinGroupSize").value.trim();
          const minGroupSize = minGroupSizeValue ? parseInt(minGroupSizeValue) : null;
          const isActive = document.getElementById("typeIsActive").checked;

          if (!isEdit && !id) {
            Swal.showValidationMessage("Please enter a type ID");
            return false;
          }
          if (!name) {
            Swal.showValidationMessage("Please enter a type name");
            return false;
          }
          if (isNaN(discount) || discount < 0) {
            Swal.showValidationMessage("Please enter a valid discount value");
            return false;
          }
          if (minGroupSize !== null && (isNaN(minGroupSize) || minGroupSize < 1)) {
            Swal.showValidationMessage("Minimum group size must be at least 1");
            return false;
          }

          if (pricingType === "percentage") {
            discount = discount / 100;
          }

          const data = {
            name,
            description,
            discount: discount,
            eligibility,
            minGroupSize,
            isActive,
          };

          if (!isEdit) {
            data.id = id;
          }

          return data;
        },
      });

      if (result.isConfirmed) {
        try {
          if (isEdit) {
            await ticketTypeAPI.update(typeId, result.value);
            Toast.success(`"${result.value.name}" has been updated`, "Ticket Type Updated");
          } else {
            await ticketTypeAPI.create(result.value);
            Toast.success(`"${result.value.name}" has been added`, "Ticket Type Created");
          }
          await this.loadTicketTypes();
        } catch (error) {
          console.error("Error saving ticket type:", error);
          handleApiError(error, "Failed to save ticket type");
        }
      }
    } catch (error) {
      console.error("Error loading ticket type:", error);
      handleApiError(error, "Failed to load ticket type");
    }
  },

  async editTicketType(typeId) {
    await this.showTicketTypeModal(typeId);
  },

  async deleteTicketType(typeId) {
    if (SYSTEM_TICKET_TYPE_IDS.includes(typeId)) {
      await Swal.fire({
        title: "Cannot Delete Default Type",
        html: `
          <div class="text-left">
            <p class="text-gray-700 mb-3">Default ticket types cannot be deleted individually.</p>
            <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p class="text-xs text-amber-800">
                <i class="fas fa-lightbulb mr-1"></i>
                <strong>Tip:</strong> To remove default types, use "Reset to Defaults" to restore all defaults, then you can modify or remove them as needed.
              </p>
            </div>
          </div>
        `,
        icon: "info",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      const response = await ticketTypeAPI.getById(typeId);
      const type = ResponseExtractor.extractSingle(response, "ticketType");

      if (!type) {
        Toast.error("The requested ticket type could not be found", "Not Found");
        return;
      }

      const result = await Swal.fire({
        title: "Delete Ticket Type?",
        html: `
          <div class="text-left">
            <p class="text-gray-700 mb-3">Are you sure you want to delete "<strong>${type.name}</strong>"?</p>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
              <p class="text-xs text-blue-800">
                <i class="fas fa-info-circle mr-1"></i>
                This will not affect existing performances, only new ones.
              </p>
            </div>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: SwalColors.danger,
        confirmButtonText: "Yes, Delete",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        await ticketTypeAPI.delete(typeId);
        Toast.success(`"${type.name}" has been removed from the system`, "Ticket Type Deleted");
        await this.loadTicketTypes();
      }
    } catch (error) {
      console.error("Error deleting ticket type:", error);
      handleApiError(error, "Failed to delete ticket type");
    }
  },

  async resetTicketTypes() {
    const result = await Swal.fire({
      title: "Reset to Default Types?",
      html: `
        <div class="text-left">
          <p class="text-gray-700 mb-3">This will restore the default ticket types:</p>
          <ul class="list-disc list-inside space-y-1 text-sm text-gray-600 mb-4">
            <li>Standard</li>
            <li>Student</li>
            <li>Senior Citizen</li>
            <li>People with Disabilities and the Minder</li>
            <li>CSSA Recipient</li>
          </ul>
          <p class="text-red-600 text-sm font-semibold">All custom types will be removed.</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: SwalColors.cancel,
      confirmButtonText: "Reset to Defaults",
    });

    if (result.isConfirmed) {
      Toast.info("This feature is currently under development", "Coming Soon");
    }
  },

  async duplicateTicketType(typeId) {
    try {
      const response = await ticketTypeAPI.getById(typeId);
      const type = ResponseExtractor.extractSingle(response, "ticketType");
      const newType = {
        name: `${type.name} (Copy)`,
        description: type.description,
        discount: type.discount,
        eligibility: type.eligibility,
        isActive: type.isActive,
      };
      await ticketTypeAPI.create(newType);
      Toast.success(`A copy of "${type.name}" has been created`, "Ticket Type Duplicated");
      await this.loadTicketTypes();
    } catch (error) {
      console.error("Error duplicating ticket type:", error);
      handleApiError(error, "Failed to duplicate ticket type");
    }
  },

  exportTicketTypes() {
    const dataStr = JSON.stringify(this.ticketTypes, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ticket-types-${new Date().toISOString().split("T")[0]
      }.json`;
    link.click();
    URL.revokeObjectURL(url);
    Toast.success(`${this.ticketTypes.length} ticket types exported to JSON file`, "Export Complete");
  },

  async importTicketTypes() {
    const result = await Swal.fire({
      title: "Import Ticket Types",
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Select JSON file</label>
            <input type="file" id="importFile" accept=".json" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100">
          </div>
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p class="text-xs text-amber-800">
              <i class="fas fa-exclamation-triangle mr-1"></i>
              <strong>Warning:</strong> This will replace your current ticket types. Make sure to export first if you want to keep a backup.
            </p>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Import",
      preConfirm: () => {
        const file = document.getElementById("importFile").files[0];
        if (!file) {
          Swal.showValidationMessage("Please select a file");
          return false;
        }
        return file;
      },
    });

    if (result.isConfirmed) {
      const file = result.value;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (!Array.isArray(imported)) {
            throw new Error("Invalid format");
          }
          localStorage.setItem("ticketTypes", JSON.stringify(imported));
          Toast.success(`${imported.length} ticket types imported successfully`, "Import Complete");
          await this.loadTicketTypes();
        } catch (error) {
          Toast.error("The file format is invalid. Please upload a valid JSON file", "Import Failed");
        }
      };
      reader.readAsText(file);
    }
  },
};
