import { faker } from "@faker-js/faker";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOCK_ASSETS_BASE = "/assets/mock";
const PERFORMANCE_DIR = path.join(__dirname, "../../../public/assets/mock/performances");
const PROFILE_DIR = path.join(__dirname, "../../../public/assets/mock/profiles");

const PLACEHOLDER_PERFORMANCE_URLS = [
  "https://via.placeholder.com/800x600/1a1a2e/eaeaea?text=Classical+Concert",
  "https://via.placeholder.com/800x600/16213e/eaeaea?text=Symphony+Orchestra",
  "https://via.placeholder.com/800x600/0f3460/eaeaea?text=Piano+Recital",
  "https://via.placeholder.com/800x600/533483/eaeaea?text=Chamber+Music",
  "https://via.placeholder.com/800x600/7c3aed/eaeaea?text=Opera+Performance",
  "https://via.placeholder.com/800x600/2d4059/eaeaea?text=Violin+Concerto",
  "https://via.placeholder.com/800x600/ea5455/eaeaea?text=Choral+Concert",
  "https://via.placeholder.com/800x600/f07b3f/eaeaea?text=Baroque+Music",
  "https://via.placeholder.com/800x600/ffd460/1a1a2e?text=Modern+Classical",
  "https://via.placeholder.com/800x600/2d9596/eaeaea?text=String+Quartet",
];

const PLACEHOLDER_PROFILE_URLS = [
  "https://via.placeholder.com/200x200/6c5ce7/ffffff?text=User",
  "https://via.placeholder.com/200x200/a29bfe/ffffff?text=Profile",
  "https://via.placeholder.com/200x200/fd79a8/ffffff?text=Member",
  "https://via.placeholder.com/200x200/fdcb6e/333333?text=Guest",
  "https://via.placeholder.com/200x200/00b894/ffffff?text=Patron",
  "https://via.placeholder.com/200x200/00cec9/ffffff?text=Subscriber",
  "https://via.placeholder.com/200x200/0984e3/ffffff?text=VIP",
  "https://via.placeholder.com/200x200/e17055/ffffff?text=Admin",
];

const getLocalImageFiles = (directory) => {
  try {
    if (!fs.existsSync(directory)) {
      return [];
    }
    const files = fs.readdirSync(directory);
    return files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".webp"].includes(ext);
    });
  } catch (error) {
    return [];
  }
};

export const generatePerformanceImageUrl = (index) => {
  const localImages = getLocalImageFiles(PERFORMANCE_DIR);

  if (localImages.length > 0) {
    const imageFile = localImages[index % localImages.length];
    return `${MOCK_ASSETS_BASE}/performances/${imageFile}`;
  }

  return PLACEHOLDER_PERFORMANCE_URLS[index % PLACEHOLDER_PERFORMANCE_URLS.length];
};

export const generateProfileImageUrl = (index) => {
  const localImages = getLocalImageFiles(PROFILE_DIR);

  if (localImages.length > 0) {
    const imageFile = localImages[index % localImages.length];
    return `${MOCK_ASSETS_BASE}/profiles/${imageFile}`;
  }

  return PLACEHOLDER_PROFILE_URLS[index % PLACEHOLDER_PROFILE_URLS.length];
};

export const generateRandomPerformanceImageUrl = () => {
  const localImages = getLocalImageFiles(PERFORMANCE_DIR);

  if (localImages.length > 0) {
    const imageFile = faker.helpers.arrayElement(localImages);
    return `${MOCK_ASSETS_BASE}/performances/${imageFile}`;
  }

  return faker.helpers.arrayElement(PLACEHOLDER_PERFORMANCE_URLS);
};

export const generateRandomProfileImageUrl = () => {
  const localImages = getLocalImageFiles(PROFILE_DIR);

  if (localImages.length > 0) {
    const imageFile = faker.helpers.arrayElement(localImages);
    return `${MOCK_ASSETS_BASE}/profiles/${imageFile}`;
  }

  return faker.helpers.arrayElement(PLACEHOLDER_PROFILE_URLS);
};
