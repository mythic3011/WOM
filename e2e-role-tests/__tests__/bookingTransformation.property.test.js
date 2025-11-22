/**
 * Property-Based Tests for Frontend Booking Transformation
 * 
 * Tests the transformation of seatTicketTypes state to seatTickets format
 * for booking submission.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseSeatId, extractSection, extractRow, getDisplayLabel } from '../utils/seatIdHelper.js';

// Generators for property-based testing

/**
 * Generate a valid section name
 */
const sectionArb = fc.oneof(
    fc.constantFrom('orchestra', 'balcony', 'mezzanine', 'gallery', 'box'),
    fc.stringMatching(/^[a-z]{3,10}$/)
);

/**
 * Generate a valid row identifier (A, B, AA, AB, etc.)
 */
const rowArb = fc.oneof(
    fc.stringMatching(/^[a-z]$/),
    fc.stringMatching(/^[a-z]{2}$/)
);

/**
 * Generate a valid seat number
 */
const seatNumberArb = fc.integer({ min: 1, max: 50 });

/**
 * Generate a valid seat ID in format "section-row-number" or "section-rowNumber"
 */
const seatIdArb = fc.tuple(sectionArb, rowArb, seatNumberArb).map(([section, row, number]) => {
    // Randomly choose between two formats
    const useHyphenFormat = Math.random() > 0.5;
    if (useHyphenFormat) {
        return `${section}-${row}-${number}`;
    } else {
        return `${section}-${row}${number}`;
    }
});

/**
 * Generate a valid ticket type
 * Ensures basePrice >= price when both are present (no negative discounts)
 */
const ticketTypeArb = fc.integer({ min: 100, max: 1000 }).chain(basePrice => {
    return fc.record({
        id: fc.constantFrom('adult', 'student', 'senior', 'child', 'vip'),
        name: fc.constantFrom('Adult', 'Student', 'Senior', 'Child', 'VIP'),
        price: fc.integer({ min: 100, max: basePrice }), // price <= basePrice
        basePrice: fc.option(fc.constant(basePrice), { nil: undefined })
    });
});

/**
 * Generate a seatTicketTypes object (mapping seatId to ticket type)
 */
const seatTicketTypesArb = fc.array(
    fc.tuple(seatIdArb, ticketTypeArb),
    { minLength: 1, maxLength: 10 }
).map(pairs => {
    const obj = {};
    pairs.forEach(([seatId, ticket]) => {
        obj[seatId] = ticket;
    });
    return obj;
});

/**
 * Transform seatTicketTypes to seatTickets format (mimics BookingPage logic)
 */
function transformSeatTicketTypes(seatTicketTypes) {
    const selectedSeats = Object.keys(seatTicketTypes);

    return selectedSeats.map((seatId) => {
        const ticket = seatTicketTypes[seatId];
        const parsed = parseSeatId(seatId);

        return {
            seatId: seatId,
            seatLabel: getDisplayLabel(seatId),
            ticketTypeId: ticket.id,
            ticketTypeName: ticket.name,
            price: ticket.price,
            basePrice: ticket.basePrice || ticket.price,
            section: parsed?.section || extractSection(seatId),
            row: parsed?.row || extractRow(seatId)
        };
    });
}

