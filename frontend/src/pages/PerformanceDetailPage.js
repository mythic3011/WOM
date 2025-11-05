import dayjs from "dayjs";
import { performanceService } from "/src/services/dataService.js";
import { getStatusBadge } from "/src/utils/status.js";
import { notify } from "/src/utils/ui/notification.js";

export default {
  title: "Performance Details | WOM",

  async render(params) {
    return `
      <main class="container mx-auto px-4 py-8">
        <div id="performanceDetail">
          <div class="flex justify-center items-center py-20">
            <div class="loading-spinner"></div>
          </div>
        </div>
      </main>
    `;
  },

  async afterRender(params) {
    try {
      const performance = await performanceService.getById(params.id);
      if (!performance) {
        this.showNotFound();
        return;
      }
      this.displayPerformance(performance);
    } catch (error) {
      console.error("Error loading performance:", error);
      this.showError();
    }
  },

  displayPerformance(perf) {
    const statusBadge = getStatusBadge(
      perf.ticketingInfo?.status || "upcoming",
      "performance"
    );

    $("#performanceDetail").html(`
      <div class="max-w-4xl mx-auto">
        <a href="/performances" data-link class="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
          <i class="fas fa-arrow-left mr-2"></i>Back to Performances
        </a>

        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
          <img src="${perf.imageUrl || "/img/default-performance.jpg"}" alt="${
      perf.title
    }" class="w-full h-96 object-cover" />

          <div class="p-8">
            <div class="flex justify-between items-start mb-4">
              <h1 class="text-4xl font-bold text-gray-900">${perf.title}</h1>
              ${statusBadge}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Composer</h3>
                <p class="text-lg text-gray-900">${perf.composer}</p>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Conductor</h3>
                <p class="text-lg text-gray-900">${perf.conductor}</p>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Orchestra</h3>
                <p class="text-lg text-gray-900">${perf.orchestra}</p>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Duration</h3>
                <p class="text-lg text-gray-900">${
                  perf.ticketingInfo?.duration || "TBD"
                }</p>
              </div>
            </div>

            <div class="mb-6">
              <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Description</h3>
              <p class="text-gray-700 leading-relaxed">${
                perf.description || "No description available"
              }</p>
            </div>

            <div class="mb-6" id="showtimes">
              <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Showtimes</h3>
              ${this.renderShowtimes(perf.showtimes)}
            </div>

            <div class="flex gap-4">
              <a href="/user/booking?performance=${
                perf.id
              }" data-link class="flex-1 px-6 py-3 bg-indigo-600 text-white text-center rounded-lg hover:bg-indigo-700 transition font-semibold">
                <i class="fas fa-ticket-alt mr-2"></i>Book Now
              </a>
              <button class="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
                <i class="fas fa-heart mr-2"></i>Save
              </button>
            </div>
          </div>
        </div>
      </div>
    `);
  },

  renderShowtimes(showtimes) {
    if (!showtimes || showtimes.length === 0) {
      return '<p class="text-gray-500">No showtimes available yet</p>';
    }

    return `
      <div class="space-y-2">
        ${showtimes
          .map(
            (showtime) => `
          <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
            <div>
              <p class="font-semibold text-gray-900">
                ${dayjs(showtime.dateTime).format("dddd, MMMM D, YYYY")}
              </p>
              <p class="text-sm text-gray-600">
                ${dayjs(showtime.dateTime).format("h:mm A")} • ${
              showtime.venueName || "Venue TBD"
            }
              </p>
            </div>
            <a href="/user/booking?showtime=${
              showtime.id
            }" data-link class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
              Select
            </a>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  },

  showNotFound() {
    $("#performanceDetail").html(`
      <div class="text-center py-20">
        <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Performance Not Found</h2>
        <p class="text-gray-600 mb-4">The performance you're looking for doesn't exist.</p>
        <a href="/performances" data-link class="text-indigo-600 hover:text-indigo-800">
          <i class="fas fa-arrow-left mr-2"></i>Back to Performances
        </a>
      </div>
    `);
  },

  showError() {
    $("#performanceDetail").html(`
      <div class="text-center py-20">
        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Error Loading Performance</h2>
        <p class="text-gray-600 mb-4">Something went wrong. Please try again.</p>
        <button onclick="window.location.reload()" class="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Retry
        </button>
      </div>
    `);
  },
};
