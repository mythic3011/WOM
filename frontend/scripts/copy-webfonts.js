import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "@fortawesome",
  "fontawesome-free",
  "webfonts"
);
const destDir = path.join(__dirname, "..", "public", "webfonts");

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(sourceDir);
files.forEach((file) => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);
  fs.copyFileSync(sourcePath, destPath);
  console.log(`Copied ${file} to public/webfonts/`);
});

console.log("Font Awesome webfonts copied successfully!");
