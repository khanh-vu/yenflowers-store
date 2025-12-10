// ==========================================
// YenFlowers Store - API Service Layer
// ==========================================

import type {
    Category, CategoryCreate, CategoryUpdate,
    Product, ProductCreate, ProductUpdate,
    Order, OrderStatusUpdate,
    BlogPost, BlogPostCreate, BlogPostUpdate,
    SocialFeedItem,
    PaginatedResponse,
} from '@/types';

const API_BASE = 'http://localhost:8000/api/v1';

// ==========================================
// Generic API Helper
// ==========================================

async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const config: RequestInit = {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    };

    const token = localStorage.getItem('admin_token');
    if (token) {
        (config.headers as any)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
        throw new Error(error.detail || `HTTP error ${response.status}`);
    }

    return response.json();
}

// ==========================================
// Categories API
// ==========================================

export const categoriesApi = {
    list: (includeInactive = false) =>
        apiRequest<Category[]>(`/admin/categories?include_inactive=${includeInactive}`),

    get: (id: string) =>
        apiRequest<Category>(`/admin/categories/${id}`),

    create: (data: CategoryCreate) =>
        apiRequest<Category>('/admin/categories', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: CategoryUpdate) =>
        apiRequest<Category>(`/admin/categories/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        apiRequest<{ message: string }>(`/admin/categories/${id}`, {
            method: 'DELETE',
        }),
};

// ==========================================
// Products API
// ==========================================

export interface ProductsListParams {
    page?: number;
    page_size?: number;
    category_id?: string;
    is_published?: boolean;
    is_featured?: boolean;
    search?: string;
}

export const productsApi = {
    list: (params: ProductsListParams = {}) => {
        const query = new URLSearchParams();
        if (params.page) query.set('page', String(params.page));
        if (params.page_size) query.set('page_size', String(params.page_size));
        if (params.category_id) query.set('category_id', params.category_id);
        if (params.is_published !== undefined) query.set('is_published', String(params.is_published));
        if (params.is_featured !== undefined) query.set('is_featured', String(params.is_featured));
        if (params.search) query.set('search', params.search);

        return apiRequest<PaginatedResponse<Product>>(`/admin/products?${query.toString()}`);
    },

    get: (id: string) =>
        apiRequest<Product>(`/admin/products/${id}`),

    create: (data: ProductCreate) =>
        apiRequest<Product>('/admin/products', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: ProductUpdate) =>
        apiRequest<Product>(`/admin/products/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        apiRequest<{ message: string }>(`/admin/products/${id}`, {
            method: 'DELETE',
        }),
};

// ==========================================
// Upload API
// ==========================================

export const uploadApi = {
    uploadImage: async (file: File): Promise<{ url: string; filename: string }> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/upload/image`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Upload failed');
        }

        return response.json();
    },
};

// ==========================================
// Orders API
// ==========================================

export interface OrdersListParams {
    page?: number;
    page_size?: number;
    order_status?: string;
    payment_status?: string;
}

export const ordersApi = {
    list: (params: OrdersListParams = {}) => {
        const query = new URLSearchParams();
        if (params.page) query.set('page', String(params.page));
        if (params.page_size) query.set('page_size', String(params.page_size));
        if (params.order_status) query.set('order_status', params.order_status);
        if (params.payment_status) query.set('payment_status', params.payment_status);

        return apiRequest<PaginatedResponse<Order>>(`/admin/orders?${query.toString()}`);
    },

    get: (id: string) =>
        apiRequest<Order>(`/admin/orders/${id}`),

    updateStatus: (id: string, data: OrderStatusUpdate) =>
        apiRequest<Order>(`/admin/orders/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
};

// ==========================================
// Blog API
// ==========================================

export interface BlogListParams {
    page?: number;
    page_size?: number;
    is_published?: boolean;
}

export const blogApi = {
    list: (params: BlogListParams = {}) => {
        const query = new URLSearchParams();
        if (params.page) query.set('page', String(params.page));
        if (params.page_size) query.set('page_size', String(params.page_size));
        if (params.is_published !== undefined) query.set('is_published', String(params.is_published));

        return apiRequest<PaginatedResponse<BlogPost>>(`/admin/blog?${query.toString()}`);
    },

    get: (id: string) =>
        apiRequest<BlogPost>(`/admin/blog/${id}`),

    create: (data: BlogPostCreate) =>
        apiRequest<BlogPost>('/admin/blog', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: BlogPostUpdate) =>
        apiRequest<BlogPost>(`/admin/blog/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        apiRequest<{ message: string }>(`/admin/blog/${id}`, {
            method: 'DELETE',
        }),
};

// ==========================================
// Social Feed API
// ==========================================

export interface SocialFeedParams {
    page?: number;
    page_size?: number;
    platform?: string;
    imported?: boolean;
}

export const socialFeedApi = {
    list: (params: SocialFeedParams = {}) => {
        const query = new URLSearchParams();
        if (params.page) query.set('page', String(params.page));
        if (params.page_size) query.set('page_size', String(params.page_size));
        if (params.platform) query.set('platform', params.platform);
        if (params.imported !== undefined) query.set('imported', String(params.imported));

        return apiRequest<PaginatedResponse<SocialFeedItem>>(`/admin/social/feed?${query.toString()}`);
    },

    sync: () =>
        apiRequest<{ message: string; synced: number; has_more: boolean; total_in_db: number }>('/admin/social/sync', {
            method: 'POST',
        }),

    syncAll: () =>
        apiRequest<{ message: string; synced: number; updated: number; total_fetched: number }>('/admin/social/sync-all', {
            method: 'POST',
        }),

    getSyncStatus: (refreshCount = false) =>
        apiRequest<{ fb_total_posts: number; total_in_db: number; has_cursor: boolean; progress: number; last_sync: string | null }>(`/admin/social/sync-status?refresh_count=${refreshCount}`),

    importAsProduct: (feedId: string, data: { name_vi: string; price: number; category_id: string }) =>
        apiRequest<Product>(`/admin/social/${feedId}/import-product`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    bulkImport: (data: { category_id: string; items: Array<{ feed_id: string; name_vi: string; price?: number }> }) =>
        apiRequest<{
            message: string;
            imported: Array<{ feed_id: string; product_id: string; name: string }>;
            failed: Array<{ feed_id: string; error: string }>;
            total_imported: number;
            total_failed: number;
        }>('/admin/social/bulk-import', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// ==========================================
// Settings API
// ==========================================
export const settingsApi = {
    getAll: () =>
        apiRequest<Record<string, any>>('/admin/settings'),

    update: (key: string, value: any) =>
        apiRequest(`/admin/settings/${key}`, {
            method: 'PATCH',
            body: JSON.stringify(value),
        }),
};


// ==========================================
// Dashboard API (Public stats)
// ==========================================

// ==========================================
// Public API
// ==========================================

export const publicApi = {
    getSocialFeed: (page = 1, page_size = 12, year?: number, month?: number) => {
        const query = new URLSearchParams();
        query.set('page', String(page));
        query.set('page_size', String(page_size));
        if (year) query.set('year', String(year));
        if (month) query.set('month', String(month));
        return apiRequest<PaginatedResponse<SocialFeedItem>>(`/public/social/feed?${query.toString()}`);
    },

    getSocialFeedById: (id: string) =>
        apiRequest<SocialFeedItem>(`/public/social/feed/${id}`),

    // NEW: Categories for public consumption
    getCategories: () =>
        apiRequest<Category[]>('/public/categories'),

    // NEW: Products endpoints for public
    getProducts: (params: ProductsListParams = {}) => {
        const query = new URLSearchParams();
        if (params.page) query.set('page', String(params.page));
        if (params.page_size) query.set('page_size', String(params.page_size));
        if (params.category_id) query.set('category_id', params.category_id);
        if (params.is_published !== undefined) query.set('is_published', String(params.is_published));
        if (params.is_featured !== undefined) query.set('is_featured', String(params.is_featured));
        if (params.search) query.set('search', params.search);

        return apiRequest<PaginatedResponse<Product>>(`/public/products?${query.toString()}`);
    },

    getFeaturedProducts: (limit = 8) =>
        apiRequest<PaginatedResponse<Product>>(`/public/products?is_featured=true&page_size=${limit}&is_published=true`),

    getProductById: (id: string) =>
        apiRequest<Product>(`/public/products/${id}`),

    getProductsByCategory: (categoryId: string, page = 1, limit = 12) => {
        const query = new URLSearchParams();
        query.set('category_id', categoryId);
        query.set('page', String(page));
        query.set('page_size', String(limit));
        query.set('is_published', 'true');
        return apiRequest<PaginatedResponse<Product>>(`/public/products?${query.toString()}`);
    },
    getBlogPosts: (page = 1, pageSize = 10, tag?: string) => {
        const query = new URLSearchParams({
            page: String(page),
            page_size: String(pageSize)
        });
        if (tag) query.set('tag', tag);
        return apiRequest<PaginatedResponse<BlogPost>>(`/blog?${query.toString()}`);
    },

    getBlogPost: (slug: string) =>
        apiRequest<BlogPost>(`/blog/${slug}`),
};

export const dashboardApi = {
    getStats: async () => {
        // Aggregate data from multiple endpoints
        const [products, orders] = await Promise.all([
            productsApi.list({ page_size: 5 }),
            ordersApi.list({ page_size: 10 }),
        ]);

        const pendingOrders = orders.items.filter(o => o.order_status === 'pending').length;
        const totalRevenue = orders.items.reduce((sum, o) => sum + o.total, 0);

        return {
            total_products: products.total,
            total_orders: orders.total,
            total_revenue: totalRevenue,
            pending_orders: pendingOrders,
            recent_orders: orders.items.slice(0, 5),
            top_products: products.items.filter(p => p.is_featured),
        };
    },
};
