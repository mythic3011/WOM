
import { fileHandler } from "@utils/core/fileHandler.js";
import { notify } from "@utils/ui/notification.js";

export function createImageUpload({
  id = "imageUpload",
  label = "Upload Image",
  preview = true,
  previewSize = "24",
  accept = "image/*",
  maxSize = 5,
  required = false,
  defaultImage = null,
  helpText = "PNG, JPG, GIF up to 5MB",
  shape = "rounded-full",
}) {
  const previewId = `${id}Preview`;
  const inputId = `${id}Input`;

  const defaultPreview = defaultImage
    ? `<img src="${defaultImage}" class="h-${previewSize} w-${previewSize} ${shape} object-cover" />`
    : `<div class="h-${previewSize} w-${previewSize} ${shape} bg-gray-200 flex items-center justify-center overflow-hidden">
        <i class="fas fa-user text-4xl text-gray-400"></i>
      </div>`;

  return `
    <div class="image-upload-container">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        ${label}${required ? ' <span class="text-red-500">*</span>' : ""}
      </label>
      <div class="flex items-center space-x-4">
        ${preview
      ? `
          <div id="${previewId}" class="flex-shrink-0">
            ${defaultPreview}
          </div>
        `
      : ""
    }
        <div class="flex-1">
          <input
            type="file"
            id="${inputId}"
            accept="${accept}"
            ${required ? "required" : ""}
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          />
          <p class="mt-1 text-xs text-gray-500">${helpText}</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize image upload with validation, preview, and optional auto-upload
 * @param {string} inputId - ID of the file input element
 * @param {string} previewId - ID of the preview container element
 * @param {Object} options - Configuration options
 * @param {number} options.maxSize - Maximum file size in MB (default: 5)
 * @param {string} options.shape - CSS class for preview shape (default: 'rounded-full')
 * @param {Function} options.onImageSelect - Callback when image is selected (dataURL, file)
 * @param {string} options.previewSize - Tailwind size class for preview (default: '24')
 * @param {string} options.uploadEndpoint - Optional API endpoint for auto-upload
 * @param {Function} options.onUploadComplete - Callback when upload completes (response)
 * @param {Function} options.onUploadProgress - Callback for upload progress (percent, loaded, total)
 * @param {Array<string>} options.allowedTypes - Allowed file types (default: ['image/*'])
 */
export function initImageUpload(inputId, previewId, options = {}) {
  const {
    maxSize = 5,
    shape = "rounded-full",
    onImageSelect = null,
    previewSize = "24",
    uploadEndpoint = null,
    onUploadComplete = null,
    onUploadProgress = null,
    allowedTypes = ["image/*"],
  } = options;

  $(`#${inputId}`).on("change", async function (e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate using centralized fileHandler
    if (!fileHandler.validateFile(file, { maxSize, allowedTypes })) {
      e.target.value = "";
      return;
    }

    try {
      // Read and preview using fileHandler
      const dataURL = await fileHandler.readAsDataURL(file);

      // Update preview if previewId provided
      if (previewId) {
        $(`#${previewId}`).html(
          `<img src="${dataURL}" class="h-${previewSize} w-${previewSize} ${shape} object-cover" />`
        );
      }

      // Callback with data
      if (onImageSelect) {
        onImageSelect(dataURL, file);
      }

      // Optional: Auto-upload to server
      if (uploadEndpoint) {
        const result = await fileHandler.upload(file, uploadEndpoint, {
          maxSize,
          allowedTypes,
          onProgress: onUploadProgress || ((percent, loaded, total) => {
            console.log(`Upload progress: ${percent.toFixed(2)}%`);
          }),
        });

        if (result.success) {
          notify.success("Image uploaded successfully");
          if (onUploadComplete) {
            onUploadComplete(result.data);
          }
        } else {
          notify.error(`Upload failed: ${result.error}`);
        }
      }
    } catch (error) {
      notify.error("Failed to process image");
      console.error("Image upload error:", error);
      e.target.value = "";
    }
  });
}

/**
 * Get the selected image file from input
 * @param {string} inputId - ID of the file input element
 * @returns {File|null} Selected file or null if none selected
 */
export function getImageFile(inputId) {
  const $fileInput = $(`#${inputId}`);
  if ($fileInput.length && $fileInput[0].files.length > 0) {
    return $fileInput[0].files[0];
  }
  return null;
}

/**
 * Get the selected image as a data URL
 * @param {string} inputId - ID of the file input element
 * @returns {Promise<string|null>} Data URL of the image or null if none selected
 */
export async function getImageDataURL(inputId) {
  const file = getImageFile(inputId);
  if (!file) return null;

  try {
    return await fileHandler.readAsDataURL(file);
  } catch (error) {
    console.error("Failed to read image as data URL:", error);
    notify.error("Failed to read image file");
    return null;
  }
}

/**
 * Clear the image upload input and reset preview
 * @param {string} inputId - ID of the file input element
 * @param {string} previewId - ID of the preview container element
 * @param {string} defaultPreview - Optional HTML for default preview
 */
export function clearImageUpload(inputId, previewId, defaultPreview = null) {
  const $fileInput = $(`#${inputId}`);
  if ($fileInput.length) {
    $fileInput.val("");
  }

  if (previewId) {
    const preview =
      defaultPreview ||
      `
      <div class="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
        <i class="fas fa-user text-4xl text-gray-400"></i>
      </div>
    `;
    $(`#${previewId}`).html(preview);
  }
}
