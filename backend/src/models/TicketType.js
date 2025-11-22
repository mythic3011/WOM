import { DataTypes } from "sequelize";
import sequelize from "#config/database.js";

const TicketType = sequelize.define(
  "TicketType",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    discount: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 1.0,
    },
    eligibility: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    minGroupSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      comment: "Minimum number of seats required for this ticket type (for group tickets)",
    },
  },
  {
    tableName: "ticket_types",
    timestamps: true,
  }
);

export default TicketType;
