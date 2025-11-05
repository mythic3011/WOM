import { storage } from "/src/services/storageService.js";
import { navigate } from "/src/utils/core/navigation.js";
import { ROUTES } from "/src/config/routes.js";

export function renderFooter() {
  return `
<footer class="bg-gray-800 text-white py-8 mt-10">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div>
        <h2 class="font-bold text-2xl flex items-center">
          <i class="fas fa-music text-yellow-400 mr-2"></i> Western Orchestral
          Music Performance
        </h2>
        <p class="text-gray-400 mt-2">
          The Western Orchestral Music Performance Seat Booking System provides
          a seamless platform for music enthusiasts to browse and book seats for
          orchestral performances. Our system aims to streamline the booking
          process and enhance the concert-going experience.
        </p>
        <div id="userRoleBadge" class="mt-4"></div>
      </div>

      <div>
        <h3 class="font-semibold text-lg border-b border-gray-600 pb-2 mb-3">
          Quick Links
        </h3>
        <ul id="quickLinks" class="space-y-2"></ul>
      </div>

      <div>
        <h3 class="font-semibold text-lg border-b border-gray-600 pb-2 mb-3">
          Contact
        </h3>
        <div class="space-y-3 text-gray-400 text-sm">
          <p class="text-xs text-gray-500 mb-2">
            You can contact us directly during our office hours, which are
            Monday to Friday (except public holidays).
          </p>
          <div class="flex items-start">
            <i
              class="fas fa-map-marker-alt mt-1 mr-2 w-5 text-center text-indigo-400"
            ></i>
            <div>
              <p>Room M101, 1/F</p>
              <p>Li Ka Shing Tower (Block M)</p>
              <p>The Hong Kong Polytechnic University</p>
            </div>
          </div>
          <div class="flex items-center">
            <i class="fas fa-phone mr-2 w-5 text-center text-indigo-400"></i>
            <a
              href="tel:+85223330600"
              class="hover:text-white transition-colors"
            >
              +852 2333 0600
            </a>
          </div>
          <div class="flex items-center">
            <i class="fas fa-envelope mr-2 w-5 text-center text-indigo-400"></i>
            <a
              href="mailto:ar.jupas@polyu.edu.hk"
              class="hover:text-white transition-colors"
            >
              ar.jupas@polyu.edu.hk
            </a>
          </div>
          <div class="flex items-start">
            <i
              class="fas fa-clock mt-1 mr-2 w-5 text-center text-indigo-400"
            ></i>
            <div>
              <p class="font-semibold text-white mb-1">
                Visit our service centre:
              </p>
              <p>9am-1pm & 2pm-7pm</p>
              <p class="font-semibold text-white mt-2 mb-1">
                Call our enquiry hotline:
              </p>
              <p>9am-1pm & 2pm-5.35pm</p>
            </div>
          </div>
        </div>

        <div id="logoutSection" class="mt-4"></div>
      </div>
    </div>

    <div class="border-t border-gray-700 mt-8 pt-6">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <p class="text-gray-400 mb-4 md:mb-0">
          &copy; <span id="currentYear"></span> Western Orchestral Music
          Performance. All rights reserved.
        </p>
        <div class="flex text-sm text-gray-500 space-x-6">
          <a href="#" class="hover:text-gray-300 transition-colors duration-200"
            >Privacy Policy</a
          >
          <a href="#" class="hover:text-gray-300 transition-colors duration-200"
            >Terms of Service</a
          >
          <a href="#" class="hover:text-gray-300 transition-colors duration-200"
            >Contact Us</a
          >
        </div>
      </div>
    </div>
  </div>
</footer>
  `;
}

export function initFooter() {
  const userData = storage.getUser();
  const role = userData?.role;
  const username = userData?.name;

  $("#currentYear").text(new Date().getFullYear());

  if (role && username) {
    let badgeColor = "bg-blue-600";
    let roleLabel = role;

    if (role === "admin") {
      badgeColor = "bg-blue-600";
      roleLabel = "Admin";
    } else if (role === "user") {
      badgeColor = "bg-green-600";
      roleLabel = "User";
    }

    $("#userRoleBadge").html(`
      <div class="bg-gray-700 bg-opacity-50 rounded-lg p-3 inline-flex items-center">
        <span class="px-2 py-1 ${badgeColor} text-xs text-white rounded mr-2">${roleLabel}</span>
        <span class="text-gray-300 text-sm">Logged in as: ${username}</span>
      </div>
    `);

    const footerLinks = {
      admin: [
        {
          href: ROUTES.ADMIN.DASHBOARD,
          icon: "fa-tachometer-alt",
          label: "Admin Dashboard",
        },
        {
          href: ROUTES.PUBLIC.PERFORMANCES,
          icon: "fa-music",
          label: "Performances",
        },
        {
          href: ROUTES.ADMIN.USERS,
          icon: "fa-users-cog",
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
        { href: ROUTES.PUBLIC.DEV_TOOLS, icon: "fa-code", label: "Dev Tools" },
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
          label: "Browse Performances",
        },
        {
          href: ROUTES.USER.BOOKINGS,
          icon: "fa-calendar-check",
          label: "My Bookings",
        },
        {
          href: ROUTES.USER.PROFILE,
          icon: "fa-user",
          label: "My Profile",
        },
      ],
    };

    let links = "";
    if (footerLinks[role]) {
      links = footerLinks[role]
        .map(
          (link) => `
        <li>
          <a href="${link.href}" data-link class="text-gray-400 hover:text-white transition-colors duration-200">
            <i class="fas ${link.icon} mr-2"></i> ${link.label}
          </a>
        </li>
      `
        )
        .join("");
    }

    $("#quickLinks").html(links);

    $("#logoutSection").html(`
      <button id="footerLogoutBtn" class="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition-colors duration-200 flex items-center">
        <i class="fas fa-sign-out-alt mr-1"></i> Logout
      </button>
    `);

    $(document)
      .off("click", "#footerLogoutBtn")
      .on("click", "#footerLogoutBtn", function (e) {
        e.preventDefault();
        if (confirm("Are you sure you want to logout?")) {
          storage.clearUser();
          navigate(ROUTES.AUTH.LOGIN);
        }
      });
  } else {
    $("#quickLinks").html(`
      <li>
        <a href="${ROUTES.PUBLIC.PERFORMANCES}" data-link class="text-gray-400 hover:text-white transition-colors duration-200">
          <i class="fas fa-music mr-2"></i> Performances
        </a>
      </li>
      <li>
        <a href="${ROUTES.AUTH.LOGIN}" data-link class="text-gray-400 hover:text-white transition-colors duration-200">
          <i class="fas fa-sign-in-alt mr-2"></i> Login
        </a>
      </li>
      <li>
        <a href="${ROUTES.AUTH.REGISTER}" data-link class="text-gray-400 hover:text-white transition-colors duration-200">
          <i class="fas fa-user-plus mr-2"></i> Register
        </a>
      </li>
      <li>
        <a href="${ROUTES.PUBLIC.DEV_TOOLS}" data-link class="text-gray-400 hover:text-white transition-colors duration-200">
          <i class="fas fa-code mr-2"></i> Dev Tools
        </a>
      </li>
    `);
  }
}
