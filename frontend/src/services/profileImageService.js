/**
 * Profile Image Service
 * Handles fetching and caching of user profile images separately from user data
 * This prevents localStorage quota issues with large base64 images
 */

import { authAPI } from "./index.js";

// In-memory cache for profile images (session-only)
const imageCache = new Map();

/**
 * Get user's profile image
 * Uses session storage cache to avoid repeated API calls
 * @param {string} userId - User ID
 * @param {boolean} forceRefresh - Force fetch from API
 * @returns {Promise<string|null>} Base64 image or null
 */
export async function getProfileImage(userId, forceRefresh = false) {
    // Check cache first
    if (!forceRefresh && imageCache.has(userId)) {
        return imageCache.get(userId);
    }

    try {
        const response = await authAPI.getProfileImage();

        if (response.success && response.data) {
            const image = response.data.profileImage;

            // Cache the image
            if (image) {
                imageCache.set(userId, image);
            }

            return image;
        }

        return null;
    } catch (error) {
        console.error("Failed to fetch profile image:", error);
        return null;
    }
}

/**
 * Clear profile image cache
 * Call this on logout or when user updates their image
 */
export function clearProfileImageCache(userId = null) {
    if (userId) {
        imageCache.delete(userId);
    } else {
        imageCache.clear();
    }
}

/**
 * Preload profile image for current user
 * Call this after login to cache the image
 */
export async function preloadProfileImage(userId) {
    return getProfileImage(userId, true);
}

export default {
    getProfileImage,
    clearProfileImageCache,
    preloadProfileImage,
};
