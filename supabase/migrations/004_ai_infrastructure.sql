-- =====================================================
-- AI Infrastructure Migration
-- Smart Recommendations & Smart Search
-- =====================================================

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- 1. USER INTERACTIONS TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'add_to_cart', 'remove_from_cart', 'purchase', 'search', 'click_recommendation')),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}', -- Flexible storage for event-specific data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX idx_interactions_user ON public.user_interactions(user_id, created_at DESC);
CREATE INDEX idx_interactions_session ON public.user_interactions(session_id, created_at DESC);
CREATE INDEX idx_interactions_event ON public.user_interactions(event_type, created_at DESC);
CREATE INDEX idx_interactions_product ON public.user_interactions(product_id, created_at DESC);

-- =====================================================
-- 2. PRODUCT RELATIONSHIPS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_a_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_b_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('frequently_bought_together', 'viewed_together', 'alternative', 'upgrade')),
    confidence_score FLOAT NOT NULL DEFAULT 0.0,
    occurrence_count INT DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_a_id, product_b_id, relationship_type)
);

CREATE INDEX idx_product_rel_a ON public.product_relationships(product_a_id, relationship_type, confidence_score DESC);
CREATE INDEX idx_product_rel_b ON public.product_relationships(product_b_id, relationship_type);

-- =====================================================
-- 3. RECOMMENDATION TRACKING
-- =====================================================
CREATE TABLE IF NOT EXISTS public.recommendation_clicks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    recommended_products UUID[], -- Array of product IDs shown
    clicked_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    context TEXT NOT NULL, -- 'homepage', 'pdp', 'cart', 'search_results'
    algorithm TEXT NOT NULL, -- 'collaborative', 'content', 'hybrid', 'trending'
    position INT, -- Position in the recommendation list (0-indexed)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rec_clicks_user ON public.recommendation_clicks(user_id, created_at DESC);
CREATE INDEX idx_rec_clicks_context ON public.recommendation_clicks(context, algorithm);

-- =====================================================
-- 4. SEARCH QUERIES
-- =====================================================
CREATE TABLE IF NOT EXISTS public.search_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    query_text TEXT NOT NULL,
    parsed_intent JSONB, -- {'occasion': 'birthday', 'price_max': 500000, 'location': 'district_1'}
    results_count INT DEFAULT 0,
    clicked_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    clicked_position INT, -- Which result was clicked (1-indexed)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_queries_user ON public.search_queries(user_id, created_at DESC);
CREATE INDEX idx_search_queries_text ON public.search_queries USING gin(to_tsvector('vietnamese', query_text));
CREATE INDEX idx_search_queries_created ON public.search_queries(created_at DESC);

-- =====================================================
-- 5. ADD EMBEDDINGS TO PRODUCTS
-- =====================================================
-- Add embedding column to products table for semantic search
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS embedding vector(1536); -- OpenAI ada-002 dimensions

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_products_embedding ON public.products USING ivfflat (embedding vector_cosine_ops);

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to search products by embedding similarity
CREATE OR REPLACE FUNCTION search_products_by_embedding(
    query_embedding vector(1536),
    match_count int DEFAULT 10,
    min_similarity float DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    name_vi TEXT,
    name_en TEXT,
    price NUMERIC,
    sale_price NUMERIC,
    images JSONB,
    category_id UUID,
    similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
    SELECT 
        p.id,
        p.name_vi,
        p.name_en,
        p.price,
        p.sale_price,
        p.images,
        p.category_id,
        1 - (p.embedding <=> query_embedding) as similarity
    FROM products p
    WHERE p.is_published = true
        AND p.embedding IS NOT NULL
        AND 1 - (p.embedding <=> query_embedding) > min_similarity
    ORDER BY p.embedding <=> query_embedding
    LIMIT match_count;
$$;

-- Function to get frequently bought together products
CREATE OR REPLACE FUNCTION get_frequently_bought_together(
    target_product_id UUID,
    match_count int DEFAULT 5
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    price NUMERIC,
    images JSONB,
    confidence FLOAT
)
LANGUAGE SQL STABLE
AS $$
    SELECT 
        p.id,
        p.name_vi,
        p.price,
        p.images,
        pr.confidence_score
    FROM product_relationships pr
    JOIN products p ON p.id = pr.product_b_id
    WHERE pr.product_a_id = target_product_id
        AND pr.relationship_type = 'frequently_bought_together'
        AND p.is_published = true
    ORDER BY pr.confidence_score DESC
    LIMIT match_count;
$$;

-- Function to get trending products (most viewed in last 7 days)
CREATE OR REPLACE FUNCTION get_trending_products(
    match_count int DEFAULT 10,
    days_back int DEFAULT 7
)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    price NUMERIC,
    images JSONB,
    view_count BIGINT
)
LANGUAGE SQL STABLE
AS $$
    SELECT 
        p.id,
        p.name_vi,
        p.price,
        p.images,
        COUNT(*) as view_count
    FROM user_interactions ui
    JOIN products p ON p.id = ui.product_id
    WHERE ui.event_type = 'view'
        AND ui.created_at > NOW() - INTERVAL '1 day' * days_back
        AND p.is_published = true
    GROUP BY p.id, p.name_vi, p.price, p.images
    ORDER BY view_count DESC
    LIMIT match_count;
