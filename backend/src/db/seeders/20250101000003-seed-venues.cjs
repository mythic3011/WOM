module.exports = {
  async up(queryInterface, _Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert("venues", [
      {
        id: 1,
        name: "Hong Kong Cultural Centre Concert Hall",
        address: "10 Salisbury Road, Tsim Sha Tsui, Kowloon",
        capacity: 2019,
        facilities: JSON.stringify([
          "Orchestra Pit",
          "Pipe Organ",
          "Acoustic Shell",
          "Wheelchair Access",
          "Air Conditioning",
          "Cloakroom",
          "Restaurant",
          "Bar",
        ]),
        layout: JSON.stringify({
          sections: [
            {
              name: "Orchestra Stalls",
              rows: 8,
              seatsPerRow: 26,
              tier: "vip",
              startRow: "A",
            },
            {
              name: "Dress Circle",
              rows: 6,
              seatsPerRow: 30,
              tier: "premium",
              startRow: "I",
            },
            {
              name: "Grand Circle",
              rows: 4,
              seatsPerRow: 32,
              tier: "standard",
              startRow: "O",
            },
            {
              name: "Upper Circle",
              rows: 3,
              seatsPerRow: 28,
              tier: "economy",
              startRow: "S",
            },
          ],
        }),
        contact: "+852 2734 2009",
        status: "active",
        image: "/assets/mock/venue/venue-1.jpg",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 2,
        name: "Hong Kong City Hall Concert Hall",
        address: "5 Edinburgh Place, Central, Hong Kong",
        capacity: 1434,
        facilities: JSON.stringify([
          "Orchestra Pit",
          "Pipe Organ",
          "Acoustic Shell",
          "Wheelchair Access",
          "Air Conditioning",
          "Cloakroom",
          "Restaurant",
          "Bar",
          "Historical Venue",
          "Heritage Site",
        ]),
        layout: JSON.stringify({
          sections: [
            {
              name: "Stalls",
              rows: 17,
              seatsPerRow: 34,
              tier: "premium",
              startRow: "A",
            },
            {
              name: "Circle",
              rows: 8,
              seatsPerRow: 32,
              tier: "standard",
              startRow: "R",
            },
            {
              name: "Balcony",
              rows: 4,
              seatsPerRow: 26,
              tier: "economy",
              startRow: "Z",
            },
          ],
        }),
        contact: "+852 2921 2840",
        status: "active",
        image: "/assets/mock/venue/venue-2.jpg",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 3,
        name: "Hong Kong Academy for Performing Arts Concert Hall",
        address: "1 Gloucester Road, Wan Chai, Hong Kong",
        capacity: 821,
        facilities: JSON.stringify([
          "Orchestra Pit",
          "Acoustic Shell",
          "Wheelchair Access",
          "Air Conditioning",
          "Cloakroom",
          "Cafe",
          "Recording Facilities",
        ]),
        layout: JSON.stringify({
          sections: [
            {
              name: "Stalls",
              rows: 12,
              seatsPerRow: 28,
              tier: "premium",
              startRow: "A",
            },
            {
              name: "Circle",
              rows: 8,
              seatsPerRow: 26,
              tier: "standard",
              startRow: "M",
            },
          ],
        }),
        contact: "+852 2584 8500",
        status: "active",
        image: "/assets/mock/venue/venue-3.jpg",
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete("venues", null, {});
  },
};





