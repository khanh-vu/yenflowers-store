"""
Facebook Graph API integration service.
Fetches posts and photos from the Yenflowers Facebook Page.
Supports batch-based sync with cursor persistence for resumable syncing.
"""
import httpx
from datetime import datetime
from typing import Optional, Dict, Any, Tuple
from app.config import get_settings

settings = get_settings()

FB_GRAPH_URL = "https://graph.facebook.com/v19.0"


class FacebookSyncService:
    def __init__(self):
        self.page_id = settings.facebook_page_id
        self.access_token = settings.facebook_access_token
    
    def set_credentials(self, page_id: str, access_token: str):
        """Update credentials dynamically (e.g. from DB settings)."""
        self.page_id = page_id
        self.access_token = access_token
    
    def _make_request(self, endpoint: str, params: dict = None) -> dict:
        """Make authenticated request to Facebook Graph API."""
        if not self.access_token:
            raise ValueError("Facebook access token not configured")
        
        url = f"{FB_GRAPH_URL}/{endpoint}"
        default_params = {"access_token": self.access_token}
        if params:
            default_params.update(params)
        
        with httpx.Client(timeout=30.0) as client:
            response = client.get(url, params=default_params)
            response.raise_for_status()
            return response.json()
    
    def get_total_posts_count(self) -> int:
        """
        Get approximate total number of posts on the page.
        Uses feed endpoint with summary to get count.
        """
        if not self.page_id:
            raise ValueError("Facebook Page ID not configured")
        
        # FB doesn't provide direct count, so we fetch pages quickly to count
        total = 0
        cursor = None
        
        while True:
            params = {
                "fields": "id",  # Minimal fields for speed
                "limit": 100
            }
            if cursor:
                params["after"] = cursor
            
            data = self._make_request(f"{self.page_id}/feed", params=params)
            posts = data.get("data", [])
            total += len(posts)
            
            paging = data.get("paging", {})
            cursor = paging.get("cursors", {}).get("after")
            
            if not cursor or "next" not in paging:
                break
        
        return total
    
    def fetch_posts_batch(
        self, 
        batch_size: int = 25, 
        cursor: Optional[str] = None,
        days_back: Optional[int] = None
    ) -> Tuple[list[Dict[str, Any]], Optional[str], bool]:
        """
        Fetch a single batch of posts.
        
        Args:
            batch_size: Number of posts per batch (max 100)
            cursor: Pagination cursor from previous batch (None for first batch)
            days_back: Optional filter for posts from last N days
        
        Returns:
            Tuple of (posts_list, next_cursor, has_more)
        """
        if not self.page_id:
            raise ValueError("Facebook Page ID not configured")
        
        params = {
            "fields": "id,created_time,message,full_picture,permalink_url,attachments{media_type,media,subattachments{media_type,media}}",
            "limit": min(batch_size, 100)
        }
        
        # Add since filter if specified
        if days_back:
            import time
            since_timestamp = int(time.time()) - (days_back * 86400)
            params["since"] = str(since_timestamp)
        
        # Add cursor for pagination
        if cursor:
            params["after"] = cursor
        
        data = self._make_request(f"{self.page_id}/feed", params=params)
        
        # Parse posts
        posts = self._parse_posts_with_images(data.get("data", []))
        
        # Get pagination info
        paging = data.get("paging", {})
        cursors = paging.get("cursors", {})
        next_cursor = cursors.get("after")
        has_more = "next" in paging and next_cursor is not None
        
        return posts, next_cursor, has_more
    
    def fetch_page_photos(self, limit: int = 100, days_back: int = None) -> list[dict]:
        """
        Fetch photos from the page (standalone photos).
        Returns list of parsed photo data.
        """
        if not self.page_id:
            raise ValueError("Facebook Page ID not configured")
        
        params = {
            "fields": "id,created_time,images,name,link",
            "limit": limit
        }
        
        if days_back:
            import time
            since_timestamp = int(time.time()) - (days_back * 86400)
            params["since"] = str(since_timestamp)
        
        data = self._make_request(f"{self.page_id}/photos", params=params)
        return self._parse_photos(data.get("data", []))
    
    def _parse_posts_with_images(self, posts_data: list) -> list[dict]:
        """
        Parse raw post data from FB API.
        Extracts ALL images from attachments (including multi-photo posts).
        """
        parsed = []
        for item in posts_data:
            # Get the cover image (full_picture)
            cover_image = item.get("full_picture")
            
            # Extract all images from attachments
            all_images = self._extract_all_images(item.get("attachments", {}))
            
            # If no images at all, skip this post
            if not cover_image and not all_images:
                continue
            
            # Use first extracted image as cover if full_picture not available
            if not cover_image and all_images:
                cover_image = all_images[0]
            
            parsed.append({
                "platform": "facebook",
                "post_id": item.get("id"),
                "caption": item.get("message", ""),
                "image_url": cover_image,
                "image_urls": all_images,
                "permalink": item.get("permalink_url"),
                "post_type": "album" if len(all_images) > 1 else "photo",
                "posted_at": self._parse_fb_date(item.get("created_time"))
            })
        return parsed
    
    def _extract_all_images(self, attachments: dict) -> list[str]:
        """Extract all image URLs from post attachments."""
        images = []
        
        if not attachments:
            return images
        
        attachment_data = attachments.get("data", [])
        if not attachment_data:
            return images
        
        main_attachment = attachment_data[0]
        
        # Check for subattachments (multiple photos in album)
        subattachments = main_attachment.get("subattachments", {}).get("data", [])
        
        if subattachments:
            for sub in subattachments:
                media = sub.get("media", {})
                image_info = media.get("image", {})
                if src := image_info.get("src"):
                    images.append(src)
        else:
            media = main_attachment.get("media", {})
            image_info = media.get("image", {})
            if src := image_info.get("src"):
                images.append(src)
        
        return images
    
    def _parse_photos(self, photos_data: list) -> list[dict]:
        """Parse raw photo data from FB API."""
        parsed = []
        for item in photos_data:
            images = item.get("images", [])
            largest = images[0]["source"] if images else None
            
            if largest:
                parsed.append({
                    "platform": "facebook",
                    "post_id": item.get("id"),
                    "caption": item.get("name", ""),
                    "image_url": largest,
                    "image_urls": [largest],
                    "permalink": item.get("link"),
                    "post_type": "photo",
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
