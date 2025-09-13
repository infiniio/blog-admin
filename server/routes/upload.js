import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
    }
  },
});

// Upload single image
router.post('/image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const filepath = path.join(uploadsDir, filename);

    // Process image with Sharp
    const processedImage = await sharp(req.file.buffer)
      .resize(1200, 800, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toFile(filepath);

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: imageUrl,
        filename,
        width: processedImage.width,
        height: processedImage.height,
        size: processedImage.size,
        format: 'webp',
      },
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Upload failed',
    });
  }
});

// Upload multiple images
router.post('/images', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded',
      });
    }

    const uploadPromises = req.files.map(async (file) => {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
      const filepath = path.join(uploadsDir, filename);

      const processedImage = await sharp(file.buffer)
        .resize(1200, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toFile(filepath);

      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;

      return {
        url: imageUrl,
        filename,
        width: processedImage.width,
        height: processedImage.height,
        size: processedImage.size,
        format: 'webp',
      };
    });

    const uploadedImages = await Promise.all(uploadPromises);

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: uploadedImages,
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Upload failed',
    });
  }
});

// Delete image
router.delete('/image/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(uploadsDir, filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({
        success: true,
        message: 'Image deleted successfully',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Delete failed',
    });
  }
});

export default router;