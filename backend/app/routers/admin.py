"""
Admin API routes for managing products, categories, orders, blog, and settings.
All routes require admin authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from uuid import UUID
from typing import Optional
from supabase import Client

from app.database import get_supabase_admin
from app.schemas.schemas import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    ProductCreate, ProductUpdate, ProductResponse,
    OrderResponse, OrderStatusUpdate,
    BlogPostCreate, BlogPostUpdate, BlogPostResponse,
    SocialFeedResponse, ImportAsProductRequest,
    PaginatedResponse
)
from app.services.facebook_sync import get_fb_service

router = APIRouter(prefix="/admin", tags=["Admin"])


# =====================================================
# CATEGORIES
# =====================================================
@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(
    include_inactive: bool = False,
    db: Client = Depends(get_supabase_admin)
):
    """List all categories (admin view includes inactive)."""
    query = db.table("categories").select("*").order("sort_order")
    if not include_inactive:
        query = query.eq("is_active", True)
    
    result = query.execute()
    return result.data


@router.post("/categories", response_model=CategoryResponse)
async def create_category(
    category: CategoryCreate,
    db: Client = Depends(get_supabase_admin)
):
    """Create a new category."""
    result = db.table("categories").insert(category.model_dump()).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create category")
    return result.data[0]


@router.get("/categories/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: UUID,
    db: Client = Depends(get_supabase_admin)
):
    """Get a single category by ID."""
    result = db.table("categories").select("*").eq("id", str(category_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Category not found")
    return result.data[0]


@router.patch("/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    category: CategoryUpdate,
    db: Client = Depends(get_supabase_admin)
):
    """Update a category."""
    update_data = category.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = db.table("categories").update(update_data).eq("id", str(category_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Category not found")
    return result.data[0]


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: UUID,
    db: Client = Depends(get_supabase_admin)
):
    """Delete a category."""
    db.table("categories").delete().eq("id", str(category_id)).execute()
    return {"message": "Category deleted"}


# =====================================================
# PRODUCTS
# =====================================================
@router.get("/products", response_model=PaginatedResponse)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category_id: Optional[UUID] = None,
    is_published: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    search: Optional[str] = None,
    db: Client = Depends(get_supabase_admin)
):
    """List products with filtering and pagination."""
    query = db.table("products").select("*", count="exact")
    
    if category_id:
        query = query.eq("category_id", str(category_id))
    if is_published is not None:
        query = query.eq("is_published", is_published)
    if is_featured is not None:
        query = query.eq("is_featured", is_featured)
    if search:
        query = query.or_(f"name_vi.ilike.%{search}%,name_en.ilike.%{search}%,sku.ilike.%{search}%")
    
    # Pagination
    offset = (page - 1) * page_size
    query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)
    
    result = query.execute()
    total = result.count or 0
    
    return PaginatedResponse(
        items=result.data,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.post("/products", response_model=ProductResponse)
async def create_product(
    product: ProductCreate,
    db: Client = Depends(get_supabase_admin)
):
    """Create a new product."""
    data = product.model_dump()
    # Convert images list to JSON-serializable format
    data["images"] = [img.model_dump() if hasattr(img, 'model_dump') else img for img in data.get("images", [])]
    
    result = db.table("products").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create product")
    return result.data[0]


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    db: Client = Depends(get_supabase_admin)
):
    """Get a single product by ID."""
    result = db.table("products").select("*").eq("id", str(product_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return result.data[0]


@router.patch("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    product: ProductUpdate,
    db: Client = Depends(get_supabase_admin)
):
    """Update a product."""
    update_data = product.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Handle images serialization
    if "images" in update_data and update_data["images"]:
        update_data["images"] = [img.model_dump() if hasattr(img, 'model_dump') else img for img in update_data["images"]]
    
    result = db.table("products").update(update_data).eq("id", str(product_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return result.data[0]


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: UUID,
    db: Client = Depends(get_supabase_admin)
):
    """Delete a product."""
    db.table("products").delete().eq("id", str(product_id)).execute()
    return {"message": "Product deleted"}


# =====================================================
# ORDERS
# =====================================================
@router.get("/orders", response_model=PaginatedResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    order_status: Optional[str] = None,
    payment_status: Optional[str] = None,
    db: Client = Depends(get_supabase_admin)
):
    """List orders with filtering and pagination."""
    query = db.table("orders").select("*", count="exact")
    
    if order_status:
        query = query.eq("order_status", order_status)
    if payment_status:
        query = query.eq("payment_status", payment_status)
    
    offset = (page - 1) * page_size
    query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)
    
    result = query.execute()
    total = result.count or 0
    
    return PaginatedResponse(
        items=result.data,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: UUID,
    db: Client = Depends(get_supabase_admin)
):
    """Get order with items."""
    order = db.table("orders").select("*").eq("id", str(order_id)).execute()
    if not order.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    items = db.table("order_items").select("*").eq("order_id", str(order_id)).execute()
    
    order_data = order.data[0]
    order_data["items"] = items.data
    return order_data


@router.patch("/orders/{order_id}", response_model=OrderResponse)
async def update_order_status(
    order_id: UUID,
    update: OrderStatusUpdate,
    db: Client = Depends(get_supabase_admin)
):
    """Update order status."""
    update_data = update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = db.table("orders").update(update_data).eq("id", str(order_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Order not found")
    
    items = db.table("order_items").select("*").eq("order_id", str(order_id)).execute()
    order_data = result.data[0]
    order_data["items"] = items.data
    return order_data


# =====================================================
# BLOG POSTS
# =====================================================
@router.get("/blog", response_model=PaginatedResponse)
async def list_blog_posts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    is_published: Optional[bool] = None,
    db: Client = Depends(get_supabase_admin)
):
    """List blog posts."""
    query = db.table("blog_posts").select("*", count="exact")
    
    if is_published is not None:
        query = query.eq("is_published", is_published)
    
    offset = (page - 1) * page_size
    query = query.order("created_at", desc=True).range(offset, offset + page_size - 1)
    
    result = query.execute()
    total = result.count or 0
    
    return PaginatedResponse(
        items=result.data,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.post("/blog", response_model=BlogPostResponse)
async def create_blog_post(
    post: BlogPostCreate,
    db: Client = Depends(get_supabase_admin)
):
    """Create a new blog post."""
    data = post.model_dump()
    if data.get("is_published"):
        from datetime import datetime
        data["published_at"] = datetime.utcnow().isoformat()
    
    result = db.table("blog_posts").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create blog post")
    return result.data[0]


@router.get("/blog/{post_id}", response_model=BlogPostResponse)
async def get_blog_post(
    post_id: UUID,
    db: Client = Depends(get_supabase_admin)
):
    """Get a single blog post."""
    result = db.table("blog_posts").select("*").eq("id", str(post_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return result.data[0]


@router.patch("/blog/{post_id}", response_model=BlogPostResponse)
async def update_blog_post(
    post_id: UUID,
    post: BlogPostUpdate,
    db: Client = Depends(get_supabase_admin)
):
    """Update a blog post."""
    update_data = post.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    # Set published_at when publishing
    if update_data.get("is_published"):
        from datetime import datetime
        update_data["published_at"] = datetime.utcnow().isoformat()
    
    result = db.table("blog_posts").update(update_data).eq("id", str(post_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return result.data[0]


@router.delete("/blog/{post_id}")
async def delete_blog_post(
    post_id: UUID,
    db: Client = Depends(get_supabase_admin)
):
    """Delete a blog post."""
    db.table("blog_posts").delete().eq("id", str(post_id)).execute()
    return {"message": "Blog post deleted"}


# =====================================================
# SOCIAL FEED (Facebook Sync)
# =====================================================
@router.post("/social/sync")
async def sync_facebook(
    db: Client = Depends(get_supabase_admin)
):
    """Trigger Facebook sync to fetch latest posts/photos."""
    fb = get_fb_service()
    
    # Fetch photos and posts
    photos = fb.fetch_page_photos(limit=50)
    posts = fb.fetch_page_posts(limit=50)
    all_items = photos + posts
    
    if not all_items:
        return {"message": "No new items found", "synced": 0}
    
    # Upsert into social_feed
    synced_count = 0
    for item in all_items:
        # Check if already exists
        existing = db.table("social_feed").select("id").eq("post_id", item["post_id"]).execute()
        if existing.data:
            continue
        
        db.table("social_feed").insert(item).execute()
        synced_count += 1
    
    # Update last sync time in settings
    from datetime import datetime
    db.table("settings").update({
        "value": {"page_id": fb.page_id, "last_sync": datetime.utcnow().isoformat(), "auto_sync": False}
    }).eq("key", "fb_sync").execute()
    
    return {"message": f"Synced {synced_count} new items", "synced": synced_count}


@router.get("/social/feed", response_model=PaginatedResponse)
async def list_social_feed(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    platform: Optional[str] = None,
    imported: Optional[bool] = None,
    db: Client = Depends(get_supabase_admin)
):
    """List synced social media posts."""
    query = db.table("social_feed").select("*", count="exact")
    
    if platform:
        query = query.eq("platform", platform)
    if imported is not None:
        query = query.eq("is_imported_as_product", imported)
    
    offset = (page - 1) * page_size
    query = query.order("posted_at", desc=True).range(offset, offset + page_size - 1)
    
    result = query.execute()
    total = result.count or 0
    
    return PaginatedResponse(
        items=result.data,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )


@router.post("/social/{feed_id}/import-product", response_model=ProductResponse)
async def import_as_product(
    feed_id: UUID,
    data: ImportAsProductRequest,
    db: Client = Depends(get_supabase_admin)
):
    """Import a social feed item as a new product."""
    # Get the feed item
    feed = db.table("social_feed").select("*").eq("id", str(feed_id)).execute()
    if not feed.data:
        raise HTTPException(status_code=404, detail="Social feed item not found")
    
    feed_item = feed.data[0]
    
    # Create slug from name
    import re
    slug = re.sub(r'[^a-z0-9]+', '-', data.name_vi.lower()).strip('-')
    
    # Create product
    product_data = {
        "slug": slug,
        "name_vi": data.name_vi,
        "name_en": data.name_en,
        "price": data.price,
        "category_id": str(data.category_id) if data.category_id else None,
        "images": [{"url": feed_item["image_url"], "alt": data.name_vi, "sort_order": 0}],
        "description_vi": feed_item.get("caption"),
        "fb_post_id": feed_item["post_id"],
        "is_published": False  # Draft by default
    }
    
    result = db.table("products").insert(product_data).execute()
    if not result.data:
        raise HTTPException(status_code=400, detail="Failed to create product")
    
    # Mark feed item as imported
    db.table("social_feed").update({
        "is_imported_as_product": True,
        "imported_product_id": result.data[0]["id"]
    }).eq("id", str(feed_id)).execute()
    
    return result.data[0]


# =====================================================
# SETTINGS
# =====================================================
@router.get("/settings")
async def get_settings(
    db: Client = Depends(get_supabase_admin)
):
    """Get all settings."""
    result = db.table("settings").select("*").execute()
    # Convert to dict
    return {item["key"]: item["value"] for item in result.data}


@router.patch("/settings/{key}")
async def update_setting(
    key: str,
    value: dict,
    db: Client = Depends(get_supabase_admin)
):
    """Update a specific setting."""
    result = db.table("settings").update({"value": value}).eq("key", key).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Setting not found")
    return result.data[0]
