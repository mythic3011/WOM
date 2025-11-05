import dayjs from "dayjs";

export const DataFactory = {
  generateId(prefix = "") {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `${prefix}${timestamp}${random}`.toUpperCase();
  },

  randomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  randomDate(start, end) {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
  },

  futureDate(daysFromNow) {
    return dayjs().add(daysFromNow, "day").toISOString();
  },

  pastDate(daysAgo) {
    return dayjs().subtract(daysAgo, "day").toISOString();
  },

  generateUser(overrides = {}) {
    const id = this.generateId("user_");
    const firstName = this.randomElement([
      "John",
      "Jane",
      "Bob",
      "Alice",
      "Charlie",
      "Diana",
      "Edward",
      "Fiona",
      "George",
      "Helen",
    ]);
    const lastName = this.randomElement([
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
    ]);
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

    return {
      id,
      name,
      email,
      password: "hashed_password_placeholder",
      gender: this.randomElement(["male", "female", "prefer_not_to_say"]),
      birthdate: this.randomDate(new Date(1960, 0, 1), new Date(2005, 11, 31))
        .toISOString()
        .split("T")[0],
      role: "user",
      status: "active",
      registeredAt: this.pastDate(this.randomInt(1, 365)),
      profileImage: null,
      ...overrides,
    };
  },

  generatePerformance(overrides = {}) {
    const composers = [
      "Beethoven",
      "Mozart",
      "Tchaikovsky",
      "Vivaldi",
      "Brahms",
      "Bach",
      "Mahler",
      "Chopin",
      "Debussy",
      "Rachmaninoff",
    ];
    const works = [
      "Symphony No. 9",
      "Piano Concerto No. 21",
      "Swan Lake Suite",
      "Four Seasons",
      "Symphony No. 1",
      "Goldberg Variations",
      "Symphony No. 5",
      "Nocturnes",
      "La Mer",
      "Piano Concerto No. 2",
    ];

    const composer = this.randomElement(composers);
    const work = this.randomElement(works);
    const title = `${composer} ${work}`;

    const conductors = [
      "James Smith",
      "Emily Chen",
      "Michael Wong",
      "Sarah Lee",
      "David Brown",
    ];
    const orchestras = [
      "Hong Kong Philharmonic",
      "City Orchestra",
      "Royal Symphony",
      "Chamber Orchestra",
      "National Orchestra",
    ];
    const venues = [
      "Concert Hall",
      "Grand Theatre",
      "Opera House",
      "Music Centre",
      "Cultural Centre",
    ];

    return {
      id: this.generateId("perf_"),
      title,
      composer,
      conductor: this.randomElement(conductors),
      orchestra: this.randomElement(orchestras),
      venue: this.randomElement(venues),
      date: this.futureDate(this.randomInt(30, 180)),
      price: this.randomInt(300, 800),
      status: this.randomElement(["upcoming", "on_sale", "sold_out"]),
      description: `An evening of classical music featuring ${composer}'s ${work}`,
      duration: this.randomInt(90, 150),
      category: "Classical",
      ageLimit: 0,
      seats: {
        total: this.randomInt(400, 1200),
        booked: 0,
      },
      image: null,
      ...overrides,
    };
  },

  generateBooking(userId, performanceId, overrides = {}) {
    const seatRows = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const numSeats = this.randomInt(1, 4);
    const seats = Array.from({ length: numSeats }, (_, i) => {
      const row = this.randomElement(seatRows);
      const num = this.randomInt(1, 15);
      return `${row}${num}`;
    });

    const ticketTypes = [
      { id: "standard", name: "Standard", price: 500 },
      { id: "student", name: "Student", price: 250 },
      { id: "senior", name: "Senior Citizen", price: 250 },
      { id: "pwd", name: "People with Disabilities", price: 200 },
    ];

    const seatTicketTypes = {};
    seats.forEach((seat) => {
      const type = this.randomElement(ticketTypes);
      seatTicketTypes[seat] = type;
    });

    const amount = Object.values(seatTicketTypes).reduce(
      (sum, type) => sum + type.price,
      0
    );

    return {
      id: this.generateId("BK"),
      performanceId,
      userId,
      seats,
      seatTicketTypes,
      amount,
      status: this.randomElement(["confirmed", "pending", "cancelled"]),
      date: this.pastDate(this.randomInt(1, 30)),
      ticketType: "Multiple",
      paymentMethod: this.randomElement([
        "credit-card",
        "alipay",
        "wechat-pay",
        "paypal",
      ]),
      paymentDate: this.pastDate(this.randomInt(1, 30)),
      ...overrides,
    };
  },

  generateVenue(overrides = {}) {
    const names = [
      "Hong Kong Cultural Centre Concert Hall",
      "Hong Kong City Hall Concert Hall",
      "Hong Kong Coliseum",
      "Tsuen Wan Town Hall Auditorium",
      "Sha Tin Town Hall Auditorium",
    ];

    return {
      id: this.generateId("venue_"),
      name: this.randomElement(names),
      address: "Hong Kong",
      capacity: this.randomInt(500, 2000),
      facilities: [
        "Wheelchair accessible",
        "Air conditioned",
        "Premium acoustics",
      ],
      contact: "+852 2734 2009",
      status: "active",
      layout: {
        sections: [
          {
            name: "Orchestra Stalls",
            rows: 8,
            seatsPerRow: 6,
            tier: "vip",
            startRow: "A",
          },
        ],
      },
      ...overrides,
    };
  },

  generateTicketType(overrides = {}) {
    return {
      id: this.generateId("ticket_"),
      name: "Standard",
      description: "Standard admission ticket",
      isDefault: false,
      order: 0,
      pricing: {
        type: "default",
        value: 0,
        modifier: "base",
      },
      ...overrides,
    };
  },

  generateBatch(generator, count, ...args) {
    return Array.from({ length: count }, () => generator.call(this, ...args));
  },

  seedUsers(count = 10) {
    return this.generateBatch(this.generateUser, count);
  },

  seedPerformances(count = 20) {
    const performances = this.generateBatch(this.generatePerformance, count);
    performances.forEach((perf, index) => {
      const totalSeats = perf.seats.total;
      perf.seats.booked = Math.floor(totalSeats * (Math.random() * 0.8));
      if (perf.seats.booked >= totalSeats * 0.95) {
        perf.status = "sold_out";
      }
    });
    return performances;
  },

  seedBookings(users, performances, maxPerUser = 3) {
    const bookings = [];
    users.forEach((user) => {
      const numBookings = this.randomInt(0, maxPerUser);
      for (let i = 0; i < numBookings; i++) {
        const perf = this.randomElement(performances);
        const booking = this.generateBooking(user.id, perf.id, {
          customerInfo: {
            id: user.id,
            name: user.name,
            email: user.email,
            isGuest: false,
          },
          performanceTitle: perf.title,
          venue: perf.venue,
          performanceDate: perf.date,
        });
        bookings.push(booking);
      }
    });
    return bookings;
  },

  createMockDataSet() {
    const users = this.seedUsers(20);
    const performances = this.seedPerformances(30);
    const bookings = this.seedBookings(users, performances, 5);
    const venues = this.generateBatch(this.generateVenue, 5);

    return {
      users,
      performances,
      bookings,
      venues,
      stats: {
        totalUsers: users.length,
        totalPerformances: performances.length,
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce((sum, b) => sum + b.amount, 0),
      },
    };
  },
};

