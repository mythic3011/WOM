/**
 * @file filters.js
 * @description Filter helper functions for building database query conditions
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency sequelize - Database ORM
 */

import { Op } from "sequelize";

/**
 * @param {string} dateFrom
 * @param {string} dateTo
 * @returns {Object|null}
 */
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

/**
 * @param {Array<string>} fields
 * @param {string} searchTerm
 * @returns {Object|null}
 */
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

/**
 * @param {string} status
 * @param {Array<string>} [allowedStatuses=[]]
 * @returns {string|null}
 */
export const buildStatusFilter = (status, allowedStatuses = []) => {
  if (!status) {
    return null;
  }

  if (allowedStatuses.length > 0 && !allowedStatuses.includes(status)) {
    return null;
  }

  return status;
};

/**
 * @param {Object} where
 * @param {string} field
 * @param {string} dateFrom
 * @param {string} dateTo
 * @returns {Object}
 */
export const applyDateRangeFilter = (where, field, dateFrom, dateTo) => {
  if (dateFrom) {
    where[field] = {
      ...(where[field] || {}),
      [Op.gte]: new Date(dateFrom),
    };
  }

  if (dateTo) {
    where[field] = {
      ...(where[field] || {}),
      [Op.lte]: new Date(dateTo),
    };
  }

  return where;
};

/**
 * @param {Object} filters
 * @param {Object} config
 * @param {string} [config.statusField]
 * @param {Array<string>} [config.searchFields]
 * @param {string} [config.dateField]
 * @param {Function} [config.additionalFilters]
 * @returns {Object}
 */
export const buildWhereClause = (filters, config) => {
  const where = {};

  if (filters.status && config.statusField) {
    where[config.statusField] = filters.status;
  }

  if (filters.search && config.searchFields) {
    where[Op.or] = config.searchFields.map((field) => ({
      [field]: { [Op.iLike]: `%${filters.search}%` },
    }));
  }

  if (config.dateField) {
    applyDateRangeFilter(where, config.dateField, filters.dateFrom, filters.dateTo);
  }

  if (config.additionalFilters) {
    Object.assign(where, config.additionalFilters(filters));
  }

  return where;
};
