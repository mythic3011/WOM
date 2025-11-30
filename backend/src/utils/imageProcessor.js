/**
 * @file imageProcessor.js
 * @description Image processing utilities for handling profile, performance, and venue images with validation, resizing, and format conversion
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency sharp
 * @dependency uuid
 * @see backend/src/config/multer.js
 * @see backend/src/controllers/userController.js
 * @see backend/src/controllers/performanceController.js
 */

import sharp from "sharp";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * @param {Object} file - Multer file object
 * @param {string} file.mimetype - MIME type of the file
 * @param {number} file.size - File size in bytes
 * @returns {boolean} True if validation passes
 * @throws {Error} If file is missing, has invalid type, or exceeds size limit
 */
export const validateImage = (file) => {
  if (!file) {
    throw new Error("No file provided");
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds 5MB limit");
  }

  return true;
};

/**
 * @param {Buffer} buffer - Image buffer to process
 * @returns {Promise<Buffer>} Processed image buffer (300x300 JPEG at 90% quality)
 * @throws {Error} If image processing fails
 */
export const processProfileImage = async (buffer) => {
  try {
    const processed = await sharp(buffer)
      .resize(300, 300, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    return processed;
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

/**
 * @param {Buffer} buffer - Image buffer to process
 * @returns {Promise<Buffer>} Processed image buffer (800x600 JPEG at 85% quality)
 * @throws {Error} If image processing fails
 */
export const processPerformanceImage = async (buffer) => {
  try {
    const processed = await sharp(buffer)
      .resize(800, 600, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    return processed;
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

/**
 * @param {Buffer} buffer - Image buffer to process
 * @returns {Promise<Buffer>} Processed image buffer (1200x800 JPEG at 85% quality)
 * @throws {Error} If image processing fails
 */
export const processVenueImage = async (buffer) => {
  try {
    const processed = await sharp(buffer)
      .resize(1200, 800, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    return processed;
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

/**
 * @param {Buffer} buffer - Image buffer to process
 * @param {number} [width=150] - Thumbnail width in pixels
 * @param {number} [height=150] - Thumbnail height in pixels
 * @returns {Promise<Buffer>} Thumbnail image buffer (JPEG at 80% quality)
 * @throws {Error} If thumbnail generation fails
 */
export const generateThumbnail = async (buffer, width = 150, height = 150) => {
  try {
    const thumbnail = await sharp(buffer)
      .resize(width, height, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    return thumbnail;
  } catch (error) {
    throw new Error(`Thumbnail generation failed: ${error.message}`);
  }
};

/**
 * @param {Buffer} buffer - Image buffer to convert
 * @returns {Promise<Buffer>} WebP format image buffer at 85% quality
 * @throws {Error} If WebP conversion fails
 */
export const convertToWebP = async (buffer) => {
  try {
    const converted = await sharp(buffer).webp({ quality: 85 }).toBuffer();

    return converted;
  } catch (error) {
    throw new Error(`WebP conversion failed: ${error.message}`);
  }
};

/**
 * @param {Buffer} buffer - Image buffer to analyze
 * @returns {Promise<Object>} Image metadata object
 * @returns {number} returns.width - Image width in pixels
 * @returns {number} returns.height - Image height in pixels
 * @returns {string} returns.format - Image format (jpeg, png, webp, etc.)
 * @returns {number} returns.size - Image size in bytes
 * @returns {boolean} returns.hasAlpha - Whether image has alpha channel
 * @throws {Error} If metadata reading fails
 */
export const getImageMetadata = async (buffer) => {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      hasAlpha: metadata.hasAlpha,
    };
  } catch (error) {
    throw new Error(`Failed to read image metadata: ${error.message}`);
  }
};

/**
 * @param {Buffer} buffer - Image buffer to save
 * @param {string} directory - Target directory path
 * @param {string|null} [filename=null] - Optional filename (generates UUID if not provided)
 * @returns {Promise<Object>} Save result object
 * @returns {string} returns.filepath - Full path to saved file
 * @returns {string} returns.filename - Filename used for saving
 * @throws {Error} If image saving fails
 */
export const saveImage = async (buffer, directory, filename = null) => {
  try {
    const name = filename || `${uuidv4()}.jpg`;
    const filepath = path.join(directory, name);

    await fs.mkdir(directory, { recursive: true });

    await sharp(buffer).toFile(filepath);

    return { filepath, filename: name };
  } catch (error) {
    throw new Error(`Failed to save image: ${error.message}`);
  }
};

/**
 * @param {string} filepath - Path to image file to delete
 * @returns {Promise<boolean>} True if deleted, false if file not found
 * @throws {Error} If deletion fails for reasons other than file not found
 */
export const deleteImage = async (filepath) => {
  try {
    await fs.unlink(filepath);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * @param {Buffer} buffer - Image buffer to convert
 * @returns {Promise<string>} Base64 encoded data URI string
 * @throws {Error} If base64 conversion fails
 */
export const imageToBase64 = async (buffer) => {
  try {
    const base64 = buffer.toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    throw new Error(`Base64 conversion failed: ${error.message}`);
  }
};

export default {
  validateImage,
  processProfileImage,
  processPerformanceImage,
  processVenueImage,
  generateThumbnail,
  convertToWebP,
  getImageMetadata,
  saveImage,
  deleteImage,
  imageToBase64,
};
