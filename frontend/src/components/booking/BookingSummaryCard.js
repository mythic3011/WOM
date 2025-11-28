
import dayjs from "dayjs";

import { getDisplayLabel } from "@utils/seatIdHelper.js";

export const BookingSummaryCard = {
  render(performanceData, selectedSeats, seatTicketTypes, totalPrice) {
    return `
      <div class="bg-white rounded-lg shadow-md border border-gray-200 p-6 sticky top-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          <i class="fas fa-shopping-cart text-indigo-600 mr-2"></i>
          Booking Summary
        </h3>

        <div class="space-y-4">
          <div>
            <h4 class="text-xs font-semibold text-gray-600 uppercase mb-2">Performance</h4>
            <div class="bg-gray-50 rounded p-3">
              <p class="font-bold text-gray-900">${performanceData.title}</p>
              <p class="text-sm text-gray-600 mt-1">
                <i class="fas fa-map-marker-alt text-gray-400 mr-1"></i>
                ${performanceData.venue?.name || performanceData.venue || "TBA"}
              </p>
              ${performanceData.date
        ? `
                <p class="text-sm text-gray-600 mt-1">
                  <i class="fas fa-calendar text-gray-400 mr-1"></i>
                  ${dayjs(performanceData.date).format("MMM D, YYYY")}
                </p>
              `
        : ""
      }
            </div>
          </div>

          <div class="border-t border-gray-200 pt-4">
            <p class="text-sm text-gray-600 mb-2">Selected Seats & Tickets</p>
            ${selectedSeats.length > 0
        ? `
              <div class="space-y-1.5">
                ${selectedSeats
          .map((seat) => {
            const ticket = seatTicketTypes[seat];
            const displayLabel = getDisplayLabel(seat);
            return `
                      <div class="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                        <span class="font-mono font-medium text-indigo-700">${displayLabel}</span>
                        ${ticket
                ? `<span class="text-gray-900">$${ticket.price}</span>`
                : "<span class=\"text-gray-400 text-xs\">No ticket</span>"
              }
                      </div>
                    `;
          })
          .join("")}
              </div>
              <p class="text-xs text-gray-500 mt-2">${selectedSeats.length} seat${selectedSeats.length > 1 ? "s" : ""}</p>
            `
        : "<p class=\"text-sm text-gray-400 italic\">No seats selected</p>"
      }
          </div>

          <div class="border-t border-gray-200 pt-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-semibold text-gray-700">Subtotal</span>
              <span class="text-lg font-bold text-gray-900">HKD ${totalPrice.toLocaleString()}</span>
            </div>
            <p class="text-xs text-gray-500">All prices include applicable taxes</p>
          </div>

          <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <div class="flex items-start gap-2">
              <i class="fas fa-shield-alt text-indigo-600 mt-0.5"></i>
              <div class="text-xs text-indigo-900">
                <p class="font-semibold mb-1">Secure Booking</p>
                <p>Your booking is protected and seats are reserved during checkout</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },
};
