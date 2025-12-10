"""
Occasions Router - API endpoints for managing occasions
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from app.services.occasion_service import OccasionService
from app.dependencies import get_current_user

router = APIRouter(prefix="/occasions", tags=["Occasions"])

occasion_service = OccasionService()


# =====================================================
# SCHEMAS
# =====================================================

class OccasionCreate(BaseModel):
    occasion_type: str = Field(..., description="Type: birthday, anniversary, etc.")
    occasion_name: str = Field(..., description="Name like 'Mom's Birthday'")
    recipient_name: Optional[str] = None
    occasion_date: date = Field(..., description="Date of occasion")
    is_recurring: bool = Field(True, description="Repeat annually?")
    preferred_styles: Optional[dict] = Field(default_factory=dict)
    notes: Optional[str] = None
    reminder_days_before: int = Field(7, ge=1, le=30)
    reminder_enabled: bool = True


class OccasionUpdate(BaseModel):
    occasion_name: Optional[str] = None
    recipient_name: Optional[str] = None
    occasion_date: Optional[date] = None
    is_recurring: Optional[bool] = None
    preferred_styles: Optional[dict] = None
    notes: Optional[str] = None
    reminder_days_before: Optional[int] = None
    reminder_enabled: Optional[bool] = None


# =====================================================
# ENDPOINTS
# =====================================================

@router.post("/")
async def create_occasion(
    occasion: OccasionCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new occasion
    
    Remember important dates and get personalized reminders!
    """
    try:
        result = await occasion_service.create_occasion(
            user_id=current_user['id'],
            occasion_data=occasion.dict()
        )
        
        return {
            "success": True,
            "occasion": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_occasions(
    upcoming_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Get all occasions for current user"""
    try:
        occasions = await occasion_service.get_user_occasions(
            user_id=current_user['id'],
            upcoming_only=upcoming_only
        )
        
        return {
            "success": True,
            "occasions": occasions,
            "count": len(occasions)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{occasion_id}")
async def get_occasion(
    occasion_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific occasion"""
    try:
        occasion = await occasion_service.get_occasion(occasion_id)
        
        if not occasion:
            raise HTTPException(status_code=404, detail="Occasion not found")
        
        # Verify ownership
        if occasion['user_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {
            "success": True,
            "occasion": occasion
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{occasion_id}")
async def update_occasion(
    occasion_id: str,
    updates: OccasionUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an occasion"""
    try:
        # Verify ownership
        occasion = await occasion_service.get_occasion(occasion_id)
        if not occasion:
            raise HTTPException(status_code=404, detail="Occasion not found")
        if occasion['user_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update
        result = await occasion_service.update_occasion(
            occasion_id=occasion_id,
            updates={k: v for k, v in updates.dict().items() if v is not None}
        )
        
        return {
            "success": True,
            "occasion": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{occasion_id}")
async def delete_occasion(
    occasion_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an occasion"""
    try:
        # Verify ownership
        occasion = await occasion_service.get_occasion(occasion_id)
        if not occasion:
            raise HTTPException(status_code=404, detail="Occasion not found")
        if occasion['user_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        await occasion_service.delete_occasion(occasion_id)
        
        return {
            "success": True,
            "message": "Occasion deleted"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{occasion_id}/recommendations")
async def get_occasion_recommendations(
    occasion_id: str,
    limit: int = 5,
    current_user: dict = Depends(get_current_user)
):
    """Get personalized product recommendations for an occasion"""
    try:
        # Verify ownership
        occasion = await occasion_service.get_occasion(occasion_id)
        if not occasion:
            raise HTTPException(status_code=404, detail="Occasion not found")
        if occasion['user_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        recommendations = await occasion_service.get_occasion_recommendations(
            occasion_id=occasion_id,
            limit=limit
        )
        
        return {
            "success": True,
            "occasion": occasion,
            "recommendations": recommendations
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/reminders")
async def get_reminder_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get reminder statistics for current user"""
    try:
        stats = await occasion_service.get_reminder_stats(current_user['id'])
        
        return {
            "success": True,
            "stats": stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# ADMIN ENDPOINTS
# =====================================================

@router.post("/admin/send-reminders")
async def trigger_reminders(dry_run: bool = False):
    """
    Admin endpoint to manually trigger reminder sending
    
    In production, this would be called by a cron job
    """
    from app.workers.reminder_worker import ReminderWorker
    
    try:
        worker = ReminderWorker()
        result = await worker.send_reminders(dry_run=dry_run)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