$$;

-- =====================================================
-- 7. ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE public.user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;

-- Allow everyone to insert interaction events (tracking)
CREATE POLICY "Anyone can insert interactions" ON public.user_interactions
    FOR INSERT WITH CHECK (true);

-- Allow users to view their own interactions
CREATE POLICY "Users can view own interactions" ON public.user_interactions
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all interactions
CREATE POLICY "Admins can view all interactions" ON public.user_interactions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Public read for product relationships (used by recommendations)
CREATE POLICY "Public can view product relationships" ON public.product_relationships
    FOR SELECT USING (true);

-- Admins can manage product relationships
CREATE POLICY "Admins can manage product relationships" ON public.product_relationships
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Allow inserting recommendation clicks for tracking
CREATE POLICY "Anyone can insert recommendation clicks" ON public.recommendation_clicks
    FOR INSERT WITH CHECK (true);

-- Allow inserting search queries for tracking
CREATE POLICY "Anyone can insert search queries" ON public.search_queries
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 8. BACKGROUND JOB: Update Product Relationships
-- =====================================================
-- This function analyzes purchase patterns and updates relationships
-- Run this periodically (e.g., daily via cron job)

CREATE OR REPLACE FUNCTION update_product_relationships()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Clear old relationships (optional, or keep historical data)
    -- DELETE FROM product_relationships WHERE updated_at < NOW() - INTERVAL '30 days';
    
    -- Find frequently bought together (from same orders)
    INSERT INTO product_relationships (product_a_id, product_b_id, relationship_type, confidence_score, occurrence_count)
    SELECT 
        oi1.product_id as product_a_id,
        oi2.product_id as product_b_id,
        'frequently_bought_together',
        COUNT(*)::FLOAT / (SELECT COUNT(DISTINCT order_id) FROM order_items)::FLOAT as confidence_score,
        COUNT(*) as occurrence_count
    FROM order_items oi1
    JOIN order_items oi2 ON oi1.order_id = oi2.order_id
    WHERE oi1.product_id < oi2.product_id -- Avoid duplicates
        AND oi1.product_id IS NOT NULL
        AND oi2.product_id IS NOT NULL
    GROUP BY oi1.product_id, oi2.product_id
    HAVING COUNT(*) >= 3 -- At least 3 co-occurrences
    ON CONFLICT (product_a_id, product_b_id, relationship_type) 
    DO UPDATE SET 
        confidence_score = EXCLUDED.confidence_score,
        occurrence_count = EXCLUDED.occurrence_count,
        updated_at = NOW();
    
    -- Find viewed together (same session)
    INSERT INTO product_relationships (product_a_id, product_b_id, relationship_type, confidence_score, occurrence_count)
    SELECT 
        ui1.product_id as product_a_id,
        ui2.product_id as product_b_id,
        'viewed_together',
        COUNT(*)::FLOAT / (SELECT COUNT(DISTINCT session_id) FROM user_interactions WHERE event_type = 'view')::FLOAT as confidence_score,
        COUNT(*) as occurrence_count
    FROM user_interactions ui1
    JOIN user_interactions ui2 ON ui1.session_id = ui2.session_id
    WHERE ui1.product_id < ui2.product_id
        AND ui1.event_type = 'view'
        AND ui2.event_type = 'view'
        AND ui1.product_id IS NOT NULL
        AND ui2.product_id IS NOT NULL
    GROUP BY ui1.product_id, ui2.product_id
    HAVING COUNT(*) >= 5
    ON CONFLICT (product_a_id, product_b_id, relationship_type) 
    DO UPDATE SET 
        confidence_score = EXCLUDED.confidence_score,
        occurrence_count = EXCLUDED.occurrence_count,
        updated_at = NOW();
END;
$$;

-- =====================================================
-- Done!
-- =====================================================
SELECT 'AI infrastructure tables created successfully!' as status;
