"""
Tests for public API endpoints.
Covers: categories, products, blog, search
"""
from unittest.mock import MagicMock, patch


class TestHealthEndpoints:
    """Test health check endpoints."""
    
    def test_root_endpoint(self, client):
        """GET / should return app info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "name" in data
        assert "status" in data
        assert data["status"] == "running"
    
    def test_health_endpoint(self, client):
        """GET /health should return healthy status."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestCategoriesAPI:
    """Test public categories endpoints."""
    
    def test_list_categories_empty(self, client, mock_supabase):
        """GET /categories with no data should return empty list."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = []
        
        response = client.get("/api/v1/categories")
        assert response.status_code == 200
        assert response.json() == []
    
    def test_list_categories_with_data(self, client, mock_supabase, sample_category):
        """GET /categories should return active categories."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [sample_category]
        
        response = client.get("/api/v1/categories")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["slug"] == "sinh-nhat"
        assert data[0]["name_vi"] == "Sinh Nhật"
    
    def test_get_category_by_slug_not_found(self, client, mock_supabase):
        """GET /categories/{slug} with invalid slug should return 404."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
        
        response = client.get("/api/v1/categories/invalid-slug")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    
    def test_get_category_by_slug_success(self, client, mock_supabase, sample_category):
        """GET /categories/{slug} with valid slug should return category."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [sample_category]
        
        response = client.get("/api/v1/categories/sinh-nhat")
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == "sinh-nhat"


class TestProductsAPI:
    """Test public products endpoints."""
    
    def test_list_products_empty(self, client, mock_supabase):
        """GET /products with no data should return empty paginated result."""
        mock_result = MagicMock()
        mock_result.data = []
        mock_result.count = 0
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = mock_result
        
        response = client.get("/api/v1/products")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["page"] == 1
    
    def test_list_products_with_pagination(self, client, mock_supabase, sample_product):
        """GET /products should support pagination."""
        mock_result = MagicMock()
        mock_result.data = [sample_product]
        mock_result.count = 1
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = mock_result
        
        response = client.get("/api/v1/products?page=1&page_size=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["page"] == 1
        assert data["page_size"] == 10
    
    def test_list_products_with_price_filter(self, client, mock_supabase, sample_product):
        """GET /products should filter by price range."""
        mock_result = MagicMock()
        mock_result.data = [sample_product]
        mock_result.count = 1
        mock_supabase.table.return_value.select.return_value.eq.return_value.gte.return_value.lte.return_value.order.return_value.range.return_value.execute.return_value = mock_result
        
        response = client.get("/api/v1/products?min_price=400000&max_price=500000")
        assert response.status_code == 200
    
    def test_list_products_invalid_page(self, client, mock_supabase):
        """GET /products with invalid page should return 422."""
        response = client.get("/api/v1/products?page=0")
        assert response.status_code == 422  # Validation error
    
    def test_list_products_invalid_page_size(self, client, mock_supabase):
        """GET /products with page_size > 50 should return 422."""
        response = client.get("/api/v1/products?page_size=100")
        assert response.status_code == 422
    
    def test_get_featured_products(self, client, mock_supabase, sample_product):
        """GET /products/featured should return featured products."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data = [sample_product]
        
        response = client.get("/api/v1/products/featured")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["is_featured"] == True
    
    def test_get_product_by_slug_not_found(self, client, mock_supabase):
        """GET /products/{slug} with invalid slug should return 404."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
        
        response = client.get("/api/v1/products/invalid-product")
        assert response.status_code == 404
    
    def test_get_product_by_slug_success(self, client, mock_supabase, sample_product):
        """GET /products/{slug} should return product details."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [sample_product]
        
        response = client.get("/api/v1/products/hoa-hong-do")
        assert response.status_code == 200
        data = response.json()
        assert data["slug"] == "hoa-hong-do"
        assert data["price"] == 450000


class TestBlogAPI:
    """Test public blog endpoints."""
    
    def test_list_blog_posts_empty(self, client, mock_supabase):
        """GET /blog with no posts should return empty result."""
        mock_result = MagicMock()
        mock_result.data = []
        mock_result.count = 0
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = mock_result
        
        response = client.get("/api/v1/blog")
        assert response.status_code == 200
        assert response.json()["items"] == []
    
    def test_list_blog_posts_with_data(self, client, mock_supabase, sample_blog_post):
        """GET /blog should return published posts."""
        mock_result = MagicMock()
        mock_result.data = [sample_blog_post]
        mock_result.count = 1
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = mock_result
        
        response = client.get("/api/v1/blog")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
    
    def test_get_blog_post_not_found(self, client, mock_supabase):
        """GET /blog/{slug} with invalid slug should return 404."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = []
        
        response = client.get("/api/v1/blog/invalid-post")
        assert response.status_code == 404
    
    def test_get_blog_post_increments_view_count(self, client, mock_supabase, sample_blog_post):
        """GET /blog/{slug} should increment view count."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [sample_blog_post]
        
        response = client.get("/api/v1/blog/cach-cham-soc-hoa-hong")
        assert response.status_code == 200
        
        # Verify update was called to increment view count
        mock_supabase.table.return_value.update.assert_called()


class TestSearchAPI:
    """Test search endpoint."""
    
    def test_search_requires_query(self, client, mock_supabase):
        """GET /search without query should return 422."""
        response = client.get("/api/v1/search")
        assert response.status_code == 422
    
    def test_search_min_length(self, client, mock_supabase):
        """GET /search with single char should return 422."""
        response = client.get("/api/v1/search?q=a")
        assert response.status_code == 422
    
    def test_search_returns_results(self, client, mock_supabase, sample_product):
        """GET /search should return matching products."""
        mock_result = MagicMock()
        mock_result.data = [sample_product]
        mock_result.count = 1
        mock_supabase.table.return_value.select.return_value.eq.return_value.or_.return_value.range.return_value.execute.return_value = mock_result
        
        response = client.get("/api/v1/search?q=hong")
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
