import express from 'express';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Mock categories data
let categories = [
  {
    id: '1',
    name: 'React',
    slug: 'react',
    description: 'All about React.js and related technologies',
    color: '#61dafb',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Node.js',
    slug: 'nodejs',
    description: 'Server-side JavaScript with Node.js',
    color: '#68a063',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'CSS',
    slug: 'css',
    description: 'Styling and layout techniques',
    color: '#1572b6',
    created_at: '2024-01-01T00:00:00Z',
  },
];

// Get all categories
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Create category
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('slug').trim().isLength({ min: 1, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('color').isHexColor(),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, slug, description, color } = req.body;

    // Check if slug already exists
    if (categories.some(c => c.slug === slug)) {
      return res.status(400).json({
        success: false,
        message: 'Slug already exists',
      });
    }

    const newCategory = {
      id: String(categories.length + 1),
      name,
      slug,
      description: description || null,
      color,
      created_at: new Date().toISOString(),
    };

    categories.push(newCategory);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory,
    });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;