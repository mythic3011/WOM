module.exports = {
  async up(queryInterface, Sequelize) {
    const venues = await queryInterface.sequelize.query(
      "SELECT id, layout FROM venues WHERE layout IS NOT NULL",
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const venue of venues) {
      const layout = venue.layout;
      
      if (!layout.sections || layout.sections.length === 0) {
        continue;
      }

      const hasAdvancedFeatures = layout.sections.some(section => 
        section.aisles || 
        section.seatNumbering || 
        section.rowsConfig
      );

      if (hasAdvancedFeatures) {
        continue;
      }

      const advancedLayout = {
        sections: layout.sections.map(section => ({
          name: section.name || "Section",
          rows: section.rows || 10,
          seatsPerRow: section.seatsPerRow || 20,
          tier: section.tier || "standard",
          startRow: section.startRow || "A",
          seatNumbering: {
            globalDirection: "L_TO_R",
            startNumber: 1,
            prefix: "",
            suffix: "",
            skipNumbers: [],
            skipSeatIndices: []
          },
          aisles: [],
          rowsConfig: [],
          horizontalAisles: []
        }))
      };

      await queryInterface.sequelize.query(
        "UPDATE venues SET layout = :layout WHERE id = :id",
        {
          replacements: {
            id: venue.id,
            layout: JSON.stringify(advancedLayout)
          }
        }
      );
    }
  },

  async down(queryInterface, Sequelize) {
    const venues = await queryInterface.sequelize.query(
      "SELECT id, layout FROM venues WHERE layout IS NOT NULL",
      { type: Sequelize.QueryTypes.SELECT }
    );

    for (const venue of venues) {
      const layout = venue.layout;
      
      if (!layout.sections) {
        continue;
      }

      const simpleLayout = {
        sections: layout.sections.map(section => ({
          name: section.name,
          rows: section.rows,
          seatsPerRow: section.seatsPerRow,
          tier: section.tier,
          startRow: section.startRow
        }))
      };

      await queryInterface.sequelize.query(
        "UPDATE venues SET layout = :layout WHERE id = :id",
        {
          replacements: {
            id: venue.id,
            layout: JSON.stringify(simpleLayout)
          }
        }
      );
    }
  }
};
