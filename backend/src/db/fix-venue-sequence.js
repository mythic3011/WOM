import sequelize from "#config/database.js";

async function fixVenueSequence() {
  try {
    console.log("Fixing venue ID sequence...");
    
    const [results] = await sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('venues', 'id'),
        COALESCE((SELECT MAX(id) FROM venues), 0) + 1,
        false
      );
    `);
    
    console.log("Venue sequence fixed successfully");
    console.log("Next ID will be:", results[0].setval);
    
    process.exit(0);
  } catch (error) {
    console.error("Error fixing venue sequence:", error);
    process.exit(1);
  }
}

fixVenueSequence();
