import { Op } from "sequelize";
import { Performance, Venue, Booking } from "#models/index.js";
import { buildSeatMapFromVenueLayout } from "#utils/seatMapBuilder.js";
import { buildWhereClause } from "./helpers/filters.js";
import { findEntityOrThrow, checkRelatedEntitiesCount } from "./helpers/entityHelpers.js";

const availabilityCache = new Map();
const CACHE_TTL = 30000;

export const getAllPerformances = async (filters = {}) => {
  const where = buildWhereClause(filters, {
    statusField: "status",
    searchFields: ["title", "composer", "conductor", "orchestra"],
    dateField: "date",
    additionalFilters: (f) => (f.venueId ? { venueId: f.venueId } : {}),
  });

  const performances = await Performance.findAll({
    where,
    include: [
      {
        model: Venue,
        as: "venue",
        attributes: ["id", "name", "address", "capacity", "layout"],
      },
    ],
    order: [["date", "ASC"]],
  });

  // Calculate availability per showtime
  const performancesWithAvailability = await Promise.all(
    performances.map(async (performance) => {
      const perfData = performance.toJSON();

      if (perfData.showtimes && Array.isArray(perfData.showtimes)) {
        // Get all bookings for this performance
        const bookings = await Booking.findAll({
          where: {
            performanceId: performance.id,
            status: { [Op.in]: ["confirmed", "pending"] },
          },
          attributes: ["showtimeId", "seats", "seatTickets"],
        });

        // Calculate booked seats per showtime
        const showtimeBookings = {};
        for (const booking of bookings) {
          const showtimeId = booking.showtimeId;
          if (!showtimeId) continue;

          if (!showtimeBookings[showtimeId]) {
            showtimeBookings[showtimeId] = new Set();
          }

          // Handle both old seats format and new seatTickets format
          const seats = booking.seatTickets && booking.seatTickets.length > 0
            ? booking.seatTickets
            : booking.seats || [];

          for (const seat of seats) {
            const seatId = typeof seat === "string" ? seat : (seat.seatId || seat.id);
            if (seatId) {
              showtimeBookings[showtimeId].add(seatId);
            }
          }
        }

        // Add availability to each showtime
        perfData.showtimes = perfData.showtimes.map((showtime) => {
          const bookedSeats = showtimeBookings[showtime.id]?.size || 0;
          const totalSeats = perfData.totalSeats || 0;
          const availableSeats = Math.max(0, totalSeats - bookedSeats);

          return {
            ...showtime,
            totalSeats,
            bookedSeats,
            availableSeats,
          };
        });
      }

      return perfData;
    })
  );

  return performancesWithAvailability;
};

export const getPerformanceById = async (id) => {
  const performance = await Performance.findByPk(id, {
    include: [
      {
        model: Venue,
        as: "venue",
      },
    ],
  });

  if (!performance) {
    throw new Error("Performance not found");
  }

  return performance;
};

export const createPerformance = async (performanceData) => {
  const venue = await findEntityOrThrow(Venue, performanceData.venueId, "Venue not found");

  const seatMap = buildSeatMapFromVenueLayout(venue.layout || {});
  const total = seatMap.total || 0;

  const performance = await Performance.create({
    ...performanceData,
    venueName: venue.name,
    seatMap,
    totalSeats: total,
    availableSeats: total,
    bookedSeats: 0,
    seatMapVersion: 1,
  });

  return performance;
};

export const updatePerformance = async (id, updates) => {
  const performance = await findEntityOrThrow(Performance, id, "Performance not found");

  if (updates.venueId && updates.venueId !== performance.venueId) {
    const venue = await findEntityOrThrow(Venue, updates.venueId, "Venue not found");
    updates.venueName = venue.name;
    const seatMap = buildSeatMapFromVenueLayout(venue.layout || {});
    const total = seatMap.total || 0;
    updates.seatMap = seatMap;
    updates.totalSeats = total;
    updates.availableSeats = Math.max(0, total - (performance.bookedSeats || 0));
    updates.seatMapVersion = (performance.seatMapVersion || 0) + 1;
  }

  await performance.update(updates);

  return performance;
};

export const deletePerformance = async (id) => {
  const performance = await findEntityOrThrow(Performance, id, "Performance not found");

  await checkRelatedEntitiesCount(
    Booking,
    { performanceId: id, status: { [Op.in]: ["confirmed", "pending"] } },
    "Cannot delete performance with active bookings"
  );

  await performance.destroy();

  return true;
};

export const getPerformanceAvailability = async (id, showtimeId = null) => {
  const cacheKey = `${id}-${showtimeId || "all"}`;
  const cached = availabilityCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const performance = await Performance.findByPk(id);

  if (!performance) {
    throw new Error("Performance not found");
  }

  const bookingsWhere = {
    performanceId: id,
    status: { [Op.in]: ["confirmed", "pending"] },
  };

  if (showtimeId) {
    bookingsWhere.showtimeId = showtimeId;
  }

  const bookings = await Booking.findAll({
    where: bookingsWhere,
    attributes: ["seats"],
  });

  const bookedSeatIds = new Set();

  for (const booking of bookings) {
    if (booking.seats && Array.isArray(booking.seats)) {
      for (const seat of booking.seats) {
        const seatId = typeof seat === "string" ? seat : seat.seatId;
        if (seatId) {
          bookedSeatIds.add(seatId);
        }
      }
    }
  }

  const bookedSeatsCount = bookedSeatIds.size;
  const availableSeats = Math.max(0, performance.totalSeats - bookedSeatsCount);
  const availabilityPercent =
    performance.totalSeats > 0 ? (availableSeats / performance.totalSeats) * 100 : 0;

  const result = {
    totalSeats: performance.totalSeats,
    bookedSeats: bookedSeatsCount,
    availableSeats,
    availabilityPercent: Math.round(availabilityPercent * 100) / 100,
  };

  availabilityCache.set(cacheKey, {
    data: result,
    timestamp: Date.now(),
  });

  return result;
};

