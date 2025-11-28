import { faker } from "@faker-js/faker";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOCK_ASSETS_BASE = "/assets/mock";
const PERFORMANCE_DIR = path.join(__dirname, "../../../public/assets/mock/performances");
const PROFILE_DIR = path.join(__dirname, "../../../public/assets/mock/profiles");
const VENUE_DIR = path.join(__dirname, "../../../public/assets/mock/venue");

const PLACEHOLDER_PERFORMANCE_URLS = [
  "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1519683384663-39b8b8a0c6e5?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1460036521480-ff49c08c2781?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1519683109079-d5f539e1542f?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=800&fit=crop",
];

const PLACEHOLDER_PROFILE_URLS = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
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

export const generateVenueImageUrl = (index) => {
  const localImages = getLocalImageFiles(VENUE_DIR);

  if (localImages.length > 0) {
    const imageFile = localImages[index % localImages.length];
    return `${MOCK_ASSETS_BASE}/venue/${imageFile}`;
  }

  const PLACEHOLDER_VENUE_URLS = [
    "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1519167758481-83f29da8c2b0?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1519750783826-e2420f4d687f?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1519167758481-83f29da8c2b0?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1519750783826-e2420f4d687f?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=800&fit=crop",
  ];

  return PLACEHOLDER_VENUE_URLS[index % PLACEHOLDER_VENUE_URLS.length];
};

export const generateRandomVenueImageUrl = () => {
  const localImages = getLocalImageFiles(VENUE_DIR);

  if (localImages.length > 0) {
    const imageFile = faker.helpers.arrayElement(localImages);
    return `${MOCK_ASSETS_BASE}/venue/${imageFile}`;
  }

  const PLACEHOLDER_VENUE_URLS = [
    "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1519167758481-83f29da8c2b0?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1519750783826-e2420f4d687f?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1519167758481-83f29da8c2b0?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1519750783826-e2420f4d687f?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&h=800&fit=crop",
    "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=800&fit=crop",
  ];

  return faker.helpers.arrayElement(PLACEHOLDER_VENUE_URLS);
};
