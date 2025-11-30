/**
 * @file stringUtils.js
 * @description String manipulation utilities for URL-safe slug generation
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @see backend/src/utils/seatMapBuilder.js
 */

/**
 * @param {string} text - Text to convert to slug
 * @returns {string} URL-safe slug (lowercase, hyphenated, alphanumeric)
 */
export function slugify(text) {
    return (text || "")
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-");
}
