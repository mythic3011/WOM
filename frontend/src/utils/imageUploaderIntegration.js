import { ImageUploader } from "@components/common/ImageUploader.js";

export const ImageUploaderIntegration = {
  performanceImageData: null,
  venueImageData: null,

  initPerformanceImageUploader(existingImageUrl = null) {
    const html = ImageUploader.render({
      id: "performance-image",
      label: "Performance Poster",
      previewUrl: existingImageUrl,
      maxSizeMB: 10,
      height: "280px",
      helpText: "PNG, JPG, GIF or WebP. Max 10MB - Recommended size 800x600px",
      dragDropText: "Drag and drop the performance poster here, or click to select",
      showUrlInput: true,
    });

    setTimeout(() => {
      ImageUploader.initialize("performance-image-uploader", {
        maxSize: 10 * 1024 * 1024,
        maxSizeMB: 10,
        onUpload: async (file, dataUrl) => {
          this.performanceImageData = {
            file,
            dataUrl,
            name: file.name,
            size: file.size,
            type: file.type,
          };
          console.log("Performance poster uploaded:", file.name);
        },
        onRemove: async () => {
          this.performanceImageData = null;
          console.log("Performance poster removed");
        },
        validateFile: (file) => {
          if (file.size < 50 * 1024) {
            alert("Image is too small. Please upload a higher quality image (at least 50KB).");
            return false;
          }
          return true;
        },
      });
    }, 100);

    return html;
  },

  initVenueImageUploader(existingImageUrl = null) {
    const html = ImageUploader.render({
      id: "venue-image",
      label: "Venue Image",
      previewUrl: existingImageUrl,
      maxSizeMB: 8,
      height: "250px",
      helpText: "PNG, JPG, GIF or WebP. Max 8MB - Recommended size 1200x800px",
      dragDropText: "Drag and drop the venue image here, or click to select",
      showUrlInput: true,
    });

    setTimeout(() => {
      ImageUploader.initialize("venue-image-uploader", {
        maxSize: 8 * 1024 * 1024,
        maxSizeMB: 8,
        onUpload: async (file, dataUrl) => {
          this.venueImageData = {
            file,
            dataUrl,
            name: file.name,
            size: file.size,
            type: file.type,
          };
          console.log("Venue image uploaded:", file.name);
        },
        onRemove: async () => {
          this.venueImageData = null;
          console.log("Venue image removed");
        },
      });
    }, 100);

    return html;
  },

  getPerformanceImage() {
    return this.performanceImageData?.dataUrl || null;
  },

  getPerformanceImageFile() {
    return this.performanceImageData?.file || null;
  },

  getVenueImage() {
    return this.venueImageData?.dataUrl || null;
  },

  getVenueImageFile() {
    return this.venueImageData?.file || null;
  },

  resetPerformanceImage() {
    this.performanceImageData = null;
  },

  resetVenueImage() {
    this.venueImageData = null;
  },

  resetAll() {
    this.performanceImageData = null;
    this.venueImageData = null;
  },
};
