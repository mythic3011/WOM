import { performanceHelpers } from "../services/performanceHelpers.js";

export const performanceUtils = {
  calculateAvailability(totalSeats, availableSeats) {
    return performanceHelpers.calculateSeatAvailability(
      totalSeats,
      availableSeats
    );
  },

  getAvailabilityCategory(availabilityPercent) {
    return performanceHelpers.getAvailabilityCategory(availabilityPercent);
  },

  getAvailabilityColor(category) {
    const colors = {
      high: "text-green-600 bg-green-100",
      medium: "text-yellow-600 bg-yellow-100",
      low: "text-orange-600 bg-orange-100",
      sold_out: "text-red-600 bg-red-100",
    };
    return colors[category] || colors.high;
  },

  getAvailabilityProgressColor(availabilityPercent) {
    if (availabilityPercent === 0) return "bg-red-500";
    if (availabilityPercent < 10) return "bg-orange-500";
    if (availabilityPercent <= 50) return "bg-yellow-500";
    return "bg-green-500";
  },

  getAvailabilityLabel(category) {
    const labels = {
      high: "High Availability",
      medium: "Limited Seats",
      low: "Very Limited",
      sold_out: "Sold Out",
    };
    return labels[category] || labels.high;
  },

  filterByAvailability(performance, availabilityFilter) {
    if (!availabilityFilter) return true;

    const totalSeats =
      performance.totalSeats || performance.ticketingInfo?.totalSeats || 0;
    const availableSeats =
      performance.availableSeats ??
      performance.ticketingInfo?.availableSeats ??
      0;
    const availabilityPercent = this.calculateAvailability(
      totalSeats,
      availableSeats
    );
    const category = this.getAvailabilityCategory(availabilityPercent);

    return category === availabilityFilter;
  },

  getSeatAvailabilityInfo(performance) {
    const info = performanceHelpers.getSeatAvailabilityInfo(performance);
    return {
      ...info,
      color: this.getAvailabilityColor(info.category),
      progressColor: this.getAvailabilityProgressColor(
        info.availabilityPercent
      ),
      label: this.getAvailabilityLabel(info.category),
    };
  },

  getSeatAvailabilityDisplay(performance) {
    const info = this.getSeatAvailabilityInfo(performance);

    return `
      <div class="space-y-1">
        <div class="flex items-center justify-between text-xs">
          <span class="font-medium text-gray-600">Availability</span>
          <span class="font-bold ${
            info.availabilityPercent === 0
              ? "text-red-600"
              : info.availabilityPercent < 30
                ? "text-orange-600"
                : "text-green-600"
          }">
            ${info.availableSeats}/${info.totalSeats} seats
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            class="${
              info.progressColor
            } h-full rounded-full transition-all duration-300"
            style="width: ${info.availabilityPercent}%"
          ></div>
        </div>
        <div class="flex items-center justify-between text-xs">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            info.color
          }">
            ${info.label}
          </span>
          <span class="text-gray-500">${info.availabilityPercent.toFixed(
            0
          )}%</span>
        </div>
      </div>
    `;
  },

  getSeatAvailabilityBadge(performance) {
    const info = this.getSeatAvailabilityInfo(performance);

    return `
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.color}">
        ${info.availableSeats}/${info.totalSeats}
      </span>
    `;
  },

  sortByAvailability(performances, descending = true) {
    return [...performances].sort((a, b) => {
      const aInfo = this.getSeatAvailabilityInfo(a);
      const bInfo = this.getSeatAvailabilityInfo(b);

      return descending
        ? bInfo.availabilityPercent - aInfo.availabilityPercent
        : aInfo.availabilityPercent - bInfo.availabilityPercent;
    });
  },

  getPerformanceStatus(performance) {
    return (
      performance.ticketingInfo?.status || performance.status || "upcoming"
    );
  },

  formatPerformanceDate(performance) {
    const dateTime = performance.showtimes?.[0]?.dateTime || performance.date;
    return performanceHelpers.formatPerformanceDate(dateTime);
  },

  formatPerformanceTime(performance) {
    const dateTime = performance.showtimes?.[0]?.dateTime || performance.date;
    return performanceHelpers.formatPerformanceTime(dateTime);
  },

  getVenueName(performance) {
    return performance.venueName || performance.venue || "Venue TBA";
  },

  getPriceRange(performance) {
    return performanceHelpers.getPriceRange(performance);
  },

  formatPriceRange(performance) {
    return performanceHelpers.formatPriceRange(performance);
  },

  isBookable(performance) {
    return performanceHelpers.isBookable(performance);
  },
};

export function calculateAvailability(totalSeats, availableSeats) {
  return performanceUtils.calculateAvailability(totalSeats, availableSeats);
}

export function getAvailabilityCategory(availabilityPercent) {
  return performanceUtils.getAvailabilityCategory(availabilityPercent);
}

export function getAvailabilityColor(category) {
  return performanceUtils.getAvailabilityColor(category);
}

export function getAvailabilityLabel(category) {
  return performanceUtils.getAvailabilityLabel(category);
}

export function filterByAvailability(performance, availabilityFilter) {
  return performanceUtils.filterByAvailability(performance, availabilityFilter);
}

export function getSeatAvailabilityDisplay(performance) {
  return performanceUtils.getSeatAvailabilityDisplay(performance);
}

export function getSeatAvailabilityInfo(performance) {
  return performanceUtils.getSeatAvailabilityInfo(performance);
}

export function sortByAvailability(performances, descending = true) {
  return performanceUtils.sortByAvailability(performances, descending);
}
