module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE venues 
      ADD CONSTRAINT layout_must_have_sections 
      CHECK (
        layout IS NULL OR 
        jsonb_typeof(layout->'sections') = 'array'
      );
    `);

    await queryInterface.addIndex("venues", ["layout"], {
      using: "GIN",
      name: "venues_layout_gin_idx"
    });

    await queryInterface.sequelize.query(`
      COMMENT ON COLUMN venues.layout IS 
      'JSONB structure containing sections array with seating configuration';
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint("venues", "layout_must_have_sections");
    await queryInterface.removeIndex("venues", "venues_layout_gin_idx");
  }
};
