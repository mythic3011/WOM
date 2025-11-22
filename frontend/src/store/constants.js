/**
 * Centralized constants store
 * Fetches and caches constants from the backend API
 */

import { constantsService } from "@services/constantsService.js";

class ConstantsStore {
    constructor() {
        this._constants = null;
        this._loading = false;
        this._initialized = false;
    }

    /**
     * Initialize constants from API
     * Should be called on app startup
     */
    async initialize() {
        if (this._initialized) {
            return this._constants;
        }

        try {
            this._loading = true;
            this._constants = await constantsService.getAll();
            this._initialized = true;
            console.log("[Constants] Loaded from API");
            return this._constants;
        } catch (error) {
            console.error("[Constants] Failed to load from API:", error);
            // Fallback to empty objects to prevent crashes
            this._constants = this._getDefaultConstants();
            throw error;
        } finally {
            this._loading = false;
        }
    }

    /**
     * Get all constants (will initialize if not already done)
     */
    async getAll() {
        if (!this._initialized) {
            await this.initialize();
        }
        return this._constants;
    }

    /**
     * Get a specific constant by key
     */
    async get(key) {
        const constants = await this.getAll();
        return constants[key];
    }

    /**
     * Synchronous getters (use only after initialization)
     */
    get SEAT_TIER_LABELS() {
        return this._constants?.seatTierLabels || {};
    }

    get SEAT_TIERS() {
        return this._constants?.seatTiers || {};
    }

    get SEAT_STATUSES() {
        return this._constants?.seatStatuses || {};
    }

    get BOOKING_STATUSES() {
        return this._constants?.bookingStatuses || {};
    }

    get BOOKING_STATUS_LABELS() {
        return this._constants?.bookingStatusLabels || {};
    }

    get PAYMENT_STATUSES() {
        return this._constants?.paymentStatuses || {};
    }

    get PAYMENT_STATUS_LABELS() {
        return this._constants?.paymentStatusLabels || {};
    }

    get PAYMENT_METHODS() {
        return this._constants?.paymentMethods || {};
    }

    get PERFORMANCE_STATUSES() {
        return this._constants?.performanceStatuses || {};
    }

    get USER_ROLES() {
        return this._constants?.userRoles || {};
    }

    get VENUE_STATUSES() {
        return this._constants?.venueStatuses || {};
    }

    get TICKET_TYPES() {
        return this._constants?.ticketTypes || {};
    }

    get SYSTEM_TICKET_TYPE_IDS() {
        return this._constants?.systemTicketTypeIds || [];
    }

    get DEFAULT_TICKET_TYPES() {
        return this._constants?.defaultTicketTypes || [];
    }

    get TICKET_DISCOUNTS() {
        return this._constants?.ticketDiscounts || {};
    }

    get VENUE_TEMPLATES() {
        return this._constants?.venueTemplates || [];
    }

    /**
     * Check if constants are loaded
     */
    isInitialized() {
        return this._initialized;
    }

    /**
     * Check if constants are currently loading
     */
    isLoading() {
        return this._loading;
    }

    /**
     * Clear cache and force reload
     */
    async reload() {
        this._initialized = false;
        this._constants = null;
        constantsService.clearCache();
        return this.initialize();
    }

    /**
     * Default constants as fallback
     */
    _getDefaultConstants() {
        return {
            seatTierLabels: {
                vip: "VIP",
                premium: "Premium",
                standard: "Standard",
                economy: "Economy",
            },
            seatTiers: {
                VIP: "vip",
                PREMIUM: "premium",
                STANDARD: "standard",
                ECONOMY: "economy",
            },
            seatStatuses: {
                AVAILABLE: "available",
                BLOCKED: "blocked",
                RESERVED: "reserved",
                BOOKED: "booked",
            },
            bookingStatuses: {
                PENDING: "pending",
                CONFIRMED: "confirmed",
                CANCELLED: "cancelled",
                COMPLETED: "completed",
            },
            bookingStatusLabels: {
                pending: "Pending",
                confirmed: "Confirmed",
                cancelled: "Cancelled",
                completed: "Completed",
            },
            paymentStatuses: {
                PENDING: "pending",
                PAID: "paid",
                FAILED: "failed",
                REFUNDED: "refunded",
            },
            paymentStatusLabels: {
                pending: "Pending",
                paid: "Paid",
                failed: "Failed",
                refunded: "Refunded",
            },
            paymentMethods: {
                CREDIT_CARD: "credit_card",
                DEBIT_CARD: "debit_card",
                PAYPAL: "paypal",
                ALIPAY: "alipay",
                WECHAT_PAY: "wechat_pay",
                BANK_TRANSFER: "bank_transfer",
            },
            performanceStatuses: {
                DRAFT: "draft",
                PRE_ORDER: "pre_order",
                EARLY_BIRD: "early_bird",
                ON_SALE: "on_sale",
                SOLD_OUT: "sold_out",
                CANCELLED: "cancelled",
                COMPLETED: "completed",
            },
            userRoles: {
                ADMIN: "admin",
                USER: "user",
                GUEST: "guest",
            },
            venueStatuses: {
                ACTIVE: "active",
                INACTIVE: "inactive",
                MAINTENANCE: "maintenance",
                UNDER_RENOVATION: "under_renovation",
            },
            ticketTypes: {
                STANDARD: "Standard",
                STUDENT: "Student",
                SENIOR: "Senior Citizen",
                PWD: "People with Disabilities and the Minder",
                CSSA: "CSSA Recipient",
                WHEELCHAIR: "Wheelchair",
            },
            systemTicketTypeIds: ["standard", "student", "senior", "pwd", "cssa"],
            defaultTicketTypes: [
                { id: "standard", name: "Standard", order: 1 },
                { id: "student", name: "Student", order: 2 },
                { id: "senior", name: "Senior Citizen", order: 3 },
                { id: "pwd", name: "People with Disabilities and the Minder", order: 4 },
                { id: "cssa", name: "CSSA Recipient", order: 5 },
            ],
            ticketDiscounts: {
                STUDENT: 0.5,
                SENIOR: 0.5,
                PWD: 0.5,
                CSSA: 0.5,
                WHEELCHAIR: 0.0,
            },
            venueTemplates: [],
        };
    }
}

// Export singleton instance
export const constants = new ConstantsStore();

// Export for backward compatibility (will be removed in future)
export const SEAT_TIER_LABELS = new Proxy(
    {},
    {
        get(target, prop) {
            return constants.SEAT_TIER_LABELS[prop];
        },
    }
);

export const SYSTEM_TICKET_TYPE_IDS = new Proxy([], {
    get(target, prop) {
        if (prop === "includes") {
            return (id) => constants.SYSTEM_TICKET_TYPE_IDS.includes(id);
        }
        return constants.SYSTEM_TICKET_TYPE_IDS[prop];
    },
});

export default constants;
