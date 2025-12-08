from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID


# =====================================================
# Category Schemas
# =====================================================
class CategoryBase(BaseModel):
    slug: str
    name_vi: str
    name_en: Optional[str] = None
    description_vi: Optional[str] = None
    description_en: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[UUID] = None
    sort_order: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    slug: Optional[str] = None
    name_vi: Optional[str] = None
    name_en: Optional[str] = None
    description_vi: Optional[str] = None
    description_en: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[UUID] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# Product Schemas
# =====================================================
class ProductImage(BaseModel):
    url: str
    alt: Optional[str] = None
    sort_order: int = 0


class ProductBase(BaseModel):
    sku: Optional[str] = None
    slug: str
    name_vi: str
    name_en: Optional[str] = None
    description_vi: Optional[str] = None
    description_en: Optional[str] = None
    short_description_vi: Optional[str] = None
    short_description_en: Optional[str] = None
    price: int  # VND
    sale_price: Optional[int] = None
    cost_price: Optional[int] = None
    category_id: Optional[UUID] = None
    images: list[ProductImage] = []
    tags: list[str] = []
    stock_quantity: int = 0
    is_featured: bool = False
    is_published: bool = False
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    sku: Optional[str] = None
    slug: Optional[str] = None
    name_vi: Optional[str] = None
    name_en: Optional[str] = None
    description_vi: Optional[str] = None
    description_en: Optional[str] = None
    short_description_vi: Optional[str] = None
    short_description_en: Optional[str] = None
    price: Optional[int] = None
    sale_price: Optional[int] = None
    cost_price: Optional[int] = None
    category_id: Optional[UUID] = None
    images: Optional[list[ProductImage]] = None
    tags: Optional[list[str]] = None
    stock_quantity: Optional[int] = None
    is_featured: Optional[bool] = None
    is_published: Optional[bool] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    
    @field_validator('price', 'sale_price', 'cost_price', mode='before')
    @classmethod
    def coerce_price(cls, v):
        if v is None:
            return None
        return int(v) if isinstance(v, str) else v


class ProductResponse(ProductBase):
    id: UUID
    fb_post_id: Optional[str] = None
    fb_synced_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# Order Schemas
# =====================================================
class ShippingAddress(BaseModel):
    full_name: str
    phone: str
    address_line: str
    ward: Optional[str] = None
    district: str
    city: str = "Hồ Chí Minh"
    postal_code: Optional[str] = None


class OrderItemCreate(BaseModel):
    product_id: UUID
    variant_id: Optional[UUID] = None
    quantity: int = Field(default=1, gt=0)


class OrderCreate(BaseModel):
    items: list[OrderItemCreate]
    shipping_address: ShippingAddress
    payment_method: str = "cod"
    customer_note: Optional[str] = None
    delivery_date: Optional[str] = None
    delivery_time_slot: Optional[str] = None
    discount_code: Optional[str] = None


class OrderItemResponse(BaseModel):
    id: UUID
    product_id: Optional[UUID]
    product_name: str
    variant_name: Optional[str]
    quantity: int
    unit_price: int
    total_price: int


class OrderResponse(BaseModel):
    id: UUID
    order_number: str
    user_id: Optional[UUID]
    shipping_address: dict
    shipping_fee: int
    subtotal: int
    discount_amount: int
    total: int
    order_status: str
    payment_status: str
    payment_method: Optional[str]
    customer_note: Optional[str]
    delivery_date: Optional[str]
    delivery_time_slot: Optional[str]
    items: list[OrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    order_status: Optional[str] = None
    payment_status: Optional[str] = None
    admin_note: Optional[str] = None


# =====================================================
# Blog Schemas
# =====================================================
class BlogPostBase(BaseModel):
    slug: str
    title_vi: str
    title_en: Optional[str] = None
    excerpt_vi: Optional[str] = None
    excerpt_en: Optional[str] = None
    content_vi: Optional[str] = None
    content_en: Optional[str] = None
    featured_image: Optional[str] = None
    tags: list[str] = []
    is_published: bool = False
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None


class BlogPostCreate(BlogPostBase):
    pass


class BlogPostUpdate(BaseModel):
    slug: Optional[str] = None
    title_vi: Optional[str] = None
    title_en: Optional[str] = None
    excerpt_vi: Optional[str] = None
    excerpt_en: Optional[str] = None
    content_vi: Optional[str] = None
    content_en: Optional[str] = None
    featured_image: Optional[str] = None
    tags: Optional[list[str]] = None
    is_published: Optional[bool] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None


class BlogPostResponse(BlogPostBase):
    id: UUID
    author_id: Optional[UUID]
    published_at: Optional[datetime]
    view_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# Social Feed Schemas
# =====================================================
class SocialFeedResponse(BaseModel):
    id: UUID
    platform: str
    post_id: str
    caption: Optional[str]
    image_url: Optional[str]
    image_urls: list[str] = []
    permalink: Optional[str]
    post_type: Optional[str]
    posted_at: Optional[datetime]
    synced_at: datetime
    is_imported_as_product: bool
    imported_product_id: Optional[UUID]
    is_pinned: bool = False

    class Config:
        from_attributes = True


class ImportAsProductRequest(BaseModel):
    name_vi: str
    name_en: Optional[str] = None
    price: int
    category_id: Optional[UUID] = None


class SocialSyncRequest(BaseModel):
    days_back: Optional[int] = Field(None, description="Sync content from the last N days")
    limit: Optional[int] = Field(25, description="Batch size - posts to fetch per call")
    min_length: Optional[int] = Field(None, description="Minimum caption length to sync")
    reset: Optional[bool] = Field(False, description="Reset cursor and start from beginning")



# =====================================================
# Pagination
# =====================================================
class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int
