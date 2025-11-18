import { getTierBadge } from "@config/tierConfig.js";
import dayjs from "dayjs";

export const PerformanceDetails = {
  render(performance, venue, showtimes, ticketTypes) {
    const showtimesHtml = this.renderShowtimesSection(showtimes);
    const ticketTypesHtml = this.renderTicketTypesSection(ticketTypes);

    return `
      <div class="text-left space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <i class="fas fa-info-circle text-blue-600"></i>
              Basic Information
            </h3>
            <div class="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div><span class="font-medium">Composer:</span> ${performance.composer || "N/A"}</div>
              <div><span class="font-medium">Genre:</span> ${performance.genre || "N/A"}</div>
              <div><span class="font-medium">Duration:</span> ${performance.duration || "N/A"} minutes</div>
              <div><span class="font-medium">Venue:</span> ${venue?.name || venue || "N/A"}</div>
            </div>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <i class="fas fa-align-left text-purple-600"></i>
              Description
            </h3>
            <div class="bg-gray-50 rounded-lg p-4 text-sm">
              ${performance.description || "No description available"}
            </div>
          </div>
        </div>

        ${showtimesHtml}
        ${ticketTypesHtml}
      </div>
    `;
  },

  renderShowtimesSection(showtimes) {
    if (!showtimes || showtimes.length === 0) {
      return `
        <div>
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Showtimes</h3>
          <p class="text-sm text-gray-500 italic">No showtimes scheduled</p>
        </div>
      `;
    }

    return `
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <i class="fas fa-calendar text-green-600"></i>
          Showtimes (${showtimes.length})
        </h3>
        <div class="space-y-2">
          ${showtimes
        .map((st) => {
          const date = dayjs(st.dateTime || st.datetime).format("MMM D, YYYY");
          const time = dayjs(st.dateTime || st.datetime).format("h:mm A");
          const totalSeats = st.totalSeats || st.capacity || 0;
          const availableSeats = st.availableSeats !== undefined ? st.availableSeats : totalSeats;
          const bookedSeats = totalSeats - availableSeats;
          const availability = totalSeats > 0 ? Math.round((availableSeats / totalSeats) * 100) : 0;

          const availabilityColor = availability > 50 ? 'text-green-600' : availability > 20 ? 'text-yellow-600' : 'text-red-600';
          const availabilityBg = availability > 50 ? 'bg-green-100' : availability > 20 ? 'bg-yellow-100' : 'bg-red-100';

          return `
              <div class="bg-gray-50 rounded p-3 text-sm">
                <div class="flex items-center justify-between mb-2">
                  <div class="font-medium">${date} at ${time}</div>
                  <span class="text-xs px-2 py-1 rounded font-medium ${availabilityBg} ${availabilityColor}">
                    ${availability}% Available
                  </span>
                </div>
                <div class="flex items-center gap-4 text-xs text-gray-600">
                  <div><i class="fas fa-chair mr-1"></i>Total: ${totalSeats}</div>
                  <div><i class="fas fa-check-circle mr-1 text-green-600"></i>Available: ${availableSeats}</div>
                  <div><i class="fas fa-ticket-alt mr-1 text-gray-500"></i>Booked: ${bookedSeats}</div>
                </div>
              </div>
            `;
        })
        .join("")}
        </div>
      </div>
    `;
  },

  getSectionName(ticketType) {
    if (ticketType.section) return ticketType.section;
    if (ticketType.name) return ticketType.name;

    if (ticketType.tier) {
      const tierLabels = {
        vip: "VIP",
        premium: "Premium",
        standard: "Standard",
        economy: "Economy",
      };
      return tierLabels[ticketType.tier.toLowerCase()] || ticketType.tier;
    }

    return "General Admission";
  },

  renderTierBadge(tier) {
    const tierColors = {
      vip: "bg-yellow-100 text-yellow-800",
      premium: "bg-purple-100 text-purple-800",
      standard: "bg-green-100 text-green-800",
      economy: "bg-blue-100 text-blue-800",
    };

    const tierLabels = {
      vip: "VIP",
      premium: "Premium",
      standard: "Standard",
      economy: "Economy",
    };

    const color = tierColors[tier?.toLowerCase()] || tierColors.standard;
    const label = tierLabels[tier?.toLowerCase()] || tier || "Standard";

    return `<span class="text-xs px-2 py-1 rounded font-medium ${color}">${label}</span>`;
  },

  renderTicketTypesSection(ticketTypes) {
    if (!ticketTypes || ticketTypes.length === 0) {
      return `
        <div>
          <h3 class="text-sm font-semibold text-gray-700 mb-2">Ticket Types</h3>
          <p class="text-sm text-gray-500 italic">No ticket types defined</p>
        </div>
      `;
    }

    return `
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <i class="fas fa-ticket-alt text-yellow-600"></i>
          Ticket Types (${ticketTypes.length})
        </h3>
        <div class="space-y-2">
          ${ticketTypes
        .map(
          (tt) => `
            <div class="bg-gray-50 rounded p-3 flex items-center justify-between text-sm">
              <div class="flex items-center gap-2">
                <span class="font-medium">${this.getSectionName(tt)}</span>
                ${tt.tier ? this.renderTierBadge(tt.tier) : ""}
              </div>
              <div class="font-semibold text-gray-900">HKD $${tt.basePrice || tt.price || 0}</div>
            </div>
          `
        )
        .join("")}
        </div>
      </div>
    `;
  },
};
