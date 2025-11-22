import { faker } from "@faker-js/faker";
import { SeatSelectionStrategy } from "./seatSelectionStrategy.js";

/**
 * Generates a unique booking reference code
 * Format: BK-YYYYMMDD-XXXXX (e.g., BK-20250120-A1B2C)
 * @returns {string} Unique booking reference
 */
export function generateBookingReference() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const randomCode = faker.string.alphanumeric(5).toUpperCase();

    return `BK-${year}${month}${day}-${randomCode}`;
}

/**
 * Selects a random user from the users dataset for booking assignment
 * @param {Array} users - Array of user objects
 * @returns {Object} Selected user object with id, name, and email
 */
export function selectUserForBooking(users) {
    if (!users || users.length === 0) {
        throw new Error('No users available for booking assignment');
    }

    const user = faker.helpers.arrayElement(users);

    return {
        id: user.id,
        name: user.name,
        email: user.email
    };
}

/**
 * Selects a performance for booking based on status and date distribution
 * Prioritizes performances that are on sale and closer to current date
 * @param {Array} performances - Array of performance objects
 * @param {Object} patterns - Booking patterns configuration
 * @returns {Object} Selected performance object
 */
export function selectPerformanceForBooking(performances, patterns = {}) {
    if (!performances || performances.length === 0) {
        throw new Error('No performances available for booking');
    }

    // Filter performances by status - prefer on_sale and early_bird
    const preferredStatuses = ['on_sale', 'early_bird'];
    const preferredPerformances = performances.filter(p =>
        preferredStatuses.includes(p.status)
    );

    // If we have preferred performances, use weighted selection
    // Otherwise, use all performances
    const candidatePerformances = preferredPerformances.length > 0
        ? preferredPerformances
        : performances;

    // Weight performances by how soon they are (closer = higher weight)
    const now = new Date();
    const weightedPerformances = candidatePerformances.map(perf => {
        const perfDate = new Date(perf.date);
        const daysUntil = Math.max(1, Math.ceil((perfDate - now) / (1000 * 60 * 60 * 24)));

        // Closer performances get higher weight (inverse of days)
        // Cap at 180 days to avoid extreme weights
        const weight = Math.max(1, 180 - Math.min(daysUntil, 180));

        return { performance: perf, weight };
    });

    // Select using weighted random
    const totalWeight = weightedPerformances.reduce((sum, item) => sum + item.weight, 0);
    let random = faker.number.float({ min: 0, max: totalWeight });

    for (const item of weightedPerformances) {
        random -= item.weight;
        if (random <= 0) {
            return item.performance;
        }
    }

    // Fallback to last item
    return weightedPerformances[weightedPerformances.length - 1].performance;
}

/**
 * Generates a realistic booking date relative to the performance date
 * Most bookings occur within 30 days before the performance
 * @param {Date|string} performanceDate - Performance date
 * @returns {Date} Booking date
 */
export function generateBookingDate(performanceDate) {
    const perfDate = new Date(performanceDate);
    const now = new Date();

    // Calculate days until performance
    const daysUntil = Math.ceil((perfDate - now) / (1000 * 60 * 60 * 24));

    // If performance is in the past or today, booking date is in the past
    if (daysUntil <= 0) {
        // Book 1-30 days before the performance
        const daysBeforePerf = faker.number.int({ min: 1, max: 30 });
        const bookingDate = new Date(perfDate);
        bookingDate.setDate(bookingDate.getDate() - daysBeforePerf);
        return bookingDate;
    }

    // For future performances, most bookings happen within 30 days before
    // Use weighted distribution: 60% within last 30 days, 30% within 30-60 days, 10% earlier
    const distribution = faker.number.float({ min: 0, max: 1 });

    let daysBeforePerf;
    if (distribution < 0.6) {
        // 60% chance: within last 30 days
        daysBeforePerf = faker.number.int({ min: 1, max: Math.min(30, daysUntil) });
    } else if (distribution < 0.9) {
        // 30% chance: 30-60 days before
        daysBeforePerf = faker.number.int({
            min: Math.min(30, daysUntil),
            max: Math.min(60, daysUntil)
        });
    } else {
        // 10% chance: more than 60 days before
        daysBeforePerf = faker.number.int({
            min: Math.min(60, daysUntil),
            max: daysUntil
        });
    }

    const bookingDate = new Date(perfDate);
    bookingDate.setDate(bookingDate.getDate() - daysBeforePerf);

    // Ensure booking date is not in the future
    if (bookingDate > now) {
        return now;
    }

    return bookingDate;
}

