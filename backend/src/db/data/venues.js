import { faker } from "@faker-js/faker";

const generateAdditionalVenues = () => {
  faker.seed(54321);
  const venues = [];

  const facilityOptions = [
    "Orchestra Pit",
    "Pipe Organ",
    "Acoustic Shell",
    "Wheelchair Access",
    "Air Conditioning",
    "Cloakroom",
    "Restaurant",
    "Bar",
    "Cafe",
    "Recording Facilities",
    "Parking",
    "Wi-Fi",
    "Coat Check",
    "VIP Lounge",
  ];

  const sectionNames = [
    ["Orchestra", "Mezzanine", "Balcony", "Gallery"],
    ["Stalls", "Dress Circle", "Upper Circle"],
    ["Lower Level", "Main Floor", "Upper Level"],
    ["Front Section", "Middle Section", "Rear Section"],
  ];

  const tiers = ["vip", "premium", "standard", "economy"];

  for (let i = 4; i <= 8; i++) {
    const capacity = faker.number.int({ min: 500, max: 2500 });
    const numSections = faker.number.int({ min: 2, max: 4 });
    const sectionNameSet = faker.helpers.arrayElement(sectionNames);

    const sections = [];
    let currentRow = "A";

    for (let j = 0; j < numSections; j++) {
      const rows = faker.number.int({ min: 6, max: 15 });
      const seatsPerRow = faker.number.int({ min: 20, max: 36 });

      sections.push({
        name: sectionNameSet[j] || `Section ${j + 1}`,
        rows,
        seatsPerRow,
        tier: tiers[j] || "standard",
        startRow: currentRow,
      });

      currentRow = String.fromCharCode(currentRow.charCodeAt(0) + rows);
    }

    venues.push({
      id: i,
      name: `${faker.location.city()} ${faker.helpers.arrayElement(["Concert Hall", "Performing Arts Center", "Symphony Hall", "Music Hall", "Opera House"])}`,
      address: `${faker.location.streetAddress()}, ${faker.location.city()}, ${faker.location.state()}`,
      capacity,
      facilities: faker.helpers.arrayElements(
        facilityOptions,
        faker.number.int({ min: 5, max: 10 })
      ),
      contact: `+852 ${faker.string.numeric(4)} ${faker.string.numeric(4)}`,
      status: "active",
      image: null,
      layout: { sections },
    });
  }

  return venues;
};

export const venuesData = [
  {
    id: 1,
    name: "Hong Kong Cultural Centre Concert Hall",
    address: "10 Salisbury Road, Tsim Sha Tsui, Kowloon",
    capacity: 2019,
    facilities: [
      "Orchestra Pit",
      "Pipe Organ",
      "Acoustic Shell",
      "Wheelchair Access",
      "Air Conditioning",
      "Cloakroom",
      "Restaurant",
      "Bar",
    ],
    contact: "+852 2734 2009",
    status: "active",
    image: null,
    layout: {
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
    },
  },
  {
    id: 2,
    name: "Hong Kong City Hall Concert Hall",
    address: "5 Edinburgh Place, Central, Hong Kong",
    capacity: 1434,
    facilities: [
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
    ],
    contact: "+852 2921 2840",
    status: "active",
    image: null,
    layout: {
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
    },
  },
  {
    id: 3,
    name: "Hong Kong Academy for Performing Arts Concert Hall",
    address: "1 Gloucester Road, Wan Chai, Hong Kong",
    capacity: 821,
    facilities: [
      "Orchestra Pit",
      "Acoustic Shell",
      "Wheelchair Access",
      "Air Conditioning",
      "Cloakroom",
      "Cafe",
      "Recording Facilities",
    ],
    contact: "+852 2584 8500",
    status: "active",
    image: null,
    layout: {
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
    },
  },
  ...generateAdditionalVenues(),
];
