export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'author';
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  featured_image?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  scheduled_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  author: User;
  category_id?: string;
  category?: Category;
  tags: Tag[];
  view_count: number;
  like_count: number;
}

export interface ExternalBlogContent {
  title: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  author?: string;
  published_at?: string;
  tags?: string[];
}

export interface UploadResponse {
  url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface AnalyticsData {
  total_posts: number;
  published_posts: number;
  draft_posts: number;
  total_views: number;
  total_likes: number;
  monthly_views: Array<{ month: string; views: number }>;
  popular_posts: Array<{ title: string; views: number; slug: string }>;
  recent_activity: Array<{
    type: 'post_created' | 'post_published' | 'post_updated';
    title: string;
    timestamp: string;
    author: string;
  }>;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}