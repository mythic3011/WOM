import {
  SEAT_STATUSES,
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  TICKET_TYPES,
  MOCK_DATA_CONFIG,
} from "./mockDataConfig.js";
import { MOCK_PERFORMANCES } from "./mockPerformances.js";
import { MOCK_VENUES } from "./mockVenues.js";
import { MOCK_USERS_STATIC } from "./mockUsers.js";

const generateSeatId = (performanceId, showtimeIndex, section, row, seat) => {
  return `P${performanceId}-S${showtimeIndex}-${section}-${row}${seat}`;
};

const generateSeatsForPerformance = (performance, showtimeIndex = 0) => {
  const venue = MOCK_VENUES.find((v) => v.id === performance.venueId);
  if (!venue || !venue.layout || !venue.layout.sections) return [];

  const seats = [];
  const availabilityConfig = MOCK_DATA_CONFIG.SEATS_AVAILABILITY;

  venue.layout.sections.forEach((section) => {
    for (let row = 0; row < section.rows; row++) {
      const rowLetter = String.fromCharCode(
        65 + row + (section.startRow ? section.startRow.charCodeAt(0) - 65 : 0)
      );

      for (let seatNum = 1; seatNum <= section.seatsPerRow; seatNum++) {
        const rand = Math.random();
        let status;
        if (rand < availabilityConfig.booked) {
          status = SEAT_STATUSES.BOOKED;
        } else if (
          rand <
          availabilityConfig.booked + availabilityConfig.reserved
        ) {
          status = SEAT_STATUSES.RESERVED;
        } else if (
          rand <
          availabilityConfig.booked +
            availabilityConfig.reserved +
            availabilityConfig.blocked
        ) {
          status = SEAT_STATUSES.BLOCKED;
        } else {
          status = SEAT_STATUSES.AVAILABLE;
        }

        seats.push({
          id: generateSeatId(
            performance.id,
            showtimeIndex,
            section.name,
            rowLetter,
            seatNum
          ),
          performanceId: performance.id,
          showtimeIndex,
          showtime: performance.showtimes?.[showtimeIndex] || performance.date,
          section: section.name,
          tier: section.tier,
          row: rowLetter,
          seat: seatNum,
          seatNumber: `${rowLetter}${seatNum}`,
          status,
          price:
            performance.pricingSections?.find(
              (ps) => ps.sectionName === section.name
            )?.basePrice || 200,
        });
      }
    }
  });

  return seats;
};

export const generateAllSeats = () => {
  const allSeats = [];
  MOCK_PERFORMANCES.forEach((performance) => {
    const showtimeCount = performance.showtimes?.length || 1;
    for (let i = 0; i < showtimeCount; i++) {
      const seats = generateSeatsForPerformance(performance, i);
      allSeats.push(...seats);
    }
  });
  return allSeats;
};

export const MOCK_SEATS = generateAllSeats();

