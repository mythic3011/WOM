import { storage } from "/src/services/storageService.js";
import { navigate } from "/src/utils/core/navigation.js";
import { ROUTES, getRouteMetadata } from "/src/config/routes.js";
import dayjs from "dayjs";

export function renderNavbar() {
  return `
<nav class="bg-indigo-700 text-white shadow-lg border-b-4 border-indigo-900">
  <div class="container mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between h-16">
      <div class="flex items-center">
        <button
          id="mobileSidebarToggle"
          class="md:hidden flex items-center mr-3 text-white"
        >
          <i class="fas fa-bars text-xl"></i>
        </button>
        <a href="${ROUTES.HOME}" data-link class="flex-shrink-0 flex items-center">
          <i class="fas fa-music text-yellow-300 mr-2 text-2xl"></i>
          <span class="text-xl font-bold hidden lg:inline"
            >Western Orchestral Music</span
          >
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

<div
  class="fixed inset-0 bg-gray-900 bg-opacity-50 z-40 hidden mobile-sidebar-overlay"
></div>
<div
  class="fixed inset-y-0 left-0 max-w-xs w-full bg-indigo-800 overflow-y-auto z-50 transform -translate-x-full transition-transform duration-300 ease-in-out mobile-sidebar"
>
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
}

export function initNavbar() {
  const userData = storage.getUser();
  const role = userData?.role || "guest";
  const username = userData?.name;

  updateBreadcrumb();
  renderNotifications(role);
  renderUserSection(role, username);
  renderMobileSidebar(role, username);
  updateCurrentDate();

  window.addEventListener("popstate", updateBreadcrumb);

  $(document)
    .off("click", "#mobileSidebarToggle")
    .on("click", "#mobileSidebarToggle", function (e) {
      e.preventDefault();
      $(".mobile-sidebar")
        .removeClass("-translate-x-full")
        .addClass("translate-x-0");
      $(".mobile-sidebar-overlay").removeClass("hidden");
    });

  $(document)
    .off("click", ".mobile-sidebar-overlay")
    .on("click", ".mobile-sidebar-overlay", function () {
      $(".mobile-sidebar")
        .removeClass("translate-x-0")
        .addClass("-translate-x-full");
      $(this).addClass("hidden");
    });

  $(document)
    .off("click", "#closeSidebar")
    .on("click", "#closeSidebar", function (e) {
      e.preventDefault();
      $(".mobile-sidebar")
        .removeClass("translate-x-0")
        .addClass("-translate-x-full");
      $(".mobile-sidebar-overlay").addClass("hidden");
    });

  $(document)
    .off("click", "#userDropdownBtn")
    .on("click", "#userDropdownBtn", function (e) {
      e.stopPropagation();
      $("#userDropdownMenu").toggleClass("hidden");
      $("#notificationsDropdown").addClass("hidden");
    });

  $(document)
    .off("click", "#notificationsBtn")
    .on("click", "#notificationsBtn", function (e) {
      e.stopPropagation();
      $("#notificationsDropdown").toggleClass("hidden");
      $("#userDropdownMenu").addClass("hidden");
    });

  $(document)
    .off("click.closeDropdowns")
    .on("click.closeDropdowns", function (e) {
      if (
        !$(e.target).closest(
          "#userDropdownBtn, #notificationsBtn, #userDropdownMenu, #notificationsDropdown"
        ).length
      ) {
        $("#userDropdownMenu").addClass("hidden");
        $("#notificationsDropdown").addClass("hidden");
      }
    });

  $(document)
    .off("click", "#userDropdownMenu, #notificationsDropdown")
    .on("click", "#userDropdownMenu, #notificationsDropdown", function (e) {
      e.stopPropagation();
    });
}

function updateBreadcrumb() {
  const currentPath = window.location.pathname;
  const metadata = getRouteMetadata(currentPath);

  if (metadata && metadata.breadcrumb) {
    const breadcrumbHTML = metadata.breadcrumb
      .map((crumb, index) => {
        if (index === metadata.breadcrumb.length - 1 || !crumb.path) {
          return `<span class="text-white font-medium">${crumb.label}</span>`;
        }
        return `<a href="${crumb.path}" data-link class="text-gray-300 hover:text-white transition-colors">${crumb.label}</a>`;
      })
      .join('<span class="text-gray-300 mx-2">/</span>');

    $("#breadcrumb").html(breadcrumbHTML);
  } else {
    $("#breadcrumb").html("");
  }
}

function renderUserSection(role, username) {
  if (role && username) {
    const initial = username.charAt(0).toUpperCase();

    let menuItems = "";

    if (role === "admin") {
      menuItems = `
        <a
          href="${ROUTES.ADMIN.DASHBOARD}" data-link
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <i class="fas fa-tachometer-alt mr-2 text-indigo-600"></i> Admin Dashboard
        </a>
        <a
          href="${ROUTES.USER.PROFILE}" data-link
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <i class="fas fa-user-circle mr-2 text-indigo-600"></i> Profile
        </a>
        <a
          href="${ROUTES.ADMIN.SETTINGS}" data-link
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <i class="fas fa-cog mr-2 text-indigo-600"></i> Settings
        </a>
      `;
    } else {
      menuItems = `
        <a
          href="${ROUTES.USER.DASHBOARD}" data-link
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <i class="fas fa-home mr-2 text-indigo-600"></i> Dashboard
        </a>
        <a
          href="${ROUTES.USER.PROFILE}" data-link
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <i class="fas fa-user-circle mr-2 text-indigo-600"></i> Profile
        </a>
        <a
          href="${ROUTES.USER.BOOKINGS}" data-link
          class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <i class="fas fa-ticket-alt mr-2 text-indigo-600"></i> My Bookings
        </a>
      `;
    }

    $("#userSection").html(`
      <div class="relative dropdown">
        <button
          id="userDropdownBtn"
          class="flex items-center space-x-2 text-sm focus:outline-none hover:bg-indigo-800 px-3 py-2 rounded-lg transition-colors"
        >
          <div
            class="w-8 h-8 bg-white rounded-full flex items-center justify-center text-indigo-700 font-bold"
          >
            ${initial}
          </div>
          <div class="hidden md:block">
            <div class="text-sm font-medium">${username}</div>
            <div class="text-xs text-indigo-200 capitalize">
              ${role === "admin" ? "Administrator" : "User"}
            </div>
          </div>
          <i class="fas fa-chevron-down text-xs text-white"></i>
        </button>

        <div
          id="userDropdownMenu"
          class="absolute right-0 mt-2 w-60 bg-white rounded-lg shadow-xl py-2 z-10 hidden transform transition-all duration-300 border border-gray-200"
        >
          <div class="px-4 py-3 border-b border-gray-100">
            <div class="text-sm font-semibold text-gray-900">
              ${username}
            </div>
            <div class="text-xs text-gray-500 mt-1 flex items-center">
              ${
                role === "admin"
                  ? '<i class="fas fa-shield-alt text-purple-600 mr-1"></i> Administrator'
                  : '<i class="fas fa-user text-blue-600 mr-1"></i> User'
              }
            </div>
          </div>
          ${menuItems}
          <div class="border-t border-gray-200 my-1"></div>
          <button
            id="logoutBtn"
            class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <i class="fas fa-sign-out-alt mr-2 text-red-600"></i> Logout
          </button>
        </div>
      </div>
    `);

    $(document)
      .off("click", "#logoutBtn")
      .on("click", "#logoutBtn", function (e) {
        e.preventDefault();
        if (confirm("Are you sure you want to logout?")) {
          storage.clearUser();
          navigate(ROUTES.AUTH.LOGIN);
        }
      });

    $(document)
      .off("click", "#sidebarLogoutBtn")
      .on("click", "#sidebarLogoutBtn", function (e) {
        e.preventDefault();
        if (confirm("Are you sure you want to logout?")) {
          storage.clearUser();
          navigate(ROUTES.AUTH.LOGIN);
        }
      });
  } else {
    $("#userSection").html(`
      <a
        href="${ROUTES.AUTH.LOGIN}" data-link
        class="flex items-center bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded shadow transition duration-150"
      >
        <i class="fas fa-sign-in-alt mr-2"></i>
        <span>Login</span>
      </a>
    `);
  }
}

function renderMobileSidebar(role, username) {
  if (role && username) {
    const initial = username.charAt(0).toUpperCase();
    let links = "";

    const navLinks = {
      admin: [
        {
          href: ROUTES.ADMIN.DASHBOARD,
          icon: "fa-tachometer-alt",
          label: "Dashboard",
        },
        {
          href: ROUTES.PUBLIC.PERFORMANCES,
          icon: "fa-music",
          label: "Browse Performances",
        },
        {
          href: ROUTES.ADMIN.PERFORMANCES,
          icon: "fa-music",
          label: "Manage Performances",
        },
        {
          href: ROUTES.ADMIN.VENUES,
          icon: "fa-building",
          label: "Venues",
        },
        {
          href: ROUTES.ADMIN.USERS,
          icon: "fa-users",
          label: "User Management",
        },
        {
          href: ROUTES.ADMIN.BOOKINGS,
          icon: "fa-clipboard-list",
          label: "Bookings",
        },
        {
          href: ROUTES.ADMIN.SEAT_MANAGEMENT,
          icon: "fa-chair",
          label: "Seat Management",
        },
        {
          href: ROUTES.ADMIN.SETTINGS,
          icon: "fa-cog",
          label: "Settings",
        },
        {
          href: ROUTES.USER.PROFILE,
          icon: "fa-user-circle",
          label: "Profile",
        },
      ],
      user: [
        {
          href: ROUTES.USER.DASHBOARD,
          icon: "fa-home",
          label: "Dashboard",
        },
        {
          href: ROUTES.PUBLIC.PERFORMANCES,
          icon: "fa-music",
          label: "Performances",
        },
        {
          href: ROUTES.USER.BOOKINGS,
          icon: "fa-ticket-alt",
          label: "My Bookings",
        },
        {
          href: ROUTES.USER.PROFILE,
          icon: "fa-user-circle",
          label: "My Profile",
        },
      ],
    };

    if (navLinks[role]) {
      links = navLinks[role]
        .map(
          (link) => `
        <a href="${link.href}" data-link class="flex items-center py-2 px-4 text-white hover:bg-indigo-700 rounded transition-colors">
          <i class="fas ${link.icon} mr-3"></i>
          <span>${link.label}</span>
        </a>
      `
        )
        .join("");
    }

    $("#mobileSidebarContent").html(`
      <div class="mb-6 text-center">
        <div
          class="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center text-indigo-700 text-2xl mb-2"
        >
          ${initial}
        </div>
        <div class="text-white font-medium">${username}</div>
        <div class="text-indigo-200 text-sm capitalize">${role}</div>
      </div>

      <div class="py-3 border-t border-indigo-700">
        ${links}
        <div class="border-t border-indigo-700 my-2"></div>
        <button
          id="sidebarLogoutBtn"
          class="w-full flex items-center py-2 px-4 text-red-300 hover:bg-red-900 hover:bg-opacity-20 rounded transition-colors"
        >
          <i class="fas fa-sign-out-alt mr-3"></i>
          <span>Logout</span>
        </button>
      </div>
    `);
  } else {
    $("#mobileSidebarContent").html(`
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
    `);
  }
}

function updateCurrentDate() {
  $("#currentDate").text(dayjs().format("ddd, MMM D, YYYY"));
}

function renderNotifications(role) {
  const notificationsData = {
    admin: [
      {
        icon: "fa-exclamation-triangle",
        iconColor: "text-red-500",
        title: "System Alert",
        message: "5 pending bookings require approval",
        time: "5 minutes ago",
        link: ROUTES.ADMIN.BOOKINGS,
      },
      {
        icon: "fa-users",
        iconColor: "text-blue-500",
        title: "New User Registration",
        message: "3 new users registered today",
        time: "1 hour ago",
        link: ROUTES.ADMIN.USERS,
      },
      {
        icon: "fa-music",
        iconColor: "text-green-500",
        title: "Performance Update",
        message: "Symphony No. 9 is 80% sold",
        time: "2 hours ago",
        link: ROUTES.ADMIN.PERFORMANCES,
      },
      {
        icon: "fa-chart-line",
        iconColor: "text-purple-500",
        title: "Revenue Milestone",
        message: "Monthly target achieved",
        time: "5 hours ago",
        link: ROUTES.ADMIN.DASHBOARD,
      },
    ],
    user: [
      {
        icon: "fa-ticket-alt",
        iconColor: "text-blue-500",
        title: "Booking Confirmed",
        message: "Symphony No. 9 - Seat A12",
        time: "10 minutes ago",
        link: ROUTES.USER.BOOKINGS,
      },
      {
        icon: "fa-bell",
        iconColor: "text-orange-500",
        title: "Performance Reminder",
        message: "Your show starts tomorrow at 7:30 PM",
        time: "2 hours ago",
        link: ROUTES.USER.BOOKINGS,
      },
      {
        icon: "fa-music",
        iconColor: "text-green-500",
        title: "New Performance Available",
        message: "Beethoven's 5th - Early bird tickets",
        time: "1 day ago",
        link: ROUTES.PUBLIC.PERFORMANCES,
      },
    ],
    guest: [
      {
        icon: "fa-star",
        iconColor: "text-yellow-500",
        title: "Welcome to WOM",
        message: "Sign up to book your first performance",
        time: "Just now",
        link: ROUTES.AUTH.REGISTER,
      },
      {
        icon: "fa-music",
        iconColor: "text-indigo-500",
        title: "Featured This Month",
        message: "Mozart's Requiem - Now on sale",
        time: "1 hour ago",
        link: ROUTES.PUBLIC.PERFORMANCES,
      },
      {
        icon: "fa-calendar",
        iconColor: "text-blue-500",
        title: "Upcoming Events",
        message: "10 performances scheduled this month",
        time: "2 hours ago",
        link: ROUTES.PUBLIC.PERFORMANCES,
      },
    ],
  };

  const notifications = notificationsData[role] || notificationsData.guest;
  const notificationCount = notifications.length;

  const notificationsHTML = `
    <button
      class="p-1 text-gray-200 hover:text-white focus:outline-none"
      id="notificationsBtn"
    >
      <i class="fas fa-bell"></i>
      ${
        notificationCount > 0
          ? `<span class="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-xs rounded-full h-4 w-4 flex items-center justify-center">${notificationCount}</span>`
          : ""
      }
    </button>
    <div
      id="notificationsDropdown"
      class="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-10 hidden"
    >
      <div class="px-4 py-2 border-b border-gray-100">
        <div class="text-sm font-semibold text-gray-700">
          Notifications
          ${
            role === "guest"
              ? '<span class="text-xs text-gray-500 ml-2">(Login to see your notifications)</span>'
              : ""
          }
        </div>
      </div>
      <div class="max-h-96 overflow-y-auto">
        ${notifications
          .map(
            (notif) => `
          <a
            href="${notif.link}" data-link
            class="block px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors"
          >
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <i class="fas ${notif.icon} ${notif.iconColor} text-lg"></i>
              </div>
              <div class="ml-3 flex-1">
                <p class="text-sm text-gray-900 font-medium">
                  ${notif.title}
                </p>
                <p class="text-xs text-gray-600 mt-0.5">
                  ${notif.message}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  <i class="far fa-clock mr-1"></i>${notif.time}
                </p>
              </div>
            </div>
          </a>
        `
          )
          .join("")}
      </div>
      <div class="px-4 py-2 text-center border-t border-gray-100">
        ${
          role === "guest"
            ? '<a href="/login" data-link class="text-sm text-indigo-600 hover:text-indigo-800">Login to view all</a>'
            : role === "admin"
            ? '<a href="/admin/dashboard" data-link class="text-sm text-indigo-600 hover:text-indigo-800">View Dashboard</a>'
            : '<a href="/user/dashboard" data-link class="text-sm text-indigo-600 hover:text-indigo-800">View all notifications</a>'
        }
      </div>
    </div>
  `;

  $("#notificationsContainer").html(notificationsHTML);
}
