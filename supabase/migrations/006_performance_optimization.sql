-- =====================================================
-- Additional Helper Functions for Recommendations
-- Performance optimization
-- =====================================================

-- Function to get products in same category (optimized)
CREATE OR REPLACE FUNCTION get_same_category_products(
    target_product_id UUID,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name_vi TEXT,
    name_en TEXT,
    price NUMERIC,
    sale_price NUMERIC,
    images JSONB,
    category_id UUID,
    is_featured BOOLEAN
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
        p.is_featured
    FROM products p
    WHERE p.category_id = (
        SELECT category_id 
        FROM products 
        WHERE id = target_product_id
    )
    AND p.id != target_product_id
    AND p.is_published = TRUE
    ORDER BY p.is_featured DESC, p.price ASC
    LIMIT match_count;
$$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_featured 
ON products(category_id, is_featured) 
WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS idx_products_price 
ON products(price) 
WHERE is_published = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_interactions_user_event 
ON user_interactions(user_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_queries_text 
ON search_queries USING gin(to_tsvector('simple', query_text));

-- Add comments
COMMENT ON FUNCTION get_same_category_products IS 'Get products in the same category as target product, ordered by featured status and price';
COMMENT ON INDEX idx_products_category_featured IS 'Optimize category + featured queries';
COMMENT ON INDEX idx_user_interactions_user_event IS 'Optimize user interaction lookups';

SELECT 'Performance optimization functions and indexes created!' as status;
