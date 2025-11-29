import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const extractFilenameFromUrl = (url) => {
  if (!url || typeof url !== "string") {
    return null;
  }

  if (url.startsWith("data:image/")) {
    return null;
  }

  const parts = url.split("/");
  return parts[parts.length - 1];
};

export const deleteProfileImageFile = async (imageUrl) => {
  if (!imageUrl || imageUrl.startsWith("data:image/")) {
    return;
  }

  const filename = extractFilenameFromUrl(imageUrl);
  if (!filename) {
    return;
  }

  const filePath = path.join(__dirname, "../public/uploads/profiles", filename);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("Error deleting profile image:", error);
    }
  }
};

export const ensureUploadDirExists = async () => {
  const uploadDir = path.join(__dirname, "../public/uploads/profiles");

  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error("Error creating upload directory:", error);
    throw error;
  }
};
