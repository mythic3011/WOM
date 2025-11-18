import { getCurrentUser } from "@utils/core/auth.js";
import { FormComponents } from "@components/FormComponents.js";
import { createEmptyState } from "@components/EmptyState.js";
import { createLoadingState } from "@components/LoadingState.js";
import { BookingCard } from "@components/BookingCard.js";
import { bookingService } from "@services/bookingService.js";
import { performanceService } from "@services/performanceService.js";
import { handleApiError } from "@services/apiClient.js";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default {
  title: "Dashboard | User",

  async render() {
    return `
      <main class="container mx-auto px-4 py-8">
        <div class="max-w-7xl mx-auto">
          <div id="dashboardContent">
            ${createLoadingState({ message: "Loading dashboard..." })}
          </div>
        </div>
      </main>
    `;
  },

  async afterRender() {
    await this.loadDashboard();
  },

  async loadDashboard() {
    try {
      const user = getCurrentUser();

      const [bookingStats, upcomingPerformances] = await Promise.all([
        bookingService.getUserStats(user?.id),
        performanceService.getUpcoming(),
      ]);

      const content = `
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-bold text-gray-900">
              <i class="fas fa-home text-indigo-600 mr-3"></i>
              Welcome back, ${user?.name || "User"}!
            </h1>
            <p class="text-gray-600 mt-2">Here's your booking activity and upcoming performances</p>
          </div>
          <div class="hidden md:block">
            <div class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg shadow-lg">
              <p class="text-sm opacity-90">Member Since</p>
              <p class="text-lg font-bold">${dayjs(
        user?.createdAt || new Date()
      ).format("MMM YYYY")}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        ${FormComponents.statCard({
        title: "Total Bookings",
        value: bookingStats.total,
        icon: "fa-ticket-alt",
        bgColor: "bg-blue-500",
        subtitle: `${bookingStats.upcoming} upcoming`,
      })}
        ${FormComponents.statCard({
        title: "Confirmed",
        value: bookingStats.confirmed,
        icon: "fa-check-circle",
        bgColor: "bg-green-500",
        subtitle: "Ready to attend",
      })}
        ${FormComponents.statCard({
        title: "Total Spent",
        value: `$${bookingStats.totalSpent}`,
        icon: "fa-dollar-sign",
        bgColor: "bg-purple-500",
        subtitle: "All time",
      })}
        ${FormComponents.statCard({
        title: "Past Events",
        value: bookingStats.past,
        icon: "fa-history",
        bgColor: "bg-gray-500",
        subtitle: "Attended",
      })}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="lg:col-span-2">
          ${this.renderUpcomingBookings(bookingStats.upcomingBookings)}
        </div>
        <div class="lg:col-span-1">
          ${this.renderQuickActions()}
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${this.renderUpcomingPerformances(upcomingPerformances.slice(0, 3))}
        ${this.renderRecentBookings(bookingStats.pastBookings.slice(0, 5))}
      </div>
    `;

      $("#dashboardContent").html(content);
    } catch (error) {
      console.error("Failed to load dashboard:", error);
      $("#dashboardContent").html(
        createEmptyState(
          "Failed to load dashboard",
          "Unable to fetch your booking data from server",
          "fa-exclamation-circle"
        )
      );
      handleApiError(error, "Failed to load dashboard");
    }
  },

  renderUpcomingBookings(bookings) {
    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">
            <i class="fas fa-calendar-check text-indigo-600 mr-2"></i>
            Upcoming Events
          </h2>
          <a href="/user/bookings" data-link class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            View All <i class="fas fa-arrow-right ml-1"></i>
          </a>
        </div>
        ${bookings.length === 0
        ? `
          <div class="text-center py-12">
            <div class="text-6xl text-gray-300 mb-4">
              <i class="far fa-calendar"></i>
            </div>
            <p class="text-gray-600 mb-4">No upcoming events booked</p>
            <a href="/performances" data-link class="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              <i class="fas fa-search"></i>
              Browse Performances
            </a>
          </div>
        `
        : `
          <div class="space-y-4">
            ${bookings
          .slice(0, 3)
          .map((booking) => BookingCard.renderCompact(booking))
          .join("")}
            ${bookings.length > 3
          ? `
              <div class="text-center pt-2">
                <a href="/user/bookings" data-link class="text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                  View ${bookings.length - 3} more upcoming events →
                </a>
              </div>
            `
          : ""
        }
          </div>
        `
      }
      </div>
    `;
  },

  getQuickActions() {
    return [
      {
        title: "Browse Performances",
        description: "Discover upcoming shows",
        icon: "fa-search",
        gradient: "from-indigo-500 to-purple-600",
        href: "/performances",
      },
      {
        title: "My Bookings",
        description: "View all tickets",
        icon: "fa-ticket-alt",
        gradient: "from-green-500 to-teal-600",
        href: "/user/bookings",
      },
      {
        title: "My Profile",
        description: "Update information",
        icon: "fa-user",
        gradient: "from-blue-500 to-cyan-600",
        href: "/user/profile",
      },
    ];
  },

  getHelpLinks() {
    return [
      {
        title: "FAQs",
        icon: "fa-question-circle",
        href: "#",
      },
      {
        title: "Contact Support",
        icon: "fa-headset",
        href: "#",
      },
      {
        title: "User Guide",
        icon: "fa-book",
        href: "#",
      },
    ];
  },

  renderQuickActionCard(action) {
    return `
      <a href="${action.href}" data-link class="block p-4 bg-gradient-to-r ${action.gradient} text-white rounded-lg hover:shadow-lg transition-all transform hover:scale-105">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
            <i class="fas ${action.icon} text-2xl"></i>
          </div>
          <div>
            <p class="font-bold">${action.title}</p>
            <p class="text-xs opacity-90">${action.description}</p>
          </div>
        </div>
      </a>
    `;
  },

  renderHelpLink(link) {
    return `
      <a href="${link.href}" class="flex items-center text-gray-600 hover:text-indigo-600 transition-colors">
        <i class="fas ${link.icon} mr-2 text-indigo-600"></i>
        ${link.title}
      </a>
    `;
  },

  renderQuickActions() {
    const actions = this.getQuickActions();
    const helpLinks = this.getHelpLinks();

    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">
          <i class="fas fa-bolt text-yellow-500 mr-2"></i>
          Quick Actions
        </h2>
        <div class="space-y-3">
          ${actions
        .map((action) => this.renderQuickActionCard(action))
        .join("")}
        </div>

        <div class="mt-6 pt-6 border-t border-gray-200">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Need Help?</h3>
          <div class="space-y-2 text-sm">
            ${helpLinks.map((link) => this.renderHelpLink(link)).join("")}
          </div>
        </div>
      </div>
    `;
  },

  renderUpcomingPerformances(performances) {
    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">
            <i class="fas fa-star text-yellow-500 mr-2"></i>
            Recommended for You
          </h2>
          <a href="/performances" data-link class="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            View All <i class="fas fa-arrow-right ml-1"></i>
          </a>
        </div>
        ${performances.length === 0
        ? `
          <div class="text-center py-8">
            <i class="fas fa-music text-4xl text-gray-300 mb-3"></i>
            <p class="text-gray-500">No upcoming performances available</p>
          </div>
        `
        : `
          <div class="space-y-4">
            ${performances
          .map(
            (perf) => `
              <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex gap-4">
                  <div class="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                    <i class="fas fa-music text-3xl"></i>
                  </div>
                  <div class="flex-1">
                    <h3 class="font-bold text-gray-900 mb-1">${perf.title}</h3>
                    <p class="text-sm text-gray-600 mb-2">
                      <i class="fas fa-calendar mr-1"></i>
                      ${dayjs(perf.date).format("MMM D, YYYY")}
                    </p>
                    <div class="flex items-center justify-between">
                      <span class="text-lg font-bold text-indigo-600">From $${perf.price
              }</span>
                      <a href="/performances/${perf.id
              }" data-link class="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition-colors">
                        Book Now
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            `
          )
          .join("")}
          </div>
        `
      }
      </div>
    `;
  },

  renderRecentBookings(bookings) {
    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">
            <i class="fas fa-history text-gray-600 mr-2"></i>
            Recent Activity
          </h2>
        </div>
        ${bookings.length === 0
        ? `
          <div class="text-center py-8">
            <i class="fas fa-inbox text-4xl text-gray-300 mb-3"></i>
            <p class="text-gray-500">No booking history yet</p>
            <p class="text-sm text-gray-400 mt-2">Your bookings will appear here</p>
          </div>
        `
        : `
          <div class="space-y-3">
            ${bookings
          .map((booking) => {
            const isPast = dayjs(booking.performanceDate).isBefore(dayjs());
            const statusColors = {
              confirmed: "green",
              pending: "yellow",
              cancelled: "red",
            };
            return `
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div class="w-10 h-10 ${isPast ? "bg-gray-400" : "bg-indigo-600"
              } rounded-lg flex items-center justify-center text-white flex-shrink-0">
                    <i class="fas fa-ticket-alt"></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-900 truncate">${booking.performanceTitle
              }</p>
                    <p class="text-xs text-gray-500">
                      ${dayjs(booking.performanceDate).format(
                "MMM D, YYYY"
              )} • ${booking.seats.length} seat(s)
                    </p>
                  </div>
                  <div class="text-right flex-shrink-0">
                    ${FormComponents.badge({
                text: booking.status,
                color: statusColors[booking.status] || "gray",
              })}
                    <p class="text-sm font-bold text-gray-900 mt-1">$${booking.amount
              }</p>
                  </div>
                </div>
              `;
          })
          .join("")}
          </div>
        `
      }
      </div>
    `;
  },
};
