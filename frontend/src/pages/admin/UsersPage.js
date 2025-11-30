
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Papa from "papaparse";
import Swal from "sweetalert2";
import { UserModals } from "./UsersPage.modals.js";

import { Avatar } from "@components/common/Avatar.js";
import { createDataTable } from "@components/DataTable.js";
import { createEmptyState } from "@components/EmptyState.js";
import { FormComponents } from "@components/FormComponents.js";
import { initImageUpload, getImageDataURL } from "@components/ImageUpload.js";
import { createLoadingState } from "@components/LoadingState.js";
import { Toast } from "@components/Toast.js";
import { adminUserService } from "@services/adminUserService.js";
import { userAPI, handleApiError } from "@services/apiClient.js";
import { bookingService } from "@services/bookingService.js";

import { ResponseExtractor } from "@services/responseExtractor.js";
import { statsService } from "@services/statsService.js";
import { userService } from "@services/userService.js";
import { SwalColors } from "@utils/colors.js";
import { phoneUtils } from "@utils/forms/phoneFormat.js";
import { notify } from "@utils/ui/notification.js";
import { scrollbarUtils } from "@utils/ui/scrollbar.js";

dayjs.extend(relativeTime);

export default {
  title: "User Management | Admin",
  allUsers: [],
  filteredUsers: [],
  selectedUsers: new Set(),

  async render() {
    return `
      <main class="container mx-auto px-4 py-8">
        <div class="max-w-7xl mx-auto">
          <div class="flex justify-between items-center mb-8">
            <div>
              <h1 class="text-3xl font-bold text-gray-900">
                <i class="fas fa-users text-indigo-600 mr-3"></i>User Management
              </h1>
              <p class="text-gray-600 mt-2">View and manage all registered users</p>
            </div>
            <button
              id="createUserBtn"
              class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors flex items-center gap-2"
            >
              <i class="fas fa-user-plus"></i>
              <span>Create User</span>
            </button>
          </div>

          <div id="userStats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          </div>

          <div class="flex items-center gap-3 mb-6">
            <button
              id="importUsers"
              class="px-3 py-2 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <i class="fas fa-upload text-sm"></i>
              <span>Import CSV</span>
            </button>
            <button
              id="exportUsers"
              class="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <i class="fas fa-download text-sm"></i>
              <span>Export CSV</span>
            </button>
          </div>

          <div id="usersTable">
            ${createLoadingState({ message: "Loading users..." })}
          </div>
        </div>
      </main>
    `;
  },

  async afterRender() {
    await this.loadUsers();
    this.attachEventListeners();
  },

  async loadUsers() {
    try {
      $("#usersTable").html(
        createLoadingState({ message: "Loading users..." })
      );

      const users = await adminUserService.list();

      this.allUsers = users.map((user) => ({
        ...user,
        userId: user.userId,
        status: user.status || "active",
      }));
      this.filteredUsers = this.allUsers;

      this.renderStats();
      this.renderDataTable();
    } catch (error) {
      console.error("Failed to load users:", error);
      handleApiError(error, "Failed to load users");
    }
  },

  renderStats() {
    const totalUsers = this.allUsers.length;
    const activeUsers = this.allUsers.filter(
      (u) => u.status === "active"
    ).length;
    const adminUsers = this.allUsers.filter((u) => u.role === "admin").length;
    const newThisMonth = this.allUsers.filter((u) =>
      dayjs(u.createdAt).isAfter(dayjs().subtract(30, "day"))
    ).length;

    const stats = [
      {
        title: "Total Users",
        value: totalUsers,
        icon: "fa-users",
        bgColor: "bg-blue-500",
        subtitle: `${activeUsers} active`,
      },
      {
        title: "Admin Users",
        value: adminUsers,
        icon: "fa-user-shield",
        bgColor: "bg-purple-500",
        subtitle: `${totalUsers - adminUsers} regular`,
      },
      {
        title: "New This Month",
        value: newThisMonth,
        icon: "fa-user-plus",
        bgColor: "bg-green-500",
        subtitle: dayjs().format("MMMM YYYY"),
      },
      {
        title: "Active Now",
        value: activeUsers,
        icon: "fa-circle",
        bgColor: "bg-indigo-500",
        subtitle: `${totalUsers - activeUsers} suspended`,
      },
    ];

    const statsHTML = stats
      .map((stat) =>
        FormComponents.statCard({
          ...stat,
          trend: null,
        })
      )
      .join("");

    $("#userStats").html(statsHTML);
  },

  renderDataTable() {
    const container = document.getElementById("usersTable");
    if (!container) {return;}

    this.dataTable = createDataTable("usersTable", {
      data: this.allUsers,
      tableId: "adminUsersTable",
      columnFilters: [
        {
          column: "role",
          label: "Role",
          options: [
            { value: "user", label: "Users" },
            { value: "admin", label: "Admins" },
          ],
        },
        {
          column: "status",
          label: "Status",
          options: [
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "suspended", label: "Suspended" },
          ],
        },
      ],
      columns: [
        {
          key: "profileImage",
          label: "User",
          sortable: false,
          render: (user) => `
            <div class="flex items-center">
              <div class="mr-3">
                ${Avatar.render({
            src: user.profileImage,
            name: user.name || "User",
            size: "sm",
            editable: false,
          })}
              </div>
              <div class="text-left">
                <p class="font-medium text-gray-900">${user.title ? user.title + " " : ""}${user.name}</p>
                <p class="text-xs text-gray-500">@${user.username} <span class="text-gray-400">(ID: #${user.userId})</span></p>
              </div>
            </div>
          `,
        },
        {
          key: "email",
          label: "Email",
          type: "email",
        },
        {
          key: "phone",
          label: "Phone",
          render: (user) => user.phone ? phoneUtils.formatHKPhone(user.phone) : "-",
        },
        {
          key: "role",
          label: "Role",
          type: "badge",
          badgeColors: {
            admin: "purple",
            user: "blue",
          },
        },
        {
          key: "status",
          label: "Status",
          type: "badge",
          badgeColors: {
            active: "green",
            inactive: "gray",
            suspended: "red",
          },
        },
        {
          key: "createdAt",
          label: "Joined",
          type: "date",
          format: "MMM D, YYYY",
        },
      ],

      sortable: true,
      filterable: true,
      paginate: true,
      pageSize: 20,
      defaultSort: { column: "userId", direction: "asc" },
      onRowClick: (user) => {
        this.viewUser(user.userId);
      },
      rowActions: (user) => [
        `
        <div class="flex items-center gap-2">
          <button
            class="user-action-btn px-3 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer"
            data-action="view"
            data-user-id="${user.userId}"
            title="View Details"
            type="button"
          >
            <i class="fas fa-eye pointer-events-none"></i>
          </button>
          <button
            class="user-action-btn px-3 py-2 rounded-lg text-white bg-yellow-500 hover:bg-yellow-600 transition-colors cursor-pointer"
            data-action="edit"
            data-user-id="${user.userId}"
            title="Edit User"
            type="button"
          >
            <i class="fas fa-edit pointer-events-none"></i>
          </button>
          ${user.role !== "admin"
          ? `<button
                  class="user-action-btn px-3 py-2 rounded-lg text-white ${user.status === "active"
            ? "bg-orange-500 hover:bg-orange-600"
            : "bg-green-500 hover:bg-green-600"
          } transition-colors cursor-pointer"
                  data-action="toggle-status"
                  data-user-id="${user.userId}"
                  title="${user.status === "active" ? "Suspend" : "Activate"}"
                  type="button"
                >
                  <i class="fas ${user.status === "active" ? "fa-ban" : "fa-check"
          } pointer-events-none"></i>
                </button>`
          : ""
        }
          ${user.role !== "admin"
          ? `<button
                  class="user-action-btn px-3 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors cursor-pointer"
                  data-action="delete"
                  data-user-id="${user.userId}"
                  title="Delete User"
                  type="button"
                >
                  <i class="fas fa-trash pointer-events-none"></i>
                </button>`
          : ""
        }
        </div>
      `,
      ],
      emptyState: {
        icon: "fa-users",
        title: "No users found",
        message: "Try adjusting your search or filters",
      },
    });

    window.UsersPage = this;
  },

  attachEventListeners() {
    // Use event delegation to handle dynamically rendered buttons
    $(document).off("click", "#importUsers").on("click", "#importUsers", () => this.importUsers());
    $(document).off("click", "#exportUsers").on("click", "#exportUsers", () => this.exportUsers());
    $(document).off("click", "#addUser, #createUserBtn").on("click", "#addUser, #createUserBtn", () => this.addUser());

    $(document)
      .off("click", ".user-action-btn, .user-action-btn *")
      .on("click", ".user-action-btn, .user-action-btn *", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const $target = $(e.target);
        const $btn = $target.hasClass("user-action-btn")
          ? $target
          : $target.closest(".user-action-btn");

        if (!$btn.length) {
          console.error("Button not found");
          return;
        }

        const action = $btn.data("action");
        const userId = $btn.data("user-id");

        if (!action || !userId) {
          console.error("Missing action or user ID", { action, userId });
          return;
        }

        switch (action) {
          case "view":
            this.viewUser(userId);
            break;
          case "edit":
            this.editUser(userId);
            break;
          case "toggle-status":
            this.toggleUserStatus(userId);
            break;
          case "delete":
            this.deleteUser(userId);
            break;
          default:
            console.error("Unknown action:", action);
        }
      });
  },

  async viewUser(userId) {
    const user = this.allUsers.find((u) => String(u.userId) === String(userId));
    if (!user) {
      console.error(
        "User not found:",
        userId,
        "Available users:",
        this.allUsers.map((u) => u.userId)
      );
      notify.error("User not found");
      return;
    }
    const allBookings = await bookingService.getAll();
    const bookings = allBookings.filter(b => b.userId === user.userId);
    const totalSpent = bookings.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

    await Swal.fire({
      html: `
        <div class="text-left space-y-4">
          <div class="flex items-center gap-3 pb-4 border-b border-gray-200">
            ${Avatar.render({
        src: user.profileImage || null,
        name: user.name || "User",
        size: "lg",
        editable: false,
      })}
            <div>
              <h3 class="text-lg font-bold text-gray-900">${user.title ? user.title + " " : ""
        }${user.name}</h3>
              <p class="text-sm text-gray-500">@${user.username} (ID: #${user.userId
        })</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <p class="text-xs text-blue-600 font-semibold uppercase">Email</p>
              <p class="text-sm text-gray-900 mt-1">${user.email}</p>
            </div>
            <div class="bg-teal-50 p-4 rounded-lg">
              <p class="text-xs text-teal-600 font-semibold uppercase">Phone</p>
              <p class="text-sm text-gray-900 mt-1">${user.phone
          ? phoneUtils.formatHKPhone(user.phone)
          : "Not provided"
        }</p>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
              <p class="text-xs text-purple-600 font-semibold uppercase">Role</p>
              <p class="text-sm text-gray-900 mt-1 capitalize">${user.role}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
              <p class="text-xs text-green-600 font-semibold uppercase">Status</p>
              <p class="text-sm text-gray-900 mt-1 capitalize">${user.status
        }</p>
            </div>
            <div class="bg-orange-50 p-4 rounded-lg">
              <p class="text-xs text-orange-600 font-semibold uppercase">Gender</p>
              <p class="text-sm text-gray-900 mt-1 capitalize">${user.gender === "prefer_not_to_say"
          ? "Not specified"
          : user.gender
        }</p>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
              <p class="text-xs text-yellow-600 font-semibold uppercase">Username</p>
              <p class="text-sm text-gray-900 mt-1 font-mono">@${user.username
        }</p>
            </div>
          </div>

          <div class="border-t border-gray-200 pt-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-gray-600">Birthday</p>
                <p class="font-semibold text-gray-900">${dayjs(
          user.birthday
        ).format("MMMM D, YYYY")} (${dayjs().diff(
          dayjs(user.birthday),
          "year"
        )} years old)</p>
              </div>
              <div>
                <p class="text-gray-600">Member Since</p>
                <p class="font-semibold text-gray-900">${dayjs(
          user.createdAt
        ).format("MMMM D, YYYY")} (${dayjs(
          user.createdAt
        ).fromNow()})</p>
              </div>
            </div>
          </div>

          <div class="border-t border-gray-200 pt-4">
            <h4 class="font-semibold text-gray-900 mb-3">Booking Statistics</h4>
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-indigo-50 p-3 rounded-lg text-center">
                <p class="text-2xl font-bold text-indigo-600">${bookings.length
        }</p>
                <p class="text-xs text-gray-600">Total Bookings</p>
              </div>
              <div class="bg-green-50 p-3 rounded-lg text-center">
                <p class="text-2xl font-bold text-green-600">$${totalSpent.toFixed(2)}</p>
                <p class="text-xs text-gray-600">Total Spent</p>
              </div>
              <div class="bg-yellow-50 p-3 rounded-lg text-center">
                <p class="text-2xl font-bold text-yellow-600">${bookings.filter((b) => b.status === "confirmed").length
        }</p>
                <p class="text-xs text-gray-600">Confirmed</p>
              </div>
            </div>
          </div>
        </div>
      `,
      width: 600,
      confirmButtonText: "Close",
      confirmButtonColor: SwalColors.primary,
    });
  },

  async editUser(userId) {
    const user = this.allUsers.find((u) => String(u.userId) === String(userId));
    if (!user) {
      Toast.error("The requested user could not be found", "User Not Found");
      return;
    }

    this.showEditUserModal(user);
  },

  showEditUserModal(user) {
    const modalHTML = `
      <div id="editUserModal" class="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] flex flex-col">
          ${this.generateEditUserTitle(user)}

          <div class="flex-1 overflow-y-auto">
            ${this.generateEditUserFormHTML(user)}
          </div>

          <div class="border-t border-gray-200 px-4 py-3 flex justify-end gap-3 bg-gray-50">
            <button
              type="button"
              id="cancelEditUser"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <i class="fas fa-times mr-2"></i>Cancel
            </button>
            <button
              type="button"
              id="saveEditUser"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <i class="fas fa-save mr-2"></i>Save Changes
            </button>
          </div>
        </div>
      </div>
    `;

    $("body").append(modalHTML);

    $("#cancelEditUser, #editUserModal, #closeEditUserModal").on(
      "click",
      (e) => {
        if (
          e.target.id === "cancelEditUser" ||
          e.target.id === "editUserModal" ||
          e.target.id === "closeEditUserModal" ||
          $(e.target).closest("#closeEditUserModal").length
        ) {
          this.closeEditUserModal();
        }
      }
    );

    $(".bg-white.rounded-lg.shadow-xl").on("click", (e) => {
      e.stopPropagation();
    });

    $("#saveEditUser").on("click", async () => {
      const formValues = await this.validateEditUserForm();
      if (formValues) {
        await this.saveUserChanges(user.userId, user, formValues);
        this.closeEditUserModal();
      }
    });

    $("#editPhone").on("input", function () {
      const value = $(this).val();
      const cleaned = phoneUtils.cleanPhone(value);
      const formatted = phoneUtils.formatHKPhone(cleaned);
      $(this).val(formatted);
    });

    initImageUpload("editUserImageInput", "editUserImagePreview", {
      shape: "rounded-full",
      previewSize: "20",
    });

    $("#removeUserImage").on("click", () => {
      $("#editUserImageInput").val("");
      $("#editUserImagePreview").html(`
        <div class="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
          <i class="fas fa-user text-3xl text-gray-400"></i>
        </div>
      `);
      $("#removeUserImage").remove();
    });

    $(document).on("keydown.editUserModal", (e) => {
      if (e.key === "Escape") {
        this.closeEditUserModal();
      }
    });

    scrollbarUtils.initModal($("#editUserModal .overflow-y-auto")[0]);
  },

  closeEditUserModal() {
    $(document).off("keydown.editUserModal");
    $("#editUserModal").fadeOut(200, function () {
      $(this).remove();
    });
  },

  generateEditUserTitle(user) {
    return `
      <div class="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200 relative">
        <button 
          type="button" 
          id="closeEditUserModal"
          class="absolute -top-2 -right-2 bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
        >
          <i class="fas fa-times text-xl"></i>
        </button>
        ${Avatar.render({
      src: user.profileImage,
      name: user.name || "User",
      size: "lg",
      editable: false,
    })}
        <div class="text-center">
          <h3 class="text-lg font-bold text-gray-900 mb-0.5">Edit User</h3>
          <p class="text-xs text-gray-600">@${user.username} (ID: #${String(
      user.userId
    ).padStart(6, "0")})</p>
        </div>
      </div>
    `;
  },

  generateEditUserFormHTML(user) {
    return `
      <div class="space-y-3 text-left p-4 pt-3">
        ${this.renderProfileImageSection(user)}
        ${this.renderPersonalInfoSection(user)}
        ${this.renderContactInfoSection(user)}
        ${this.renderAccountSettingsSection(user)}
        ${this.renderLastUpdatedSection(user)}
      </div>
    `;
  },

  renderProfileImageSection(user) {
    const defaultImage = user.profileImage || null;
    const previewHTML = defaultImage
      ? `<img src="${defaultImage}" class="h-20 w-20 rounded-full object-cover border-2 border-indigo-200" />`
      : `<div class="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
          <i class="fas fa-user text-3xl text-gray-400"></i>
        </div>`;

    return `
      <div class="bg-indigo-50 rounded-lg p-2.5 border border-indigo-200">
        <h4 class="text-xs font-semibold text-indigo-700 uppercase mb-2 flex items-center gap-1.5">
          <i class="fas fa-image text-indigo-600 text-sm"></i>
          Profile Picture
        </h4>
        <div class="flex items-center gap-4">
          <div id="usersTableContainer" class="mt-6"></div>
          <div class="flex-1">
            <input
              type="file"
              id="editUserImageInput"
              accept="image/*"
              class="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
            />
            <p class="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
            ${defaultImage
        ? `<button type="button" id="removeUserImage" class="mt-1 text-xs text-red-600 hover:text-red-700">
                    <i class="fas fa-times mr-1"></i>Remove image
                  </button>`
        : ""
      }
          </div>
        </div>
      </div>
    `;
  },

  renderPersonalInfoSection(user) {
    return `
      <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <h4 class="text-xs font-semibold text-gray-700 uppercase mb-2.5 flex items-center gap-2">
          <i class="fas fa-user-circle text-indigo-600"></i>
          Personal Information
        </h4>
        <div class="space-y-2.5">
          ${FormComponents.select({
      id: "editTitle",
      label: "Title",
      value: user.title || "",
      options: [
        { value: "", label: "None" },
        { value: "Mr.", label: "Mr." },
        { value: "Ms.", label: "Ms." },
        { value: "Mrs.", label: "Mrs." },
        { value: "Dr.", label: "Dr." },
        { value: "Prof.", label: "Prof." },
      ],
    })}
          ${FormComponents.input({
      id: "editName",
      label: "Full Name",
      value: user.name,
      required: true,
      placeholder: "e.g., John Doe",
    })}
          ${FormComponents.select({
      id: "editGender",
      label: "Gender",
      value: user.gender || "prefer_not_to_say",
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "prefer_not_to_say", label: "Prefer not to say" },
      ],
    })}
          ${FormComponents.input({
      id: "editBirthday",
      type: "date",
      label: "Birthday",
      value: user.birthday
        ? dayjs(user.birthday).format("YYYY-MM-DD")
        : "",
    })}
        </div>
      </div>
    `;
  },

  renderContactInfoSection(user) {
    return `
      <div class="bg-blue-50 rounded-lg p-2.5 border border-blue-200">
        <h4 class="text-xs font-semibold text-blue-700 uppercase mb-2 flex items-center gap-1.5">
          <i class="fas fa-envelope text-blue-600 text-sm"></i>
          Contact Information
        </h4>
        <div class="space-y-2">
          ${FormComponents.input({
      id: "editEmail",
      type: "email",
      label: "Email Address",
      value: user.email,
      required: true,
      placeholder: "user@example.com",
    })}
          ${FormComponents.input({
      id: "editPhone",
      type: "tel",
      label: "Phone Number (Hong Kong)",
      value: user.phone ? phoneUtils.formatHKPhone(user.phone) : "",
      placeholder: "9123 4567",
    })}
        </div>
      </div>
    `;
  },

  renderAccountSettingsSection(user) {
    return `
      <div class="bg-purple-50 rounded-lg p-2.5 border border-purple-200">
        <h4 class="text-xs font-semibold text-purple-700 uppercase mb-2 flex items-center gap-1.5">
          <i class="fas fa-user-shield text-purple-600 text-sm"></i>
          Account Settings
        </h4>
        <div class="space-y-2">
          <div class="bg-white rounded p-2 border border-gray-200">
            <label class="block text-xs font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value="@${user.username}"
              class="w-full px-2.5 py-1.5 text-sm font-mono bg-gray-50 border border-gray-300 rounded text-gray-500 cursor-not-allowed"
              readonly
              disabled
            />
            <p class="text-xs text-gray-500 mt-1">Username cannot be changed</p>
          </div>
          ${FormComponents.select({
      id: "editRole",
      label: "User Role",
      value: user.role,
      options: [
        { value: "user", label: "User" },
        { value: "admin", label: "Admin" },
      ],
      required: true,
    })}
          ${FormComponents.select({
      id: "editStatus",
      label: "Account Status",
      value: user.status,
      options: [
        { value: "active", label: "Active" },
        { value: "suspended", label: "Suspended" },
      ],
      required: true,
    })}
        </div>
      </div>
    `;
  },

  renderLastUpdatedSection(user) {
    const lastUpdate = user.updatedAt
      ? dayjs(user.updatedAt).format("MMM D, YYYY [at] h:mm A")
      : "Never";

    return `
      <div class="bg-gray-50 rounded-lg p-2 border border-gray-200">
        <p class="text-xs text-gray-600">
          <i class="fas fa-clock mr-1 text-sm"></i>
          <strong>Last Updated:</strong> ${lastUpdate}
        </p>
      </div>
    `;
  },

  async validateEditUserForm() {
    const title = $("#editTitle").val();
    const name = $("#editName").val().trim();
    const gender = $("#editGender").val();
    const birthday = $("#editBirthday").val();
    const email = $("#editEmail").val().trim();
    const phone = phoneUtils.cleanPhone($("#editPhone").val());
    const role = $("#editRole").val();
    const status = $("#editStatus").val();

    if (!name || !email) {
      notify.error("Please fill in all required fields");
      return false;
    }

    if (!userService.validateEmail(email)) {
      notify.error("Please enter a valid email address");
      return false;
    }

    if (phone && !userService.validatePhone(phone)) {
      notify.error("Invalid HK phone number (8 digits, starts with 2-9)");
      return false;
    }

    if (birthday && dayjs(birthday).isAfter(dayjs())) {
      notify.error("Birthday cannot be in the future");
      return false;
    }

    const profileImage = await getImageDataURL("editUserImageInput");

    return {
      title,
      name,
      gender,
      birthday,
      email,
      phone,
      role,
      status,
      profileImage,
    };
  },

  async saveUserChanges(userId, originalUser, formValues) {
    const changes = this.detectUserChanges(originalUser, formValues);

    if (changes.length === 0) {
      Toast.info("No changes were detected", "No Updates");
      return;
    }

    try {
      const updateData = { ...formValues };
      if (formValues.profileImage) {
        updateData.profileImage = formValues.profileImage;
      } else if (formValues.profileImage === null) {
        updateData.profileImage = null;
      } else {
        updateData.profileImage = originalUser.profileImage;
      }

      const updatedUser = await adminUserService.update(
        originalUser.id,
        updateData
      );
      if (!updatedUser) {
        throw new Error("Invalid update user response");
      }

      this.allUsers = this.allUsers.map((u) =>
        String(u.userId) === String(userId) ? { ...updatedUser } : u
      );
      this.renderDataTable();
      this.renderStats();

      Toast.success(
        `${formValues.name}'s profile has been updated successfully`,
        "User Updated"
      );
    } catch (error) {
      console.error("Update user error:", error);
      Toast.error("Failed to update user profile. Please try again.", "Update Failed");
      throw error;
    }
  },

  detectUserChanges(originalUser, formValues) {
    const changes = [];
    const fields = [
      { key: "title", label: "Title", original: originalUser.title || "" },
      { key: "name", label: "Name", original: originalUser.name },
      { key: "gender", label: "Gender", original: originalUser.gender },
      { key: "birthday", label: "Birthday", original: originalUser.birthday },
      { key: "email", label: "Email", original: originalUser.email },
      { key: "phone", label: "Phone", original: originalUser.phone },
      { key: "role", label: "Role", original: originalUser.role },
      { key: "status", label: "Status", original: originalUser.status },
    ];

    fields.forEach((field) => {
      if (formValues[field.key] !== field.original) {
        changes.push(field.label);
      }
    });

    return changes;
  },

  async toggleUserStatus(userId) {
    const user = this.allUsers.find((u) => String(u.userId) === String(userId));
    if (!user) {
      Toast.error("The requested user could not be found", "User Not Found");
      return;
    }

    const newStatus = user.status === "active" ? "suspended" : "active";

    const result = await Swal.fire({
      title: `${newStatus === "suspended" ? "Suspend" : "Activate"} User?`,
      html: `
        <p class="text-gray-700">Are you sure you want to ${newStatus === "suspended" ? "suspend" : "activate"
        } <strong>${user.name}</strong> (@${user.username})?</p>
        ${newStatus === "suspended"
          ? "<p class=\"text-sm text-red-600 mt-2\">This user will not be able to log in or make bookings.</p>"
          : "<p class=\"text-sm text-green-600 mt-2\">This user will be able to log in and make bookings.</p>"
        }
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${newStatus === "suspended" ? "Suspend" : "Activate"
        }`,
      cancelButtonText: "Cancel",
      confirmButtonColor:
        newStatus === "suspended" ? SwalColors.danger : SwalColors.success,
    });

    if (result.isConfirmed) {
      try {
        const updatedUser = await adminUserService.toggleStatus(
          user.id,
          newStatus
        );
        if (!updatedUser) {
          throw new Error("Invalid update user response");
        }

        this.allUsers = this.allUsers.map((u) =>
          String(u.userId) === String(userId) ? { ...updatedUser } : u
        );
        this.renderDataTable();
        this.renderStats();

        notify.success(
          `User ${newStatus === "suspended" ? "suspended" : "activated"
          } successfully!`
        );
      } catch (error) {
        console.error("Toggle user status error:", error);
        handleApiError(error, "Failed to update user status");
      }
    }
  },

  async deleteUser(userId) {
    const user = this.allUsers.find((u) => String(u.userId) === String(userId));
    if (!user) {
      notify.error("User not found");
      return;
    }

    const result = await Swal.fire({
      title: "Delete User?",
      html: `
        <div class="text-left">
          <p class="text-gray-700 mb-4">Are you sure you want to delete <strong>${user.name}</strong> (@${user.username})?</p>
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-red-800 font-semibold mb-2">
              <i class="fas fa-exclamation-triangle mr-2"></i>Warning
            </p>
            <ul class="text-sm text-red-700 space-y-1">
              <li>• This action cannot be undone</li>
              <li>• User account will be permanently deleted</li>
              <li>• Related bookings will remain but be marked as deleted user</li>
            </ul>
          </div>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete User",
      cancelButtonText: "Cancel",
      confirmButtonColor: SwalColors.danger,
      input: "checkbox",
      inputPlaceholder: "I understand this action is permanent",
      inputValidator: (result) => {
        return !result && "You must confirm before proceeding";
      },
    });

    if (result.isConfirmed) {
      try {
        await adminUserService.remove(user.id);

        this.allUsers = this.allUsers.filter(
          (u) => String(u.userId) !== String(userId)
        );
        this.renderDataTable();
        this.renderStats();

        notify.deleted(`User ${user.username} deleted successfully!`);
      } catch (error) {
        console.error("Delete user error:", error);
        handleApiError(error, "Failed to delete user");
      }
    }
  },

  async addUser() {
    this.showAddUserModal();
  },

  showAddUserModal() {
    const modalHTML = `
      <div id="addUserModal" class="fixed inset-0 z-50 overflow-hidden flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] flex flex-col">
          ${this.generateAddUserTitle()}

          <div class="flex-1 overflow-y-auto">
            ${this.generateAddUserFormHTML()}
          </div>

          <div class="border-t border-gray-200 px-4 py-3 flex justify-end gap-3 bg-gray-50">
            <button
              type="button"
              id="cancelAddUser"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <i class="fas fa-times mr-2"></i>Cancel
            </button>
            <button
              type="button"
              id="saveAddUser"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <i class="fas fa-user-plus mr-2"></i>Create User
            </button>
          </div>
        </div>
      </div>
    `;

    $("body").append(modalHTML);

    $("#cancelAddUser, #addUserModal, #closeAddUserModal").on("click", (e) => {
      if (
        e.target.id === "cancelAddUser" ||
        e.target.id === "addUserModal" ||
        e.target.id === "closeAddUserModal" ||
        $(e.target).closest("#closeAddUserModal").length
      ) {
        this.closeAddUserModal();
      }
    });

    $(".bg-white.rounded-lg.shadow-xl").on("click", (e) => {
      e.stopPropagation();
    });

    $("#saveAddUser").on("click", async () => {
      const formValues = await this.validateAddUserForm();
      if (formValues) {
        await this.createNewUser(formValues);
        this.closeAddUserModal();
      }
    });

    $("#newPhone").on("input", function () {
      const value = $(this).val();
      const cleaned = phoneUtils.cleanPhone(value);
      const formatted = phoneUtils.formatHKPhone(cleaned);
      $(this).val(formatted);
    });

    initImageUpload("newUserImageInput", "newUserImagePreview", {
      shape: "rounded-full",
      previewSize: "20",
    });

    $(document).on("keydown.addUserModal", (e) => {
      if (e.key === "Escape") {
        this.closeAddUserModal();
      }
    });

    scrollbarUtils.initModal($("#addUserModal .overflow-y-auto")[0]);
  },

  closeAddUserModal() {
    $(document).off("keydown.addUserModal");
    $("#addUserModal").fadeOut(200, function () {
      $(this).remove();
    });
  },

  generateAddUserTitle() {
    return `
      <div class="relative flex flex-col items-center justify-center w-full gap-2 py-3 px-4 border-b border-gray-200">
        <button
          type="button"
          id="closeAddUserModal"
          class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <i class="fas fa-times text-xl"></i>
        </button>
        <div class="h-12 w-12 rounded-full bg-green-600 flex items-center justify-center border-2 border-green-400">
          <i class="fas fa-user-plus text-white text-xl"></i>
        </div>
        <div class="text-center">
          <h3 class="text-lg font-bold text-gray-900 mb-0.5">Create New User</h3>
          <p class="text-xs text-gray-600">Add a new user account</p>
        </div>
      </div>
    `;
  },

  generateAddUserFormHTML() {
    return `
      <div class="space-y-3 text-left p-4 pt-3">
        <div class="bg-indigo-50 rounded-lg p-2.5 border border-indigo-200">
          <h4 class="text-xs font-semibold text-indigo-700 uppercase mb-2 flex items-center gap-1.5">
            <i class="fas fa-image text-indigo-600 text-sm"></i>
            Profile Picture
          </h4>
          <div class="flex items-center gap-4">
            <div id="newUserImagePreview" class="flex-shrink-0">
              <div class="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                <i class="fas fa-user text-3xl text-gray-400"></i>
              </div>
            </div>
            <div class="flex-1">
              <input
                type="file"
                id="newUserImageInput"
                accept="image/*"
                class="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 cursor-pointer"
              />
              <p class="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB (Optional)</p>
            </div>
          </div>
        </div>

        <div class="bg-blue-50 rounded-lg p-2.5 border border-blue-200">
          <h4 class="text-xs font-semibold text-blue-700 uppercase mb-2 flex items-center gap-1.5">
            <i class="fas fa-user text-blue-600 text-sm"></i>
            Account Information
          </h4>
          <div class="space-y-2">
            ${FormComponents.input({
      id: "newUsername",
      label: "Username",
      placeholder: "e.g., johndoe",
      required: true,
    })}
            ${FormComponents.input({
      id: "newPassword",
      type: "password",
      label: "Password",
      placeholder: "Minimum 8 characters",
      required: true,
    })}
            ${FormComponents.select({
      id: "newRole",
      label: "Role",
      options: [
        { value: "user", label: "User" },
        { value: "admin", label: "Admin" },
      ],
      required: true,
    })}
          </div>
        </div>

        <div class="bg-gray-50 rounded-lg p-2.5 border border-gray-200">
          <h4 class="text-xs font-semibold text-gray-700 uppercase mb-2 flex items-center gap-1.5">
            <i class="fas fa-user-circle text-indigo-600 text-sm"></i>
            Personal Information
          </h4>
          <div class="space-y-2">
            ${FormComponents.input({
      id: "newName",
      label: "Full Name",
      placeholder: "e.g., John Doe",
      required: true,
    })}
            ${FormComponents.select({
      id: "newGender",
      label: "Gender",
      options: [
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "prefer_not_to_say", label: "Prefer not to say" },
      ],
      required: true,
    })}
            ${FormComponents.input({
      id: "newBirthday",
      type: "date",
      label: "Birthday",
      required: true,
    })}
          </div>
        </div>

        <div class="bg-teal-50 rounded-lg p-2.5 border border-teal-200">
          <h4 class="text-xs font-semibold text-teal-700 uppercase mb-2 flex items-center gap-1.5">
            <i class="fas fa-envelope text-teal-600 text-sm"></i>
            Contact Information
          </h4>
          <div class="space-y-2">
            ${FormComponents.input({
      id: "newEmail",
      type: "email",
      label: "Email",
      placeholder: "e.g., john@example.com",
      required: true,
    })}
            ${FormComponents.input({
      id: "newPhone",
      type: "tel",
      label: "Phone (Hong Kong)",
      placeholder: "e.g., 9123 4567",
    })}
          </div>
        </div>
      </div>
    `;
  },

  async validateAddUserForm() {
    const username = $("#newUsername").val().trim();
    const password = $("#newPassword").val();
    const name = $("#newName").val().trim();
    const email = $("#newEmail").val().trim();
    const phone = phoneUtils.cleanPhone($("#newPhone").val());
    const gender = $("#newGender").val();
    const birthday = $("#newBirthday").val();
    const role = $("#newRole").val();

    if (!username || !password || !name || !email || !birthday || !gender) {
      notify.error("Please fill in all required fields");
      return false;
    }

    if (!userService.validateUsername(username)) {
      notify.error(
        "Username: 3-20 chars, letters, numbers, underscore, hyphen"
      );
      return false;
    }

    if (this.allUsers.some((u) => u.username === username)) {
      notify.error("Username already exists");
      return false;
    }

    if (this.allUsers.some((u) => u.email === email)) {
      notify.error("Email already registered");
      return false;
    }

    if (password.length < 8) {
      notify.error("Password must be at least 8 characters");
      return false;
    }

    if (!userService.validateAge(birthday)) {
      notify.error("User must be at least 13 years old");
      return false;
    }

    if (phone && !userService.validatePhone(phone)) {
      notify.error("Invalid HK phone (8 digits, starts with 2-9)");
      return false;
    }

    const profileImage = await getImageDataURL("newUserImageInput");

    return {
      username,
      password,
      name,
      email,
      phone,
      gender,
      birthday,
      role,
      profileImage,
    };
  },

  async createNewUser(formValues) {
    try {
      const newUserData = {
        username: formValues.username,
        password: formValues.password,
        title: formValues.title || "",
        name: formValues.name,
        email: formValues.email,
        gender: formValues.gender,
        birthday: formValues.birthday,
        phone: formValues.phone || null,
        role: formValues.role,
        status: "active",
        profileImage: formValues.profileImage || null,
      };

      const createdUser = await adminUserService.create(newUserData);
      if (!createdUser) {
        throw new Error("Invalid create user response");
      }

      this.allUsers.push({ ...createdUser });
      this.renderDataTable();
      this.renderStats();

      notify.confirm(`User ${createdUser.username} created successfully!`);
    } catch (error) {
      console.error("Create user error:", error);
      handleApiError(error, "Failed to create user");
      throw error;
    }
  },

  async exportUsers() {
    const loadingNotif = notify.loading("Preparing CSV export...");

    try {
      const userData = this.filteredUsers.map((user) => ({
        "User ID": user.userId,
        UUID: user.id,
        Username: user.username,
        "Full Name": `${user.title || ""}${user.name}`.trim(),
        Email: user.email,
        Phone: user.phone ? phoneUtils.formatHKPhone(user.phone) : "",
        Gender:
          user.gender === "prefer_not_to_say" ? "Not specified" : user.gender,
        Birthday: dayjs(user.birthday).format("YYYY-MM-DD"),
        Age: dayjs().diff(dayjs(user.birthday), "year"),
        Role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        Status: user.status.charAt(0).toUpperCase() + user.status.slice(1),
        Registered: dayjs(user.createdAt).format("YYYY-MM-DD HH:mm:ss"),
        "Last Updated": user.updatedAt
          ? dayjs(user.updatedAt).format("YYYY-MM-DD HH:mm:ss")
          : "Never",
      }));

      const csv = Papa.unparse(userData, {
        quotes: true,
        header: true,
      });

      const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${dayjs().format("YYYY-MM-DD-HHmmss")}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      notify.dismiss(loadingNotif);
      notify.download(
        `${this.filteredUsers.length} users exported successfully!`
      );
    } catch (error) {
      notify.dismiss(loadingNotif);
      notify.error("Failed to export users: " + error.message);
      console.error("Export error:", error);
    }
  },

  async importUsers() {
    const { value: file } = await Swal.fire({
      title: "Import Users from CSV",
      html: `
        <div class="text-left space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p class="text-sm text-blue-800 mb-2">
              <i class="fas fa-info-circle mr-2"></i><strong>CSV Format Required:</strong>
            </p>
            <code class="text-xs bg-blue-100 p-2 rounded block">
              Username,Password,Name,Email,Phone,Gender,Birthday,Role
            </code>
          </div>
          <input type="file" id="csvFile" accept=".csv" class="w-full px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Import",
      confirmButtonColor: SwalColors.primary,
      preConfirm: () => {
        const fileInput = document.getElementById("csvFile");
        if (!fileInput.files[0]) {
          Swal.showValidationMessage("Please select a CSV file");
          return false;
        }
        return fileInput.files[0];
      },
    });

    if (file) {
      const loadingNotif = notify.loading("Importing users...");

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          try {
            const result = await adminUserService.bulkCreate(
              results.data,
              this.allUsers
            );

            this.allUsers.push(...result.created);
            this.renderDataTable();
            this.renderStats();

            notify.dismiss(loadingNotif);

            await Swal.fire({
              title: "Import Complete",
              html: `
                <div class="text-left">
                  <p class="text-green-600 font-semibold mb-2">
                    <i class="fas fa-check-circle mr-2"></i>${result.imported
                } users imported successfully
                  </p>
                  ${result.errors.length > 0
                  ? `
                    <p class="text-red-600 font-semibold mt-4 mb-2">
                      <i class="fas fa-exclamation-triangle mr-2"></i>${result.errors.length
                  } errors:
                    </p>
                    <div class="bg-red-50 rounded p-3 max-h-40 overflow-y-auto">
                      <ul class="text-xs text-red-700 space-y-1">
                        ${result.errors
                    .slice(0, 10)
                    .map((e) => `<li>• ${e}</li>`)
                    .join("")}
                        ${result.errors.length > 10
                    ? `<li>... and ${result.errors.length - 10
                    } more</li>`
                    : ""
                  }
                      </ul>
                    </div>
                  `
                  : ""
                }
                </div>
              `,
              icon: result.imported > 0 ? "success" : "warning",
              confirmButtonColor: SwalColors.primary,
            });

            if (result.imported > 0) {
              notify.success(`${result.imported} users imported successfully!`);
            }
          } catch (error) {
            notify.dismiss(loadingNotif);
            notify.error("Import failed: " + error.message);
          }
        },
        error: (error) => {
          notify.dismiss(loadingNotif);
          notify.error("Failed to parse CSV: " + error.message);
        },
      });
    }
  },
};
