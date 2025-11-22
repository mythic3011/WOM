
import dayjs from "dayjs";

import { performanceUtils } from "@utils/performanceUtils.js";
import { getStatusBadge } from "@utils/status.js";

export const PerformanceCard = {
  render(performance, onView, onEdit, onDelete, onManageShowtimes) {
    const venue =
      performance.venueName ||
      performance.venue ||
      performance.location ||
      "N/A";
    const date = performance.date
      ? dayjs(performance.date).format("MMM D, YYYY")
      : "TBA";
    const availabilityInfo =
      performanceUtils.getSeatAvailabilityInfo(performance);
    const status =
      performance.ticketingInfo?.status || performance.status || "upcoming";

    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div class="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600 overflow-hidden">
          ${performance.image
        ? `
            <img src="${performance.image}" alt="${performance.title}" class="w-full h-full object-cover">
          `
        : `
            <div class="absolute inset-0 flex items-center justify-center">
              <i class="fas fa-music text-white text-6xl opacity-30"></i>
            </div>
          `
      }
          <div class="absolute top-3 right-3">
            ${getStatusBadge(status, "performance")}
          </div>
        </div>

        <div class="p-5">
          <h3 class="text-xl font-bold text-gray-900 mb-2 line-clamp-1">${performance.title}</h3>
          
          <div class="space-y-2 text-sm text-gray-600 mb-4">
            <div class="flex items-center gap-2">
              <i class="fas fa-user text-indigo-600 w-4"></i>
              <span>${performance.composer || "Unknown Composer"}</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fas fa-map-marker-alt text-indigo-600 w-4"></i>
              <span>${venue}</span>
            </div>
            <div class="flex items-center gap-2">
              <i class="fas fa-calendar text-indigo-600 w-4"></i>
              <span>${date}</span>
            </div>
          </div>

          <div class="mb-4">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="text-gray-600">Availability</span>
              <span class="font-bold">${availabilityInfo.availableSeats}/${availabilityInfo.totalSeats}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="${availabilityInfo.progressColor} h-full rounded-full transition-all" 
                   style="width: ${availabilityInfo.availabilityPercent}%"></div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <button class="view-btn px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    data-id="${performance.id}">
              <i class="fas fa-eye mr-1"></i>View
            </button>
            <button class="edit-btn px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                    data-id="${performance.id}">
              <i class="fas fa-edit mr-1"></i>Edit
            </button>
            <button class="showtime-btn px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    data-id="${performance.id}">
              <i class="fas fa-calendar-day mr-1"></i>Showtimes
            </button>
            <button class="delete-btn px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                    data-id="${performance.id}">
              <i class="fas fa-trash mr-1"></i>Delete
            </button>
          </div>
        </div>
      </div>
    `;
  },
};
