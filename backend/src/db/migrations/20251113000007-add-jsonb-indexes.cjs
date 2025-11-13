/* eslint-disable */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS performances_pricing_sections_gin ON performances USING GIN ("pricingSections");'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS venues_layout_gin ON venues USING GIN ("layout");'
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "DROP INDEX IF EXISTS performances_pricing_sections_gin;"
    );
    await queryInterface.sequelize.query("DROP INDEX IF EXISTS venues_layout_gin;");
  },
};
