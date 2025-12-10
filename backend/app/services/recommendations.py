"""
Recommendation Engine for YenFlowers - REFACTORED
Optimized for performance, KISS principle, and best practices
"""
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timedelta
from functools import lru_cache
import time
from app.database import get_db_client
import logging

logger = logging.getLogger(__name__)


class ProductFormatter:
    """Formats product data for API responses"""
    
    @staticmethod
    def format(products: List[Dict]) -> List[Dict[str, Any]]:
        """Format product data consistently"""
        return [
            {
                "id":  p.get("id") or p.get("product_id"),
                "name": p.get("name_vi") or p.get("product_name"),
               "name_en": p.get("name_en"),
                "price": float(p.get("price", 0)),
                "sale_price": float(p.get("sale_price")) if p.get("sale_price") else None,
                "images": p.get("images", []),
                "category_id": p.get("category_id"),
                "confidence": float(p.get("confidence", 0)) if "confidence" in p else None,
            }
            for p in products
        ]


class RecommendationCache:
    """Simple time-based cache for trending products"""
    
    _cache = {}
    _cache_duration = 3600  # 1 hour
    
    @classmethod
    def get(cls, key: str) -> Optional[List[Dict]]:
        """Get cached value if not expired"""
        if key in cls._cache:
            data, timestamp = cls._cache[key]
            if time.time() - timestamp < cls._cache_duration:
                return data
        return None
    
    @classmethod
    def set(cls, key: str, value: List[Dict]):
        """Set cache value with timestamp"""
        cls._cache[key] = (value, time.time())
    
    @classmethod
    def clear(cls):
        """Clear all cache"""
        cls._cache.clear()


