module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("bookings", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      bookingReference: {
        type: Sequelize.STRING(20),
        unique: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      userName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      userEmail: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      performanceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "performances",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      performanceTitle: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      venueId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      venueName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      showtimeId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      showtime: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      seats: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      seatCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      totalAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      bookingDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      status: {
        type: Sequelize.ENUM("pending", "confirmed", "cancelled", "completed"),
        defaultValue: "pending",
        allowNull: false,
      },
      paymentMethod: {
        type: Sequelize.ENUM(
          "credit_card",
          "ailpay",
          "wechat",
          "paypal",
          "bank_transfer",
          "cash"
        ),
        allowNull: true,
      },
      paymentStatus: {
        type: Sequelize.ENUM("pending", "paid", "failed", "refunded"),
        defaultValue: "pending",
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      customerInfo: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex("bookings", ["userId"]);
    await queryInterface.addIndex("bookings", ["performanceId"]);
    await queryInterface.addIndex("bookings", ["status"]);
    await queryInterface.addIndex("bookings", ["bookingDate"]);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable("bookings");
  },
};
