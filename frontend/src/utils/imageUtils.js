const DEFAULT_FALLBACK_IMAGE = "/img/loginBg2.jpg";

const HTML_ENTITY_MAP = {
  "&#x2F;": "/",
  "&#x5C;": "\\",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": "\"",
  "&#x27;": "'"
};

function decodeHtmlEntities(str) {
  if (typeof str !== "string") {
    return str;
  }

  let decoded = str;
  for (const [entity, char] of Object.entries(HTML_ENTITY_MAP)) {
    decoded = decoded.replace(new RegExp(entity, "g"), char);
  }
  return decoded;
}

function processImageUrl(imageUrl, fallbackImage = DEFAULT_FALLBACK_IMAGE) {
  if (!imageUrl) {
    return fallbackImage;
  }

  const decodedUrl = decodeHtmlEntities(imageUrl);

  if (decodedUrl.startsWith("http://") || decodedUrl.startsWith("https://")) {
    return decodedUrl;
  }

  if (decodedUrl.startsWith("/uploads/") || decodedUrl.startsWith("/assets/")) {
    return decodedUrl;
  }

  return decodedUrl;
}

export function getPerformanceImageUrl(imageUrl) {
  return processImageUrl(imageUrl);
}

export function getVenueImageUrl(imageUrl) {
  return processImageUrl(imageUrl);
}

function createFallbackSvg(icon, label) {
  return `data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22400%22 height=%22300%22/%3E%3Ctext fill=%22%239ca3af%22 font-family=%22Arial, sans-serif%22 font-size=%2220%22 text-anchor=%22middle%22 x=%22200%22 y=%22140%22%3E%3Ctspan x=%22200%22 dy=%220%22%3E${icon}%3C/tspan%3E%3Ctspan x=%22200%22 dy=%2230%22%3E${label}%3C/tspan%3E%3C/text%3E%3C/svg%3E`;
}

export function getImageFallbackSvg() {
  return createFallbackSvg("%F0%9F%8E%BC", "Performance Image");
}

export function getVenueFallbackSvg() {
  return createFallbackSvg("%F0%9F%8F%9B%EF%B8%8F", "Venue Image");
}
