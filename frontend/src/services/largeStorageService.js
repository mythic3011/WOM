import localforage from "localforage";

class LargeStorageService {
  constructor() {
    this.store = localforage.createInstance({
      name: "wom_large_storage",
      storeName: "keyvaluepairs",
      description: "Large data storage for WOM application",
    });

    this.blobStore = localforage.createInstance({
      name: "wom_blob_storage",
      storeName: "blobs",
      description: "Binary data storage for images and files",
    });
  }

  async set(key, value) {
    try {
      await this.store.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error setting large storage item (${key}):`, error);
      throw new Error(`Failed to store data: ${error.message}`);
    }
  }

  async get(key, defaultValue = null) {
    try {
      const value = await this.store.getItem(key);
      return value !== null ? value : defaultValue;
    } catch (error) {
      console.error(`Error getting large storage item (${key}):`, error);
      return defaultValue;
    }
  }

  async remove(key) {
    try {
      await this.store.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing large storage item (${key}):`, error);
      return false;
    }
  }

  async clear() {
    try {
      await this.store.clear();
      await this.blobStore.clear();
      return true;
    } catch (error) {
      console.error("Error clearing large storage:", error);
      return false;
    }
  }

  async keys() {
    try {
      return await this.store.keys();
    } catch (error) {
      console.error("Error getting large storage keys:", error);
      return [];
    }
  }

  async length() {
    try {
      return await this.store.length();
    } catch (error) {
      console.error("Error getting large storage length:", error);
      return 0;
    }
  }

  async iterate(callback) {
    try {
      await this.store.iterate((value, key, iterationNumber) => {
        callback(value, key, iterationNumber);
      });
      return true;
    } catch (error) {
      console.error("Error iterating large storage:", error);
      return false;
    }
  }

  async setBlob(key, blob) {
    try {
      await this.blobStore.setItem(key, blob);
      return true;
    } catch (error) {
      console.error(`Error setting blob (${key}):`, error);
      throw new Error(`Failed to store blob: ${error.message}`);
    }
  }

  async getBlob(key) {
    try {
      return await this.blobStore.getItem(key);
    } catch (error) {
      console.error(`Error getting blob (${key}):`, error);
      return null;
    }
  }

  async removeBlob(key) {
    try {
      await this.blobStore.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing blob (${key}):`, error);
      return false;
    }
  }

  async setImage(key, imageData) {
    try {
      const blob = await this.dataURLToBlob(imageData);
      await this.setBlob(key, blob);
      return true;
    } catch (error) {
      console.error(`Error setting image (${key}):`, error);
      throw new Error(`Failed to store image: ${error.message}`);
    }
  }

  async getImage(key) {
    try {
      const blob = await this.getBlob(key);
      if (!blob) {return null;}
      return await this.blobToDataURL(blob);
    } catch (error) {
      console.error(`Error getting image (${key}):`, error);
      return null;
    }
  }

  dataURLToBlob(dataURL) {
    return new Promise((resolve, reject) => {
      try {
        const arr = dataURL.split(",");
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        resolve(new Blob([u8arr], { type: mime }));
      } catch (error) {
        reject(error);
      }
    });
  }

  blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async setMultiple(items) {
    try {
      const promises = items.map(({ key, value }) => this.set(key, value));
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error("Error setting multiple items:", error);
      throw new Error(`Failed to store multiple items: ${error.message}`);
    }
  }

  async getMultiple(keys) {
    try {
      const promises = keys.map((key) => this.get(key));
      const values = await Promise.all(promises);
      return keys.reduce((acc, key, index) => {
        acc[key] = values[index];
        return acc;
      }, {});
    } catch (error) {
      console.error("Error getting multiple items:", error);
      return {};
    }
  }

  async removeMultiple(keys) {
    try {
      const promises = keys.map((key) => this.remove(key));
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error("Error removing multiple items:", error);
      return false;
    }
  }

  async export() {
    try {
      const data = {};
      await this.iterate((value, key) => {
        data[key] = value;
      });
      return {
        timestamp: new Date().toISOString(),
        data,
      };
    } catch (error) {
      console.error("Error exporting large storage:", error);
      throw new Error(`Failed to export data: ${error.message}`);
    }
  }

  async import(exportData) {
    try {
      if (!exportData || !exportData.data) {
        throw new Error("Invalid export data format");
      }

      const items = Object.entries(exportData.data).map(([key, value]) => ({
        key,
        value,
      }));

      await this.setMultiple(items);
      return { success: true, imported: items.length };
    } catch (error) {
      console.error("Error importing large storage:", error);
      return { success: false, error: error.message };
    }
  }

  async getStorageInfo() {
    try {
      const keys = await this.keys();
      const blobKeys = await this.blobStore.keys();

      return {
        driver: this.store.driver(),
        dataItems: keys.length,
        blobItems: blobKeys.length,
        totalItems: keys.length + blobKeys.length,
      };
    } catch (error) {
      console.error("Error getting storage info:", error);
      return {
        driver: "unknown",
        dataItems: 0,
        blobItems: 0,
        totalItems: 0,
      };
    }
  }

  async supports(feature) {
    try {
      return await localforage.supports(feature);
    } catch (error) {
      console.error(`Error checking feature support (${feature}):`, error);
      return false;
    }
  }

  getDriver() {
    return this.store.driver();
  }

  async ready() {
    try {
      await this.store.ready();
      await this.blobStore.ready();
      return true;
    } catch (error) {
      console.error("Error waiting for storage ready:", error);
      return false;
    }
  }
}

export const largeStorage = new LargeStorageService();
