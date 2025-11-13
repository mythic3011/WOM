import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Booking = sequelize.define(
  "Booking",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    bookingReference: {
      type: DataTypes.STRING(20),
      unique: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    userEmail: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    performanceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "performances",
        key: "id",
      },
    },
    performanceTitle: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    venueId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    venueName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    showtimeId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    showtime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    seats: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    seatCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    bookingDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled", "completed"),
      defaultValue: "pending",
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM(
        "credit_card",
        "debit_card",
        "paypal",
        "bank_transfer",
        "cash"
      ),
      allowNull: true,
    },
    paymentStatus: {
      type: DataTypes.ENUM("pending", "paid", "failed", "refunded"),
      defaultValue: "pending",
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    customerInfo: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "bookings",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["bookingReference"],
      },
      {
        fields: ["userId"],
      },
      {
        fields: ["performanceId"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["bookingDate"],
      },
    ],
  }
);

export default Booking;
