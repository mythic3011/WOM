import sequelize from "#config/database.js";

export const calculateTotalRevenue = async (Model, where, amountField = "totalAmount") => {
    const total = await Model.sum(amountField, {
        where: {
            ...where,
            paymentStatus: "paid",
        },
    });

    return total || 0;
};

export const groupByField = async (Model, where, groupField) => {
    const results = await Model.findAll({
        where,
        attributes: [groupField, [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
        group: [groupField],
        raw: true,
    });

    return results;
};

export const calculateOccupancyRate = (bookedSeats, totalSeats) => {
    if (totalSeats === 0) return 0;
    return ((bookedSeats / totalSeats) * 100).toFixed(2);
};