describe('Frontend Booking Transformation Property Tests', () => {
    describe('Property 18: Seat field completeness', () => {
        it('should include all required seat fields (seatId, seatLabel, section, row) for any seatTicketTypes', () => {
            fc.assert(
                fc.property(seatTicketTypesArb, (seatTicketTypes) => {
                    const seatTickets = transformSeatTicketTypes(seatTicketTypes);

                    // Every seatTicket must have required seat fields
                    return seatTickets.every(st => {
                        // Required fields must be present and non-empty
                        const hasSeatId = typeof st.seatId === 'string' && st.seatId.length > 0;
                        const hasSeatLabel = typeof st.seatLabel === 'string' && st.seatLabel.length > 0;

                        // Optional but should be present if parseable
                        const hasSection = st.section === null || (typeof st.section === 'string' && st.section.length > 0);
                        const hasRow = st.row === null || (typeof st.row === 'string' && st.row.length > 0);

                        return hasSeatId && hasSeatLabel && hasSection && hasRow;
                    });
                }),
                { numRuns: 100 }
            );
        });

        it('should have seatLabel that matches the display format from seatId', () => {
            fc.assert(
                fc.property(seatTicketTypesArb, (seatTicketTypes) => {
                    const seatTickets = transformSeatTicketTypes(seatTicketTypes);

                    // Every seatLabel should be derivable from seatId
                    return seatTickets.every(st => {
                        const expectedLabel = getDisplayLabel(st.seatId);
                        return st.seatLabel === expectedLabel;
                    });
                }),
                { numRuns: 100 }
            );
        });

        it('should have section that matches extracted section from seatId', () => {
            fc.assert(
                fc.property(seatTicketTypesArb, (seatTicketTypes) => {
                    const seatTickets = transformSeatTicketTypes(seatTicketTypes);

                    // Every section should match what's extracted from seatId
                    return seatTickets.every(st => {
                        const parsed = parseSeatId(st.seatId);
                        const extractedSection = extractSection(st.seatId);

                        // Should match either parsed or extracted section
                        return st.section === parsed?.section || st.section === extractedSection;
                    });
                }),
                { numRuns: 100 }
            );
        });

        it('should have row that matches extracted row from seatId', () => {
            fc.assert(
                fc.property(seatTicketTypesArb, (seatTicketTypes) => {
                    const seatTickets = transformSeatTicketTypes(seatTicketTypes);

                    // Every row should match what's extracted from seatId
                    return seatTickets.every(st => {
                        const parsed = parseSeatId(st.seatId);
                        const extractedRow = extractRow(st.seatId);

                        // Should match either parsed or extracted row
                        return st.row === parsed?.row || st.row === extractedRow;
                    });
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('Property 19: Ticket field completeness', () => {
        it('should include all required ticket fields (ticketTypeId, ticketTypeName, price) for any seatTicketTypes', () => {
            fc.assert(
                fc.property(seatTicketTypesArb, (seatTicketTypes) => {
                    const seatTickets = transformSeatTicketTypes(seatTicketTypes);

                    // Every seatTicket must have required ticket fields
                    return seatTickets.every(st => {
                        const hasTicketTypeId = typeof st.ticketTypeId === 'string' && st.ticketTypeId.length > 0;
                        const hasTicketTypeName = typeof st.ticketTypeName === 'string' && st.ticketTypeName.length > 0;
                        const hasPrice = typeof st.price === 'number' && st.price > 0;

                        return hasTicketTypeId && hasTicketTypeName && hasPrice;
                    });
                }),
                { numRuns: 100 }
            );
        });

        it('should preserve ticket type information from seatTicketTypes', () => {
            fc.assert(
                fc.property(seatTicketTypesArb, (seatTicketTypes) => {
                    const seatTickets = transformSeatTicketTypes(seatTicketTypes);

                    // Every seatTicket should have matching ticket info from original
                    return seatTickets.every(st => {
                        const originalTicket = seatTicketTypes[st.seatId];

                        return (
                            st.ticketTypeId === originalTicket.id &&
                            st.ticketTypeName === originalTicket.name &&
                            st.price === originalTicket.price
                        );
                    });
                }),
                { numRuns: 100 }
            );
        });

        it('should have basePrice equal to price when basePrice is not provided', () => {
            fc.assert(
                fc.property(seatTicketTypesArb, (seatTicketTypes) => {
                    const seatTickets = transformSeatTicketTypes(seatTicketTypes);

                    // When basePrice is not in original, it should default to price
                    return seatTickets.every(st => {
                        const originalTicket = seatTicketTypes[st.seatId];

                        if (originalTicket.basePrice === undefined) {
                            return st.basePrice === st.price;
                        } else {
                            return st.basePrice === originalTicket.basePrice;
                        }
                    });
                }),
                { numRuns: 100 }
            );
        });

        it('should have valid price values (positive numbers)', () => {
            fc.assert(
                fc.property(seatTicketTypesArb, (seatTicketTypes) => {
                    const seatTickets = transformSeatTicketTypes(seatTicketTypes);

                    // All prices must be positive numbers
                    return seatTickets.every(st => {
                        return (
                            typeof st.price === 'number' &&
                            st.price > 0 &&
                            !isNaN(st.price) &&
                            isFinite(st.price)
                        );
                    });
                }),
                { numRuns: 100 }
            );
        });

        it('should have basePrice greater than or equal to price (no negative discounts)', () => {
            fc.assert(
                fc.property(seatTicketTypesArb, (seatTicketTypes) => {
                    const seatTickets = transformSeatTicketTypes(seatTicketTypes);

                    // basePrice should always be >= price (discounts can't be negative)
                    return seatTickets.every(st => {
                        return st.basePrice >= st.price;
                    });
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('Transformation Consistency', () => {
        it('should produce seatTickets array with same length as input seatTicketTypes', () => {
            fc.assert(
                fc.property(seatTicketTypesArb, (seatTicketTypes) => {
                    const seatTickets = transformSeatTicketTypes(seatTicketTypes);
                    const inputLength = Object.keys(seatTicketTypes).length;

                    return seatTickets.length === inputLength;
                }),
                { numRuns: 100 }
            );
        });

        it('should preserve all seat IDs from input', () => {
            fc.assert(
                fc.property(seatTicketTypesArb, (seatTicketTypes) => {
                    const seatTickets = transformSeatTicketTypes(seatTicketTypes);
                    const inputSeatIds = Object.keys(seatTicketTypes).sort();
                    const outputSeatIds = seatTickets.map(st => st.seatId).sort();

                    return JSON.stringify(inputSeatIds) === JSON.stringify(outputSeatIds);
                }),
                { numRuns: 100 }
            );
        });

        it('should not have duplicate seat IDs in output', () => {
            fc.assert(
                fc.property(seatTicketTypesArb, (seatTicketTypes) => {
                    const seatTickets = transformSeatTicketTypes(seatTicketTypes);
                    const seatIds = seatTickets.map(st => st.seatId);
                    const uniqueSeatIds = new Set(seatIds);

                    return seatIds.length === uniqueSeatIds.size;
                }),
                { numRuns: 100 }
            );
        });
    });

    describe('Edge Cases', () => {
        it('should handle single seat booking', () => {
            const seatTicketTypes = {
                'orchestra-a-12': {
                    id: 'adult',
                    name: 'Adult',
                    price: 500
                }
            };

            const seatTickets = transformSeatTicketTypes(seatTicketTypes);

            expect(seatTickets).toHaveLength(1);
            expect(seatTickets[0]).toMatchObject({
                seatId: 'orchestra-a-12',
                ticketTypeId: 'adult',
                ticketTypeName: 'Adult',
                price: 500,
                basePrice: 500
            });
        });

        it('should handle multiple seats with different ticket types', () => {
            const seatTicketTypes = {
                'orchestra-a-12': {
                    id: 'adult',
                    name: 'Adult',
                    price: 500
                },
                'orchestra-a-13': {
                    id: 'student',
                    name: 'Student',
                    price: 350
                },
                'balcony-b-5': {
                    id: 'senior',
                    name: 'Senior',
                    price: 400
                }
            };

            const seatTickets = transformSeatTicketTypes(seatTicketTypes);

            expect(seatTickets).toHaveLength(3);
            expect(seatTickets[0].ticketTypeId).toBe('adult');
            expect(seatTickets[1].ticketTypeId).toBe('student');
            expect(seatTickets[2].ticketTypeId).toBe('senior');
        });

        it('should handle seats with basePrice different from price', () => {
            const seatTicketTypes = {
                'orchestra-a-12': {
                    id: 'student',
                    name: 'Student',
                    price: 350,
                    basePrice: 500
                }
            };

            const seatTickets = transformSeatTicketTypes(seatTicketTypes);

            expect(seatTickets[0].price).toBe(350);
            expect(seatTickets[0].basePrice).toBe(500);
        });

        it('should handle both seat ID formats (section-row-number and section-rowNumber)', () => {
            const seatTicketTypes = {
                'orchestra-a-12': {
                    id: 'adult',
                    name: 'Adult',
                    price: 500
                },
                'balcony-b5': {
                    id: 'adult',
                    name: 'Adult',
                    price: 400
                }
            };

            const seatTickets = transformSeatTicketTypes(seatTicketTypes);

            expect(seatTickets).toHaveLength(2);
            expect(seatTickets[0].section).toBe('orchestra');
            expect(seatTickets[0].row).toBe('a');
            expect(seatTickets[1].section).toBe('balcony');
            expect(seatTickets[1].row).toBe('b');
        });
    });
});
