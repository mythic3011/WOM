/**
 * Seat ID Helper Utilities
 * 
 * Provides utilities for parsing and validating seat IDs and seat ticket structures.
 * Seat IDs follow the format: {section}-{row}-{number}
 * Example: "orchestra-A-12"
 */

/**
 * Extract section from seat ID
 * @param {string} seatId - Seat ID in format "section-row-number"
 * @returns {string|null} Section name or null if invalid
 * @example
 * extractSection("orchestra-A-12") // returns "orchestra"
 * extractSection("balcony-B-5") // returns "balcony"
 */
export function extractSection(seatId) {
    if (!seatId || typeof seatId !== 'string') {
        return null;
    }

    const parts = seatId.split('-');
    if (parts.length < 3) {
        return null;
    }

    return parts[0];
}

/**
 * Extract row from seat ID
 * @param {string} seatId - Seat ID in format "section-row-number"
 * @returns {string|null} Row identifier or null if invalid
 * @example
 * extractRow("orchestra-A-12") // returns "A"
 * extractRow("balcony-AA-5") // returns "AA"
 */
export function extractRow(seatId) {
    if (!seatId || typeof seatId !== 'string') {
        return null;
    }

    const parts = seatId.split('-');
    if (parts.length < 3) {
        return null;
    }

    return parts[1];
}

/**
 * Parse seat ID into its components
 * @param {string} seatId - Seat ID in format "section-row-number"
 * @returns {Object|null} Object with section, row, and number properties, or null if invalid
 * @example
 * parseSeatId("orchestra-A-12") // returns { section: "orchestra", row: "A", number: 12 }
 * parseSeatId("balcony-AA-5") // returns { section: "balcony", row: "AA", number: 5 }
 */
export function parseSeatId(seatId) {
    if (!seatId || typeof seatId !== 'string') {
        return null;
    }

    const parts = seatId.split('-');

    // Handle format: section-row-number (e.g., "stalls-g-5")
    if (parts.length >= 3) {
        const section = parts[0];
        const row = parts[1];
        const number = parseInt(parts[2], 10);

        // Validate that number is a valid positive integer
        if (!isNaN(number) && number > 0) {
            return {
                section,
                row,
                number
            };
        }

        // If third part is not a number, try parsing it as rowNumber format
        // Handle format: section-sectionId-rowNumber (e.g., "section-1-a16")
        const rowAndNumber = parts[2];
        const match = rowAndNumber.match(/^([a-z]+)(\d+)$/i);
        if (match) {
            const number = parseInt(match[2], 10);

            if (!isNaN(number) && number > 0) {
                return {
                    section: parts[0],
                    row: match[1].toLowerCase(),
                    number
                };
            }
        }
    }

    // Handle format: section-rowNumber (e.g., "stalls-g5")
    if (parts.length === 2) {
        const section = parts[0];
        const rowAndNumber = parts[1];

        // Extract row (letters) and number from combined format
        const match = rowAndNumber.match(/^([a-z]+)(\d+)$/i);
        if (!match) {
            return null;
        }

        const row = match[1].toLowerCase();
        const number = parseInt(match[2], 10);

        if (isNaN(number) || number <= 0) {
            return null;
        }

        return {
            section,
            row,
            number
        };
    }

    return null;
}

/**
 * Reconstruct seat ID from parsed components
 * @param {Object} components - Object with section, row, and number properties
 * @returns {string|null} Reconstructed seat ID or null if invalid
 * @example
 * reconstructSeatId({ section: "orchestra", row: "A", number: 12 }) // returns "orchestra-A-12"
 */
export function reconstructSeatId(components) {
    if (!components || typeof components !== 'object') {
        return null;
    }

    const { section, row, number } = components;

    if (!section || !row || typeof number !== 'number' || number <= 0) {
        return null;
    }

    return `${section}-${row}-${number}`;
}

/**
 * Validate seat ticket structure
 * @param {Array} seatTickets - Array of seat ticket objects
 * @returns {boolean} True if valid, false otherwise
 * @example
 * validateSeatTicketStructure([
 *   {
 *     seatId: "orchestra-A-12",
 *     seatLabel: "A12",
 *     ticketTypeId: "adult",
 *     ticketTypeName: "Adult",
 *     price: 500
 *   }
 * ]) // returns true
 */
