/**
 * @file pagination.js
 * @description Helper functions for pagination support
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 */

/**
 * @param {Object} query
 * @param {string} [query.page]
 * @param {string} [query.limit]
 * @returns {Object}
 */
export const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * @param {Array} data
 * @param {number} total
 * @param {number} page
 * @param {number} limit
 * @returns {Object}
 */
export const buildPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    items: data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};
