/**
 * @file ImageUploader.js
 * @description Image uploader component for admin interface with file upload and URL input support
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @see @components/common/ImageUploader.js
 */

export class ImageUploader {

  /**
   * @param {Object} [options={}] - Configuration options
   * @param {string} options.containerId - Container element ID
   * @param {string} [options.currentImageUrl=null] - Current image URL if editing
   * @param {Function} [options.onImageChange] - Callback when image changes
   * @param {number} [options.maxFileSize=5242880] - Maximum file size in bytes
   */
  constructor(options = {}) {
    this.containerId = options.containerId;
    this.currentImageUrl = options.currentImageUrl || null;
    this.onImageChange = options.onImageChange || (() => {});
    this.maxFileSize = options.maxFileSize || 5242880;

    this.state = {
      imageSource: null,
      imageData: null,
      previewUrl: null,
      isLoading: false,
      error: null,
      successMessage: null
    };

    if (this.currentImageUrl) {
      this.state.imageSource = "url";
      this.state.imageData = this.currentImageUrl;
      this.state.previewUrl = this.currentImageUrl;
    }

    this.allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  }

  /**
   * @returns {string} HTML string for the image uploader component
   */
  render() {
    const hasImage = this.state.previewUrl !== null;
    const isUploadDisabled = this.state.imageSource === "url";
    const isUrlDisabled = this.state.imageSource === "upload";

    return `
      <div class="image-uploader" id="${this.containerId}">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Performance Image
        </label>
        
        <!-- Error Message -->
        ${this.state.error ? `
          <div class="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <i class="fas fa-exclamation-circle mr-2"></i>
            ${this.state.error}
          </div>
        ` : ""}
        
        <!-- Success Message -->
        ${this.state.successMessage ? `
          <div class="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <i class="fas fa-check-circle mr-2"></i>
            ${this.state.successMessage}
          </div>
        ` : ""}
        
        <!-- Image Preview -->
        ${hasImage ? `
          <div class="mb-4 relative">
            <div class="relative inline-block w-full">
              ${this.state.isLoading ? `
                <div class="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div class="text-center">
                    <i class="fas fa-spinner fa-spin text-3xl text-gray-400 mb-2"></i>
                    <p class="text-sm text-gray-500">Loading image...</p>
                  </div>
                </div>
              ` : `
                <img 
                  src="${this.state.previewUrl}" 
                  alt="Performance preview" 
                  id="imagePreview"
                  class="w-full max-w-md h-48 sm:h-56 md:h-64 object-cover rounded-lg border border-gray-300 shadow-sm"
                  onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'w-full h-48 bg-red-50 rounded-lg flex items-center justify-center border-2 border-red-200\\'><div class=\\'text-center p-4\\'><i class=\\'fas fa-exclamation-triangle text-3xl text-red-400 mb-2\\'></i><p class=\\'text-sm text-red-600 font-medium\\'>Failed to load image</p><p class=\\'text-xs text-red-500 mt-1\\'>The image could not be displayed</p></div></div><button type=\\'button\\' id=\\'deleteImageBtn\\' class=\\'absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg\\' title=\\'Delete image\\'><i class=\\'fas fa-times\\'></i></button>';"
                />
              `}
              <button 
                type="button"
                id="deleteImageBtn"
                class="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg z-10"
                title="Delete image"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-2">
              <i class="fas fa-info-circle mr-1"></i>
              Source: ${this.state.imageSource === "upload" ? "Uploaded file" : "URL"}
            </p>
          </div>
        ` : ""}
        
        <!-- Upload Section -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-600 mb-2">
            <i class="fas fa-upload mr-2"></i>Upload Image File
          </label>
          <input 
            type="file" 
            id="imageFileInput"
            accept="image/jpeg,image/png,image/gif,image/webp"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 ${isUploadDisabled ? "opacity-50 cursor-not-allowed" : ""}"
            ${isUploadDisabled ? "disabled" : ""}
          />
          <p class="text-xs text-gray-500 mt-1">
            Accepted formats: JPEG, PNG, GIF, WebP. Max size: ${(this.maxFileSize / 1024 / 1024).toFixed(0)}MB
          </p>
        </div>
        
        <!-- URL Section -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-600 mb-2">
            <i class="fas fa-link mr-2"></i>Or Enter Image URL
          </label>
          <input 
            type="url" 
            id="imageUrlInput"
            placeholder="https://example.com/image.jpg"
            value="${this.state.imageSource === "url" && this.state.imageData ? this.state.imageData : ""}"
            class="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isUrlDisabled ? "opacity-50 cursor-not-allowed bg-gray-50" : ""}"
            ${isUrlDisabled ? "disabled" : ""}
          />
          <p class="text-xs text-gray-500 mt-1">
            Enter a direct link to an image hosted online
          </p>
        </div>
        
        ${!hasImage ? `
          <div class="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <i class="fas fa-image text-4xl text-gray-300 mb-2"></i>
            <p class="text-sm text-gray-500">No image selected</p>
            <p class="text-xs text-gray-400 mt-1">Upload a file or enter a URL above</p>
          </div>
        ` : ""}
      </div>
    `;
  }

