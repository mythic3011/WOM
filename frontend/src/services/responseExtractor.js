export class ResponseExtractor {
  static extract(response, resourceKey) {
    if (!response?.success || !response?.data) {
      console.warn(`Invalid response structure for ${resourceKey}`, response);
      return Array.isArray(response) ? response : [];
    }

    const extracted = response.data[resourceKey] || response.data || [];
    return Array.isArray(extracted) ? extracted : [];
  }

  static extractSingle(response, resourceKey) {
    if (!response?.success || !response?.data) {
      console.warn(`Invalid response structure for ${resourceKey}`, response);
      return null;
    }

    return response.data[resourceKey] || response.data || null;
  }

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
