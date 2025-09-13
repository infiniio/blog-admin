import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FileText, Eye, Heart, Users, TrendingUp, Clock, CheckCircle, Archive } from 'lucide-react';
import { AnalyticsData } from '../../types';
import { useAuth } from '../../hooks/useAuth';
export function Dashboard() {

  const { apiFetch } = useAuth();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async (): Promise<AnalyticsData> => {
      const response = await apiFetch('/api/analytics');
      const result = await response.json();
      return result.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Posts',
      value: analytics?.total_posts || 0,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Total Views',
      value: analytics?.total_views || 0,
      icon: Eye,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Total Likes',
      value: analytics?.total_likes || 0,
      icon: Heart,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      title: 'Published',
      value: analytics?.published_posts || 0,
      icon: CheckCircle,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 ${stat.bg} rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Views</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.monthly_views}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Posts</h3>
          <div className="space-y-4">
            {analytics?.popular_posts?.map((post, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{post.title}</h4>
                  <p className="text-xs text-gray-500">/{post.slug}</p>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Eye className="w-4 h-4 mr-1" />
                  {post.views.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {analytics?.recent_activity?.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.author}</span>{' '}
                    {activity.type === 'post_created' && 'created a new post'}
                    {activity.type === 'post_published' && 'published a post'}
                    {activity.type === 'post_updated' && 'updated a post'}
                    {' "'}
                    <span className="font-medium">{activity.title}</span>"
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}