"""
Public API routes for the storefront.
These endpoints are accessible without authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from uuid import UUID
from typing import Optional
from supabase import Client

from app.database import get_supabase
from app.schemas.schemas import (
    CategoryResponse,
    ProductResponse,
    BlogPostResponse,
    SocialFeedResponse,
    PaginatedResponse
)

router = APIRouter(tags=["Public"])


# =====================================================
# CATEGORIES
# =====================================================
@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(
    db: Client = Depends(get_supabase)
):
    """List all active categories."""
    result = db.table("categories").select("*").eq("is_active", True).order("sort_order").execute()
    return result.data


@router.get("/categories/{slug}", response_model=CategoryResponse)
async def get_category_by_slug(
    slug: str,
    db: Client = Depends(get_supabase)
):
    """Get category by slug."""
    result = db.table("categories").select("*").eq("slug", slug).eq("is_active", True).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Category not found")
    return result.data[0]


# =====================================================
# PRODUCTS
# =====================================================
@router.get("/products", response_model=PaginatedResponse)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    category: Optional[str] = None,  # slug
    featured: Optional[bool] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    sort: str = Query("newest", regex="^(newest|price_asc|price_desc|popular)$"),
    db: Client = Depends(get_supabase)
):
    """List published products with filtering."""
    query = db.table("products").select("*", count="exact").eq("is_published", True)
    
    # Category filter (by slug)
    if category:
        cat = db.table("categories").select("id").eq("slug", category).execute()
        if cat.data:
            query = query.eq("category_id", cat.data[0]["id"])
    
    if featured:
        query = query.eq("is_featured", True)
    if min_price:
        query = query.gte("price", min_price)
    if max_price:
        query = query.lte("price", max_price)
    
    # Sorting
    if sort == "newest":
        query = query.order("created_at", desc=True)
    elif sort == "price_asc":
        query = query.order("price", desc=False)
    elif sort == "price_desc":
        query = query.order("price", desc=True)
    else:
        query = query.order("created_at", desc=True)
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.range(offset, offset + page_size - 1)
    
    result = query.execute()
    total = result.count or 0
    
    return PaginatedResponse(
        items=result.data,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/products/featured", response_model=list[ProductResponse])
async def get_featured_products(
    limit: int = Query(8, ge=1, le=20),
    db: Client = Depends(get_supabase)
):
    """Get featured products for homepage."""
    result = db.table("products").select("*").eq("is_published", True).eq("is_featured", True).limit(limit).execute()
    return result.data


@router.get("/products/{slug}", response_model=ProductResponse)
async def get_product_by_slug(
    slug: str,
    db: Client = Depends(get_supabase)
):
    """Get product by slug."""
    result = db.table("products").select("*").eq("slug", slug).eq("is_published", True).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return result.data[0]


@router.get("/products/{slug}/related", response_model=list[ProductResponse])
async def get_related_products(
    slug: str,
    limit: int = Query(4, ge=1, le=10),
    db: Client = Depends(get_supabase)
):
    """Get related products based on category."""
    # First get the product
    product = db.table("products").select("id,category_id").eq("slug", slug).execute()
    if not product.data:
        return []
    
    category_id = product.data[0].get("category_id")
    product_id = product.data[0]["id"]
    
    if not category_id:
        return []
    
    # Get related products from same category
    result = db.table("products").select("*").eq("is_published", True).eq("category_id", category_id).neq("id", product_id).limit(limit).execute()
    return result.data


# =====================================================
# BLOG
# =====================================================
@router.get("/blog", response_model=PaginatedResponse)
async def list_blog_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    tag: Optional[str] = None,
    db: Client = Depends(get_supabase)
):
    """List published blog posts."""
    query = db.table("blog_posts").select("*", count="exact").eq("is_published", True)
    
    if tag:
        query = query.contains("tags", [tag])
    
    offset = (page - 1) * page_size
    query = query.order("published_at", desc=True).range(offset, offset + page_size - 1)
    
    result = query.execute()
    total = result.count or 0
    
    return PaginatedResponse(
        items=result.data,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/blog/{slug}", response_model=BlogPostResponse)
async def get_blog_post_by_slug(
    slug: str,
    db: Client = Depends(get_supabase)
):
    """Get blog post by slug and increment view count."""
    result = db.table("blog_posts").select("*").eq("slug", slug).eq("is_published", True).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Blog post not found")
    
    post = result.data[0]
    
    # Increment view count
    db.table("blog_posts").update({"view_count": post["view_count"] + 1}).eq("id", post["id"]).execute()
    
    return post


# =====================================================
# SEARCH
# =====================================================
@router.get("/search", response_model=PaginatedResponse)
async def search(
    q: str = Query(..., min_length=2),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    db: Client = Depends(get_supabase)
):
    """Search products by name."""
    query = db.table("products").select("*", count="exact").eq("is_published", True).or_(
        f"name_vi.ilike.%{q}%,name_en.ilike.%{q}%,tags.cs.{{{q}}}"
    )
    
    offset = (page - 1) * page_size
    query = query.range(offset, offset + page_size - 1)
    
    result = query.execute()
    total = result.count or 0
    
    return PaginatedResponse(
        items=result.data,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


# =====================================================
# SOCIAL FEED
# =====================================================
@router.get("/social/feed", response_model=list[SocialFeedResponse])
async def get_social_feed(
    db: Client = Depends(get_supabase)
):
    """Get social feed items (Facebook/Instagram)."""
    result = db.table("social_feed").select("*").order("posted_at", desc=True).execute()
    return result.data


@router.get("/social/feed/{post_id}", response_model=SocialFeedResponse)
async def get_social_feed_item(
    post_id: UUID,
    db: Client = Depends(get_supabase)
):
    """Get a single social feed item by ID."""
    result = db.table("social_feed").select("*").eq("id", str(post_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Social feed item not found")
    return result.data[0]
