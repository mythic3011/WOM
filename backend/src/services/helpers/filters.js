import { Op } from "sequelize";

export const buildDateFilter = (dateFrom, dateTo) => {
  const dateFilter = {};

  if (dateFrom && dateTo) {
    dateFilter[Op.between] = [new Date(dateFrom), new Date(dateTo)];
  } else if (dateFrom) {
    dateFilter[Op.gte] = new Date(dateFrom);
  } else if (dateTo) {
    dateFilter[Op.lte] = new Date(dateTo);
  }

  return Object.keys(dateFilter).length > 0 ? dateFilter : null;
};

export const buildSearchFilter = (fields, searchTerm) => {
  if (!searchTerm || !fields || fields.length === 0) {
    return null;
  }

  return {
    [Op.or]: fields.map((field) => ({
      [field]: {
        [Op.iLike]: `%${searchTerm}%`,
      },
    })),
  };
};

export const buildStatusFilter = (status, allowedStatuses = []) => {
  if (!status) return null;

  if (allowedStatuses.length > 0 && !allowedStatuses.includes(status)) {
    return null;
  }

  return status;
};
