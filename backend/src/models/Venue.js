import { DataTypes } from "sequelize";
import sequelize from "#config/database.js";
import { buildSeatMapFromVenueLayout } from "#utils/seatMapBuilder.js";

const Venue = sequelize.define(
  "Venue",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    facilities: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    contact: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "maintenance"),
      defaultValue: "active",
      allowNull: false,
    },
    image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    layout: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
  },
  {
    tableName: "venues",
    timestamps: true,
    hooks: {
      afterUpdate: async (venue, options) => {
        if (venue.changed('layout')) {
          const { Performance } = await import("#models/index.js");

          const performances = await Performance.findAll({
            where: { venueId: venue.id }
          });

          for (const perf of performances) {
            const newSeatMap = buildSeatMapFromVenueLayout(venue.layout);
            await perf.update({
              seatMap: newSeatMap,
              totalSeats: newSeatMap.total,
              availableSeats: Math.max(0, newSeatMap.total - (perf.bookedSeats || 0)),
              seatMapVersion: (perf.seatMapVersion || 0) + 1
            }, { hooks: false });
          }
        }
      }
    }
  }
);

export default Venue;