export const updatePerformanceAvailability = async (performanceId) => {
  const cacheKeyPattern = `${performanceId}-`;
  for (const key of availabilityCache.keys()) {
    if (key.startsWith(cacheKeyPattern)) {
      availabilityCache.delete(key);
    }
  }

  const availability = await getPerformanceAvailability(performanceId);

  await Performance.update(
    {
      availableSeats: availability.availableSeats,
      bookedSeats: availability.bookedSeats,
    },
    {
      where: { id: performanceId },
    }
  );

  return availability;
};

export const rebuildSeatMap = async (id) => {
  const performance = await Performance.findByPk(id, {
    include: [{ model: Venue, as: "venue" }],
  });

  if (!performance) {
    throw new Error("Performance not found");
  }

  const oldSeatMap = performance.seatMap || {};
  const oldTotal = performance.totalSeats || 0;
  const oldSeatIds = new Set(Object.keys(oldSeatMap.indexMap || {}));

  const newSeatMap = buildSeatMapFromVenueLayout(performance.venue.layout || {});
  const newTotal = newSeatMap.total || 0;
  const newSeatIds = new Set(Object.keys(newSeatMap.indexMap || {}));

  const added = [...newSeatIds].filter((id) => !oldSeatIds.has(id));
  const removed = [...oldSeatIds].filter((id) => !newSeatIds.has(id));
  const changed = added.length > 0 || removed.length > 0;

  await performance.update({
    seatMap: newSeatMap,
    totalSeats: newTotal,
    availableSeats: Math.max(0, newTotal - (performance.bookedSeats || 0)),
    seatMapVersion: (performance.seatMapVersion || 0) + 1,
  });

  return {
    beforeTotal: oldTotal,
    afterTotal: newTotal,
    addedSeatIds: added,
    removedSeatIds: removed,
    changed,
  };
};

/**
 * Calculates the price for a seat based on pricing tiers and zones
 * @param {string} seatId - The seat identifier (e.g., "orchestra-stalls-a1")
 * @param {Object} performance - The performance object with priceTiers, pricingZones, and seatMap
 * @returns {number} Price for the seat
 * 
 * Pricing resolution order:
 * 1. Check if seat is directly referenced in a pricing tier
 * 2. Check if seat is in a pricing zone
 * 3. Fall back to seat's tier default from pricingSections
 * 4. Fall back to default price of 500
 */
export const calculateSeatPrice = (seatId, performance) => {
  const { priceTiers = [], pricingZones = [], seatMap, pricingSections = [] } = performance;

  // Normalize seatId to lowercase for comparison
  const normalizedSeatId = seatId.toLowerCase();

  // Find the seat in the seat map
  const seat = seatMap?.indexMap?.[normalizedSeatId];
  if (!seat) {
    throw new Error(`Seat ${seatId} not found in seat map`);
  }

  // 1. Check if seat is directly referenced in a pricing tier
  for (const tier of priceTiers) {
    if (tier.seatRefs && Array.isArray(tier.seatRefs)) {
      // Normalize seat references for comparison
      const normalizedSeatRefs = tier.seatRefs.map(ref => ref.toLowerCase());
      if (normalizedSeatRefs.includes(normalizedSeatId)) {
        return tier.basePrice;
      }
    }
  }

  // 2. Check if seat is in a pricing zone
  for (const zone of pricingZones) {
    // Check if seat's section matches zone sections
    const sectionMatch = zone.sections && Array.isArray(zone.sections) &&
      zone.sections.includes(seat.sectionName);

    // Check if seat's row matches zone rows
    const rowMatch = zone.rows && Array.isArray(zone.rows) &&
      zone.rows.includes(seat.rowLabel);

    // Check if seat number is in zone's seat range
    let seatRangeMatch = true;
    if (zone.seatRange) {
      const seatNumber = seat.seatNumber;
      if (zone.seatRange.start !== undefined && seatNumber < zone.seatRange.start) {
        seatRangeMatch = false;
      }
      if (zone.seatRange.end !== undefined && seatNumber > zone.seatRange.end) {
        seatRangeMatch = false;
      }
    }

    // If all applicable criteria match, find the tier for this zone
    if (sectionMatch && (!zone.rows || rowMatch) && seatRangeMatch) {
      const tier = priceTiers.find(t => t.tier === zone.tier);
      if (tier) {
        return tier.basePrice;
      }
    }
  }

  // 3. Fall back to seat's tier default from pricingSections
  if (seat.tier && pricingSections.length > 0) {
    const pricingSection = pricingSections.find(ps => ps.tier === seat.tier);
    if (pricingSection && pricingSection.price) {
      return pricingSection.price;
    }
  }

  // 4. Fall back to default price
  return 500;
};
