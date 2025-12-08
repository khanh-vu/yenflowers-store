// ==========================================
// YenFlowers Store - Type Definitions
// ==========================================

// Category Types
export interface Category {
    id: string;
    slug: string;
    name_vi: string;
    name_en?: string;
    description_vi?: string;
    description_en?: string;
    image_url?: string;
    parent_id?: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CategoryCreate {
    slug: string;
    name_vi: string;
    name_en?: string;
    description_vi?: string;
    description_en?: string;
    image_url?: string;
    parent_id?: string;
    sort_order?: number;
    is_active?: boolean;
}

export interface CategoryUpdate extends Partial<CategoryCreate> { }

// Product Types
export interface ProductImage {
    url: string;
    alt?: string;
    sort_order: number;
}

export interface Product {
    id: string;
    sku?: string;
    slug: string;
    name_vi: string;
    name_en?: string;
    description_vi?: string;
    description_en?: string;
    short_description_vi?: string;
    short_description_en?: string;
    price: number;
    sale_price?: number;
    cost_price?: number;
    category_id?: string;
    category?: Category;
    images: ProductImage[];
    tags?: string[];
    stock_quantity: number;
    is_featured: boolean;
    is_published: boolean;
    seo_title?: string;
    seo_description?: string;
    fb_post_id?: string;
    fb_synced_at?: string;
    created_at: string;
    updated_at: string;
}

export interface ProductCreate {
    sku?: string;
    slug: string;
    name_vi: string;
    name_en?: string;
    description_vi?: string;
    description_en?: string;
    short_description_vi?: string;
    short_description_en?: string;
    price: number;
    sale_price?: number;
    cost_price?: number;
    category_id?: string;
    images?: ProductImage[];
    tags?: string[];
    stock_quantity?: number;
    is_featured?: boolean;
    is_published?: boolean;
    seo_title?: string;
    seo_description?: string;
}

export interface ProductUpdate extends Partial<ProductCreate> { }

// Order Types
export interface ShippingAddress {
    full_name: string;
    phone: string;
    address_line: string;
    ward: string;
    district: string;
    city: string;
}

export interface OrderItem {
    id: string;
    product_id: string;
    product?: Product;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cod' | 'stripe' | 'paypal' | 'bank_transfer';

export interface Order {
    id: string;
    order_number: string;
    user_id?: string;
    guest_email?: string;
    guest_phone?: string;
    shipping_address: ShippingAddress;
    shipping_fee: number;
    subtotal: number;
    discount_amount: number;
    total: number;
    order_status: OrderStatus;
    payment_status: PaymentStatus;
    payment_method: PaymentMethod;
    customer_note?: string;
    admin_note?: string;
    delivery_date?: string;
    delivery_time_slot?: string;
    items?: OrderItem[];
    created_at: string;
    updated_at: string;
}

export interface OrderStatusUpdate {
    order_status?: OrderStatus;
    payment_status?: PaymentStatus;
    admin_note?: string;
}

// Blog Types
export interface BlogPost {
    id: string;
    slug: string;
    title_vi: string;
    title_en?: string;
    excerpt_vi?: string;
    excerpt_en?: string;
    content_vi?: string;
    content_en?: string;
    featured_image?: string;
    author_id?: string;
    tags?: string[];
    is_published: boolean;
    published_at?: string;
    view_count: number;
    seo_title?: string;
    seo_description?: string;
    created_at: string;
    updated_at: string;
}

export interface BlogPostCreate {
    slug: string;
    title_vi: string;
    title_en?: string;
    excerpt_vi?: string;
    excerpt_en?: string;
    content_vi?: string;
    content_en?: string;
    featured_image?: string;
    tags?: string[];
    is_published?: boolean;
    seo_title?: string;
    seo_description?: string;
}

export interface BlogPostUpdate extends Partial<BlogPostCreate> { }

// Social Feed Types
export interface SocialFeedItem {
    id: string;
    platform: 'facebook' | 'instagram';
    post_id: string;
    caption?: string;
    image_url?: string;
    image_urls?: string[]; // Array of all images for multi-photo posts
    permalink?: string;
    posted_at?: string;
    post_type?: string;
    synced_at: string;
    is_imported_as_product: boolean;
    is_pinned?: boolean;
}

// API Response Types
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

// Dashboard Stats
export interface DashboardStats {
    total_products: number;
    total_orders: number;
    total_revenue: number;
    pending_orders: number;
    recent_orders: Order[];
    top_products: Product[];
}
