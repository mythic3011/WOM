/**
 * @file Performance.js
 * @description Performance model definition for orchestral music concerts with seat management
 * @author A: LI Ning 25127563d
 * @author B: SHEK chinhei 25017482d
 * @dependency dayjs, sequelize
 * @see #config/database.js, #models/Venue.js, #models/Booking.js
 */

import dayjs from "dayjs";
import { DataTypes, Op } from "sequelize";
import sequelize from "#config/database.js";

/**
 * Performance model representing orchestral music concerts
 * Includes venue information, showtimes, pricing, seat management, and booking status
 * Supports multiple performance statuses and real-time seat availability tracking
 */
const Performance = sequelize.define(
  "Performance",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    composer: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    venueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "venues",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    venueName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    subcategory: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "upcoming",
        "on_sale",
        "sold_out",
        "early_bird",
        "pre_order",
        "completed",
        "cancelled"
      ),
      defaultValue: "upcoming",
      allowNull: false,
    },
    orchestra: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    conductor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    soloists: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    program: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    showtimes: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    pricingSections: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    seatMap: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    tags: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    ageRestriction: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    dresscode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    totalSeats: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    availableSeats: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    bookedSeats: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    seatMapVersion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    priceTiers: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    pricingZones: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    tableName: "performances",
    timestamps: true,
    scopes: {
      active: {
        where: {
          status: { [Op.in]: ["on_sale", "upcoming", "early_bird", "pre_order"] },
        },
      },
      upcoming: {
        where: {
          date: { [Op.gt]: new Date() },
        },
        order: [["date", "ASC"]],
      },
      past: {
        where: {
          date: { [Op.lt]: new Date() },
        },
        order: [["date", "DESC"]],
      },
      onSale: {
        where: {
          status: "on_sale",
          availableSeats: { [Op.gt]: 0 },
        },
      },
      withAvailability: {
        where: {
          availableSeats: { [Op.gt]: 0 },
        },
      },
      soldOut: {
        where: {
          [Op.or]: [
            { status: "sold_out" },
            { availableSeats: 0 },
          ],
        },
      },
    },
    indexes: [
      {
        fields: ["venueId"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["date"],
      },
    ],
  }
);

/**
 * Checks if performance has available seats for booking
 * @returns {boolean} True if available seats count is greater than zero
 */
Performance.prototype.hasAvailableSeats = function () {
  return this.availableSeats > 0;
};

/**
 * Calculates venue occupancy rate as percentage
 * @returns {number} Occupancy percentage (0-100), returns 0 if no seats
 */
Performance.prototype.getOccupancyRate = function () {
  if (!this.totalSeats || this.totalSeats === 0) { return 0; }
  const occupied = this.totalSeats - this.availableSeats;
  return Math.round((occupied / this.totalSeats) * 100);
};

/**
 * Checks if performance date has passed
 * @returns {boolean} True if performance date is in the past
 */
Performance.prototype.isExpired = function () {
  return dayjs(this.date).isBefore(dayjs());
};

/**
 * Checks if performance date is in the future
 * @returns {boolean} True if performance date is upcoming
 */
Performance.prototype.isUpcoming = function () {
  return dayjs(this.date).isAfter(dayjs());
};

/**
 * Checks if performance is available for booking
 * Requires available seats, upcoming date, and bookable status
 * @returns {boolean} True if performance can be booked
 */
Performance.prototype.canBook = function () {
  return (
    this.hasAvailableSeats() &&
    this.isUpcoming() &&
    ["on_sale", "early_bird", "pre_order"].includes(this.status)
  );
};

export default Performance;
