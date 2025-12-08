"""
Tests for Facebook sync service.
"""
from unittest.mock import MagicMock, patch
import pytest
from app.services.facebook_sync import FacebookSyncService


class TestFacebookSyncService:
    """Test Facebook Graph API integration."""
    
    def test_init_without_credentials(self):
        """Service should handle missing credentials gracefully."""
        with patch("app.services.facebook_sync.settings") as mock_settings:
            mock_settings.facebook_page_id = ""
            mock_settings.facebook_access_token = ""
            service = FacebookSyncService()
            assert service.page_id == ""
    
    def test_fetch_photos_no_page_id(self):
        """fetch_page_photos without page_id should raise ValueError."""
        with patch("app.services.facebook_sync.settings") as mock_settings:
            mock_settings.facebook_page_id = ""
            service = FacebookSyncService()
            # Explicitly clear it just in case
            service.page_id = ""
            
            with pytest.raises(ValueError, match="not configured"):
                service.fetch_page_photos()
    
    def test_fetch_photos_success(self):
        """fetch_page_photos should parse FB API response correctly."""
        with patch("httpx.Client") as mock_client:
            mock_response = MagicMock()
            mock_response.json.return_value = {
                "data": [
                    {
                        "id": "123456789",
                        "created_time": "2025-01-01T10:00:00+0000",
                        "name": "Beautiful roses",
                        "link": "https://facebook.com/photo/123",
                        "images": [
                            {"source": "https://example.com/large.jpg"},
                            {"source": "https://example.com/small.jpg"}
                        ]
                    }
                ]
            }
            mock_response.raise_for_status = MagicMock()
            mock_client.return_value.__enter__.return_value.get.return_value = mock_response
            
            service = FacebookSyncService()
            service.page_id = "test_page"
            service.access_token = "test_token"
            
            result = service.fetch_page_photos(limit=10)
            
            assert len(result) == 1
            assert result[0]["post_id"] == "123456789"
            assert result[0]["caption"] == "Beautiful roses"
            assert result[0]["image_url"] == "https://example.com/large.jpg"
            assert result[0]["platform"] == "facebook"
    
    def test_fetch_photos_with_date_filter(self):
        """fetch_page_photos with days_back should add 'since' param."""
        with patch("httpx.Client") as mock_client:
            mock_response = MagicMock()
            mock_response.json.return_value = {"data": []}
            mock_response.raise_for_status = MagicMock()
            mock_client.return_value.__enter__.return_value.get.return_value = mock_response
            
            service = FacebookSyncService()
            service.page_id = "test_page"
            service.access_token = "test_token"
            
            # Use 30 days back
            days_back = 30
            # Calculate expected timestamp roughly
            import time
            expected_timestamp = int(time.time()) - (days_back * 86400)
            
            service.fetch_page_photos(limit=10, days_back=days_back)
            
            # Check call args
            call_args = mock_client.return_value.__enter__.return_value.get.call_args
            assert call_args is not None
            params = call_args[1]["params"]
            
            assert "since" in params
            # Allow small time diff in test execution
            assert abs(int(params["since"]) - expected_timestamp) < 5
            
    
    def test_fetch_photos_api_error(self):
        """fetch_page_photos should raise exception on API error."""
        with patch("httpx.Client") as mock_client:
            mock_client.return_value.__enter__.return_value.get.side_effect = Exception("API Error")
            
            service = FacebookSyncService()
            service.page_id = "test_page"
            service.access_token = "test_token"
            
            with pytest.raises(Exception, match="API Error"):
                service.fetch_page_photos()
    
    def test_fetch_posts_filters_no_image(self):
        """fetch_page_posts should skip posts without images."""
        with patch("httpx.Client") as mock_client:
            mock_response = MagicMock()
            mock_response.json.return_value = {
                "data": [
                    {
                        "id": "111",
                        "message": "Post with image",
                        "full_picture": "https://example.com/image.jpg",
                        "permalink_url": "https://facebook.com/post/111",
                        "created_time": "2025-01-01T10:00:00+0000"
                    },
                    {
                        "id": "222",
                        "message": "Post without image"
                        # No full_picture
                    }
                ]
            }
            mock_response.raise_for_status = MagicMock()
            mock_client.return_value.__enter__.return_value.get.return_value = mock_response
            
            service = FacebookSyncService()
            service.page_id = "test_page"
            service.access_token = "test_token"
            
            result = service.fetch_page_posts(limit=10)
            
            assert len(result) == 1
            assert result[0]["post_id"] == "111"
    
    def test_parse_fb_date_valid(self):
        """_parse_fb_date should parse valid ISO dates."""
        service = FacebookSyncService()
        result = service._parse_fb_date("2025-01-01T10:30:00+0000")
        assert result is not None
        assert result.year == 2025
        assert result.month == 1
        assert result.day == 1
    
    def test_parse_fb_date_invalid(self):
        """_parse_fb_date should return None for invalid dates."""
        service = FacebookSyncService()
        result = service._parse_fb_date("invalid-date")
        assert result is None
    
    def test_parse_fb_date_none(self):
        """_parse_fb_date should return None for None input."""
        service = FacebookSyncService()
        result = service._parse_fb_date(None)
        assert result is None
