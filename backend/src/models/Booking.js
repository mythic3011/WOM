import { DataTypes } from "sequelize";
import sequelize from "#config/database.js";

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
      allowNull: true,
      defaultValue: null,
      comment: 'DEPRECATED: Use seatTickets instead. Kept for backward compatibility.',
    },
    seatTickets: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of seat-ticket assignments with compact structure',
      validate: {
        isValidStructure(value) {
          if (!Array.isArray(value)) {
            throw new Error('seatTickets must be an array');
          }

          // Allow empty array for initialization
          if (value.length === 0) {
            return;
          }

          // Track seat IDs to ensure one ticket per seat
          const seenSeatIds = new Set();

          value.forEach((seatTicket, index) => {
            // Required fields validation
            if (!seatTicket.seatId || typeof seatTicket.seatId !== 'string') {
              throw new Error(`seatTickets[${index}]: seatId is required and must be a string`);
            }
            if (!seatTicket.seatLabel || typeof seatTicket.seatLabel !== 'string') {
              throw new Error(`seatTickets[${index}]: seatLabel is required and must be a string`);
            }
            if (!seatTicket.ticketTypeId || typeof seatTicket.ticketTypeId !== 'string') {
              throw new Error(`seatTickets[${index}]: ticketTypeId is required and must be a string`);
            }
            if (!seatTicket.ticketTypeName || typeof seatTicket.ticketTypeName !== 'string') {
              throw new Error(`seatTickets[${index}]: ticketTypeName is required and must be a string`);
            }
            if (typeof seatTicket.price !== 'number' || seatTicket.price <= 0) {
              throw new Error(`seatTickets[${index}]: price is required and must be a positive number`);
            }

            // One ticket per seat validation
            if (seenSeatIds.has(seatTicket.seatId)) {
              throw new Error(`seatTickets[${index}]: duplicate seatId "${seatTicket.seatId}" - each seat must have exactly one ticket`);
            }
            seenSeatIds.add(seatTicket.seatId);

            // Optional fields type validation
            if (seatTicket.basePrice !== undefined && seatTicket.basePrice !== null && (typeof seatTicket.basePrice !== 'number' || seatTicket.basePrice <= 0)) {
              throw new Error(`seatTickets[${index}]: basePrice must be a positive number if provided`);
            }
            if (seatTicket.section !== undefined && seatTicket.section !== null && typeof seatTicket.section !== 'string') {
              throw new Error(`seatTickets[${index}]: section must be a string if provided`);
            }
            if (seatTicket.row !== undefined && seatTicket.row !== null && typeof seatTicket.row !== 'string') {
              throw new Error(`seatTickets[${index}]: row must be a string if provided`);
            }
          });
        }
      }
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
      {
        name: "bookings_seat_tickets_gin_idx",
        fields: ["seatTickets"],
        using: "gin",
      },
    ],
  }
);

export default Booking;
