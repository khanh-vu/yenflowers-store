"""
User Interaction Tracking Service
"""
from typing import Optional, Dict, Any
from datetime import datetime
from app.database import get_db_client
import logging

logger = logging.getLogger(__name__)


class InteractionTracker:
    """Track user interactions for AI/ML training"""
    
    def __init__(self):
        self.db = get_db_client()
    
    async def track_event(
        self,
        session_id: str,
        event_type: str,
        product_id: Optional[str] = None,
        category_id: Optional[str] = None,
        user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """
        Track a user interaction event
        
        Args:
            session_id: Unique session identifier
            event_type: Type of event ('view', 'add_to_cart', 'purchase', etc.)
            product_id: Optional product ID
            category_id: Optional category ID
            user_id: Optional user ID (for logged-in users)
            metadata: Optional additional data
        """
        try:
            await self.db.table("user_interactions").insert({
                "session_id": session_id,
                "event_type": event_type,
                "product_id": product_id,
                "category_id": category_id,
                "user_id": user_id,
                "metadata": metadata or {}
            }).execute()
            
        except Exception as e:
            logger.error(f"Error tracking event: {e}")
            # Don't raise - tracking failures shouldn't break user experience
