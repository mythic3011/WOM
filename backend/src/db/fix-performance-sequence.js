import sequelize from "#config/database.js";

async function fixPerformanceSequence() {
  try {
    console.log("Fixing performance ID sequence...");
    
    const [results] = await sequelize.query(`
      SELECT setval(
        pg_get_serial_sequence('performances', 'id'),
        COALESCE((SELECT MAX(id) FROM performances), 0) + 1,
        false
      );
    `);
    
    console.log("Performance sequence fixed successfully");
    console.log("Next ID will be:", results[0].setval);
    
    process.exit(0);
  } catch (error) {
    console.error("Error fixing performance sequence:", error);
    process.exit(1);
  }
}

fixPerformanceSequence();
