import { Op } from "sequelize";
import { Performance, Venue, Booking } from "#models/index.js";
import { buildSeatMapFromVenueLayout } from "#utils/seatMapBuilder.js";
import { buildWhereClause } from "./helpers/filters.js";
import { findEntityOrThrow, checkRelatedEntitiesCount } from "./helpers/entityHelpers.js";
import { buildPricingSectionsFromVenue } from "./helpers/pricingSectionBuilder.js";
import logger from "#config/logger.js";

const availabilityCache = new Map();
const CACHE_TTL = 30000;

export const updatePerformanceStatusByAvailability = async (performanceId) => {
  try {
    const performance = await Performance.findByPk(performanceId, {
      include: [{
        model: Venue,
        as: "venue",
      }],
    });

    if (!performance) {
      logger.warn(`Performance ${performanceId} not found for status update`);
      return null;
    }

    const totalSeats = performance.totalSeats || 0;
    if (totalSeats === 0) {
      return performance;
    }

    const bookings = await Booking.findAll({
      where: {
        performanceId: performance.id,
        status: { [Op.in]: ["confirmed", "pending"] },
      },
      attributes: ["showtimeId", "seatTickets"],
    });

    let totalBookedSeats = 0;
    const showtimeBookings = {};

    for (const booking of bookings) {
      const showtimeId = booking.showtimeId;
      const seats = booking.seatTickets || [];
      
      if (showtimeId) {
        if (!showtimeBookings[showtimeId]) {
          showtimeBookings[showtimeId] = new Set();
        }
        seats.forEach(seat => {
          const seatId = seat.seatId || seat.id;
          if (seatId) {
            showtimeBookings[showtimeId].add(seatId);
          }
        });
      }
      
      totalBookedSeats += seats.length;
    }

    const blockedSeatsSet = new Set();
    if (performance.seatMap?.blockedSeats) {
      Object.values(performance.seatMap.blockedSeats).forEach(blockedList => {
        if (Array.isArray(blockedList)) {
          blockedList.forEach(seatId => blockedSeatsSet.add(seatId));
        }
      });
    }
    const totalBlockedSeats = blockedSeatsSet.size;

    const availableSeats = Math.max(0, totalSeats - totalBookedSeats - totalBlockedSeats);
    const occupancyPercentage = totalSeats > 0 ? (totalBookedSeats + totalBlockedSeats) / totalSeats : 0;

    let newStatus = performance.status;
    const currentStatus = performance.status;

    if (availableSeats === 0) {
      newStatus = "sold_out";
    } else if (currentStatus === "sold_out" && availableSeats > 0) {
      newStatus = "on_sale";
    } else if (occupancyPercentage >= 0.9 && currentStatus !== "sold_out") {
      newStatus = "on_sale";
    }

    if (newStatus !== currentStatus) {
      await performance.update({
        status: newStatus,
        availableSeats,
        bookedSeats: totalBookedSeats,
      });

      logger.info(`Performance status auto-updated`, {
        performanceId: performance.id,
        oldStatus: currentStatus,
        newStatus,
        totalSeats,
        bookedSeats: totalBookedSeats,
        blockedSeats: totalBlockedSeats,
        availableSeats,
        occupancyPercentage: Math.round(occupancyPercentage * 100),
      });
    } else {
      await performance.update({
        availableSeats,
        bookedSeats: totalBookedSeats,
      });
    }

    return performance;
  } catch (error) {
    logger.error(`Error updating performance status by availability`, {
      performanceId,
      error: error.message,
    });
    throw error;
  }
};

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

  const performancesWithAvailability = await Promise.all(
    performances.map(async (performance) => {
      const perfData = performance.toJSON();

      if (perfData.showtimes && Array.isArray(perfData.showtimes)) {
        const bookings = await Booking.findAll({
          where: {
            performanceId: performance.id,
            status: { [Op.in]: ["confirmed", "pending"] },
          },
          attributes: ["showtimeId", "seats", "seatTickets"],
        });

        const showtimeBookings = {};
        for (const booking of bookings) {
          const showtimeId = booking.showtimeId;
          if (!showtimeId) {
            continue;
          }

          if (!showtimeBookings[showtimeId]) {
            showtimeBookings[showtimeId] = new Set();
          }

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

        perfData.showtimes = perfData.showtimes.map((showtime) => {
          const bookedSeats = showtimeBookings[showtime.id]?.size || 0;
          const totalSeats = perfData.totalSeats || 0;
          
          let blockedSeats = 0;
          if (perfData.seatMap?.blockedSeats?.[showtime.id]) {
            blockedSeats = perfData.seatMap.blockedSeats[showtime.id].length;
          }
          
          const availableSeats = Math.max(0, totalSeats - bookedSeats - blockedSeats);

          return {
            ...showtime,
            totalSeats,
            bookedSeats,
            blockedSeats,
            availableSeats,
          };
        });
      }

      return perfData;
    })
  );

  return performancesWithAvailability;
};

