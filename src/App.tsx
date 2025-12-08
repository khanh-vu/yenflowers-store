// ==========================================
// YenFlowers Store - Main Application Entry
// ==========================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Public Store
import StoreFront from './StoreFront';
import PublicBlogPage from './pages/public/BlogPage';
import PostDetailPage from './pages/public/PostDetailPage';

// Admin CMS
import { AdminLayout } from './admin/components';
import { AuthProvider } from './admin/context/AuthContext';
import {
  DashboardPage,
  ProductsPage,
  CategoriesPage,
  OrdersPage,
  BlogPage as AdminBlogPage,
  SocialFeedPage,
  SettingsPage,
  LoginPage,
} from './admin/pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Store */}
            <Route path="/" element={<StoreFront />} />

            {/* Admin Login */}
            <Route path="/admin/login" element={<LoginPage />} />

            {/* Admin CMS - protected by AdminLayout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="blog" element={<AdminBlogPage />} />
              <Route path="social" element={<SocialFeedPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="/blog" element={<PublicBlogPage />} />
            <Route path="/blog/:id" element={<PostDetailPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
