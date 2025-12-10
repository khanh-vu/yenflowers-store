"""
Reminder Worker - Send automated occasion reminders
Run this as a scheduled job (cron/celery)
"""
import asyncio
from datetime import datetime
from app.services.occasion_service import OccasionService
from app.database import get_db_client
import logging

logger = logging.getLogger(__name__)


class ReminderWorker:
    """Background worker to send occasion reminders"""
    
    def __init__(self):
        self.occasion_service = OccasionService()
        self.db = get_db_client()
    
    async def send_reminders(self, dry_run: bool = False):
        """
        Send reminders for upcoming occasions
        
        Args:
            dry_run: If True, don't actually send emails, just log
        """
        logger.info("Starting reminder worker...")
        
        try:
            # Get occasions needing reminders
            upcoming = await self.occasion_service.get_upcoming_occasions_for_reminders(
                days_ahead=7
            )
            
            logger.info(f"Found {len(upcoming)} occasions needing reminders")
            
            for occasion in upcoming:
                try:
                    await self._send_single_reminder(occasion, dry_run=dry_run)
                except Exception as e:
                    logger.error(f"Error sending reminder for occasion {occasion['occasion_id']}: {e}")
                    continue
            
            logger.info(f"Reminder worker completed. Sent {len(upcoming)} reminders.")
            return {
                "success": True,
                "reminders_sent": len(upcoming)
            }
            
        except Exception as e:
            logger.error(f"Reminder worker failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _send_single_reminder(self, occasion: dict, dry_run: bool = False):
        """Send a reminder for a single occasion"""
        occasion_id = occasion['occasion_id']
        user_email = occasion['user_email']
        occasion_name = occasion['occasion_name']
        occasion_date = occasion['occasion_date']
        recipient_name = occasion.get('recipient_name', 'someone special')
        
        logger.info(f"Sending reminder to {user_email} for {occasion_name} on {occasion_date}")
        
        # Get personalized recommendations
        recommendations = await self.occasion_service.get_occasion_recommendations(
            occasion_id=occasion_id,
            limit=5
        )
        
        recommended_ids = [r['product_id'] for r in recommendations]
        
        if dry_run:
            logger.info(f"[DRY RUN] Would send email to {user_email} with {len(recommendations)} recommendations")
        else:
            # Send actual email
            await self._send_email(
                to_email=user_email,
                occasion_name=occasion_name,
                recipient_name=recipient_name,
                occasion_date=occasion_date,
                recommendations=recommendations
            )
        
        # Mark reminder as sent
        await self.occasion_service.mark_reminder_sent(
            occasion_id=occasion_id,
            reminder_type='email',
            recommended_products=recommended_ids,
            status='sent' if not dry_run else 'pending'
        )
    
    async def _send_email(
        self,
        to_email: str,
        occasion_name: str,
        recipient_name: str,
        occasion_date: str,
        recommendations: List[dict]
    ):
        """
        Send reminder email
        
        In production, integrate with SendGrid, AWS SES, or similar
        """
        # TODO: Integrate actual email service
        
        # For now, just log
        logger.info(f"""
        ===== REMINDER EMAIL =====
        To: {to_email}
        Subject: Đừng quên {occasion_name} sắp tới!
        
        Xin chào!
        
        {occasion_name} ({recipient_name}) sẽ diễn ra vào {occasion_date}.
        
        Chúng tôi đã chọn {len(recommendations)} bó hoa đặc biệt cho bạn:
        {[r['product_name'] for r in recommendations[:3]]}
        
        Đặt hàng ngay: https://yenflowers.vn/occasions/{occasion_name}
        
        Trân trọng,
        YenFlowers Team
        ==========================
        """)
        
        # In production:
        # await sendgrid_client.send(...)
        pass


# Standalone script for cron job
async def main():
    """Main entry point for cron job"""
    worker = ReminderWorker()
    result = await worker.send_reminders(dry_run=False)
    print(f"Reminder job completed: {result}")


if __name__ == "__main__":
    asyncio.run(main())
