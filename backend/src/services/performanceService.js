import { Performance, Venue, Booking } from "#models/index.js";
import { Op } from "sequelize";
import { buildSeatMapFromVenueLayout, countSeats } from "#utils/seatMapBuilder.js";

export const getAllPerformances = async (filters = {}) => {
  const where = {};

  if (filters.status) {
    where.status = filters.status;
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

  return performances;
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
  const venue = await Venue.findByPk(performanceData.venueId);

  if (!venue) {
    throw new Error("Venue not found");
  }

  const seatMap = buildSeatMapFromVenueLayout(venue.layout || {});
  const total = seatMap.total || countSeats(seatMap) || 0;

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
  const performance = await Performance.findByPk(id);

  if (!performance) {
    throw new Error("Performance not found");
  }

  if (updates.venueId && updates.venueId !== performance.venueId) {
    const venue = await Venue.findByPk(updates.venueId);
    if (!venue) {
      throw new Error("Venue not found");
    }
    updates.venueName = venue.name;
    const seatMap = buildSeatMapFromVenueLayout(venue.layout || {});
    const total = seatMap.total || countSeats(seatMap) || 0;
    updates.seatMap = seatMap;
    updates.totalSeats = total;
    updates.availableSeats = Math.max(0, total - (performance.bookedSeats || 0));
    updates.seatMapVersion = (performance.seatMapVersion || 0) + 1;
  }

  await performance.update(updates);

  return performance;
};

export const deletePerformance = async (id) => {
  const performance = await Performance.findByPk(id);

  if (!performance) {
    throw new Error("Performance not found");
  }

  const bookingsCount = await Booking.count({
    where: {
      performanceId: id,
      status: { [Op.in]: ["confirmed", "pending"] },
    },
  });

  if (bookingsCount > 0) {
    throw new Error("Cannot delete performance with active bookings");
  }

  await performance.destroy();

  return true;
};

export const getPerformanceAvailability = async (id, showtimeId = null) => {
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
  });

  let bookedSeatsCount = 0;
  const bookedSeatIds = new Set();

  bookings.forEach((booking) => {
    if (booking.seats && Array.isArray(booking.seats)) {
      booking.seats.forEach((seat) => {
        const seatId = typeof seat === "string" ? seat : seat.seatId;
        if (seatId && !bookedSeatIds.has(seatId)) {
          bookedSeatIds.add(seatId);
          bookedSeatsCount++;
        }
      });
    }
  });

  const availableSeats = Math.max(0, performance.totalSeats - bookedSeatsCount);
  const availabilityPercent =
    performance.totalSeats > 0 ? (availableSeats / performance.totalSeats) * 100 : 0;

  return {
    totalSeats: performance.totalSeats,
    bookedSeats: bookedSeatsCount,
    availableSeats,
    availabilityPercent: Math.round(availabilityPercent * 100) / 100,
  };
};

export const updatePerformanceAvailability = async (performanceId) => {
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
  const newTotal = newSeatMap.total || countSeats(newSeatMap) || 0;
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
