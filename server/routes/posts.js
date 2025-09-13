import express from 'express';
import { body, query, validationResult } from 'express-validator';
import prisma from '../lib/prisma.js';

const router = express.Router();


// Get posts with pagination and filtering
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('per_page').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('status').optional().isIn(['all','draft', 'published', 'archived']),
  query('category_id').optional().isUUID(4),
  query('author_id').optional().isUUID(4),
], async(req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.per_page) || 10;
    const search = req.query.search || '';
    const status = req.query.status === 'all' ? '' : req.query.status || '';
    const categoryId = req.query.category_id || '';
    const authorId = req.query.author_id || '';

    const where = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (authorId) {
      where.authorId = authorId;
    }

     // Get total count
     const total = await prisma.post.count({ where });

     // Get posts with pagination
     const posts = await prisma.post.findMany({
       where,
       include: {
         author: {
           select: {
             id: true,
             name: true,
             email: true,
             role: true,
           },
         },
         category: true,
         tags: {
           include: {
             tag: true,
           },
         },
       },
       orderBy: { createdAt: 'desc' },
       skip: (page - 1) * perPage,
       take: perPage,
     });
 
     // Transform data to match frontend expectations
     const transformedPosts = posts.map(post => ({
       id: post.id,
       title: post.title,
       slug: post.slug,
       excerpt: post.excerpt,
       content: post.content,
       status: post.status.toLowerCase(),
       featured_image: post.featuredImage,
       seo_title: post.seoTitle,
       seo_description: post.seoDescription,
       seo_keywords: post.seoKeywords,
       scheduled_at: post.scheduledAt?.toISOString(),
       published_at: post.publishedAt?.toISOString(),
       created_at: post.createdAt.toISOString(),
       updated_at: post.updatedAt.toISOString(),
       author_id: post.authorId,
       author: {
         id: post.author.id,
         name: post.author.name,
         email: post.author.email,
         role: post.author.role.toLowerCase(),
       },
       category_id: post.categoryId,
       category: post.category ? {
         id: post.category.id,
         name: post.category.name,
         slug: post.category.slug,
         color: post.category.color,
       } : null,
       tags: post.tags.map(pt => ({
         id: pt.tag.id,
         name: pt.tag.name,
         slug: pt.tag.slug,
         color: pt.tag.color,
       })),
       view_count: post.viewCount,
       like_count: post.likeCount,
     }));
 
     const totalPages = Math.ceil(total / perPage);
 
     res.json({
       success: true,
       data: {
         data: transformedPosts,
         total,
         page,
         per_page: perPage,
         total_pages: totalPages,
       },
     });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    // Transform data to match frontend expectations
    const transformedPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      status: post.status.toLowerCase(),
      featured_image: post.featuredImage,
      seo_title: post.seoTitle,
      seo_description: post.seoDescription,
      seo_keywords: post.seoKeywords,
      scheduled_at: post.scheduledAt?.toISOString(),
      published_at: post.publishedAt?.toISOString(),
      created_at: post.createdAt.toISOString(),
      updated_at: post.updatedAt.toISOString(),
      author_id: post.authorId,
      author: {
        id: post.author.id,
        name: post.author.name,
        email: post.author.email,
        role: post.author.role.toLowerCase(),
      },
      category_id: post.categoryId,
      category: post.category ? {
        id: post.category.id,
        name: post.category.name,
        slug: post.category.slug,
        color: post.category.color,
      } : null,
      tags: post.tags.map(pt => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
        color: pt.tag.color,
      })),
      view_count: post.viewCount,
      like_count: post.likeCount,
    };

    res.json({
      success: true,
      data: transformedPost,
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Create post
router.post('/', [
  body('title').trim().isLength({ min: 1, max: 200 }),
  body('slug').trim().isLength({ min: 1, max: 200 }),
  body('excerpt').trim().isLength({ min: 1, max: 500 }),
  body('content').trim().isLength({ min: 1 }),
  body('status').isIn(['draft', 'published', 'archived']),
  body('featured_image').optional().isString(),
  body('category_id').optional(),
  body('tag_ids').optional().isArray(),
  body('seo_title').optional().trim().isLength({ max: 200 }),
  body('seo_description').optional().trim().isLength({ max: 300 }),
  body('seo_keywords').optional().trim().isLength({ max: 200 }),
  body('scheduled_at').optional().isISO8601(),
], async(req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const {
      title,
      slug,
      excerpt,
      content,
      status,
      featured_image,
      category_id,
      tag_ids = [],
      seo_title,
      seo_description,
      seo_keywords,
      scheduled_at,
    } = req.body;

    // Check if slug already exists
    const existingPost = await prisma.post.findUnique({
      where: { slug },
    });

    if (existingPost) {
      return res.status(400).json({
        success: false,
        message: 'Slug already exists',
      });
    }

    // Convert status to uppercase for database
    const dbStatus = status.toUpperCase();

    // Create post
    const newPost = await prisma.post.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        status: dbStatus,
        featuredImage: featured_image || null,
        seoTitle: seo_title || null,
        seoDescription: seo_description || null,
        seoKeywords: seo_keywords || null,
        scheduledAt: scheduled_at ? new Date(scheduled_at) : null,
        publishedAt: dbStatus === 'PUBLISHED' ? new Date() : null,
        authorId: req.user.id,
        categoryId: category_id || null,
        importedFrom:  null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Create tag relationships
    if (tag_ids && tag_ids.length > 0) {
      await prisma.postTag.createMany({
        data: tag_ids.map(tagId => ({
          postId: newPost.id,
          tagId,
        })),
      });
    }

    // Fetch the complete post with tags
    const completePost = await prisma.post.findUnique({
      where: { id: newPost.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Transform data to match frontend expectations
    const transformedPost = {
      id: completePost.id,
      title,
      slug,
      excerpt,
      content,
      status: status,
      featured_image: completePost.featuredImage,
      seo_title: completePost.seoTitle,
      seo_description: completePost.seoDescription,
      seo_keywords: completePost.seoKeywords,
      scheduled_at: completePost.scheduledAt?.toISOString(),
      published_at: completePost.publishedAt?.toISOString(),
      created_at: completePost.createdAt.toISOString(),
      updated_at: completePost.updatedAt.toISOString(),
      author_id: completePost.authorId,
      author: {
        id: completePost.author.id,
        name: completePost.author.name,
        email: completePost.author.email,
        role: completePost.author.role.toLowerCase(),
      },
      category_id: completePost.categoryId,
      category: completePost.category ? {
        id: completePost.category.id,
        name: completePost.category.name,
        slug: completePost.category.slug,
        color: completePost.category.color,
      } : null,
      tags: completePost.tags.map(pt => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
        color: pt.tag.color,
      })),
      view_count: completePost.viewCount,
      like_count: completePost.likeCount,
    };

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: transformedPost,
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Update post
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1, max: 200 }),
  body('slug').optional().trim().isLength({ min: 1, max: 200 }),
  body('excerpt').optional().trim().isLength({ min: 1, max: 500 }),
  body('content').optional().trim().isLength({ min: 1 }),
  body('status').optional().isIn(['draft', 'published', 'archived']),
  body('featured_image').optional().isString(),
  body('category_id').optional(),
  body('tag_ids').optional().isArray(),
], async(req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id: req.params.id },
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const updates = { ...req.body };

    // Check if slug already exists (excluding current post)
    if (updates.slug && updates.slug !== existingPost.slug) {
      const slugExists = await prisma.post.findFirst({
        where: {
          slug: updates.slug,
          id: { not: req.params.id },
        },
      });

      if (slugExists) {
        return res.status(400).json({
          success: false,
          message: 'Slug already exists',
        });
      }
    }

    // Prepare update data
    const updateData = {};
    
    if (updates.title) updateData.title = updates.title;
    if (updates.slug) updateData.slug = updates.slug;
    if (updates.excerpt) updateData.excerpt = updates.excerpt;
    if (updates.content) updateData.content = updates.content;
    if (updates.status) {
      updateData.status = updates.status.toUpperCase();
      // Update published_at if status changes to published
      if (updates.status === 'published' && existingPost.status !== 'PUBLISHED') {
        updateData.publishedAt = new Date();
      }
    }
    if (updates.featured_image !== undefined) updateData.featuredImage = updates.featured_image;
    if (updates.seo_title !== undefined) updateData.seoTitle = updates.seo_title;
    if (updates.seo_description !== undefined) updateData.seoDescription = updates.seo_description;
    if (updates.seo_keywords !== undefined) updateData.seoKeywords = updates.seo_keywords;
    if (updates.scheduled_at !== undefined) {
      updateData.scheduledAt = updates.scheduled_at ? new Date(updates.scheduled_at) : null;
    }
    if (updates.category_id !== undefined) updateData.categoryId = updates.category_id;

    // Update post
    const updatedPost = await prisma.post.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Update tag relationships if provided
    if (updates.tag_ids !== undefined) {
      // Delete existing relationships
      await prisma.postTag.deleteMany({
        where: { postId: req.params.id },
      });

      // Create new relationships
      if (updates.tag_ids.length > 0) {
        await prisma.postTag.createMany({
          data: updates.tag_ids.map(tagId => ({
            postId: req.params.id,
            tagId,
          })),
        });
      }
    }

    // Fetch the complete updated post
    const completePost = await prisma.post.findUnique({
      where: { id: req.params.id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Transform data to match frontend expectations
    const transformedPost = {
      id: completePost.id,
      title: completePost.title,
      slug: completePost.slug,
      excerpt: completePost.excerpt,
      content: completePost.content,
      status: completePost.status.toLowerCase(),
      featured_image: completePost.featuredImage,
      seo_title: completePost.seoTitle,
      seo_description: completePost.seoDescription,
      seo_keywords: completePost.seoKeywords,
      scheduled_at: completePost.scheduledAt?.toISOString(),
      published_at: completePost.publishedAt?.toISOString(),
      created_at: completePost.createdAt.toISOString(),
      updated_at: completePost.updatedAt.toISOString(),
      author_id: completePost.authorId,
      author: {
        id: completePost.author.id,
        name: completePost.author.name,
        email: completePost.author.email,
        role: completePost.author.role.toLowerCase(),
      },
      category_id: completePost.categoryId,
      category: completePost.category ? {
        id: completePost.category.id,
        name: completePost.category.name,
        slug: completePost.category.slug,
        color: completePost.category.color,
      } : null,
      tags: completePost.tags.map(pt => ({
        id: pt.tag.id,
        name: pt.tag.name,
        slug: pt.tag.slug,
        color: pt.tag.color,
      })),
      view_count: completePost.viewCount,
      like_count: completePost.likeCount,
    };

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: transformedPost,
    });

  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Delete post
router.delete('/:id', async (req, res) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: req.params.id },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    await prisma.post.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Bulk update posts
router.patch('/bulk', [
  body('post_ids').isArray().notEmpty(),
  body('action').isIn(['publish', 'draft', 'archive', 'delete']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { post_ids, action } = req.body;

    if (action === 'delete') {
      await prisma.post.deleteMany({
        where: {
          id: { in: post_ids },
        },
      });
    } else {
      const statusMap = {
        publish: 'PUBLISHED',
        draft: 'DRAFT',
        archive: 'ARCHIVED',
      };

      const newStatus = statusMap[action];
      const updateData = {
        status: newStatus,
      };

      // Set publishedAt for newly published posts
      if (newStatus === 'PUBLISHED') {
        updateData.publishedAt = new Date();
      }

      await prisma.post.updateMany({
        where: {
          id: { in: post_ids },
        },
        data: updateData,
      });
    }

    res.json({
      success: true,
      message: `Posts ${action}ed successfully`,
      data: { affected_count: post_ids.length },
    });

  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

export default router;