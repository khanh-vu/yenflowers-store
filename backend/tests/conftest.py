"""
Test fixtures and configuration for pytest.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, patch
import os

# Set test environment variables before importing app
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "test-anon-key"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test-service-key"


@pytest.fixture
def mock_supabase():
    """Mock Supabase client for testing."""
    mock = MagicMock()
    
    # Default empty responses
    mock.table.return_value.select.return_value.execute.return_value.data = []
    mock.table.return_value.select.return_value.execute.return_value.count = 0
    mock.table.return_value.insert.return_value.execute.return_value.data = []
    mock.table.return_value.update.return_value.execute.return_value.data = []
    mock.table.return_value.delete.return_value.execute.return_value.data = []
    
    return mock


@pytest.fixture
def client(mock_supabase):
    """Test client with mocked Supabase."""
    with patch("app.database.supabase", mock_supabase), \
         patch("app.database.supabase_admin", mock_supabase):
        from app.main import app
        with TestClient(app) as test_client:
            yield test_client


@pytest.fixture
def sample_category():
    """Sample category data."""
    return {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "slug": "sinh-nhat",
        "name_vi": "Sinh Nhật",
        "name_en": "Birthday",
        "description_vi": "Hoa sinh nhật",
        "description_en": "Birthday flowers",
        "image_url": "https://example.com/birthday.jpg",
        "parent_id": None,
        "sort_order": 1,
        "is_active": True,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_product():
    """Sample product data."""
    return {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "sku": "HOA-001",
        "slug": "hoa-hong-do",
        "name_vi": "Hoa Hồng Đỏ",
        "name_en": "Red Roses",
        "description_vi": "Bó hoa hồng đỏ tươi",
        "description_en": "Fresh red rose bouquet",
        "short_description_vi": "Hoa hồng đỏ",
        "short_description_en": "Red roses",
        "price": 450000,
        "sale_price": None,
        "cost_price": 200000,
        "category_id": "550e8400-e29b-41d4-a716-446655440001",
        "images": [{"url": "https://example.com/rose.jpg", "alt": "Red roses", "sort_order": 0}],
        "tags": ["hoa hong", "tinh yeu"],
        "stock_quantity": 50,
        "is_featured": True,
        "is_published": True,
        "seo_title": "Hoa Hồng Đỏ - YenFlowers",
        "seo_description": "Mua hoa hồng đỏ tươi tại YenFlowers",
        "fb_post_id": None,
        "fb_synced_at": None,
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_order():
    """Sample order data."""
    return {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "order_number": "YF-20250101-001",
        "user_id": None,
        "guest_email": "test@example.com",
        "guest_phone": "0901234567",
        "shipping_address": {
            "full_name": "Nguyen Van A",
            "phone": "0901234567",
            "address_line": "123 Nguyen Hue",
            "ward": "Ben Nghe",
            "district": "1",
            "city": "Hồ Chí Minh"
        },
        "shipping_fee": 25000,
        "subtotal": 450000,
        "discount_amount": 0,
        "total": 475000,
        "order_status": "pending",
        "payment_status": "pending",
        "payment_method": "cod",
        "customer_note": "Giao trước 5h chiều",
        "delivery_date": "2025-01-02",
        "delivery_time_slot": "14:00-17:00",
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
    }


@pytest.fixture
def sample_blog_post():
    """Sample blog post data."""
    return {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "slug": "cach-cham-soc-hoa-hong",
        "title_vi": "Cách chăm sóc hoa hồng",
        "title_en": "How to care for roses",
        "excerpt_vi": "Hướng dẫn chăm sóc hoa hồng tươi lâu",
        "excerpt_en": "Guide to keep roses fresh longer",
        "content_vi": "Nội dung chi tiết...",
        "content_en": "Detailed content...",
        "featured_image": "https://example.com/blog.jpg",
        "author_id": None,
        "tags": ["hoa hong", "cham soc"],
        "is_published": True,
        "published_at": "2025-01-01T00:00:00Z",
        "view_count": 100,
        "seo_title": "Cách chăm sóc hoa hồng - YenFlowers",
        "seo_description": "Hướng dẫn chăm sóc hoa hồng",
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
    }
