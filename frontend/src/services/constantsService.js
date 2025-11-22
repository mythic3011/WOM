import { apiClient } from "./apiClient.js";

/**
 * Service for fetching application constants from the backend
 */
class ConstantsService {
    constructor() {
        this.constants = null;
        this.loading = false;
        this.error = null;
    }

    /**
     * Fetch all constants from the backend
     * @returns {Promise<Object>} Application constants
     */
    async getAll() {
        if (this.constants) {
            return this.constants;
        }

        if (this.loading) {
            // Wait for the ongoing request to complete
            return new Promise((resolve, reject) => {
                const checkInterval = setInterval(() => {
                    if (!this.loading) {
                        clearInterval(checkInterval);
                        if (this.constants) {
                            resolve(this.constants);
                        } else {
                            reject(this.error || new Error("Failed to load constants"));
                        }
                    }
                }, 100);
            });
        }

        this.loading = true;
        this.error = null;

        try {
            const response = await apiClient.get("/constants");
            this.constants = response.data;
            return this.constants;
        } catch (error) {
            this.error = error;
            console.error("Failed to fetch constants:", error);
            throw error;
        } finally {
            this.loading = false;
        }
    }

    /**
     * Get a specific constant by key
     * @param {string} key - The constant key (e.g., 'seatTiers', 'bookingStatuses')
     * @returns {Promise<any>} The constant value
     */
    async get(key) {
        const constants = await this.getAll();
        return constants[key];
    }

    /**
     * Clear cached constants (useful for testing or forcing refresh)
     */
    clearCache() {
        this.constants = null;
        this.error = null;
    }

    /**
     * Get seat tier labels
     * @returns {Promise<Object>} Seat tier labels
     */
    async getSeatTierLabels() {
        return this.get("seatTierLabels");
    }

    /**
     * Get booking status labels
     * @returns {Promise<Object>} Booking status labels
     */
    async getBookingStatusLabels() {
        return this.get("bookingStatusLabels");
    }

    /**
     * Get payment status labels
     * @returns {Promise<Object>} Payment status labels
     */
    async getPaymentStatusLabels() {
        return this.get("paymentStatusLabels");
    }

    /**
     * Get all ticket types
     * @returns {Promise<Array>} Default ticket types
     */
    async getTicketTypes() {
        return this.get("defaultTicketTypes");
    }

    /**
     * Get ticket discounts
     * @returns {Promise<Object>} Ticket discounts
     */
    async getTicketDiscounts() {
        return this.get("ticketDiscounts");
    }
}

export const constantsService = new ConstantsService();
export default constantsService;
