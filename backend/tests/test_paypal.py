from unittest.mock import MagicMock, patch, AsyncMock
import pytest


class TestPayPalPayment:
    """Test PayPal payment integration."""
    
    def test_capture_paypal_order_no_config(self, client, mock_supabase):
        """POST /orders/{id}/payment/paypal/capture without config should return 500."""
        with patch("app.routers.orders.settings") as mock_settings:
            mock_settings.paypal_client_id = ""
            mock_settings.paypal_client_secret = ""
            
            response = client.post(
                "/api/v1/orders/550e8400-e29b-41d4-a716-446655440003/payment/paypal/capture",
                params={"paypal_order_id": "PAY-123"}
            )
            assert response.status_code == 500
            assert "not configured" in response.json()["detail"].lower()
    
    def test_capture_paypal_success(self, client, mock_supabase, sample_order):
        """POST /payment/paypal/capture should verify and update order."""
        # Setup mocks
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [sample_order]
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value.data = [sample_order]
        
        with patch("app.routers.orders.settings") as mock_settings, \
             patch("httpx.AsyncClient") as mock_client_cls:
            
            mock_settings.paypal_client_id = "test_id"
            mock_settings.paypal_client_secret = "test_secret"
            mock_settings.paypal_mode = "sandbox"
            
            # Mock HTTpx Client
            mock_client = MagicMock()
            mock_client_cls.return_value.__aenter__.return_value = mock_client
            
            # Mock Token Response
            mock_token_resp = MagicMock()
            mock_token_resp.status_code = 200
            mock_token_resp.json.return_value = {"access_token": "fake_token"}
            
            # Mock Capture Response
            mock_capture_resp = MagicMock()
            mock_capture_resp.status_code = 201
            mock_capture_resp.json.return_value = {"status": "COMPLETED", "id": "PAY-123"}
            
            # Setup side effects for post (async)
            async def side_effect(url, **kwargs):
                if "oauth2/token" in url:
                    return mock_token_resp
                if "capture" in url:
                    return mock_capture_resp
                return MagicMock(status_code=404)
            
            mock_client.post.side_effect = side_effect
            # Ensure get behaves similarly if used
            mock_client.get.return_value = AsyncMock(status_code=200)

            response = client.post(
                f"/api/v1/orders/{sample_order['id']}/payment/paypal/capture",
                params={"paypal_order_id": "PAY-123"}
            )
            
            assert response.status_code == 200
            assert response.json()["status"] == "success"
