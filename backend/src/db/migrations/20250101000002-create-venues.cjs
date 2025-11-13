module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("venues", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      capacity: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      facilities: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      layout: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: {},
      },
      contact: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("active", "inactive", "maintenance"),
        defaultValue: "active",
        allowNull: false,
      },
      image: {
        type: Sequelize.TEXT,
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

    await queryInterface.addIndex("venues", ["status"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("venues");
  },
};
