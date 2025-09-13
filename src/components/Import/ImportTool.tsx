import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ExternalLink, Download, Eye, Save, Loader, AlertCircle } from 'lucide-react';
import { ExternalBlogContent } from '../../types';

export function ImportTool() {
  const [url, setUrl] = useState('');
  const [extractedContent, setExtractedContent] = useState<ExternalBlogContent | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const extractContentMutation = useMutation({
    mutationFn: async (blogUrl: string): Promise<ExternalBlogContent> => {
      const response = await fetch('/api/import/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: blogUrl }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to extract content');
      }
      
      const result = await response.json();
      return result.data;
    },
    onSuccess: (data) => {
      setExtractedContent(data);
      setIsPreviewMode(true);
    },
  });

  const savePostMutation = useMutation({
    mutationFn: async (content: ExternalBlogContent) => {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: content.title,
          content: content.content,
          excerpt: content.excerpt,
          featured_image: content.featured_image,
          status: 'draft',
          imported_from: url,
        }),
      });
      
      return response.json();
    },
    onSuccess: () => {
      setUrl('');
      setExtractedContent(null);
      setIsPreviewMode(false);
    },
  });

  const handleExtract = () => {
    if (!url.trim()) return;
    extractContentMutation.mutate(url);
  };

  const handleSave = () => {
    if (!extractedContent) return;
    savePostMutation.mutate(extractedContent);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Import External Content</h1>
      </div>

      {!isPreviewMode ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <ExternalLink className="w-5 h-5 mr-2" />
              Extract Content from URL
            </h2>
            
            <p className="text-gray-600 mb-6">
              Enter a URL from popular blog platforms (Medium, WordPress, Dev.to, etc.) to automatically extract the content, images, and metadata.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blog Post URL
                </label>
                <div className="flex space-x-3">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/blog-post"
                    className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleExtract}
                    disabled={!url.trim() || extractContentMutation.isPending}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {extractContentMutation.isPending ? (
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Extract Content
                  </button>
                </div>
              </div>

              {extractContentMutation.error && (
                <div className="flex items-center p-4 text-sm text-red-800 bg-red-50 rounded-lg">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span>
                    {extractContentMutation.error.message}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Supported Platforms</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  'Medium',
                  'WordPress',
                  'Dev.to',
                  'Hashnode',
                  'Substack',
                  'Ghost',
                  'Blogger',
                  'Other blogs',
                ].map((platform) => (
                  <div
                    key={platform}
                    className="flex items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm text-gray-700">{platform}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Content Preview</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsPreviewMode(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Back to Import
              </button>
              <button
                onClick={handleSave}
                disabled={savePostMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {savePostMutation.isPending ? (
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save as Draft
              </button>
            </div>
          </div>

          {extractedContent && (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {extractedContent.featured_image && (
                <div className="aspect-video w-full">
                  <img
                    src={extractedContent.featured_image}
                    alt={extractedContent.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="p-8">
                <div className="max-w-4xl">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {extractedContent.title}
                  </h1>
                  
                  {extractedContent.author && (
                    <div className="flex items-center text-sm text-gray-600 mb-4">
                      <span>By {extractedContent.author}</span>
                      {extractedContent.published_at && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{new Date(extractedContent.published_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  {extractedContent.excerpt && (
                    <div className="text-lg text-gray-600 mb-8 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                      {extractedContent.excerpt}
                    </div>
                  )}
                  
                  <div 
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: extractedContent.content }}
                  />
                  
                  {extractedContent.tags && extractedContent.tags.length > 0 && (
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        {extractedContent.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}