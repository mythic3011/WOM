/**
 * Mock Data Configuration
 * 
 * Manages configuration for mock data generation during database setup.
 * Supports environment-based settings and predefined presets for different scenarios.
 */

/**
 * Configuration presets for different data generation modes
 */
const PRESETS = {
    minimal: {
        volumes: {
            users: 5,
            venues: 2,
            performances: 5,
            ticketTypes: 3,
            bookings: 10,
        },
        seed: 12345,
        bookingPatterns: {
            averageOccupancy: 0.1,
            soldOutProbability: 0.05,
            preOrderProbability: 0.1,
            groupBookingProbability: 0.2,
            maxGroupSize: 4,
            statusDistribution: {
                confirmed: 70,
                pending: 15,
                cancelled: 10,
                completed: 5,
            },
            paymentMethodDistribution: {
                credit_card: 50,
                debit_card: 20,
                paypal: 15,
                bank_transfer: 10,
                cash: 5,
            },
            tierPreferences: {
                vip: 1,
                premium: 2,
                standard: 4,
                economy: 3,
            },
        },
        venueConditions: {
            brokenSeatProbability: 0.02,
            maxBrokenSeatsPerVenue: 5,
        },
    },

    standard: {
        volumes: {
            users: 20,
            venues: 3,
            performances: 12,
            ticketTypes: 5,
            bookings: 50,
        },
        seed: 12345,
        bookingPatterns: {
            averageOccupancy: 0.3,
            soldOutProbability: 0.1,
            preOrderProbability: 0.15,
            groupBookingProbability: 0.3,
            maxGroupSize: 6,
            statusDistribution: {
                confirmed: 65,
                pending: 20,
                cancelled: 10,
                completed: 5,
            },
            paymentMethodDistribution: {
                credit_card: 45,
                debit_card: 25,
                paypal: 15,
                bank_transfer: 10,
                cash: 5,
            },
            tierPreferences: {
                vip: 1,
                premium: 3,
                standard: 5,
                economy: 3,
            },
        },
        venueConditions: {
            brokenSeatProbability: 0.05,
            maxBrokenSeatsPerVenue: 10,
        },
    },

    full: {
        volumes: {
            users: 100,
            venues: 5,
            performances: 50,
            ticketTypes: 8,
            bookings: 300,
        },
        seed: 12345,
        bookingPatterns: {
            averageOccupancy: 0.5,
            soldOutProbability: 0.15,
            preOrderProbability: 0.2,
            groupBookingProbability: 0.4,
            maxGroupSize: 8,
            statusDistribution: {
                confirmed: 60,
                pending: 25,
                cancelled: 10,
                completed: 5,
            },
            paymentMethodDistribution: {
                credit_card: 40,
                debit_card: 25,
                paypal: 20,
                bank_transfer: 10,
                cash: 5,
            },
            tierPreferences: {
                vip: 2,
                premium: 4,
                standard: 5,
                economy: 3,
            },
        },
        venueConditions: {
            brokenSeatProbability: 0.08,
            maxBrokenSeatsPerVenue: 20,
        },
    },
};

/**
 * Parse environment variable as integer with fallback
 * @param {string} value - Environment variable value
 * @param {number} fallback - Default value if parsing fails
 * @returns {number} Parsed integer or fallback
 */
function parseIntWithFallback(value, fallback) {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
}

/**
 * Parse environment variable as float with fallback
 * @param {string} value - Environment variable value
 * @param {number} fallback - Default value if parsing fails
 * @returns {number} Parsed float or fallback
 */
function parseFloatWithFallback(value, fallback) {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? fallback : parsed;
}

/**
 * Get mock data configuration based on environment variables and presets
 * @returns {Object} Configuration object with volumes, seed, patterns, and conditions
 */
export function getMockDataConfig() {
    // Determine mode from environment or default to 'standard'
    const mode = (process.env.MOCK_DATA_MODE || 'standard').toLowerCase();

    // Validate mode
    if (!['minimal', 'standard', 'full'].includes(mode)) {
        console.warn(`Invalid MOCK_DATA_MODE: ${mode}. Defaulting to 'standard'.`);
        return { ...PRESETS.standard, mode: 'standard' };
    }

    // Get base preset
    const preset = PRESETS[mode];

    // Override with environment variables if provided
    const config = {
        mode,
        volumes: {
            users: parseIntWithFallback(process.env.MOCK_USERS_COUNT, preset.volumes.users),
            venues: parseIntWithFallback(process.env.MOCK_VENUES_COUNT, preset.volumes.venues),
            performances: parseIntWithFallback(process.env.MOCK_PERFORMANCES_COUNT, preset.volumes.performances),
            ticketTypes: parseIntWithFallback(process.env.MOCK_TICKET_TYPES_COUNT, preset.volumes.ticketTypes),
            bookings: parseIntWithFallback(process.env.MOCK_BOOKINGS_COUNT, preset.volumes.bookings),
        },
        seed: parseIntWithFallback(process.env.MOCK_DATA_SEED, preset.seed),
        bookingPatterns: {
            averageOccupancy: parseFloatWithFallback(
                process.env.MOCK_BOOKING_OCCUPANCY,
                preset.bookingPatterns.averageOccupancy
            ),
            soldOutProbability: parseFloatWithFallback(
                process.env.MOCK_SOLD_OUT_PROBABILITY,
                preset.bookingPatterns.soldOutProbability
            ),
            preOrderProbability: parseFloatWithFallback(
                process.env.MOCK_PRE_ORDER_PROBABILITY,
                preset.bookingPatterns.preOrderProbability
            ),
            groupBookingProbability: parseFloatWithFallback(
                process.env.MOCK_GROUP_BOOKING_PROBABILITY,
                preset.bookingPatterns.groupBookingProbability
            ),
            maxGroupSize: parseIntWithFallback(
                process.env.MOCK_MAX_GROUP_SIZE,
                preset.bookingPatterns.maxGroupSize
            ),
            statusDistribution: { ...preset.bookingPatterns.statusDistribution },
            paymentMethodDistribution: { ...preset.bookingPatterns.paymentMethodDistribution },
            tierPreferences: { ...preset.bookingPatterns.tierPreferences },
        },
        venueConditions: {
            brokenSeatProbability: parseFloatWithFallback(
                process.env.MOCK_BROKEN_SEAT_PROBABILITY,
                preset.venueConditions.brokenSeatProbability
            ),
            maxBrokenSeatsPerVenue: parseIntWithFallback(
                process.env.MOCK_MAX_BROKEN_SEATS,
                preset.venueConditions.maxBrokenSeatsPerVenue
            ),
        },
    };

    return config;
}

/**
 * Export presets for testing and reference
 */
export const mockDataPresets = PRESETS;

export default getMockDataConfig;
