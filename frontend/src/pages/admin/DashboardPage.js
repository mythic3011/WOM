import { renderStatsGrid } from "/src/components/StatsCard.js";
import { createCard } from "/src/components/Card.js";
import { getCurrentUser } from "/src/utils/core/auth.js";
import { statsAPI, handleApiError } from "/src/services/apiClient.js";
import { formatCurrency, formatNumber } from "/src/utils/utils.js";
import dayjs from "dayjs";

export default {
  title: "Admin Dashboard | WOM",

  async render() {
    const userData = getCurrentUser();
    const username = userData?.name || "Admin";

    let statsData = {
      totalPerformances: 0,
      totalBookings: 0,
      totalUsers: 0,
      totalRevenue: 0,
      recentBookings: [],
      upcomingPerformances: [],
    };

    let stats = [];
    let recentActivity = [];

    try {
      const apiStats = await statsAPI.getDashboardStats();
      statsData = apiStats;

      recentActivity = statsData.recentBookings
        ? statsData.recentBookings.slice(0, 5).map((booking) => ({
            description: `New booking for ${
              booking.performance?.title || "Performance"
            }`,
            date: booking.bookingDate,
            status: booking.status,
            color: booking.status === "confirmed" ? "green" : "yellow",
            icon: "fa-ticket-alt",
          }))
        : [];

      stats = [
        {
          title: "Total Performances",
          value: formatNumber(statsData.totalPerformances),
          subtitle: `${statsData.upcomingPerformances?.length || 0} upcoming`,
          icon: "fa-music",
          iconColor: "text-blue-500",
          bgColor: "bg-blue-50",
        },
        {
          title: "Total Bookings",
          value: formatNumber(statsData.totalBookings),
          subtitle: "All time bookings",
          icon: "fa-ticket-alt",
          iconColor: "text-green-500",
          bgColor: "bg-green-50",
        },
        {
          title: "Total Users",
          value: formatNumber(statsData.totalUsers),
          subtitle: "Registered users",
          icon: "fa-users",
          iconColor: "text-purple-500",
          bgColor: "bg-purple-50",
        },
        {
          title: "Total Revenue",
          value: formatCurrency(statsData.totalRevenue),
          subtitle: "Total revenue",
          icon: "fa-dollar-sign",
          iconColor: "text-indigo-500",
          bgColor: "bg-indigo-50",
        },
      ];
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
      handleApiError(error, "Failed to load dashboard statistics");

      stats = [
        {
          title: "Total Performances",
          value: "0",
          subtitle: "0 upcoming",
          icon: "fa-music",
          iconColor: "text-blue-500",
          bgColor: "bg-blue-50",
        },
        {
          title: "Total Bookings",
          value: "0",
          subtitle: "All time bookings",
          icon: "fa-ticket-alt",
          iconColor: "text-green-500",
          bgColor: "bg-green-50",
        },
        {
          title: "Total Users",
          value: "0",
          subtitle: "Registered users",
          icon: "fa-users",
          iconColor: "text-purple-500",
          bgColor: "bg-purple-50",
        },
        {
          title: "Total Revenue",
          value: formatCurrency(0),
          subtitle: "Total revenue",
          icon: "fa-dollar-sign",
          iconColor: "text-indigo-500",
          bgColor: "bg-indigo-50",
        },
      ];
    }

    const quickActions = [
      {
        href: "/performances",
        icon: "fa-music",
        label: "Browse Performances",
        color: "indigo",
        description: "View public performances",
      },
      {
        href: "/admin/performances",
        icon: "fa-music",
        label: "Manage Performances",
        color: "blue",
        description: "Add, edit, delete performances",
      },
      {
        href: "/admin/venues",
        icon: "fa-building",
        label: "Venues",
        color: "green",
        description: "Manage venue locations",
      },
      {
        href: "/admin/users",
        icon: "fa-users",
        label: "User Management",
        color: "purple",
        description: "View and manage users",
      },
      {
        href: "/admin/bookings",
        icon: "fa-clipboard-list",
        label: "Bookings",
        color: "orange",
        description: "View all bookings",
      },
      {
        href: "/admin/settings",
        icon: "fa-cog",
        label: "Settings",
        color: "gray",
        description: "System settings",
      },
      {
        href: "/user/profile",
        icon: "fa-user-circle",
        label: "Profile",
        color: "teal",
        description: "Update your profile",
      },
    ];

    const recentActivityCard = createCard({
      title: "Recent Activity",
      body: `
        <div class="space-y-3">
          ${
            recentActivity.length > 0
              ? recentActivity
                  .map(
                    (activity) => `
            <div class="flex items-center gap-3 p-3 bg-${
              activity.color
            }-50 rounded-lg border border-${
                      activity.color
                    }-100 hover:shadow-md transition-shadow">
              <div class="w-10 h-10 bg-${
                activity.color
              }-100 rounded-full flex items-center justify-center flex-shrink-0">
                <i class="fas ${activity.icon} text-${activity.color}-600"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">${
                  activity.description
                }</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <p class="text-xs text-gray-500">${dayjs(
                    activity.date
                  ).format("MMM D, YYYY")}</p>
                  <span class="text-xs px-2 py-0.5 bg-${
                    activity.color
                  }-100 text-${activity.color}-700 rounded-full font-medium">${
                      activity.status
                    }</span>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-gray-900">${statsService.formatCurrency(
                  activity.amount
                )}</p>
              </div>
            </div>
          `
                  )
                  .join("")
              : `
            <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div class="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <i class="fas fa-inbox text-gray-400"></i>
              </div>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">No recent activity</p>
                <p class="text-xs text-gray-500">Start managing your system</p>
              </div>
            </div>
          `
          }
        </div>
      `,
    });

    const quickActionsCard = createCard({
      title: "Quick Actions",
      body: `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${quickActions
            .map(
              (action) => `
            <a
              href="${action.href}"
              data-link
              class="group flex items-start gap-3 p-4 bg-${action.color}-50 border-2 border-${action.color}-100 rounded-lg hover:bg-${action.color}-100 hover:border-${action.color}-300 transition-all duration-200 hover:shadow-md"
            >
              <div class="w-10 h-10 bg-${action.color}-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <i class="fas ${action.icon} text-white"></i>
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-${action.color}-900 truncate">${action.label}</h3>
                <p class="text-xs text-${action.color}-700 mt-0.5">${action.description}</p>
              </div>
            </a>
          `
            )
            .join("")}
        </div>
      `,
    });

    return `
      <main class="container mx-auto px-4 py-8 max-w-7xl">
        <div class="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 flex items-center">
              <i class="fas fa-tachometer-alt text-indigo-600 mr-3"></i>Admin Dashboard
            </h1>
            <p class="text-gray-600 mt-2">Welcome back, <span class="font-semibold text-indigo-600">${username}</span></p>
          </div>
          <div class="flex gap-2">
            <a href="/admin/performances" data-link class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg">
              <i class="fas fa-plus"></i>
              <span>Add Performance</span>
            </a>
          </div>
        </div>

        <div class="mb-8">
          ${renderStatsGrid(stats)}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            ${quickActionsCard}
          </div>
          <div class="lg:col-span-1">
            ${recentActivityCard}
          </div>
        </div>
      </main>
    `;
  },
};
