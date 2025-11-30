/**
 * @file responseExtractor.js
 * @description Utility class for extracting data from API responses
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 */

/**
 * @class ResponseExtractor
 * @description Extracts data from standardized API responses
 */
export class ResponseExtractor {
  /**
   * @description Extracts array data from response
   * @param {Object} response - API response
   * @param {string} resourceKey - Key for resource in response
   * @returns {Array} Extracted array data
   */
  static extract(response, resourceKey) {
    if (!response?.success || !response?.data) {
      console.warn(`Invalid response structure for ${resourceKey}`, response);
      return Array.isArray(response) ? response : [];
    }

    const extracted = response.data[resourceKey] || response.data || [];
    return Array.isArray(extracted) ? extracted : [];
  }

  /**
   * @description Extracts single object from response
   * @param {Object} response - API response
   * @param {string} resourceKey - Key for resource in response
   * @returns {Object|null} Extracted object or null
   */
  static extractSingle(response, resourceKey) {
    if (!response?.success || !response?.data) {
      console.warn(`Invalid response structure for ${resourceKey}`, response);
      return null;
    }

    return response.data[resourceKey] || response.data || null;
  }

  /**
   * @description Extracts paginated data from response
   * @param {Object} response - API response
   * @param {string} resourceKey - Key for resource in response
   * @returns {Object} Paginated data with items, total, page, limit, totalPages
   */
  static extractPaginated(response, resourceKey) {
    if (!response?.success || !response?.data) {
      console.warn(`Invalid paginated response for ${resourceKey}`, response);
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };
    }

    return {
      items: response.data[resourceKey] || [],
      total: response.data.total || 0,
      page: response.data.page || 1,
      limit: response.data.limit || 10,
      totalPages: response.data.totalPages || 0,
    };
  }
}
