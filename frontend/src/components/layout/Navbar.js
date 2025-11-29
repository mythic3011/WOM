
import dayjs from "dayjs";
import Swal from "sweetalert2";

import { ROUTES, getRouteMetadata } from "@config/routes.js";
import { SwalColors } from "@utils/colors.js";
import { getCurrentUser, logout } from "@utils/core/auth.js";
import { Avatar } from "@components/common/Avatar.js";
import { getProfileImage } from "@services/profileImageService.js";
import { notificationService } from "@services/notificationService.js";

const NAVBAR_CONFIG = {
  dateFormat: "ddd, MMM D, YYYY",
  dropdownWidth: "w-60",
  notificationWidth: "w-80",
};

// Track initialization to prevent duplicate calls
let isInitialized = false;
let currentUserId = null;

const NAV_LINKS = {
  admin: [
    { href: ROUTES.ADMIN.DASHBOARD, icon: "fa-tachometer-alt", label: "Dashboard" },
    { href: ROUTES.PUBLIC.PERFORMANCES, icon: "fa-music", label: "Browse Performances" },
    { href: ROUTES.ADMIN.PERFORMANCES, icon: "fa-music", label: "Manage Performances" },
    { href: ROUTES.ADMIN.VENUES, icon: "fa-building", label: "Venues" },
    { href: ROUTES.ADMIN.USERS, icon: "fa-users", label: "User Management" },
    { href: ROUTES.ADMIN.BOOKINGS, icon: "fa-clipboard-list", label: "Bookings" },
    { href: ROUTES.ADMIN.SEAT_MANAGEMENT, icon: "fa-chair", label: "Seat Management" },
    { href: ROUTES.ADMIN.SETTINGS, icon: "fa-cog", label: "Settings" },
    { href: ROUTES.USER.PROFILE, icon: "fa-user-circle", label: "Profile" },
  ],
  user: [
    { href: ROUTES.USER.DASHBOARD, icon: "fa-home", label: "Dashboard" },
    { href: ROUTES.PUBLIC.PERFORMANCES, icon: "fa-music", label: "Performances" },
    { href: ROUTES.USER.BOOKINGS, icon: "fa-ticket-alt", label: "My Bookings" },
    { href: ROUTES.USER.PROFILE, icon: "fa-user-circle", label: "My Profile" },
  ],
};

const DROPDOWN_MENU_ITEMS = {
  admin: [
    { href: ROUTES.ADMIN.DASHBOARD, icon: "fa-tachometer-alt", label: "Admin Dashboard", color: "indigo" },
    { href: ROUTES.USER.PROFILE, icon: "fa-user-circle", label: "Profile", color: "indigo" },
    { href: ROUTES.ADMIN.SETTINGS, icon: "fa-cog", label: "Settings", color: "indigo" },
  ],
  user: [
    { href: ROUTES.USER.DASHBOARD, icon: "fa-home", label: "Dashboard", color: "indigo" },
    { href: ROUTES.USER.PROFILE, icon: "fa-user-circle", label: "Profile", color: "indigo" },
    { href: ROUTES.USER.BOOKINGS, icon: "fa-ticket-alt", label: "My Bookings", color: "indigo" },
  ],
};

// Notifications are now managed by notificationService
// No more hardcoded notifications!

