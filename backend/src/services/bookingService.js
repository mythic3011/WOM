import { Op } from "sequelize";
import sequelize from "#config/database.js";
import { Booking, Performance, User } from "#models/index.js";
import { NotFoundError, BadRequestError } from "#utils/errors.js";
import { resolveSeatId } from "#utils/seatMapBuilder.js";
import {
  getPerformanceAvailability,
  updatePerformanceAvailability,
  calculateSeatPrice,
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

const generateBookingReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK${timestamp}${random}`;
};

export const createBooking = async (bookingData, userId) => {
  const { performanceId, showtimeId, seats, seatTickets, amount, paymentMethod, customerInfo } =
    bookingData;

  const performance = await findEntityOrThrow(
    Performance,
    performanceId,
    "Performance not found"
  );

  if (!performance.seatMap?.indexMap) {
    throw new BadRequestError("Performance seat map not initialized");
  }

  const user = await findEntityOrThrow(User, userId, "User not found");

  // Handle both old format (seats) and new format (seatTickets)
  let finalSeatTickets;
  const resolvedSeats = [];

  if (seatTickets && Array.isArray(seatTickets) && seatTickets.length > 0) {
    // New format: validate seatTickets structure
    if (!validateSeatTicketStructure(seatTickets)) {
      console.error('Invalid seatTickets structure:', JSON.stringify(seatTickets, null, 2));
      throw new BadRequestError("Invalid seatTickets structure");
    }

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
    // Old format: transform seats to seatTickets
    for (const seatInput of seats) {
      const seatId =
        typeof seatInput === "string" ? seatInput : seatInput.seatId || seatInput.fullId;
      const resolved = resolveSeatId(performance.seatMap, seatId);
      if (!resolved) {
        throw new BadRequestError(`Seat ${seatId} not found in performance seat map`);
      }
      resolvedSeats.push(resolved);
    }

    // Transform old format to new format with pricing calculator
    finalSeatTickets = resolvedSeats.map(seat => {
      const parsed = parseSeatId(seat.fullId);

      // Calculate price using pricing calculator
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

    // Validate transformed structure
    if (!validateSeatTicketStructure(finalSeatTickets)) {
      throw new BadRequestError("Failed to transform seats to valid seatTickets structure");
    }
  } else {
    throw new BadRequestError("Either seats or seatTickets must be provided");
  }

  // Calculate totalAmount from seatTickets array
  const calculatedTotal = finalSeatTickets.reduce((sum, st) => sum + st.price, 0);
  const totalAmount = parseFloat(calculatedTotal.toFixed(2));

  // Validate that calculated total matches provided amount (with small tolerance for rounding)
  if (amount && Math.abs(totalAmount - amount) > 0.01) {
    throw new BadRequestError(
      `Total amount mismatch: calculated ${totalAmount} from seatTickets, but received ${amount}`
    );
  }

  const availability = await getPerformanceAvailability(performanceId, showtimeId);

  if (availability.availableSeats < finalSeatTickets.length) {
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
      throw new BadRequestError(`Seat ${seatTicket.seatId} is already booked`);
    }
  }

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
    seats: resolvedSeats, // Keep for backward compatibility during transition
    seatTickets: finalSeatTickets, // New optimized structure
    seatCount: finalSeatTickets.length,
    amount: totalAmount,
    totalAmount: totalAmount,
    bookingDate: new Date(),
    status: "confirmed",
    paymentMethod,
    paymentStatus: "paid",
    customerInfo,
  });

  await updatePerformanceAvailability(performanceId);

  return booking;
};

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

  // Process bookings to ensure seatTickets is populated
  // Prioritize seatTickets over seats, with fallback transformation
  const processedBookings = bookings.map(booking => {
    const bookingData = booking.toJSON();

    // If seatTickets is empty but seats exists, transform on-the-fly
    if ((!bookingData.seatTickets || bookingData.seatTickets.length === 0) &&
      bookingData.seats && Array.isArray(bookingData.seats) && bookingData.seats.length > 0) {
      try {
        bookingData.seatTickets = transformToSeatTickets(bookingData.seats, bookingData.totalAmount);
      } catch (error) {
        // If transformation fails, log error but continue
        console.error(`Failed to transform seats for booking ${bookingData.id}:`, error.message);
        // Keep original seats data
      }
    }

    // Ensure backward compatibility by including both fields during transition
    return bookingData;
  });

  return processedBookings;
};

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

  // Prioritize seatTickets over seats
  // If seatTickets is empty but seats exists, transform on-the-fly
  if ((!bookingData.seatTickets || bookingData.seatTickets.length === 0) &&
    bookingData.seats && Array.isArray(bookingData.seats) && bookingData.seats.length > 0) {
    try {
      bookingData.seatTickets = transformToSeatTickets(bookingData.seats, bookingData.totalAmount);
    } catch (error) {
      // If transformation fails, log error but continue
      console.error(`Failed to transform seats for booking ${bookingData.id}:`, error.message);
      // Keep original seats data
    }
  }

  // Ensure backward compatibility by including both fields during transition
  return bookingData;
};

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

  if (updates.status === "cancelled") {
    await updatePerformanceAvailability(booking.performanceId);
  }

  return booking;
};

export const cancelBooking = async (id, userId = null, isAdmin = false) =>
  updateBooking(
    id,
    { status: "cancelled", paymentStatus: "refunded" },
    userId,
    isAdmin
  );

export const confirmBooking = async (id) => {
  const booking = await findEntityOrThrow(Booking, id, "Booking not found");

  await booking.update({
    status: "confirmed",
    paymentStatus: "paid",
  });

  return booking;
};

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
 * Get bookings by ticket type ID using JSONB queries
 * 
 * This function uses PostgreSQL's JSONB containment operator (@>) with GIN indexes
 * for efficient querying of bookings that contain a specific ticket type.
 * 
 * @param {string} ticketTypeId - The ticket type ID to filter by (e.g., 'adult', 'student')
 * @param {Object} filters - Optional filters (dateFrom, dateTo, status, performanceId)
 * @returns {Promise<Array>} Array of bookings containing the specified ticket type
 * 
 * @example
 * // Get all bookings with student tickets
 * const studentBookings = await getBookingsByTicketType('student');
 * 
 * @example
 * // Get confirmed bookings with adult tickets for a specific performance
 * const adultBookings = await getBookingsByTicketType('adult', {
 *   status: 'confirmed',
 *   performanceId: 123
 * });
 * 
 * @example
 * // Get bookings with senior tickets within a date range
 * const seniorBookings = await getBookingsByTicketType('senior', {
 *   dateFrom: '2024-01-01',
 *   dateTo: '2024-12-31'
 * });
 */
export const getBookingsByTicketType = async (ticketTypeId, filters = {}) => {
  if (!ticketTypeId || typeof ticketTypeId !== 'string') {
    throw new BadRequestError('ticketTypeId is required and must be a string');
  }

  // Build base where clause with filters
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

  // Add JSONB containment query for ticket type
  // The @> operator checks if the left JSONB value contains the right JSONB value
  // This uses the GIN index on seatTickets for efficient querying
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
 * Get ticket type distribution across all bookings for analytics
 * 
 * This function aggregates ticket type data from all bookings to provide
 * insights into ticket sales patterns. It returns counts and revenue for
 * each ticket type.
 * 
 * @param {Object} filters - Optional filters (dateFrom, dateTo, status, performanceId)
 * @returns {Promise<Object>} Distribution object with ticket type statistics
 * 
 * @example
 * // Get overall ticket distribution
 * const distribution = await getTicketTypeDistribution();
 * // Returns:
 * // {
 * //   byTicketType: {
 * //     adult: { count: 150, revenue: 75000, percentage: 60 },
 * //     student: { count: 75, revenue: 26250, percentage: 30 },
 * //     senior: { count: 25, revenue: 8750, percentage: 10 }
 * //   },
 * //   totalTickets: 250,
 * //   totalRevenue: 110000
 * // }
 * 
 * @example
 * // Get ticket distribution for a specific performance
 * const perfDistribution = await getTicketTypeDistribution({
 *   performanceId: 123
 * });
 * 
 * @example
 * // Get ticket distribution for confirmed bookings in date range
 * const dateDistribution = await getTicketTypeDistribution({
 *   status: 'confirmed',
 *   dateFrom: '2024-01-01',
 *   dateTo: '2024-12-31'
 * });
 */
export const getTicketTypeDistribution = async (filters = {}) => {
  // Build where clause with filters
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

  // Fetch all bookings matching the filters
  const bookings = await Booking.findAll({
    where,
    attributes: ["id", "seatTickets", "totalAmount"],
  });

  // Initialize distribution map
  const distribution = new Map();
  let totalTickets = 0;
  let totalRevenue = 0;

  // Aggregate ticket type data from all bookings
  for (const booking of bookings) {
    const bookingData = booking.toJSON();

    // Handle both new format (seatTickets) and old format (seats) with fallback
    let seatTickets = bookingData.seatTickets;

    // If seatTickets is empty but seats exists, transform on-the-fly
    if ((!seatTickets || seatTickets.length === 0) &&
      bookingData.seats && Array.isArray(bookingData.seats) && bookingData.seats.length > 0) {
      try {
        seatTickets = transformToSeatTickets(bookingData.seats, bookingData.totalAmount);
      } catch (error) {
        // If transformation fails, skip this booking
        console.error(`Failed to transform seats for booking ${bookingData.id}:`, error.message);
        continue;
      }
    }

    // Process each seat ticket
    if (seatTickets && Array.isArray(seatTickets)) {
      for (const seatTicket of seatTickets) {
        const ticketTypeId = seatTicket.ticketTypeId;
        const ticketTypeName = seatTicket.ticketTypeName || ticketTypeId;
        const price = seatTicket.price || 0;

        // Get or initialize ticket type entry
        if (!distribution.has(ticketTypeId)) {
          distribution.set(ticketTypeId, {
            ticketTypeId,
            ticketTypeName,
            count: 0,
            revenue: 0,
          });
        }

        // Update counts and revenue
        const entry = distribution.get(ticketTypeId);
        entry.count += 1;
        entry.revenue += price;

        totalTickets += 1;
        totalRevenue += price;
      }
    }
  }

  // Convert map to object and calculate percentages
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
