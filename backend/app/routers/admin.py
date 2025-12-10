"""
Admin API routes for managing products, categories, orders, blog, and settings.
All routes require admin authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from uuid import UUID
from typing import Optional
from supabase import Client

from app.database import get_supabase_admin
from app.schemas.schemas import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    ProductCreate, ProductUpdate, ProductResponse,
    OrderResponse, OrderStatusUpdate,
    BlogPostCreate, BlogPostUpdate, BlogPostResponse,
    SocialFeedResponse, ImportAsProductRequest, BulkImportAsProductRequest, SocialSyncRequest,
    PaginatedResponse
)
from app.services.facebook_sync import get_fb_service
from app.dependencies import get_current_admin

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(get_current_admin)])


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
    
    # Convert UUID to string for database
    if "category_id" in update_data and update_data["category_id"]:
        update_data["category_id"] = str(update_data["category_id"])
    
    try:
        result = db.table("products").update(update_data).eq("id", str(product_id)).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Product not found")
        return result.data[0]
    except Exception as e:
        error_msg = str(e)
        if "foreign key" in error_msg.lower() or "violates" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Category không tồn tại")
        raise HTTPException(status_code=500, detail=str(e))


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
    request: SocialSyncRequest = SocialSyncRequest(),
    db: Client = Depends(get_supabase_admin)
):
    """
    Batch-based Facebook sync.
    Fetches 25 posts per call and stores cursor to resume.
    Call repeatedly until has_more=False to sync all posts.
    """
    fb = get_fb_service()
    
    # Get settings including saved cursor
    settings_result = db.table("settings").select("value").eq("key", "fb_sync").execute()
    fb_settings = settings_result.data[0]["value"] if settings_result.data else {}
    
    # Set credentials from settings
    db_page_id = fb_settings.get("page_id")
    db_token = fb_settings.get("access_token")
    if db_page_id and db_token:
        fb.set_credentials(db_page_id, db_token)
    
    try:
        days_back = request.days_back
        min_length = request.min_length or 0
        batch_size = request.limit or 25  # Default 25 per batch
        
        # Get saved cursor (None means start from beginning)
        saved_cursor = fb_settings.get("sync_cursor")
        
        # Reset cursor if explicitly requested
        if request.reset:
            saved_cursor = None
        
        # Fetch ONE batch of posts
        posts, next_cursor, has_more = fb.fetch_posts_batch(
            batch_size=batch_size,
            cursor=saved_cursor,
            days_back=days_back
        )
        
        # Process and save posts
        synced_count = 0
        updated_count = 0
        
        for item in posts:
            caption = item.get("caption") or ""
            if len(caption) < min_length:
                continue

            existing = db.table("social_feed").select("id").eq("post_id", item["post_id"]).execute()
            
            if existing.data:
                db.table("social_feed").update({
                    "image_urls": item.get("image_urls", []),
                    "post_type": item.get("post_type"),
                }).eq("post_id", item["post_id"]).execute()
                updated_count += 1
            else:
                db.table("social_feed").insert(item).execute()
                synced_count += 1
        
        # Update settings with new cursor
        from datetime import datetime
        new_settings = {
            **fb_settings,
            "page_id": fb.page_id,
            "last_sync": datetime.utcnow().isoformat(),
            "sync_cursor": next_cursor if has_more else None,  # Clear cursor when done
            "sync_in_progress": has_more,
        }
        
        settings_payload = {"key": "fb_sync", "value": new_settings}
        
        if settings_result.data:
            db.table("settings").update(settings_payload).eq("key", "fb_sync").execute()
        else:
            db.table("settings").insert(settings_payload).execute()
        
        # Get total synced count
        total_result = db.table("social_feed").select("id", count="exact").execute()
        total_in_db = total_result.count if hasattr(total_result, 'count') else len(total_result.data)
        
        return {
            "message": f"Batch complete: {synced_count} new, {updated_count} updated",
            "synced": synced_count,
            "updated": updated_count,
            "batch_size": len(posts),
            "has_more": has_more,
            "total_in_db": total_in_db,
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


@router.get("/social/sync-status")
async def get_sync_status(
    refresh_count: bool = False,
    db: Client = Depends(get_supabase_admin)
):
    """
    Get current sync status.
    Set refresh_count=true to fetch real total from Facebook (slower).
    """
    fb = get_fb_service()
    
    # Get settings
    settings_result = db.table("settings").select("value").eq("key", "fb_sync").execute()
    fb_settings = settings_result.data[0]["value"] if settings_result.data else {}
    
    # Set credentials
    db_page_id = fb_settings.get("page_id")
    db_token = fb_settings.get("access_token")
    if db_page_id and db_token:
        fb.set_credentials(db_page_id, db_token)
    
    # Get total posts in database
    total_result = db.table("social_feed").select("id", count="exact").execute()
    total_in_db = total_result.count if hasattr(total_result, 'count') else len(total_result.data)
    
    # Get or refresh FB total count
    fb_total = fb_settings.get("fb_total_posts", 0)
    
    if refresh_count and db_page_id and db_token:
        try:
            fb_total = fb.get_total_posts_count()
            # Store updated count
            fb_settings["fb_total_posts"] = fb_total
            db.table("settings").update({"value": fb_settings}).eq("key", "fb_sync").execute()
        except Exception as e:
            print(f"Failed to get FB count: {e}")
    
    sync_cursor = fb_settings.get("sync_cursor")
    last_sync = fb_settings.get("last_sync")
    
    # Calculate progress
    progress = 0
    if fb_total > 0:
        progress = min(100, (total_in_db / fb_total) * 100)
    
    return {
        "fb_total_posts": fb_total,
        "total_in_db": total_in_db,
        "has_cursor": sync_cursor is not None,
        "progress": round(progress, 1),
        "last_sync": last_sync,
    }


@router.post("/social/sync-all")
async def sync_all_facebook(
    db: Client = Depends(get_supabase_admin)
):
    """
    Sync ALL posts from Facebook in one go using internal batching.
    First fetches total count, then loops through all pages.
    Returns progress updates.
    """
    fb = get_fb_service()
    
    # Get settings
    settings_result = db.table("settings").select("value").eq("key", "fb_sync").execute()
    fb_settings = settings_result.data[0]["value"] if settings_result.data else {}
    
    db_page_id = fb_settings.get("page_id")
    db_token = fb_settings.get("access_token")
    if db_page_id and db_token:
        fb.set_credentials(db_page_id, db_token)
    
    try:
        all_synced = 0
        all_updated = 0
        cursor = None
        batch_num = 0
        total_fetched = 0
        
        # Loop through all pages
        while True:
            batch_num += 1
            posts, next_cursor, has_more = fb.fetch_posts_batch(
                batch_size=50,  # Larger batch for sync-all
                cursor=cursor
            )
            
            total_fetched += len(posts)
            
            for item in posts:
                existing = db.table("social_feed").select("id").eq("post_id", item["post_id"]).execute()
                
                if existing.data:
                    db.table("social_feed").update({
                        "image_urls": item.get("image_urls", []),
                        "post_type": item.get("post_type"),
                    }).eq("post_id", item["post_id"]).execute()
                    all_updated += 1
                else:
                    db.table("social_feed").insert(item).execute()
                    all_synced += 1
            
            cursor = next_cursor
            if not has_more:
                break
        
        # Update settings
        from datetime import datetime
        new_settings = {
            **fb_settings,
            "page_id": fb.page_id,
            "last_sync": datetime.utcnow().isoformat(),
            "sync_cursor": None,
            "sync_in_progress": False,
            "fb_total_posts": total_fetched,
        }
        
        db.table("settings").update({"key": "fb_sync", "value": new_settings}).eq("key", "fb_sync").execute()
        
        return {
            "message": f"Synced all: {all_synced} new, {all_updated} updated",
            "synced": all_synced,
            "updated": all_updated,
            "total_fetched": total_fetched,
            "batches": batch_num,
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


@router.patch("/social/{feed_id}/pin")
async def pin_social_post(
    feed_id: UUID,
    is_pinned: bool = Body(..., embed=True),
    db: Client = Depends(get_supabase_admin)
):
    """Toggle pin status of a social feed item."""
    result = db.table("social_feed").update({"is_pinned": is_pinned}).eq("id", str(feed_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Social feed item not found")
    return {"message": f"Post {'pinned' if is_pinned else 'unpinned'}", "id": str(feed_id)}


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
    
    # Create slug from name - remove Vietnamese accents
    import re
    import unicodedata
    # Normalize and remove Vietnamese diacritics
    name_normalized = unicodedata.normalize('NFD', data.name_vi)
    name_ascii = ''.join(c for c in name_normalized if unicodedata.category(c) != 'Mn')
    name_ascii = name_ascii.replace('đ', 'd').replace('Đ', 'D')
    slug = re.sub(r'[^a-z0-9]+', '-', name_ascii.lower()).strip('-')
    
    # Get all images from feed item (images array or fallback to image_url)
    feed_images = feed_item.get("image_urls") or []
    if not feed_images and feed_item.get("image_url"):
        feed_images = [{"url": feed_item["image_url"]}]
    
    # Create product images array with all feed images
    product_images = []
    for i, img in enumerate(feed_images):
        if isinstance(img, dict):
            url = img.get("url")
        else:
            url = img
            
        if url:
            product_images.append({
                "url": url, 
                "alt": data.name_vi, 
                "sort_order": i
            })
    
    # Create product
    product_data = {
        "slug": slug,
        "name_vi": data.name_vi,
        "name_en": data.name_en,
        "price": data.price,
        "category_id": str(data.category_id) if data.category_id else None,
        "images": product_images,
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


@router.post("/social/bulk-import")
async def bulk_import_as_products(
    data: BulkImportAsProductRequest,
    db: Client = Depends(get_supabase_admin)
):
    """
    Bulk import multiple social feed items as products.
    Category is required, price is optional (defaults to 0).
    """
    import re
    import unicodedata
    
    imported = []
    failed = []
    
    for item in data.items:
        try:
            # Get the feed item
            feed = db.table("social_feed").select("*").eq("id", str(item.feed_id)).execute()
            if not feed.data:
                failed.append({"feed_id": str(item.feed_id), "error": "Feed item not found"})
                continue
                
            feed_item = feed.data[0]
            
            # Skip if already imported
            if feed_item.get("is_imported_as_product"):
                failed.append({"feed_id": str(item.feed_id), "error": "Already imported"})
                continue
            
            # Create slug from name - remove Vietnamese accents
            name_normalized = unicodedata.normalize('NFD', item.name_vi)
            name_ascii = ''.join(c for c in name_normalized if unicodedata.category(c) != 'Mn')
            name_ascii = name_ascii.replace('đ', 'd').replace('Đ', 'D')
            slug = re.sub(r'[^a-z0-9]+', '-', name_ascii.lower()).strip('-')
            
            # Ensure unique slug by appending timestamp
            from datetime import datetime
            slug = f"{slug}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Get all images from feed item
            feed_images = feed_item.get("image_urls") or []
            if not feed_images and feed_item.get("image_url"):
                feed_images = [feed_item["image_url"]]
            
            # Create product images array
            product_images = []
            for i, img in enumerate(feed_images):
                if isinstance(img, dict):
                    url = img.get("url")
                else:
                    url = img
                    
                if url:
                    product_images.append({
                        "url": url, 
                        "alt": item.name_vi, 
                        "sort_order": i
                    })
            
            # Create product with category (price defaults to 0 if not provided)
            product_data = {
                "slug": slug,
                "name_vi": item.name_vi,
                "name_en": item.name_en,
                "price": item.price or 0,
                "category_id": str(data.category_id),
                "images": product_images,
                "description_vi": feed_item.get("caption"),
                "fb_post_id": feed_item["post_id"],
                "is_published": False  # Draft by default
            }
            
            result = db.table("products").insert(product_data).execute()
            if not result.data:
                failed.append({"feed_id": str(item.feed_id), "error": "Failed to create product"})
                continue
            
            # Mark feed item as imported
            db.table("social_feed").update({
                "is_imported_as_product": True,
                "imported_product_id": result.data[0]["id"]
            }).eq("id", str(item.feed_id)).execute()
            
            imported.append({
                "feed_id": str(item.feed_id),
                "product_id": result.data[0]["id"],
                "name": item.name_vi
            })
            
        except Exception as e:
            failed.append({"feed_id": str(item.feed_id), "error": str(e)})
    
    return {
        "message": f"Imported {len(imported)} products, {len(failed)} failed",
        "imported": imported,
        "failed": failed,
        "total_imported": len(imported),
        "total_failed": len(failed)
    }


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
    # Try to update
    result = db.table("settings").update({"value": value}).eq("key", key).execute()
    
    # If not found (no data returned), insert new
    if not result.data:
        result = db.table("settings").insert({"key": key, "value": value}).execute()
        
    return result.data[0]
