export const performanceUtils = {
  calculateAvailability(totalSeats, availableSeats) {
    if (!totalSeats || totalSeats <= 0) return 0;
    return (availableSeats / totalSeats) * 100;
  },

  getAvailabilityCategory(availabilityPercent) {
    if (availabilityPercent === 0) return "sold_out";
    if (availabilityPercent > 0 && availabilityPercent < 10) return "low";
    if (availabilityPercent >= 10 && availabilityPercent <= 50) return "medium";
    return "high";
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
    const totalSeats =
      performance.totalSeats || performance.ticketingInfo?.totalSeats || 0;
    const availableSeats =
      performance.availableSeats ??
      performance.ticketingInfo?.availableSeats ??
      0;
    const bookedSeats = totalSeats - availableSeats;
    const availabilityPercent = this.calculateAvailability(
      totalSeats,
      availableSeats
    );
    const category = this.getAvailabilityCategory(availabilityPercent);

    return {
      totalSeats,
      availableSeats,
      bookedSeats,
      availabilityPercent,
      category,
      color: this.getAvailabilityColor(category),
      progressColor: this.getAvailabilityProgressColor(availabilityPercent),
      label: this.getAvailabilityLabel(category),
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

  isBookable(performance) {
    const status = this.getPerformanceStatus(performance);
    const info = this.getSeatAvailabilityInfo(performance);

    return (
      ["on_sale", "early_bird", "pre_order"].includes(status) &&
      info.availableSeats > 0
    );
  },

  formatPerformanceDate(performance) {
    const dateTime = performance.showtimes?.[0]?.dateTime || performance.date;
    if (!dateTime) return "Date TBA";

    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  },

  formatPerformanceTime(performance) {
    const dateTime = performance.showtimes?.[0]?.dateTime || performance.date;
    if (!dateTime) return "";

    const date = new Date(dateTime);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  getVenueName(performance) {
    return performance.venueName || performance.venue || "Venue TBA";
  },

  getPriceRange(performance) {
    const showtimes = performance.showtimes || [];
    if (showtimes.length === 0) return { min: 0, max: 0 };

    let min = Infinity;
    let max = -Infinity;

    showtimes.forEach((showtime) => {
      const sections = showtime.pricing?.sections || [];
      sections.forEach((section) => {
        if (section.price < min) min = section.price;
        if (section.price > max) max = section.price;
      });
    });

    if (min === Infinity) return { min: 0, max: 0 };
    return { min, max };
  },

  formatPriceRange(performance) {
    const { min, max } = this.getPriceRange(performance);

    if (min === 0 && max === 0) return "Price TBA";
    if (min === max) return `HKD ${min}`;
    return `HKD ${min} - ${max}`;
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
