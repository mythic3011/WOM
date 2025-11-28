import { faker } from "@faker-js/faker";
import { hashPassword } from "#utils/hash.js";
import { generateProfileImageUrl, generatePerformanceImageUrl, generateRandomVenueImageUrl } from "./mockImageUrls.js";
import { generateRowLabels } from "#utils/venueUtils.js";

export const generateUser = async (options = {}) => {
  const {
    userId = faker.string.numeric(6),
    role = "user",
    status = "active",
    includeProfileImage = true,
  } = options;

  const gender = faker.helpers.arrayElement(["male", "female", "prefer_not_to_say"]);
  const sex = gender === "male" ? "male" : gender === "female" ? "female" : undefined;
  const firstName = faker.person.firstName(sex);
  const lastName = faker.person.lastName();
  const username = faker.internet.username({ firstName, lastName }).toLowerCase();

  const password = await hashPassword(options.password || "userpass");

  return {
    userId,
    username,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    password,
    title: faker.person.prefix(),
    name: `${firstName} ${lastName}`,
    birthday: faker.date
      .birthdate({ min: 18, max: 70, mode: "age" })
      .toISOString()
      .split("T")[0],
    gender,
    role,
    status,
    phone: faker.string.numeric(8),
    address: faker.helpers.maybe(
      () => faker.location.streetAddress({ useFullAddress: true }),
      { probability: 0.7 }
    ),
    profileImage: includeProfileImage
      ? faker.helpers.maybe(
          () => generateProfileImageUrl(parseInt(userId) % 20),
          { probability: 0.6 }
        )
      : null,
  };
};

export const generateVenue = (options = {}) => {
  const {
    id = faker.number.int({ min: 1, max: 1000 }),
    name = faker.company.name() + " Concert Hall",
    capacity = faker.number.int({ min: 200, max: 2000 }),
  } = options;

  const generateAisles = (seatsPerRow) => {
    const aisleCount = faker.number.int({ min: 0, max: 2 });
    const aisles = [];
    
    for (let i = 0; i < aisleCount; i++) {
      aisles.push({
        type: "vertical",
        mode: "afterSeat",
        position: faker.number.int({ min: 5, max: seatsPerRow - 5 }),
        width: faker.helpers.arrayElement([1.0, 1.5, 2.0]),
        label: faker.helpers.arrayElement(["Left", "Center", "Right", "Main"])
      });
    }
    
    return aisles;
  };

  const generateSeatNumbering = () => {
    const hasPrefix = faker.datatype.boolean(0.3);
    const hasSkipNumbers = faker.datatype.boolean(0.2);
    
    return {
      globalDirection: faker.helpers.arrayElement(["L_TO_R", "R_TO_L"]),
      startNumber: faker.helpers.arrayElement([1, 100, 200]),
      prefix: hasPrefix ? faker.helpers.arrayElement(["VIP", "P", "S", ""]) : "",
      suffix: "",
      skipNumbers: hasSkipNumbers ? [13, 14] : [],
      skipSeatIndices: []
    };
  };

  const generateRowsConfig = (rows, seatsPerRow) => {
    const hasRowOverrides = faker.datatype.boolean(0.2);
    
    if (!hasRowOverrides) {
      return [];
    }
    
    const rowLabels = generateRowLabels("A", rows);
    const overrideRow = faker.helpers.arrayElement(rowLabels);
    
    return [
      {
        rowLabel: overrideRow,
        direction: faker.helpers.arrayElement(["L_TO_R", "R_TO_L"]),
        startNumber: faker.number.int({ min: 1, max: 10 }),
        prefix: faker.helpers.arrayElement(["VIP", "P", ""]),
        suffix: "",
        skipNumbers: [],
        skipSeatIndices: [],
        paddingStart: faker.number.int({ min: 0, max: 3 }),
        paddingEnd: faker.number.int({ min: 0, max: 3 }),
        emptySeatIndices: []
      }
    ];
  };

  const generateHorizontalAisles = (rows) => {
    const hasHorizontalAisles = faker.datatype.boolean(0.3);
    
    if (!hasHorizontalAisles || rows < 5) {
      return [];
    }
    
    const rowLabels = generateRowLabels("A", rows);
    const aisleAfterRow = faker.helpers.arrayElement(rowLabels.slice(2, -2));
    
    return [
      {
        afterRow: aisleAfterRow,
        height: faker.helpers.arrayElement([1, 2, 3])
      }
    ];
  };

  const sectionCount = faker.number.int({ min: 2, max: 4 });
  const sections = [];
  
  for (let i = 0; i < sectionCount; i++) {
    const rows = faker.number.int({ min: 5, max: 20 });
    const seatsPerRow = faker.number.int({ min: 15, max: 35 });
    const startRow = String.fromCharCode(65 + (i * 10));
    
    sections.push({
      name: faker.helpers.arrayElement([
        "Orchestra Stalls",
        "Dress Circle",
        "Grand Circle",
        "Upper Circle",
        "Balcony",
        "Gallery"
      ]) + (i > 0 ? ` ${i + 1}` : ""),
      rows,
      seatsPerRow,
      tier: faker.helpers.arrayElement(["vip", "premium", "standard", "economy"]),
      startRow,
      seatNumbering: generateSeatNumbering(),
      aisles: generateAisles(seatsPerRow),
      rowsConfig: generateRowsConfig(rows, seatsPerRow),
      horizontalAisles: generateHorizontalAisles(rows)
    });
  }

  return {
    id,
    name,
    address: faker.location.streetAddress({ useFullAddress: true }),
    city: faker.location.city(),
    capacity,
    description: faker.lorem.paragraph(),
    facilities: faker.helpers.arrayElements(
      ["Wheelchair Access", "Parking", "Restaurant", "Bar", "Coat Check"],
      { min: 2, max: 4 }
    ),
    image: faker.helpers.maybe(
      () => generateRandomVenueImageUrl(),
      { probability: 0.7 }
    ),
    layout: {
      sections
    },
  };
};