const generateBookingReference = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK${timestamp}${random}`;
};

const generateBookingsForPerformance = (performance, seatData) => {
  const bookings = [];
  const performanceSeats = seatData.filter(
    (s) => s.performanceId === performance.id
  );
  const bookedSeats = performanceSeats.filter(
    (s) =>
      s.status === SEAT_STATUSES.BOOKED || s.status === SEAT_STATUSES.RESERVED
  );

  const bookingCount = Math.min(
    bookedSeats.length,
    Math.floor(
      Math.random() *
        (MOCK_DATA_CONFIG.BOOKINGS_PER_PERFORMANCE.max -
          MOCK_DATA_CONFIG.BOOKINGS_PER_PERFORMANCE.min) +
        MOCK_DATA_CONFIG.BOOKINGS_PER_PERFORMANCE.min
    )
  );

  const usedSeats = new Set();
  let bookingId = bookings.length + 1;

  for (let i = 0; i < bookingCount; i++) {
    const seatsInThisBooking = Math.floor(Math.random() * 4) + 1;
    const bookingSeats = [];
    let totalAmount = 0;

    for (let j = 0; j < seatsInThisBooking; j++) {
      const availableSeats = bookedSeats.filter((s) => !usedSeats.has(s.id));
      if (availableSeats.length === 0) break;

      const seat =
        availableSeats[Math.floor(Math.random() * availableSeats.length)];
      usedSeats.add(seat.id);

      const ticketTypeKeys = Object.keys(TICKET_TYPES);
      const ticketType =
        ticketTypeKeys[Math.floor(Math.random() * ticketTypeKeys.length)];
      const discount = ticketType === "STANDARD" ? 1.0 : 0.5;

      bookingSeats.push({
        seatId: seat.id,
        section: seat.section,
        row: seat.row,
        seat: seat.seat,
        seatNumber: seat.seatNumber,
        tier: seat.tier,
        price: seat.price,
        ticketType,
        finalPrice: seat.price * discount,
      });

      totalAmount += seat.price * discount;
    }

    if (bookingSeats.length === 0) continue;

    const user =
      MOCK_USERS_STATIC[Math.floor(Math.random() * MOCK_USERS_STATIC.length)];
    const bookingDate = new Date();
    bookingDate.setDate(bookingDate.getDate() - Math.floor(Math.random() * 30));

    const paymentMethods = Object.values(PAYMENT_METHODS);
    const bookingStatuses = Object.values(BOOKING_STATUSES);
    const paymentStatuses = Object.values(PAYMENT_STATUSES);

    bookings.push({
      id: bookingId++,
      bookingReference: generateBookingReference(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      performanceId: performance.id,
      performanceTitle: performance.title,
      venueId: performance.venueId,
      venueName: performance.venueName,
      showtime: bookingSeats[0]?.seatId.includes("-S")
        ? performance.showtimes?.[
            parseInt(bookingSeats[0].seatId.split("-S")[1].split("-")[0])
          ] || performance.date
        : performance.date,
      seats: bookingSeats,
      seatCount: bookingSeats.length,
      amount: totalAmount,
      totalAmount,
      bookingDate: bookingDate.toISOString(),
      status:
        bookingStatuses[Math.floor(Math.random() * bookingStatuses.length)],
      paymentMethod:
        paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      paymentStatus:
        paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)],
      notes: null,
    });
  }

  return bookings;
};

export const generateAllBookings = () => {
  const allBookings = [];
  MOCK_PERFORMANCES.forEach((performance) => {
    const bookings = generateBookingsForPerformance(performance, MOCK_SEATS);
    allBookings.push(...bookings);
  });
  return allBookings;
};

export const MOCK_BOOKINGS = generateAllBookings();

export const MOCK_TRANSACTIONS = MOCK_BOOKINGS.map((booking, index) => ({
  id: index + 1,
  bookingId: booking.id,
  bookingReference: booking.bookingReference,
  userId: booking.userId,
  amount: booking.totalAmount,
  paymentMethod: booking.paymentMethod,
  status: booking.paymentStatus,
  transactionDate: booking.bookingDate,
  description: `Ticket purchase for ${booking.performanceTitle}`,
}));

export const getSeatsForPerformance = (performanceId, showtimeIndex = 0) => {
  return MOCK_SEATS.filter(
    (seat) =>
      seat.performanceId === performanceId &&
      seat.showtimeIndex === showtimeIndex
  );
};

export const getAvailableSeats = (performanceId, showtimeIndex = 0) => {
  return getSeatsForPerformance(performanceId, showtimeIndex).filter(
    (seat) => seat.status === SEAT_STATUSES.AVAILABLE
  );
};

export const getSeatById = (seatId) => {
  return MOCK_SEATS.find((seat) => seat.id === seatId);
};

export const getBookingsForUser = (userId) => {
  return MOCK_BOOKINGS.filter((booking) => booking.userId === userId);
};

export const getBookingByReference = (reference) => {
  return MOCK_BOOKINGS.find(
    (booking) => booking.bookingReference === reference
  );
};

export const getBookingsForPerformance = (performanceId) => {
  return MOCK_BOOKINGS.filter(
    (booking) => booking.performanceId === performanceId
  );
};

export const getTransactionsForUser = (userId) => {
  return MOCK_TRANSACTIONS.filter(
    (transaction) => transaction.userId === userId
  );
};

export const formatSeatDisplay = (seat) => {
  if (typeof seat === "string") return seat;
  if (seat.seatNumber) return seat.seatNumber;
  if (seat.row && seat.seat) return `${seat.row}${seat.seat}`;
  return JSON.stringify(seat);
};

export const formatSeatsDisplay = (seats) => {
  if (!seats || !Array.isArray(seats)) return "";
  return seats.map(formatSeatDisplay).join(", ");
};

export const getSeatsSummary = (seats) => {
  if (!seats || !Array.isArray(seats)) return "No seats";
  const count = seats.length;
  const seatNumbers = seats.map(formatSeatDisplay).join(", ");
  return `${count} seat${count > 1 ? "s" : ""}: ${seatNumbers}`;
};

export const formatBookingForDisplay = (booking) => {
  if (!booking) return null;

  return {
    ...booking,
    performanceTitle:
      booking.performanceTitle ||
      booking.performance?.title ||
      "Unknown Performance",
    venueName: booking.venueName || booking.venue?.name || "Unknown Venue",
    userName: booking.userName || booking.user?.name || "Unknown User",
    userEmail: booking.userEmail || booking.user?.email || "",
    seatsDisplay: formatSeatsDisplay(booking.seats),
    seatsSummary: getSeatsSummary(booking.seats),
    amountFormatted: `HKD ${(
      booking.amount ||
      booking.totalAmount ||
      0
    ).toLocaleString()}`,
    dateFormatted: booking.bookingDate
      ? new Date(booking.bookingDate).toLocaleString()
      : "",
  };
};
