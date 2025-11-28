import logger from "#config/logger.js";

const imageUploadLogger = {
  logUploadStart(type, fileSize, mimeType, requestId = null) {
    const logData = {
      event: "image_upload_start",
      type,
      fileSize,
      fileSizeFormatted: formatFileSize(fileSize),
      mimeType,
      timestamp: new Date().toISOString(),
    };

    if (requestId) {
      logData.requestId = requestId;
    }

    logger.info("Image upload started", logData);
    return Date.now();
  },

  logUploadSuccess(url, startTime, finalFileSize, type = null) {
    const processingTime = Date.now() - startTime;
    const logData = {
      event: "image_upload_success",
      url,
      processingTimeMs: processingTime,
      finalFileSize,
      finalFileSizeFormatted: formatFileSize(finalFileSize),
      timestamp: new Date().toISOString(),
    };

    if (type) {
      logData.type = type;
    }

    logger.info("Image upload completed successfully", logData);
  },

  logUploadFailure(error, requestDetails = {}) {
    const logData = {
      event: "image_upload_failure",
      errorMessage: error.message || String(error),
      errorStack: error.stack || null,
      timestamp: new Date().toISOString(),
      ...requestDetails,
    };

    logger.error("Image upload failed", logData);
  },

  logSharpError(error, inputFileDetails = {}) {
    const logData = {
      event: "sharp_processing_error",
      errorMessage: error.message || String(error),
      errorStack: error.stack || null,
      sharpError: error.code || null,
      timestamp: new Date().toISOString(),
      ...inputFileDetails,
    };

    logger.error("Sharp image processing failed", logData);
  },

  logStorageError(error, retryCount = 0, storageDetails = {}) {
    const logData = {
      event: "storage_error",
      errorMessage: error.message || String(error),
      errorStack: error.stack || null,
      retryCount,
      timestamp: new Date().toISOString(),
      ...storageDetails,
    };

    logger.error("Image storage operation failed", logData);
  },

  logValidationError(error, fileDetails = {}) {
    const logData = {
      event: "image_validation_error",
      errorMessage: error.message || String(error),
      timestamp: new Date().toISOString(),
      ...fileDetails,
    };

    logger.warn("Image validation failed", logData);
  },
};

function formatFileSize(bytes) {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

export { imageUploadLogger };
export default imageUploadLogger;
