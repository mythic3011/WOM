import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPEG, JPG, PNG, and WebP images are allowed."),
      false
    );
  }
};

const limits = {
  fileSize: 5 * 1024 * 1024,
};

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits,
}).single("image");

export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits,
}).array("images", 5);

export const uploadFields = multer({
  storage,
  fileFilter,
  limits,
}).fields([
  { name: "profileImage", maxCount: 1 },
  { name: "performanceImage", maxCount: 1 },
  { name: "venueImage", maxCount: 1 },
]);

export default {
  uploadSingle,
  uploadMultiple,
  uploadFields,
};
