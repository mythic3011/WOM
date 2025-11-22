// Import required modules for seat map generation
const { buildSeatMapFromVenueLayout } = require('../../utils/seatMapBuilder.js');

module.exports = {
  async up(queryInterface, _Sequelize) {
    const now = new Date();

    const generateFutureDate = (daysFromNow) => {
      const date = new Date();
      date.setDate(date.getDate() + daysFromNow);
      return date;
    };

    const generateShowtimeId = (performanceId, index) => {
      return `showtime_${performanceId}_${Date.now()}_${index}`;
    };

    // Fetch venue layouts to generate seat maps
    const venues = await queryInterface.sequelize.query(
      'SELECT id, layout FROM venues',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const venueLayouts = {};
    venues.forEach(venue => {
      venueLayouts[venue.id] = typeof venue.layout === 'string'
        ? JSON.parse(venue.layout)
        : venue.layout;
    });

    // Helper function to generate seat map for a venue
    const generateSeatMap = (venueId) => {
      const layout = venueLayouts[venueId];
      if (!layout) {
        return { sections: [], indexMap: {}, total: 0, version: 1 };
      }
      return buildSeatMapFromVenueLayout(layout);
    };

    // Generate seat maps for each venue
    const seatMap1 = generateSeatMap(1);
    const seatMap2 = generateSeatMap(2);

    await queryInterface.bulkInsert("performances", [
      {
        id: 1,
        title: "Symphony No. 9 - Beethoven",
        composer: "Ludwig van Beethoven",
        description:
          "Experience Beethoven's monumental Ninth Symphony featuring the iconic 'Ode to Joy' chorus. A triumphant celebration of human unity and brotherhood.",
        venueId: 1,
        venueName: "Hong Kong Cultural Centre Concert Hall",
        date: generateFutureDate(30),
        duration: 75,
        image: null,
        category: "Classical Music",
        subcategory: "Symphony",
        status: "on_sale",
        orchestra: "Hong Kong Philharmonic Orchestra",
        conductor: "Jaap van Zweden",
        soloists: JSON.stringify([
          { name: "Sarah Chang", instrument: "Soprano" },
          { name: "Emily D'Angelo", instrument: "Mezzo-soprano" },
        ]),
        program: JSON.stringify([
          {
            title: "Symphony No. 9 in D minor, Op. 125",
            composer: "Ludwig van Beethoven",
            movements: [
              "Allegro ma non troppo",
              "Molto vivace",
              "Adagio molto e cantabile",
              "Presto - Allegro assai",
            ],
          },
        ]),
        showtimes: JSON.stringify([
          {
            id: generateShowtimeId(1, 0),
            dateTime: generateFutureDate(30),
            venueName: "Hong Kong Cultural Centre Concert Hall",
            available: 1800,
            total: 2019,
            status: "on_sale",
            pricing: {
              sections: [
                { sectionName: "Orchestra Stalls", sectionCode: "OS", basePrice: 800 },
                { sectionName: "Dress Circle", sectionCode: "DC", basePrice: 600 },
                { sectionName: "Grand Circle", sectionCode: "GC", basePrice: 400 },
                { sectionName: "Upper Circle", sectionCode: "UC", basePrice: 200 },
              ],
            },
          },
        ]),
        pricingSections: JSON.stringify([
          { sectionName: "Orchestra Stalls", sectionCode: "OS", basePrice: 800 },
          { sectionName: "Dress Circle", sectionCode: "DC", basePrice: 600 },
          { sectionName: "Grand Circle", sectionCode: "GC", basePrice: 400 },
          { sectionName: "Upper Circle", sectionCode: "UC", basePrice: 200 },
        ]),
        seatMap: JSON.stringify(seatMap1),
        seatMapVersion: 1,
        tags: JSON.stringify(["Beethoven", "Symphony", "Choral", "Orchestra", "Classical"]),
        ageRestriction: null,
        dresscode: "Smart Casual",
        totalSeats: seatMap1.total,
        availableSeats: Math.max(0, seatMap1.total - 219),
        bookedSeats: 219,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        title: "Piano Concerto No. 1 - Tchaikovsky",
        composer: "Pyotr Ilyich Tchaikovsky",
        description:
          "Featuring renowned pianist performing Tchaikovsky's dramatic and powerful First Piano Concerto. An unforgettable evening of romantic music.",
        venueId: 1,
        venueName: "Hong Kong Cultural Centre Concert Hall",
        date: generateFutureDate(45),
        duration: 90,
        image: null,
        category: "Classical Music",
        subcategory: "Concerto",
        status: "early_bird",
        orchestra: "Hong Kong Philharmonic Orchestra",
        conductor: "Yan Pascal Tortelier",
        soloists: JSON.stringify([{ name: "Lang Lang", instrument: "Piano" }]),
        program: JSON.stringify([
          {
            title: "Piano Concerto No. 1 in B-flat minor, Op. 23",
            composer: "Pyotr Ilyich Tchaikovsky",
            movements: [
              "Allegro non troppo e molto maestoso",
              "Andantino semplice",
              "Allegro con fuoco",
            ],
          },
        ]),
        showtimes: JSON.stringify([
          {
            id: generateShowtimeId(2, 0),
            dateTime: generateFutureDate(45),
            venueName: "Hong Kong Cultural Centre Concert Hall",
            available: 2019,
            total: 2019,
            status: "early_bird",
            pricing: {
              sections: [
                { sectionName: "Orchestra Stalls", sectionCode: "OS", basePrice: 900 },
                { sectionName: "Dress Circle", sectionCode: "DC", basePrice: 700 },
                { sectionName: "Grand Circle", sectionCode: "GC", basePrice: 500 },
                { sectionName: "Upper Circle", sectionCode: "UC", basePrice: 300 },
              ],
            },
          },
        ]),
        pricingSections: JSON.stringify([
          { sectionName: "Orchestra Stalls", sectionCode: "OS", basePrice: 900 },
          { sectionName: "Dress Circle", sectionCode: "DC", basePrice: 700 },
          { sectionName: "Grand Circle", sectionCode: "GC", basePrice: 500 },
          { sectionName: "Upper Circle", sectionCode: "UC", basePrice: 300 },
        ]),
        seatMap: JSON.stringify(seatMap1),
        seatMapVersion: 1,
        tags: JSON.stringify(["Tchaikovsky", "Piano", "Concerto", "Romantic"]),
        ageRestriction: null,
        dresscode: "Formal",
        totalSeats: seatMap1.total,
        availableSeats: seatMap1.total,
        bookedSeats: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 3,
        title: "The Four Seasons - Vivaldi",
        composer: "Antonio Vivaldi",
        description:
          "A baroque masterpiece depicting the changing seasons through violin concertos. Perfect introduction to classical music for all ages.",
        venueId: 2,
        venueName: "Hong Kong City Hall Concert Hall",
        date: generateFutureDate(15),
        duration: 50,
        image: null,
        category: "Classical Music",
        subcategory: "Baroque",
        status: "on_sale",
        orchestra: "City Chamber Orchestra of Hong Kong",
        conductor: "Christoph Poppen",
        soloists: JSON.stringify([{ name: "Hilary Hahn", instrument: "Violin" }]),
        program: JSON.stringify([
          {
            title: "The Four Seasons",
            composer: "Antonio Vivaldi",
            movements: ["Spring", "Summer", "Autumn", "Winter"],
          },
        ]),
        showtimes: JSON.stringify([
          {
            id: generateShowtimeId(3, 0),
            dateTime: generateFutureDate(15),
            venueName: "Hong Kong City Hall Concert Hall",
            available: 1200,
            total: 1434,
            status: "on_sale",
            pricing: {
              sections: [
                { sectionName: "Stalls", sectionCode: "ST", basePrice: 500 },
                { sectionName: "Circle", sectionCode: "CI", basePrice: 350 },
                { sectionName: "Balcony", sectionCode: "BA", basePrice: 200 },
              ],
            },
          },
        ]),
        pricingSections: JSON.stringify([
          { sectionName: "Stalls", sectionCode: "ST", basePrice: 500 },
          { sectionName: "Circle", sectionCode: "CI", basePrice: 350 },
          { sectionName: "Balcony", sectionCode: "BA", basePrice: 200 },
        ]),
        seatMap: JSON.stringify(seatMap2),
        seatMapVersion: 1,
        tags: JSON.stringify(["Vivaldi", "Baroque", "Violin", "Four Seasons", "Family-Friendly"]),
        ageRestriction: "6+",
        dresscode: "Smart Casual",
        totalSeats: seatMap2.total,
        availableSeats: Math.max(0, seatMap2.total - 234),
        bookedSeats: 234,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete("performances", null, {});
  },
};





