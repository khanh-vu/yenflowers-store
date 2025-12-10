// ==========================================
// YenFlowers Store - Main Application Entry
// ==========================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './i18n/config'; // Initialize i18n

// Public Store
import HomePage from './pages/public/HomePage';
import PublicBlogPage from './pages/public/BlogPage';
import PostDetailPage from './pages/public/PostDetailPage';
import PublicProductsPage from './pages/public/ProductsPage';
import ProductDetailPage from './pages/public/ProductDetailPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import FAQPage from './pages/public/FAQPage';
import CartPage from './pages/public/CartPage';
import CheckoutPage from './pages/public/CheckoutPage';
import AccountPage from './pages/public/AccountPage';
import OrderConfirmationPage from './pages/public/OrderConfirmationPage';
import PublicLoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import { PublicLayout } from './components/layout/PublicLayout';

// Admin CMS
import { AdminLayout } from './admin/components';
import { AuthProvider } from './admin/context/AuthContext';
import {
  DashboardPage,
  CategoriesPage,
  OrdersPage,
  BlogPage as AdminBlogPage,
  SocialFeedPage,
  SettingsPage,
  LoginPage,
} from './admin/pages';
import ProductsPage from './admin/pages/ProductsPage';

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
            {/* Public Store - Wrapped in PublicLayout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<PublicProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/blog" element={<PublicBlogPage />} />
              <Route path="/blog/:id" element={<PostDetailPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
              <Route path="/login" element={<PublicLoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

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
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