class RecommendationEngine:
    """Smart product recommendation system - Optimized"""
    
    def __init__(self):
        self.db = get_db_client()
        self.formatter = ProductFormatter()
    
    async def get_recommendations(
        self,
        user_id: Optional[str] = None,
        context: Literal["homepage", "pdp", "cart"] = "homepage",
        product_id: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get personalized product recommendations
        
        Args:
            user_id: User ID for personalization
            context: Display context
            product_id: Product ID for related products
            limit: Max results
            
        Returns:
            List of recommended products with metadata
        """
        try:
            # Route to appropriate recommendation strategy
            if context == "pdp" and product_id:
                return await self._get_product_related(product_id, limit)
            elif user_id:
                return await self._get_personalized_recommendations(user_id, limit)
            else:
                return await self._get_trending_products(limit)
        
        except Exception as e:
            logger.error(f"Recommendation error: {e}", exc_info=True)
            # Graceful degradation to trending
            return await self._get_trending_products(limit)
    
    async def _get_product_related(
        self, product_id: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Get products related to given product - OPTIMIZED"""
        try:
            # Try FBT (frequently bought together) first
            result = await self.db.rpc(
                "get_frequently_bought_together",
                {"target_product_id": product_id, "match_count": limit}
            ).execute()
            
            if result.data and len(result.data) >= limit:
                return self.formatter.format(result.data[:limit])
            
            # Fill remaining with same category products
            recommendations = self.formatter.format(result.data) if result.data else []
            remaining = limit - len(recommendations)
            
            if remaining > 0:
                same_category = await self._get_same_category_products(
                    product_id, remaining
                )
                recommendations.extend(same_category)
            
            return recommendations[:limit]
        
        except Exception as e:
            logger.warning(f"Related products error for {product_id}: {e}")
            return await self._get_trending_products(limit)
    
    async def _get_same_category_products(
        self, product_id: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Get products in same category - OPTIMIZED"""
        try:
            # Single query to get product and category products
            result = await self.db.rpc(
                "get_same_category_products",
                {"target_product_id": product_id, "match_count": limit}
            ).execute()
            
            return self.formatter.format(result.data) if result.data else []
        
        except Exception as e:
            # Fallback: manual query
            logger.warning(f"Same category RPC failed, using fallback: {e}")
            product = await self.db.table("products")\
                .select("category_id")\
                .eq("id", product_id)\
                .single()\
                .execute()
            
            if not product.data or not product.data.get("category_id"):
                return []
            
            result = await self.db.table("products")\
                .select("id, name_vi, name_en, price, sale_price, images, category_id")\
                .eq("category_id", product.data["category_id"])\
                .neq("id", product_id)\
                .eq("is_published", True)\
                .order("is_featured", desc=True)\
                .limit(limit)\
                .execute()
            
            return self.formatter.format(result.data) if result.data else []
    
    async def _get_personalized_recommendations(
        self, user_id: str, limit: int
    ) -> List[Dict[str, Any]]:
        """Get personalized recommendations - OPTIMIZED"""
        try:
            # Get recent views (last 5)
            views = await self.db.table("user_interactions")\
                .select("product_id")\
                .eq("user_id", user_id)\
                .eq("event_type", "view")\
                .order("created_at", desc=True)\
                .limit(5)\
                .execute()
            
            if not views.data:
                return await self._get_trending_products(limit)
            
            # Get related products for top 3 viewed (parallel queries would be faster)
            viewed_ids = {v["product_id"] for v in views.data if v.get("product_id")}
            recommendations = []
            seen_ids = viewed_ids.copy()
            
            # Get related products for each viewed product
            for product_id in list(viewed_ids)[:3]:
                related = await self._get_product_related(product_id, 5)
                for rec in related:
                    if rec["id"] not in seen_ids and len(recommendations) < limit:
                        recommendations.append(rec)
                        seen_ids.add(rec["id"])
            
            # Fill with trending if needed
            if len(recommendations) < limit:
                trending = await self._get_trending_products(limit - len(recommendations))
                for t in trending:
                    if t["id"] not in seen_ids and len(recommendations) < limit:
                        recommendations.append(t)
            
            return recommendations[:limit]
        
        except Exception as e:
            logger.error(f"Personalized recommendations error: {e}")
            return await self._get_trending_products(limit)
    
    async def _get_trending_products(self, limit: int) -> List[Dict[str, Any]]:
        """Get trending products with caching - OPTIMIZED"""
        cache_key = f"trending_{limit}"
        
        # Check cache first
        cached = RecommendationCache.get(cache_key)
        if cached:
            logger.debug(f"Cache hit for {cache_key}")
            return cached
        
        try:
            result = await self.db.rpc(
                "get_trending_products",
                {"match_count": limit, "days_back": 7}
            ).execute()
            
            products = self.formatter.format(result.data) if result.data else []
            
            # Fallback to featured if no trending
            if not products:
                products = await self._get_featured_products(limit)
            
            # Cache the result
            RecommendationCache.set(cache_key, products)
            
            return products
        
        except Exception as e:
            logger.warning(f"Trending products error: {e}")
            return await self._get_featured_products(limit)
    
    async def _get_featured_products(self, limit: int) -> List[Dict[str, Any]]:
        """Fallback: Get featured products"""
        try:
            result = await self.db.table("products")\
                .select("id, name_vi, name_en, price, sale_price, images, category_id")\
                .eq("is_published", True)\
                .eq("is_featured", True)\
                .limit(limit)\
                .execute()
            
            return self.formatter.format(result.data) if result.data else []
        except Exception as e:
            logger.error(f"Featured products error: {e}")
            return []
    
    async def track_click(
        self,
        user_id: Optional[str],
        session_id: str,
        recommended_products: List[str],
        clicked_product_id: str,
        context: str,
        algorithm: str,
        position: int
    ):
        """Track recommendation click - Simplified"""
        if not recommended_products or clicked_product_id not in recommended_products:
            logger.warning(f"Invalid click tracking: {clicked_product_id} not in recommendations")
            return
        
        try:
            await self.db.table("recommendation_clicks").insert({
                "user_id": user_id,
                "session_id": session_id,
                "recommended_products": recommended_products,
                "clicked_product_id": clicked_product_id,
                "context": context,
                "algorithm": algorithm,
                "position": position
            }).execute()
        except Exception as e:
            logger.error(f"Click tracking error: {e}")