export function validateSeatTicketStructure(seatTickets) {
    // Must be an array
    if (!Array.isArray(seatTickets)) {
        console.error('[validateSeatTicketStructure] Not an array:', typeof seatTickets);
        return false;
    }

    // Empty array is valid (for initialization)
    if (seatTickets.length === 0) {
        return true;
    }

    // Check each seat ticket has required fields
    for (let i = 0; i < seatTickets.length; i++) {
        const seatTicket = seatTickets[i];

        // Required fields
        if (!seatTicket.seatId || typeof seatTicket.seatId !== 'string') {
            console.error(`[validateSeatTicketStructure] Invalid seatId at index ${i}:`, seatTicket.seatId, typeof seatTicket.seatId);
            return false;
        }

        if (!seatTicket.seatLabel || typeof seatTicket.seatLabel !== 'string') {
            console.error(`[validateSeatTicketStructure] Invalid seatLabel at index ${i}:`, seatTicket.seatLabel, typeof seatTicket.seatLabel);
            return false;
        }

        if (!seatTicket.ticketTypeId || typeof seatTicket.ticketTypeId !== 'string') {
            console.error(`[validateSeatTicketStructure] Invalid ticketTypeId at index ${i}:`, seatTicket.ticketTypeId, typeof seatTicket.ticketTypeId);
            return false;
        }

        if (!seatTicket.ticketTypeName || typeof seatTicket.ticketTypeName !== 'string') {
            console.error(`[validateSeatTicketStructure] Invalid ticketTypeName at index ${i}:`, seatTicket.ticketTypeName, typeof seatTicket.ticketTypeName);
            return false;
        }

        if (typeof seatTicket.price !== 'number' || seatTicket.price <= 0) {
            console.error(`[validateSeatTicketStructure] Invalid price at index ${i}:`, seatTicket.price, typeof seatTicket.price);
            return false;
        }

        // Validate seat ID format
        const parsed = parseSeatId(seatTicket.seatId);
        if (!parsed) {
            console.error(`[validateSeatTicketStructure] Invalid seatId format at index ${i}:`, seatTicket.seatId);
            return false;
        }

        // Optional fields validation (if present, must be correct type)
        if (seatTicket.basePrice !== undefined) {
            if (typeof seatTicket.basePrice !== 'number' || seatTicket.basePrice <= 0) {
                console.error(`[validateSeatTicketStructure] Invalid basePrice at index ${i}:`, seatTicket.basePrice, typeof seatTicket.basePrice);
                return false;
            }
        }

        if (seatTicket.section !== undefined) {
            if (typeof seatTicket.section !== 'string') {
                console.error(`[validateSeatTicketStructure] Invalid section at index ${i}:`, seatTicket.section, typeof seatTicket.section);
                return false;
            }
        }

        if (seatTicket.row !== undefined) {
            if (typeof seatTicket.row !== 'string') {
                console.error(`[validateSeatTicketStructure] Invalid row at index ${i}:`, seatTicket.row, typeof seatTicket.row);
                return false;
            }
        }
    }

    // Check for duplicate seat IDs
    const seatIds = seatTickets.map(st => st.seatId);
    const uniqueSeatIds = new Set(seatIds);
    if (seatIds.length !== uniqueSeatIds.size) {
        return false;
    }

    return true;
}

/**
 * Generate display label from seat ID
 * @param {string} seatId - Seat ID in format "section-row-number"
 * @returns {string|null} Display label (e.g., "A12") or null if invalid
 * @example
 * getDisplayLabel("orchestra-A-12") // returns "A12"
 * getDisplayLabel("balcony-AA-5") // returns "AA5"
 */
export function getDisplayLabel(seatId) {
    const parsed = parseSeatId(seatId);
    if (!parsed) {
        return null;
    }

    return `${parsed.row}${parsed.number}`;
}

/**
 * Transform old seat format to new seatTickets format
 * @param {Array} seats - Array of old format seat objects
 * @param {number} totalAmount - Total booking amount (for price distribution)
 * @returns {Array} Array of seat ticket objects in new format
 * @example
 * transformToSeatTickets([
 *   {
 *     fullId: "orchestra-A-12",
 *     label: "A12",
 *     price: 500,
 *     ticketTypeId: "adult",
 *     ticketTypeName: "Adult"
 *   }
 * ], 500) // returns new format array
 */
