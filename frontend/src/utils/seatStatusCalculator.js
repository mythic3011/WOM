/**
 * Seat Status Calculator Utility
 *
 * Processes booking data and generates seat status maps for seat map visualization.
 * Provides color coding and tooltip formatting for booked seats.
 */

import { getSeatStatusColor } from "./colors.js";

/**
 * Build seat status map from bookings and blocked seats
 * Optimized for large venues with many bookings
 *
 * @param {Array} bookings - Array of booking objects with seatTickets
 * @param {Object} seatMap - Performance seat map configuration
 * @param {string} showtimeId - Optional showtime ID to get blocked seats for specific showtime
 * @returns {Map} Map of seatId -> {status, booking, seatTicket}
 */
export function buildSeatStatusMap(bookings, seatMap, showtimeId = null) {
  const statusMap = new Map();

  // Return empty map if no valid inputs
  if (!bookings || !Array.isArray(bookings)) {
    return statusMap;
  }

  // Pre-allocate map size hint for better performance with large datasets
  // Estimate: average 2-4 seats per booking
  const estimatedSize = bookings.length * 3;

  // Filter out cancelled bookings upfront to avoid processing them
  const activeBookings = bookings.filter(booking => booking.status !== "cancelled");

  // Process each booking
  for (let i = 0; i < activeBookings.length; i++) {
    const booking = activeBookings[i];
    const seatTickets = booking.seatTickets;

    // Skip if no seat tickets
    if (!seatTickets || !Array.isArray(seatTickets) || seatTickets.length === 0) {
      continue;
    }

    // Determine status once per booking (not per seat)
    let status = "booked";
    if (booking.status === "pending") {
      status = "reserved";
    } else if (booking.status === "confirmed" || booking.status === "completed") {
      status = "booked";
    }

    // Pre-create booking info object once per booking (not per seat)
    const bookingInfo = {
      bookingReference: booking.bookingReference,
      userName: booking.userName,
      userEmail: booking.userEmail,
      status: booking.status,
      bookingDate: booking.bookingDate || booking.createdAt,
    };

    // Process seat tickets with optimized loop
    for (let j = 0; j < seatTickets.length; j++) {
      const seatTicket = seatTickets[j];
      const seatId = seatTicket.seatId;

      // Skip invalid seat IDs
      if (!seatId) {
        continue;
      }

      // Store seat status with booking and ticket information
      // Use object literal for better V8 optimization
      statusMap.set(seatId, {
        status,
        booking: bookingInfo,
        seatTicket: {
          seatId: seatTicket.seatId,
          seatLabel: seatTicket.seatLabel,
          ticketTypeId: seatTicket.ticketTypeId,
          ticketTypeName: seatTicket.ticketTypeName,
          price: seatTicket.price,
          basePrice: seatTicket.basePrice,
          section: seatTicket.section,
          row: seatTicket.row,
        },
      });
    }
  }

  // Add blocked seats from seatMap
  if (seatMap && seatMap.blockedSeats && showtimeId) {
    const blockedSeatsForShowtime = seatMap.blockedSeats[showtimeId];

    if (blockedSeatsForShowtime && Array.isArray(blockedSeatsForShowtime)) {
      for (let i = 0; i < blockedSeatsForShowtime.length; i++) {
        const seatId = blockedSeatsForShowtime[i];

        // Only mark as blocked if not already booked/reserved
        if (!statusMap.has(seatId)) {
          statusMap.set(seatId, {
            status: "blocked",
            booking: null,
            seatTicket: null,
          });
        }
      }
    }
  }

  return statusMap;
}

/**
 * Get seat color based on status
 *
 * @param {string} status - Seat status (available, booked, reserved, blocked)
 * @returns {string} Color code (RGB string)
 */
export function getSeatColor(status) {
  // Map status to color using existing color utility
  const colorMap = {
    available: "available",
    booked: "booked",
    reserved: "reserved",
    blocked: "blocked",
  };

  const mappedStatus = colorMap[status] || "available";
  return getSeatStatusColor(mappedStatus);
}

/**
 * Format booking tooltip content
 *
 * @param {Object} booking - Booking object with reference, customer info
 * @param {Object} seatTicket - Seat ticket object with ticket type and price
 * @returns {string} HTML tooltip content
 */
