import express from 'express';

const router = express.Router();

// Mock users data
const users = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    avatar: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    last_login: '2024-01-16T10:30:00Z',
    post_count: 45,
    status: 'active',
  },
  {
    id: '2',
    name: 'Editor User',
    email: 'editor@example.com',
    role: 'editor',
    avatar: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-15T14:20:00Z',
    last_login: '2024-01-15T14:20:00Z',
    post_count: 23,
    status: 'active',
  },
];

// Get all users
router.get('/', (req, res) => {
  try {
    // Remove password fields
    const sanitizedUsers = users.map(({ password, ...user }) => user);

    res.json({
      success: true,
      data: sanitizedUsers,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;