export function transformToSeatTickets(seats, totalAmount = null) {
    // Handle null or undefined input
    if (!seats) {
        return [];
    }

    // Must be an array
    if (!Array.isArray(seats)) {
        throw new Error('seats must be an array');
    }

    // Empty array returns empty array
    if (seats.length === 0) {
        return [];
    }

    // Transform each seat
    const seatTickets = seats.map((seat, index) => {
        // Extract seat ID (handle various formats)
        const seatId = seat.fullId || seat.seatId || seat.id;

        if (!seatId || typeof seatId !== 'string') {
            throw new Error(`Seat at index ${index} has invalid or missing seat ID`);
        }

        // Parse seat ID to extract components
        const parsed = parseSeatId(seatId);
        if (!parsed) {
            throw new Error(`Seat at index ${index} has malformed seat ID: ${seatId}`);
        }

        // Generate display label (use existing label or generate from seat ID)
        const seatLabel = seat.label || getDisplayLabel(seatId);
        if (!seatLabel) {
            throw new Error(`Seat at index ${index} has invalid label`);
        }

        // Determine ticket type (default to 'adult' if missing)
        const ticketTypeId = seat.ticketTypeId || 'adult';
        const ticketTypeName = seat.ticketTypeName || 'Adult';

        // Calculate price
        let price;
        if (seat.price !== undefined && seat.price !== null) {
            // Use seat's individual price
            price = typeof seat.price === 'number' ? seat.price : parseFloat(seat.price);
        } else if (totalAmount !== null && totalAmount !== undefined) {
            // Distribute total amount evenly across all seats
            price = totalAmount / seats.length;
        } else {
            throw new Error(`Seat at index ${index} has no price and no totalAmount provided for distribution`);
        }

        // Ensure price is valid
        if (isNaN(price) || price <= 0) {
            throw new Error(`Seat at index ${index} has invalid price: ${price}`);
        }

        // Round to 2 decimal places
        price = parseFloat(price.toFixed(2));

        // Determine base price (original price before discounts)
        let basePrice = price;
        if (seat.basePrice !== undefined && seat.basePrice !== null) {
            basePrice = typeof seat.basePrice === 'number' ? seat.basePrice : parseFloat(seat.basePrice);
            if (isNaN(basePrice) || basePrice <= 0) {
                basePrice = price; // Fallback to price if basePrice is invalid
            } else {
                basePrice = parseFloat(basePrice.toFixed(2));
            }
        }

        // Build the seat ticket object
        const seatTicket = {
            seatId,
            seatLabel,
            ticketTypeId,
            ticketTypeName,
            price,
            basePrice,
            section: parsed.section,
            row: parsed.row
        };

        return seatTicket;
    });

    // Validate the result
    if (!validateSeatTicketStructure(seatTickets)) {
        throw new Error('Transformation produced invalid seatTickets structure');
    }

    return seatTickets;
}

/**
 * Create old format (verbose) seat object from seatTicket
 * @param {Object} seatTicket - Compact seat ticket object
 * @returns {Object} Verbose seat object in old format
 * @example
 * createVerboseSeatObject({
 *   seatId: "orchestra-A-12",
 *   seatLabel: "A12",
 *   ticketTypeId: "adult",
 *   ticketTypeName: "Adult",
 *   price: 500,
 *   section: "orchestra",
 *   row: "A"
 * }) // returns verbose seat object with all fields
 */
export function createVerboseSeatObject(seatTicket) {
    const parsed = parseSeatId(seatTicket.seatId);

    return {
        fullId: seatTicket.seatId,
        seatId: seatTicket.seatId,
        label: seatTicket.seatLabel,
        section: seatTicket.section || parsed?.section,
        row: seatTicket.row || parsed?.row,
        number: parsed?.number,
        tier: 'standard',
        price: seatTicket.price,
        status: 'selected',
        x: 120,
        y: 80,
        ticketTypeId: seatTicket.ticketTypeId,
        ticketTypeName: seatTicket.ticketTypeName
    };
}

/**
 * Measure JSON size in bytes
 * @param {*} data - Data to measure
 * @returns {number} Size in bytes
 * @example
 * measureJsonSize({ key: "value" }) // returns byte size of JSON string
 */
export function measureJsonSize(data) {
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
}

/**
 * Calculate storage efficiency comparison between old and new formats
 * @param {Array} seatTickets - Array of seat tickets in new format
 * @returns {Object} Comparison metrics including sizes and reduction percentage
 * @example
 * calculateStorageEfficiency([
 *   {
 *     seatId: "orchestra-A-12",
 *     seatLabel: "A12",
 *     ticketTypeId: "adult",
 *     ticketTypeName: "Adult",
 *     price: 500,
 *     basePrice: 500,
 *     section: "orchestra",
 *     row: "A"
 *   }
 * ]) // returns { newFormatSize, oldFormatSize, reduction, reductionPercentage, ... }
 */
export function calculateStorageEfficiency(seatTickets) {
    // Create old format seats array
    const oldFormatSeats = seatTickets.map(st => createVerboseSeatObject(st));

    // Measure sizes
    const newFormatSize = measureJsonSize(seatTickets);
    const oldFormatSize = measureJsonSize(oldFormatSeats);

    // Calculate reduction
    const reduction = oldFormatSize - newFormatSize;
    const reductionPercentage = (reduction / oldFormatSize) * 100;

    return {
        newFormatSize,
        oldFormatSize,
        reduction,
        reductionPercentage,
        perSeatNewFormat: newFormatSize / seatTickets.length,
        perSeatOldFormat: oldFormatSize / seatTickets.length
    };
}
