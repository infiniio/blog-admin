import express from 'express';

const router = express.Router();

// Mock analytics data - In production, this would come from analytics service
const getAnalyticsData = () => {
  return {
    total_posts: 125,
    published_posts: 98,
    draft_posts: 22,
    archived_posts: 5,
    total_views: 45670,
    total_likes: 3245,
    monthly_views: [
      { month: 'Jan', views: 3200 },
      { month: 'Feb', views: 4100 },
      { month: 'Mar', views: 3800 },
      { month: 'Apr', views: 5200 },
      { month: 'May', views: 6100 },
      { month: 'Jun', views: 5800 },
    ],
    popular_posts: [
      { title: 'Getting Started with React 18', views: 1250, slug: 'getting-started-react-18' },
      { title: 'Building Scalable APIs with Node.js', views: 890, slug: 'building-scalable-apis-nodejs' },
      { title: 'Advanced TypeScript Patterns', views: 745, slug: 'advanced-typescript-patterns' },
      { title: 'CSS Grid vs Flexbox', views: 682, slug: 'css-grid-vs-flexbox' },
      { title: 'Modern JavaScript Features', views: 567, slug: 'modern-javascript-features' },
    ],
    recent_activity: [
      {
        type: 'post_published',
        title: 'Getting Started with React 18',
        timestamp: '2024-01-16T10:30:00Z',
        author: 'Admin User',
      },
      {
        type: 'post_created',
        title: 'Modern CSS Grid Layouts',
        timestamp: '2024-01-16T09:15:00Z',
        author: 'Admin User',
      },
      {
        type: 'post_updated',
        title: 'Building Scalable APIs with Node.js',
        timestamp: '2024-01-15T16:45:00Z',
        author: 'Admin User',
      },
      {
        type: 'post_published',
        title: 'JavaScript ES2024 Features',
        timestamp: '2024-01-15T14:20:00Z',
        author: 'Admin User',
      },
      {
        type: 'post_created',
        title: 'Web Performance Optimization',
        timestamp: '2024-01-14T11:30:00Z',
        author: 'Admin User',
      },
    ],
    top_categories: [
      { name: 'React', post_count: 32, color: '#61dafb' },
      { name: 'Node.js', post_count: 28, color: '#68a063' },
      { name: 'JavaScript', post_count: 45, color: '#f7df1e' },
      { name: 'CSS', post_count: 23, color: '#1572b6' },
      { name: 'TypeScript', post_count: 18, color: '#3178c6' },
    ],
    engagement_stats: {
      avg_views_per_post: 463,
      avg_likes_per_post: 33,
      bounce_rate: 0.34,
      avg_session_duration: '3m 45s',
    },
  };
};

// Get analytics dashboard data
router.get('/', (req, res) => {
  try {
    const analyticsData = getAnalyticsData();

    res.json({
      success: true,
      data: analyticsData,
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Get detailed post analytics
router.get('/posts/:id', (req, res) => {
  try {
    const postAnalytics = {
      post_id: req.params.id,
      views: 1250,
      likes: 85,
      shares: 23,
      comments: 12,
      daily_views: [
        { date: '2024-01-10', views: 45 },
        { date: '2024-01-11', views: 62 },
        { date: '2024-01-12', views: 78 },
        { date: '2024-01-13', views: 89 },
        { date: '2024-01-14', views: 95 },
        { date: '2024-01-15', views: 112 },
        { date: '2024-01-16', views: 134 },
      ],
      referrers: [
        { source: 'Google Search', visitors: 456, percentage: 36.5 },
        { source: 'Direct', visitors: 312, percentage: 25.0 },
        { source: 'Social Media', visitors: 234, percentage: 18.7 },
        { source: 'Other Blogs', visitors: 156, percentage: 12.5 },
        { source: 'Email', visitors: 92, percentage: 7.3 },
      ],
      countries: [
        { country: 'United States', visitors: 445 },
        { country: 'United Kingdom', visitors: 234 },
        { country: 'Canada', visitors: 123 },
        { country: 'Germany', visitors: 98 },
        { country: 'France', visitors: 87 },
      ],
    };

    res.json({
      success: true,
      data: postAnalytics,
    });

  } catch (error) {
    console.error('Get post analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;