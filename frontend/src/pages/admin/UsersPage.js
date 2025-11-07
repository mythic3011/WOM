import { createEmptyState } from "/src/components/EmptyState.js";
import { createLoadingState } from "/src/components/LoadingState.js";
import { createTable } from "/src/components/Table.js";
import { storage } from "/src/services/storageService.js";
import { FormComponents } from "/src/components/FormComponents.js";
import { statsService } from "/src/services/statsService.js";
import { userService } from "/src/services/userService.js";
import { phoneUtils } from "/src/utils/forms/phoneFormat.js";
import { notify } from "/src/utils/ui/notification.js";
import { hashPassword } from "/src/utils/core/crypto.js";
import { SwalColors } from "/src/utils/colors.js";
import { scrollbarUtils } from "/src/utils/ui/scrollbar.js";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Papa from "papaparse";

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
          ${FormComponents.pageHeader({
            title: "User Management",
            subtitle: "View and manage all registered users",
            icon: "fa-users",
          })}

          <div id="userStats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          </div>

          ${FormComponents.filterBar({
            searchId: "searchUsers",
            searchPlaceholder: "Search by name, email, username...",
            filters: [
              {
                id: "roleFilter",
                options: [
                  { value: "", label: "All Roles" },
                  { value: "user", label: "Users" },
                  { value: "admin", label: "Admins" },
                ],
              },
              {
                id: "statusFilter",
                options: [
                  { value: "", label: "All Status" },
                  { value: "active", label: "Active" },
                  { value: "suspended", label: "Suspended" },
                ],
              },
            ],
            actions: [
              {
                id: "importUsers",
                text: "Import CSV",
                icon: "fa-upload",
                color: "cyan",
              },
              {
                id: "exportUsers",
                text: "Export CSV",
                icon: "fa-download",
                color: "green",
              },
              {
                id: "addUser",
                text: "Add User",
                icon: "fa-plus",
                color: "indigo",
              },
            ],
          })}

          <div id="usersTable" class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            ${createLoadingState({ message: "Loading users..." })}
          </div>
        </div>
      </main>
    `;
  },

  async afterRender() {
    this.loadUsers();
    this.attachEventListeners();
  },

  loadUsers() {
    const registeredUsers = storage.getItem("registeredUsers", []);
    this.allUsers = registeredUsers.map((user) => ({
      ...user,
      status: user.status || "active",
    }));
    this.filteredUsers = this.allUsers;

    this.renderStats();
    this.renderUsersTable();
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

  renderUsersTable() {
    const columns = [
      {
        key: "profile",
        label: "User",
        render: (user) => `
          <div class="flex items-center gap-3">
            ${
              user.profileImage
                ? `<img src="${user.profileImage}" class="h-10 w-10 rounded-full object-cover" alt="${user.name}" />`
                : `<div class="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-indigo-400 shadow-sm">
                    <span class="text-white font-bold text-lg">${(
                      user.name || "U"
                    )
                      .charAt(0)
                      .toUpperCase()}</span>
                  </div>`
            }
            <div>
              <p class="font-semibold text-gray-900">${
                user.title ? user.title + " " : ""
              }${user.name}</p>
              <p class="text-xs text-gray-500">@${user.username} (ID: #${
          user.userId
        })</p>
            </div>
          </div>
        `,
      },
      {
        key: "email",
        label: "Contact",
        render: (user) => `
          <div>
            <p class="text-sm text-gray-900">${user.email}</p>
            ${
              user.phone
                ? `<p class="text-xs text-gray-500"><i class="fas fa-phone mr-1"></i>${phoneUtils.formatHKPhone(
                    user.phone
                  )}</p>`
                : ""
            }
            <p class="text-xs text-gray-500">
              <i class="fas fa-${
                user.gender === "male"
                  ? "mars text-blue-500"
                  : user.gender === "female"
                  ? "venus text-pink-500"
                  : "genderless text-gray-400"
              }"></i>
              ${
                user.gender === "prefer_not_to_say"
                  ? "Not specified"
                  : user.gender.charAt(0).toUpperCase() + user.gender.slice(1)
              }
            </p>
          </div>
        `,
      },
      {
        key: "birthday",
        label: "Birthday",
        render: (user) => {
          const age = dayjs().diff(dayjs(user.birthday), "year");
          return `
            <div class="text-sm">
              <p class="text-gray-900">${dayjs(user.birthday).format(
                "MMM D, YYYY"
              )}</p>
              <p class="text-xs text-gray-500">${age} years old</p>
            </div>
          `;
        },
      },
      {
        key: "role",
        label: "Role",
        render: (user) =>
          FormComponents.badge({
            text: user.role === "admin" ? "Admin" : "User",
            color: user.role === "admin" ? "purple" : "blue",
          }),
      },
      {
        key: "status",
        label: "Status",
        render: (user) =>
          FormComponents.badge({
            text: user.status === "active" ? "Active" : "Suspended",
            color: user.status === "active" ? "green" : "red",
          }),
      },
      {
        key: "createdAt",
        label: "Registered",
        render: (user) => `
          <div class="text-sm">
            <p class="text-gray-900">${dayjs(user.createdAt).format(
              "MMM D, YYYY"
            )}</p>
            <p class="text-xs text-gray-500">${dayjs(
              user.createdAt
            ).fromNow()}</p>
          </div>
        `,
      },
    ];

    const tableHTML = createTable({
      columns,
      data: this.filteredUsers,
      title: "Users List",
      icon: "fa-users",
      subtitle: `Showing <span class="font-semibold text-indigo-600">${this.filteredUsers.length}</span> of <span class="font-semibold">${this.allUsers.length}</span> users`,
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
          ${
            user.role !== "admin"
              ? `<button
                  class="user-action-btn px-3 py-2 rounded-lg text-white ${
                    user.status === "active"
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "bg-green-500 hover:bg-green-600"
                  } transition-colors cursor-pointer"
                  data-action="toggle-status"
                  data-user-id="${user.userId}"
                  title="${user.status === "active" ? "Suspend" : "Activate"}"
                  type="button"
                >
                  <i class="fas ${
                    user.status === "active" ? "fa-ban" : "fa-check"
                  } pointer-events-none"></i>
                </button>`
              : ""
          }
          ${
            user.userId !== storage.getUser()?.userId && user.role !== "admin"
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

    $("#usersTable").html(tableHTML);
  },

  attachEventListeners() {
    $("#searchUsers").on("input", () => this.filterUsers());
    $("#roleFilter, #statusFilter").on("change", () => this.filterUsers());
    $("#clearFilters").on("click", () => this.clearFilters());
    $("#importUsers").on("click", () => this.importUsers());
    $("#exportUsers").on("click", () => this.exportUsers());
    $("#addUser").on("click", () => this.addUser());

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

        console.log("Button clicked - Action:", action, "UserID:", userId);

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

  filterUsers() {
    const search = $("#searchUsers").val().toLowerCase();
    const role = $("#roleFilter").val();
    const status = $("#statusFilter").val();

    this.filteredUsers = this.allUsers.filter((user) => {
      const matchesSearch =
        !search ||
        String(user.userId).toLowerCase().includes(search) ||
        (user.username && user.username.toLowerCase().includes(search)) ||
        (user.name && user.name.toLowerCase().includes(search)) ||
        (user.email && user.email.toLowerCase().includes(search));

      const matchesRole = !role || user.role === role;
      const matchesStatus = !status || user.status === status;

      return matchesSearch && matchesRole && matchesStatus;
    });

    this.renderUsersTable();
  },

  clearFilters() {
    $("#searchUsers").val("");
    $("#roleFilter, #statusFilter").val("");
    this.filteredUsers = this.allUsers;
    this.renderUsersTable();
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

    const bookings = storage
      .getItem("bookings", [])
      .filter((b) => b.userId === user.id);
    const totalSpent = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);

    await Swal.fire({
      title: `<div class="flex items-center gap-3">
        ${
          user.profileImage
            ? `<img src="${user.profileImage}" class="h-16 w-16 rounded-full object-cover" />`
            : `<div class="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span class="text-white font-bold text-2xl">${(user.name || "U")
                  .charAt(0)
                  .toUpperCase()}</span>
              </div>`
        }
        <div class="text-left">
          <h3 class="text-xl font-bold text-gray-900">${
            user.title ? user.title + " " : ""
          }${user.name}</h3>
          <p class="text-sm text-gray-500">@${user.username} (ID: #${
        user.userId
      })</p>
        </div>
      </div>`,
      html: `
        <div class="text-left space-y-4 mt-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <p class="text-xs text-blue-600 font-semibold uppercase">Email</p>
              <p class="text-sm text-gray-900 mt-1">${user.email}</p>
            </div>
            <div class="bg-teal-50 p-4 rounded-lg">
              <p class="text-xs text-teal-600 font-semibold uppercase">Phone</p>
              <p class="text-sm text-gray-900 mt-1">${
                user.phone
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
              <p class="text-sm text-gray-900 mt-1 capitalize">${
                user.status
              }</p>
            </div>
            <div class="bg-orange-50 p-4 rounded-lg">
              <p class="text-xs text-orange-600 font-semibold uppercase">Gender</p>
              <p class="text-sm text-gray-900 mt-1 capitalize">${
                user.gender === "prefer_not_to_say"
                  ? "Not specified"
                  : user.gender
              }</p>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
              <p class="text-xs text-yellow-600 font-semibold uppercase">Username</p>
              <p class="text-sm text-gray-900 mt-1 font-mono">@${
                user.username
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
                <p class="text-2xl font-bold text-indigo-600">${
                  bookings.length
                }</p>
                <p class="text-xs text-gray-600">Total Bookings</p>
              </div>
              <div class="bg-green-50 p-3 rounded-lg text-center">
                <p class="text-2xl font-bold text-green-600">$${totalSpent}</p>
                <p class="text-xs text-gray-600">Total Spent</p>
              </div>
              <div class="bg-yellow-50 p-3 rounded-lg text-center">
                <p class="text-2xl font-bold text-yellow-600">${
                  bookings.filter((b) => b.status === "confirmed").length
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
      notify.error("User not found");
      return;
    }

    const { value: formValues } = await Swal.fire({
      title: `<div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-3">
          ${
            user.profileImage
              ? `<img src="${user.profileImage}" class="h-12 w-12 rounded-full object-cover border-2 border-indigo-200" />`
              : `<div class="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center border-2 border-indigo-400">
                  <span class="text-white font-bold text-lg">${(
                    user.name || "U"
                  )
                    .charAt(0)
                    .toUpperCase()}</span>
                </div>`
          }
          <div class="text-left">
            <h3 class="text-xl font-bold text-gray-900">Edit User</h3>
            <p class="text-sm text-gray-500">@${user.username} (ID: #${
        user.userId
      })</p>
          </div>
        </div>
      </div>`,
      html: `
        <div class="space-y-6 text-left mt-4">
          <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 class="text-sm font-semibold text-gray-700 uppercase mb-3 flex items-center gap-2">
              <i class="fas fa-user-circle text-indigo-600"></i>
              Personal Information
            </h4>
            <div class="space-y-3">
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
                  { value: "other", label: "Other" },
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

          <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 class="text-sm font-semibold text-blue-700 uppercase mb-3 flex items-center gap-2">
              <i class="fas fa-envelope text-blue-600"></i>
              Contact Information
            </h4>
            <div class="space-y-3">
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

          <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h4 class="text-sm font-semibold text-purple-700 uppercase mb-3 flex items-center gap-2">
              <i class="fas fa-user-shield text-purple-600"></i>
              Account Settings
            </h4>
            <div class="space-y-3">
              <div class="bg-white rounded p-3 border border-gray-200">
                <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value="@${user.username}"
                  class="w-full px-3 py-2 text-sm font-mono bg-gray-50 border border-gray-300 rounded text-gray-500 cursor-not-allowed"
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
                  { value: "user", label: "User - Regular Access" },
                  { value: "admin", label: "Admin - Full Access" },
                ],
                required: true,
              })}
              ${FormComponents.select({
                id: "editStatus",
                label: "Account Status",
                value: user.status,
                options: [
                  { value: "active", label: "Active - Can login and book" },
                  { value: "suspended", label: "Suspended - Cannot login" },
                ],
                required: true,
              })}
            </div>
          </div>

          <div class="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <p class="text-xs text-gray-600">
              <i class="fas fa-clock mr-1"></i>
              <strong>Last Updated:</strong> ${
                user.updatedAt
                  ? dayjs(user.updatedAt).format("MMM D, YYYY [at] h:mm A")
                  : "Never"
              }
            </p>
          </div>
        </div>
      `,
      width: 700,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-save mr-2"></i>Save Changes',
      cancelButtonText: '<i class="fas fa-times mr-2"></i>Cancel',
      confirmButtonColor: SwalColors.primary,
      customClass: {
        popup: "edit-user-modal",
        htmlContainer: "!max-h-[70vh]",
      },
      didOpen: () => {
        const modalContent = document.querySelector(
          ".edit-user-modal .swal2-html-container"
        );
        if (modalContent) {
          scrollbarUtils.initModal(modalContent);
        }

        $("#editPhone").on("input", function () {
          const value = $(this).val();
          const cleaned = phoneUtils.cleanPhone(value);
          const formatted = phoneUtils.formatHKPhone(cleaned);
          $(this).val(formatted);
        });
      },
      preConfirm: () => {
        const title = $("#editTitle").val();
        const name = $("#editName").val().trim();
        const gender = $("#editGender").val();
        const birthday = $("#editBirthday").val();
        const email = $("#editEmail").val().trim();
        const phone = phoneUtils.cleanPhone($("#editPhone").val());
        const role = $("#editRole").val();
        const status = $("#editStatus").val();

        if (!name || !email) {
          Swal.showValidationMessage("Please fill in all required fields");
          return false;
        }

        if (!userService.validateEmail(email)) {
          Swal.showValidationMessage("Please enter a valid email address");
          return false;
        }

        if (phone && !userService.validatePhone(phone)) {
          Swal.showValidationMessage(
            "Invalid HK phone number (8 digits, starts with 2-9)"
          );
          return false;
        }

        if (birthday && dayjs(birthday).isAfter(dayjs())) {
          Swal.showValidationMessage("Birthday cannot be in the future");
          return false;
        }

        return { title, name, gender, birthday, email, phone, role, status };
      },
    });

    if (formValues) {
      const changes = [];
      if (formValues.title !== (user.title || "")) changes.push("Title");
      if (formValues.name !== user.name) changes.push("Name");
      if (formValues.gender !== user.gender) changes.push("Gender");
      if (formValues.birthday !== user.birthday) changes.push("Birthday");
      if (formValues.email !== user.email) changes.push("Email");
      if (formValues.phone !== user.phone) changes.push("Phone");
      if (formValues.role !== user.role) changes.push("Role");
      if (formValues.status !== user.status) changes.push("Status");

      const updatedUsers = this.allUsers.map((u) =>
        String(u.userId) === String(userId)
          ? { ...u, ...formValues, updatedAt: new Date().toISOString() }
          : u
      );

      storage.setItem("registeredUsers", updatedUsers);
      this.allUsers = updatedUsers;
      this.filterUsers();
      this.renderStats();

      if (changes.length > 0) {
        notify.saved(
          `User ${formValues.name} updated! Changes: ${changes.join(", ")}`
        );
      } else {
        notify.info("No changes were made");
      }
    }
  },

  async toggleUserStatus(userId) {
    const user = this.allUsers.find((u) => String(u.userId) === String(userId));
    if (!user) {
      notify.error("User not found");
      return;
    }

    const newStatus = user.status === "active" ? "suspended" : "active";

    const result = await Swal.fire({
      title: `${newStatus === "suspended" ? "Suspend" : "Activate"} User?`,
      html: `
        <p class="text-gray-700">Are you sure you want to ${
          newStatus === "suspended" ? "suspend" : "activate"
        } <strong>${user.name}</strong> (@${user.username})?</p>
        ${
          newStatus === "suspended"
            ? '<p class="text-sm text-red-600 mt-2">This user will not be able to log in or make bookings.</p>'
            : '<p class="text-sm text-green-600 mt-2">This user will be able to log in and make bookings.</p>'
        }
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Yes, ${
        newStatus === "suspended" ? "Suspend" : "Activate"
      }`,
      cancelButtonText: "Cancel",
      confirmButtonColor:
        newStatus === "suspended" ? SwalColors.danger : SwalColors.success,
    });

    if (result.isConfirmed) {
      const updatedUsers = this.allUsers.map((u) =>
        String(u.userId) === String(userId)
          ? { ...u, status: newStatus, updatedAt: new Date().toISOString() }
          : u
      );

      storage.setItem("registeredUsers", updatedUsers);
      this.allUsers = updatedUsers;
      this.filterUsers();
      this.renderStats();

      notify.success(
        `User ${
          newStatus === "suspended" ? "suspended" : "activated"
        } successfully!`
      );
    }
  },

  async deleteUser(userId) {
    const user = this.allUsers.find((u) => String(u.userId) === String(userId));
    if (!user) {
      notify.error("User not found");
      return;
    }

    const bookings = storage
      .getItem("bookings", [])
      .filter((b) => b.userId === user.id);

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
              <li>• ${bookings.length} booking(s) will remain but be marked as deleted user</li>
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
      const updatedUsers = this.allUsers.filter(
        (u) => String(u.userId) !== String(userId)
      );
      storage.setItem("registeredUsers", updatedUsers);
      this.allUsers = updatedUsers;
      this.filterUsers();
      this.renderStats();

      notify.deleted(`User ${user.username} deleted successfully!`);
    }
  },

  async addUser() {
    const { value: formValues } = await Swal.fire({
      title: "Add New User",
      html: `
        <div class="space-y-4 text-left">
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
          ${FormComponents.input({
            id: "newName",
            label: "Full Name",
            placeholder: "e.g., John Doe",
            required: true,
          })}
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
            label: "Phone (HK)",
            placeholder: "e.g., 9123 4567",
          })}
          ${FormComponents.select({
            id: "newGender",
            label: "Gender",
            options: [
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
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
      `,
      width: 600,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Create User",
      cancelButtonText: "Cancel",
      confirmButtonColor: SwalColors.primary,
      didOpen: () => {
        $("#newPhone").on("input", function () {
          const value = $(this).val();
          const cleaned = phoneUtils.cleanPhone(value);
          const formatted = phoneUtils.formatHKPhone(cleaned);
          $(this).val(formatted);
        });
      },
      preConfirm: async () => {
        const username = $("#newUsername").val().trim();
        const password = $("#newPassword").val();
        const name = $("#newName").val().trim();
        const email = $("#newEmail").val().trim();
        const phone = phoneUtils.cleanPhone($("#newPhone").val());
        const gender = $("#newGender").val();
        const birthday = $("#newBirthday").val();
        const role = $("#newRole").val();

        if (!username || !password || !name || !email || !birthday || !gender) {
          Swal.showValidationMessage("Please fill in all required fields");
          return false;
        }

        if (!userService.validateUsername(username)) {
          Swal.showValidationMessage(
            "Username: 3-20 chars, letters, numbers, underscore, hyphen"
          );
          return false;
        }

        if (this.allUsers.some((u) => u.username === username)) {
          Swal.showValidationMessage("Username already exists");
          return false;
        }

        if (this.allUsers.some((u) => u.email === email)) {
          Swal.showValidationMessage("Email already registered");
          return false;
        }

        if (password.length < 8) {
          Swal.showValidationMessage("Password must be at least 8 characters");
          return false;
        }

        if (!userService.validateAge(birthday)) {
          Swal.showValidationMessage("User must be at least 13 years old");
          return false;
        }

        if (phone && !userService.validatePhone(phone)) {
          Swal.showValidationMessage(
            "Invalid HK phone (8 digits, starts with 2-9)"
          );
          return false;
        }

        try {
          const passwordHash = await hashPassword(password);
          return {
            username,
            passwordHash,
            name,
            email,
            phone,
            gender,
            birthday,
            role,
          };
        } catch (error) {
          Swal.showValidationMessage(
            "Error hashing password: " + error.message
          );
          return false;
        }
      },
    });

    if (formValues) {
      const newUser = {
        id: this.generateUUID(),
        userId:
          this.allUsers.length > 0
            ? Math.max(...this.allUsers.map((u) => u.userId || 0)) + 1
            : 1,
        password: formValues.passwordHash,
        title: "",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: null,
        profileImage: null,
        ...formValues,
      };
      delete newUser.passwordHash;

      const updatedUsers = [...this.allUsers, newUser];
      storage.setItem("registeredUsers", updatedUsers);
      this.allUsers = updatedUsers;
      this.filterUsers();
      this.renderStats();

      notify.confirm(`User ${newUser.username} created successfully!`);
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
            let imported = 0;
            let errors = [];

            for (const row of results.data) {
              try {
                if (!row.Username || !row.Password || !row.Email) {
                  errors.push(`Skipped row: Missing required fields`);
                  continue;
                }

                if (this.allUsers.some((u) => u.username === row.Username)) {
                  errors.push(
                    `Skipped: Username '${row.Username}' already exists`
                  );
                  continue;
                }

                if (this.allUsers.some((u) => u.email === row.Email)) {
                  errors.push(
                    `Skipped: Email '${row.Email}' already registered`
                  );
                  continue;
                }

                const passwordHash = await hashPassword(row.Password);

                const newUser = {
                  id: this.generateUUID(),
                  userId:
                    Math.max(...this.allUsers.map((u) => u.userId || 0), 0) + 1,
                  username: row.Username,
                  password: passwordHash,
                  name: row.Name,
                  email: row.Email,
                  phone: row.Phone || "",
                  gender: row.Gender || "prefer_not_to_say",
                  birthday:
                    row.Birthday ||
                    dayjs().subtract(25, "year").format("YYYY-MM-DD"),
                  role: row.Role?.toLowerCase() || "user",
                  status: "active",
                  title: "",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  lastLoginAt: null,
                  profileImage: null,
                };

                this.allUsers.push(newUser);
                imported++;
              } catch (err) {
                errors.push(`Error importing ${row.Username}: ${err.message}`);
              }
            }

            storage.setItem("registeredUsers", this.allUsers);
            this.filterUsers();
            this.renderStats();

            notify.dismiss(loadingNotif);

            await Swal.fire({
              title: "Import Complete",
              html: `
                <div class="text-left">
                  <p class="text-green-600 font-semibold mb-2">
                    <i class="fas fa-check-circle mr-2"></i>${imported} users imported successfully
                  </p>
                  ${
                    errors.length > 0
                      ? `
                    <p class="text-red-600 font-semibold mt-4 mb-2">
                      <i class="fas fa-exclamation-triangle mr-2"></i>${
                        errors.length
                      } errors:
                    </p>
                    <div class="bg-red-50 rounded p-3 max-h-40 overflow-y-auto">
                      <ul class="text-xs text-red-700 space-y-1">
                        ${errors
                          .slice(0, 10)
                          .map((e) => `<li>• ${e}</li>`)
                          .join("")}
                        ${
                          errors.length > 10
                            ? `<li>... and ${errors.length - 10} more</li>`
                            : ""
                        }
                      </ul>
                    </div>
                  `
                      : ""
                  }
                </div>
              `,
              icon: imported > 0 ? "success" : "warning",
              confirmButtonColor: SwalColors.primary,
            });

            if (imported > 0) {
              notify.success(`${imported} users imported successfully!`);
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

  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
};
