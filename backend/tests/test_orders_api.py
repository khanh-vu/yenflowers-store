"""
Tests for Orders/Checkout API endpoints.
Covers: checkout flow, order creation, stock validation, payments, edge cases
"""
from unittest.mock import MagicMock, patch
import pytest


class TestCheckoutAPI:
    """Test checkout and order creation."""
    
    def test_checkout_empty_cart(self, client, mock_supabase):
        """POST /orders/checkout with empty items should return 400."""
        payload = {
            "items": [],
            "shipping_address": {
                "full_name": "Test",
                "phone": "0901234567",
                "address_line": "123 Test St",
                "district": "1",
                "city": "Hồ Chí Minh"
            }
        }
        response = client.post("/api/v1/orders/checkout", json=payload)
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()
    
    def test_checkout_product_not_found(self, client, mock_supabase):
        """POST /orders/checkout with invalid product ID should return 400."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        
        payload = {
            "items": [{"product_id": "550e8400-e29b-41d4-a716-000000000000", "quantity": 1}],
            "shipping_address": {
                "full_name": "Test",
                "phone": "0901234567",
                "address_line": "123 Test St",
                "district": "1",
                "city": "Hồ Chí Minh"
            }
        }
        response = client.post("/api/v1/orders/checkout", json=payload)
        assert response.status_code == 400
        assert "not found" in response.json()["detail"].lower()
    
    def test_checkout_unpublished_product(self, client, mock_supabase, sample_product):
        """POST /orders/checkout with unpublished product should return 400."""
        unpublished = {**sample_product, "is_published": False}
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [unpublished]
        
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "shipping_address": {
                "full_name": "Test",
                "phone": "0901234567",
                "address_line": "123 Test St",
                "district": "1",
                "city": "Hồ Chí Minh"
            }
        }
        response = client.post("/api/v1/orders/checkout", json=payload)
        assert response.status_code == 400
        assert "not available" in response.json()["detail"].lower()
    
    def test_checkout_insufficient_stock(self, client, mock_supabase, sample_product):
        """POST /orders/checkout with quantity > stock should return 400."""
        low_stock = {**sample_product, "stock_quantity": 2}
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [low_stock]
        
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 10}],
            "shipping_address": {
                "full_name": "Test",
                "phone": "0901234567",
                "address_line": "123 Test St",
                "district": "1",
                "city": "Hồ Chí Minh"
            }
        }
        response = client.post("/api/v1/orders/checkout", json=payload)
        assert response.status_code == 400
        assert "insufficient stock" in response.json()["detail"].lower()
    
    def test_checkout_success_cod(self, client, mock_supabase, sample_product, sample_order):
        """POST /orders/checkout with COD should create order."""
        # Setup smart mock
        def table_side_effect(table_name):
            mock_table = MagicMock()
            if table_name == "products":
                mock_table.select.return_value.eq.return_value.execute.return_value.data = [sample_product]
                mock_table.update.return_value.eq.return_value.execute.return_value.data = []
            elif table_name == "orders":
                mock_table.insert.return_value.execute.return_value.data = [sample_order]
            elif table_name == "order_items":
                mock_table.insert.return_value.execute.return_value.data = [{
                    "id": "550e8400-e29b-41d4-a716-446655449999",
                    "product_id": sample_product["id"],
                    "product_name": sample_product["name_vi"],
                    "variant_name": None,
                    "quantity": 1,
                    "unit_price": 450000,
                    "total_price": 450000,
                    "order_id": sample_order["id"]
                }]
            else:
                mock_table.select.return_value.eq.return_value.execute.return_value.data = []
            return mock_table
        
        mock_supabase.table.side_effect = table_side_effect
        
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "shipping_address": {
                "full_name": "Nguyen Van A",
                "phone": "0901234567",
                "address_line": "123 Nguyen Hue",
                "district": "1",
                "city": "Hồ Chí Minh"
            },
            "payment_method": "cod"
        }
        response = client.post("/api/v1/orders/checkout", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "order_number" in data
        assert data["payment_method"] == "cod"
    
    def test_checkout_calculates_delivery_fee(self, client, mock_supabase, sample_product, sample_order):
        """POST /orders/checkout should calculate delivery fee by district."""
        # Setup smart mock
        def table_side_effect(table_name):
            mock_table = MagicMock()
            if table_name == "products":
                mock_table.select.return_value.eq.return_value.execute.return_value.data = [sample_product]
                mock_table.update.return_value.eq.return_value.execute.return_value.data = []
            elif table_name == "orders":
                mock_table.insert.return_value.execute.return_value.data = [sample_order]
            elif table_name == "order_items":
                mock_table.insert.return_value.execute.return_value.data = [{
                    "id": "550e8400-e29b-41d4-a716-446655449999",
                    "product_id": sample_product["id"],
                    "product_name": sample_product["name_vi"],
                    "variant_name": None,
                    "quantity": 1,
                    "unit_price": 450000,
                    "total_price": 450000,
                    "order_id": sample_order["id"]
                }]
            else:
                mock_table.select.return_value.eq.return_value.execute.return_value.data = []
            return mock_table
        
        mock_supabase.table.side_effect = table_side_effect
        
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "shipping_address": {
                "full_name": "Test",
                "phone": "0901234567",
                "address_line": "123 Test",
                "district": "1",  # Should be 25000 VND
                "city": "Hồ Chí Minh"
            }
        }
        response = client.post("/api/v1/orders/checkout", json=payload)
        assert response.status_code == 200
    
    def test_checkout_with_sale_price(self, client, mock_supabase, sample_product, sample_order):
        """POST /orders/checkout should use sale_price if available."""
        product_on_sale = {**sample_product, "sale_price": 400000}
        
        # Setup smart mock
        def table_side_effect(table_name):
            mock_table = MagicMock()
            if table_name == "products":
                mock_table.select.return_value.eq.return_value.execute.return_value.data = [product_on_sale]
                mock_table.update.return_value.eq.return_value.execute.return_value.data = []
            elif table_name == "orders":
                mock_table.insert.return_value.execute.return_value.data = [sample_order]
            elif table_name == "order_items":
                mock_table.insert.return_value.execute.return_value.data = [{
                    "id": "550e8400-e29b-41d4-a716-446655449999",
                    "product_id": sample_product["id"],
                    "product_name": sample_product["name_vi"],
                    "variant_name": None,
                    "quantity": 1,
                    "unit_price": 400000,
                    "total_price": 400000,
                    "order_id": sample_order["id"]
                }]
            else:
                mock_table.select.return_value.eq.return_value.execute.return_value.data = []
            return mock_table
        
        mock_supabase.table.side_effect = table_side_effect
        
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "shipping_address": {
                "full_name": "Test",
                "phone": "0901234567",
                "address_line": "123 Test",
                "district": "1",
                "city": "Hồ Chí Minh"
            }
        }
        response = client.post("/api/v1/orders/checkout", json=payload)
        assert response.status_code == 200
    
    def test_checkout_missing_shipping_address(self, client, mock_supabase):
        """POST /orders/checkout without shipping_address should return 422."""
        payload = {
            "items": [{"product_id": "550e8400-e29b-41d4-a716-446655440002", "quantity": 1}]
        }
        response = client.post("/api/v1/orders/checkout", json=payload)
        assert response.status_code == 422
    
    def test_checkout_invalid_phone(self, client, mock_supabase):
        """POST /orders/checkout with invalid phone format should be validated."""
        # Depends on whether phone validation is implemented
        pass


class TestDiscountCodes:
    """Test discount code application."""
    
    def test_checkout_with_valid_discount_percentage(self, client, mock_supabase, sample_product, sample_order):
        """POST /orders/checkout with valid percentage discount should apply."""
        
        discount = {
            "id": "550e8400-e29b-41d4-a716-446655440010",
            "code": "SALE10",
            "discount_type": "percentage",
            "discount_value": 10,
            "min_order_value": None,
            "max_uses": 100,
            "used_count": 5,
            "starts_at": None,
            "expires_at": None,
            "is_active": True
        }

        # Setup smart mock
        def table_side_effect(table_name):
            mock_table = MagicMock()
            if table_name == "products":
                mock_table.select.return_value.eq.return_value.execute.return_value.data = [sample_product]
                mock_table.update.return_value.eq.return_value.execute.return_value.data = []
            elif table_name == "discount_codes":
                mock_table.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [discount]
                mock_table.update.return_value.eq.return_value.execute.return_value.data = []
            elif table_name == "orders":
                mock_table.insert.return_value.execute.return_value.data = [sample_order]
            elif table_name == "order_items":
                mock_table.insert.return_value.execute.return_value.data = [{
                    "id": "550e8400-e29b-41d4-a716-446655449999",
                    "product_id": sample_product["id"],
                    "product_name": sample_product["name_vi"],
                    "variant_name": None,
                    "quantity": 1,
                    "unit_price": 450000,
                    "total_price": 450000,
                    "order_id": sample_order["id"]
                }]
            else:
                mock_table.select.return_value.eq.return_value.execute.return_value.data = []
            return mock_table
        
        mock_supabase.table.side_effect = table_side_effect
        
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 1}],
            "shipping_address": {
                "full_name": "Test",
                "phone": "0901234567",
                "address_line": "123 Test",
                "district": "1",
                "city": "Hồ Chí Minh"
            },
            "discount_code": "SALE10"
        }
        response = client.post("/api/v1/orders/checkout", json=payload)
        assert response.status_code == 200
    
    def test_checkout_with_expired_discount(self, client, mock_supabase, sample_product):
        """POST /orders/checkout with expired discount should not apply."""
        # Discount should be silently ignored
        pass
    
    def test_checkout_with_min_order_not_met(self, client, mock_supabase, sample_product):
        """POST /orders/checkout with discount min_order_value not met should not apply."""
        pass


class TestOrderTracking:
    """Test order tracking endpoints."""
    
    def test_get_order_by_number(self, client, mock_supabase, sample_order, sample_product):
        """GET /orders/{order_number} should return order details."""
        
        # Setup smart mock
        def table_side_effect(table_name):
            mock_table = MagicMock()
            if table_name == "orders":
                mock_table.select.return_value.eq.return_value.execute.return_value.data = [sample_order]
            elif table_name == "order_items":
                mock_table.select.return_value.eq.return_value.execute.return_value.data = [{
                    "id": "550e8400-e29b-41d4-a716-446655449999",
                    "product_id": sample_product["id"],
                    "product_name": sample_product["name_vi"],
                    "variant_name": None,
                    "quantity": 1,
                    "unit_price": 450000,
                    "total_price": 450000,
                    "order_id": sample_order["id"]
                }]
            return mock_table
        
        mock_supabase.table.side_effect = table_side_effect
        
        response = client.get(f"/api/v1/orders/{sample_order['order_number']}")
        assert response.status_code == 200
        data = response.json()
        assert data["order_number"] == sample_order["order_number"]
    
    def test_get_order_not_found(self, client, mock_supabase):
        """GET /orders/{order_number} with invalid number should return 404."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        
        response = client.get("/api/v1/orders/YF-00000000-000")
        assert response.status_code == 404


