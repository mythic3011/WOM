/**
 * @file bookingService.js
 * @description Booking management service handling seat reservations and ticket operations
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency sequelize - Database ORM
 * @dependency #models/Booking.js - Booking model
 * @dependency #models/Performance.js - Performance model
 * @dependency #models/User.js - User model
 * @see #controllers/bookingController.js
 */

import { Op } from "sequelize";
import sequelize from "#config/database.js";
import { Booking, Performance, User } from "#models/index.js";
import { NotFoundError, BadRequestError } from "#utils/errors.js";
import { resolveSeatId } from "#utils/seatMapBuilder.js";
import {
  getPerformanceAvailability,
  updatePerformanceAvailability,
  calculateSeatPrice,
  updatePerformanceStatusByAvailability,
} from "./performanceService.js";
import { buildWhereClause, applyDateRangeFilter } from "./helpers/filters.js";
import { findEntityOrThrow } from "./helpers/entityHelpers.js";
import { calculateTotalRevenue, groupByField } from "./helpers/statsHelpers.js";
import {
  validateSeatTicketStructure,
  parseSeatId,
  getDisplayLabel,
  transformToSeatTickets
} from "#utils/seatIdHelper.js";
import logger from "#config/logger.js";

/**
 * @returns {string}
 */
const generateBookingReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK${timestamp}${random}`;
};

/**
 * @param {Object} bookingData
 * @param {string} bookingData.performanceId
 * @param {string} bookingData.showtimeId
 * @param {Array} [bookingData.seats]
 * @param {Array} [bookingData.seatTickets]
 * @param {number} bookingData.amount
 * @param {string} bookingData.paymentMethod
 * @param {Object} bookingData.customerInfo
 * @param {string} userId
 * @returns {Promise<Object>}
 * @throws {BadRequestError}
 */
export const createBooking = async (bookingData, userId) => {
  const { performanceId, showtimeId, seats, seatTickets, amount, paymentMethod, customerInfo } =
    bookingData;

  logger.info("Booking request initiated", {
    userId,
    performanceId,
    showtimeId,
    seatCount: seatTickets?.length || seats?.length || 0,
    amount,
    paymentMethod,
  });

  logger.debug("Booking payload structure", {
    performanceId,
    showtimeId,
    hasSeatTickets: !!seatTickets,
    hasSeats: !!seats,
    seatTicketsCount: seatTickets?.length || 0,
    seatsCount: seats?.length || 0,
    amount,
    paymentMethod,
    hasCustomerInfo: !!customerInfo,
  });

  const performance = await findEntityOrThrow(
    Performance,
    performanceId,
    "Performance not found"
  );

  if (!performance.seatMap?.indexMap) {
    logger.error("Performance seat map not initialized", {
      performanceId,
      hasSeatMap: !!performance.seatMap,
      hasIndexMap: !!performance.seatMap?.indexMap,
    });
    throw new BadRequestError("Performance seat map not initialized");
  }

  const user = await findEntityOrThrow(User, userId, "User not found");

  // Handle both old format (seats) and new format (seatTickets)
  let finalSeatTickets;
  const resolvedSeats = [];

  if (seatTickets && Array.isArray(seatTickets) && seatTickets.length > 0) {
    logger.debug("Validating seatTickets structure", {
      performanceId,
      showtimeId,
      seatTicketsCount: seatTickets.length,
      seatTicketsSample: seatTickets[0],
    });

    if (!validateSeatTicketStructure(seatTickets)) {
      logger.error("Invalid seatTickets structure", {
        performanceId,
        showtimeId,
        seatTickets: JSON.stringify(seatTickets, null, 2),
        validationErrors: seatTickets.map((st, index) => {
          const errors = [];
          if (!st.seatId) {errors.push("missing seatId");}
          if (!st.seatLabel) {errors.push("missing seatLabel");}
          if (!st.ticketTypeId) {errors.push("missing ticketTypeId");}
          if (!st.ticketTypeName) {errors.push("missing ticketTypeName");}
          if (typeof st.price !== "number" || st.price <= 0) {errors.push("invalid price");}
          return errors.length > 0 ? { index, errors } : null;
        }).filter(e => e !== null),
      });
      throw new BadRequestError("Invalid seatTickets structure");
    }

    logger.debug("SeatTickets validation passed", {
      performanceId,
      showtimeId,
      seatTicketsCount: seatTickets.length,
    });

    // Resolve seats and calculate prices using pricing calculator
    finalSeatTickets = [];
    for (const seatTicket of seatTickets) {
      const resolved = resolveSeatId(performance.seatMap, seatTicket.seatId);
      if (!resolved) {
        throw new BadRequestError(`Seat ${seatTicket.seatId} not found in performance seat map`);
      }
      resolvedSeats.push(resolved);

      // Calculate price using pricing calculator if not provided
      let price = seatTicket.price;
      if (price === undefined || price === null) {
        try {
          price = calculateSeatPrice(seatTicket.seatId, performance);
        } catch (_error) {
          price = amount ? (amount / seatTickets.length) : 500;
        }
      }

      finalSeatTickets.push({
        ...seatTicket,
        price,
        basePrice: seatTicket.basePrice || price,
      });
    }
  } else if (seats && Array.isArray(seats) && seats.length > 0) {
    logger.debug("Processing old format (seats array)", {
      performanceId,
      showtimeId,
      seatsCount: seats.length,
      seatsSample: seats[0],
    });

    for (const seatInput of seats) {
      const seatId =
        typeof seatInput === "string" ? seatInput : seatInput.seatId || seatInput.fullId;
      const resolved = resolveSeatId(performance.seatMap, seatId);
      if (!resolved) {
        logger.error("Seat not found in performance seat map", {
          performanceId,
          showtimeId,
          seatId,
          seatInput,
        });
        throw new BadRequestError(`Seat ${seatId} not found in performance seat map`);
      }
      resolvedSeats.push(resolved);
    }

    logger.debug("Transforming seats to seatTickets format", {
      performanceId,
      showtimeId,
      resolvedSeatsCount: resolvedSeats.length,
    });

    finalSeatTickets = resolvedSeats.map(seat => {
      const parsed = parseSeatId(seat.fullId);

      let price;
      try {
        price = calculateSeatPrice(seat.fullId, performance);
      } catch (_error) {
        price = seat.price || (amount ? (amount / resolvedSeats.length) : 500);
      }

      return {
        seatId: seat.fullId,
        seatLabel: seat.label || getDisplayLabel(seat.fullId),
        ticketTypeId: seat.ticketTypeId || 'adult',
        ticketTypeName: seat.ticketTypeName || 'Adult',
        price,
        basePrice: seat.basePrice || price,
        section: parsed?.section,
        row: parsed?.row
      };
    });

    if (!validateSeatTicketStructure(finalSeatTickets)) {
      logger.error("Failed to transform seats to valid seatTickets structure", {
        performanceId,
        showtimeId,
        transformedSeatTickets: JSON.stringify(finalSeatTickets, null, 2),
      });
      throw new BadRequestError("Failed to transform seats to valid seatTickets structure");
    }

    logger.debug("Seats transformation successful", {
      performanceId,
      showtimeId,
      finalSeatTicketsCount: finalSeatTickets.length,
    });
  } else {
    logger.error("Neither seats nor seatTickets provided", {
      performanceId,
      showtimeId,
      hasSeats: !!seats,
      hasSeatTickets: !!seatTickets,
    });
    throw new BadRequestError("Either seats or seatTickets must be provided");
  }

  const calculatedTotal = finalSeatTickets.reduce((sum, st) => sum + st.price, 0);
  const totalAmount = parseFloat(calculatedTotal.toFixed(2));

  logger.debug("Calculated booking total", {
    performanceId,
    showtimeId,
    calculatedTotal: totalAmount,
    providedAmount: amount,
    seatTicketsCount: finalSeatTickets.length,
  });

  if (amount && Math.abs(totalAmount - amount) > 0.01) {
    logger.error("Total amount mismatch", {
      performanceId,
      showtimeId,
      calculatedTotal: totalAmount,
      providedAmount: amount,
      difference: Math.abs(totalAmount - amount),
    });
    throw new BadRequestError(
      `Total amount mismatch: calculated ${totalAmount} from seatTickets, but received ${amount}`
    );
  }

  const availability = await getPerformanceAvailability(performanceId, showtimeId);

  logger.debug("Checking seat availability", {
    performanceId,
    showtimeId,
    requestedSeats: finalSeatTickets.length,
    availableSeats: availability.availableSeats,
    totalSeats: availability.totalSeats,
    bookedSeats: availability.bookedSeats,
  });

  if (availability.availableSeats < finalSeatTickets.length) {
    logger.error("Not enough seats available", {
      performanceId,
      showtimeId,
      requestedSeats: finalSeatTickets.length,
      availableSeats: availability.availableSeats,
    });
    throw new BadRequestError("Not enough seats available");
  }

  // Check for already booked seats
  const existingBookings = await Booking.findAll({
    where: {
      performanceId,
      showtimeId,
      status: { [Op.in]: ["confirmed", "pending"] },
    },
    attributes: ["seats", "seatTickets"],
  });

  const bookedSeatIds = new Set();
  for (const booking of existingBookings) {
    // Check both old format (seats) and new format (seatTickets)
    if (booking.seatTickets && Array.isArray(booking.seatTickets)) {
      for (const seatTicket of booking.seatTickets) {
        if (seatTicket.seatId) {
          bookedSeatIds.add(seatTicket.seatId.toLowerCase());
        }
      }
    } else if (booking.seats && Array.isArray(booking.seats)) {
      for (const seat of booking.seats) {
        const seatId = typeof seat === "string" ? seat : seat.fullId || seat.seatId;
        if (seatId) {
          bookedSeatIds.add(seatId.toLowerCase());
        }
      }
    }
  }

  for (const seatTicket of finalSeatTickets) {
    if (bookedSeatIds.has(seatTicket.seatId.toLowerCase())) {
      logger.error("Seat already booked", {
        performanceId,
        showtimeId,
        seatId: seatTicket.seatId,
        requestedSeatIds: finalSeatTickets.map(st => st.seatId),
        bookedSeatIds: Array.from(bookedSeatIds),
      });
      throw new BadRequestError(`Seat ${seatTicket.seatId} is already booked`);
    }
  }

  logger.debug("All validation checks passed, creating booking", {
    performanceId,
    showtimeId,
    userId,
    seatCount: finalSeatTickets.length,
    totalAmount,
  });

  const booking = await Booking.create({
    bookingReference: generateBookingReference(),
    userId,
    userName: user.name,
    userEmail: user.email,
    performanceId,
    performanceTitle: performance.title,
    venueId: performance.venueId,
    venueName: performance.venueName,
    showtimeId,
    showtime: showtimeId
      ? performance.showtimes?.find((st) => st.id === showtimeId)?.dateTime
      : performance.date,
    seats: resolvedSeats,
    seatTickets: finalSeatTickets,
    seatCount: finalSeatTickets.length,
    amount: totalAmount,
    totalAmount: totalAmount,
    bookingDate: new Date(),
    status: "confirmed",
    paymentMethod,
    paymentStatus: "paid",
    customerInfo,
  });

  logger.info("Booking created successfully", {
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    performanceId,
    showtimeId,
    userId,
    seatCount: finalSeatTickets.length,
    totalAmount,
    paymentMethod,
  });

  await updatePerformanceAvailability(performanceId);
  await updatePerformanceStatusByAvailability(performanceId);

  logger.debug("Performance availability updated after booking", {
    bookingId: booking.id,
    performanceId,
  });

  return booking;
};

/**
 * @param {Object} [filters={}]
 * @param {string} [filters.status]
 * @param {string} [filters.dateFrom]
 * @param {string} [filters.dateTo]
 * @param {string} [filters.performanceId]
 * @param {string|null} [userId=null]
 * @param {boolean} [isAdmin=false]
 * @returns {Promise<Array>}
 */
export const getAllBookings = async (filters = {}, userId = null, isAdmin = false) => {
  const where = buildWhereClause(filters, {
    statusField: "status",
    dateField: "bookingDate",
    additionalFilters: (f) => {
      const additional = {};
      if (!isAdmin && userId) {
        additional.userId = userId;
      }
      if (f.performanceId) {
        additional.performanceId = f.performanceId;
      }
      return additional;
    },
  });

  const bookings = await Booking.findAll({
    where,
    include: [
      {
        model: Performance,
        as: "performance",
        attributes: ["id", "title", "date", "venueName"],
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"],
      },
    ],
    order: [["bookingDate", "DESC"]],
  });

  const processedBookings = bookings.map(booking => {
    const bookingData = booking.toJSON();

    if ((!bookingData.seatTickets || bookingData.seatTickets.length === 0) &&
      bookingData.seats && Array.isArray(bookingData.seats) && bookingData.seats.length > 0) {
      try {
        bookingData.seatTickets = transformToSeatTickets(bookingData.seats, bookingData.totalAmount);
      } catch (error) {
        console.error(`Failed to transform seats for booking ${bookingData.id}:`, error.message);
      }
    }

    return bookingData;
  });

  return processedBookings;
};

/**
 * @param {string} id
 * @param {string|null} [userId=null]
 * @param {boolean} [isAdmin=false]
 * @returns {Promise<Object>}
 * @throws {NotFoundError}
 */
export const getBookingById = async (id, userId = null, isAdmin = false) => {
  const where = { id };

  if (!isAdmin && userId) {
    where.userId = userId;
  }

  const booking = await Booking.findOne({
    where,
    include: [
      {
        model: Performance,
        as: "performance",
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email", "phone"],
      },
    ],
  });

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  const bookingData = booking.toJSON();

  if ((!bookingData.seatTickets || bookingData.seatTickets.length === 0) &&
    bookingData.seats && Array.isArray(bookingData.seats) && bookingData.seats.length > 0) {
    try {
      bookingData.seatTickets = transformToSeatTickets(bookingData.seats, bookingData.totalAmount);
    } catch (error) {
      console.error(`Failed to transform seats for booking ${bookingData.id}:`, error.message);
    }
  }

  return bookingData;
};

/**
 * @param {string} id
 * @param {Object} updates
 * @param {string} [updates.status]
 * @param {string|null} [userId=null]
 * @param {boolean} [isAdmin=false]
 * @returns {Promise<Object>}
 * @throws {NotFoundError|BadRequestError}
 */
export const updateBooking = async (id, updates, userId = null, isAdmin = false) => {
  const where = { id };

  if (!isAdmin && userId) {
    where.userId = userId;
  }

  const booking = await Booking.findOne({ where });

  if (!booking) {
    throw new NotFoundError("Booking not found");
  }

  if (booking.status === "cancelled") {
    throw new BadRequestError("Cannot update cancelled booking");
  }

  if (updates.status === "confirmed" && !isAdmin) {
    throw new BadRequestError("Only admin can confirm bookings");
  }

  await booking.update(updates);

  if (updates.status === "cancelled" || updates.status === "confirmed") {
    await updatePerformanceAvailability(booking.performanceId);
    await updatePerformanceStatusByAvailability(booking.performanceId);
  }

  return booking;
};

/**
 * @param {string} id
 * @param {string|null} [userId=null]
 * @param {boolean} [isAdmin=false]
 * @returns {Promise<Object>}
 */
export const cancelBooking = async (id, userId = null, isAdmin = false) =>
  updateBooking(
    id,
    { status: "cancelled", paymentStatus: "refunded" },
    userId,
    isAdmin
  );

/**
 * @param {string} id
 * @returns {Promise<Object>}
 * @throws {Error}
 */
export const confirmBooking = async (id) => {
  const booking = await findEntityOrThrow(Booking, id, "Booking not found");

  await booking.update({
    status: "confirmed",
    paymentStatus: "paid",
  });

  return booking;
};

/**
 * @param {Object} [filters={}]
 * @param {string} [filters.dateFrom]
 * @param {string} [filters.dateTo]
 * @returns {Promise<Object>}
 */
export const getBookingStats = async (filters = {}) => {
  const where = {};
  applyDateRangeFilter(where, "bookingDate", filters.dateFrom, filters.dateTo);

  const totalBookings = await Booking.count({ where });

  const bookingsByStatus = await groupByField(Booking, where, "status");

  const totalRevenue = await calculateTotalRevenue(Booking, where);

  return {
    totalBookings,
    bookingsByStatus,
    totalRevenue,
  };
};

/**
 * @param {string} ticketTypeId
 * @param {Object} [filters={}]
 * @param {string} [filters.status]
 * @param {string} [filters.dateFrom]
 * @param {string} [filters.dateTo]
 * @param {string} [filters.performanceId]
 * @returns {Promise<Array>}
 * @throws {BadRequestError}
 */
export const getBookingsByTicketType = async (ticketTypeId, filters = {}) => {
  if (!ticketTypeId || typeof ticketTypeId !== 'string') {
    throw new BadRequestError('ticketTypeId is required and must be a string');
  }

  const where = buildWhereClause(filters, {
    statusField: "status",
    dateField: "bookingDate",
    additionalFilters: (f) => {
      const additional = {};
      if (f.performanceId) {
        additional.performanceId = f.performanceId;
      }
      return additional;
    },
  });

  where[Op.and] = [
    ...(where[Op.and] || []),
    sequelize.literal(
      `"seatTickets" @> '[{"ticketTypeId": "${ticketTypeId}"}]'::jsonb`
    )
  ];

  const bookings = await Booking.findAll({
    where,
    include: [
      {
        model: Performance,
        as: "performance",
        attributes: ["id", "title", "date", "venueName"],
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"],
      },
    ],
    order: [["bookingDate", "DESC"]],
  });

  return bookings.map(booking => booking.toJSON());
};

/**
 * @param {Object} [filters={}]
 * @param {string} [filters.status]
 * @param {string} [filters.dateFrom]
 * @param {string} [filters.dateTo]
 * @param {string} [filters.performanceId]
 * @returns {Promise<Object>}
 */
export const getTicketTypeDistribution = async (filters = {}) => {
  const where = buildWhereClause(filters, {
    statusField: "status",
    dateField: "bookingDate",
    additionalFilters: (f) => {
      const additional = {};
      if (f.performanceId) {
        additional.performanceId = f.performanceId;
      }
      return additional;
    },
  });

  const bookings = await Booking.findAll({
    where,
    attributes: ["id", "seatTickets", "totalAmount"],
  });

  const distribution = new Map();
  let totalTickets = 0;
  let totalRevenue = 0;

  for (const booking of bookings) {
    const bookingData = booking.toJSON();

    let seatTickets = bookingData.seatTickets;

    if ((!seatTickets || seatTickets.length === 0) &&
      bookingData.seats && Array.isArray(bookingData.seats) && bookingData.seats.length > 0) {
      try {
        seatTickets = transformToSeatTickets(bookingData.seats, bookingData.totalAmount);
      } catch (error) {
        console.error(`Failed to transform seats for booking ${bookingData.id}:`, error.message);
        continue;
      }
    }

    if (seatTickets && Array.isArray(seatTickets)) {
      for (const seatTicket of seatTickets) {
        const ticketTypeId = seatTicket.ticketTypeId;
        const ticketTypeName = seatTicket.ticketTypeName || ticketTypeId;
        const price = seatTicket.price || 0;

        if (!distribution.has(ticketTypeId)) {
          distribution.set(ticketTypeId, {
            ticketTypeId,
            ticketTypeName,
            count: 0,
            revenue: 0,
          });
        }

        const entry = distribution.get(ticketTypeId);
        entry.count += 1;
        entry.revenue += price;

        totalTickets += 1;
        totalRevenue += price;
      }
    }
  }

  const byTicketType = {};
  for (const [ticketTypeId, data] of distribution.entries()) {
    byTicketType[ticketTypeId] = {
      ticketTypeId: data.ticketTypeId,
      ticketTypeName: data.ticketTypeName,
      count: data.count,
      revenue: parseFloat(data.revenue.toFixed(2)),
      percentage: totalTickets > 0 ? parseFloat(((data.count / totalTickets) * 100).toFixed(2)) : 0,
      revenuePercentage: totalRevenue > 0 ? parseFloat(((data.revenue / totalRevenue) * 100).toFixed(2)) : 0,
    };
  }

  return {
    byTicketType,
    totalTickets,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
  };
};
