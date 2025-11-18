import { DataTypes } from "sequelize";
import sequelize from "#config/database.js";

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
  }
);

export default Venue;
