"""
AI Router - Recommendations, Smart Search, and Tracking
"""
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from app.services.recommendations import RecommendationEngine
from app.services.smart_search import SmartSearchService
from app.services.interaction_tracker import InteractionTracker

router = APIRouter(prefix="/ai", tags=["AI Features"])

# Initialize services
recommendation_engine = RecommendationEngine()
smart_search = SmartSearchService()
interaction_tracker = InteractionTracker()


# =====================================================
# SCHEMAS
# =====================================================

class InteractionEvent(BaseModel):
    session_id: str = Field(..., description="Unique session identifier")
    event_type: str = Field(..., description="Event type: view, add_to_cart, remove_from_cart, purchase, search")
    product_id: Optional[str] = None
    category_id: Optional[str] = None
    user_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class SearchQuery(BaseModel):
    query: str = Field(..., description="Search query text")
    user_id: Optional[str] = None
    session_id: str = Field(..., description="Session identifier")
    limit: int = Field(20, ge=1, le=100)


class RecommendationRequest(BaseModel):
    user_id: Optional[str] = None
    context: str = Field("homepage", description="Context: homepage, pdp, cart")
    product_id: Optional[str] = None
    limit: int = Field(10, ge=1, le=50)


class RecommendationClickTrack(BaseModel):
    user_id: Optional[str] = None
    session_id: str
    recommended_products: List[str]
    clicked_product_id: str
    context: str
    algorithm: str
    position: int


# =====================================================
# RECOMMENDATIONS
# =====================================================

@router.post("/recommendations")
async def get_recommendations(req: RecommendationRequest):
    """
    Get personalized product recommendations
    
    - **user_id**: Optional. Enables personalized recommendations
    - **context**: Where recommendations are shown (homepage/pdp/cart)
    - **product_id**: Required for 'pdp' context - shows related products
    - **limit**: Max number of recommendations
    
    Returns list of recommended products with confidence scores
    """
    try:
        recommendations = await recommendation_engine.get_recommendations(
            user_id=req.user_id,
            context=req.context,
            product_id=req.product_id,
            limit=req.limit
        )
        
        return {
            "success": True,
            "recommendations": recommendations,
            "context": req.context,
            "algorithm": "hybrid"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendations: {str(e)}")


@router.get("/recommendations/trending")
async def get_trending(limit: int = Query(10, ge=1, le=50)):
    """Get trending products (most viewed in last 7 days)"""
    try:
        trending = await recommendation_engine._get_trending(limit)
        return {
            "success": True,
            "products": trending,
            "period": "7_days"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/related/{product_id}")
async def get_related_products(
    product_id: str,
    limit: int = Query(10, ge=1, le=50)
):
    """Get products related to a specific product"""
    try:
        related = await recommendation_engine._get_product_related(product_id, limit)
        return {
            "success": True,
            "product_id": product_id,
            "related_products": related
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/recommendations/track-click")
async def track_recommendation_click(track: RecommendationClickTrack):
    """Track when user clicks on a recommended product"""
    try:
        await recommendation_engine.track_recommendation_click(
            user_id=track.user_id,
            session_id=track.session_id,
            recommended_products=track.recommended_products,
            clicked_product_id=track.clicked_product_id,
            context=track.context,
            algorithm=track.algorithm,
            position=track.position
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# SMART SEARCH
# =====================================================

@router.post("/search")
async def smart_search(search: SearchQuery):
    """
    Intelligent search with NLP for Vietnamese queries
    
    Supports natural language like:
    - "hoa hồng đỏ giá 500k" (red roses under 500k)
    - "hoa sinh nhật quận 1" (birthday flowers in district 1)
    - "tulip cao cấp giao gấp" (premium tulips urgent delivery)
    
    Returns parsed intent and matching products
    """
    try:
        results = await smart_search.search(
            query=search.query,
            user_id=search.user_id,
            session_id=search.session_id,
            limit=search.limit
        )
        
        return {
            "success": True,
            **results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")


@router.get("/search/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=10)
):
    """Get autocomplete suggestions for search queries"""
    try:
        suggestions = await smart_search.get_search_suggestions(q, limit)
        return {
            "success": True,
            "query": q,
            "suggestions": suggestions
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# VISUAL SEARCH
# =====================================================

from fastapi import UploadFile, File
from app.services.visual_search import VisualSearchService

visual_search = VisualSearchService()


@router.post("/visual-search")
async def search_by_image(
    image: UploadFile = File(...),
    limit: int = Query(20, ge=1, le=50),
    min_similarity: float = Query(0.3, ge=0.0, le=1.0)
):
    """
    Search for products by uploading an image
    
    Upload a photo of flowers and find similar products in our catalog.
    
    Supports: JPEG, PNG, WebP
    Max file size: 10MB
    
    Returns products ranked by visual similarity
    """
    try:
        # Read image bytes
        image_bytes = await image.read()
        
        # Validate file size (10MB max)
        if len(image_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image too large (max 10MB)")
        
        # Perform visual search
        results = await visual_search.search_by_image(
            image_bytes=image_bytes,
            limit=limit,
            min_similarity=min_similarity
        )
        
        return {
            "success": True,
            "query_type": "visual",
            "results": results,
            "count": len(results)
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Visual search error: {e}")
        raise HTTPException(status_code=500, detail="Visual search failed")


# =====================================================
# TRACKING
# =====================================================

@router.post("/track")
async def track_interaction(event: InteractionEvent):
    """
    Track user interaction events for AI/ML
    
    Event types:
    - **view**: User viewed a product/category
    - **add_to_cart**: Added product to cart
    - **remove_from_cart**: Removed from cart
    - **purchase**: Completed purchase
    - **search**: Performed search
    """
    try:
        await interaction_tracker.track_event(
            session_id=event.session_id,
            event_type=event.event_type,
            product_id=event.product_id,
            category_id=event.category_id,
            user_id=event.user_id,
            metadata=event.metadata
        )
        return {"success": True}
    except Exception as e:
        # Don't fail user requests due to tracking errors
        return {"success": False, "error": str(e)}


# =====================================================
# ADMIN ENDPOINTS
# =====================================================

@router.post("/admin/update-relationships")
async def update_product_relationships():
    """
    Admin endpoint to recalculate product relationships
    Based on purchase and view patterns
    """
    try:
        db = recommendation_engine.db
        await db.rpc("update_product_relationships").execute()
        return {
            "success": True,
            "message": "Product relationships updated successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/admin/stats")
async def get_ai_stats():
    """Get AI feature usage statistics"""
    try:
        db = recommendation_engine.db
        
        # Get interaction counts
        interactions = await db.table("user_interactions") \
            .select("event_type", count="exact") \
            .execute()
        
        # Get search query count
        searches = await db.table("search_queries") \
            .select("*", count="exact") \
            .execute()
        
        # Get recommendation clicks
        rec_clicks = await db.table("recommendation_clicks") \
            .select("*", count="exact") \
            .execute()
        
        return {
            "success": True,
            "stats": {
                "total_interactions": interactions.count,
                "total_searches": searches.count,
                "total_recommendation_clicks": rec_clicks.count
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
