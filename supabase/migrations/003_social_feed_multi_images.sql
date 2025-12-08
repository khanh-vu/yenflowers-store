-- =====================================================
-- Migration: Add image_urls and is_pinned to social_feed
-- =====================================================

-- Add image_urls column for multiple photos per post
ALTER TABLE public.social_feed 
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]';

-- Add is_pinned column for featured posts
ALTER TABLE public.social_feed 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Comment for documentation
COMMENT ON COLUMN public.social_feed.image_urls IS 'Array of all image URLs for posts with multiple photos';
COMMENT ON COLUMN public.social_feed.is_pinned IS 'Whether this post is pinned/featured on the blog';
