import { Op } from "sequelize";
import { User, Performance, Booking, Venue } from "#models/index.js";
import { findEntityOrThrow } from "./helpers/entityHelpers.js";
import {
  calculateTotalRevenue,
  groupByField,
  calculateOccupancyRate,
} from "./helpers/statsHelpers.js";

export const getDashboardStats = async () => {
  const totalUsers = await User.count();
  const totalPerformances = await Performance.count();
  const totalBookings = await Booking.count();
  const totalVenues = await Venue.count();

  const totalRevenue = await calculateTotalRevenue(Booking, {});

  const recentBookings = await Booking.findAll({
    limit: 10,
    order: [["bookingDate", "DESC"]],
    include: [
      {
        model: Performance,
        as: "performance",
        attributes: ["id", "title"],
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"],
      },
    ],
  });

  const upcomingPerformances = await Performance.findAll({
    where: {
      date: {
        [Op.gte]: new Date(),
      },
      status: { [Op.in]: ["on_sale", "upcoming", "early_bird", "pre_order"] },
    },
    limit: 10,
    order: [["date", "ASC"]],
    include: [
      {
        model: Venue,
        as: "venue",
        attributes: ["name"],
      },
    ],
  });

  return {
    totalUsers,
    totalPerformances,
    totalBookings,
    totalVenues,
    totalRevenue,
    recentBookings,
    upcomingPerformances: upcomingPerformances.length,
  };
};

export const getUserStats = async (userId) => {
  const totalBookings = await Booking.count({
    where: { userId },
  });

  const totalSpent = await calculateTotalRevenue(Booking, { userId });

  const upcomingBookings = await Booking.count({
    where: {
      userId,
      status: { [Op.in]: ["confirmed", "pending"] },
    },
    include: [
      {
        model: Performance,
        as: "performance",
        where: {
          date: {
            [Op.gte]: new Date(),
          },
        },
      },
    ],
  });

  return {
    totalBookings,
    totalSpent,
    upcomingBookings,
  };
};

export const getPerformanceStats = async (performanceId) => {
  const performance = await findEntityOrThrow(
    Performance,
    performanceId,
    "Performance not found"
  );

  const totalBookings = await Booking.count({
    where: { performanceId },
  });

  const confirmedBookings = await Booking.count({
    where: {
      performanceId,
      status: "confirmed",
    },
  });

  const totalRevenue = await calculateTotalRevenue(Booking, { performanceId });

  const bookingsByStatus = await groupByField(Booking, { performanceId }, "status");

  return {
    totalBookings,
    confirmedBookings,
    totalRevenue,
    bookingsByStatus,
    availableSeats: performance.availableSeats,
    bookedSeats: performance.bookedSeats,
    totalSeats: performance.totalSeats,
    occupancyRate: calculateOccupancyRate(performance.bookedSeats, performance.totalSeats),
  };
};
