import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tags,
  Users,
  Settings,
  BarChart3,
  Upload,
  ExternalLink,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Posts', href: '/posts', icon: FileText },
  // { name: 'Categories', href: '/categories', icon: FolderOpen },
  // { name: 'Tags', href: '/tags', icon: Tags },
  // { name: 'Users', href: '/users', icon: Users },
  // { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  // { name: 'Media', href: '/media', icon: Upload },
  { name: 'Import', href: '/import', icon: ExternalLink },
  // { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Blog Admin</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Version 1.0.0
        </div>
      </div>
    </div>
  );
}