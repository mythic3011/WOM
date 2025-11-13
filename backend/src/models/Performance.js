import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

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
  },
  {
    tableName: "performances",
    timestamps: true,
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

export default Performance;
