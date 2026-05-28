const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists inside backend/uploads
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Video File Filter (.mp4 only, max 50MB)
const videoFileFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only vertical MP4 (.mp4) videos are allowed for Reels.'), false);
  }
};

// Image File Filter (.png, .jpg, .jpeg, max 5MB)
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPG, and JPEG images are allowed.'), false);
  }
};

// Multer Upload Instances
const uploadVideo = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: videoFileFilter,
});

const uploadImage = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: imageFileFilter,
});

// Helper function to safely scrub failed upload files
const cleanFailedUpload = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      console.log(`🧼 Cleaned up temporary file: ${filePath}`);
    } catch (err) {
      console.error(`Failed to delete temporary file ${filePath}:`, err.message);
    }
  }
};

module.exports = {
  uploadVideo,
  uploadImage,
  cleanFailedUpload,
};
