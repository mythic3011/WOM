import {
  HONG_KONG_VENUES,
  COMMON_FACILITY_COMBINATIONS,
  VENUE_STATUSES,
} from "./mockDataConfig.js";

export const MOCK_VENUES = [
  {
    id: 1,
    name: "Hong Kong Cultural Centre Concert Hall",
    address: "10 Salisbury Road, Tsim Sha Tsui, Kowloon",
    capacity: 2019,
    facilities: COMMON_FACILITY_COMBINATIONS.CONCERT_HALL,
    contact: "+852 2734 2009",
    status: VENUE_STATUSES.ACTIVE,
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
      ...COMMON_FACILITY_COMBINATIONS.CONCERT_HALL,
      "Historical Venue",
      "Heritage Site",
    ],
    contact: "+852 2921 2840",
    status: VENUE_STATUSES.ACTIVE,
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
          seatsPerRow: 28,
          tier: "economy",
          startRow: "Z",
        },
      ],
    },
  },
  {
    id: 3,
    name: "Hong Kong Coliseum",
    address: "9 Cheong Wan Road, Hung Hom, Kowloon",
    capacity: 12500,
    facilities: COMMON_FACILITY_COMBINATIONS.LARGE_ARENA,
    contact: "+852 2355 7234",
    status: VENUE_STATUSES.ACTIVE,
    image: null,
    layout: {
      sections: [
        {
          name: "Arena Floor",
          rows: 10,
          seatsPerRow: 40,
          tier: "vip",
          startRow: "A",
        },
        {
          name: "Lower Tier",
          rows: 15,
          seatsPerRow: 50,
          tier: "premium",
          startRow: "K",
        },
        {
          name: "Upper Tier",
          rows: 20,
          seatsPerRow: 55,
          tier: "standard",
          startRow: "Z",
        },
        {
          name: "Back Rows",
          rows: 15,
          seatsPerRow: 60,
          tier: "economy",
          startRow: "AA",
        },
      ],
    },
  },
  {
    id: 4,
    name: "Tsuen Wan Town Hall Auditorium",
    address: "72 Tai Ho Road, Tsuen Wan",
    capacity: 1390,
    facilities: COMMON_FACILITY_COMBINATIONS.COMMUNITY_VENUE,
    contact: "+852 2414 0144",
    status: VENUE_STATUSES.ACTIVE,
    image: null,
    layout: {
      sections: [
        {
          name: "Orchestra",
          rows: 15,
          seatsPerRow: 32,
          tier: "standard",
          startRow: "A",
        },
        {
          name: "Balcony",
          rows: 10,
          seatsPerRow: 30,
          tier: "economy",
          startRow: "P",
        },
      ],
    },
  },
  {
    id: 5,
    name: "Sha Tin Town Hall Auditorium",
    address: "1 Yuen Wo Road, Sha Tin",
    capacity: 1374,
    facilities: [
      ...COMMON_FACILITY_COMBINATIONS.COMMUNITY_VENUE,
      "MTR Access",
      "Shopping Mall Nearby",
    ],
    contact: "+852 2694 2509",
    status: VENUE_STATUSES.ACTIVE,
    image: null,
    layout: {
      sections: [
        {
          name: "Main Floor",
          rows: 18,
          seatsPerRow: 30,
          tier: "premium",
          startRow: "A",
        },
        {
          name: "Upper Level",
          rows: 8,
          seatsPerRow: 28,
          tier: "standard",
          startRow: "S",
        },
      ],
    },
  },
  {
    id: 6,
    name: "Tuen Mun Town Hall Auditorium",
    address: "3 Tuen Hi Road, Tuen Mun",
    capacity: 1374,
    facilities: COMMON_FACILITY_COMBINATIONS.COMMUNITY_VENUE,
    contact: "+852 2450 9009",
    status: VENUE_STATUSES.ACTIVE,
    image: null,
    layout: {
      sections: [
        {
          name: "Stalls",
          rows: 16,
          seatsPerRow: 32,
          tier: "standard",
          startRow: "A",
        },
        {
          name: "Circle",
          rows: 10,
          seatsPerRow: 30,
          tier: "economy",
          startRow: "Q",
        },
      ],
    },
  },
  {
    id: 7,
    name: "Kwai Tsing Theatre Auditorium",
    address: "12 Hing Ning Road, Kwai Chung",
    capacity: 997,
    facilities: [
      "Wheelchair Access",
      "Air Conditioning",
      "Parking",
      "WiFi",
      "Accessible Restrooms",
    ],
    contact: "+852 2408 0128",
    status: VENUE_STATUSES.ACTIVE,
    image: null,
    layout: {
      sections: [
        {
          name: "Main Seating",
          rows: 14,
          seatsPerRow: 28,
          tier: "standard",
          startRow: "A",
        },
        {
          name: "Upper Seating",
          rows: 8,
          seatsPerRow: 26,
          tier: "economy",
          startRow: "O",
        },
      ],
    },
  },
  {
    id: 8,
    name: "AsiaWorld-Expo Arena",
    address: "Airport Expo Boulevard, Lantau",
    capacity: 14000,
    facilities: [
      ...COMMON_FACILITY_COMBINATIONS.LARGE_ARENA,
      "Airport Access",
      "Hotel Nearby",
      "Exhibition Space",
      "Convention Facilities",
    ],
    contact: "+852 3606 8888",
    status: VENUE_STATUSES.ACTIVE,
    image: null,
    layout: {
      sections: [
        {
          name: "Floor Seating",
          rows: 12,
          seatsPerRow: 50,
          tier: "vip",
          startRow: "A",
        },
        {
          name: "Lower Bowl",
          rows: 20,
          seatsPerRow: 60,
          tier: "premium",
          startRow: "M",
        },
        {
          name: "Upper Bowl",
          rows: 25,
          seatsPerRow: 65,
          tier: "standard",
          startRow: "AA",
        },
        {
          name: "Top Tier",
          rows: 15,
          seatsPerRow: 70,
          tier: "economy",
          startRow: "AZ",
        },
      ],
    },
  },
];

