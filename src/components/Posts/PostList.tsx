import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  Tag,
  User,
  CheckCircle,
  Clock,
  Archive,
  Heart
} from 'lucide-react';
import { BlogPost, PaginatedResponse } from '../../types';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';

export function PostList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPosts, setSelectedPosts] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { apiFetch } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['posts', page, search, statusFilter],
    queryFn: async (): Promise<PaginatedResponse<BlogPost>> => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        search,
        status: statusFilter,
      });

      const response = await apiFetch(`/api/posts?${params}`);
      const result = await response.json();
      return result.data;
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await apiFetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ postIds, action }: { postIds: string[]; action: string }) => {
      const response = await apiFetch('/api/posts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_ids: postIds, action }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setSelectedPosts([]);
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'draft':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'archived':
        return <Archive className="w-4 h-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const handleSelectAll = () => {
    if (selectedPosts.length === (data?.data.length || 0)) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(data?.data.map(post => post.id) || []);
    }
  };

  const handleSelectPost = (postId: string) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
        <Link
          to="/posts/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search posts..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {selectedPosts.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedPosts.length} post{selectedPosts.length !== 1 ? 's' : ''} selected
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => bulkUpdateMutation.mutate({ postIds: selectedPosts, action: 'publish' })}
                  className="text-sm text-blue-700 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-100"
                >
                  Publish
                </button>
                <button
                  onClick={() => bulkUpdateMutation.mutate({ postIds: selectedPosts, action: 'draft' })}
                  className="text-sm text-blue-700 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-100"
                >
                  Move to Draft
                </button>
                <button
                  onClick={() => bulkUpdateMutation.mutate({ postIds: selectedPosts, action: 'archive' })}
                  className="text-sm text-blue-700 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-100"
                >
                  Archive
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Posts Table */}
      <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={selectedPosts.length === (data?.data.length || 0) && data?.data.length! > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={selectedPosts.includes(post.id)}
                      onChange={() => handleSelectPost(post.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {post.featured_image && (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-12 h-12 rounded-lg object-cover mr-4"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-2">
                          {post.title}
                        </div>
                        <div className="text-sm text-gray-500 line-clamp-1">
                          {post.excerpt}
                        </div>
                        <div className="flex items-center mt-1 space-x-2">
                          {post.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag.name}
                            </span>
                          ))}
                          {post.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{post.tags.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {getStatusIcon(post.status)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">{post.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{post.author.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {post.category && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {post.category.name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {post.view_count}
                      </div>
                      <div className="flex items-center">
                        <Heart className="w-4 h-4 mr-1" />
                        {post.like_count}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {format(new Date(post.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(post.created_at), 'h:mm a')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative group">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <div className="py-2">
                          <Link
                            to={`/posts/${post.id}/edit`}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="mr-3 h-4 w-4" />
                            Edit
                          </Link>
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="mr-3 h-4 w-4" />
                            View
                          </a>
                          <button
                            onClick={() => deletePostMutation.mutate(post.id)}
                            className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="mr-3 h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * data.per_page + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * data.per_page, data.total)}
                  </span>{' '}
                  of <span className="font-medium">{data.total}</span> results
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === data.total_pages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}