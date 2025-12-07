-- =====================================================
-- Yenflowers Store - Database Schema
-- Supabase (PostgreSQL)
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS & AUTH (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'staff')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 2. CATEGORIES
-- =====================================================
CREATE TABLE public.categories (
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
-- 3. PRODUCTS
-- =====================================================
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku TEXT UNIQUE,
    slug TEXT UNIQUE NOT NULL,
    name_vi TEXT NOT NULL,
    name_en TEXT,
    description_vi TEXT,
    description_en TEXT,
    short_description_vi TEXT,
    short_description_en TEXT,
    price NUMERIC(12, 0) NOT NULL, -- VND doesn't use decimals
    sale_price NUMERIC(12, 0),
    cost_price NUMERIC(12, 0),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    images JSONB DEFAULT '[]', -- Array of {url, alt, sort_order}
    tags TEXT[] DEFAULT '{}',
    stock_quantity INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT FALSE,
    seo_title TEXT,
    seo_description TEXT,
    -- Facebook sync fields
    fb_post_id TEXT,
    fb_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_featured ON public.products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_published ON public.products(is_published) WHERE is_published = TRUE;

-- =====================================================
-- 4. PRODUCT VARIANTS (for different sizes/options)
-- =====================================================
CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name_vi TEXT NOT NULL,
    name_en TEXT,
    price_adjustment NUMERIC(12, 0) DEFAULT 0, -- Add/subtract from base price
    stock_quantity INT DEFAULT 0,
    sku TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_variants_product ON public.product_variants(product_id);

-- =====================================================
-- 5. ADDRESSES
-- =====================================================
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line TEXT NOT NULL,
    ward TEXT,
    district TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Hồ Chí Minh',
    postal_code TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON public.addresses(user_id);

-- =====================================================
-- 6. ORDERS
-- =====================================================
CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'shipping',
    'delivered',
    'cancelled',
    'refunded'
);

CREATE TYPE payment_status AS ENUM (
    'pending',
    'paid',
    'failed',
    'refunded'
);

CREATE TYPE payment_method AS ENUM (
    'cod',
    'stripe',
    'paypal',
    'bank_transfer'
);

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL, -- YF-20251207-001
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- Guest info (if not logged in)
    guest_email TEXT,
    guest_phone TEXT,
    -- Shipping
    shipping_address JSONB NOT NULL,
    shipping_fee NUMERIC(12, 0) DEFAULT 0,
    -- Order details
    subtotal NUMERIC(12, 0) NOT NULL,
    discount_amount NUMERIC(12, 0) DEFAULT 0,
    total NUMERIC(12, 0) NOT NULL,
    -- Status
    order_status order_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'pending',
    payment_method payment_method,
    payment_intent_id TEXT, -- Stripe/PayPal reference
    -- Notes
    customer_note TEXT,
    admin_note TEXT,
    -- Delivery
    delivery_date DATE,
    delivery_time_slot TEXT, -- e.g., "9:00-12:00"
    -- Timestamps
    paid_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(order_status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

-- =====================================================
-- 7. ORDER ITEMS
-- =====================================================
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL, -- Snapshot at order time
    variant_name TEXT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 0) NOT NULL,
    total_price NUMERIC(12, 0) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- =====================================================
-- 8. BLOG POSTS
-- =====================================================
CREATE TABLE public.blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    title_vi TEXT NOT NULL,
    title_en TEXT,
    excerpt_vi TEXT,
    excerpt_en TEXT,
    content_vi TEXT,
    content_en TEXT,
    featured_image TEXT,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    seo_title TEXT,
    seo_description TEXT,
    view_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_blog_published ON public.blog_posts(is_published, published_at DESC);

-- =====================================================
-- 9. SOCIAL FEED (Facebook/Instagram sync)
-- =====================================================
CREATE TABLE public.social_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram')),
    post_id TEXT UNIQUE NOT NULL,
    caption TEXT,
    image_url TEXT,
    permalink TEXT,
    post_type TEXT, -- 'photo', 'video', 'album'
    posted_at TIMESTAMPTZ,
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    is_imported_as_product BOOLEAN DEFAULT FALSE,
    imported_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL
);

CREATE INDEX idx_social_platform ON public.social_feed(platform, posted_at DESC);

-- =====================================================
-- 10. SETTINGS (Key-value store for app config)
-- =====================================================
CREATE TABLE public.settings (
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
    ('fb_sync', '{"page_id": "", "last_sync": null, "auto_sync": false}', 'Facebook sync settings');

-- =====================================================
-- 11. DISCOUNT CODES
-- =====================================================
CREATE TABLE public.discount_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC(12, 2) NOT NULL,
    min_order_value NUMERIC(12, 0),
    max_uses INT,
    used_count INT DEFAULT 0,
    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Public can view published products" ON public.products
    FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Public can view active categories" ON public.categories
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can view published blog posts" ON public.blog_posts
    FOR SELECT USING (is_published = TRUE);

-- Users can manage their own data
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own addresses" ON public.addresses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

-- Admin full access (check role in profiles)
CREATE POLICY "Admins have full access to products" ON public.products
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins have full access to categories" ON public.categories
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins have full access to orders" ON public.orders
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins have full access to blog" ON public.blog_posts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins have full access to settings" ON public.settings
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins have full access to social feed" ON public.social_feed
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins have full access to discounts" ON public.discount_codes
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
