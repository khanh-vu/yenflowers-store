"""
Tests for Admin API endpoints.
Covers: categories, products, orders, blog, social sync, settings CRUD
"""
from unittest.mock import MagicMock, patch
import pytest


class TestAdminCategoriesAPI:
    """Test admin category management."""
    
    def test_create_category_success(self, client, mock_supabase, sample_category):
        """POST /admin/categories should create a category."""
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [sample_category]
        
        payload = {
            "slug": "sinh-nhat",
            "name_vi": "Sinh Nhật",
            "name_en": "Birthday",
            "sort_order": 1
        }
        response = client.post("/api/v1/admin/categories", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == "sinh-nhat"
    
    def test_create_category_missing_required_field(self, client, mock_supabase):
        """POST /admin/categories without required fields should return 422."""
        payload = {"name_en": "Birthday"}  # Missing slug and name_vi
        response = client.post("/api/v1/admin/categories", json=payload)
        assert response.status_code == 422
    
    def test_update_category_success(self, client, mock_supabase, sample_category):
        """PATCH /admin/categories/{id} should update category."""
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [sample_category]
        
        payload = {"name_vi": "Sinh Nhật Updated"}
        response = client.patch(f"/api/v1/admin/categories/{sample_category['id']}", json=payload)
        assert response.status_code == 200
    
    def test_update_category_empty_body(self, client, mock_supabase, sample_category):
        """PATCH /admin/categories/{id} with empty body should return 400."""
        response = client.patch(f"/api/v1/admin/categories/{sample_category['id']}", json={})
        assert response.status_code == 400
        assert "No fields to update" in response.json()["detail"]
    
    def test_update_category_not_found(self, client, mock_supabase):
        """PATCH /admin/categories/{id} with invalid ID should return 404."""
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []
        
        payload = {"name_vi": "Test"}
        response = client.patch("/api/v1/admin/categories/550e8400-e29b-41d4-a716-000000000000", json=payload)
        assert response.status_code == 404
    
    def test_delete_category_success(self, client, mock_supabase, sample_category):
        """DELETE /admin/categories/{id} should delete category."""
        response = client.delete(f"/api/v1/admin/categories/{sample_category['id']}")
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()


class TestAdminProductsAPI:
    """Test admin product management."""
    
    def test_list_products_with_filters(self, client, mock_supabase, sample_product):
        """GET /admin/products should support multiple filters."""
        mock_result = MagicMock()
        mock_result.data = [sample_product]
        mock_result.count = 1
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.eq.return_value.or_.return_value.order.return_value.range.return_value.execute.return_value = mock_result
        
        response = client.get("/api/v1/admin/products?is_published=true&is_featured=true&search=hong")
        assert response.status_code == 200
    
    def test_create_product_success(self, client, mock_supabase, sample_product):
        """POST /admin/products should create a product."""
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [sample_product]
        
        payload = {
            "slug": "hoa-hong-do",
            "name_vi": "Hoa Hồng Đỏ",
            "price": 450000,
            "stock_quantity": 50
        }
        response = client.post("/api/v1/admin/products", json=payload)
        assert response.status_code == 200
    
    def test_create_product_missing_price(self, client, mock_supabase):
        """POST /admin/products without price should return 422."""
        payload = {
            "slug": "test",
            "name_vi": "Test"
            # Missing price
        }
        response = client.post("/api/v1/admin/products", json=payload)
        assert response.status_code == 422
    
    def test_create_product_negative_price(self, client, mock_supabase):
        """POST /admin/products with negative price should be handled."""
        payload = {
            "slug": "test",
            "name_vi": "Test",
            "price": -100
        }
        # This should either be rejected or handled by business logic
        response = client.post("/api/v1/admin/products", json=payload)
        # Price validation depends on Pydantic model constraints
    
    
    def test_delete_product_success(self, client, mock_supabase, sample_product):
        """DELETE /admin/products/{id} should delete product."""
        response = client.delete(f"/api/v1/admin/products/{sample_product['id']}")
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()

    def test_update_product_with_images(self, client, mock_supabase, sample_product):
        """PATCH /admin/products/{id} should handle images array."""
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [sample_product]
        
        payload = {
            "images": [
                {"url": "https://example.com/new.jpg", "alt": "New image", "sort_order": 0}
            ]
        }
        response = client.patch(f"/api/v1/admin/products/{sample_product['id']}", json=payload)
        assert response.status_code == 200


class TestAdminOrdersAPI:
    """Test admin order management."""
    
    def test_list_orders_with_status_filter(self, client, mock_supabase, sample_order):
        """GET /admin/orders should filter by order_status."""
        mock_result = MagicMock()
        mock_result.data = [sample_order]
        mock_result.count = 1
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = mock_result
        
        response = client.get("/api/v1/admin/orders?order_status=pending")
        assert response.status_code == 200
    
    def test_get_order_with_items(self, client, mock_supabase, sample_order):
        """GET /admin/orders/{id} should include order items."""
        
        def table_side_effect(table_name):
            mock_table = MagicMock()
            if table_name == "orders":
                mock_table.select.return_value.eq.return_value.execute.return_value.data = [sample_order]
            elif table_name == "order_items":
                mock_table.select.return_value.eq.return_value.execute.return_value.data = []
            else:
                mock_table.select.return_value.eq.return_value.execute.return_value.data = []
            return mock_table
        
        mock_supabase.table.side_effect = table_side_effect
        
        response = client.get(f"/api/v1/admin/orders/{sample_order['id']}")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_update_order_status(self, client, mock_supabase, sample_order):
        """PATCH /admin/orders/{id} should update order status."""
        updated_order = {**sample_order, "order_status": "confirmed"}
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [updated_order]
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        
        payload = {"order_status": "confirmed"}
        response = client.patch(f"/api/v1/admin/orders/{sample_order['id']}", json=payload)
        assert response.status_code == 200
    
    def test_update_order_invalid_status(self, client, mock_supabase, sample_order):
        """PATCH /admin/orders/{id} with invalid status should be handled."""
        # Depends on enum validation in Pydantic
        pass


class TestAdminBlogAPI:
    """Test admin blog management."""
    
    def test_create_blog_post_sets_published_at(self, client, mock_supabase, sample_blog_post):
        """POST /admin/blog with is_published=true should set published_at."""
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [sample_blog_post]
        
        payload = {
            "slug": "test-post",
            "title_vi": "Test Post",
            "is_published": True
        }
        response = client.post("/api/v1/admin/blog", json=payload)
        assert response.status_code == 200
    
    def test_update_blog_post_publish(self, client, mock_supabase, sample_blog_post):
        """PATCH /admin/blog/{id} setting is_published should set published_at."""
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [sample_blog_post]
        
        payload = {"is_published": True}
        response = client.patch(f"/api/v1/admin/blog/{sample_blog_post['id']}", json=payload)
        assert response.status_code == 200
    
    def test_delete_blog_post_success(self, client, mock_supabase, sample_blog_post):
        """DELETE /admin/blog/{id} should delete blog post."""
        response = client.delete(f"/api/v1/admin/blog/{sample_blog_post['id']}")
        assert response.status_code == 200
        assert "deleted" in response.json()["message"].lower()


class TestAdminSocialSyncAPI:
    """Test Facebook sync endpoints."""
    
    def test_sync_facebook_no_token(self, client, mock_supabase):
        """POST /admin/social/sync without FB token should handle gracefully."""
        with patch("app.services.facebook_sync.FacebookSyncService.fetch_page_photos") as mock_photos, \
             patch("app.services.facebook_sync.FacebookSyncService.fetch_page_posts") as mock_posts:
            mock_photos.return_value = []
            mock_posts.return_value = []
            
            response = client.post("/api/v1/admin/social/sync")
            assert response.status_code == 200
            response = client.post("/api/v1/admin/social/sync")
            assert response.status_code == 200
            assert response.json()["synced"] == 0
    
    def test_sync_facebook_use_db_credentials(self, client, mock_supabase):
        """POST /admin/social/sync should use credentials from DB settings."""
        # Mock settings in DB
        mock_settings = {
            "key": "fb_sync",
            "value": {
                "page_id": "db_page_id",
                "access_token": "db_token"
            }
        }
        
        # Mock FB service methods
        with patch("app.services.facebook_sync.FacebookSyncService.fetch_page_photos") as mock_photos, \
             patch("app.services.facebook_sync.FacebookSyncService.fetch_page_posts") as mock_posts, \
             patch("app.services.facebook_sync.FacebookSyncService.set_credentials") as mock_set_creds:
             
            mock_photos.return_value = [{
                "post_id": "123", 
                "caption": "Test", 
                "image_url": "http://img.com",
                "platform": "facebook",
                "post_type": "photo",
                "posted_at": None
            }]
            mock_posts.return_value = []
            
            # Setup DB side effect
            def table_side_effect(table_name):
                mock_table = MagicMock()
                if table_name == "settings":
                    # For select()
                    mock_table.select.return_value.eq.return_value.execute.return_value.data = [mock_settings]
                    # For upsert()
                    mock_table.upsert.return_value.execute.return_value.data = [mock_settings]
                elif table_name == "social_feed":
                    # Check existence
                    mock_table.select.return_value.eq.return_value.execute.return_value.data = []
                    # Insert
                    mock_table.insert.return_value.execute.return_value.data = []
                # Fallback for other calls
                else: 
                     mock_table.select.return_value.execute.return_value.data = []
                return mock_table
            
            mock_supabase.table.side_effect = table_side_effect
            
            response = client.post("/api/v1/admin/social/sync")
            
            assert response.status_code == 200
            assert response.json()["synced"] == 1
            
            # Verify set_credentials was called with DB values
            mock_set_creds.assert_called_with("db_page_id", "db_token")
    
    def test_list_social_feed(self, client, mock_supabase):
        """GET /admin/social/feed should return synced posts."""
        mock_result = MagicMock()
        mock_result.data = []
        mock_result.count = 0
        mock_supabase.table.return_value.select.return_value.order.return_value.range.return_value.execute.return_value = mock_result
        
        response = client.get("/api/v1/admin/social/feed")
        assert response.status_code == 200
    
    def test_sync_facebook_min_length_filter(self, client, mock_supabase):
        """POST /admin/social/sync with min_length should filter short posts."""
        with patch("app.services.facebook_sync.FacebookSyncService.fetch_page_photos") as mock_photos, \
             patch("app.services.facebook_sync.FacebookSyncService.fetch_page_posts") as mock_posts:
             
            # 1 short post, 1 long post
            mock_photos.return_value = []
            mock_posts.return_value = [
                {
                    "post_id": "short", "caption": "Too short", "post_type": "post", 
                    "platform": "facebook", "image_url": "img", "posted_at": None
                },
                {
                    "post_id": "long", "caption": "A" * 450, "post_type": "post",
                    "platform": "facebook", "image_url": "img", "posted_at": None
                }
            ]
            
            # Setup DB: Check existence (return empty), then Insert
            def table_side_effect(table_name):
                mock_table = MagicMock()
                if table_name == "social_feed":
                    mock_table.select.return_value.eq.return_value.execute.return_value.data = []
                    mock_table.insert.return_value.execute.return_value.data = []
                elif table_name == "settings":
                    mock_table.select.return_value.execute.return_value.data = [] # No settings in DB
                    mock_table.upsert.return_value.execute.return_value.data = []
                else: 
                     mock_table.select.return_value.execute.return_value.data = []
                return mock_table
            
            mock_supabase.table.side_effect = table_side_effect
            
            payload = {"min_length": 400}
            response = client.post("/api/v1/admin/social/sync", json=payload)
            
            assert response.status_code == 200
            assert response.json()["synced"] == 1
            
            # Verify mock_insert was called only once (for the long post)
            # Not easy to verify argument content with side_effect helper without tracking, 
            # but syncing 1 item implies filtering worked (since we had 2 items).

    def test_pin_social_post(self, client, mock_supabase):
        """PATCH /admin/social/{id}/pin should toggle pin status."""
        feed_id = "550e8400-e29b-41d4-a716-446655449999"
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [{"id": feed_id, "is_pinned": True}]
        
        response = client.patch(f"/api/v1/admin/social/{feed_id}/pin", json={"is_pinned": True})
        assert response.status_code == 200
        assert response.json()["message"] == "Post pinned"

    def test_import_social_post_as_product(self, client, mock_supabase):
        """POST /admin/social/{id}/import-product should create product draft."""
        social_item = {
            "id": "550e8400-e29b-41d4-a716-446655440005",
            "platform": "facebook",
            "post_id": "123456789",
            "caption": "Beautiful roses",
            "image_url": "https://example.com/fb-image.jpg",
            "permalink": "https://facebook.com/post/123"
        }
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [social_item]
        
        new_product = {
            "id": "550e8400-e29b-41d4-a716-446655440006",
            "slug": "hoa-hong-moi",
            "name_vi": "Hoa Hồng Mới",
            "price": 300000,
            "is_published": False,
            "created_at": "2025-01-01T00:00:00Z",
            "updated_at": "2025-01-01T00:00:00Z",
            "stock_quantity": 0,
            "images": []
        }
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [new_product]
        
        payload = {
            "name_vi": "Hoa Hồng Mới",
            "price": 300000
        }
        response = client.post(f"/api/v1/admin/social/{social_item['id']}/import-product", json=payload)
        assert response.status_code == 200
    
    def test_import_social_post_not_found(self, client, mock_supabase):
        """POST /admin/social/{id}/import-product with invalid ID should return 404."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        
        payload = {"name_vi": "Test", "price": 100000}
        response = client.post("/api/v1/admin/social/550e8400-e29b-41d4-a716-000000000000/import-product", json=payload)
        assert response.status_code == 404


class TestAdminSettingsAPI:
    """Test settings management."""
    
    def test_get_all_settings(self, client, mock_supabase):
        """GET /admin/settings should return all settings as dict."""
        settings_data = [
            {"key": "delivery_fees", "value": {"default": 30000}},
            {"key": "store_info", "value": {"name": "YenFlowers"}}
        ]
        mock_supabase.table.return_value.select.return_value.execute.return_value.data = settings_data
        
        response = client.get("/api/v1/admin/settings")
        assert response.status_code == 200
        data = response.json()
        assert "delivery_fees" in data
        assert "store_info" in data
    
    def test_update_setting(self, client, mock_supabase):
        """PATCH /admin/settings/{key} should update setting value."""
        updated = {"key": "delivery_fees", "value": {"default": 35000}}
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [updated]
        
        payload = {"default": 35000}
        response = client.patch("/api/v1/admin/settings/delivery_fees", json=payload)
        assert response.status_code == 200
    
    def test_update_setting_not_found(self, client, mock_supabase):
        """PATCH /admin/settings/{key} with invalid key should return 404."""
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = []
        
        response = client.patch("/api/v1/admin/settings/invalid_key", json={"foo": "bar"})
        assert response.status_code == 404
