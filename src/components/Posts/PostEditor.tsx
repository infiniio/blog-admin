import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Save, 
  Eye, 
  Calendar, 
  Tag, 
  Image as ImageIcon, 
  Settings, 
  ArrowLeft,
  Upload,
  X
} from 'lucide-react';
import { RichTextEditor } from './RichTextEditor';
import { ImageUpload } from '../UI/ImageUpload';
import { BlogPost, Category, Tag as TagType } from '../../types';
import { useAuth } from '../../hooks/useAuth';

const postSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().min(1, 'Excerpt is required'),
  content: z.string().min(1, 'Content is required'),
  status: z.enum(['draft', 'published', 'archived']),
  featured_image: z.string().optional(),
  category_id: z.string().optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.string().optional(),
  scheduled_at: z.string().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

export function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showSEO, setShowSEO] = useState(false);
  const [showScheduling, setShowScheduling] = useState(false);
  const { apiFetch } = useAuth();

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async (): Promise<BlogPost> => {
      const response = await apiFetch(`/api/posts/${id}`);
      const result = await response.json();
      return result.data;
    },
    enabled: !!id,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async (): Promise<Category[]> => {
      const response = await apiFetch('/api/categories');
      const result = await response.json();
      return result.data;
    },
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: async (): Promise<TagType[]> => {
      const response = await apiFetch('/api/tags');
      const result = await response.json();
      return result.data;
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      status: 'draft',
    },
  });

  const title = watch('title');
  const content = watch('content');

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !id) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      setValue('slug', slug);
    }
  }, [title, setValue, id]);

  useEffect(() => {
    if (post) {
      reset({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        status: post.status,
        featured_image: post.featured_image,
        category_id: post.category_id,
        seo_title: post.seo_title,
        seo_description: post.seo_description,
        seo_keywords: post.seo_keywords,
        scheduled_at: post.scheduled_at,
      });
      setSelectedTags(post.tags.map(tag => tag.id));
    }
  }, [post, reset]);

  const savePostMutation = useMutation({
    mutationFn: async (data: PostFormData & { tag_ids: string[] }) => {
      const url = id ? `/api/posts/${id}` : '/api/posts';
      const method = id ? 'PUT' : 'POST';
      
      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      if (!id) {
        navigate(`/posts/${result.data.id}/edit`);
      }
    },
  });

  const onSubmit = (data: PostFormData) => {
    savePostMutation.mutate({
      ...data,
      tag_ids: selectedTags,
    });
  };

  const handleImageUpload = (url: string) => {
    setValue('featured_image', url);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  if (id && isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/posts')}
            className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {id ? 'Edit Post' : 'New Post'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </button>
          <button
            onClick={handleSubmit((data) => onSubmit({ ...data, status: 'draft' }))}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            disabled={savePostMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Draft
          </button>
          <button
            onClick={handleSubmit((data) => onSubmit({ ...data, status: 'published' }))}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            disabled={savePostMutation.isPending}
          >
            Publish
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="space-y-4">
                <div>
                  <input
                    {...register('title')}
                    placeholder="Enter post title..."
                    className="w-full text-3xl font-bold border-none outline-none resize-none placeholder-gray-400"
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <input
                    {...register('slug')}
                    placeholder="post-slug"
                    className="w-full text-sm text-gray-600 border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.slug && (
                    <p className="text-sm text-red-600 mt-1">{errors.slug.message}</p>
                  )}
                </div>

                <div>
                  <textarea
                    {...register('excerpt')}
                    placeholder="Write a compelling excerpt..."
                    rows={3}
                    className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  {errors.excerpt && (
                    <p className="text-sm text-red-600 mt-1">{errors.excerpt.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Content</h3>
              </div>
              <div className="p-6">
                <RichTextEditor
                  content={content}
                  onChange={(newContent) => setValue('content', newContent)}
                />
                {errors.content && (
                  <p className="text-sm text-red-600 mt-2">{errors.content.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Featured Image */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Featured Image
              </h3>
              <ImageUpload
                onUpload={handleImageUpload}
                currentImage={watch('featured_image')}
                onRemove={() => setValue('featured_image', '')}
              />
            </div>

            {/* Post Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    {...register('status')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    {...register('category_id')}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedTags.map((tagId) => {
                      const tag = tags.find(t => t.id === tagId);
                      return tag ? (
                        <span
                          key={tagId}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag.name}
                          <button
                            type="button"
                            onClick={() => toggleTag(tagId)}
                            className="ml-1 hover:text-blue-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                  <div className="border border-gray-200 rounded-md max-h-32 overflow-y-auto">
                    {tags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center p-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag.id)}
                          onChange={() => toggleTag(tag.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                </div> */}
              </div>
            </div>

            {/* SEO Settings */}
            {/* <div className="bg-white rounded-lg shadow-sm border">
              <button
                type="button"
                onClick={() => setShowSEO(!showSEO)}
                className="w-full p-4 text-left border-b border-gray-200 hover:bg-gray-50 flex items-center justify-between"
              >
                <span className="text-lg font-medium text-gray-900 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  SEO Settings
                </span>
                <span className="text-gray-400">
                  {showSEO ? '−' : '+'}
                </span>
              </button>
              {showSEO && (
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SEO Title
                    </label>
                    <input
                      {...register('seo_title')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Override default title for search engines"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meta Description
                    </label>
                    <textarea
                      {...register('seo_description')}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description for search results"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Keywords
                    </label>
                    <input
                      {...register('seo_keywords')}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Comma-separated keywords"
                    />
                  </div>
                </div>
              )}
            </div> */}

            {/* Scheduling */}
            {/* <div className="bg-white rounded-lg shadow-sm border">
              <button
                type="button"
                onClick={() => setShowScheduling(!showScheduling)}
                className="w-full p-4 text-left border-b border-gray-200 hover:bg-gray-50 flex items-center justify-between"
              >
                <span className="text-lg font-medium text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Schedule
                </span>
                <span className="text-gray-400">
                  {showScheduling ? '−' : '+'}
                </span>
              </button>
              {showScheduling && (
                <div className="p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Publish Date & Time
                  </label>
                  <input
                    {...register('scheduled_at')}
                    type="datetime-local"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div> */}
          </div>
        </div>
      </form>
    </div>
  );
}