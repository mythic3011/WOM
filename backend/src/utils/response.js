/**
 * @file response.js
 * @description Response formatting utilities for consistent API responses
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @see backend/src/controllers
 */

/**
 * @param {Object} res - Express response object
 * @param {*} data - Response data payload
 * @param {string} [message="Success"] - Success message
 * @param {number} [statusCode=200] - HTTP status code
 * @returns {Object} Express response with JSON body
 */
export const successResponse = (res, data, message = "Success", statusCode = 200) => res.status(statusCode).json({
    success: true,
    message,
    data,
  });

/**
 * @param {Object} res - Express response object
 * @param {string} [message="Error"] - Error message
 * @param {number} [statusCode=500] - HTTP status code
 * @param {Array|null} [errors=null] - Optional array of error details
 * @returns {Object} Express response with JSON error body
 */
export const errorResponse = (res, message = "Error", statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * @param {Object} res - Express response object
 * @param {*} data - Response data payload
 * @param {Object} pagination - Pagination metadata
 * @param {number} pagination.page - Current page number
 * @param {number} pagination.limit - Items per page
 * @param {number} pagination.total - Total number of items
 * @param {string} [message="Success"] - Success message
 * @returns {Object} Express response with paginated JSON body
 */
export const paginatedResponse = (res, data, pagination, message = "Success") => res.json({
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1,
    },
  });