export const generatePerformance = (options = {}) => {
  const {
    id = faker.number.int({ min: 1, max: 1000 }),
    venueId = faker.number.int({ min: 1, max: 10 }),
    status = faker.helpers.arrayElement(["on_sale", "early_bird", "upcoming", "pre_order"]),
    daysFromNow = faker.number.int({ min: 10, max: 180 }),
  } = options;

  const composers = [
    "Wolfgang Amadeus Mozart",
    "Ludwig van Beethoven",
    "Johann Sebastian Bach",
    "Pyotr Ilyich Tchaikovsky",
    "Antonio Vivaldi",
  ];

  const workTitles = [
    "Symphony No. 40",
    "Piano Concerto No. 1",
    "Brandenburg Concerto",
    "The Four Seasons",
    "Violin Concerto",
  ];

  const composer = faker.helpers.arrayElement(composers);
  const title = faker.helpers.arrayElement(workTitles);

  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);

  const basePrice = faker.number.int({ min: 300, max: 1000 });

  const pricingSections = [
    {
      sectionName: "Premium",
      sectionCode: "PR",
      basePrice,
      tier: "premium",
      rows: ["A", "B", "C", "D"],
    },
    {
      sectionName: "Standard",
      sectionCode: "ST",
      basePrice: Math.floor(basePrice * 0.7),
      tier: "standard",
      rows: ["E", "F", "G", "H"],
    },
    {
      sectionName: "Economy",
      sectionCode: "EC",
      basePrice: Math.floor(basePrice * 0.4),
      tier: "economy",
      rows: ["I", "J", "K"],
    },
  ];

  return {
    id,
    title: `${title} - ${composer.split(" ").pop()}`,
    composer,
    description: faker.lorem.paragraph({ min: 2, max: 3 }),
    venueId,
    venueName: options.venueName || "Concert Hall",
    date: date.toISOString(),
    duration: faker.number.int({ min: 60, max: 120 }),
    image: generatePerformanceImageUrl(id % 10),
    category: faker.helpers.arrayElement(["Classical Music", "Chamber Music", "Opera"]),
    subcategory: faker.helpers.arrayElement(["Symphony", "Concerto", "Sonata", "Baroque"]),
    status,
    orchestra: faker.company.name() + " Orchestra",
    conductor: faker.person.fullName(),
    soloists: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
      name: faker.person.fullName(),
      instrument: faker.helpers.arrayElement(["Piano", "Violin", "Cello", "Flute"]),
    })),
    program: [
      {
        title,
        composer,
        movements: Array.from({ length: faker.number.int({ min: 3, max: 4 }) }, () =>
          faker.music.genre()
        ),
      },
    ],
    showtimes: [
      {
        id: `showtime_${id}_${Date.now()}`,
        dateTime: date.toISOString(),
        venueName: options.venueName || "Concert Hall",
        status,
        pricing: {
          sections: pricingSections,
        },
      },
    ],
    pricingSections,
    tags: [
      composer.split(" ").pop(),
      faker.helpers.arrayElement(["Symphony", "Concerto", "Baroque"]),
    ],
    ageRestriction: faker.helpers.maybe(() => `${faker.number.int({ min: 6, max: 12 })}+`, {
      probability: 0.3,
    }),
    dresscode: faker.helpers.arrayElement(["Formal", "Smart Casual", "Casual"]),
  };
};

