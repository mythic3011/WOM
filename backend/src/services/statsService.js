import { User, Performance, Booking, Venue } from "#models/index.js";
import { Op } from "sequelize";
import sequelize from "#config/database.js";

export const getDashboardStats = async () => {
  const totalUsers = await User.count();
  const totalPerformances = await Performance.count();
  const totalBookings = await Booking.count();
  const totalVenues = await Venue.count();

  const totalRevenue = await Booking.sum("totalAmount", {
    where: {
      paymentStatus: "paid",
    },
  });

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
    totalRevenue: totalRevenue || 0,
    recentBookings,
    upcomingPerformances: upcomingPerformances.length,
  };
};

export const getUserStats = async (userId) => {
  const totalBookings = await Booking.count({
    where: { userId },
  });

  const totalSpent = await Booking.sum("totalAmount", {
    where: {
      userId,
      paymentStatus: "paid",
    },
  });

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
    totalSpent: totalSpent || 0,
    upcomingBookings,
  };
};

export const getPerformanceStats = async (performanceId) => {
  const performance = await Performance.findByPk(performanceId);

  if (!performance) {
    throw new Error("Performance not found");
  }

  const totalBookings = await Booking.count({
    where: { performanceId },
  });

  const confirmedBookings = await Booking.count({
    where: {
      performanceId,
      status: "confirmed",
    },
  });

  const totalRevenue = await Booking.sum("totalAmount", {
    where: {
      performanceId,
      paymentStatus: "paid",
    },
  });

  const bookingsByStatus = await Booking.findAll({
    where: { performanceId },
    attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
    group: ["status"],
    raw: true,
  });

  return {
    totalBookings,
    confirmedBookings,
    totalRevenue: totalRevenue || 0,
    bookingsByStatus,
    availableSeats: performance.availableSeats,
    bookedSeats: performance.bookedSeats,
    totalSeats: performance.totalSeats,
    occupancyRate:
      performance.totalSeats > 0
        ? ((performance.bookedSeats / performance.totalSeats) * 100).toFixed(2)
        : 0,
  };
};
