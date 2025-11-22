import { faker } from "@faker-js/faker";
import { buildSeatMapFromVenueLayout } from "#utils/seatMapBuilder.js";

/**
 * Generates a list of broken/unavailable seat IDs for a venue
 * @param {Object} venue - Venue object with layout
 * @param {Object} config - Configuration object
 * @param {number} config.probability - Probability (0-1) that any given seat is broken
 * @param {number} config.maxBrokenSeats - Maximum number of broken seats to generate
 * @returns {string[]} Array of seat IDs that are broken/unavailable
 */
export function generateBrokenSeats(venue, config = {}) {
    const { probability = 0.05, maxBrokenSeats = 10 } = config;

    // Validate inputs
    if (!venue || !venue.layout) {
        return [];
    }

    if (probability <= 0 || maxBrokenSeats <= 0) {
        return [];
    }

    // Build seat map to get all available seats
    const seatMap = buildSeatMapFromVenueLayout(venue.layout);

    if (!seatMap || !seatMap.sections || seatMap.sections.length === 0) {
        return [];
    }

    // Collect all seat IDs
    const allSeatIds = [];
    for (const section of seatMap.sections) {
        for (const row of section.rows) {
            for (const seat of row.seats) {
                allSeatIds.push(seat.fullId);
            }
        }
    }

    if (allSeatIds.length === 0) {
        return [];
    }

    // Randomly select seats to mark as broken
    const brokenSeats = [];
    for (const seatId of allSeatIds) {
        if (brokenSeats.length >= maxBrokenSeats) {
            break;
        }

        // Use probability to determine if this seat should be broken
        if (faker.number.float({ min: 0, max: 1 }) < probability) {
            brokenSeats.push(seatId);
        }
    }

    return brokenSeats;
}

/**
 * Marks seats as unavailable in the seat map structure
 * @param {Object} seatMap - Seat map object from buildSeatMapFromVenueLayout
 * @param {string[]} brokenSeats - Array of seat IDs to mark as unavailable
 * @returns {Object} Updated seat map with unavailable seats marked
 */
export function markSeatsAsUnavailable(seatMap, brokenSeats = []) {
    if (!seatMap || !seatMap.sections || brokenSeats.length === 0) {
        return seatMap;
    }

    // Create a Set for faster lookup
    const brokenSeatSet = new Set(brokenSeats.map(id => id.toLowerCase()));

    // Deep clone the seat map to avoid mutations
    const updatedSeatMap = JSON.parse(JSON.stringify(seatMap));

    // Mark seats as unavailable
    for (const section of updatedSeatMap.sections) {
        for (const row of section.rows) {
            for (const seat of row.seats) {
                if (brokenSeatSet.has(seat.fullId.toLowerCase())) {
                    seat.unavailable = true;
                    seat.unavailableReason = "broken";
                }
            }
        }
    }

    // Update the index map as well
    if (updatedSeatMap.indexMap) {
        for (const seatId of brokenSeats) {
            const normalizedId = seatId.toLowerCase();
            if (updatedSeatMap.indexMap[normalizedId]) {
                updatedSeatMap.indexMap[normalizedId].unavailable = true;
                updatedSeatMap.indexMap[normalizedId].unavailableReason = "broken";
            }
        }
    }

    return updatedSeatMap;
}

/**
 * Updates a venue object with broken seat conditions
 * @param {Object} venue - Venue object to update
 * @param {string[]} brokenSeats - Array of seat IDs that are broken
 * @returns {Object} Updated layout object with conditions metadata
 */
export function updateVenueWithConditions(venue, brokenSeats = []) {
    if (!venue) {
        return {};
    }

    // Get the current layout from the venue
    // Handle Sequelize model instances by accessing the dataValues or using get()
    let currentLayout;
    if (venue.get && typeof venue.get === 'function') {
        // It's a Sequelize instance, use get() method
        currentLayout = venue.get('layout');
    } else if (venue.layout) {
        currentLayout = venue.layout;
    } else {
        currentLayout = {};
    }

    // Make a deep copy to avoid mutations
    const layoutCopy = currentLayout ? JSON.parse(JSON.stringify(currentLayout)) : {};

    // Store broken seats in the layout metadata, preserving existing sections
    const updatedLayout = {
        ...layoutCopy,
        conditions: {
            brokenSeats: brokenSeats || [],
            lastUpdated: new Date().toISOString(),
        },
    };

    return updatedLayout;
}
