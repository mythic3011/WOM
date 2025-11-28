import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || "";

const PERFORMANCE_DIR = path.join(__dirname, "../../../public/assets/mock/performances");
const PROFILE_DIR = path.join(__dirname, "../../../public/assets/mock/profiles");
const VENUE_DIR = path.join(__dirname, "../../../public/assets/mock/venue");
const PERFORMANCE_IMAGES = [
  "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=800&fit=crop",
  "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=800&fit=crop",
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
];

const PROFILE_IMAGES = [
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
];

const VENUE_IMAGES = [
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

const downloadImage = (url, filepath, retries = 3) => {
  return new Promise((resolve, reject) => {
    const attempt = (retriesLeft) => {
      const urlWithKey = UNSPLASH_ACCESS_KEY 
        ? `${url}&client_id=${UNSPLASH_ACCESS_KEY}`
        : url;
      
      const options = {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      };
      https.get(urlWithKey, options, (response) => {
        if (response.statusCode === 200) {
          const fileStream = fs.createWriteStream(filepath);
          response.pipe(fileStream);
          fileStream.on("finish", () => {
            fileStream.close();
            resolve();
          });
          fileStream.on("error", (err) => {
            fs.unlink(filepath, () => {});
            if (retriesLeft > 0) {
              setTimeout(() => attempt(retriesLeft - 1), 2000);
            } else {
              reject(err);
            }
          });
        } else if (response.statusCode === 302 || response.statusCode === 301) {
          const redirectUrl = response.headers.location;
          https.get(redirectUrl, options, (redirectResponse) => {
            if (redirectResponse.statusCode === 200) {
              const fileStream = fs.createWriteStream(filepath);
              redirectResponse.pipe(fileStream);
              fileStream.on("finish", () => {
                fileStream.close();
                resolve();
              });
            } else {
              if (retriesLeft > 0) {
                setTimeout(() => attempt(retriesLeft - 1), 2000);
              } else {
                reject(new Error(`Failed to download: ${redirectResponse.statusCode}`));
              }
            }
          }).on("error", (err) => {
            if (retriesLeft > 0) {
              setTimeout(() => attempt(retriesLeft - 1), 2000);
            } else {
              reject(err);
            }
          });
        } else {
          if (retriesLeft > 0) {
            setTimeout(() => attempt(retriesLeft - 1), 2000);
          } else {
            reject(new Error(`Failed to download: ${response.statusCode}`));
          }
        }
      }).on("error", (err) => {
        if (retriesLeft > 0) {
          setTimeout(() => attempt(retriesLeft - 1), 2000);
        } else {
          reject(err);
        }
      });
    };
    attempt(retries);
  });
};

const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const downloadMockImages = async () => {
  console.log("Starting mock image download...");

  ensureDirectoryExists(PERFORMANCE_DIR);
  ensureDirectoryExists(PROFILE_DIR);
  ensureDirectoryExists(VENUE_DIR);
  
  console.log("\nDownloading performance images...");
  for (let i = 0; i < PERFORMANCE_IMAGES.length; i++) {
    const url = PERFORMANCE_IMAGES[i];
    const filename = `performance-${i + 1}.jpg`;
    const filepath = path.join(PERFORMANCE_DIR, filename);

    if (fs.existsSync(filepath)) {
      console.log(`  [${i + 1}/${PERFORMANCE_IMAGES.length}] ${filename} already exists, skipping...`);
      continue;
    }

    try {
      console.log(`  [${i + 1}/${PERFORMANCE_IMAGES.length}] Downloading ${filename}...`);
      await downloadImage(url, filepath);
      console.log(`  ✓ Saved ${filename}`);
    } catch (error) {
      console.error(`  ✗ Failed to download ${filename}:`, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\nDownloading profile images...");
  for (let i = 0; i < PROFILE_IMAGES.length; i++) {
    const url = PROFILE_IMAGES[i];
    const filename = `profile-${i + 1}.jpg`;
    const filepath = path.join(PROFILE_DIR, filename);

    if (fs.existsSync(filepath)) {
      console.log(`  [${i + 1}/${PROFILE_IMAGES.length}] ${filename} already exists, skipping...`);
      continue;
    }

    try {
      console.log(`  [${i + 1}/${PROFILE_IMAGES.length}] Downloading ${filename}...`);
      await downloadImage(url, filepath);
      console.log(`  ✓ Saved ${filename}`);
    } catch (error) {
      console.error(`  ✗ Failed to download ${filename}:`, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\nDownloading venue images...");
  for (let i = 0; i < VENUE_IMAGES.length; i++) {
    const url = VENUE_IMAGES[i];
    const filename = `venue-${i + 1}.jpg`;
    const filepath = path.join(VENUE_DIR, filename);

    if (fs.existsSync(filepath)) {
      console.log(`  [${i + 1}/${VENUE_IMAGES.length}] ${filename} already exists, skipping...`);
      continue;
    }

    try {
      console.log(`  [${i + 1}/${VENUE_IMAGES.length}] Downloading ${filename}...`);
      await downloadImage(url, filepath);
      console.log(`  ✓ Saved ${filename}`);
    } catch (error) {
      console.error(`  ✗ Failed to download ${filename}:`, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("\nMock image download complete!");
  console.log(`  Performance images: ${PERFORMANCE_DIR}`);
  console.log(`  Profile images: ${PROFILE_DIR}`);
  console.log(`  Venue images: ${VENUE_DIR}`);
};

downloadMockImages().catch(console.error);