  /**
   * @returns {void}
   */
  attachEventListeners() {
    const fileInput = document.getElementById("imageFileInput");
    const urlInput = document.getElementById("imageUrlInput");
    const deleteBtn = document.getElementById("deleteImageBtn");
    const imagePreview = document.getElementById("imagePreview");

    if (fileInput) {
      fileInput.addEventListener("change", (e) => this.handleFileUpload(e));
    }

    if (urlInput) {
      urlInput.addEventListener("blur", (e) => this.handleUrlInput(e.target.value));
      urlInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.handleUrlInput(e.target.value);
        }
      });
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => this.handleDelete());
    }

    // Add error handler for image preview to reattach delete button
    if (imagePreview) {
      imagePreview.addEventListener("error", () => {
        // Reattach delete button listener after error placeholder is shown
        setTimeout(() => {
          const newDeleteBtn = document.getElementById("deleteImageBtn");
          if (newDeleteBtn && !newDeleteBtn.hasAttribute("data-listener-attached")) {
            newDeleteBtn.setAttribute("data-listener-attached", "true");
            newDeleteBtn.addEventListener("click", () => this.handleDelete());
          }
        }, 100);
      });
    }
  }

  /**
   * @param {Event} event - File input change event
   * @returns {Promise<void>}
   */
  async handleFileUpload(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
      this.setState({ error: validation.error });
      event.target.value = ""; // Clear the input
      this.rerender();
      return;
    }

    // Clear any previous errors
    this.setState({ error: null });

    // MUTUAL EXCLUSIVITY: Clear URL if it was previously set
    // This ensures only one image source is active at a time
    if (this.state.imageSource === "url") {
      const urlInput = document.getElementById("imageUrlInput");
      if (urlInput) {
        urlInput.value = "";
      }
      // Clear URL from state
      this.setState({
        imageSource: null,
        imageData: null,
        previewUrl: null
      });
    }

    // Generate preview
    await this.showPreview(file);

    // Update state with new upload
    this.setState({
      imageSource: "upload",
      imageData: file
    });

    // Notify parent
    this.onImageChange(this.getImageData());

    // Rerender to update UI
    this.rerender();
  }

  /**
   * @param {File} file - File to validate
   * @returns {Object} Validation result with valid flag and optional error message
   */
  validateFile(file) {
    // Check file type
    if (!this.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
      };
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      const maxSizeMB = (this.maxFileSize / 1024 / 1024).toFixed(0);
      return {
        valid: false,
        error: `Image file is too large. Maximum size is ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  }

  /**
   * @param {string} url - Image URL to validate and load
   * @returns {Promise<void>}
   */
  async handleUrlInput(url) {
    // Trim whitespace
    url = url.trim();

    // If empty, just return
    if (!url) {
      return;
    }

    // Validate URL format
    const validation = this.validateUrl(url);
    if (!validation.valid) {
      this.setState({ error: validation.error });
      this.rerender();
      return;
    }

    // Clear any previous errors
    this.setState({ error: null });

    // MUTUAL EXCLUSIVITY: Clear file upload if it was previously set
    // This ensures only one image source is active at a time
    if (this.state.imageSource === "upload") {
      const fileInput = document.getElementById("imageFileInput");
      if (fileInput) {
        fileInput.value = "";
      }
      // Clear upload from state
      this.setState({
        imageSource: null,
        imageData: null,
        previewUrl: null
      });
    }

    // Show loading state
    this.setState({ isLoading: true });
    this.rerender();

    // Try to load the image
    try {
      await this.showPreview(url);

      // Update state with new URL
      this.setState({
        imageSource: "url",
        imageData: url,
        isLoading: false
      });

      // Notify parent
      this.onImageChange(this.getImageData());

      // Rerender to update UI
      this.rerender();
    } catch (error) {
      this.setState({
        error: "Unable to load image from URL. Please check the URL and try again.",
        isLoading: false
      });
      this.rerender();
    }
  }

  /**
   * @param {string} url - URL to validate
   * @returns {Object} Validation result with valid flag and optional error message
   */
  validateUrl(url) {
    // Basic URL format validation
    try {
      const urlObj = new URL(url);

      // Check protocol
      if (!["http:", "https:"].includes(urlObj.protocol)) {
        return {
          valid: false,
          error: "Please enter a valid URL starting with http:// or https://"
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: "Please enter a valid URL"
      };
    }
  }

  /**
   * @param {File|string} source - File object or URL string
   * @returns {Promise<void>}
   */
  async showPreview(source) {
    if (source instanceof File) {
      // Generate preview from file using FileReader
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          // Validate that the result is a valid data URL
          const result = e.target.result;
          if (result && result.startsWith("data:image/")) {
            this.setState({
              previewUrl: result,
              error: null
            });
            resolve();
          } else {
            this.setState({
              error: "Failed to generate image preview",
              previewUrl: null
            });
            reject(new Error("Invalid image data"));
          }
        };

        reader.onerror = () => {
          this.setState({
            error: "Failed to read file",
            previewUrl: null
          });
          reject(new Error("Failed to read file"));
        };

        reader.readAsDataURL(source);
      });
    } else if (typeof source === "string") {
      // Load image from URL with timeout
      return new Promise((resolve, reject) => {
        const img = new Image();
        const timeout = setTimeout(() => {
          img.src = ""; // Cancel loading
          this.setState({
            error: "Image loading timed out",
            previewUrl: null
          });
          reject(new Error("Image loading timed out"));
        }, 10000); // 10 second timeout

        img.onload = () => {
          clearTimeout(timeout);
          this.setState({
            previewUrl: source,
            error: null
          });
          resolve();
        };

        img.onerror = () => {
          clearTimeout(timeout);
          this.setState({
            error: "Failed to load image from URL",
            previewUrl: null
          });
          reject(new Error("Failed to load image from URL"));
        };

        // Set crossOrigin to handle CORS if needed
        img.crossOrigin = "anonymous";
        img.src = source;
      });
    } else {
      return Promise.reject(new Error("Invalid source type"));
    }
  }

  /**
   * @returns {void}
   */
  handleDelete() {
    // Clear all state
    this.setState({
      imageSource: null,
      imageData: null,
      previewUrl: null,
      error: null,
      successMessage: "Image deleted successfully"
    });

    // Clear file input
    const fileInput = document.getElementById("imageFileInput");
    if (fileInput) {
      fileInput.value = "";
    }

    // Clear URL input
    const urlInput = document.getElementById("imageUrlInput");
    if (urlInput) {
      urlInput.value = "";
    }

    // Notify parent
    this.onImageChange(this.getImageData());

    // Rerender to update UI
    this.rerender();

    // Clear success message after 3 seconds
    setTimeout(() => {
      if (this.state.successMessage) {
        this.setState({ successMessage: null });
        this.rerender();
      }
    }, 3000);
  }

  /**
   * @returns {Object} Image data with type and data
   */
  getImageData() {
    return {
      type: this.state.imageSource,
      data: this.state.imageData,
      previewUrl: this.state.previewUrl
    };
  }

  /**
   * @param {Object} updates - State updates to apply
   * @returns {void}
   */
  setState(updates) {
    this.state = { ...this.state, ...updates };
  }

  /**
   * @returns {void}
   */
  rerender() {
    const container = document.getElementById(this.containerId);
    if (container) {
      const parent = container.parentElement;
      if (parent) {
        parent.innerHTML = this.render();
        this.attachEventListeners();
      }
    }
  }
}
