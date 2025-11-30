/**
 * @file statsHelpers.js
 * @description Helper functions for calculating statistics and aggregations
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency sequelize - Database ORM
 */

import sequelize from "#config/database.js";

/**
 * @param {Object} Model
 * @param {Object} where
 * @param {string} [amountField='totalAmount']
 * @returns {Promise<number>}
 */
export const calculateTotalRevenue = async (Model, where, amountField = "totalAmount") => {
    const total = await Model.sum(amountField, {
        where: {
            ...where,
            paymentStatus: "paid",
        },
    });

    return total || 0;
};

/**
 * @param {Object} Model
 * @param {Object} where
 * @param {string} groupField
 * @returns {Promise<Array>}
 */
export const groupByField = async (Model, where, groupField) => {
    const results = await Model.findAll({
        where,
        attributes: [groupField, [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
        group: [groupField],
        raw: true,
    });

    return results;
};

/**
 * @param {number} bookedSeats
 * @param {number} totalSeats
 * @returns {string}
 */
export const calculateOccupancyRate = (bookedSeats, totalSeats) => {
    if (totalSeats === 0) {
        return 0;
    }
    return ((bookedSeats / totalSeats) * 100).toFixed(2);
};