/**
 * Assigns a booking status based on configured distribution
 * @param {Object} statusDistribution - Distribution percentages for each status
 * @returns {string} Booking status (pending, confirmed, cancelled, completed)
 */
export function assignBookingStatus(statusDistribution = {}) {
    const defaultDistribution = {
        confirmed: 65,
        pending: 20,
        cancelled: 10,
        completed: 5
    };

    const distribution = { ...defaultDistribution, ...statusDistribution };

    // Create weighted array
    const statuses = [];
    Object.entries(distribution).forEach(([status, weight]) => {
        for (let i = 0; i < weight; i++) {
            statuses.push(status);
        }
    });

    return faker.helpers.arrayElement(statuses);
}

/**
 * Calculates the total booking amount from seat tickets
 * @param {Array} seatTickets - Array of seat ticket objects with price
 * @returns {Object} Object with amount and totalAmount (same value)
 */
export function calculateBookingAmount(seatTickets) {
    if (!seatTickets || seatTickets.length === 0) {
        return { amount: 0, totalAmount: 0 };
    }

    const total = seatTickets.reduce((sum, ticket) => {
        return sum + (ticket.price || 0);
    }, 0);

    // Round to 2 decimal places
    const roundedTotal = Math.round(total * 100) / 100;

    return {
        amount: roundedTotal,
        totalAmount: roundedTotal
    };
}


/**
 * Selects seats for a booking based on preferences and availability
 * Creates seatTickets array with proper structure including pricing
 * 
 * @param {Object} performance - Performance object with seat map and pricing
 * @param {Array} ticketTypes - Array of available ticket types
 * @param {number} seatCount - Number of seats to book
 * @param {Set<string>} occupiedSeats - Set of already occupied seat IDs for this performance
 * @param {Set<string>} brokenSeats - Set of broken/unavailable seat IDs
 * @param {Object} preferences - Booking preferences
 * @param {boolean} [preferences.preferAdjacent=true] - Try to find adjacent seats for groups
 * @param {boolean} [preferences.preferPremium=false] - Prefer premium/VIP tiers
 * @returns {Array|null} Array of seatTicket objects, or null if unable to fulfill
 */
