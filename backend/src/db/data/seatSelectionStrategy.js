import { faker } from "@faker-js/faker";

/**
 * Strategy class for selecting seats from a venue's seat map
 * Handles occupied seats, broken seats, and various selection preferences
 */
export class SeatSelectionStrategy {
    /**
     * @param {Object} seatMap - Seat map from buildSeatMapFromVenueLayout
     * @param {Set<string>|string[]} occupiedSeats - Set or array of occupied seat IDs
     * @param {Set<string>|string[]} brokenSeats - Set or array of broken/unavailable seat IDs
     */
    constructor(seatMap, occupiedSeats = [], brokenSeats = []) {
        this.seatMap = seatMap;

        // Convert to Sets for efficient lookups, normalize to lowercase
        this.occupiedSeats = new Set(
            (Array.isArray(occupiedSeats) ? occupiedSeats : Array.from(occupiedSeats))
                .map(id => id.toLowerCase())
        );

        this.brokenSeats = new Set(
            (Array.isArray(brokenSeats) ? brokenSeats : Array.from(brokenSeats))
                .map(id => id.toLowerCase())
        );
    }

    /**
     * Checks if a specific seat is available for booking
     * @param {string} seatId - Seat ID to check
     * @returns {boolean} True if seat is available
     */
    isSeatAvailable(seatId) {
        const normalizedId = seatId.toLowerCase();

        // Check if seat is occupied or broken
        if (this.occupiedSeats.has(normalizedId) || this.brokenSeats.has(normalizedId)) {
            return false;
        }

        // Check if seat exists in the seat map and is not marked unavailable
        if (this.seatMap.indexMap && this.seatMap.indexMap[normalizedId]) {
            const seat = this.seatMap.indexMap[normalizedId];
            return !seat.unavailable;
        }

        return false;
    }

    /**
     * Gets all available seats, optionally filtered by tier
     * @param {string} [tier] - Optional tier filter (e.g., 'vip', 'premium', 'standard', 'economy')
     * @returns {Object[]} Array of available seat objects
     */
    getAvailableSeats(tier = null) {
        const availableSeats = [];

        if (!this.seatMap || !this.seatMap.sections) {
            return availableSeats;
        }

        for (const section of this.seatMap.sections) {
            // Filter by tier if specified
            if (tier && section.tier !== tier) {
                continue;
            }

            for (const row of section.rows) {
                for (const seat of row.seats) {
                    if (this.isSeatAvailable(seat.fullId)) {
                        availableSeats.push(seat);
                    }
                }
            }
        }

        return availableSeats;
    }

    /**
     * Finds adjacent seats in the same row for group bookings
     * @param {number} count - Number of adjacent seats needed
     * @param {string} [tier] - Optional tier preference
     * @returns {Object[]|null} Array of adjacent seat objects, or null if not found
     */
    findAdjacentSeats(count, tier = null) {
        if (count <= 0) {
            return null;
        }

        if (count === 1) {
            const available = this.getAvailableSeats(tier);
            return available.length > 0 ? [faker.helpers.arrayElement(available)] : null;
        }

        if (!this.seatMap || !this.seatMap.sections) {
            return null;
        }

        // Try to find adjacent seats in each section/row
        const sectionsToSearch = tier
            ? this.seatMap.sections.filter(s => s.tier === tier)
            : this.seatMap.sections;

        for (const section of sectionsToSearch) {
            for (const row of section.rows) {
                // Sort seats by seat number to ensure they're in order
                const sortedSeats = [...row.seats].sort((a, b) => a.seatNumber - b.seatNumber);

                // Look for consecutive available seats
                let consecutiveSeats = [];

                for (const seat of sortedSeats) {
                    if (this.isSeatAvailable(seat.fullId)) {
                        consecutiveSeats.push(seat);

                        // Check if we have enough consecutive seats
                        if (consecutiveSeats.length === count) {
                            // Verify they are truly consecutive by checking seat numbers
                            const isConsecutive = consecutiveSeats.every((s, idx) => {
                                if (idx === 0) return true;
                                return s.seatNumber === consecutiveSeats[idx - 1].seatNumber + 1;
                            });

                            if (isConsecutive) {
                                return consecutiveSeats;
                            }
                        }
                    } else {
                        // Reset if we hit an unavailable seat
                        consecutiveSeats = [];
                    }
                }
            }
        }

        // No adjacent seats found
        return null;
    }

    /**
     * Finds random non-adjacent seats
     * @param {number} count - Number of seats needed
     * @param {string} [tier] - Optional tier preference
     * @returns {Object[]|null} Array of random seat objects, or null if not enough available
     */
    findRandomSeats(count, tier = null) {
        if (count <= 0) {
            return null;
        }

        const availableSeats = this.getAvailableSeats(tier);

        if (availableSeats.length < count) {
            return null;
        }

        // Randomly select seats without replacement
        return faker.helpers.arrayElements(availableSeats, count);
    }

    /**
     * Main entry point for seat selection with preferences
     * @param {number} count - Number of seats to select
     * @param {Object} preferences - Selection preferences
     * @param {boolean} [preferences.preferAdjacent=false] - Try to find adjacent seats
     * @param {boolean} [preferences.preferPremium=false] - Prefer premium/VIP tiers
     * @param {string} [preferences.tier] - Specific tier to select from
     * @returns {Object[]|null} Array of selected seat objects, or null if unable to fulfill
     */
    selectSeats(count, preferences = {}) {
        const {
            preferAdjacent = false,
            preferPremium = false,
            tier = null
        } = preferences;

        if (count <= 0) {
            return null;
        }

        // Determine tier preference
        let targetTier = tier;

        if (!targetTier && preferPremium) {
            // Try premium tiers in order of preference
            const premiumTiers = ['vip', 'premium'];
            for (const premiumTier of premiumTiers) {
                const available = this.getAvailableSeats(premiumTier);
                if (available.length >= count) {
                    targetTier = premiumTier;
                    break;
                }
            }
        }

        // Try to find adjacent seats if preferred
        if (preferAdjacent) {
            const adjacentSeats = this.findAdjacentSeats(count, targetTier);
            if (adjacentSeats) {
                return adjacentSeats;
            }

            // If adjacent seats not found with specific tier, try without tier restriction
            if (targetTier) {
                const adjacentSeatsAnyTier = this.findAdjacentSeats(count, null);
                if (adjacentSeatsAnyTier) {
                    return adjacentSeatsAnyTier;
                }
            }
        }

        // Fall back to random seat selection
        const randomSeats = this.findRandomSeats(count, targetTier);
        if (randomSeats) {
            return randomSeats;
        }

        // If specific tier didn't work, try without tier restriction
        if (targetTier) {
            return this.findRandomSeats(count, null);
        }

        // Unable to find enough seats
        return null;
    }
}
