"""
Occasion Memory Service
Manage important dates and send automated reminders
"""
from typing import List, Dict, Any, Optional
from datetime import date, datetime, timedelta
from uuid import UUID
from app.database import get_db_client
import logging

logger = logging.getLogger(__name__)


class OccasionService:
    """Manage customer occasions and reminders"""
    
    def __init__(self):
        self.db = get_db_client()
    
    async def create_occasion(
        self,
        user_id: str,
        occasion_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new occasion for a user"""
        try:
            result = await self.db.table("customer_occasions").insert({
                "user_id": user_id,
                **occasion_data
            }).execute()
            
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"Error creating occasion: {e}")
            raise
    
    async def get_user_occasions(
        self,
        user_id: str,
        upcoming_only: bool = False
    ) -> List[Dict[str, Any]]:
        """Get all occasions for a user"""
        try:
            query = self.db.table("customer_occasions") \
                .select("*") \
                .eq("user_id", user_id)
            
            if upcoming_only:
                # Get occasions coming up in next 90 days
                query = query.gte("date", date.today().isoformat())
            
            query = query.order("date")
            result = await query.execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error fetching occasions: {e}")
            return []
    
    async def get_occasion(self, occasion_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific occasion"""
        try:
            result = await self.db.table("customer_occasions") \
                .select("*") \
                .eq("id", occasion_id) \
                .single() \
                .execute()
            
            return result.data if result.data else None
            
        except Exception as e:
            logger.error(f"Error fetching occasion: {e}")
            return None
    
    async def update_occasion(
        self,
        occasion_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update an occasion"""
        try:
            result = await self.db.table("customer_occasions") \
                .update(updates) \
                .eq("id", occasion_id) \
                .execute()
            
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"Error updating occasion: {e}")
            raise
    
    async def delete_occasion(self, occasion_id: str):
        """Delete an occasion"""
        try:
            await self.db.table("customer_occasions") \
                .delete() \
                .eq("id", occasion_id) \
                .execute()
            
        except Exception as e:
            logger.error(f"Error deleting occasion: {e}")
            raise
    
    async def get_upcoming_occasions_for_reminders(
        self,
        days_ahead: int = 7
    ) -> List[Dict[str, Any]]:
        """Get occasions that need reminders sent"""
        try:
            result = await self.db.rpc(
                "get_upcoming_occasions_for_reminders",
                {"days_ahead": days_ahead}
            ).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error fetching upcoming occasions: {e}")
            return []
    
    async def get_occasion_recommendations(
        self,
        occasion_id: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Get personalized product recommendations for an occasion"""
        try:
            result = await self.db.rpc(
                "get_occasion_recommendations",
                {"p_occasion_id": occasion_id, "match_count": limit}
            ).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Error getting recommendations: {e}")
            return []
    
    async def mark_reminder_sent(
        self,
        occasion_id: str,
        reminder_type: str,
        recommended_products: List[str],
        status: str = "sent"
    ) -> Dict[str, Any]:
        """Record that a reminder was sent"""
        try:
            # Get occasion to get user_id
            occasion = await self.get_occasion(occasion_id)
            if not occasion:
                raise ValueError("Occasion not found")
            
            # Insert reminder record
            reminder_result = await self.db.table("occasion_reminders").insert({
                "occasion_id": occasion_id,
                "user_id": occasion["user_id"],
                "reminder_type": reminder_type,
                "status": status,
                "recommended_products": recommended_products
            }).execute()
            
            # Update occasion's last_reminder_sent_at
            await self.update_occasion(occasion_id, {
                "last_reminder_sent_at": datetime.now().isoformat()
            })
            
            return reminder_result.data[0] if reminder_result.data else None
            
        except Exception as e:
            logger.error(f"Error marking reminder sent: {e}")
            raise
    
    async def track_reminder_engagement(
        self,
        reminder_id: str,
        action: str,  # 'opened', 'clicked'
        order_id: Optional[str] = None
    ):
        """Track user engagement with reminder"""
        try:
            updates = {}
            
            if action == 'opened':
                updates['opened_at'] = datetime.now().isoformat()
            elif action == 'clicked':
                updates['clicked_at'] = datetime.now().isoformat()
            
            if order_id:
                updates['order_placed'] = True
                updates['order_id'] = order_id
            
            if updates:
                await self.db.table("occasion_reminders") \
                    .update(updates) \
                    .eq("id", reminder_id) \
                    .execute()
                
        except Exception as e:
            logger.error(f"Error tracking engagement: {e}")
    
    async def get_reminder_stats(self, user_id: str) -> Dict[str, Any]:
        """Get reminder statistics for a user"""
        try:
            # Get all reminders for user
            result = await self.db.table("occasion_reminders") \
                .select("*") \
                .eq("user_id", user_id) \
                .execute()
            
            reminders = result.data if result.data else []
            
            total = len(reminders)
            opened = len([r for r in reminders if r.get('opened_at')])
            clicked = len([r for r in reminders if r.get('clicked_at')])
            converted = len([r for r in reminders if r.get('order_placed')])
            
            return {
                "total_reminders": total,
                "opened": opened,
                "clicked": clicked,
                "converted_to_orders": converted,
                "open_rate": round(opened / total * 100, 1) if total > 0 else 0,
                "click_rate": round(clicked / total * 100, 1) if total > 0 else 0,
                "conversion_rate": round(converted / total * 100, 1) if total > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting reminder stats: {e}")
            return {}
