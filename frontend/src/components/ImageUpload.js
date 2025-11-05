import { notify } from "/src/utils/ui/notification.js";

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
        ${
          preview
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

export function initImageUpload(inputId, previewId, options = {}) {
  const {
    maxSize = 5,
    shape = "rounded-full",
    onImageSelect = null,
    previewSize = "24",
  } = options;

  $(`#${inputId}`).on("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > maxSize * 1024 * 1024) {
      notify.warning(`Image size must be less than ${maxSize}MB`);
      e.target.value = "";
      return;
    }

    if (!file.type.startsWith("image/")) {
      notify.warning("Please select a valid image file");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      if (previewId) {
        $(`#${previewId}`).html(
          `<img src="${event.target.result}" class="h-${previewSize} w-${previewSize} ${shape} object-cover" />`
        );
      }

      if (onImageSelect) {
        onImageSelect(event.target.result, file);
      }
    };
    reader.onerror = function () {
      notify.error("Failed to read image file");
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  });
}

export function getImageFile(inputId) {
  const fileInput = document.getElementById(inputId);
  return fileInput && fileInput.files.length > 0 ? fileInput.files[0] : null;
}

export async function getImageDataURL(inputId) {
  const file = getImageFile(inputId);
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

export function clearImageUpload(inputId, previewId, defaultPreview = null) {
  const fileInput = document.getElementById(inputId);
  if (fileInput) {
    fileInput.value = "";
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
