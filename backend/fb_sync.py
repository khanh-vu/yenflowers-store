import os
import requests
import json
from typing import List, Dict

# Placeholder for Env Vars
FB_PAGE_ID = os.getenv("FACEBOOK_PAGE_ID")
FB_ACCESS_TOKEN = os.getenv("FACEBOOK_ACCESS_TOKEN")
BASE_URL = "https://graph.facebook.com/v19.0"

class FacebookSyncService:
    def __init__(self):
        if not FB_ACCESS_TOKEN or not FB_PAGE_ID:
            print("Warning: FACEBOOK_ACCESS_TOKEN or FACEBOOK_PAGE_ID not set.")
    
    def fetch_page_photos(self, limit: int = 10) -> List[Dict]:
        """
        Fetches the latest photos from the Facebook Page.
        """
        url = f"{BASE_URL}/{FB_PAGE_ID}/photos"
        params = {
            "access_token": FB_ACCESS_TOKEN,
            "type": "uploaded",
            "fields": "id,created_time,images,name,link",
            "limit": limit
        }
        
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            return self._parse_photos(data.get("data", []))
        except Exception as e:
            print(f"Error fetching FB photos: {e}")
            return []

    def _parse_photos(self, photos_data: List[Dict]) -> List[Dict]:
        parsed = []
        for item in photos_data:
            # Get the largest image source
            images = item.get("images", [])
            largest_image = images[0]["source"] if images else None
            
            if largest_image:
                parsed.append({
                    "fb_id": item.get("id"),
                    "caption": item.get("name", ""),  # Using photo caption as description/name
                    "image_url": largest_image,
                    "permalink": item.get("link"),
                    "created_at": item.get("created_time")
                })
        return parsed

if __name__ == "__main__":
    # Test run
    service = FacebookSyncService()
    print("Fetching photos from Facebook...")
    photos = service.fetch_page_photos()
    print(json.dumps(photos, indent=2))
