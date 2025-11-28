/**
 * Utility functions for handling image URLs
 */

/**
 * Constructs the full image URL for performance images
 * @param {string} imageUrl - The image URL from the API (can be relative or absolute)
 * @returns {string} - The full image URL
 */
export function getPerformanceImageUrl(imageUrl) {
  if (!imageUrl) {
    return "/img/loginBg2.jpg";
  }

  let decodedUrl = imageUrl;
  if (typeof imageUrl === "string") {
    decodedUrl = imageUrl
      .replace(/&#x2F;/g, "/")
      .replace(/&#x5C;/g, "\\")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#x27;/g, "'");
  }

  // If it's already an absolute URL (http/https), return as is
  if (decodedUrl.startsWith("http://") || decodedUrl.startsWith("https://")) {
    return decodedUrl;
  }

  // If it's a relative path starting with /uploads or /assets, prepend the API base URL
  if (decodedUrl.startsWith("/uploads/") || decodedUrl.startsWith("/assets/")) {
    const apiBaseUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    return `${apiBaseUrl}${decodedUrl}`;
  }

  // Otherwise return as is (might be a path like /img/default-performance.jpg)
  return decodedUrl;
}

/**
 * Gets the fallback SVG for when an image fails to load
 * @returns {string} - Data URL for fallback SVG
 */
export function getImageFallbackSvg() {
  return "data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22Arial, sans-serif%22 font-size=%2220%22 text-anchor=%22middle%22 x=%22200%22 y=%22140%22%3E%3Ctspan x=%22200%22 dy=%220%22%3E%F0%9F%8E%BC%3C/tspan%3E%3Ctspan x=%22200%22 dy=%2230%22%3EPerformance Image%3C/tspan%3E%3C/text%3E%3C/svg%3E";
}