export function selectSeatsForBooking(
    performance,
    ticketTypes,
    seatCount,
    occupiedSeats = new Set(),
    brokenSeats = new Set(),
    preferences = {}
) {
    if (!performance || !performance.seatMap) {
        throw new Error('Performance must have a seat map');
    }

    if (!ticketTypes || ticketTypes.length === 0) {
        throw new Error('No ticket types available');
    }

    if (seatCount <= 0) {
        return null;
    }

    // Default preferences
    const {
        preferAdjacent = seatCount > 1, // Default to adjacent for groups
        preferPremium = false
    } = preferences;

    // Create seat selection strategy
    const strategy = new SeatSelectionStrategy(
        performance.seatMap,
        occupiedSeats,
        brokenSeats
    );

    // Select seats using the strategy
    const selectedSeats = strategy.selectSeats(seatCount, {
        preferAdjacent,
        preferPremium
    });

    if (!selectedSeats || selectedSeats.length === 0) {
        return null;
    }

    // Get pricing sections from performance
    const pricingSections = performance.pricingSections ||
        performance.showtimes?.[0]?.pricing?.sections ||
        [];

    if (pricingSections.length === 0) {
        throw new Error('Performance has no pricing information');
    }

    // Create a map of tier to base price for quick lookup
    const tierPriceMap = {};
    pricingSections.forEach(section => {
        if (section.tier && section.basePrice) {
            tierPriceMap[section.tier] = section.basePrice;
        }
    });

    // Select a ticket type (weighted towards standard, but can vary)
    // For group bookings, prefer group ticket types if available
    let selectedTicketType;

    if (seatCount >= 10) {
        // Try to use GROUP-10 if available
        selectedTicketType = ticketTypes.find(tt => tt.id === 'GROUP-10') ||
            ticketTypes.find(tt => tt.id === 'GROUP-5') ||
            ticketTypes.find(tt => tt.id === 'STANDARD');
    } else if (seatCount >= 5) {
        // Try to use GROUP-5 if available
        selectedTicketType = ticketTypes.find(tt => tt.id === 'GROUP-5') ||
            ticketTypes.find(tt => tt.id === 'STANDARD');
    } else if (seatCount >= 4) {
        // Try to use FAMILY-PACK if available
        selectedTicketType = ticketTypes.find(tt => tt.id === 'FAMILY-PACK') ||
            ticketTypes.find(tt => tt.id === 'STANDARD');
    } else {
        // For smaller bookings, use weighted random selection
        const weights = {
            'STANDARD': 50,
            'STUDENT': 20,
            'SENIOR': 15,
            'CHILD': 15
        };

        const weightedTypes = [];
        ticketTypes.forEach(tt => {
            const weight = weights[tt.id] || 5;
            for (let i = 0; i < weight; i++) {
                weightedTypes.push(tt);
            }
        });

        selectedTicketType = faker.helpers.arrayElement(weightedTypes);
    }

    // Fallback to first available ticket type
    if (!selectedTicketType) {
        selectedTicketType = ticketTypes[0];
    }

    // Build seatTickets array
    const seatTickets = selectedSeats.map(seat => {
        // Get base price for this seat's tier
        const basePrice = tierPriceMap[seat.tier] || tierPriceMap['standard'] || 500;

        // Apply ticket type discount
        const discount = selectedTicketType.discount || 1.0;
        const finalPrice = Math.round(basePrice * discount);

        // Find the pricing section for this seat's tier
        const pricingSection = pricingSections.find(ps => ps.tier === seat.tier) ||
            pricingSections[0];

        return {
            seatId: seat.fullId,
            seatLabel: seat.displayLabel,
            ticketTypeId: selectedTicketType.id,
            ticketTypeName: selectedTicketType.name,
            price: finalPrice,
            basePrice: basePrice,
            section: seat.sectionName,
            row: seat.rowLabel
        };
    });

    return seatTickets;
}

/**
 * Calculates target occupancy rate based on performance status
 * Different statuses have different expected booking volumes
 * 
 * @param {string} status - Performance status (sold_out, pre_order, on_sale, early_bird, upcoming)
 * @param {Object} patterns - Booking patterns configuration
 * @returns {number} Target occupancy rate (0-1)
 */
export function calculateStatusBasedOccupancy(status, patterns = {}) {
    const averageOccupancy = patterns.averageOccupancy || 0.3;

    switch (status) {
        case 'sold_out':
            return 1.0; // 100% occupancy

        case 'pre_order':
            // 5-10% occupancy for pre-order
            return faker.number.float({ min: 0.05, max: 0.10 });

        case 'on_sale':
            // Use configured average occupancy (typically 30-50%)
            return averageOccupancy;

        case 'early_bird':
            // 15-25% occupancy for early bird period
            return faker.number.float({ min: 0.15, max: 0.25 });

        case 'upcoming':
            // 0-5% occupancy for future performances
            return faker.number.float({ min: 0, max: 0.05 });

        default:
            // Default to average occupancy
            return averageOccupancy;
    }
}

