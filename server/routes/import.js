import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Extract content from external blog URL
router.post('/extract', [
  body('url').isURL().withMessage('Valid URL is required'),
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

    const { url } = req.body;

    // Fetch the webpage
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    const $ = cheerio.load(response.data);
    
    // Extract content using various selectors
    const extractedContent = {
      title: extractTitle($),
      content: extractContent($),
      excerpt: extractExcerpt($),
      featured_image: extractFeaturedImage($, url),
      author: extractAuthor($),
      published_at: extractPublishedDate($),
      tags: extractTags($),
    };

    // Clean up content
    extractedContent.content = cleanContent(extractedContent.content);
    extractedContent.excerpt = extractedContent.excerpt || generateExcerpt(extractedContent.content);

    if (!extractedContent.title) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract title from the provided URL',
      });
    }

    if (!extractedContent.content) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract content from the provided URL',
      });
    }

    res.json({
      success: true,
      message: 'Content extracted successfully',
      data: extractedContent,
    });

  } catch (error) {
    console.error('Content extraction error:', error);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(400).json({
        success: false,
        message: 'Unable to access the provided URL',
      });
    }

    if (error.response && error.response.status === 404) {
      return res.status(400).json({
        success: false,
        message: 'The provided URL was not found',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to extract content from the provided URL',
    });
  }
});

// Helper functions
function extractTitle($) {
  return (
    $('h1').first().text().trim() ||
    $('title').text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    ''
  );
}

function extractContent($) {
  const contentSelectors = [
    'article',
    '[role="main"]',
    '.post-content',
    '.entry-content',
    '.content',
    '.post-body',
    '.article-content',
    'main',
  ];

  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > 200) {
      return element.html();
    }
  }

  // Fallback: look for the largest text block
  let largestContent = '';
  $('div, section, article').each((i, el) => {
    const text = $(el).text().trim();
    if (text.length > largestContent.length && text.length > 200) {
      largestContent = $(el).html();
    }
  });

  return largestContent;
}

function extractExcerpt($) {
  return (
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    $('.excerpt').text().trim() ||
    $('.summary').text().trim() ||
    ''
  );
}

function extractFeaturedImage($, baseUrl) {
  const imageUrl = (
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('article img').first().attr('src') ||
    $('.featured-image img').attr('src') ||
    $('img').first().attr('src')
  );

  if (!imageUrl) return null;

  // Convert relative URLs to absolute
  try {
    return new URL(imageUrl, baseUrl).href;
  } catch {
    return imageUrl.startsWith('http') ? imageUrl : null;
  }
}

function extractAuthor($) {
  return (
    $('meta[name="author"]').attr('content') ||
    $('meta[property="article:author"]').attr('content') ||
    $('.author').text().trim() ||
    $('.byline').text().trim() ||
    $('[rel="author"]').text().trim() ||
    null
  );
}

function extractPublishedDate($) {
  const dateString = (
    $('meta[property="article:published_time"]').attr('content') ||
    $('meta[name="date"]').attr('content') ||
    $('time[datetime]').attr('datetime') ||
    $('.date').text().trim() ||
    $('.published').text().trim()
  );

  if (!dateString) return null;

  try {
    return new Date(dateString).toISOString();
  } catch {
    return null;
  }
}

function extractTags($) {
  const tags = [];
  
  $('meta[property="article:tag"]').each((i, el) => {
    const tag = $(el).attr('content');
    if (tag) tags.push(tag.trim());
  });

  if (tags.length === 0) {
    $('.tags a, .tag, .category').each((i, el) => {
      const tag = $(el).text().trim();
      if (tag && !tags.includes(tag)) {
        tags.push(tag);
      }
    });
  }

  return tags;
}

function cleanContent(content) {
  if (!content) return '';

  const $ = cheerio.load(content);

  // Remove unwanted elements
  $('script, style, nav, header, footer, aside, .ads, .advertisement, .social-share').remove();

  // Clean up attributes
  $('*').each((i, el) => {
    const $el = $(el);
    const allowedAttrs = ['href', 'src', 'alt', 'title'];
    
    Object.keys(el.attribs || {}).forEach(attr => {
      if (!allowedAttrs.includes(attr)) {
        $el.removeAttr(attr);
      }
    });
  });

  return $.html();
}

function generateExcerpt(content, maxLength = 200) {
  if (!content) return '';

  const $ = cheerio.load(content);
  const text = $.text().trim();
  
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
}

export default router;