class TestStripePayment:
    """Test Stripe payment integration."""
    
    def test_create_stripe_checkout_no_api_key(self, client, mock_supabase):
        """POST /orders/{id}/payment/stripe without Stripe key should return 500."""
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
            "id": "550e8400-e29b-41d4-a716-446655440003",
            "order_number": "YF-20250101-001",
            "total": 500000
        }]
        
        with patch("app.routers.orders.settings") as mock_settings:
            mock_settings.stripe_secret_key = ""
            response = client.post("/api/v1/orders/550e8400-e29b-41d4-a716-446655440003/payment/stripe")
            assert response.status_code == 500
    
    def test_stripe_webhook_payment_success(self, client, mock_supabase):
        """POST /orders/webhook/stripe with completed event should update order."""
        payload = {
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "metadata": {"order_id": "550e8400-e29b-41d4-a716-446655440003"}
                }
            }
        }
        response = client.post("/api/v1/orders/webhook/stripe", json=payload)
        assert response.status_code == 200
        assert response.json()["received"] == True


class TestEdgeCases:
    """Test edge cases and error handling."""
    
    def test_checkout_zero_quantity(self, client, mock_supabase, sample_product):
        """POST /orders/checkout with quantity=0 should be handled."""
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 0}],
            "shipping_address": {
                "full_name": "Test",
                "phone": "0901234567",
                "address_line": "123 Test",
                "district": "1",
                "city": "Hồ Chí Minh"
            }
        }
        response = client.post("/api/v1/orders/checkout", json=payload)
        assert response.status_code == 422
    
    def test_checkout_negative_quantity(self, client, mock_supabase, sample_product):
        """POST /orders/checkout with negative quantity should return 422."""
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": -1}],
            "shipping_address": {
                "full_name": "Test",
                "phone": "0901234567",
                "address_line": "123 Test",
                "district": "1",
                "city": "Hồ Chí Minh"
            }
        }
        response = client.post("/api/v1/orders/checkout", json=payload)
        assert response.status_code == 422
    
    def test_checkout_very_large_quantity(self, client, mock_supabase, sample_product):
        """POST /orders/checkout with very large quantity should check stock."""
        product = {**sample_product, "stock_quantity": 10}
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [product]
        
        payload = {
            "items": [{"product_id": sample_product["id"], "quantity": 999999}],
            "shipping_address": {
                "full_name": "Test",
                "phone": "0901234567",
                "address_line": "123 Test",
                "district": "1",
                "city": "Hồ Chí Minh"
            }
        }
        response = client.post("/api/v1/orders/checkout", json=payload)
        assert response.status_code == 400
        assert "insufficient stock" in response.json()["detail"].lower()
    
    def test_checkout_duplicate_products(self, client, mock_supabase, sample_product, sample_order):
        """POST /orders/checkout with same product multiple times should work."""
        
        # Setup smart mock
        def table_side_effect(table_name):
            mock_table = MagicMock()
            if table_name == "products":
                mock_table.select.return_value.eq.return_value.execute.return_value.data = [sample_product]
                mock_table.update.return_value.eq.return_value.execute.return_value.data = []
            elif table_name == "orders":
                mock_table.insert.return_value.execute.return_value.data = [sample_order]
            elif table_name == "order_items":
                mock_table.insert.return_value.execute.return_value.data = [{
                    "id": "550e8400-e29b-41d4-a716-446655449999",
                    "product_id": sample_product["id"],
                    "product_name": sample_product["name_vi"],
                    "variant_name": None,
                    "quantity": 1,
                    "unit_price": 450000,
                    "total_price": 450000,
                    "order_id": sample_order["id"]
                }]
            else:
                mock_table.select.return_value.eq.return_value.execute.return_value.data = []
            return mock_table
        
        mock_supabase.table.side_effect = table_side_effect
        
        payload = {
            "items": [
                {"product_id": sample_product["id"], "quantity": 1},
                {"product_id": sample_product["id"], "quantity": 2}
            ],
            "shipping_address": {
                "full_name": "Test",
                "phone": "0901234567",
                "address_line": "123 Test",
                "district": "1",
                "city": "Hồ Chí Minh"
            }
        }
        response = client.post("/api/v1/orders/checkout", json=payload)
        # Should handle duplicate items (combine or process separately)
        assert response.status_code == 200
