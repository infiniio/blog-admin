import express from 'express';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Mock tags data
let tags = [
  {
    id: '1',
    name: 'JavaScript',
    slug: 'javascript',
    color: '#f7df1e',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Frontend',
    slug: 'frontend',
    color: '#42b883',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Backend',
    slug: 'backend',
    color: '#ff6b6b',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'CSS',
    slug: 'css',
    color: '#1572b6',
    created_at: '2024-01-01T00:00:00Z',
  },
];

// Get all tags
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Create tag
router.post('/', [
  body('name').trim().isLength({ min: 1, max: 50 }),
  body('slug').trim().isLength({ min: 1, max: 50 }),
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

    const { name, slug, color } = req.body;

    // Check if slug already exists
    if (tags.some(t => t.slug === slug)) {
      return res.status(400).json({
        success: false,
        message: 'Slug already exists',
      });
    }

    const newTag = {
      id: String(tags.length + 1),
      name,
      slug,
      color,
      created_at: new Date().toISOString(),
    };

    tags.push(newTag);

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: newTag,
    });

  } catch (error) {
    console.error('Create tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;