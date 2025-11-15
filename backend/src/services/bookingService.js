import { Booking, Performance, User, Venue } from "../models/index.js";
import { Op } from "sequelize";
import dayjs from "dayjs";
import { NotFoundError, BadRequestError } from "../utils/errors.js";
import sequelize from "../config/database.js";
import {
  getPerformanceAvailability,
  updatePerformanceAvailability,
} from "./performanceService.js";
import { resolveSeatId } from "../utils/seatMapBuilder.js";

const generateBookingReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK${timestamp}${random}`;
};

export const createBooking = async (bookingData, userId) => {
  const { performanceId, showtimeId, seats, amount, paymentMethod, customerInfo } =
    bookingData;

  const performance = await Performance.findByPk(performanceId);
  if (!performance) {
    throw new NotFoundError("Performance not found");
  }

  if (!performance.seatMap?.indexMap) {
    throw new BadRequestError("Performance seat map not initialized");
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const resolvedSeats = [];
  for (const seatInput of seats) {
    const seatId =
      typeof seatInput === "string" ? seatInput : seatInput.seatId || seatInput.fullId;
    const resolved = resolveSeatId(performance.seatMap, seatId);
    if (!resolved) {
      throw new BadRequestError(`Seat ${seatId} not found in performance seat map`);
    }
    resolvedSeats.push(resolved);
  }

  const availability = await getPerformanceAvailability(performanceId, showtimeId);

  if (availability.availableSeats < resolvedSeats.length) {
    throw new BadRequestError("Not enough seats available");
  }

  const existingBookings = await Booking.findAll({
    where: {
      performanceId,
      showtimeId,
      status: { [Op.in]: ["confirmed", "pending"] },
    },
  });

  const bookedSeatIds = new Set();
  existingBookings.forEach((booking) => {
    if (booking.seats && Array.isArray(booking.seats)) {
      booking.seats.forEach((seat) => {
        const seatId = typeof seat === "string" ? seat : seat.fullId || seat.seatId;
        if (seatId) {
          bookedSeatIds.add(seatId.toLowerCase());
        }
      });
    }
  });

  for (const resolved of resolvedSeats) {
    if (bookedSeatIds.has(resolved.fullId.toLowerCase())) {
      throw new BadRequestError(`Seat ${resolved.fullId} is already booked`);
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
    seats: resolvedSeats,
    seatCount: resolvedSeats.length,
    amount,
    totalAmount: amount,
    bookingDate: new Date(),
    status: "pending",
    paymentMethod,
    paymentStatus: "paid",
    customerInfo,
  });

  await updatePerformanceAvailability(performanceId);

  return booking;
};

export const getAllBookings = async (filters = {}, userId = null, isAdmin = false) => {
  const where = {};

  if (!isAdmin && userId) {
    where.userId = userId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.performanceId) {
    where.performanceId = filters.performanceId;
  }

  if (filters.dateFrom) {
    where.bookingDate = {
      ...(where.bookingDate || {}),
      [Op.gte]: new Date(filters.dateFrom),
    };
  }

  if (filters.dateTo) {
    where.bookingDate = {
      ...(where.bookingDate || {}),
      [Op.lte]: new Date(filters.dateTo),
    };
  }

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

  return bookings;
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

  return booking;
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
  const booking = await Booking.findByPk(id);

  if (!booking) {
    throw new Error("Booking not found");
  }

  await booking.update({
    status: "confirmed",
    paymentStatus: "paid",
  });

  return booking;
};

export const getBookingStats = async (filters = {}) => {
  const where = {};

  if (filters.dateFrom) {
    where.bookingDate = {
      ...(where.bookingDate || {}),
      [Op.gte]: new Date(filters.dateFrom),
    };
  }

  if (filters.dateTo) {
    where.bookingDate = {
      ...(where.bookingDate || {}),
      [Op.lte]: new Date(filters.dateTo),
    };
  }

  const totalBookings = await Booking.count({ where });

  const bookingsByStatus = await Booking.findAll({
    where,
    attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
    group: ["status"],
    raw: true,
  });

  const totalRevenue = await Booking.sum("totalAmount", {
    where: {
      ...where,
      paymentStatus: "paid",
    },
  });

  return {
    totalBookings,
    bookingsByStatus,
    totalRevenue: totalRevenue || 0,
  };
};
