import { createEmptyState } from "/src/components/EmptyState.js";
import { storage } from "/src/services/storageService.js";
import { FormComponents } from "/src/components/FormComponents.js";
import { statsService } from "/src/services/statsService.js";
import { userService } from "/src/services/userService.js";
import { phoneUtils } from "/src/utils/forms/phoneFormat.js";
import { notify } from "/src/utils/ui/notification.js";
import { hashPassword } from "/src/utils/core/crypto.js";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default {
  title: "User Management | Admin",
  allUsers: [],
  filteredUsers: [],

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
            <div class="text-center py-20">
              <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              <p class="mt-4 text-gray-600">Loading users...</p>
            </div>
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
    if (this.filteredUsers.length === 0) {
      $("#usersTable").html(
        createEmptyState({
          icon: "fa-users",
          title: "No users found",
          message: "Try adjusting your search or filters",
        })
      );
      return;
    }

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
      {
        key: "actions",
        label: "Actions",
        render: (user) => `
          <div class="flex items-center gap-2">
            ${FormComponents.actionButton({
              icon: "fa-eye",
              color: "blue",
              size: "sm",
              title: "View Details",
              onClick: `viewUser(${user.userId})`,
            })}
            ${FormComponents.actionButton({
              icon: "fa-edit",
              color: "yellow",
              size: "sm",
              title: "Edit User",
              onClick: `editUser(${user.userId})`,
            })}
            ${
              user.role !== "admin"
                ? FormComponents.actionButton({
                    icon: user.status === "active" ? "fa-ban" : "fa-check",
                    color: user.status === "active" ? "orange" : "green",
                    size: "sm",
                    title: user.status === "active" ? "Suspend" : "Activate",
                    onClick: `toggleUserStatus(${user.userId})`,
                  })
                : ""
            }
            ${
              user.userId !== storage.getUser()?.userId && user.role !== "admin"
                ? FormComponents.actionButton({
                    icon: "fa-trash",
                    color: "red",
                    size: "sm",
                    title: "Delete User",
                    onClick: `deleteUser(${user.userId})`,
                  })
                : ""
            }
          </div>
        `,
      },
    ];

    const tableHTML = FormComponents.dataTable({
      columns,
      data: this.filteredUsers,
    });

    $("#usersTable").html(tableHTML);
  },

  attachEventListeners() {
    const self = this;

    $("#searchUsers").on("input", () => this.filterUsers());
    $("#roleFilter, #statusFilter").on("change", () => this.filterUsers());
    $("#clearFilters").on("click", () => this.clearFilters());
    $("#exportUsers").on("click", () => this.exportUsers());
    $("#addUser").on("click", () => this.addUser());

    window.viewUser = (userId) => this.viewUser(userId);
    window.editUser = (userId) => this.editUser(userId);
    window.toggleUserStatus = (userId) => this.toggleUserStatus(userId);
    window.deleteUser = (userId) => this.deleteUser(userId);
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
    const user = this.allUsers.find((u) => u.userId === userId);
    if (!user) return;

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
      confirmButtonColor: "#4f46e5",
    });
  },

  async editUser(userId) {
    const user = this.allUsers.find((u) => u.userId === userId);
    if (!user) return;

    const { value: formValues } = await Swal.fire({
      title: "Edit User",
      html: `
        <div class="space-y-4 text-left">
          ${FormComponents.input({
            id: "editName",
            label: "Full Name",
            value: user.name,
            required: true,
          })}
          ${FormComponents.input({
            id: "editEmail",
            type: "email",
            label: "Email",
            value: user.email,
            required: true,
          })}
          ${FormComponents.input({
            id: "editPhone",
            type: "tel",
            label: "Phone (HK)",
            value: user.phone ? phoneUtils.formatHKPhone(user.phone) : "",
          })}
          ${FormComponents.select({
            id: "editRole",
            label: "Role",
            value: user.role,
            options: [
              { value: "user", label: "User" },
              { value: "admin", label: "Admin" },
            ],
            required: true,
          })}
          ${FormComponents.select({
            id: "editStatus",
            label: "Status",
            value: user.status,
            options: [
              { value: "active", label: "Active" },
              { value: "suspended", label: "Suspended" },
            ],
            required: true,
          })}
        </div>
      `,
      width: 500,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Save Changes",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#4f46e5",
      didOpen: () => {
        $("#editPhone").on("input", function () {
          const value = $(this).val();
          const cleaned = phoneUtils.cleanPhone(value);
          const formatted = phoneUtils.formatHKPhone(cleaned);
          $(this).val(formatted);
        });
      },
      preConfirm: () => {
        const name = $("#editName").val();
        const email = $("#editEmail").val();
        const phone = phoneUtils.cleanPhone($("#editPhone").val());
        const role = $("#editRole").val();
        const status = $("#editStatus").val();

        if (!name || !email) {
          Swal.showValidationMessage("Please fill in all required fields");
          return false;
        }

        if (phone && !userService.validatePhone(phone)) {
          Swal.showValidationMessage(
            "Invalid HK phone number (8 digits, starts with 2-9)"
          );
          return false;
        }

        return { name, email, phone, role, status };
      },
    });

    if (formValues) {
      const updatedUsers = this.allUsers.map((u) =>
        u.userId === userId
          ? { ...u, ...formValues, updatedAt: new Date().toISOString() }
          : u
      );

      storage.setItem("registeredUsers", updatedUsers);
      this.allUsers = updatedUsers;
      this.filterUsers();
      this.renderStats();

      notify.success("User updated successfully!");
    }
  },

  async toggleUserStatus(userId) {
    const user = this.allUsers.find((u) => u.userId === userId);
    if (!user) return;

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
      confirmButtonColor: newStatus === "suspended" ? "#ef4444" : "#10b981",
    });

    if (result.isConfirmed) {
      const updatedUsers = this.allUsers.map((u) =>
        u.userId === userId
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
    const user = this.allUsers.find((u) => u.userId === userId);
    if (!user) return;

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
      confirmButtonColor: "#ef4444",
      input: "checkbox",
      inputPlaceholder: "I understand this action is permanent",
      inputValidator: (result) => {
        return !result && "You must confirm before proceeding";
      },
    });

    if (result.isConfirmed) {
      const updatedUsers = this.allUsers.filter((u) => u.userId !== userId);
      storage.setItem("registeredUsers", updatedUsers);
      this.allUsers = updatedUsers;
      this.filterUsers();
      this.renderStats();

      notify.success(`User ${user.username} deleted successfully!`);
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
      confirmButtonColor: "#4f46e5",
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
      const generateUUID = () => {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      };

      const newUser = {
        id: generateUUID(),
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

      notify.success("User created successfully!");
    }
  },

  exportUsers() {
    const csv = [
      [
        "ID",
        "User ID",
        "Username",
        "Name",
        "Email",
        "Phone",
        "Gender",
        "Birthday",
        "Role",
        "Status",
        "Registered",
      ],
      ...this.filteredUsers.map((user) => [
        user.userId,
        user.id,
        user.username,
        `${user.title || ""}${user.name}`.trim(),
        user.email,
        user.phone ? phoneUtils.formatHKPhone(user.phone) : "",
        user.gender,
        dayjs(user.birthday).format("YYYY-MM-DD"),
        user.role,
        user.status,
        dayjs(user.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${dayjs().format("YYYY-MM-DD")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    notify.success("Users exported successfully!");
  },
};
