module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("performances", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      composer: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      venueId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "venues",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      venueName: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      image: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      subcategory: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.STRING,
        allowNull: true,
      },
      conductor: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      soloists: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      program: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      showtimes: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      pricingSections: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      tags: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      ageRestriction: {
        type: Sequelize.STRING(10),
        allowNull: true,
      },
      dresscode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      totalSeats: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      availableSeats: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      bookedSeats: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
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

    await queryInterface.addIndex("performances", ["venueId"]);
    await queryInterface.addIndex("performances", ["status"]);
    await queryInterface.addIndex("performances", ["date"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("performances");
  },
};