export const DateUtils = {
  formatDate(date, format = "YYYY-MM-DD") {
    return dayjs(date).format(format);
  },

  formatDateTime(date) {
    return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
  },

  isUpcoming(date) {
    return dayjs(date).isAfter(dayjs());
  },

  isPast(date) {
    return dayjs(date).isBefore(dayjs());
  },

  daysUntil(date) {
    return dayjs(date).diff(dayjs(), "day");
  },

  daysAgo(date) {
    return dayjs().diff(dayjs(date), "day");
  },

  relativeTime(date) {
    return dayjs(date).fromNow();
  },
};

export const DataValidation = {
  validateUser(user) {
    const required = ["id", "name", "email", "role"];
    const missing = required.filter((field) => !user[field]);

    if (missing.length > 0) {
      return {
        valid: false,
        errors: [`Missing fields: ${missing.join(", ")}`],
      };
    }

    if (!this.isValidEmail(user.email)) {
      return { valid: false, errors: ["Invalid email format"] };
    }

    return { valid: true, errors: [] };
  },

  validatePerformance(performance) {
    const required = ["id", "title", "date", "venue"];
    const missing = required.filter((field) => !performance[field]);

    if (missing.length > 0) {
      return {
        valid: false,
        errors: [`Missing fields: ${missing.join(", ")}`],
      };
    }

    return { valid: true, errors: [] };
  },

  validateBooking(booking) {
    const required = [
      "id",
      "performanceId",
      "userId",
      "seats",
      "amount",
      "status",
    ];
    const missing = required.filter((field) => !booking[field]);

    if (missing.length > 0) {
      return {
        valid: false,
        errors: [`Missing fields: ${missing.join(", ")}`],
      };
    }

    if (!Array.isArray(booking.seats) || booking.seats.length === 0) {
      return { valid: false, errors: ["Seats must be a non-empty array"] };
    }

    return { valid: true, errors: [] };
  },

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
};

export const DataQuery = {
  filterByStatus(items, status) {
    return items.filter((item) => item.status === status);
  },

  filterByDateRange(items, startDate, endDate, dateField = "date") {
    return items.filter((item) => {
      const date = dayjs(item[dateField]);
      return date.isAfter(dayjs(startDate)) && date.isBefore(dayjs(endDate));
    });
  },

  sortByDate(items, dateField = "date", ascending = true) {
    return [...items].sort((a, b) => {
      const dateA = dayjs(a[dateField]);
      const dateB = dayjs(b[dateField]);
      return ascending ? dateA.diff(dateB) : dateB.diff(dateA);
    });
  },

  groupBy(items, key) {
    return items.reduce((groups, item) => {
      const value = item[key];
      if (!groups[value]) {
        groups[value] = [];
      }
      groups[value].push(item);
      return groups;
    }, {});
  },

  search(items, searchTerm, fields) {
    const term = searchTerm.toLowerCase();
    return items.filter((item) =>
      fields.some((field) => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(term);
      })
    );
  },

  paginate(items, page, pageSize) {
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    return {
      items: items.slice(start, end),
      total: items.length,
      page,
      pageSize,
      totalPages: Math.ceil(items.length / pageSize),
    };
  },
};
