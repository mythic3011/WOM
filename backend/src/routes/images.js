import express from "express";
import { uploadSingle } from "#config/multer.js";
import { isAuthenticated } from "#middleware/auth.js";
import { asyncHandler } from "#middleware/asyncHandler.js";
import {
  validateImage,
  processProfileImage,
  processPerformanceImage,
  processVenueImage,
  saveImage,
  deleteImage,
} from "#utils/imageProcessor.js";
import { imageUploadLogger } from "#utils/imageUploadLogger.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const IMAGE_TYPE_CONFIG = {
  performance: {
    processor: processPerformanceImage,
    directory: "performances",
    requiresAdmin: true,
  },
  profile: {
    processor: processProfileImage,
    directory: "profiles",
    requiresAdmin: false,
  },
  venue: {
    processor: processVenueImage,
    directory: "venues",
    requiresAdmin: true,
  },
};

function getStoragePath(type) {
  const config = IMAGE_TYPE_CONFIG[type];
  if (!config) {
    return null;
  }
  return path.join(__dirname, `../../public/uploads/${config.directory}`);
}

router.post(
  "/:type",
  isAuthenticated,
  (req, res, next) => {
    const { type } = req.params;
    const config = IMAGE_TYPE_CONFIG[type];

    if (!config) {
      return res.status(400).json({
        success: false,
        message: `Invalid image type: ${type}. Valid types: ${Object.keys(IMAGE_TYPE_CONFIG).join(", ")}`,
      });
    }

    if (config.requiresAdmin && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required for this image type",
      });
    }

    next();
  },
  uploadSingle,
  asyncHandler(async (req, res) => {
    const { type } = req.params;
    const requestId = req.id || req.headers["x-request-id"];

    if (!req.file) {
      imageUploadLogger.logValidationError(new Error("No file provided"), {
        type,
        requestId,
      });
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const startTime = imageUploadLogger.logUploadStart(
      type,
      req.file.size,
      req.file.mimetype,
      requestId
    );

    try {
      validateImage(req.file);
    } catch (error) {
      imageUploadLogger.logValidationError(error, {
        type,
        requestId,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      });
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    const config = IMAGE_TYPE_CONFIG[type];
    let processedBuffer;

    try {
      processedBuffer = await config.processor(req.file.buffer);
    } catch (error) {
      imageUploadLogger.logSharpError(error, {
        type,
        requestId,
        originalSize: req.file.size,
        mimeType: req.file.mimetype,
      });
      return res.status(500).json({
        success: false,
        message: "Image processing failed",
      });
    }

    const uploadDir = getStoragePath(type);
    let savedFile;

    try {
      savedFile = await saveImage(processedBuffer, uploadDir);
    } catch (error) {
      imageUploadLogger.logStorageError(error, 0, {
        type,
        requestId,
        uploadDir,
      });
      return res.status(500).json({
        success: false,
        message: "Failed to save image",
      });
    }

    const imageUrl = `/uploads/${config.directory}/${savedFile.filename}`;

    imageUploadLogger.logUploadSuccess(imageUrl, startTime, processedBuffer.length, type);

    res.status(201).json({
      success: true,
      data: {
        url: imageUrl,
        filename: savedFile.filename,
        type: type,
        size: processedBuffer.length,
      },
    });
  })
);

router.delete(
  "/:type/:filename",
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { type, filename } = req.params;
    const config = IMAGE_TYPE_CONFIG[type];

    if (!config) {
      return res.status(400).json({
        success: false,
        message: `Invalid image type: ${type}`,
      });
    }

    if (config.requiresAdmin && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const filepath = path.join(getStoragePath(type), filename);

    try {
      const deleted = await deleteImage(filepath);
      if (deleted) {
        res.json({
          success: true,
          message: "Image deleted successfully",
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Image not found",
        });
      }
    } catch (error) {
      imageUploadLogger.logStorageError(error, 0, {
        type,
        filename,
        operation: "delete",
      });
      res.status(500).json({
        success: false,
        message: "Failed to delete image",
      });
    }
  })
);

export { getStoragePath, IMAGE_TYPE_CONFIG };
export default router;
