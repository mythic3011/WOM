
import Swal from "sweetalert2";

import { CONTACT_INFO } from "@config/config.js";
import { ROUTES } from "@config/routes.js";
import { SwalColors } from "@utils/colors.js";
import { getCurrentUser, logout } from "@utils/core/auth.js";

const FOOTER_CONFIG = {
    appName: "Western Orchestral Music Performance",
    copyrightYear: new Date().getFullYear(),
};

const FOOTER_LINKS = {
    admin: [
        { href: ROUTES.ADMIN.DASHBOARD, icon: "fa-tachometer-alt", label: "Admin Dashboard" },
        { href: ROUTES.PUBLIC.PERFORMANCES, icon: "fa-music", label: "Performances" },
        { href: ROUTES.ADMIN.USERS, icon: "fa-users-cog", label: "User Management" },
        { href: ROUTES.ADMIN.BOOKINGS, icon: "fa-clipboard-list", label: "Bookings" },
        { href: ROUTES.ADMIN.SEAT_MANAGEMENT, icon: "fa-chair", label: "Seat Management" },
        { href: ROUTES.PUBLIC.DEV_TOOLS, icon: "fa-code", label: "Dev Tools" },
    ],
    user: [
        { href: ROUTES.USER.DASHBOARD, icon: "fa-home", label: "Dashboard" },
        { href: ROUTES.PUBLIC.PERFORMANCES, icon: "fa-music", label: "Browse Performances" },
        { href: ROUTES.USER.BOOKINGS, icon: "fa-calendar-check", label: "My Bookings" },
        { href: ROUTES.USER.PROFILE, icon: "fa-user", label: "My Profile" },
    ],
    guest: [
        { href: ROUTES.PUBLIC.PERFORMANCES, icon: "fa-music", label: "Performances" },
        { href: ROUTES.AUTH.LOGIN, icon: "fa-sign-in-alt", label: "Login" },
        { href: ROUTES.AUTH.REGISTER, icon: "fa-user-plus", label: "Register" },
        { href: ROUTES.PUBLIC.DEV_TOOLS, icon: "fa-code", label: "Dev Tools" },
    ],
};

const ROLE_CONFIG = {
    admin: { label: "Admin", color: "bg-blue-600" },
    user: { label: "User", color: "bg-green-600" },
};

export const Footer = {
    render() {
        return `
      <footer class="bg-gray-800 text-white py-8 mt-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h2 class="font-bold text-2xl flex items-center">
                <i class="fas fa-music text-yellow-400 mr-2"></i> Western Orchestral Music Performance
              </h2>
              <p class="text-gray-400 mt-2">
                The Western Orchestral Music Performance Seat Booking System provides a seamless platform for music enthusiasts to browse and book seats for orchestral performances. Our system aims to streamline the booking process and enhance the concert-going experience.
              </p>
              <div id="userRoleBadge" class="mt-4"></div>
            </div>

            <div>
              <h3 class="font-semibold text-lg border-b border-gray-600 pb-2 mb-3">Quick Links</h3>
              <ul id="quickLinks" class="space-y-2"></ul>
            </div>

            <div>
              <h3 class="font-semibold text-lg border-b border-gray-600 pb-2 mb-3">Contact</h3>
              <div class="space-y-3 text-gray-400 text-sm">
                <p class="text-xs text-gray-500 mb-2">
                  You can contact us directly during our office hours, which are Monday to Friday (except public holidays).
                </p>
                <div class="flex items-start">
                  <i class="fas fa-map-marker-alt mt-1 mr-2 w-5 text-center text-indigo-400"></i>
                  <div>
                    <p>${CONTACT_INFO.address.line1}</p>
                    <p>${CONTACT_INFO.address.line2}</p>
                    <p>${CONTACT_INFO.address.line3}</p>
                  </div>
                </div>
                <div class="flex items-center">
                  <i class="fas fa-phone mr-2 w-5 text-center text-indigo-400"></i>
                  <a href="${CONTACT_INFO.phone.link}" class="hover:text-white transition-colors">${CONTACT_INFO.phone.number}</a>
                </div>
                <div class="flex items-center">
                  <i class="fas fa-envelope mr-2 w-5 text-center text-indigo-400"></i>
                  <a href="${CONTACT_INFO.email.link}" class="hover:text-white transition-colors">${CONTACT_INFO.email.address}</a>
                </div>
                <div class="flex items-start">
                  <i class="fas fa-clock mt-1 mr-2 w-5 text-center text-indigo-400"></i>
                  <div>
                    <p class="font-semibold text-white mb-1">Visit our service centre:</p>
                    <p>${CONTACT_INFO.hours.visitCenter}</p>
                    <p class="font-semibold text-white mt-2 mb-1">Call our enquiry hotline:</p>
                    <p>${CONTACT_INFO.hours.hotline}</p>
                  </div>
                </div>
              </div>
              <div id="logoutSection" class="mt-4"></div>
            </div>
          </div>

          <div class="border-t border-gray-700 mt-8 pt-6">
            <div class="flex flex-col md:flex-row justify-between items-center">
              <p class="text-gray-400 mb-4 md:mb-0">
                &copy; ${FOOTER_CONFIG.copyrightYear} ${FOOTER_CONFIG.appName}. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    `;
    },

    renderUserRoleBadge(role, username) {
        const roleConfig = ROLE_CONFIG[role] || { label: role, color: "bg-gray-600" };
        return `
      <div class="bg-gray-700 bg-opacity-50 rounded-lg p-3 inline-flex items-center">
        <span class="px-2 py-1 ${roleConfig.color} text-xs text-white rounded mr-2">${roleConfig.label}</span>
        <span class="text-gray-300 text-sm">Logged in as: ${username}</span>
      </div>
    `;
    },

    renderQuickLinks(role) {
        const links = FOOTER_LINKS[role] || FOOTER_LINKS.guest;
        return links
            .map(link => `
        <li>
          <a href="${link.href}" data-link class="text-gray-400 hover:text-white transition-colors duration-200">
            <i class="fas ${link.icon} mr-2"></i> ${link.label}
          </a>
        </li>
      `)
            .join("");
    },

    renderLogoutButton() {
        return `
      <button id="footerLogoutBtn" class="text-sm bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition-colors duration-200 flex items-center group">
        <i class="fas fa-sign-out-alt mr-2 group-hover:scale-110 transition-transform"></i>
        <span>Logout</span>
      </button>
    `;
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
            await Swal.fire({
                title: "Logging Out...",
                html: "<div class=\"text-center\"><i class=\"fas fa-spinner fa-spin text-4xl text-indigo-600\"></i><p class=\"mt-4 text-gray-600\">Please wait</p></div>",
                showConfirmButton: false,
                allowOutsideClick: false,
                timer: 800,
            });

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

    init() {
        const userData = getCurrentUser();
        const role = userData?.role;
        const username = userData?.name;

        if (role && username) {
            $("#userRoleBadge").html(this.renderUserRoleBadge(role, username));
            $("#quickLinks").html(this.renderQuickLinks(role));
            $("#logoutSection").html(this.renderLogoutButton());

            $(document).off("click", "#footerLogoutBtn").on("click", "#footerLogoutBtn", async (e) => {
                e.preventDefault();
                await this.handleLogout();
            });
        } else {
            $("#quickLinks").html(this.renderQuickLinks("guest"));
            $("#userRoleBadge").html("");
            $("#logoutSection").html("");
        }
    },
};

export function renderFooter() {
    return Footer.render();
}

export function initFooter() {
    Footer.init();
}
