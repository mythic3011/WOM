/**
 * Manual test cases for ImageUpload component
 *
 * To test manually:
 * 1. Open any page that uses image upload (e.g., User Profile, Venue Form)
 * 2. Test the following scenarios:
 */

/**
 * Test Case 1: Valid Image Upload
 * - Select a valid image file (PNG, JPG, GIF) under 5MB
 * - Expected: Preview should update with the selected image
 * - Expected: No error messages should appear
 */

/**
 * Test Case 2: File Size Validation
 * - Select an image file larger than 5MB
 * - Expected: Error notification "File size must be less than 5MB"
 * - Expected: Input should be cleared
 * - Expected: Preview should not change
 */

/**
 * Test Case 3: File Type Validation
 * - Select a non-image file (e.g., PDF, TXT)
 * - Expected: Error notification about file type not allowed
 * - Expected: Input should be cleared
 * - Expected: Preview should not change
 */

/**
 * Test Case 4: Clear Image Upload
 * - Select a valid image
 * - Call clearImageUpload() function
 * - Expected: Input should be cleared
 * - Expected: Preview should reset to default
 */

/**
 * Test Case 5: Get Image File
 * - Select a valid image
 * - Call getImageFile() function
 * - Expected: Should return the File object
 * - Without selecting: Should return null
 */

/**
 * Test Case 6: Get Image Data URL
 * - Select a valid image
 * - Call getImageDataURL() function
 * - Expected: Should return a data URL string starting with "data:image/"
 * - Without selecting: Should return null
 */

/**
 * Test Case 7: Auto-Upload (if endpoint provided)
 * - Configure initImageUpload with uploadEndpoint option
 * - Select a valid image
 * - Expected: File should be uploaded automatically
 * - Expected: Progress should be logged to console
 * - Expected: Success notification should appear
 */

/**
 * Test Case 8: Upload Progress Callback
 * - Configure initImageUpload with onUploadProgress callback
 * - Select a valid image
 * - Expected: Progress callback should be called with percent, loaded, total
 */

/**
 * Test Case 9: Upload Complete Callback
 * - Configure initImageUpload with onUploadComplete callback
 * - Select a valid image and complete upload
 * - Expected: Callback should be called with server response
 */

/**
 * Test Case 10: Image Select Callback
 * - Configure initImageUpload with onImageSelect callback
 * - Select a valid image
 * - Expected: Callback should be called with dataURL and file object
 */

// Example usage for testing:
/*
import { initImageUpload, getImageFile, getImageDataURL, clearImageUpload } from '@components/ImageUpload.js';

// Basic usage
initImageUpload('myImageInput', 'myImagePreview', {
  maxSize: 5,
  shape: 'rounded-lg',
  previewSize: '32'
});

// With auto-upload
initImageUpload('myImageInput', 'myImagePreview', {
  maxSize: 5,
  uploadEndpoint: '/api/upload/image',
  onUploadProgress: (percent, loaded, total) => {
    console.log(`Upload: ${percent.toFixed(2)}%`);
  },
  onUploadComplete: (response) => {
    console.log('Upload complete:', response);
  }
});

// Get file
const file = getImageFile('myImageInput');
console.log('Selected file:', file);

// Get data URL
const dataURL = await getImageDataURL('myImageInput');
console.log('Data URL:', dataURL);

// Clear upload
clearImageUpload('myImageInput', 'myImagePreview');
*/
