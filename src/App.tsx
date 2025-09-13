import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext, useAuthProvider } from './hooks/useAuth';
import { Layout } from './components/Layout/Layout';
import { LoginForm } from './components/Auth/LoginForm';
import { Dashboard } from './components/Dashboard/Dashboard';
import { PostList } from './components/Posts/PostList';
import { PostEditor } from './components/Posts/PostEditor';
import { ImportTool } from './components/Import/ImportTool';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authValue = useAuthProvider();
  console.log("🚀 ~ ProtectedRoute ~ isAuthenticated:", authValue.isAuthenticated)

  if (authValue.isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return authValue.isAuthenticated ? <>{children}</> : <LoginForm />;
}

function AppContent() {
  const authValue = useAuthProvider();

  return (
    <AuthContext.Provider value={authValue}>
      <ProtectedRoute>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/posts" element={<PostList />} />
            <Route path="/posts/new" element={<PostEditor />} />
            <Route path="/posts/:id/edit" element={<PostEditor />} />
            <Route path="/import" element={<ImportTool />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </ProtectedRoute>
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  );
}

export default App;