export const generateTicketType = (options = {}) => {
  const {
    id = faker.string.alphanumeric(10).toUpperCase(),
    name = faker.commerce.productName(),
    discount = 1.0,
  } = options;

  return {
    id,
    name,
    description: faker.lorem.sentence(),
    discount,
    isActive: true,
  };
};

export const generateBooking = (options = {}) => {
  const {
    userId,
    userName,
    userEmail,
    performanceId,
    performanceTitle,
    venueId,
    venueName,
    showtimeId,
    showtime,
    seatTickets = [],
    status = "confirmed",
  } = options;

  if (!userId || !performanceId || !seatTickets.length) {
    throw new Error("Missing required booking fields: userId, performanceId, seatTickets");
  }

  const amount = seatTickets.reduce((sum, ticket) => sum + (ticket.price || 0), 0);
  const roundedAmount = Math.round(amount * 100) / 100;

  const paymentMethods = ["credit_card", "debit_card", "paypal", "bank_transfer"];
  const paymentMethod = faker.helpers.arrayElement(paymentMethods);

  let paymentStatus;
  if (status === "confirmed" || status === "completed") {
    paymentStatus = "paid";
  } else if (status === "cancelled") {
    paymentStatus = faker.helpers.arrayElement(["refunded", "failed"]);
  } else {
    paymentStatus = "pending";
  }

  const bookingDate = new Date(showtime);
  bookingDate.setDate(bookingDate.getDate() - faker.number.int({ min: 1, max: 30 }));

  return {
    bookingReference: `BK-${new Date().toISOString().split("T")[0].replace(/-/g, "")}-${faker.string.alphanumeric(5).toUpperCase()}`,
    userId,
    userName,
    userEmail,
    performanceId,
    performanceTitle,
    venueId,
    venueName,
    showtimeId,
    showtime: new Date(showtime),
    seatTickets,
    seatCount: seatTickets.length,
    amount: roundedAmount,
    totalAmount: roundedAmount,
    bookingDate,
    status,
    paymentMethod,
    paymentStatus,
    notes: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 }),
    customerInfo: null,
  };
};

export const handleEdgeCases = {
  emptyArray: (value, defaultValue = []) => {
    return Array.isArray(value) && value.length === 0 ? defaultValue : value;
  },

  nullField: (value, defaultValue = null) => {
    return value === null || value === undefined ? defaultValue : value;
  },

  missingImage: (imageUrl, placeholderUrl = "/assets/placeholder.jpg") => {
    return imageUrl || placeholderUrl;
  },

  invalidDate: (date) => {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  },

  invalidNumber: (num, defaultValue = 0) => {
    const parsed = parseFloat(num);
    return isNaN(parsed) ? defaultValue : parsed;
  },
};