const generateRowLabels = (startRow, count) => {
  const rows = [];
  let current = startRow;

  for (let i = 0; i < count; i++) {
    rows.push(current);

    if (current.length === 1) {
      current = String.fromCharCode(current.charCodeAt(0) + 1);
    } else if (current.length === 2) {
      const first = current.charAt(0);
      const second = current.charAt(1);
      if (second === "Z") {
        current = String.fromCharCode(first.charCodeAt(0) + 1) + "A";
      } else {
        current = first + String.fromCharCode(second.charCodeAt(0) + 1);
      }
    }
  }

  return rows;
};

export const calculateVenueCapacity = (layout) => {
  if (!layout || !layout.sections) return 0;
  return layout.sections.reduce((total, section) => {
    const rowCount =
      typeof section.rows === "number" ? section.rows : section.rows.length;
    return total + rowCount * section.seatsPerRow;
  }, 0);
};

export const normalizeVenueLayout = (layout) => {
  if (!layout || !layout.sections) return layout;

  return {
    ...layout,
    sections: layout.sections.map((section) => ({
      ...section,
      rows:
        typeof section.rows === "number"
          ? generateRowLabels(section.startRow || "A", section.rows)
          : section.rows,
      capacity:
        (typeof section.rows === "number"
          ? section.rows
          : section.rows.length) * section.seatsPerRow,
    })),
  };
};

export const getVenueById = (id) => {
  return MOCK_VENUES.find((venue) => venue.id === id);
};

export const getActiveVenues = () => {
  return MOCK_VENUES.filter((venue) => venue.status === VENUE_STATUSES.ACTIVE);
};

export const getVenuesByCapacity = (minCapacity, maxCapacity) => {
  return MOCK_VENUES.filter(
    (venue) => venue.capacity >= minCapacity && venue.capacity <= maxCapacity
  );
};

export const searchVenues = (query) => {
  const lowerQuery = query.toLowerCase();
  return MOCK_VENUES.filter(
    (venue) =>
      venue.name.toLowerCase().includes(lowerQuery) ||
      venue.address.toLowerCase().includes(lowerQuery)
  );
};
