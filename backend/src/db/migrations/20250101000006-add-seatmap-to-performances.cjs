module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("performances", "seatMap", {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {},
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("performances", "seatMap");
  },
};