export const filterPerformances = async (filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.genre) {
    where.genre = { [Op.iLike]: `%${filters.genre}%` };
  }

  if (filters.venueId) {
    where.venueId = filters.venueId;
  }

  if (filters.search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${filters.search}%` } },
      { composer: { [Op.iLike]: `%${filters.search}%` } },
      { conductor: { [Op.iLike]: `%${filters.search}%` } },
      { orchestra: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

  if (filters.dateFrom) {
    where.date = {
      ...(where.date || {}),
      [Op.gte]: new Date(filters.dateFrom),
    };
  }

  if (filters.dateTo) {
    where.date = {
      ...(where.date || {}),
      [Op.lte]: new Date(filters.dateTo),
    };
  }

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

  return performances.map((p) => p.toJSON());
};

export const autocompletePerformances = async (query) => {
  const where = {
    [Op.or]: [
      { title: { [Op.iLike]: `%${query}%` } },
      { composer: { [Op.iLike]: `%${query}%` } },
    ],
  };

  const performances = await Performance.findAll({
    where,
    include: [
      {
        model: Venue,
        as: "venue",
        attributes: ["id", "name"],
      },
    ],
    attributes: ["id", "title", "composer"],
    limit: 10,
    order: [["date", "DESC"]],
  });

  return performances.map((p) => p.toJSON());
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

const generateShowtimeIds = (showtimes, performanceId) => {
  const timestamp = Date.now();
  return showtimes.map((showtime, index) => ({
    ...showtime,
    id: `showtime_${performanceId}_${timestamp}_${index}`,
  }));
};

export const createPerformance = async (performanceData) => {
  logger.info("Starting performance creation", {
    title: performanceData.title,
    venueId: performanceData.venueId,
    showtimeCount: performanceData.showtimes?.length || 0,
  });

  const venue = await findEntityOrThrow(Venue, performanceData.venueId, "Venue not found");

  const seatMap = buildSeatMapFromVenueLayout(venue.layout || {});
  const total = seatMap.total || 0;

  const { id: _id, ...dataWithoutId } = performanceData;

  const pricingSections = buildPricingSectionsFromVenue(
    venue.layout,
    performanceData.pricingSections || []
  );

  const performance = await Performance.create({
    ...dataWithoutId,
    venueName: venue.name,
    seatMap,
    pricingSections,
    totalSeats: total,
    availableSeats: total,
    bookedSeats: 0,
    seatMapVersion: 1,
  });

  logger.info("Performance created successfully", {
    performanceId: performance.id,
    title: performance.title,
    totalSeats: total,
  });

  if (performance.showtimes && Array.isArray(performance.showtimes) && performance.showtimes.length > 0) {
    logger.debug("Generating showtime IDs", {
      performanceId: performance.id,
      showtimeCount: performance.showtimes.length,
      showtimesBeforeGeneration: performance.showtimes.map(st => ({
        dateTime: st.dateTime,
        hasId: !!st.id,
      })),
    });

    const showtimesWithIds = generateShowtimeIds(performance.showtimes, performance.id);
    await performance.update({ showtimes: showtimesWithIds });
    
    logger.info("Showtime IDs generated and saved", {
      performanceId: performance.id,
      showtimeCount: showtimesWithIds.length,
      showtimeIds: showtimesWithIds.map(st => st.id),
      showtimes: showtimesWithIds.map(st => ({
        id: st.id,
        dateTime: st.dateTime,
        totalSeats: st.totalSeats,
        availableSeats: st.availableSeats,
      })),
    });
  } else {
    logger.warn("Performance created without showtimes", {
      performanceId: performance.id,
      title: performance.title,
    });
  }

  return performance;
};

export const updatePerformance = async (id, updates) => {
  const performance = await findEntityOrThrow(Performance, id, "Performance not found");

  const preservedFields = preserveTimeFields(updates, performance);

  if (updates.image === null || updates.image === "") {
    if (performance.image && performance.image.startsWith("/uploads/")) {
      await deletePerformanceImage(performance.image);
    }
    updates.image = null;
  }

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

  if (preservedFields.length > 0) {
    logger.info("Time fields preserved during update", {
      performanceId: id,
      preservedFields,
      action: "time_field_preservation",
    });
  }

  return performance;
};

const TIME_FIELDS = ["date"];

const preserveTimeFields = (updates, existingRecord) => {
  const preservedFields = [];

  for (const field of TIME_FIELDS) {
    if (!(field in updates) || updates[field] === undefined) {
      continue;
    }

    if (updates[field] === "" || updates[field] === null) {
      const existingValue = existingRecord[field];
      if (existingValue !== null && existingValue !== undefined) {
        updates[field] = existingValue;
        preservedFields.push({
          field,
          preservedValue: existingValue,
          reason: "empty_value_in_request",
        });
      }
    }
  }

  if (updates.showtimes && Array.isArray(updates.showtimes)) {
    const existingShowtimes = existingRecord.showtimes || [];

    updates.showtimes = updates.showtimes.map((showtime, index) => {
      const existingShowtime = existingShowtimes.find(
        (es) => es.id === showtime.id
      ) || existingShowtimes[index];

      if (!existingShowtime) {
        return showtime;
      }

      const preservedShowtime = { ...showtime };

      if (showtime.date === "" || showtime.date === null || showtime.date === undefined) {
        if (existingShowtime.date) {
          preservedShowtime.date = existingShowtime.date;
          preservedFields.push({
            field: `showtimes[${index}].date`,
            preservedValue: existingShowtime.date,
            reason: "empty_value_in_request",
          });
        }
      }

      if (showtime.time === "" || showtime.time === null || showtime.time === undefined) {
        if (existingShowtime.time) {
          preservedShowtime.time = existingShowtime.time;
          preservedFields.push({
            field: `showtimes[${index}].time`,
            preservedValue: existingShowtime.time,
            reason: "empty_value_in_request",
          });
        }
      }

      return preservedShowtime;
    });
  }

  return preservedFields;
};

export const deletePerformance = async (id) => {
  const performance = await findEntityOrThrow(Performance, id, "Performance not found");

  await checkRelatedEntitiesCount(
    Booking,
    { performanceId: id, status: { [Op.in]: ["confirmed", "pending"] } },
    "Cannot delete performance with active bookings"
  );

  // Delete associated image if it's an uploaded file
  if (performance.image && performance.image.startsWith("/uploads/")) {
    await deletePerformanceImage(performance.image);
  }

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

  let blockedSeatsCount = 0;
  if (performance.seatMap?.blockedSeats) {
    if (showtimeId && performance.seatMap.blockedSeats[showtimeId]) {
      blockedSeatsCount = performance.seatMap.blockedSeats[showtimeId].length;
    } else if (!showtimeId) {
      const blockedSeatsSet = new Set();
      Object.values(performance.seatMap.blockedSeats).forEach(blockedList => {
        if (Array.isArray(blockedList)) {
          blockedList.forEach(seatId => blockedSeatsSet.add(seatId));
        }
      });
      blockedSeatsCount = blockedSeatsSet.size;
    }
  }

  const bookedSeatsCount = bookedSeatIds.size;
  const availableSeats = Math.max(0, performance.totalSeats - bookedSeatsCount - blockedSeatsCount);
  const availabilityPercent =
    performance.totalSeats > 0 ? (availableSeats / performance.totalSeats) * 100 : 0;

  const result = {
    totalSeats: performance.totalSeats,
    bookedSeats: bookedSeatsCount,
    blockedSeats: blockedSeatsCount,
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

export const getSeatsWithBookingInfo = async (performanceId, showtimeId = null, userRole = "user") => {
  const performance = await Performance.findByPk(performanceId);

  if (!performance) {
    throw new Error("Performance not found");
  }

  const bookingsWhere = {
    performanceId,
    status: { [Op.in]: ["confirmed", "pending"] },
  };

  if (showtimeId) {
    bookingsWhere.showtimeId = showtimeId;
  }

  const bookings = await Booking.findAll({
    where: bookingsWhere,
    attributes: ["id", "seats", "seatTickets", "customerInfo", "createdAt", "userId"],
  });

  const seatDetailsMap = {};

  for (const booking of bookings) {
    const seats = booking.seatTickets || booking.seats || [];

    for (const seat of seats) {
      const seatId = typeof seat === "string" ? seat : seat.seatId;

      if (seatId) {
        const bookingInfo = {
          id: booking.id,
          orderId: booking.id,
          bookedAt: booking.createdAt,
        };

        if (userRole === "admin") {
          bookingInfo.customerName = booking.customerInfo?.name || "";
          bookingInfo.phone = booking.customerInfo?.phone || "";
        } else {
          bookingInfo.customerName = maskName(booking.customerInfo?.name || "");
          bookingInfo.phone = maskPhone(booking.customerInfo?.phone || "");
        }

        seatDetailsMap[seatId] = {
          status: "booked",
          booking: bookingInfo,
        };
      }
    }
  }

  return seatDetailsMap;
};

const maskName = (name) => {
  if (!name || name.length <= 2) {
    return "***";
  }
  return `${name.charAt(0)}${"*".repeat(name.length - 2)}${name.charAt(name.length - 1)}`;
};

const maskPhone = (phone) => {
  if (!phone || phone.length <= 4) {
    return "****";
  }
  return `${phone.substring(0, 2)}****${phone.substring(phone.length - 2)}`;
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

/**
 * Uploads a performance image file
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} Public URL for the uploaded image
 */
export const uploadPerformanceImage = async (file) => {
  const { validateImage, processPerformanceImage, saveImage } = await import("#utils/imageProcessor.js");
  const path = await import("path");
  const { fileURLToPath } = await import("url");
  const { dirname } = path;

  // Validate the image file
  validateImage(file);

  // Process the image (resize and optimize)
  const processedBuffer = await processPerformanceImage(file.buffer);

  // Determine upload directory
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const uploadDir = path.join(__dirname, "../../public/uploads/performances");

  // Save the processed image
  const { filename } = await saveImage(processedBuffer, uploadDir);

  // Return the public URL
  return `/uploads/performances/${filename}`;
};

/**
 * Deletes a performance image file from the server
 * @param {string} imageUrl - The image URL (e.g., /uploads/performances/abc123.jpg)
 * @returns {Promise<boolean>} True if deleted successfully
 */
export const deletePerformanceImage = async (imageUrl) => {
  try {
    const { deleteImage } = await import("#utils/imageProcessor.js");
    const path = await import("path");
    const { fileURLToPath } = await import("url");
    const { dirname } = path;

    // Only delete if it's an uploaded file (not an external URL)
    if (!imageUrl || !imageUrl.startsWith("/uploads/")) {
      return false;
    }

    // Determine the file path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const filepath = path.join(__dirname, "../../public", imageUrl);

    // Delete the file
    return await deleteImage(filepath);
  } catch (error) {
    // Log error but don't throw - deletion failure shouldn't block the update
    console.error(`Failed to delete image ${imageUrl}:`, error.message);
    return false;
  }
};

export const batchUpdateSeatStatus = async (performanceId, showtimeId, seatIds, status) => {
  const performance = await Performance.findByPk(performanceId);

  if (!performance) {
    throw new Error("Performance not found");
  }

  const seatMap = performance.seatMap || {};
  const indexMap = seatMap.indexMap || {};

  const normalizedSeatIds = seatIds.map(id => id.toLowerCase().trim());
  const invalidSeats = [];
  const bookedSeats = [];
  const validSeats = [];

  const bookings = await Booking.findAll({
    where: {
      performanceId,
      showtimeId,
      status: { [Op.in]: ["confirmed", "pending"] },
    },
    attributes: ["seatTickets"],
  });

  const bookedSeatIds = new Set();
  for (const booking of bookings) {
    const seats = booking.seatTickets || [];
    for (const seat of seats) {
      const bookedSeatId = (typeof seat === "string" ? seat : seat.seatId)?.toLowerCase();
      if (bookedSeatId) {
        bookedSeatIds.add(bookedSeatId);
      }
    }
  }

  for (const seatId of normalizedSeatIds) {
    if (!indexMap[seatId]) {
      invalidSeats.push(seatId);
      continue;
    }

    if (bookedSeatIds.has(seatId)) {
      bookedSeats.push(seatId);
    } else {
      validSeats.push(seatId);
    }
  }

  if (invalidSeats.length > 0) {
    throw new Error(`Invalid seat IDs: ${invalidSeats.join(", ")}`);
  }

  if (bookedSeats.length > 0) {
    throw new Error(`Cannot modify booked seats: ${bookedSeats.join(", ")}`);
  }

  const updatedSeatMap = JSON.parse(JSON.stringify(seatMap));

  if (!updatedSeatMap.blockedSeats) {
    updatedSeatMap.blockedSeats = {};
  }

  if (!updatedSeatMap.blockedSeats[showtimeId]) {
    updatedSeatMap.blockedSeats[showtimeId] = [];
  }

  const blockedSeatsForShowtime = new Set(updatedSeatMap.blockedSeats[showtimeId]);

  if (status === "blocked") {
    for (const seatId of validSeats) {
      blockedSeatsForShowtime.add(seatId);
    }
  } else if (status === "available") {
    for (const seatId of validSeats) {
      blockedSeatsForShowtime.delete(seatId);
    }
  }

  updatedSeatMap.blockedSeats[showtimeId] = Array.from(blockedSeatsForShowtime);

  await performance.update({
    seatMap: updatedSeatMap,
    seatMapVersion: (performance.seatMapVersion || 0) + 1,
  });

  await updatePerformanceStatusByAvailability(performanceId);

  const updatedSeats = validSeats.map(seatId => ({
    seatId,
    status,
    updatedAt: new Date().toISOString(),
  }));

  return {
    success: true,
    updated: validSeats.length,
    failed: 0,
    seats: updatedSeats,
  };
};
