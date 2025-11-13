import dayjs from "dayjs";
import CryptoJS from "crypto-js";
import LZString from "lz-string";
import { DEV_TOOLS_CONFIG } from "./devToolsConfig.js";

const STORAGE_KEY = "wom_dev_key";

export class StorageManager {
  static getAllData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        data[key] = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        data[key] = localStorage.getItem(key);
      }
    }
    return data;
  }

  static getStorageInfo() {
    const storageSize = new Blob([JSON.stringify(localStorage)]).size;
    const storageSizeKB = (storageSize / 1024).toFixed(2);
    return {
      size: storageSizeKB,
      items: localStorage.length,
    };
  }

  static exportToFile(processed = false) {
    let data = {};

    if (processed) {
      const processedData = this.getProcessedData();
      for (const [key, item] of Object.entries(processedData)) {
        data[key] = item.value;
      }
    } else {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
      }
    }

    const filename = processed
      ? `${DEV_TOOLS_CONFIG.storage.exportPrefix}-processed-${dayjs().format(
          "YYYY-MM-DD-HHmmss"
        )}.json`
      : `${DEV_TOOLS_CONFIG.storage.exportPrefix}-${dayjs().format(
          "YYYY-MM-DD-HHmmss"
        )}.json`;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: DEV_TOOLS_CONFIG.storage.importAccept,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  static importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          Object.keys(data).forEach((key) => {
            localStorage.setItem(key, data[key]);
          });
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  static clearAll() {
    localStorage.clear();
  }

  static tryDecrypt(value) {
    try {
      const decrypted = CryptoJS.AES.decrypt(value, STORAGE_KEY).toString(
        CryptoJS.enc.Utf8
      );
      return decrypted ? JSON.parse(decrypted) : null;
    } catch (e) {
      return null;
    }
  }

  static tryDecompress(value) {
    try {
      const decompressed = LZString.decompress(value);
      return decompressed ? JSON.parse(decompressed) : null;
    } catch (e) {
      try {
        const decompressed = LZString.decompressFromUTF16(value);
        return decompressed ? JSON.parse(decompressed) : null;
      } catch (e2) {
        return null;
      }
    }
  }

  static processValue(value) {
    if (typeof value !== "string") {
      return value;
    }

    const decrypted = this.tryDecrypt(value);
    if (decrypted !== null) {
      return { processed: decrypted, type: "encrypted" };
    }

    const decompressed = this.tryDecompress(value);
    if (decompressed !== null) {
      return { processed: decompressed, type: "compressed" };
    }

    return { processed: value, type: "raw" };
  }

  static processNestedValue(obj) {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.processNestedValue(item));
    }

    if (obj.value && obj.encrypted) {
      const result = this.processValue(obj.value);
      return {
        ...obj,
        value: result.processed,
        decrypted: true,
        originalType: result.type,
      };
    }

    if (obj.value && typeof obj.value === "string") {
      const result = this.processValue(obj.value);
      if (result.type !== "raw") {
        return {
          ...obj,
          value: result.processed,
          decrypted: true,
          originalType: result.type,
        };
      }
    }

    const processed = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        const result = this.processValue(value);
        processed[key] =
          result.type !== "raw"
            ? { value: result.processed, type: result.type }
            : value;
      } else {
        processed[key] = this.processNestedValue(value);
      }
    }
    return processed;
  }

  static getProcessedData() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const rawValue = localStorage.getItem(key);

      let processedValue = rawValue;
      let metadata = { type: "raw" };

      try {
        const parsed = JSON.parse(rawValue);
        const processed = this.processNestedValue(parsed);
        processedValue = processed;
        metadata.type = "json-processed";
      } catch (e) {
        const decrypted = this.tryDecrypt(rawValue);
        if (decrypted !== null) {
          processedValue = decrypted;
          metadata.type = "encrypted";
          metadata.original = "encrypted-json";
        } else {
          const decompressed = this.tryDecompress(rawValue);
          if (decompressed !== null) {
            processedValue = decompressed;
            metadata.type = "compressed";
            metadata.original = "compressed-json";
          } else {
            processedValue = rawValue;
          }
        }
      }

      data[key] = {
        value: processedValue,
        metadata,
        raw: rawValue.substring(0, 100),
      };
    }
    return data;
  }

  static encrypt(data) {
    const jsonStr = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonStr, STORAGE_KEY).toString();
  }

  static decrypt(encrypted) {
    const decrypted = CryptoJS.AES.decrypt(encrypted, STORAGE_KEY).toString(
      CryptoJS.enc.Utf8
    );
    return JSON.parse(decrypted);
  }

  static compress(data) {
    const jsonStr = JSON.stringify(data);
    return LZString.compress(jsonStr);
  }

  static compressUTF16(data) {
    const jsonStr = JSON.stringify(data);
    return LZString.compressToUTF16(jsonStr);
  }

  static decompress(compressed) {
    const decompressed = LZString.decompress(compressed);
    return JSON.parse(decompressed);
  }

  static decompressUTF16(compressed) {
    const decompressed = LZString.decompressFromUTF16(compressed);
    return JSON.parse(decompressed);
  }

  static detectType(value) {
    try {
      const parsed = JSON.parse(value);

      if (parsed && typeof parsed === "object") {
        if (
          parsed.encrypted ||
          (parsed.value &&
            typeof parsed.value === "string" &&
            parsed.value.startsWith("U2FsdGVk"))
        ) {
          return "encrypted";
        }

        if (typeof parsed.value === "string") {
          if (this.tryDecrypt(parsed.value) !== null) {
            return "encrypted";
          }
          if (this.tryDecompress(parsed.value) !== null) {
            return "compressed";
          }
        }
      }

      return "json";
    } catch (e) {
      if (this.tryDecrypt(value) !== null) {
        return "encrypted";
      } else if (this.tryDecompress(value) !== null) {
        return "compressed";
      }
      return "raw";
    }
  }

  static analyzeStorage() {
    const analysis = {
      total: localStorage.length,
      byType: {
        raw: 0,
        json: 0,
        encrypted: 0,
        compressed: 0,
      },
      totalSize: 0,
      items: [],
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      const size = new Blob([value]).size;
      const type = this.detectType(value);

      analysis.byType[type]++;
      analysis.totalSize += size;
      analysis.items.push({
        key,
        type,
        size,
        sizeKB: (size / 1024).toFixed(2),
      });
    }

    analysis.totalSizeKB = (analysis.totalSize / 1024).toFixed(2);
    return analysis;
  }
}
