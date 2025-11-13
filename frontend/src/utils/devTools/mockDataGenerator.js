import { faker } from "@faker-js/faker";
import { storage } from "/src/services/storageService.js";
import { statsService } from "/src/services/statsService.js";
import { ticketTypeService } from "/src/services/ticketTypeService.js";
import { MOCK_BOOKINGS } from "/src/data/mockData.js";
import { generateMockUsers } from "/src/data/mockUsers.js";
import { hashPassword } from "/src/utils/core/crypto.js";
import {
  ORCHESTRA_COMPOSERS,
  HONG_KONG_VENUES,
  FAMOUS_WORKS,
  BOOKING_STATUSES,
  PAYMENT_METHODS,
  SEAT_TIERS,
  PRICE_RANGES,
  USER_ROLES,
} from "/src/data/mockDataConfig.js";
import { DEV_TOOLS_CONFIG } from "/src/utils/devTools/devToolsConfig.js";

export class MockDataGenerator {
  static setSeed(seed = 12345) {
    faker.seed(seed);
  }

  static generateRandomUser(role = USER_ROLES.USER) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email({ firstName, lastName });
    const userId = `user_${faker.string.alphanumeric(8)}`;

    return {
      id: userId,
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      phone: faker.phone.number("+852 #### ####"),
      age: faker.number.int({ min: 18, max: 75 }),
      role: role,
      status: faker.helpers.arrayElement(["active", "suspended"]),
      password: hashPassword(
        role === USER_ROLES.ADMIN ? "adminpass" : "test123"
      ),
      registeredDate: faker.date.past({ years: 2 }).toISOString(),
      profileImage: faker.image.avatar(),
    };
  }

  static generateRandomPerformance(options = {}) {
    const { forceSoldOut = false, forceStatus = null } = options;

    const allVenues = [
      ...HONG_KONG_VENUES.CULTURAL_CENTRES,
      ...HONG_KONG_VENUES.TOWN_HALLS,
      ...HONG_KONG_VENUES.ARENAS,
    ];

    const workTypes = Object.keys(FAMOUS_WORKS);
    const selectedWorkType = faker.helpers.arrayElement(workTypes);
    const works = FAMOUS_WORKS[selectedWorkType];
    const selectedWork = faker.helpers.arrayElement(works);

    const composer = faker.helpers.arrayElement(ORCHESTRA_COMPOSERS);
    const venue = faker.helpers.arrayElement(allVenues);

    const performanceDate = faker.date.future({ years: 1 });

    const totalSeats = faker.number.int({ min: 100, max: 500 });
    let availableSeats;
    let status;

    if (forceStatus) {
      status = forceStatus;
    } else if (forceSoldOut) {
      status = "sold_out";
    } else {
      status = "on_sale";
    }

    switch (status) {
      case "sold_out":
        availableSeats = 0;
        break;
      case "upcoming":
        availableSeats = totalSeats;
        break;
      case "on_sale":
        const occupancyRate = faker.number.float({ min: 0.2, max: 0.7 });
        availableSeats = Math.floor(totalSeats * (1 - occupancyRate));
        break;
      case "early_bird":
        availableSeats = totalSeats;
        break;
      case "pre_order":
        availableSeats = totalSeats;
        break;
      default:
        availableSeats = Math.floor(totalSeats * 0.6);
    }

    const venueType = venue.type || "concert_hall";
    const priceRange =
      PRICE_RANGES[venueType.toUpperCase()] || PRICE_RANGES.CONCERT_HALL;
    const averagePrice =
      (priceRange.standard.min + priceRange.standard.max) / 2;

    const performanceTime = faker.helpers.arrayElement([
      "14:30",
      "15:00",
      "19:30",
      "20:00",
    ]);

    const performanceId = `perf_${faker.string.alphanumeric(12)}`;
    const performanceDateObj = new Date(performanceDate);
    performanceDateObj.setHours(
      parseInt(performanceTime.split(":")[0]),
      parseInt(performanceTime.split(":")[1])
    );

    const showtimes = [
      {
        id: `showtime_${performanceId}_${faker.string.alphanumeric(8)}`,
        dateTime: performanceDateObj.toISOString(),
        datetime: performanceDateObj.toISOString(),
        venueId: venue.id || faker.number.int({ min: 1, max: 10 }),
        venueName: venue.name,
        capacity: totalSeats,
        available: availableSeats,
        status: status === "sold_out" ? "sold_out" : "available",
      },
    ];

    return {
      id: performanceId,
      title: selectedWork.title,
      composer: selectedWork.composer,
      date: performanceDate.toISOString(),
      time: performanceTime,
      venue: venue.name,
      venueName: venue.name,
      venueAddress: venue.address,
      venueContact: venue.contact,
      venueType: venueType,
      duration:
        selectedWork.duration || faker.number.int({ min: 60, max: 120 }),
      price: Math.round(averagePrice / 10) * 10,
      totalSeats: totalSeats,
      availableSeats: availableSeats,
      bookedSeats: totalSeats - availableSeats,
      status: status,
      ticketingInfo: {
        status: status,
        availableSeats: availableSeats,
        totalSeats: totalSeats,
      },
      category: selectedWorkType,
      description: faker.lorem.paragraph(),
      conductor: faker.person.fullName(),
      orchestra:
        faker.helpers.arrayElement([
          "Hong Kong Philharmonic Orchestra",
          "Hong Kong Sinfonietta",
          "City Chamber Orchestra of Hong Kong",
          "Hong Kong Chinese Orchestra",
        ]) || "Hong Kong Philharmonic Orchestra",
      imageUrl: faker.image.url(),
      image: faker.image.url(),
      showtimes: showtimes,
    };
  }

  static generateRandomBooking(performance, user) {
    const bookingStatuses = Object.values(BOOKING_STATUSES);
    const paymentMethods = Object.values(PAYMENT_METHODS);
    const seatTiers = Object.values(SEAT_TIERS);

    const seatCount = faker.number.int({ min: 1, max: 4 });

    const ticketPrice =
      performance?.price || faker.number.int({ min: 200, max: 1000 });
    const performanceTitle =
      performance?.title ||
      `${faker.helpers
        .arrayElement(ORCHESTRA_COMPOSERS)
        .name.split(" ")
        .pop()} Concert`;
    const performanceId =
      performance?.id || `perf_${faker.string.alphanumeric(12)}`;

    const showtime =
      performance?.showtimes?.[0] ||
      (performance?.showtimes && performance.showtimes.length > 0
        ? faker.helpers.arrayElement(performance.showtimes)
        : null);
    const showtimeId = showtime?.id || `showtime_${performanceId}_default`;

    const userName =
      user?.name || `${faker.person.firstName()} ${faker.person.lastName()}`;
    const userEmail = user?.email || faker.internet.email();
    const userId = user?.id || `user_${faker.string.alphanumeric(8)}`;

    const seats = Array.from({ length: seatCount }, (_, idx) => {
      const row = faker.helpers.arrayElement([
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
      ]);
      const seatNum = faker.number.int({ min: 1, max: 20 });
      return `${row}${seatNum}`;
    });

    return {
      id: `booking_${faker.string.alphanumeric(12)}`,
      performanceId: performanceId,
      showtimeId: showtimeId,
      userId: userId,
      performanceTitle: performanceTitle,
      performanceDate: performance?.date || faker.date.future().toISOString(),
      performanceVenue:
        performance?.venue ||
        faker.helpers.arrayElement([
          ...HONG_KONG_VENUES.CULTURAL_CENTRES,
          ...HONG_KONG_VENUES.TOWN_HALLS,
        ]).name,
      userName: userName,
      customerInfo: {
        name: userName,
        email: userEmail,
        phone: user?.phone || faker.phone.number("+852 #### ####"),
      },
      seats: seats,
      amount: ticketPrice * seatCount,
      status: faker.helpers.arrayElement(bookingStatuses),
      bookingDate: faker.date.recent({ days: 30 }).toISOString(),
      date: performance?.date || faker.date.future().toISOString(),
      paymentMethod: faker.helpers.arrayElement(paymentMethods),
      transactionId: `txn_${faker.string.alphanumeric(16)}`,
    };
  }

  static async generateUsers(options = {}) {
    const {
      skipExisting = true,
      count = null,
      useFaker = false,
      adminCount = 2,
      userCount = 8,
    } = options;

    try {
      let mockUsers;

      if (useFaker) {
        const totalCount = count || adminCount + userCount;
        const admins = Array.from(
          { length: Math.min(adminCount, totalCount) },
          () => this.generateRandomUser(USER_ROLES.ADMIN)
        );
        const users = Array.from({ length: totalCount - admins.length }, () =>
          this.generateRandomUser(USER_ROLES.USER)
        );
        mockUsers = [...admins, ...users];
      } else {
        mockUsers = await generateMockUsers();
        if (count && count > 0) {
          mockUsers = mockUsers.slice(0, count);
        }
      }

      const existingUsers = storage.getItem("registeredUsers", []);

      let usersToAdd = mockUsers;
      if (skipExisting) {
        usersToAdd = mockUsers.filter(
          (mu) =>
            !existingUsers.some(
              (eu) => eu.id === mu.id || eu.email === mu.email
            )
        );
      }

      if (usersToAdd.length > 0) {
        storage.setItem("registeredUsers", [...existingUsers, ...usersToAdd]);
      }

      return {
        success: true,
        created: usersToAdd.length,
        skipped: mockUsers.length - usersToAdd.length,
        total: existingUsers.length + usersToAdd.length,
        message:
          usersToAdd.length > 0
            ? `Created ${usersToAdd.length} ${
                useFaker ? "dynamic" : "test"
              } users`
            : "All users already exist",
        details: {
          adminUsers: usersToAdd.filter((u) => u.role === USER_ROLES.ADMIN)
            .length,
          regularUsers: usersToAdd.filter((u) => u.role === USER_ROLES.USER)
            .length,
          defaultPasswords: {
            admin: "adminpass",
            user: "userpass",
            others: "test123",
          },
          generatedWith: useFaker ? "Faker.js" : "Mock Data",
        },
      };
    } catch (error) {
      return {
        success: false,
        created: 0,
        skipped: 0,
        total: 0,
        message: `Failed to generate users: ${error.message}`,
        error: error.message,
      };
    }
  }

  static generatePerformances(options = {}) {
    const { clear = false, count = null, useFaker = false } = options;

    try {
      let performances;

      if (useFaker) {
        const performanceCount = count || 10;
        const statusDist =
          DEV_TOOLS_CONFIG.mockData.faker.performances.statusDistribution;

        const soldOutCount = Math.floor(performanceCount * statusDist.sold_out);
        const upcomingCount = Math.floor(
          performanceCount * statusDist.upcoming
        );
        const onSaleCount = Math.floor(performanceCount * statusDist.on_sale);
        const earlyBirdCount = Math.floor(
          performanceCount * statusDist.early_bird
        );
        const preOrderCount =
          performanceCount -
          soldOutCount -
          upcomingCount -
          onSaleCount -
          earlyBirdCount;

        const soldOutPerfs = Array.from({ length: soldOutCount }, () =>
          this.generateRandomPerformance({ forceStatus: "sold_out" })
        );
        const upcomingPerfs = Array.from({ length: upcomingCount }, () =>
          this.generateRandomPerformance({ forceStatus: "upcoming" })
        );
        const onSalePerfs = Array.from({ length: onSaleCount }, () =>
          this.generateRandomPerformance({ forceStatus: "on_sale" })
        );
        const earlyBirdPerfs = Array.from({ length: earlyBirdCount }, () =>
          this.generateRandomPerformance({ forceStatus: "early_bird" })
        );
        const preOrderPerfs = Array.from({ length: preOrderCount }, () =>
          this.generateRandomPerformance({ forceStatus: "pre_order" })
        );

        performances = [
          ...soldOutPerfs,
          ...upcomingPerfs,
          ...onSalePerfs,
          ...earlyBirdPerfs,
          ...preOrderPerfs,
        ];
      } else {
        performances = statsService.getPerformances();
        if (count && count > 0) {
          performances = performances.slice(0, count);
        }
      }

      const existingPerformances = clear
        ? []
        : storage.getItem("performances", []);

      storage.setItem("performances", [
        ...existingPerformances,
        ...performances,
      ]);

      const totalPerformances =
        existingPerformances.length + performances.length;

      const statusCounts = this.countPerformancesByStatus(performances);

      return {
        success: true,
        created: performances.length,
        total: totalPerformances,
        message: `Generated ${performances.length} ${
          useFaker ? "dynamic" : "mock"
        } performances`,
        details: {
          upcoming: performances.filter(
            (p) =>
              p.status === "upcoming" || p.ticketingInfo?.status === "upcoming"
          ).length,
          onSale: performances.filter(
            (p) =>
              p.status === "on_sale" || p.ticketingInfo?.status === "on_sale"
          ).length,
          byStatus: statusCounts,
          generatedWith: useFaker ? "Faker.js" : "Mock Data",
        },
      };
    } catch (error) {
      return {
        success: false,
        created: 0,
        total: 0,
        message: `Failed to generate performances: ${error.message}`,
        error: error.message,
      };
    }
  }

  static countPerformancesByStatus(performances) {
    const counts = {
      on_sale: 0,
      upcoming: 0,
      sold_out: 0,
      early_bird: 0,
      pre_order: 0,
    };

    performances.forEach((perf) => {
      const status = perf.ticketingInfo?.status || perf.status || "on_sale";
      if (counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });

    return counts;
  }

  static updatePerformanceAvailability(bookings, performances) {
    const bookingsByPerformance = {};
    const bookingsByShowtime = {};

    bookings.forEach((booking) => {
      if (!bookingsByPerformance[booking.performanceId]) {
        bookingsByPerformance[booking.performanceId] = [];
      }
      bookingsByPerformance[booking.performanceId].push(booking);

      if (booking.showtimeId) {
        if (!bookingsByShowtime[booking.showtimeId]) {
          bookingsByShowtime[booking.showtimeId] = [];
        }
        bookingsByShowtime[booking.showtimeId].push(booking);
      }
    });

    performances.forEach((perf) => {
      const perfBookings = bookingsByPerformance[perf.id] || [];
      const bookedSeatsCount = perfBookings.reduce(
        (sum, booking) => sum + (booking.seats?.length || 0),
        0
      );

      if (perf.totalSeats) {
        perf.bookedSeats = bookedSeatsCount;
        perf.availableSeats = perf.totalSeats - perf.bookedSeats;

        if (perf.availableSeats <= 0) {
          perf.availableSeats = 0;
          perf.status = "sold_out";
          if (perf.ticketingInfo) {
            perf.ticketingInfo.status = "sold_out";
            perf.ticketingInfo.availableSeats = 0;
          }
        } else if (
          perf.status !== "upcoming" &&
          perf.status !== "pre_order" &&
          perf.status !== "early_bird"
        ) {
          perf.status = "on_sale";
          if (perf.ticketingInfo) {
            perf.ticketingInfo.status = "on_sale";
            perf.ticketingInfo.availableSeats = perf.availableSeats;
          }
        }

        if (perf.showtimes && perf.showtimes.length > 0) {
          perf.showtimes.forEach((showtime) => {
            const showtimeBookings = bookingsByShowtime[showtime.id] || [];
            const showtimeBookedSeats = showtimeBookings.reduce(
              (sum, booking) => sum + (booking.seats?.length || 0),
              0
            );

            showtime.available =
              (showtime.capacity || perf.totalSeats) - showtimeBookedSeats;
            showtime.bookedSeats = showtimeBookedSeats;

            if (showtime.available <= 0) {
              showtime.status = "sold_out";
              showtime.available = 0;
            } else {
              showtime.status = "available";
            }
          });
        }
      }
    });

    storage.setItem("performances", performances);
  }

  static generateBookings(options = {}) {
    const { skipExisting = true, count = null, useFaker = false } = options;

    try {
      let mockBookings;

      if (useFaker) {
        const bookingCount = count || 20;
        const allPerformances = storage.getItem("performances", []);
        const users = storage.getItem("registeredUsers", []);

        if (allPerformances.length === 0) {
          return {
            success: false,
            created: 0,
            skipped: 0,
            total: 0,
            message:
              "No performances available. Please generate performances first.",
            error: "No performances found",
          };
        }

        if (users.length === 0) {
          return {
            success: false,
            created: 0,
            skipped: 0,
            total: 0,
            message: "No users available. Please generate users first.",
            error: "No users found",
          };
        }

        const bookablePerformances = allPerformances.filter((p) => {
          const status = p.ticketingInfo?.status || p.status;
          return (
            status !== "sold_out" &&
            status !== "upcoming" &&
            new Date(p.date) > new Date() &&
            (p.availableSeats > 0 || !p.availableSeats)
          );
        });

        if (bookablePerformances.length === 0) {
          return {
            success: false,
            created: 0,
            skipped: 0,
            total: 0,
            message:
              "No bookable performances found. All performances are sold out, completed, or in the past.",
            error: "No bookable performances",
          };
        }

        mockBookings = Array.from({ length: bookingCount }, () => {
          const performance = faker.helpers.arrayElement(bookablePerformances);
          const user = faker.helpers.arrayElement(users);
          const booking = this.generateRandomBooking(performance, user);

          if (!booking.showtimeId) {
            console.warn(
              `Booking ${booking.id} has no showtimeId. Performance:`,
              performance?.id,
              "Showtimes:",
              performance?.showtimes
            );
          }

          return booking;
        });

        this.updatePerformanceAvailability(mockBookings, allPerformances);
      } else {
        mockBookings = [...MOCK_BOOKINGS];
        if (count && count > 0) {
          mockBookings = mockBookings.slice(0, count);
        }
      }

      const existingBookings = storage.getItem("bookings", []);

      let bookingsToAdd = mockBookings;
      if (skipExisting) {
        bookingsToAdd = mockBookings.filter(
          (mb) => !existingBookings.some((eb) => eb.id === mb.id)
        );
      }

      if (bookingsToAdd.length > 0) {
        storage.setItem("bookings", [...existingBookings, ...bookingsToAdd]);
      }

      const statusCounts = this.countByStatus(bookingsToAdd);

      const uniqueShowtimeIds = new Set(
        bookingsToAdd.map((b) => b.showtimeId).filter(Boolean)
      );
      const uniquePerformanceIds = new Set(
        bookingsToAdd.map((b) => b.performanceId).filter(Boolean)
      );

      return {
        success: true,
        created: bookingsToAdd.length,
        skipped: mockBookings.length - bookingsToAdd.length,
        total: existingBookings.length + bookingsToAdd.length,
        message:
          bookingsToAdd.length > 0
            ? `Created ${bookingsToAdd.length} ${
                useFaker ? "dynamic" : "mock"
              } bookings linked to ${uniqueShowtimeIds.size} showtimes`
            : "All bookings already exist",
        details: {
          byStatus: statusCounts,
          totalAmount: bookingsToAdd.reduce(
            (sum, b) => sum + (b.amount || 0),
            0
          ),
          generatedWith: useFaker ? "Faker.js" : "Mock Data",
          linkedPerformances: uniquePerformanceIds.size,
          linkedShowtimes: uniqueShowtimeIds.size,
          linkedUsers: bookingsToAdd.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        created: 0,
        skipped: 0,
        total: 0,
        message: `Failed to generate bookings: ${error.message}`,
        error: error.message,
      };
    }
  }

  static async generateAll(options = {}) {
    const {
      users = true,
      performances = true,
      bookings = true,
      userOptions = {},
      performanceOptions = {},
      bookingOptions = {},
    } = options;

    const results = {
      users: null,
      performances: null,
      bookings: null,
      overall: {
        success: true,
        totalCreated: 0,
        errors: [],
      },
    };

    if (users) {
      results.users = await this.generateUsers(userOptions);
      if (!results.users.success) {
        results.overall.success = false;
        results.overall.errors.push(`Users: ${results.users.message}`);
      } else {
        results.overall.totalCreated += results.users.created;
      }
    }

    if (performances) {
      results.performances = this.generatePerformances(performanceOptions);
      if (!results.performances.success) {
        results.overall.success = false;
        results.overall.errors.push(
          `Performances: ${results.performances.message}`
        );
      } else {
        results.overall.totalCreated += results.performances.created;
      }
    }

    if (bookings) {
      results.bookings = this.generateBookings(bookingOptions);
      if (!results.bookings.success) {
        results.overall.success = false;
        results.overall.errors.push(`Bookings: ${results.bookings.message}`);
      } else {
        results.overall.totalCreated += results.bookings.created;
      }
    }

    return results;
  }

  static clearUsers() {
    try {
      const count = storage.getItem("registeredUsers", []).length;
      storage.setItem("registeredUsers", []);
      return {
        success: true,
        cleared: count,
        message: `Cleared ${count} users`,
      };
    } catch (error) {
      return {
        success: false,
        cleared: 0,
        message: `Failed to clear users: ${error.message}`,
        error: error.message,
      };
    }
  }

  static clearPerformances() {
    try {
      const count = storage.getItem("performances", []).length;
      storage.setItem("performances", []);
      return {
        success: true,
        cleared: count,
        message: `Cleared ${count} performances`,
      };
    } catch (error) {
      return {
        success: false,
        cleared: 0,
        message: `Failed to clear performances: ${error.message}`,
        error: error.message,
      };
    }
  }

  static clearBookings() {
    try {
      const count = storage.getItem("bookings", []).length;
      storage.setItem("bookings", []);
      return {
        success: true,
        cleared: count,
        message: `Cleared ${count} bookings`,
      };
    } catch (error) {
      return {
        success: false,
        cleared: 0,
        message: `Failed to clear bookings: ${error.message}`,
        error: error.message,
      };
    }
  }

  static clearAll() {
    const results = {
      users: this.clearUsers(),
      performances: this.clearPerformances(),
      bookings: this.clearBookings(),
      overall: {
        success: true,
        totalCleared: 0,
      },
    };

    results.overall.totalCleared =
      results.users.cleared +
      results.performances.cleared +
      results.bookings.cleared;

    results.overall.success =
      results.users.success &&
      results.performances.success &&
      results.bookings.success;

    return results;
  }

  static resetTicketTypes() {
    try {
      ticketTypeService.reset();
      return {
        success: true,
        message: "Ticket types reset to defaults",
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to reset ticket types: ${error.message}`,
        error: error.message,
      };
    }
  }

  static getStats() {
    return {
      users: {
        total: storage.getItem("registeredUsers", []).length,
        admins: storage
          .getItem("registeredUsers", [])
          .filter((u) => u.role === USER_ROLES.ADMIN).length,
        regularUsers: storage
          .getItem("registeredUsers", [])
          .filter((u) => u.role === USER_ROLES.USER).length,
      },
      performances: {
        total: storage.getItem("performances", []).length,
        upcoming: storage
          .getItem("performances", [])
          .filter((p) => new Date(p.date) > new Date()).length,
        past: storage
          .getItem("performances", [])
          .filter((p) => new Date(p.date) <= new Date()).length,
      },
      bookings: {
        total: storage.getItem("bookings", []).length,
        byStatus: this.countByStatus(storage.getItem("bookings", [])),
        totalRevenue: storage
          .getItem("bookings", [])
          .reduce((sum, b) => sum + (b.amount || 0), 0),
      },
    };
  }

  static countByStatus(bookings) {
    const counts = {};
    Object.values(BOOKING_STATUSES).forEach((status) => {
      counts[status] = 0;
    });

    bookings.forEach((booking) => {
      const status = booking.status || BOOKING_STATUSES.PENDING;
      if (counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });

    return counts;
  }

  static async quickSetup(preset = "full", useFaker = false) {
    const presets = {
      minimal: {
        users: true,
        performances: true,
        bookings: false,
        userOptions: { count: 5, useFaker },
        performanceOptions: { count: 3, useFaker },
      },
      standard: {
        users: true,
        performances: true,
        bookings: true,
        userOptions: { count: 10, useFaker },
        performanceOptions: { count: 10, useFaker },
        bookingOptions: { count: 20, useFaker },
      },
      full: {
        users: true,
        performances: true,
        bookings: true,
        userOptions: { useFaker },
        performanceOptions: { useFaker },
        bookingOptions: { useFaker },
      },
      faker: {
        users: true,
        performances: true,
        bookings: true,
        userOptions: {
          count: 15,
          useFaker: true,
          adminCount: 3,
          userCount: 12,
        },
        performanceOptions: { count: 15, useFaker: true },
        bookingOptions: { count: 30, useFaker: true },
      },
    };

    const config = presets[preset] || presets.full;
    return await this.generateAll(config);
  }

  static generateBulkData(type, count = 10) {
    switch (type) {
      case "users":
        return Array.from({ length: count }, () =>
          this.generateRandomUser(
            faker.datatype.boolean({ probability: 0.2 })
              ? USER_ROLES.ADMIN
              : USER_ROLES.USER
          )
        );
      case "performances":
        return Array.from({ length: count }, () =>
          this.generateRandomPerformance()
        );
      case "bookings":
        const performances = storage.getItem("performances", []);
        const users = storage.getItem("registeredUsers", []);
        if (performances.length === 0 || users.length === 0) {
          return [];
        }
        return Array.from({ length: count }, () => {
          const performance = faker.helpers.arrayElement(performances);
          const user = faker.helpers.arrayElement(users);
          return this.generateRandomBooking(performance, user);
        });
      default:
        return [];
    }
  }

  static validateRelationships() {
    const bookings = storage.getItem("bookings", []);
    const performances = storage.getItem("performances", []);
    const users = storage.getItem("registeredUsers", []);

    const performanceIds = new Set(performances.map((p) => p.id));
    const userIds = new Set(users.map((u) => u.id));

    const showtimeIds = new Set();
    performances.forEach((p) => {
      if (p.showtimes && Array.isArray(p.showtimes)) {
        p.showtimes.forEach((st) => showtimeIds.add(st.id));
      }
    });

    let validBookings = 0;
    let invalidPerformanceLinks = 0;
    let invalidUserLinks = 0;
    let invalidShowtimeLinks = 0;
    let missingShowtimeIds = 0;

    bookings.forEach((booking) => {
      const hasValidPerformance = performanceIds.has(booking.performanceId);
      const hasValidUser = userIds.has(booking.userId);
      const hasShowtimeId = !!booking.showtimeId;
      const hasValidShowtime =
        hasShowtimeId && showtimeIds.has(booking.showtimeId);

      if (hasValidPerformance && hasValidUser && hasValidShowtime) {
        validBookings++;
      }
      if (!hasValidPerformance) invalidPerformanceLinks++;
      if (!hasValidUser) invalidUserLinks++;
      if (!hasShowtimeId) missingShowtimeIds++;
      if (hasShowtimeId && !hasValidShowtime) invalidShowtimeLinks++;
    });

    return {
      totalBookings: bookings.length,
      totalShowtimes: showtimeIds.size,
      validBookings,
      invalidPerformanceLinks,
      invalidUserLinks,
      invalidShowtimeLinks,
      missingShowtimeIds,
      integrityScore:
        bookings.length > 0
          ? ((validBookings / bookings.length) * 100).toFixed(2)
          : 100,
      isValid: validBookings === bookings.length,
      warnings: [
        missingShowtimeIds > 0
          ? `${missingShowtimeIds} bookings have no showtimeId`
          : null,
        invalidShowtimeLinks > 0
          ? `${invalidShowtimeLinks} bookings reference non-existent showtimes`
          : null,
        invalidPerformanceLinks > 0
          ? `${invalidPerformanceLinks} bookings reference non-existent performances`
          : null,
        invalidUserLinks > 0
          ? `${invalidUserLinks} bookings reference non-existent users`
          : null,
      ].filter(Boolean),
    };
  }

  static getRelationshipStats() {
    const bookings = storage.getItem("bookings", []);
    const performances = storage.getItem("performances", []);
    const users = storage.getItem("registeredUsers", []);

    const bookingsByPerformance = {};
    const bookingsByUser = {};

    bookings.forEach((booking) => {
      bookingsByPerformance[booking.performanceId] =
        (bookingsByPerformance[booking.performanceId] || 0) + 1;
      bookingsByUser[booking.userId] =
        (bookingsByUser[booking.userId] || 0) + 1;
    });

    const performancesWithBookings = Object.keys(bookingsByPerformance).length;
    const usersWithBookings = Object.keys(bookingsByUser).length;

    return {
      users: {
        total: users.length,
        withBookings: usersWithBookings,
        withoutBookings: users.length - usersWithBookings,
        averageBookingsPerUser:
          users.length > 0 ? (bookings.length / users.length).toFixed(2) : 0,
      },
      performances: {
        total: performances.length,
        withBookings: performancesWithBookings,
        withoutBookings: performances.length - performancesWithBookings,
        averageBookingsPerPerformance:
          performances.length > 0
            ? (bookings.length / performances.length).toFixed(2)
            : 0,
      },
      bookings: {
        total: bookings.length,
      },
    };
  }
}
