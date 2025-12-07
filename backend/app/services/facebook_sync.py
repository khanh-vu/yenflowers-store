"""
Facebook Graph API integration service.
Fetches posts and photos from the Yenflowers Facebook Page.
"""
import httpx
from datetime import datetime
from typing import Optional
from app.config import get_settings

settings = get_settings()

FB_GRAPH_URL = "https://graph.facebook.com/v19.0"


class FacebookSyncService:
    def __init__(self):
        self.page_id = settings.facebook_page_id
        self.access_token = settings.facebook_access_token
    
    def _make_request(self, endpoint: str, params: dict = None) -> dict:
        """Make authenticated request to Facebook Graph API."""
        if not self.access_token:
            raise ValueError("Facebook access token not configured")
        
        url = f"{FB_GRAPH_URL}/{endpoint}"
        default_params = {"access_token": self.access_token}
        if params:
            default_params.update(params)
        
        with httpx.Client() as client:
            response = client.get(url, params=default_params)
            response.raise_for_status()
            return response.json()
    
    def fetch_page_photos(self, limit: int = 25) -> list[dict]:
        """
        Fetch uploaded photos from the page.
        Returns list of parsed photo data.
        """
        if not self.page_id:
            return []
        
        try:
            data = self._make_request(
                f"{self.page_id}/photos",
                params={
                    "type": "uploaded",
                    "fields": "id,created_time,images,name,link",
                    "limit": limit
                }
            )
            return self._parse_photos(data.get("data", []))
        except Exception as e:
            print(f"Error fetching FB photos: {e}")
            return []
    
    def fetch_page_posts(self, limit: int = 25) -> list[dict]:
        """
        Fetch posts from the page feed.
        Returns list of parsed post data.
        """
        if not self.page_id:
            return []
        
        try:
            data = self._make_request(
                f"{self.page_id}/feed",
                params={
                    "fields": "id,created_time,message,full_picture,permalink_url,attachments{media_type,media,subattachments}",
                    "limit": limit
                }
            )
            return self._parse_posts(data.get("data", []))
        except Exception as e:
            print(f"Error fetching FB posts: {e}")
            return []
    
    def _parse_photos(self, photos_data: list) -> list[dict]:
        """Parse raw photo data from FB API."""
        parsed = []
        for item in photos_data:
            images = item.get("images", [])
            # Get largest image
            largest = images[0]["source"] if images else None
            
            if largest:
                parsed.append({
                    "platform": "facebook",
                    "post_id": item.get("id"),
                    "caption": item.get("name", ""),
                    "image_url": largest,
                    "permalink": item.get("link"),
                    "post_type": "photo",
                    "posted_at": self._parse_fb_date(item.get("created_time"))
                })
        return parsed
    
    def _parse_posts(self, posts_data: list) -> list[dict]:
        """Parse raw post data from FB API."""
        parsed = []
        for item in posts_data:
            image_url = item.get("full_picture")
            if not image_url:
                continue  # Skip posts without images
            
            parsed.append({
                "platform": "facebook",
                "post_id": item.get("id"),
                "caption": item.get("message", ""),
                "image_url": image_url,
                "permalink": item.get("permalink_url"),
                "post_type": "post",
                "posted_at": self._parse_fb_date(item.get("created_time"))
            })
        return parsed
    
    def _parse_fb_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse Facebook datetime string."""
        if not date_str:
            return None
        try:
            return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except:
            return None


# Singleton instance
fb_service = FacebookSyncService()


def get_fb_service() -> FacebookSyncService:
    return fb_service
