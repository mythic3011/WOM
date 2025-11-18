import dayjs from "dayjs";
import { getStatusBadge } from "@utils/status.js";
import { performanceUtils } from "@utils/performanceUtils.js";

export const PerformanceCard = {
  getDateDisplay(performance) {
    if (!performance.showtimes || performance.showtimes.length === 0) {
      return {
        single: true,
        date: dayjs(performance.date).format("MMM D, YYYY"),
        shortDate: dayjs(performance.date).format("MMM D"),
        fullDate: dayjs(performance.date).format("MMMM D, YYYY"),
        showtimeCount: 0,
      };
    }

    if (performance.showtimes.length === 1) {
      const showtime = performance.showtimes[0];
      const dt = dayjs(showtime.dateTime || showtime.datetime);
      return {
        single: true,
        date: dt.format("MMM D, YYYY"),
        shortDate: dt.format("MMM D"),
        fullDate: dt.format("MMMM D, YYYY"),
        time: dt.format("h:mm A"),
        showtimeCount: 1,
      };
    }

    const dates = performance.showtimes
      .map((s) => dayjs(s.dateTime || s.datetime))
      .sort((a, b) => a.valueOf() - b.valueOf());

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    return {
      single: false,
      startShort: firstDate.format("MMM D"),
      endShort: lastDate.format("MMM D"),
      startFull: firstDate.format("MMMM D, YYYY"),
      endFull: lastDate.format("MMMM D, YYYY"),
      showtimeCount: performance.showtimes.length,
    };
  },

  renderDateBadge(dateInfo) {
    if (dateInfo.single) {
      return `
        <div class="text-center">
          <div class="text-2xl font-bold text-indigo-900">${dateInfo.shortDate
        }</div>
          ${dateInfo.time
          ? `<div class="text-xs text-indigo-600 mt-1"><i class="fas fa-clock"></i> ${dateInfo.time}</div>`
          : ""
        }
        </div>
      `;
    }

    return `
      <div class="flex items-center gap-2">
        <div class="text-center">
          <div class="text-2xl font-bold text-indigo-900">${dateInfo.startShort
      }</div>
          <div class="text-xs text-indigo-600">Start</div>
        </div>
        <div class="text-xl text-indigo-400">
          <i class="fas fa-arrow-right"></i>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-indigo-900">${dateInfo.endShort
      }</div>
          <div class="text-xs text-indigo-600">End</div>
        </div>
      </div>
      ${dateInfo.showtimeCount > 1
        ? `
      <div class="mt-2 pt-2 border-t border-indigo-300 text-center">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-200 text-indigo-800 rounded-full text-xs font-bold">
          <i class="fas fa-calendar-check"></i>
          ${dateInfo.showtimeCount} Showtimes
        </span>
      </div>
      `
        : ""
      }
    `;
  },

  renderGridCard(performance) {
    const statusBadge = getStatusBadge(
      performance.ticketingInfo?.status || performance.status || "upcoming",
      "performance"
    );
    const dateInfo = this.getDateDisplay(performance);

    return `
      <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1" data-performance-id="${performance.id
      }">
        <div class="relative overflow-hidden bg-gray-100">
          <img
            src="${performance.imageUrl || "/img/default-performance.jpg"}"
            alt="${performance.title}"
            class="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
            onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22Arial, sans-serif%22 font-size=%2220%22 text-anchor=%22middle%22 x=%22200%22 y=%22140%22%3E%3Ctspan x=%22200%22 dy=%220%22%3E%F0%9F%8E%BC%3C/tspan%3E%3Ctspan x=%22200%22 dy=%2230%22%3EPerformance Image%3C/tspan%3E%3C/text%3E%3C/svg%3E';"
          />
          <div class="absolute top-3 right-3">
            ${statusBadge || ""}
          </div>
        </div>

        <div class="p-5">
          <h3 class="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-3">
            ${performance.title}
          </h3>

          <div class="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-4 mb-4">
            ${this.renderDateBadge(dateInfo)}
          </div>

          <div class="space-y-2.5 mb-4">
            <p class="text-sm text-gray-700 flex items-center gap-2">
              <i class="fas fa-user-tie text-indigo-500"></i>
              <span class="font-medium">${performance.composer}</span>
            </p>
            ${performance.conductor
        ? `
            <p class="text-sm text-gray-700 flex items-center gap-2">
              <i class="fas fa-baton text-purple-500"></i>
              <span>${performance.conductor}</span>
            </p>
            `
        : ""
      }
            <p class="text-sm text-gray-700 flex items-center gap-2">
              <i class="fas fa-map-marker-alt text-indigo-500"></i>
              <span>${performance.venueName || performance.venue || "Venue TBA"
      }</span>
            </p>
            ${performance.venueAddress
        ? `
            <p class="text-xs text-gray-500 flex items-center gap-2 ml-6">
              <i class="fas fa-location-arrow text-gray-400"></i>
              <span class="line-clamp-1">${performance.venueAddress}</span>
            </p>
            `
        : ""
      }
            <p class="text-sm text-gray-700 flex items-center gap-2">
              <i class="fas fa-users text-blue-500"></i>
              <span class="line-clamp-1">${performance.orchestra || "Orchestra"
      }</span>
            </p>
            ${performance.duration
        ? `
            <p class="text-sm text-gray-700 flex items-center gap-2">
              <i class="fas fa-clock text-green-500"></i>
              <span>${performance.duration} mins</span>
            </p>
            `
        : ""
      }
            ${performance.category
        ? `
            <p class="text-xs text-gray-500 flex items-center gap-2">
              <i class="fas fa-tag text-gray-400"></i>
              <span class="uppercase tracking-wide font-semibold">${performance.category}</span>
            </p>
            `
        : ""
      }
          </div>

          ${performance.totalSeats && performance.availableSeats !== undefined
        ? `
          <div class="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
            ${performanceUtils.getSeatAvailabilityDisplay(performance)}
          </div>
          `
        : ""
      }

          <div class="flex items-center justify-between pt-4 border-t-2 border-gray-200">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">From</p>
              <p class="text-2xl font-bold text-indigo-600">HKD ${performance.price || 200
      }</p>
            </div>
            <a href="/performances/${performance.id
      }" data-link class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-md hover:shadow-lg">
              <span>View</span>
              <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  },

  renderListCard(performance) {
    const statusBadge = getStatusBadge(
      performance.ticketingInfo?.status || performance.status || "upcoming",
      "performance"
    );
    const dateInfo = this.getDateDisplay(performance);

    return `
      <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group" data-performance-id="${performance.id
      }">
        <div class="flex flex-col md:flex-row">
          <div class="md:w-64 flex-shrink-0 relative overflow-hidden bg-gray-100">
            <img
              src="${performance.imageUrl || "/img/default-performance.jpg"}"
              alt="${performance.title}"
              class="w-full h-48 md:h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22Arial, sans-serif%22 font-size=%2220%22 text-anchor=%22middle%22 x=%22200%22 y=%22140%22%3E%3Ctspan x=%22200%22 dy=%220%22%3E%F0%9F%8E%BC%3C/tspan%3E%3Ctspan x=%22200%22 dy=%2230%22%3EPerformance Image%3C/tspan%3E%3C/text%3E%3C/svg%3E';"
            />
            <div class="absolute top-3 left-3">
              ${statusBadge || ""}
            </div>
          </div>

          <div class="flex-1 p-6">
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div class="flex-1">
                <h3 class="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors mb-2">
                  ${performance.title}
                </h3>
                <div class="flex flex-wrap gap-3 text-sm text-gray-600">
                  <span class="flex items-center gap-1">
                    <i class="fas fa-user-tie text-indigo-500"></i>
                    ${performance.composer}
                  </span>
                  <span class="flex items-center gap-1">
                    <i class="fas fa-baton text-purple-500"></i>
                    ${performance.conductor}
                  </span>
                  <span class="flex items-center gap-1">
                    <i class="fas fa-users text-blue-500"></i>
                    ${performance.orchestra}
                  </span>
                </div>
              </div>

              <div class="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg p-3 min-w-[200px]">
                ${this.renderDateBadge(dateInfo)}
              </div>
            </div>

            <p class="text-gray-700 mb-4 line-clamp-2">
              ${performance.description ||
      "Experience world-class orchestral music"
      }
            </p>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              ${performance.duration
        ? `
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <i class="fas fa-clock text-green-500"></i>
                <span>${performance.duration} mins</span>
              </div>
              `
        : ""
      }
              ${performance.category
        ? `
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <i class="fas fa-tag text-gray-400"></i>
                <span class="uppercase tracking-wide font-semibold text-xs">${performance.category}</span>
              </div>
              `
        : ""
      }
              ${performance.totalSeats &&
        performance.availableSeats !== undefined
        ? `
              <div class="flex items-center gap-2 text-sm text-gray-600">
                <i class="fas fa-chair text-indigo-500"></i>
                ${performanceUtils.getSeatAvailabilityBadge(performance)}
              </div>
              `
        : ""
      }
            </div>

            <div class="flex flex-wrap items-center gap-4 mb-4">
              <div class="flex items-center gap-2 text-gray-600">
                <i class="fas fa-map-marker-alt text-indigo-500"></i>
                <span class="font-medium">${performance.venueName || performance.venue || "Venue TBA"
      }</span>
              </div>
              ${performance.venueAddress
        ? `
              <div class="text-sm text-gray-500 flex items-center gap-2">
                <i class="fas fa-location-arrow text-gray-400"></i>
                <span class="line-clamp-1">${performance.venueAddress}</span>
              </div>
              `
        : ""
      }
            </div>

            ${performance.totalSeats && performance.availableSeats !== undefined
        ? `
            <div class="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
              ${performanceUtils.getSeatAvailabilityDisplay(performance)}
            </div>
            `
        : ""
      }

            <div class="flex flex-wrap items-center gap-4">
              <div class="text-left">
                <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">From</p>
                <p class="text-2xl font-bold text-indigo-600">HKD ${performance.price || 200
      }</p>
              </div>
              <div class="flex-1"></div>
              <a href="/performances/${performance.id
      }" data-link class="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold shadow-md hover:shadow-lg">
                <span>View Details</span>
                <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  },
};
