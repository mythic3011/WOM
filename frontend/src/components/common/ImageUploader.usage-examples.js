import { ImageUploader } from "./ImageUploader.js";

export const ImageUploaderExamples = {
  profileImageExample() {
    const html = `
      <div class="max-w-md mx-auto p-6">
        ${ImageUploader.render({
          id: "profile-image",
          label: "Profile Image",
          maxSizeMB: 5,
          height: "200px",
          helpText: "JPG, PNG, GIF or WebP. Max 5MB.",
          dragDropText: "Drag and drop your profile picture here",
          showUrlInput: false,
        })}
      </div>
    `;

    let uploadedImageData = null;

    ImageUploader.initialize("profile-image-uploader", {
      maxSize: 5 * 1024 * 1024,
      maxSizeMB: 5,
      onUpload: async (file, dataUrl) => {
        uploadedImageData = dataUrl;
        console.log("Profile image uploaded:", file.name);
      },
      onRemove: async () => {
        uploadedImageData = null;
        console.log("Profile image removed");
      },
    });

    return { html, getImage: () => uploadedImageData };
  },

  performanceImageExample() {
    const html = `
      <div class="max-w-2xl mx-auto p-6">
        ${ImageUploader.render({
          id: "performance-poster",
          label: "Performance Poster",
          maxSizeMB: 10,
          height: "300px",
          helpText: "Upload a high-quality poster image. JPG, PNG, GIF or WebP. Max 10MB.",
          dragDropText: "Drag and drop the performance poster here",
          showUrlInput: true,
        })}
      </div>
    `;

    let performanceImageData = null;

    ImageUploader.initialize("performance-poster-uploader", {
      maxSize: 10 * 1024 * 1024,
      maxSizeMB: 10,
      onUpload: async (file, dataUrl) => {
        performanceImageData = {
          file,
          dataUrl,
          name: file.name,
          size: file.size,
          type: file.type,
        };
        console.log("Performance poster uploaded:", file.name);
      },
      onRemove: async () => {
        performanceImageData = null;
        console.log("Performance poster removed");
      },
      validateFile: (file) => {
        if (file.size < 100 * 1024) {
          alert("Image is too small. Please upload a higher quality image (at least 100KB).");
          return false;
        }
        return true;
      },
    });

    return { html, getImage: () => performanceImageData };
  },

  venueImageExample(existingImageUrl = null) {
    const html = `
      <div class="max-w-2xl mx-auto p-6">
        ${ImageUploader.render({
          id: "venue-image",
          label: "Venue Image",
          previewUrl: existingImageUrl,
          previewAlt: "Venue",
          maxSizeMB: 8,
          height: "250px",
          helpText: "Upload venue image. JPG, PNG, GIF or WebP. Max 8MB.",
          dragDropText: "Drag and drop the venue image here",
          showUrlInput: true,
        })}
      </div>
    `;

    let venueImageData = null;

    const uploader = ImageUploader.initialize("venue-image-uploader", {
      maxSize: 8 * 1024 * 1024,
      maxSizeMB: 8,
      onUpload: async (file, dataUrl) => {
        venueImageData = {
          file,
          dataUrl,
          name: file.name,
          size: file.size,
          type: file.type,
        };
        console.log("Venue image uploaded:", file.name);
      },
      onRemove: async () => {
        venueImageData = null;
        console.log("Venue image removed");
      },
    });

    return {
      html,
      getImage: () => venueImageData,
      reset: () => uploader.reset(),
    };
  },

  multipleImagesExample() {
    const html = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <div>
          ${ImageUploader.render({
            id: "image-1",
            label: "Main Image",
            maxSizeMB: 5,
            height: "200px",
            showUrlInput: false,
          })}
        </div>
        <div>
          ${ImageUploader.render({
            id: "image-2",
            label: "Secondary Image",
            maxSizeMB: 5,
            height: "200px",
            showUrlInput: false,
          })}
        </div>
      </div>
    `;

    const images = {
      main: null,
      secondary: null,
    };

    ImageUploader.initialize("image-1-uploader", {
      maxSize: 5 * 1024 * 1024,
      maxSizeMB: 5,
      onUpload: async (file, dataUrl) => {
        images.main = { file, dataUrl };
      },
      onRemove: async () => {
        images.main = null;
      },
    });

    ImageUploader.initialize("image-2-uploader", {
      maxSize: 5 * 1024 * 1024,
      maxSizeMB: 5,
      onUpload: async (file, dataUrl) => {
        images.secondary = { file, dataUrl };
      },
      onRemove: async () => {
        images.secondary = null;
      },
    });

    return { html, getImages: () => images };
  },

  formIntegrationExample() {
    const html = `
      <form id="performanceForm" class="max-w-2xl mx-auto p-6 space-y-6">
        <div>
          <label for="title" class="block text-sm font-semibold text-gray-700 mb-2">
            Performance Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        ${ImageUploader.render({
          id: "performance-image",
          label: "Performance Poster",
          maxSizeMB: 10,
          height: "250px",
          showUrlInput: true,
        })}

        <button
          type="submit"
          class="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Create Performance
        </button>
      </form>
    `;

    let imageData = null;

    ImageUploader.initialize("performance-image-uploader", {
      maxSize: 10 * 1024 * 1024,
      maxSizeMB: 10,
      onUpload: async (file, dataUrl) => {
        imageData = { file, dataUrl };
      },
      onRemove: async () => {
        imageData = null;
      },
    });

    const handleSubmit = async (e) => {
      e.preventDefault();

      const formData = new FormData();
      formData.append("title", document.getElementById("title").value);

      if (imageData) {
        formData.append("image", imageData.file);
      }

      try {
        const response = await fetch("/api/performances", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        console.log("Performance created:", result);
      } catch (error) {
        console.error("Error creating performance:", error);
      }
    };

    document.getElementById("performanceForm")?.addEventListener("submit", handleSubmit);

    return { html, getImage: () => imageData };
  },
};