/**
 * Generates bookings for a sold-out performance
 * Creates multiple bookings distributed across different users until all seats are filled
 * 
 * @param {Object} performance - Performance object with seat map
 * @param {Array} users - Array of user objects
 * @param {Array} ticketTypes - Array of ticket type objects
 * @param {Set<string>} occupiedSeats - Set to track occupied seats (will be modified)
 * @param {Set<string>} brokenSeats - Set of broken/unavailable seat IDs
 * @param {Object} patterns - Booking patterns configuration
 * @returns {Array} Array of booking data objects
 */
export function generateSoldOutPerformance(
    performance,
    users,
    ticketTypes,
    occupiedSeats,
    brokenSeats = new Set(),
    patterns = {}
) {
    const bookings = [];

    if (!performance || !performance.seatMap) {
        throw new Error('Performance must have a seat map');
    }

    // Calculate total available seats (excluding broken seats)
    const strategy = new SeatSelectionStrategy(performance.seatMap, occupiedSeats, brokenSeats);
    let availableSeats = strategy.getAvailableSeats();
    const totalAvailableSeats = availableSeats.length;

    if (totalAvailableSeats === 0) {
        return bookings;
    }

    // Track which users have bookings to ensure distribution
    const usersWithBookings = new Set();
    const maxGroupSize = patterns.maxGroupSize || 6;
    const groupBookingProbability = patterns.groupBookingProbability || 0.3;

    // Generate bookings until all seats are filled
    while (availableSeats.length > 0) {
        // Determine booking size
        let bookingSize;

        if (availableSeats.length === 1) {
            bookingSize = 1;
        } else if (availableSeats.length <= 3) {
            // For last few seats, book individually to avoid adjacency issues
            bookingSize = 1;
        } else if (availableSeats.length <= maxGroupSize) {
            // For remaining seats, book in smaller groups
            bookingSize = Math.min(2, availableSeats.length);
        } else {
            // Randomly determine if this is a group booking
            const isGroupBooking = faker.number.float({ min: 0, max: 1 }) < groupBookingProbability;

            if (isGroupBooking) {
                // Group booking: 2 to maxGroupSize seats
                bookingSize = faker.number.int({
                    min: 2,
                    max: Math.min(maxGroupSize, availableSeats.length)
                });
            } else {
                // Individual booking: 1-2 seats
                bookingSize = faker.number.int({
                    min: 1,
                    max: Math.min(2, availableSeats.length)
                });
            }
        }

        // Select seats for this booking
        // For the last few seats, don't require adjacency
        const preferAdjacent = bookingSize > 1 && availableSeats.length > 10;

        let seatTickets = selectSeatsForBooking(
            performance,
            ticketTypes,
            bookingSize,
            occupiedSeats,
            brokenSeats,
            {
                preferAdjacent,
                preferPremium: false
            }
        );

        // If we couldn't get the requested number, try with a smaller size
        if (!seatTickets || seatTickets.length === 0) {
            if (bookingSize > 1) {
                // Try with just 1 seat
                seatTickets = selectSeatsForBooking(
                    performance,
                    ticketTypes,
                    1,
                    occupiedSeats,
                    brokenSeats,
                    {
                        preferAdjacent: false,
                        preferPremium: false
                    }
                );
            }

            if (!seatTickets || seatTickets.length === 0) {
                // Unable to select seats, break to avoid infinite loop
                console.warn(`Unable to select seats for sold-out performance. ${availableSeats.length} seats remaining.`);
                break;
            }
        }

        // Select a user for this booking
        // Prefer users who don't have bookings yet, but allow repeats
        let selectedUser;
        if (usersWithBookings.size < users.length * 0.8) {
            // Still have users without bookings, prefer them
            const usersWithoutBookings = users.filter(u => !usersWithBookings.has(u.id));
            if (usersWithoutBookings.length > 0) {
                selectedUser = selectUserForBooking(usersWithoutBookings);
            } else {
                selectedUser = selectUserForBooking(users);
            }
        } else {
            // Most users have bookings, select randomly
            selectedUser = selectUserForBooking(users);
        }

        usersWithBookings.add(selectedUser.id);

        // Calculate amounts
        const { amount, totalAmount } = calculateBookingAmount(seatTickets);

        // Generate booking date
        const bookingDate = generateBookingDate(performance.date);

        // For sold-out performances, most bookings should be confirmed
        const statusWeights = {
            confirmed: 85,
            completed: 10,
            pending: 3,
            cancelled: 2
        };
        const status = assignBookingStatus(statusWeights);

        // Select payment method
        const paymentMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer'];
        const paymentMethod = faker.helpers.arrayElement(paymentMethods);

        // Payment status based on booking status
        let paymentStatus;
        if (status === 'confirmed' || status === 'completed') {
            paymentStatus = 'paid';
        } else if (status === 'cancelled') {
            paymentStatus = faker.helpers.arrayElement(['refunded', 'failed']);
        } else {
            paymentStatus = 'pending';
        }

        // Create booking object
        const booking = {
            bookingReference: generateBookingReference(),
            userId: selectedUser.id,
            userName: selectedUser.name,
            userEmail: selectedUser.email,
            performanceId: performance.id,
            performanceTitle: performance.title,
            venueId: performance.venueId,
            venueName: performance.venueName || 'Unknown Venue',
            showtimeId: performance.showtimes?.[0]?.id || `showtime-${performance.id}`,
            showtime: new Date(performance.date),
            seatTickets,
            seatCount: seatTickets.length,
            amount,
            totalAmount,
            bookingDate,
            status,
            paymentMethod,
            paymentStatus,
            notes: null,
            customerInfo: null
        };

        bookings.push(booking);

        // Mark seats as occupied
        seatTickets.forEach(ticket => {
            occupiedSeats.add(ticket.seatId.toLowerCase());
        });

        // Update available seats
        availableSeats = strategy.getAvailableSeats();
    }

    return bookings;
}

