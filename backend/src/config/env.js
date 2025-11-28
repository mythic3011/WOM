import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, "../../..");
const nodeEnv = process.env.NODE_ENV || "development";

let envPath;
const envSpecificPath = join(rootDir, `.env.${nodeEnv}`);
const defaultEnvPath = join(rootDir, ".env");

if (existsSync(envSpecificPath)) {
  envPath = envSpecificPath;
  console.log(`Loading environment from: .env.${nodeEnv}`);
} else if (existsSync(defaultEnvPath)) {
  envPath = defaultEnvPath;
  console.log(`Loading environment from: .env (fallback)`);
} else {
  console.warn("No .env file found, using system environment variables only");
}

if (envPath) {
  const result = dotenv.config({ path: envPath, override: false });
  
  if (result.error) {
    console.error(`Error loading environment file: ${result.error.message}`);
  }
}

export default process.env;
