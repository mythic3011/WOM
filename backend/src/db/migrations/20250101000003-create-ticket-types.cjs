module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("ticket_types", {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      discount: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 1.0,
      },
      eligibility: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      minGroupSize: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: "Minimum number of seats required for this ticket type (for group tickets)",
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

    await queryInterface.addIndex("ticket_types", ["isActive"]);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable("ticket_types");
  },
};