/**
 * Generates minimal bookings for a pre-order performance
 * Creates 5-10% occupancy with bookings distributed across users
 * 
 * @param {Object} performance - Performance object with seat map
 * @param {Array} users - Array of user objects
 * @param {Array} ticketTypes - Array of ticket type objects
 * @param {Set<string>} occupiedSeats - Set to track occupied seats (will be modified)
 * @param {Set<string>} brokenSeats - Set of broken/unavailable seat IDs
 * @param {Object} patterns - Booking patterns configuration
 * @returns {Array} Array of booking data objects
 */
export function handlePreOrderPerformance(
    performance,
    users,
    ticketTypes,
    occupiedSeats,
    brokenSeats = new Set(),
    patterns = {}
) {
    const bookings = [];

    if (!performance || !performance.seatMap) {
        throw new Error('Performance must have a seat map');
    }

    // Calculate target occupancy for pre-order (5-10%)
    const targetOccupancy = calculateStatusBasedOccupancy('pre_order', patterns);

    // Calculate total available seats
    const strategy = new SeatSelectionStrategy(performance.seatMap, occupiedSeats, brokenSeats);
    const availableSeats = strategy.getAvailableSeats();
    const totalAvailableSeats = availableSeats.length;

    if (totalAvailableSeats === 0) {
        return bookings;
    }

    // Calculate target number of seats to book
    const targetSeatsToBook = Math.floor(totalAvailableSeats * targetOccupancy);

    if (targetSeatsToBook === 0) {
        return bookings;
    }

    // Generate bookings until we reach target occupancy
    let seatsBooked = 0;
    const maxGroupSize = Math.min(patterns.maxGroupSize || 4, 4); // Smaller groups for pre-order
    const groupBookingProbability = (patterns.groupBookingProbability || 0.3) * 0.5; // Lower group probability

    while (seatsBooked < targetSeatsToBook) {
        const remainingSeats = targetSeatsToBook - seatsBooked;

        // Determine booking size
        let bookingSize;
        if (remainingSeats === 1) {
            bookingSize = 1;
        } else if (remainingSeats <= maxGroupSize) {
            bookingSize = remainingSeats;
        } else {
            // Randomly determine booking size
            const isGroupBooking = faker.number.float({ min: 0, max: 1 }) < groupBookingProbability;

            if (isGroupBooking) {
                bookingSize = faker.number.int({
                    min: 2,
                    max: Math.min(maxGroupSize, remainingSeats)
                });
            } else {
                bookingSize = faker.number.int({
                    min: 1,
                    max: Math.min(2, remainingSeats)
                });
            }
        }

        // Select seats for this booking
        const seatTickets = selectSeatsForBooking(
            performance,
            ticketTypes,
            bookingSize,
            occupiedSeats,
            brokenSeats,
            {
                preferAdjacent: bookingSize > 1,
                preferPremium: faker.number.float({ min: 0, max: 1 }) < 0.3 // 30% prefer premium for early birds
            }
        );

        if (!seatTickets || seatTickets.length === 0) {
            // Unable to select seats, break to avoid infinite loop
            break;
        }

        // Select a user for this booking
        const selectedUser = selectUserForBooking(users);

        // Calculate amounts
        const { amount, totalAmount } = calculateBookingAmount(seatTickets);

        // Generate booking date (pre-order bookings are typically early)
        const bookingDate = generateBookingDate(performance.date);

        // For pre-order, most bookings should be confirmed or pending
        const statusWeights = {
            confirmed: 60,
            pending: 35,
            cancelled: 3,
            completed: 2
        };
        const status = assignBookingStatus(statusWeights);

        // Select payment method
        const paymentMethods = ['credit_card', 'debit_card', 'paypal', 'bank_transfer'];
        const paymentMethod = faker.helpers.arrayElement(paymentMethods);

        // Payment status based on booking status
        let paymentStatus;
        if (status === 'confirmed' || status === 'completed') {
            paymentStatus = 'paid';
        } else if (status === 'cancelled') {
            paymentStatus = faker.helpers.arrayElement(['refunded', 'failed']);
        } else {
            paymentStatus = 'pending';
        }

        // Create booking object
        const booking = {
            bookingReference: generateBookingReference(),
            userId: selectedUser.id,
            userName: selectedUser.name,
            userEmail: selectedUser.email,
            performanceId: performance.id,
            performanceTitle: performance.title,
            venueId: performance.venueId,
            venueName: performance.venueName || 'Unknown Venue',
            showtimeId: performance.showtimes?.[0]?.id || `showtime-${performance.id}`,
            showtime: new Date(performance.date),
            seatTickets,
            seatCount: seatTickets.length,
            amount,
            totalAmount,
            bookingDate,
            status,
            paymentMethod,
            paymentStatus,
            notes: null,
            customerInfo: null
        };

        bookings.push(booking);

        // Mark seats as occupied
        seatTickets.forEach(ticket => {
            occupiedSeats.add(ticket.seatId.toLowerCase());
        });

        // Update seats booked count
        seatsBooked += seatTickets.length;
    }

    return bookings;
}

