import { APP_CONFIG } from "@config/config.js";

const API_BASE = APP_CONFIG.apiBaseUrl;

const IMAGE_TYPES = {
  performance: {
    maxSize: 5,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    endpoint: "/image/performance",
  },
  profile: {
    maxSize: 2,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    endpoint: "/image/profile",
  },
  venue: {
    maxSize: 5,
    allowedTypes: ["image/jpeg", "image/png", "image/webp"],
    endpoint: "/image/venue",
  },
};

const imageUploadService = {
  async upload(file, type, options = {}) {
    const { onProgress = null } = options;

    const typeConfig = IMAGE_TYPES[type];
    if (!typeConfig) {
      return {
        success: false,
        error: `Invalid image type: ${type}. Valid types: ${Object.keys(IMAGE_TYPES).join(", ")}`,
      };
    }

    const validation = this.validateFile(file, {
      maxSize: typeConfig.maxSize,
      allowedTypes: typeConfig.allowedTypes,
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const result = await this._uploadWithProgress(
        `${API_BASE}${typeConfig.endpoint}`,
        formData,
        onProgress
      );

      if (result.success && result.data) {
        const responseData = result.data.data || result.data;
        return {
          success: true,
          url: responseData.url || responseData.imageUrl,
          filename: responseData.filename,
          type: type,
          size: file.size,
        };
      }

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  _uploadWithProgress(endpoint, formData, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete, e.loaded, e.total);
          }
        });
      }

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({ success: true, data: response });
          } catch (_e) {
            resolve({ success: true, data: xhr.responseText });
          }
        } else {
          let errorMessage = `HTTP ${xhr.status}: ${xhr.statusText}`;
          try {
            const errorResponse = JSON.parse(xhr.responseText);
            errorMessage = errorResponse.message || errorResponse.error || errorMessage;
          } catch (_e) {
            // Use default error message
          }
          resolve({ success: false, error: errorMessage });
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error occurred"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload cancelled"));
      });

      xhr.open("POST", endpoint);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  },

  createPreviewURL(file) {
    if (!file || !(typeof Blob !== "undefined" && file instanceof Blob)) {
      return null;
    }
    return URL.createObjectURL(file);
  },

  revokePreviewURL(url) {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  },

  validateFile(file, options = {}) {
    const { maxSize = 5, allowedTypes = [] } = options;

    if (!file) {
      return { valid: false, error: "No file provided" };
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return {
        valid: false,
        error: `File size must be less than ${maxSize}MB (current: ${fileSizeMB.toFixed(2)}MB)`,
      };
    }

    if (allowedTypes.length > 0) {
      const fileType = file.type;
      const isAllowed = allowedTypes.some((type) => {
        if (type.includes("*")) {
          return fileType.startsWith(type.replace("*", ""));
        }
        return fileType === type;
      });

      if (!isAllowed) {
        return {
          valid: false,
          error: `Invalid file type. Allowed: ${allowedTypes.join(", ")}`,
        };
      }
    }

    return { valid: true };
  },

  getPlaceholderURL(type) {
    const placeholders = {
      performance: "/assets/mock/performances/placeholder.jpg",
      profile: "/assets/mock/profiles/placeholder.jpg",
      venue: "/assets/mock/venues/placeholder.jpg",
    };
    return placeholders[type] || "/assets/placeholder.jpg";
  },

  getTypeConfig(type) {
    return IMAGE_TYPES[type] || null;
  },

  getSupportedTypes() {
    return Object.keys(IMAGE_TYPES);
  },
};

export { imageUploadService };
export default imageUploadService;
