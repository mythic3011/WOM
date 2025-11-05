import { ticketTypeService } from "/src/services/ticketTypeService.js";
import { notify } from "/src/utils/ui/notification.js";
import Swal from "sweetalert2";

export default {
  title: "Settings | Admin",
  ticketTypes: [],

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
                <button class="settings-tab w-full text-left px-4 py-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors" data-tab="system">
                  <i class="fas fa-server mr-2"></i>System
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
                    <button id="addTicketTypeBtn" class="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg">
                      <i class="fas fa-plus mr-2"></i>Add Type
                    </button>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                      <div class="flex items-start gap-3">
                        <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i class="fas fa-info-circle text-white text-lg"></i>
                        </div>
                        <div class="flex-1">
                          <h3 class="font-semibold text-blue-900 text-sm mb-1">How It Works</h3>
                          <p class="text-xs text-blue-800 leading-relaxed">
                            Ticket types are used in pricing sections when creating performances. Add custom types like "Military", "Group", or "Family Pass" to fit your needs.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div class="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
                      <div class="flex items-start gap-3">
                        <div class="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <i class="fas fa-exclamation-triangle text-white text-lg"></i>
                        </div>
                        <div class="flex-1">
                          <h3 class="font-semibold text-amber-900 text-sm mb-1">Important Note</h3>
                          <p class="text-xs text-amber-800 leading-relaxed">
                            Changes only affect new performances. Existing performances retain their original ticket types and pricing.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div id="ticketTypesList" class="space-y-3 mb-6"></div>

                  <div class="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                    <button id="resetTicketTypesBtn" class="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm shadow-sm">
                      <i class="fas fa-undo mr-2"></i>Reset to Defaults
                    </button>
                    <button id="exportTicketTypesBtn" class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm shadow-sm">
                      <i class="fas fa-download mr-2"></i>Export
                    </button>
                    <button id="importTicketTypesBtn" class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm shadow-sm">
                      <i class="fas fa-upload mr-2"></i>Import
                    </button>
                  </div>
                </div>
              </div>

              <div id="system-content" class="settings-panel hidden">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 class="text-xl font-semibold text-gray-900 mb-4">System Settings</h2>
                  <p class="text-gray-600">System settings coming soon...</p>
                </div>
              </div>

              <div id="notifications-content" class="settings-panel hidden">
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 class="text-xl font-semibold text-gray-900 mb-4">Notification Settings</h2>
                  <p class="text-gray-600">Notification settings coming soon...</p>
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
    this.attachEventListeners();
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
      console.log(
        "Delete button clicked, typeId:",
        typeId,
        "Type:",
        typeof typeId
      );
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
    this.ticketTypes = await ticketTypeService.getAll();
    this.renderTicketTypes();
    $("#ticket-count-badge").text(this.ticketTypes.length);
  },

  renderTicketTypes() {
    const defaultIds = ["standard", "student", "senior", "pwd", "cssa"];

    if (this.ticketTypes.length === 0) {
      $("#ticketTypesList").html(`
        <div class="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-4">
            <i class="fas fa-ticket-alt text-4xl text-gray-400"></i>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No Ticket Types Yet</h3>
          <p class="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            Get started by adding your first ticket type or reset to system defaults.
          </p>
          <div class="flex gap-3 justify-center">
            <button id="addTicketTypeBtn" class="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md">
              <i class="fas fa-plus mr-2"></i>Add First Type
            </button>
            <button id="resetTicketTypesBtn" class="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md">
              <i class="fas fa-undo mr-2"></i>Load Defaults
            </button>
          </div>
        </div>
      `);
      return;
    }

    const html = this.ticketTypes
      .sort((a, b) => a.order - b.order)
      .map((type, index) => {
        const isDefault = defaultIds.includes(type.id);
        const badge = isDefault
          ? '<span class="bg-green-100 text-green-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">Default</span>'
          : '<span class="bg-yellow-100 text-yellow-800 text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"><i class="fas fa-star text-[8px]"></i>Custom</span>';

        return `
          <div class="ticket-type-item group bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-400 hover:shadow-md transition-all" data-type-id="${
            type.id
          }">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-4 flex-1">
                <div class="flex flex-col items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg text-white text-lg font-bold shadow-sm">
                  ${index + 1}
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-bold text-gray-900 text-base">${
                      type.name
                    }</h3>
                    ${badge}
                  </div>
                  <div class="flex items-center gap-3 text-xs text-gray-500">
                    <span class="flex items-center gap-1">
                      <i class="fas fa-fingerprint"></i>
                      <span class="font-mono">${type.id}</span>
                    </span>
                    ${
                      type.pricing
                        ? `
                      <span class="flex items-center gap-1 text-blue-600">
                        <i class="fas fa-tag"></i>
                        ${
                          type.pricing.type === "percentage"
                            ? `${type.pricing.value}%`
                            : `$${type.pricing.value}`
                        }
                        ${
                          type.pricing.modifier === "discount"
                            ? "off"
                            : "markup"
                        }
                      </span>
                    `
                        : ""
                    }
                  </div>
                </div>
              </div>
              <div class="flex gap-2 opacity-100 group-hover:opacity-100 transition-opacity">
                <button class="duplicate-ticket-type-btn px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium" data-id="${
                  type.id
                }" title="Duplicate">
                  <i class="fas fa-copy"></i>
                </button>
                <button class="edit-ticket-type-btn px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium" data-id="${
                  type.id
                }" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="delete-ticket-type-btn px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isDefault
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }" data-id="${type.id}" title="${
          isDefault ? "Cannot delete default types" : "Delete"
        }" ${isDefault ? 'disabled="disabled"' : ""}>
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    $("#ticketTypesList").html(html);
  },

  async showTicketTypeModal(typeId = null) {
    const type = typeId ? await ticketTypeService.getById(typeId) : null;
    const isEdit = !!type;

    const result = await Swal.fire({
      title: isEdit
        ? '<i class="fas fa-edit text-blue-600 mr-2"></i>Edit Ticket Type'
        : '<i class="fas fa-plus text-indigo-600 mr-2"></i>Add Ticket Type',
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Type Name</label>
            <input type="text" id="typeName" class="swal2-input w-full" placeholder="e.g., Student, Senior" value="${
              type?.name || ""
            }">
          </div>
          <div class="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <i class="fas fa-lightbulb mr-1"></i>
            This name will appear in pricing sections when creating performances.
          </div>
        </div>
      `,
      width: "500px",
      showCancelButton: true,
      confirmButtonText: isEdit ? "Save Changes" : "Add Type",
      preConfirm: () => {
        const name = document.getElementById("typeName").value.trim();
        if (!name) {
          Swal.showValidationMessage("Please enter a type name");
          return false;
        }
        return { name };
      },
    });

    if (result.isConfirmed) {
      if (isEdit) {
        await ticketTypeService.update(typeId, result.value);
        notify.success("Ticket type updated successfully");
      } else {
        await ticketTypeService.create(result.value);
        notify.success("Ticket type added successfully");
      }
      await this.loadTicketTypes();
    }
  },

  async editTicketType(typeId) {
    await this.showTicketTypeModal(typeId);
  },

  async deleteTicketType(typeId) {
    const defaultIds = ["standard", "student", "senior", "pwd", "cssa"];
    if (defaultIds.includes(typeId)) {
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
      const type = await ticketTypeService.getById(typeId);

      if (!type) {
        notify.error("Ticket type not found");
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
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Yes, Delete",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        await ticketTypeService.delete(typeId);
        notify.success(`"${type.name}" deleted successfully`);
        await this.loadTicketTypes();
      }
    } catch (error) {
      console.error("Error deleting ticket type:", error);
      notify.error("Failed to delete ticket type");
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
      confirmButtonColor: "#6b7280",
      confirmButtonText: "Reset to Defaults",
    });

    if (result.isConfirmed) {
      await ticketTypeService.reset();
      notify.success("Ticket types reset to defaults");
      await this.loadTicketTypes();
    }
  },

  async duplicateTicketType(typeId) {
    const type = await ticketTypeService.getById(typeId);
    const newType = {
      name: `${type.name} (Copy)`,
      pricing: type.pricing,
    };
    await ticketTypeService.create(newType);
    notify.success(`"${type.name}" duplicated successfully`);
    await this.loadTicketTypes();
  },

  exportTicketTypes() {
    const dataStr = JSON.stringify(this.ticketTypes, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ticket-types-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
    notify.success("Ticket types exported successfully");
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
          notify.success("Ticket types imported successfully");
          await this.loadTicketTypes();
        } catch (error) {
          notify.error("Invalid file format");
        }
      };
      reader.readAsText(file);
    }
  },
};