/**
 * Main booking generation function
 * Generates realistic bookings for performances with configurable patterns
 * 
 * @param {Object} options - Generation options
 * @param {Array} options.users - Array of user objects
 * @param {Array} options.performances - Array of performance objects with seat maps
 * @param {Array} options.ticketTypes - Array of ticket type objects
 * @param {number} [options.count] - Target number of bookings to generate (may vary based on patterns)
 * @param {number} [options.seed] - Seed for deterministic random generation
 * @param {Object} [options.patterns] - Booking patterns configuration
 * @param {Set<string>} [options.brokenSeats] - Map of performance ID to set of broken seat IDs
 * @returns {Promise<Array>} Array of booking data objects
 */
export async function generateBookings(options = {}) {
    const {
        users = [],
        performances = [],
        ticketTypes = [],
        count = 50,
        seed = 12345,
        patterns = {},
        brokenSeats = new Map()
    } = options;

    // Validate required inputs
    if (!users || users.length === 0) {
        throw new Error('No users provided for booking generation');
    }

    if (!performances || performances.length === 0) {
        throw new Error('No performances provided for booking generation');
    }

    if (!ticketTypes || ticketTypes.length === 0) {
        throw new Error('No ticket types provided for booking generation');
    }

    // Initialize faker with seed for deterministic generation
    faker.seed(seed);

    // Filter out performances with invalid seat maps
    const validPerformances = performances.filter(perf => {
        const hasValidSeatMap = perf.seatMap &&
            perf.seatMap.total > 0 &&
            perf.totalSeats > 0;

        if (!hasValidSeatMap) {
            console.log(`Skipping performance ${perf.id} - invalid seat map (totalSeats: ${perf.totalSeats}, seatMap.total: ${perf.seatMap?.total || 0})`);
        }

        return hasValidSeatMap;
    });

    if (validPerformances.length === 0) {
        console.warn('No valid performances with seat maps found for booking generation');
        return [];
    }

    console.log(`Booking generation: ${validPerformances.length} valid performances out of ${performances.length} total`);

    // Track occupied seats per performance
    const occupiedSeatsMap = new Map();
    validPerformances.forEach(perf => {
        occupiedSeatsMap.set(perf.id, new Set());
    });

    // Array to collect all generated bookings
    const allBookings = [];

    // Separate performances by status for special handling
    const soldOutPerformances = validPerformances.filter(p => p.status === 'sold_out');
    const preOrderPerformances = validPerformances.filter(p => p.status === 'pre_order');
    const regularPerformances = validPerformances.filter(p =>
        p.status !== 'sold_out' && p.status !== 'pre_order'
    );

    // Handle sold-out performances first (these generate their own booking count)
    for (const performance of soldOutPerformances) {
        const perfBrokenSeats = brokenSeats.get(performance.id) || new Set();
        const occupiedSeats = occupiedSeatsMap.get(performance.id);

        const soldOutBookings = generateSoldOutPerformance(
            performance,
            users,
            ticketTypes,
            occupiedSeats,
            perfBrokenSeats,
            patterns
        );

        allBookings.push(...soldOutBookings);
    }

    // Handle pre-order performances (these generate their own booking count based on occupancy)
    for (const performance of preOrderPerformances) {
        const perfBrokenSeats = brokenSeats.get(performance.id) || new Set();
        const occupiedSeats = occupiedSeatsMap.get(performance.id);

        const preOrderBookings = handlePreOrderPerformance(
            performance,
            users,
            ticketTypes,
            occupiedSeats,
            perfBrokenSeats,
            patterns
        );

        allBookings.push(...preOrderBookings);
    }

    // Generate regular bookings for remaining performances
    // Distribute the target count across regular performances
    if (regularPerformances.length > 0) {
        let bookingsGenerated = 0;
        const targetBookings = count;
        const maxGroupSize = patterns.maxGroupSize || 6;
        const groupBookingProbability = patterns.groupBookingProbability || 0.3;

        // Generate bookings until we reach the target count
        while (bookingsGenerated < targetBookings) {
            // Select a performance for this booking
            const performance = selectPerformanceForBooking(regularPerformances, patterns);

            if (!performance || !performance.seatMap) {
                // Skip performances without seat maps
                continue;
            }

            const perfBrokenSeats = brokenSeats.get(performance.id) || new Set();
            const occupiedSeats = occupiedSeatsMap.get(performance.id);

            // Check if performance has available seats
            const strategy = new SeatSelectionStrategy(
                performance.seatMap,
                occupiedSeats,
                perfBrokenSeats
            );
            const availableSeats = strategy.getAvailableSeats();

            if (availableSeats.length === 0) {
                // Performance is full, skip it
                continue;
            }

            // Calculate target occupancy for this performance status
            const targetOccupancy = calculateStatusBasedOccupancy(performance.status, patterns);

            // Get total available seats for this performance
            const totalAvailableSeats = availableSeats.length;
            const currentOccupancy = occupiedSeats.size / (totalAvailableSeats + occupiedSeats.size);

            // If performance has reached target occupancy, reduce probability of selecting it
            if (currentOccupancy >= targetOccupancy) {
                // 20% chance to still add a booking
                if (faker.number.float({ min: 0, max: 1 }) > 0.2) {
                    continue;
                }
            }

            // Determine booking size
            const remainingBookings = targetBookings - bookingsGenerated;
            let bookingSize;

            if (remainingBookings === 1 || availableSeats.length === 1) {
                bookingSize = 1;
            } else {
                // Randomly determine if this is a group booking
                const isGroupBooking = faker.number.float({ min: 0, max: 1 }) < groupBookingProbability;

                if (isGroupBooking) {
                    // Group booking: 2 to maxGroupSize seats
                    bookingSize = faker.number.int({
                        min: 2,
                        max: Math.min(maxGroupSize, availableSeats.length)
                    });
                } else {
                    // Individual booking: 1-2 seats
                    bookingSize = faker.number.int({
                        min: 1,
                        max: Math.min(2, availableSeats.length)
                    });
                }
            }

            // Select seats for this booking
            const seatTickets = selectSeatsForBooking(
                performance,
                ticketTypes,
                bookingSize,
                occupiedSeats,
                perfBrokenSeats,
                {
                    preferAdjacent: bookingSize > 1,
                    preferPremium: faker.number.float({ min: 0, max: 1 }) < 0.2 // 20% prefer premium
                }
            );

            if (!seatTickets || seatTickets.length === 0) {
                // Unable to select seats, try another performance
                continue;
            }

            // Select a user for this booking
            const selectedUser = selectUserForBooking(users);

            // Calculate amounts
            const { amount, totalAmount } = calculateBookingAmount(seatTickets);

            // Generate booking date
            const bookingDate = generateBookingDate(performance.date);

            // Assign booking status based on configured distribution
            const status = assignBookingStatus(patterns.statusDistribution);

            // Select payment method based on distribution
            const paymentMethodDistribution = patterns.paymentMethodDistribution || {
                credit_card: 45,
                debit_card: 25,
                paypal: 15,
                bank_transfer: 10,
                cash: 5
            };

            const paymentMethods = [];
            Object.entries(paymentMethodDistribution).forEach(([method, weight]) => {
                for (let i = 0; i < weight; i++) {
                    paymentMethods.push(method);
                }
            });
            const paymentMethod = faker.helpers.arrayElement(paymentMethods);

            // Payment status based on booking status
            let paymentStatus;
            if (status === 'confirmed' || status === 'completed') {
                paymentStatus = 'paid';
            } else if (status === 'cancelled') {
                paymentStatus = faker.helpers.arrayElement(['refunded', 'failed']);
            } else {
                paymentStatus = 'pending';
            }

            // Create booking object
            const booking = {
                bookingReference: generateBookingReference(),
                userId: selectedUser.id,
                userName: selectedUser.name,
                userEmail: selectedUser.email,
                performanceId: performance.id,
                performanceTitle: performance.title,
                venueId: performance.venueId,
                venueName: performance.venueName || 'Unknown Venue',
                showtimeId: performance.showtimes?.[0]?.id || `showtime-${performance.id}`,
                showtime: new Date(performance.date),
                seatTickets,
                seatCount: seatTickets.length,
                amount,
                totalAmount,
                bookingDate,
                status,
                paymentMethod,
                paymentStatus,
                notes: null,
                customerInfo: null
            };

            allBookings.push(booking);

            // Mark seats as occupied
            seatTickets.forEach(ticket => {
                occupiedSeats.add(ticket.seatId.toLowerCase());
            });

            // Increment bookings generated
            bookingsGenerated++;
        }
    }

    return allBookings;
}