export function formatBookingTooltip(booking, seatTicket, displayStatus) {
  if (!booking || !seatTicket) {
    return "";
  }

  const bookingRef = booking.bookingReference || booking.id || "N/A";
  const customerName = booking.userName || booking.customerName || "Unknown";
  const ticketType = seatTicket.ticketTypeName || "Standard";
  const price = seatTicket.price || 0;
  const seatLabel = seatTicket.seatLabel || "";
  const bookingStatus = booking.status || "confirmed";

  const formattedPrice = `HKD ${price.toFixed(2)}`;

  const statusColors = {
    confirmed: "green",
    pending: "amber",
    cancelled: "red",
    completed: "blue"
  };
  const statusColor = statusColors[bookingStatus] || "gray";

  let expirationHtml = "";
  if (displayStatus === "reserved" && bookingStatus === "pending") {
    const reservationTimeout = 15;
    const bookingDate = booking.bookingDate ? new Date(booking.bookingDate) : new Date();
    const expirationDate = new Date(bookingDate.getTime() + reservationTimeout * 60000);
    const now = new Date();
    const minutesRemaining = Math.max(0, Math.floor((expirationDate - now) / 60000));

    const formattedExpiration = expirationDate.toLocaleString("en-HK", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const expirationColor = minutesRemaining <= 5 ? "red" : "amber";

    expirationHtml = `
      <div class="flex justify-between gap-3 pt-1 border-t border-gray-200">
        <span class="text-gray-500">Expires At:</span>
        <span class="font-medium text-${expirationColor}-600">${formattedExpiration}</span>
      </div>
      <div class="flex justify-between gap-3">
        <span class="text-gray-500">Time Left:</span>
        <span class="font-semibold text-${expirationColor}-600">${minutesRemaining} min</span>
      </div>
    `;
  }

  const tooltipHTML = `
    <div class="booking-tooltip text-left text-sm">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-3 h-3 rounded-full bg-${statusColor}-500"></div>
        <div class="font-semibold text-${statusColor}-700 capitalize">${displayStatus || bookingStatus}</div>
      </div>
      <div class="text-xs space-y-1">
        <div class="flex justify-between gap-3">
          <span class="text-gray-500">Seat:</span>
          <span class="font-medium">${seatLabel}</span>
        </div>
        <div class="flex justify-between gap-3">
          <span class="text-gray-500">Booking ID:</span>
          <span class="font-mono text-xs font-medium">${bookingRef}</span>
        </div>
        <div class="flex justify-between gap-3">
          <span class="text-gray-500">Customer:</span>
          <span class="font-medium">${customerName}</span>
        </div>
        <div class="flex justify-between gap-3">
          <span class="text-gray-500">Ticket Type:</span>
          <span class="font-medium">${ticketType}</span>
        </div>
        <div class="flex justify-between gap-3">
          <span class="text-gray-500">Price:</span>
          <span class="font-semibold text-${statusColor}-600">${formattedPrice}</span>
        </div>
        ${expirationHtml}
      </div>
    </div>
  `.trim();

  return tooltipHTML;
}

/**
 * Get seat status from status map
 *
 * @param {Map} statusMap - Seat status map
 * @param {string} seatId - Seat identifier
 * @returns {Object|null} Seat status object or null if not found
 */
export function getSeatStatus(statusMap, seatId) {
  if (!statusMap || !seatId) {
    return null;
  }

  return statusMap.get(seatId) || null;
}

/**
 * Check if seat is available
 *
 * @param {Map} statusMap - Seat status map
 * @param {string} seatId - Seat identifier
 * @returns {boolean} True if seat is available
 */
export function isSeatAvailable(statusMap, seatId) {
  const seatStatus = getSeatStatus(statusMap, seatId);
  return !seatStatus || seatStatus.status === "available";
}

/**
 * Check if seat is booked
 *
 * @param {Map} statusMap - Seat status map
 * @param {string} seatId - Seat identifier
 * @returns {boolean} True if seat is booked
 */
export function isSeatBooked(statusMap, seatId) {
  const seatStatus = getSeatStatus(statusMap, seatId);
  return seatStatus && (seatStatus.status === "booked" || seatStatus.status === "reserved");
}

/**
 * Get all booked seats from status map
 *
 * @param {Map} statusMap - Seat status map
 * @returns {Array} Array of seat IDs that are booked
 */
export function getBookedSeats(statusMap) {
  if (!statusMap) {
    return [];
  }

  const bookedSeats = [];

  statusMap.forEach((seatStatus, seatId) => {
    if (seatStatus.status === "booked" || seatStatus.status === "reserved") {
      bookedSeats.push(seatId);
    }
  });

  return bookedSeats;
}

/**
 * Calculate booking statistics from status map
 *
 * @param {Map} statusMap - Seat status map
 * @param {number} totalSeats - Total number of seats in venue
 * @returns {Object} Statistics object with counts and percentages
 */
export function calculateBookingStatistics(statusMap, totalSeats) {
  const bookedSeats = getBookedSeats(statusMap);
  const bookedCount = bookedSeats.length;

  let blockedCount = 0;
  if (statusMap) {
    statusMap.forEach((seatStatus) => {
      if (seatStatus.status === "blocked") {
        blockedCount++;
      }
    });
  }

  const availableCount = Math.max(0, totalSeats - bookedCount - blockedCount);
  const occupancyPercentage = totalSeats > 0
    ? Math.round(((bookedCount + blockedCount) / totalSeats) * 100)
    : 0;

  return {
    totalSeats,
    bookedSeats: bookedCount,
    blockedSeats: blockedCount,
    availableSeats: availableCount,
    occupancyPercentage,
    isHighOccupancy: occupancyPercentage > 80,
  };
}

export function buildSeatDetails(seatMap, statusMap, pricingSections) {
  const seatDetails = {};

  if (!seatMap?.indexMap) {
    return seatDetails;
  }

  const pricingArray = Array.isArray(pricingSections) ? pricingSections : [];

  Object.entries(seatMap.indexMap).forEach(([fullId, seatData]) => {
    const seatStatus = statusMap?.get(fullId);
    const sectionName = seatData.sectionName || seatData.section;
    const tier = seatData.tier;

    let price = 0;
    const pricing = pricingArray.find(ps => {
      const byName = ps.sectionName && sectionName &&
        ps.sectionName.toLowerCase() === sectionName.toLowerCase();
      const byTier = ps.tier && tier &&
        ps.tier.toLowerCase() === tier.toLowerCase();
      return byName || byTier;
    });

    if (pricing) {
      price = parseFloat(pricing.basePrice) || 0;
    }

    seatDetails[fullId] = {
      status: seatStatus?.status || "available",
      booking: seatStatus?.booking,
      seatTicket: seatStatus?.seatTicket,
      tier: tier,
      section: sectionName,
      price: price,
    };
  });

  return seatDetails;
}