export const Navbar = {
  render() {
    return `
      <nav class="bg-indigo-700 text-white shadow-lg border-b-4 border-indigo-900 sticky top-0 z-50">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <button id="mobileSidebarToggle" class="md:hidden flex items-center mr-3 text-white">
                <i class="fas fa-bars text-xl"></i>
              </button>
              <a href="${ROUTES.HOME}" data-link class="flex-shrink-0 flex items-center">
                <i class="fas fa-music text-yellow-300 mr-2 text-2xl"></i>
                <span class="text-xl font-bold hidden lg:inline">Western Orchestral Music</span>
                <span class="text-xl font-bold lg:hidden">WOM</span>
              </a>
              <div class="hidden md:flex items-center ml-6 text-sm">
                <span class="text-gray-300 mx-2">/</span>
                <span id="breadcrumb"></span>
              </div>
            </div>
            <div class="flex items-center space-x-4">
              <div class="hidden sm:flex items-center mr-4">
                <i class="fas fa-calendar text-indigo-300 mr-2"></i>
                <span id="currentDate" class="text-sm text-indigo-200"></span>
              </div>
              <div class="relative" id="notificationsContainer"></div>
              <div id="userSection"></div>
            </div>
          </div>
        </div>
      </nav>
      ${this.renderMobileSidebar()}
    `;
  },

  renderMobileSidebar() {
    return `
      <div class="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 hidden mobile-sidebar-overlay"></div>
      <div class="fixed inset-y-0 left-0 max-w-xs w-full bg-indigo-800 overflow-y-auto z-50 transform -translate-x-full transition-transform duration-300 ease-in-out mobile-sidebar">
        <div class="p-6 flex flex-col h-full">
          <div class="flex items-center justify-between mb-8">
            <div class="flex items-center">
              <i class="fas fa-music text-yellow-300 mr-2 text-2xl"></i>
              <span class="text-xl font-bold text-white">WOM</span>
            </div>
            <button class="text-white focus:outline-none" id="closeSidebar">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <div id="mobileSidebarContent"></div>
          <div class="mt-auto text-center text-xs text-indigo-300 py-4">
            <p>Western Orchestral Music Performance &copy; 2025</p>
            <p class="mt-1">Version 1.0.0</p>
          </div>
        </div>
      </div>
    `;
  },

  renderUserSection(role, username, profileImage = null) {
    if (!role || !username) {
      return `
        <a href="${ROUTES.AUTH.LOGIN}" data-link class="flex items-center bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded shadow transition duration-150">
          <i class="fas fa-sign-in-alt mr-2"></i>
          <span>Login</span>
        </a>
      `;
    }

    const roleInfo = role === "admin"
      ? { label: "Administrator", icon: "fa-shield-alt", color: "purple" }
      : { label: "User", icon: "fa-user", color: "blue" };
    const menuItems = (DROPDOWN_MENU_ITEMS[role] || [])
      .map(item => `
        <a href="${item.href}" data-link class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
          <i class="fas ${item.icon} mr-2 text-${item.color}-600"></i> ${item.label}
        </a>
      `)
      .join("");

    // Use Avatar component for navbar button
    const navbarAvatar = Avatar.render({
      src: profileImage,
      name: username,
      size: "xs",
      rounded: "full",
      className: "navbar-avatar"
    });

    // Use Avatar component for dropdown header
    const dropdownAvatar = Avatar.render({
      src: profileImage,
      name: username,
      size: "sm",
      rounded: "full"
    });

    return `
      <div class="relative dropdown">
        <button id="userDropdownBtn" class="flex items-center space-x-2 text-sm focus:outline-none hover:bg-indigo-800 px-3 py-2 rounded-lg transition-colors">
          ${navbarAvatar}
          <div class="hidden md:block">
            <div class="text-sm font-medium">${username}</div>
            <div class="text-xs text-indigo-200 capitalize">${roleInfo.label}</div>
          </div>
          <i class="fas fa-chevron-down text-xs text-white"></i>
        </button>
        <div id="userDropdownMenu" class="absolute right-0 mt-2 ${NAVBAR_CONFIG.dropdownWidth} bg-white rounded-lg shadow-xl py-2 z-[60] hidden transform transition-all duration-300 border border-gray-200">
          <div class="px-4 py-3 border-b border-gray-100 flex items-center space-x-3">
            ${dropdownAvatar}
            <div class="flex-1">
              <div class="text-sm font-semibold text-gray-900">${username}</div>
              <div class="text-xs text-gray-500 mt-1 flex items-center">
                <i class="fas ${roleInfo.icon} text-${roleInfo.color}-600 mr-1"></i> ${roleInfo.label}
              </div>
            </div>
          </div>
          ${menuItems}
          <div class="border-t border-gray-200 my-1"></div>
          <button id="logoutBtn" class="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium flex items-center group">
            <i class="fas fa-sign-out-alt mr-2 text-red-600 group-hover:scale-110 transition-transform"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    `;
  },

  renderMobileSidebarContent(role, username, profileImage = null) {
    if (!role || !username) {
      return `
        <div class="py-3 border-t border-indigo-700">
          <a href="${ROUTES.AUTH.LOGIN}" data-link class="flex items-center py-2 px-4 text-white hover:bg-indigo-700 rounded">
            <i class="fas fa-sign-in-alt mr-3"></i>
            <span>Login</span>
          </a>
          <a href="${ROUTES.PUBLIC.PERFORMANCES}" data-link class="flex items-center py-2 px-4 text-white hover:bg-indigo-700 rounded">
            <i class="fas fa-music mr-3"></i>
            <span>Browse Performances</span>
          </a>
        </div>
      `;
    }

    const links = (NAV_LINKS[role] || [])
      .map(link => `
        <a href="${link.href}" data-link class="flex items-center py-2 px-4 text-white hover:bg-indigo-700 rounded transition-colors">
          <i class="fas ${link.icon} mr-3"></i>
          <span>${link.label}</span>
        </a>
      `)
      .join("");

    // Use Avatar component for mobile sidebar
    const sidebarAvatar = Avatar.render({
      src: profileImage,
      name: username,
      size: "lg",
      rounded: "full"
    });

    return `
      <div class="mb-6 text-center">
        <div class="flex justify-center mb-3">
          ${sidebarAvatar}
        </div>
        <div class="text-white font-medium">${username}</div>
        <div class="text-indigo-200 text-sm capitalize">${role}</div>
      </div>
      <div class="py-3 border-t border-indigo-700">
        ${links}
        <div class="border-t border-indigo-700 my-2"></div>
        <button id="sidebarLogoutBtn" class="w-full flex items-center py-2 px-4 text-red-300 hover:bg-red-900 hover:bg-opacity-20 rounded transition-colors">
          <i class="fas fa-sign-out-alt mr-3"></i>
          <span>Logout</span>
        </button>
      </div>
    `;
  },

  renderNotifications(role) {
    // Get notifications from service
    let notifications = [];
    if (role === "guest") {
      notifications = notificationService.getGuestNotifications();
    } else {
      notifications = notificationService.getNotifications();
    }

    const notificationCount = role === "guest" ? 0 : notificationService.getUnreadCount();

    return `
      <button class="p-1 text-gray-200 hover:text-white focus:outline-none" id="notificationsBtn">
        <i class="fas fa-bell"></i>
        ${notificationCount > 0 ? `<span class="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-xs rounded-full h-4 w-4 flex items-center justify-center">${notificationCount}</span>` : ""}
      </button>
      <div id="notificationsDropdown" class="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-[60] hidden">
        <div class="px-4 py-2 border-b border-gray-100">
          <div class="text-sm font-semibold text-gray-700">
            Notifications
            ${role === "guest" ? "<span class=\"text-xs text-gray-500 ml-2\">(Login to see your notifications)</span>" : ""}
          </div>
        </div>
        <div class="max-h-96 overflow-y-auto">
          ${notifications.length > 0 ? notifications.map(notif => `
            <a href="${notif.link}" data-link data-notification-id="${notif.id}" class="notification-item block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors ${notif.read ? "bg-gray-50" : "bg-white"}">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <i class="fas ${notif.icon} ${notif.iconColor} text-lg"></i>
                </div>
                <div class="ml-3 flex-1">
                  <div class="flex items-start justify-between">
                    <p class="text-sm text-gray-900 font-medium">${notif.title}</p>
                    ${!notif.read ? "<span class=\"w-2 h-2 bg-blue-500 rounded-full\"></span>" : ""}
                  </div>
                  <p class="text-xs text-gray-600 mt-0.5">${notif.message}</p>
                  <p class="text-xs text-gray-400 mt-1">
                    <i class="far fa-clock mr-1"></i>${notif.time || (notif.timestamp ? notificationService.formatTime(notif.timestamp) : "Just now")}
                  </p>
                </div>
              </div>
            </a>
          `).join("") : `
            <div class="px-4 py-8 text-center text-gray-500">
              <i class="fas fa-bell-slash text-3xl mb-2"></i>
              <p class="text-sm">No notifications</p>
            </div>
          `}
        </div>
        <div class="px-4 py-2 text-center border-t border-gray-100 flex gap-2 justify-center">
          ${role === "guest"
        ? "<a href=\"/login\" data-link class=\"text-sm text-indigo-600 hover:text-indigo-800\">Login to view all</a>"
        : `
            ${notifications.length > 0 ? "<button id=\"markAllReadBtn\" class=\"text-sm text-gray-600 hover:text-gray-800\">Mark all read</button>" : ""}
            ${role === "admin"
          ? "<a href=\"/admin/dashboard\" data-link class=\"text-sm text-indigo-600 hover:text-indigo-800\">Dashboard</a>"
          : "<a href=\"/user/dashboard\" data-link class=\"text-sm text-indigo-600 hover:text-indigo-800\">Dashboard</a>"}
          `}
        </div>
      </div>
    `;
  },

  updateBreadcrumb() {
    const currentPath = window.location.pathname;
    const metadata = getRouteMetadata(currentPath);

    if (metadata?.breadcrumb) {
      const breadcrumbHTML = metadata.breadcrumb
        .map((crumb, index) => {
          if (index === metadata.breadcrumb.length - 1 || !crumb.path) {
            return `<span class="text-white font-medium">${crumb.label}</span>`;
          }
          return `<a href="${crumb.path}" data-link class="text-gray-300 hover:text-white transition-colors">${crumb.label}</a>`;
        })
        .join("<span class=\"text-gray-300 mx-2\">/</span>");

      $("#breadcrumb").html(breadcrumbHTML);
    } else {
      $("#breadcrumb").html("");
    }
  },

  /**
   * Update avatar image dynamically
   * Call this after user updates their profile image
   */
  async updateAvatar(userId, forceRefresh = true) {
    try {
      console.log("[Navbar] Updating avatar for user:", userId);
      const profileImage = await getProfileImage(userId, forceRefresh);
      const userData = getCurrentUser();
      const role = userData?.role || "guest";
      const username = userData?.name;

      // Re-render user section with new image
      $("#userSection").html(this.renderUserSection(role, username, profileImage));
      $("#mobileSidebarContent").html(this.renderMobileSidebarContent(role, username, profileImage));

      console.log("[Navbar] Avatar updated successfully");
    } catch (error) {
      console.error("[Navbar] Failed to update avatar:", error);
    }
  },

  /**
   * Refresh navbar content (for profile updates)
   * This bypasses the initialization guard
   */
  async refresh() {
    const userData = getCurrentUser();
    const role = userData?.role || "guest";
    const username = userData?.name;
    const userId = userData?.id;

    console.log("[Navbar] Refreshing navbar for user:", userId || "guest");

    let profileImage = null;
    if (userId) {
      try {
        profileImage = await getProfileImage(userId, true); // Force refresh
        console.log("[Navbar] Profile image refreshed");
      } catch (error) {
        console.warn("[Navbar] Failed to refresh profile image:", error);
      }
    }

    $("#notificationsContainer").html(this.renderNotifications(role));
    $("#userSection").html(this.renderUserSection(role, username, profileImage));
    $("#mobileSidebarContent").html(this.renderMobileSidebarContent(role, username, profileImage));

    console.log("[Navbar] Refresh complete");
  },

  async handleLogout() {
    const userData = getCurrentUser();
    const result = await Swal.fire({
      title: "Logout Confirmation",
      html: `
        <div class="text-center">
          <div class="w-20 h-20 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <i class="fas fa-sign-out-alt text-red-600 text-3xl"></i>
          </div>
          <p class="text-gray-700 text-base">Are you sure you want to logout?</p>
          ${userData?.name ? `<p class="text-gray-500 text-sm mt-2">Logging out <strong>${userData.name}</strong></p>` : ""}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "<i class=\"fas fa-sign-out-alt mr-2\"></i>Yes, Logout",
      cancelButtonText: "<i class=\"fas fa-times mr-2\"></i>Cancel",
      confirmButtonColor: SwalColors.danger,
      cancelButtonColor: SwalColors.secondary,
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: "rounded-lg",
        confirmButton: "px-6 py-2.5 rounded-lg font-semibold",
        cancelButton: "px-6 py-2.5 rounded-lg font-semibold",
      },
    });

    if (result.isConfirmed) {
      $("#userDropdownMenu").addClass("hidden");
      $(".mobile-sidebar").removeClass("translate-x-0").addClass("-translate-x-full");
      $(".mobile-sidebar-overlay").addClass("hidden");

      await Swal.fire({
        title: "Logging Out...",
        html: "<div class=\"text-center\"><i class=\"fas fa-spinner fa-spin text-4xl text-indigo-600\"></i><p class=\"mt-4 text-gray-600\">Please wait</p></div>",
        showConfirmButton: false,
        allowOutsideClick: false,
        timer: 800,
      });

      isInitialized = false;
      currentUserId = null;

      await logout();

      setTimeout(() => {
        Swal.fire({
          title: "Logged Out Successfully",
          text: "You have been logged out. See you again soon!",
          icon: "success",
          confirmButtonText: "OK",
          confirmButtonColor: SwalColors.success,
          timer: 2000,
          timerProgressBar: true,
        });
      }, 100);
    }
  },

  async init() {
    const userData = getCurrentUser();
    const role = userData?.role || "guest";
    const username = userData?.name;
    const userId = userData?.id;

    // Check if user has changed (guest -> logged in, or different user)
    const userChanged = currentUserId !== userId;

    // Prevent duplicate initialization for the same user
    // Allow re-initialization if user changed or if guest
    if (isInitialized && !userChanged && userId) {
      console.log("[Navbar] Already initialized for same user, skipping");
      return;
    }

    if (userChanged) {
      console.log("[Navbar] User changed from", currentUserId || "guest", "to", userId || "guest");
    }

    console.log("[Navbar] Initializing for user:", userId || "guest");
    isInitialized = true;
    currentUserId = userId;

    const profileImage = userData?.profileImage || null;

    this.updateBreadcrumb();
    $("#notificationsContainer").html(this.renderNotifications(role));
    $("#userSection").html(this.renderUserSection(role, username, profileImage));
    $("#mobileSidebarContent").html(this.renderMobileSidebarContent(role, username, profileImage));
    $("#currentDate").text(dayjs().format(NAVBAR_CONFIG.dateFormat));

    window.addEventListener("popstate", () => this.updateBreadcrumb());

    $(document).off("click", "#mobileSidebarToggle").on("click", "#mobileSidebarToggle", (e) => {
      e.preventDefault();
      $(".mobile-sidebar").removeClass("-translate-x-full").addClass("translate-x-0");
      $(".mobile-sidebar-overlay").removeClass("hidden");
    });

    $(document).off("click", ".mobile-sidebar-overlay").on("click", ".mobile-sidebar-overlay", () => {
      $(".mobile-sidebar").removeClass("translate-x-0").addClass("-translate-x-full");
      $(".mobile-sidebar-overlay").addClass("hidden");
    });

    $(document).off("click", "#closeSidebar").on("click", "#closeSidebar", (e) => {
      e.preventDefault();
      $(".mobile-sidebar").removeClass("translate-x-0").addClass("-translate-x-full");
      $(".mobile-sidebar-overlay").addClass("hidden");
    });

    $(document).off("click", "#userDropdownBtn").on("click", "#userDropdownBtn", (e) => {
      e.stopPropagation();
      $("#userDropdownMenu").toggleClass("hidden");
      $("#notificationsDropdown").addClass("hidden");
    });

    $(document).off("click", "#notificationsBtn").on("click", "#notificationsBtn", (e) => {
      e.stopPropagation();
      $("#notificationsDropdown").toggleClass("hidden");
      $("#userDropdownMenu").addClass("hidden");
    });

    $(document).off("click.closeDropdowns").on("click.closeDropdowns", (e) => {
      if (!$(e.target).closest("#userDropdownBtn, #notificationsBtn, #userDropdownMenu, #notificationsDropdown").length) {
        $("#userDropdownMenu").addClass("hidden");
        $("#notificationsDropdown").addClass("hidden");
      }
    });

    $(document).off("click", "#userDropdownMenu, #notificationsDropdown").on("click", "#userDropdownMenu, #notificationsDropdown", (e) => {
      e.stopPropagation();
    });

    $(document).off("click", "#logoutBtn, #sidebarLogoutBtn").on("click", "#logoutBtn, #sidebarLogoutBtn", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleLogout();
    });

    // Notification event listeners
    $(document).off("click", ".notification-item").on("click", ".notification-item", function () {
      const notificationId = $(this).data("notification-id");
      if (notificationId && notificationId !== "guest-1" && notificationId !== "guest-2" && notificationId !== "guest-3") {
        notificationService.markAsRead(notificationId);
      }
    });

    $(document).off("click", "#markAllReadBtn").on("click", "#markAllReadBtn", (e) => {
      e.preventDefault();
      e.stopPropagation();
      notificationService.markAllAsRead();
      // Re-render notifications
      const userData = getCurrentUser();
      const role = userData?.role || "guest";
      $("#notificationsContainer").html(this.renderNotifications(role));
    });
  },
};

export function renderNavbar() {
  isInitialized = false;
  currentUserId = null;
  return Navbar.render();
}

export function initNavbar() {
  Navbar.init();
}

export async function refreshNavbar() {
  await Navbar.refresh();
}

export async function updateNavbarAvatar(userId) {
  await Navbar.updateAvatar(userId);
}
