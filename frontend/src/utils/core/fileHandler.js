/**
 * Centralized file upload/download handling utility
 * Provides consistent file operations across the application
 */

import { notify } from "@utils/ui/notification.js";

/**
 * File handler utility for upload, download, and validation operations
 */
export const fileHandler = {
    /**
     * Upload file with progress tracking
     * @param {File} file - File to upload
     * @param {string} endpoint - API endpoint for upload
     * @param {Object} options - Upload options
     * @param {Function} options.onProgress - Progress callback (percent, loaded, total)
     * @param {number} options.maxSize - Maximum file size in MB (default: 10)
     * @param {Array<string>} options.allowedTypes - Allowed file types/extensions
     * @param {Object} options.additionalData - Additional form data to send
     * @returns {Promise<{success: boolean, data?: any, error?: string}>}
     */
    async upload(file, endpoint, options = {}) {
        const {
            onProgress = null,
            maxSize = 10,
            allowedTypes = [],
            additionalData = {}
        } = options;

        // Validation
        if (!this.validateFile(file, { maxSize, allowedTypes })) {
            return { success: false, error: "Validation failed" };
        }

        // Create FormData
        const formData = new FormData();
        formData.append("file", file);

        // Add additional data
        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
        });

        try {
            // Use XMLHttpRequest for progress tracking
            return await this._uploadWithProgress(endpoint, formData, onProgress);
        } catch (error) {
            notify.error("Upload failed: " + error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Upload with progress tracking using XMLHttpRequest
     * @private
     * @param {string} endpoint - API endpoint
     * @param {FormData} formData - Form data to upload
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<{success: boolean, data?: any, error?: string}>}
     */
    _uploadWithProgress(endpoint, formData, onProgress) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            // Progress tracking
            if (onProgress) {
                xhr.upload.addEventListener("progress", (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        onProgress(percentComplete, e.loaded, e.total);
                    }
                });
            }

            // Success handler
            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        resolve({ success: true, data: response });
                    } catch (e) {
                        resolve({ success: true, data: xhr.responseText });
                    }
                } else {
                    reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
            });

            // Error handlers
            xhr.addEventListener("error", () => {
                reject(new Error("Network error occurred"));
            });

            xhr.addEventListener("abort", () => {
                reject(new Error("Upload cancelled"));
            });

            // Send request
            xhr.open("POST", endpoint);
            xhr.withCredentials = true; // Include cookies
            xhr.send(formData);
        });
    },

    /**
     * Validate file before upload
     * @param {File} file - File to validate
     * @param {Object} options - Validation options
     * @param {number} options.maxSize - Maximum file size in MB
     * @param {Array<string>} options.allowedTypes - Allowed file types/extensions
     * @returns {boolean} True if valid, false otherwise
     */
    validateFile(file, options = {}) {
        const { maxSize = 10, allowedTypes = [] } = options;

        // Check file exists
        if (!file) {
            notify.error("No file selected");
            return false;
        }

        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSize) {
            notify.error(
                `File size must be less than ${maxSize}MB (current: ${fileSizeMB.toFixed(2)}MB)`
            );
            return false;
        }

        // Check file type
        if (allowedTypes.length > 0) {
            const fileType = file.type;
            const fileExt = file.name.split(".").pop().toLowerCase();

            const isAllowed = allowedTypes.some((type) => {
                if (type.includes("*")) {
                    // Handle wildcards like 'image/*'
                    return fileType.startsWith(type.replace("*", ""));
                }
                return fileType === type || fileExt === type.replace(".", "");
            });

            if (!isAllowed) {
                notify.error(`File type not allowed. Allowed: ${allowedTypes.join(", ")}`);
                return false;
            }
        }

        return true;
    },

    /**
     * Read file as Data URL (for image preview)
     * @param {File} file - File to read
     * @returns {Promise<string>} Data URL string
     */
    async readAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsDataURL(file);
        });
    },

    /**
     * Read file as text
     * @param {File} file - File to read
     * @returns {Promise<string>} File content as text
     */
    async readAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsText(file);
        });
    },

    /**
     * Read file as ArrayBuffer
     * @param {File} file - File to read
     * @returns {Promise<ArrayBuffer>} File content as ArrayBuffer
     */
    async readAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Download file from URL
     * @param {string} url - URL to download from
     * @param {string} filename - Filename for downloaded file
     * @param {Object} options - Download options
     * @param {boolean} options.showProgress - Show progress tracking
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async download(url, filename, options = {}) {
        const { showProgress = false } = options;

        try {
            let blob;

            if (showProgress) {
                blob = await this._downloadWithProgress(url);
            } else {
                const response = await fetch(url, { credentials: "include" });
                if (!response.ok) {throw new Error(`HTTP ${response.status}`);}
                blob = await response.blob();
            }

            this.downloadBlob(blob, filename);
            return { success: true };
        } catch (error) {
            notify.error("Download failed: " + error.message);
            return { success: false, error: error.message };
        }
    },

    /**
     * Download with progress tracking
     * @private
     * @param {string} url - URL to download from
     * @returns {Promise<Blob>} Downloaded blob
     */
    async _downloadWithProgress(url) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.responseType = "blob";

            xhr.addEventListener("progress", (e) => {
                if (e.lengthComputable) {
                    const percentComplete = (e.loaded / e.total) * 100;
                    console.log(`Download progress: ${percentComplete.toFixed(2)}%`);
                }
            });

            xhr.addEventListener("load", () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject(new Error(`HTTP ${xhr.status}`));
                }
            });

            xhr.addEventListener("error", () => {
                reject(new Error("Network error"));
            });

            xhr.open("GET", url);
            xhr.withCredentials = true;
            xhr.send();
        });
    },

    /**
     * Download blob as file
     * @param {Blob} blob - Blob to download
     * @param {string} filename - Filename for download
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up object URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 100);
    },

    /**
     * Download data as JSON file
     * @param {any} data - Data to download as JSON
     * @param {string} filename - Filename for download
     */
    downloadJSON(data, filename) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        this.downloadBlob(blob, filename);
    },

    /**
     * Download data as CSV file
     * @param {string} data - CSV data string
     * @param {string} filename - Filename for download
     */
    downloadCSV(data, filename) {
        const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
        this.downloadBlob(blob, filename);
    },

    /**
     * Download text as file
     * @param {string} text - Text content
     * @param {string} filename - Filename for download
     * @param {string} mimeType - MIME type (default: 'text/plain')
     */
    downloadText(text, filename, mimeType = "text/plain") {
        const blob = new Blob([text], { type: mimeType });
        this.downloadBlob(blob, filename);
    },

    /**
     * Get file extension from filename
     * @param {string} filename - Filename
     * @returns {string} File extension (lowercase)
     */
    getExtension(filename) {
        return filename.split(".").pop().toLowerCase();
    },

    /**
     * Format file size in human readable format
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted file size (e.g., "1.5 MB")
     */
    formatFileSize(bytes) {
        if (bytes === 0) {return "0 Bytes";}
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
    },

    /**
     * Check if file is an image
     * @param {File} file - File to check
     * @returns {boolean} True if image, false otherwise
     */
    isImage(file) {
        return file.type.startsWith("image/");
    },

    /**
     * Check if file is a PDF
     * @param {File} file - File to check
     * @returns {boolean} True if PDF, false otherwise
     */
    isPDF(file) {
        return file.type === "application/pdf";
    },

    /**
     * Check if file is a CSV
     * @param {File} file - File to check
     * @returns {boolean} True if CSV, false otherwise
     */
    isCSV(file) {
        return file.type === "text/csv" || this.getExtension(file.name) === "csv";
    }
};
