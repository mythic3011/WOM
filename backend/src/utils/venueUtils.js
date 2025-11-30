/**
 * @file venueUtils.js
 * @description Utilities for venue row label generation and letter-number conversions
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @see backend/src/services/venueService.js
 * @see backend/src/utils/SeatNumberingSystem.js
 */

/**
 * @param {string} startRow - Starting row label (e.g., "A", "AA")
 * @param {number} count - Number of row labels to generate
 * @returns {Array<string>} Array of sequential row labels
 */
export function generateRowLabels(startRow, count) {
    const rows = [];
    let current = startRow;

    for (let i = 0; i < count; i++) {
        rows.push(current);

        if (current.length === 1) {
            if (current === "Z") {
                current = "AA";
            } else {
                current = String.fromCharCode(current.charCodeAt(0) + 1);
            }
        } else if (current.length === 2) {
            const first = current.charAt(0);
            const second = current.charAt(1);
            if (second === "Z") {
                current = `${String.fromCharCode(first.charCodeAt(0) + 1)}A`;
            } else {
                current = first + String.fromCharCode(second.charCodeAt(0) + 1);
            }
        }
    }

    return rows;
}

/**
 * @param {string} str - Letter string to convert (e.g., "A", "AA", "Z")
 * @returns {number} Numeric representation of letter string
 */
export function toNumber(str) {
    return str.split("").reduce((acc, c) => acc * 26 + (c.charCodeAt(0) - 64), 0);
}

/**
 * @param {number} num - Number to convert to letters
 * @returns {string} Letter representation (e.g., 1 -> "A", 27 -> "AA")
 */
export function toLetters(num) {
    let n = num;
    let res = "";
    while (n > 0) {
        const rem = (n - 1) % 26;
        res = String.fromCharCode(65 + rem) + res;
        n = Math.floor((n - 1) / 26);
    }
    return res;
}
