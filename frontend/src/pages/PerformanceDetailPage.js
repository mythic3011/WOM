import dayjs from "dayjs";
import { performanceService } from "/src/services/dataService.js";
import { getStatusBadge } from "/src/utils/status.js";
import { notify } from "/src/utils/ui/notification.js";
import { ZonePricing } from "/src/utils/booking/zonePricing.js";

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

  getBookingUrl(perf) {
    const hasShowtimes = perf.showtimes && perf.showtimes.length > 0;
    const firstShowtimeId = hasShowtimes ? perf.showtimes[0].id : null;

    return firstShowtimeId
      ? `/user/booking?p=${perf.id}&showtime=${firstShowtimeId}`
      : `/user/booking?p=${perf.id}`;
  },

  renderInfoField(label, value) {
    return `
      <div>
        <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">${label}</h3>
        <p class="text-lg text-gray-900">${value}</p>
      </div>
    `;
  },

  displayPerformance(perf) {
    const statusBadge = getStatusBadge(
      perf.ticketingInfo?.status || "upcoming",
      "performance"
    );
    const bookingUrl = this.getBookingUrl(perf);

    $("#performanceDetail").html(`
      <div class="max-w-4xl mx-auto">
        <a href="/performances" data-link class="text-indigo-600 hover:text-indigo-800 mb-4 inline-block">
          <i class="fas fa-arrow-left mr-2"></i>Back to Performances
        </a>

        <div class="bg-white rounded-lg shadow-lg overflow-hidden">
          <div class="w-full h-96 bg-gray-100">
            <img
              src="${perf.imageUrl || "/img/default-performance.jpg"}"
              alt="${perf.title}"
              class="w-full h-96 object-cover"
              onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22Arial, sans-serif%22 font-size=%2224%22 text-anchor=%22middle%22 x=%22200%22 y=%22140%22%3E%3Ctspan x=%22200%22 dy=%220%22%3E%F0%9F%8E%BC%3C/tspan%3E%3Ctspan x=%22200%22 dy=%2235%22%3EPerformance Image%3C/tspan%3E%3C/text%3E%3C/svg%3E';"
            />
          </div>

          <div class="p-8">
            <div class="flex justify-between items-start mb-4">
              <h1 class="text-4xl font-bold text-gray-900">${perf.title}</h1>
              ${statusBadge}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              ${this.renderInfoField("Composer", perf.composer)}
              ${this.renderInfoField("Conductor", perf.conductor)}
              ${this.renderInfoField("Orchestra", perf.orchestra)}
              ${
                perf.ticketingInfo?.duration
                  ? this.renderInfoField(
                      "Duration",
                      perf.ticketingInfo.duration
                    )
                  : ""
              }
            </div>

            <div class="mb-6">
              <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Description</h3>
              <p class="text-gray-700 leading-relaxed">${
                perf.description || "No description available"
              }</p>
            </div>

            <div class="mb-6" id="showtimes">
              <h3 class="text-sm font-semibold text-gray-500 uppercase mb-2">Showtimes</h3>
              ${this.renderShowtimes(perf.showtimes, perf.id)}
            </div>

            ${this.renderPricingZones(perf.pricingSections)}

            <div class="flex gap-4">
              <a href="${bookingUrl}" data-link class="flex-1 px-6 py-3 bg-indigo-600 text-white text-center rounded-lg hover:bg-indigo-700 transition font-semibold">
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

  renderShowtimeCard(showtime, performanceId) {
    const formattedDate = dayjs(showtime.dateTime).format("dddd, MMMM D, YYYY");
    const formattedTime = dayjs(showtime.dateTime).format("h:mm A");
    const venueInfo = showtime.venueName
      ? `<span class="text-gray-400">•</span> <i class="fas fa-map-marker-alt text-gray-400"></i> ${showtime.venueName}`
      : "";

    return `
      <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div class="flex-1">
          <p class="font-semibold text-gray-900 flex items-center gap-2">
            <i class="fas fa-calendar-alt text-indigo-600"></i>
            ${formattedDate}
          </p>
          <p class="text-sm text-gray-600 mt-1 flex items-center gap-2">
            <i class="fas fa-clock text-gray-400"></i>
            ${formattedTime}
            ${venueInfo}
          </p>
        </div>
        <a
          href="/user/booking?p=${performanceId}&showtime=${showtime.id}"
          data-link
          class="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
        >
          <i class="fas fa-ticket-alt"></i>
          <span>Select</span>
        </a>
      </div>
    `;
  },

  renderShowtimes(showtimes, performanceId) {
    if (!showtimes || showtimes.length === 0) {
      return '<p class="text-gray-500">No showtimes available yet</p>';
    }

    return `
      <div class="space-y-2">
        ${showtimes
          .map((showtime) => this.renderShowtimeCard(showtime, performanceId))
          .join("")}
      </div>
    `;
  },

  getTierColors(tier) {
    const colorMap = {
      premium: {
        border: "border-purple-200",
        bg: "bg-purple-100",
        text: "text-purple-700",
      },
      economy: {
        border: "border-blue-200",
        bg: "bg-blue-100",
        text: "text-blue-700",
      },
      vip: {
        border: "border-yellow-200",
        bg: "bg-yellow-100",
        text: "text-yellow-700",
      },
      standard: {
        border: "border-green-200",
        bg: "bg-green-100",
        text: "text-green-700",
      },
    };

    return colorMap[tier] || colorMap.standard;
  },

  renderPricingZoneCard(zone) {
    const colors = this.getTierColors(zone.tier);

    return `
      <div class="bg-white rounded-lg p-4 border-2 ${colors.border}">
        <div class="flex items-center justify-between mb-2">
          <h4 class="font-semibold text-gray-900 text-sm">${
            zone.sectionName
          }</h4>
          <span class="px-2 py-1 rounded text-xs font-bold ${colors.bg} ${
      colors.text
    }">
            ${zone.tierLabel.toUpperCase()}
          </span>
        </div>
        <p class="text-xs text-gray-600 mb-2">
          <i class="fas fa-chair mr-1"></i>Rows: ${zone.rowsDisplay}
        </p>
        <p class="text-lg font-bold text-indigo-600">
          From HKD ${zone.basePrice.toLocaleString()}
        </p>
        <p class="text-xs text-gray-500 mt-1">
          Base price (discounts apply for students, seniors, etc.)
        </p>
      </div>
    `;
  },

  renderPricingZones(pricingSections) {
    if (!pricingSections || pricingSections.length === 0) {
      return "";
    }

    const zones = ZonePricing.getZoneSummary(pricingSections);

    return `
      <div class="mb-6 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 class="text-sm font-semibold text-gray-500 uppercase mb-3">
          <i class="fas fa-tags mr-2"></i>Pricing Zones
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${zones.map((zone) => this.renderPricingZoneCard(zone)).join("")}
        </div>
        <div class="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <p class="text-xs text-blue-800">
            <i class="fas fa-info-circle mr-1"></i>
            <strong>Note:</strong> Final prices vary based on ticket type. Students, seniors, PWD, and CSSA recipients receive 50% discount on base price.
          </p>
        </div>
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
