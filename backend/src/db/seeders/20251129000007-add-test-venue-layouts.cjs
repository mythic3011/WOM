module.exports = {
  async up(queryInterface, Sequelize) {
    if (process.env.NODE_ENV === "production") {
      console.log("Skipping test data seeder in production");
      return;
    }

    const now = new Date();

    const testVenues = [
      {
        name: "Test Venue - Empty Layout",
        address: "Test Address",
        capacity: 0,
        status: "inactive",
        facilities: JSON.stringify([]),
        layout: JSON.stringify({ sections: [] }),
        contact: null,
        image: null,
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Test Venue - Single Section",
        address: "Test Address",
        capacity: 100,
        status: "active",
        facilities: JSON.stringify(["WiFi"]),
        layout: JSON.stringify({
          sections: [
            {
              name: "Main",
              rows: 10,
              seatsPerRow: 10,
              tier: "standard",
              startRow: "A",
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
            }
          ]
        }),
        contact: null,
        image: "/assets/mock/venue/venue-7.jpg",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Test Venue - Complex Numbering",
        address: "Test Address",
        capacity: 200,
        status: "active",
        facilities: JSON.stringify([]),
        layout: JSON.stringify({
          sections: [
            {
              name: "Section A",
              rows: 10,
              seatsPerRow: 20,
              tier: "premium",
              startRow: "A",
              seatNumbering: {
                globalDirection: "R_TO_L",
                startNumber: 100,
                prefix: "P",
                suffix: "-A",
                skipNumbers: [113, 114],
                skipSeatIndices: [5, 14]
              },
              aisles: [
                {
                  type: "vertical",
                  mode: "afterSeat",
                  position: 10,
                  width: 2.0,
                  label: "Main Aisle"
                }
              ],
              rowsConfig: [
                {
                  rowLabel: "A",
                  direction: "L_TO_R",
                  startNumber: 1,
                  prefix: "VIP",
                  suffix: "",
                  skipNumbers: [],
                  skipSeatIndices: [],
                  paddingStart: 5,
                  paddingEnd: 5,
                  emptySeatIndices: [10]
                }
              ],
              horizontalAisles: [
                {
                  afterRow: "E",
                  height: 3
                }
              ]
            }
          ]
        }),
        contact: null,
        image: "/assets/mock/venue/venue-8.jpg",
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert("venues", testVenues);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("venues", {
      name: {
        [Sequelize.Op.like]: "Test Venue -%"
      }
    });
  }
};
