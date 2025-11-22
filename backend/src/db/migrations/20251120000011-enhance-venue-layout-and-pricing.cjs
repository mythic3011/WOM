/**
 * Migration: Enhance Venue Layout and Performance Pricing
 * 
 * This migration adds support for:
 * 1. Enhanced venue layout features (backward compatible)
 *    - Horizontal aisles between rows
 *    - Advanced seat numbering (direction, prefix, suffix, skip patterns)
 *    - Per-row configuration overrides
 *    - Seat shape variations
 * 
 * 2. Performance pricing tiers and zones
 *    - priceTiers: Array of pricing tiers with seat/zone references
 *    - pricingZones: Array of pricing zones mapped to sections/rows
 * 
 * Backward Compatibility:
 * - Existing venue layouts continue to work without modification
 * - All new fields are optional with sensible defaults
 * - JSONB structure allows gradual adoption of new features
 * 
 * Enhanced Venue Layout Schema (optional fields):
 * {
 *   sections: [
 *     {
 *       name: string,              // Required
 *       rows: number,              // Required
 *       seatsPerRow: number,       // Required
 *       tier: string,              // Optional
 *       startRow: string,          // Optional (default: "A")
 *       
 *       // NEW: Horizontal aisles (spacing between rows)
 *       horizontalAisles: [        // Optional
 *         {
 *           afterRow: string,      // Row label after which aisle appears
 *           height: number         // Height in grid units (default: 1)
 *         }
 *       ],
 *       
 *       // NEW: Seat numbering configuration
 *       seatNumbering: {           // Optional
 *         globalDirection: "ltr" | "rtl",  // Default: "ltr"
 *         startNumber: number,              // Default: 1
 *         prefix: string,                   // Default: ""
 *         suffix: string,                   // Default: ""
 *         skipNumbers: number[]             // Default: []
 *       },
 *       
 *       // NEW: Per-row overrides
 *       rowsConfig: [              // Optional
 *         {
 *           rowLabel: string,               // Row to override
 *           direction: "ltr" | "rtl",       // Override direction
 *           startNumber: number,            // Override start number
 *           prefix: string,                 // Override prefix
 *           suffix: string,                 // Override suffix
 *           skip: number[],                 // Override skip numbers
 *           pattern: string,                // "S" (seat), "H" (gap), "E" (empty)
 *           seatShapes: [                   // Seat shape variations
 *             {
 *               positions: number[],        // Which seats have this shape
 *               shape: string,              // "standard", "wide", "accessible", etc.
 *               width: number,              // Width multiplier
 *               metadata: object            // Additional data
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 * 
 * Performance Pricing Schema:
 * {
 *   priceTiers: [
 *     {
 *       name: string,             // "VIP", "Premium", etc.
 *       basePrice: number,        // Base price for this tier
 *       tier: string,             // Tier identifier
 *       seatRefs: string[],       // Direct seat references
 *       zoneRefs: string[],       // Zone references
 *       conditions: object        // Optional pricing conditions
 *     }
 *   ],
 *   pricingZones: [
 *     {
 *       id: string,               // Zone identifier
 *       name: string,             // Display name
 *       tier: string,             // Associated tier
 *       sections: string[],       // Section names
 *       rows: string[],           // Row labels
 *       seatRange: object         // Seat range within rows
 *     }
 *   ]
 * }
 */

module.exports = {
    async up(queryInterface, Sequelize) {
        // Add priceTiers column to performances table
        await queryInterface.addColumn("performances", "priceTiers", {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: [],
            comment: "Array of pricing tiers with seat/zone references and conditions"
        });

        // Add pricingZones column to performances table
        await queryInterface.addColumn("performances", "pricingZones", {
            type: Sequelize.JSONB,
            allowNull: true,
            defaultValue: [],
            comment: "Array of pricing zones mapped to sections, rows, and seat ranges"
        });

        // Add GIN indexes for efficient JSONB queries
        await queryInterface.addIndex("performances", ["priceTiers"], {
            using: "GIN",
            name: "performances_price_tiers_gin"
        });

        await queryInterface.addIndex("performances", ["pricingZones"], {
            using: "GIN",
            name: "performances_pricing_zones_gin"
        });

        // Note: Venue layout column already exists as JSONB
        // The enhanced schema is backward compatible - no migration needed
        // Existing layouts will continue to work, new fields are optional
    },

    async down(queryInterface) {
        // Remove indexes
        await queryInterface.removeIndex("performances", "performances_pricing_zones_gin");
        await queryInterface.removeIndex("performances", "performances_price_tiers_gin");

        // Remove columns
        await queryInterface.removeColumn("performances", "pricingZones");
        await queryInterface.removeColumn("performances", "priceTiers");

        // Note: Venue layout remains unchanged as it's backward compatible
    }
};
