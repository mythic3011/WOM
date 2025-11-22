import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";

const SALT_ROUNDS = 10;
const ENCRYPTION_KEY = "wom_secure_key_2024_orchestral_music";

export async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Failed to hash password");
  }
}

export async function verifyPassword(password, hashedPassword) {
  try {
    return await bcrypt.compare(password, hashedPassword);
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}

export function generateSimpleId(length = 8) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateToken(length = 32) {
  const array = new Uint8Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      ""
    );
  }
  return generateSimpleId(length);
}

export function encrypt(data, customKey = null) {
  try {
    const key = customKey || ENCRYPTION_KEY;
    const dataString = typeof data === "string" ? data : JSON.stringify(data);

    const bytes = [];
    for (let i = 0; i < dataString.length; i++) {
      bytes.push(dataString.charCodeAt(i));
    }
    const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(bytes));
    const encrypted = CryptoJS.AES.encrypt(wordArray, key).toString();
    return encrypted;
  } catch (error) {
    console.error("Error encrypting data:", error);
    console.error("Data type:", typeof data);
    throw new Error("Failed to encrypt data");
  }
}

export function decrypt(encryptedData, customKey = null) {
  try {
    // Validate input
    if (!encryptedData || (typeof encryptedData === 'string' && !encryptedData.trim())) {
      throw new Error("Cannot decrypt empty or invalid data");
    }

    const key = customKey || ENCRYPTION_KEY;
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);

    const words = decrypted.words;
    const sigBytes = decrypted.sigBytes;
    const bytes = [];

    for (let i = 0; i < sigBytes; i++) {
      bytes.push((words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff);
    }

    const decryptedString = String.fromCharCode.apply(null, bytes);

    if (!decryptedString) {
      throw new Error("Decryption failed - invalid key or corrupted data");
    }

    try {
      return JSON.parse(decryptedString);
    } catch (e) {
      return decryptedString;
    }
  } catch (error) {
    console.error("Error decrypting data:", error);
    throw new Error("Failed to decrypt data");
  }
}

export function encryptObject(obj, customKey = null) {
  try {
    return encrypt(JSON.stringify(obj), customKey);
  } catch (error) {
    console.error("Error encrypting object:", error);
    throw new Error("Failed to encrypt object");
  }
}

export function decryptObject(encryptedData, customKey = null) {
  try {
    const decryptedString = decrypt(encryptedData, customKey);
    return typeof decryptedString === "string"
      ? JSON.parse(decryptedString)
      : decryptedString;
  } catch (error) {
    console.error("Error decrypting object:", error);
    throw new Error("Failed to decrypt object");
  }
}

export function hashData(data) {
  try {
    const dataString = typeof data === "string" ? data : JSON.stringify(data);
    return CryptoJS.SHA256(dataString).toString();
  } catch (error) {
    console.error("Error hashing data:", error);
    throw new Error("Failed to hash data");
  }
}

export function generateEncryptionKey() {
  return CryptoJS.lib.WordArray.random(256 / 8).toString();
}
