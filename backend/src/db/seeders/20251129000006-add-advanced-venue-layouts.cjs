module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const existingVenues = await queryInterface.sequelize.query(
      "SELECT name FROM venues WHERE name IN ('Hong Kong Cultural Centre Concert Hall - Advanced', 'City Hall Theatre', 'Small Studio Theatre')",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingVenues.length > 0) {
      console.log("Advanced venue layouts already exist, skipping seeder");
      return;
    }

    const venues = [
      {
        name: "Hong Kong Cultural Centre Concert Hall - Advanced",
        address: "10 Salisbury Road, Tsim Sha Tsui, Kowloon",
        capacity: 2085,
        contact: "+852 2734 2009",
        status: "active",
        facilities: JSON.stringify([
          "WiFi",
          "Parking",
          "Wheelchair Access",
          "Air Conditioning",
          "Cloakroom"
        ]),
        layout: JSON.stringify({
          sections: [
            {
              name: "Orchestra Stalls",
              rows: 20,
              seatsPerRow: 32,
              tier: "premium",
              startRow: "A",
              seatNumbering: {
                globalDirection: "L_TO_R",
                startNumber: 1,
                prefix: "",
                suffix: "",
                skipNumbers: [13],
                skipSeatIndices: []
              },
              aisles: [
                {
                  type: "vertical",
                  mode: "afterSeat",
                  position: 16,
                  width: 1.5,
                  label: "Center"
                }
              ],
              rowsConfig: [],
              horizontalAisles: [
                {
                  afterRow: "J",
                  height: 2
                }
              ]
            },
            {
              name: "Grand Circle",
              rows: 8,
              seatsPerRow: 40,
              tier: "standard",
              startRow: "A",
              seatNumbering: {
                globalDirection: "L_TO_R",
                startNumber: 1,
                prefix: "GC",
                suffix: "",
                skipNumbers: [],
                skipSeatIndices: []
              },
              aisles: [
                {
                  type: "vertical",
                  mode: "afterSeat",
                  position: 10,
                  width: 1.0,
                  label: "Left"
                },
                {
                  type: "vertical",
                  mode: "afterSeat",
                  position: 30,
                  width: 1.0,
                  label: "Right"
                }
              ],
              rowsConfig: [],
              horizontalAisles: []
            },
            {
              name: "Upper Circle",
              rows: 6,
              seatsPerRow: 36,
              tier: "economy",
              startRow: "A",
              seatNumbering: {
                globalDirection: "L_TO_R",
                startNumber: 1,
                prefix: "UC",
                suffix: "",
                skipNumbers: [],
                skipSeatIndices: []
              },
              aisles: [
                {
                  type: "vertical",
                  mode: "afterSeat",
                  position: 18,
                  width: 1.5,
                  label: "Center"
                }
              ],
              rowsConfig: [],
              horizontalAisles: []
            }
          ]
        }),
        image: "/assets/mock/venue/venue-5.jpg",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "City Hall Theatre",
        address: "5 Edinburgh Place, Central, Hong Kong",
        capacity: 463,
        contact: "+852 2921 2840",
        status: "active",
        facilities: JSON.stringify([
          "WiFi",
          "Wheelchair Access",
          "Elevator",
          "Restrooms"
        ]),
        layout: JSON.stringify({
          sections: [
            {
              name: "Stalls",
              rows: 15,
              seatsPerRow: 26,
              tier: "standard",
              startRow: "A",
              seatNumbering: {
                globalDirection: "L_TO_R",
                startNumber: 1,
                prefix: "",
                suffix: "",
                skipNumbers: [13, 14],
                skipSeatIndices: []
              },
              aisles: [
                {
                  type: "vertical",
                  mode: "afterSeat",
                  position: 13,
                  width: 1.0,
                  label: "Center"
                }
              ],
              rowsConfig: [
                {
                  rowLabel: "A",
                  direction: "L_TO_R",
                  startNumber: 1,
                  prefix: "",
                  suffix: "",
                  skipNumbers: [],
                  skipSeatIndices: [],
                  paddingStart: 2,
                  paddingEnd: 2,
                  emptySeatIndices: []
                }
              ],
              horizontalAisles: []
            },
            {
              name: "Circle",
              rows: 8,
              seatsPerRow: 20,
              tier: "economy",
              startRow: "A",
              seatNumbering: {
                globalDirection: "L_TO_R",
                startNumber: 101,
                prefix: "C",
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
        image: "/assets/mock/venue/venue-6.jpg",
        createdAt: now,
        updatedAt: now
      },
      {
        name: "Small Studio Theatre",
        address: "123 Test Street, Hong Kong",
        capacity: 120,
        contact: "+852 1234 5678",
        status: "active",
        facilities: JSON.stringify(["WiFi", "Air Conditioning"]),
        layout: JSON.stringify({
          sections: [
            {
              name: "General Seating",
              rows: 10,
              seatsPerRow: 12,
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
        image: "/assets/mock/performances/mp-2.jpg",
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert("venues", venues);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("venues", {
      name: {
        [Sequelize.Op.in]: [
          "Hong Kong Cultural Centre Concert Hall - Advanced",
          "City Hall Theatre",
          "Small Studio Theatre"
        ]
      }
    });
  }
};
