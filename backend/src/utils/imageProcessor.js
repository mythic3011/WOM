import sharp from "sharp";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

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

export const convertToWebP = async (buffer) => {
  try {
    const converted = await sharp(buffer).webp({ quality: 85 }).toBuffer();

    return converted;
  } catch (error) {
    throw new Error(`WebP conversion failed: ${error.message}`);
  }
};

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
