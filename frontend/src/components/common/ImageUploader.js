/**
 * @file ImageUploader.js
 * @description Common image uploader component with drag-and-drop and URL input support
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @see @components/admin/ImageUploader.js
 */

import $ from "jquery";

export const ImageUploader = {
  /**
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.id="image-uploader"] - Component ID
   * @param {string} [options.label="Upload Image"] - Label text
   * @param {string} [options.accept] - Accepted file types
   * @param {number} [options.maxSize] - Maximum file size in bytes
   * @param {number} [options.maxSizeMB=5] - Maximum file size in MB
   * @param {boolean} [options.multiple=false] - Allow multiple file selection
   * @param {boolean} [options.showPreview=true] - Show image preview
   * @param {boolean} [options.showUrlInput=true] - Show URL input field
   * @param {string} [options.previewUrl=null] - Initial preview URL
   * @param {string} [options.previewAlt="Preview"] - Preview image alt text
   * @param {string} [options.height="200px"] - Component height
   * @param {string} [options.className=""] - Additional CSS classes
   * @param {string} [options.helpText] - Help text to display
   * @param {string} [options.dragDropText] - Drag and drop instruction text
   * @returns {string} HTML string for the image uploader component
   */
  render(options = {}) {
    const {
      id = "image-uploader",
      label = "Upload Image",
      accept = "image/png,image/jpeg,image/jpg,image/gif,image/webp",
      maxSize = 5 * 1024 * 1024,
      maxSizeMB = 5,
      multiple = false,
      showPreview = true,
      showUrlInput = true,
      previewUrl = null,
      previewAlt = "Preview",
      height = "200px",
      className = "",
      helpText = "JPG, PNG, GIF or WebP. Max 5MB.",
      dragDropText = "Drag and drop an image here, or click to select",
    } = options;

    const uploaderId = `${id}-uploader`;
    const inputId = `${id}-input`;
    const urlInputId = `${id}-url-input`;
    const previewId = `${id}-preview`;
    const dropzoneId = `${id}-dropzone`;

    return `
      <div id="${uploaderId}" class="image-uploader ${className}">
        ${label ? `<label class="block text-sm font-semibold text-gray-700 mb-2">${label}</label>` : ""}
        
        <div 
          id="${dropzoneId}"
          class="image-uploader-dropzone border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all"
          style="min-height: ${height}"
        >
          ${showPreview && previewUrl
            ? `
            <div id="${previewId}" class="image-uploader-preview relative">
              <img 
                src="${previewUrl}" 
                alt="${previewAlt}" 
                class="max-w-full max-h-48 mx-auto rounded-lg shadow-md"
              />
              <button
                type="button"
                class="image-uploader-remove absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                title="Remove image"
              >
                <i class="fas fa-times"></i>
              </button>
            </div>
          `
            : `
            <div id="${previewId}" class="image-uploader-placeholder">
              <div class="flex flex-col items-center justify-center py-8">
                <i class="fas fa-cloud-upload-alt text-5xl text-gray-400 mb-4"></i>
                <p class="text-gray-600 font-medium mb-2">${dragDropText}</p>
                ${helpText ? `<p class="text-xs text-gray-500">${helpText}</p>` : ""}
              </div>
            </div>
          `
          }
          
          <input
            type="file"
            id="${inputId}"
            class="hidden"
            accept="${accept}"
            ${multiple ? "multiple" : ""}
            data-max-size="${maxSize}"
          />
        </div>

        ${showUrlInput
          ? `
          <div class="mt-4">
            <label for="${urlInputId}" class="block text-sm font-medium text-gray-700 mb-2">
              Or enter image URL
            </label>
            <div class="flex gap-2">
              <input
                type="url"
                id="${urlInputId}"
                class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-gray-900 placeholder-gray-400"
                placeholder="https://example.com/image.jpg"
              />
              <button
                type="button"
                class="image-uploader-load-url px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <i class="fas fa-download"></i>
              </button>
            </div>
          </div>
        `
          : ""
        }

        <div class="image-uploader-error mt-2 text-sm text-red-600 hidden"></div>
      </div>
    `;
  },

  /**
   * @param {string} uploaderId - ID of the uploader container element
   * @param {Object} [callbacks={}] - Event callbacks
   * @param {Function} [callbacks.onUpload] - Called when file is uploaded
   * @param {Function} [callbacks.onRemove] - Called when image is removed
   * @param {Function} [callbacks.onError] - Called when error occurs
   * @param {number} [callbacks.maxSize=5242880] - Maximum file size in bytes
   * @param {Function} [callbacks.validateFile] - Custom file validation function
   * @returns {Object} Control methods (reset, showError, hideError, cleanup)
   */
  initialize(uploaderId, callbacks = {}) {
    const {
      onUpload,
      onRemove,
      onError,
      maxSize = 5 * 1024 * 1024,
      validateFile,
    } = callbacks;

    const maxSizeMB = Math.round(maxSize / (1024 * 1024));

    const $uploader = $(`#${uploaderId}`);
    if (!$uploader.length) {
      console.error(`ImageUploader: Element #${uploaderId} not found`);
      return;
    }

    const $dropzone = $uploader.find(".image-uploader-dropzone");
    const $input = $uploader.find("input[type='file']");
    const $urlInput = $uploader.find("input[type='url']");
    const $preview = $uploader.find(".image-uploader-preview, .image-uploader-placeholder");
    const $error = $uploader.find(".image-uploader-error");

    const showError = (message) => {
      $error.text(message).removeClass("hidden");
      if (onError) {
        onError(message);
      }
    };

    const hideError = () => {
      $error.addClass("hidden");
    };

    const validateFileSize = (file) => {
      if (file.size > maxSize) {
        showError(`File size must be less than ${maxSizeMB}MB`);
        return false;
      }
      return true;
    };

    const validateFileType = (file) => {
      if (!file.type.startsWith("image/")) {
        showError("Please select an image file");
        return false;
      }
      return true;
    };

    const readFileAsDataURL = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    const showPreview = (dataUrl, fileName = "Image") => {
      $preview.html(`
        <div class="relative">
          <img 
            src="${dataUrl}" 
            alt="${fileName}" 
            class="max-w-full max-h-48 mx-auto rounded-lg shadow-md"
          />
          <button
            type="button"
            class="image-uploader-remove absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            title="Remove image"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      `);

      $preview.find(".image-uploader-remove").off("click").on("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleRemove();
      });
    };

    const handleFileUpload = async (file) => {
      hideError();

      if (!validateFileType(file)) {
        return;
      }

      if (!validateFileSize(file)) {
        return;
      }

      if (validateFile && !validateFile(file)) {
        return;
      }

      try {
        const dataUrl = await readFileAsDataURL(file);
        showPreview(dataUrl, file.name);

        if (onUpload) {
          await onUpload(file, dataUrl);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        showError("Failed to upload image");
      }
    };

    const handleRemove = async () => {
      $preview.html(`
        <div class="flex flex-col items-center justify-center py-8">
          <i class="fas fa-cloud-upload-alt text-5xl text-gray-400 mb-4"></i>
          <p class="text-gray-600 font-medium mb-2">Drag and drop an image here, or click to select</p>
        </div>
      `);

      $input.val("");
      $urlInput.val("");
      hideError();

      if (onRemove) {
        await onRemove();
      }
    };

    const handleUrlLoad = async () => {
      const url = $urlInput.val().trim();
      if (!url) {
        showError("Please enter a valid URL");
        return;
      }

      hideError();

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to load image from URL");
        }

        const blob = await response.blob();
        if (!blob.type.startsWith("image/")) {
          throw new Error("URL does not point to an image");
        }

        const file = new File([blob], "image-from-url.jpg", { type: blob.type });
        
        if (!validateFileSize(file)) {
          return;
        }

        const dataUrl = await readFileAsDataURL(file);
        showPreview(dataUrl, url);

        if (onUpload) {
          await onUpload(file, dataUrl);
        }
      } catch (error) {
        console.error("Error loading image from URL:", error);
        showError("Failed to load image from URL. Please check the URL and try again.");
      }
    };

    $dropzone.on("click", (e) => {
      if (
        !$(e.target).hasClass("image-uploader-remove") &&
        !$(e.target).closest(".image-uploader-remove").length
      ) {
        e.preventDefault();
        e.stopPropagation();
        $input[0].click();
      }
    });

    $input.on("change", async (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await handleFileUpload(files[0]);
      }
    });

    $dropzone.on("dragover", (e) => {
      e.preventDefault();
      e.stopPropagation();
      $dropzone.addClass("border-indigo-500 bg-indigo-50");
    });

    $dropzone.on("dragleave", (e) => {
      e.preventDefault();
      e.stopPropagation();
      $dropzone.removeClass("border-indigo-500 bg-indigo-50");
    });

    $dropzone.on("drop", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      $dropzone.removeClass("border-indigo-500 bg-indigo-50");

      const files = e.originalEvent.dataTransfer.files;
      if (files && files.length > 0) {
        await handleFileUpload(files[0]);
      }
    });

    $uploader.find(".image-uploader-load-url").off("click").on("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleUrlLoad();
    });

    $urlInput.off("keypress").on("keypress", (e) => {
      if (e.which === 13 || e.key === "Enter") {
        e.preventDefault();
        handleUrlLoad();
      }
    });

    const cleanup = () => {
      $dropzone.off("click dragover dragleave drop");
      $input.off("change");
      $uploader.find(".image-uploader-load-url").off("click");
      $urlInput.off("keypress");
      $preview.find(".image-uploader-remove").off("click");
    };

    return {
      reset: handleRemove,
      showError,
      hideError,
      cleanup,
    };
  },
};
