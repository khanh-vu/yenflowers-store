-- =====================================================
-- YenFlowers Store - Local Docker Database Schema
-- Simplified version without Supabase auth dependencies
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CATEGORIES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name_vi TEXT NOT NULL,
    name_en TEXT,
    description_vi TEXT,
    description_en TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. PRODUCTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE,
    slug TEXT UNIQUE NOT NULL,
    name_vi TEXT NOT NULL,
    name_en TEXT,
    description_vi TEXT,
    description_en TEXT,
    short_description_vi TEXT,
    short_description_en TEXT,
    price NUMERIC(12, 0) NOT NULL,
    sale_price NUMERIC(12, 0),
    cost_price NUMERIC(12, 0),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    images JSONB DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    stock_quantity INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    seo_title TEXT,
    seo_description TEXT,
    fb_post_id TEXT,
    fb_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_published ON public.products(is_published) WHERE is_published = TRUE;

-- =====================================================
-- 3. ORDERS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL,
    user_id UUID,
    guest_email TEXT,
    guest_phone TEXT,
    shipping_address JSONB NOT NULL,
    shipping_fee NUMERIC(12, 0) DEFAULT 0,
    subtotal NUMERIC(12, 0) NOT NULL,
    discount_amount NUMERIC(12, 0) DEFAULT 0,
    total NUMERIC(12, 0) NOT NULL,
    order_status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending',
    payment_method TEXT,
    payment_intent_id TEXT,
    customer_note TEXT,
    admin_note TEXT,
    delivery_date DATE,
    delivery_time_slot TEXT,
    paid_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

-- =====================================================
-- 4. ORDER ITEMS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID,
    product_name TEXT NOT NULL,
    variant_name TEXT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 0) NOT NULL,
    total_price NUMERIC(12, 0) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- =====================================================
-- 5. BLOG POSTS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title_vi TEXT NOT NULL,
    title_en TEXT,
    excerpt_vi TEXT,
    excerpt_en TEXT,
    content_vi TEXT,
    content_en TEXT,
    featured_image TEXT,
    author_id UUID,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    seo_title TEXT,
    seo_description TEXT,
    view_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_published ON public.blog_posts(is_published, published_at DESC);

-- =====================================================
-- 6. SOCIAL FEED (Facebook/Instagram sync)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.social_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
    post_id TEXT UNIQUE NOT NULL,
    caption TEXT,
    image_url TEXT,
    permalink TEXT,
    post_type TEXT,
    posted_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    is_imported_as_product BOOLEAN DEFAULT FALSE,
    imported_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_social_platform ON public.social_feed(platform, posted_at DESC);

-- =====================================================
-- 7. SETTINGS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings
INSERT INTO public.settings (key, value, description) VALUES
    ('delivery_fees', '{"default": 30000, "districts": {"1": 25000, "3": 25000, "tan_binh": 35000}}', 'Delivery fees by district'),
    ('payment_methods', '{"cod": true, "stripe": true, "paypal": false, "bank_transfer": true}', 'Enabled payment methods'),
    ('store_info', '{"name": "YenFlowers", "phone": "", "email": "", "address": "Ho Chi Minh City, Vietnam"}', 'Store contact info'),
    ('fb_sync', '{"page_id": "", "last_sync": null, "auto_sync": false}', 'Facebook sync settings')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- Done!
-- =====================================================
SELECT 'Schema created successfully!' as status;
