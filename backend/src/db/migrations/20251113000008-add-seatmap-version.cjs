module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("performances", "seatMapVersion", {
      type: Sequelize.INTEGER,
      defaultValue: 1,
      allowNull: false,
    });
    await queryInterface.addIndex("performances", ["seatMap"], {
      using: "GIN",
      name: "performances_seat_map_gin",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("performances", "performances_seat_map_gin");
    await queryInterface.removeColumn("performances", "seatMapVersion");
  },
};
