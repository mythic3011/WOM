import { APP_CONFIG } from "@config/config.js";
import { fileHandler } from "@utils/core/fileHandler.js";

/**
 * File API Service
 * Handles file upload and download operations with the backend API
 */


const API_BASE = APP_CONFIG.apiBaseUrl;

/**
 * File API service for file-related operations
 */
export const fileAPI = {
    /**
     * Upload venue image
     * @param {number|string} venueId - Venue ID
     * @param {File} file - Image file to upload
     * @param {Object} options - Upload options
     * @param {Function} options.onProgress - Progress callback
     * @returns {Promise<{success: boolean, data?: any, error?: string}>}
     */
    async uploadVenueImage(venueId, file, options = {}) {
        const { onProgress = null } = options;

        return fileHandler.upload(file, `${API_BASE}/venues/${venueId}/image`, {
            maxSize: 5, // 5MB max for venue images
            allowedTypes: ["image/*"],
            additionalData: { venueId },
            onProgress
        });
    },

    /**
     * Upload user avatar
     * @param {number|string} userId - User ID
     * @param {File} file - Image file to upload
     * @param {Object} options - Upload options
     * @param {Function} options.onProgress - Progress callback
     * @returns {Promise<{success: boolean, data?: any, error?: string}>}
     */
    async uploadUserAvatar(userId, file, options = {}) {
        const { onProgress = null } = options;

        return fileHandler.upload(file, `${API_BASE}/users/${userId}/avatar`, {
            maxSize: 2, // 2MB max for avatars
            allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
            additionalData: { userId },
            onProgress
        });
    },

    /**
     * Download booking report
     * @param {Object} options - Download options
     * @param {string} options.format - Export format ('csv' or 'json', default: 'csv')
     * @param {Object} options.filters - Filter parameters (startDate, endDate, status, etc.)
     * @param {boolean} options.showProgress - Show download progress
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async downloadBookingReport(options = {}) {
        const {
            format = "csv",
            filters = {},
            showProgress = false
        } = options;

        // Build query string from filters
        const queryParams = new URLSearchParams({
            format,
            ...filters
        });

        const url = `${API_BASE}/bookings/export?${queryParams.toString()}`;
        const filename = `bookings-${new Date().toISOString().split("T")[0]}.${format}`;

        return fileHandler.download(url, filename, { showProgress });
    },

    /**
     * Import data from CSV file
     * @param {File} file - CSV file to import
     * @param {string} type - Import type ('users', 'venues', 'performances', 'bookings')
     * @param {Object} options - Import options
     * @param {Function} options.onProgress - Progress callback
     * @returns {Promise<{success: boolean, data?: any, error?: string}>}
     */
    async importCSV(file, type, options = {}) {
        const { onProgress = null } = options;

        // Validate import type
        const validTypes = ["users", "venues", "performances", "bookings"];
        if (!validTypes.includes(type)) {
            return {
                success: false,
                error: `Invalid import type. Must be one of: ${validTypes.join(", ")}`
            };
        }

        return fileHandler.upload(file, `${API_BASE}/import/${type}`, {
            maxSize: 10, // 10MB max for CSV imports
            allowedTypes: ["text/csv", ".csv"],
            additionalData: { type },
            onProgress
        });
    }
};
