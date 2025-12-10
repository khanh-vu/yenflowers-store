"""
Smart Search Service - REFACTORED
Simplified query parsing with modular extractors
"""
from typing import List, Dict, Any, Optional, Literal
import re
from pydantic import BaseModel, Field, validator
from app.database import get_db_client
import logging

logger = logging.getLogger(__name__)


# Input validation
class SearchRequest(BaseModel):
    """Validated search request"""
    query: str = Field(..., min_length=1, max_length=500)
    session_id: str = Field(..., pattern=r'^[a-zA-Z0-9_-]+$')
    user_id: Optional[str] = Field(None, pattern=r'^[a-zA-Z0-9_-]*$')
    limit: int = Field(20, ge=1, le=100)


class QueryParser:
    """
    Parses Vietnamese natural language queries
    Follows KISS: Each method does ONE thing
    """
    
    # Constants - moved outside methods for reusability
    DISTRICTS = {
        r'quận\s*(\d+)': 'district_{district}',
        r'q\.?\s*(\d+)': 'district_{district}',
        r'tân\s*bình': 'tan_binh',
        r'bình\s*thạnh': 'binh_thanh',
    }
    
    OCCASIONS = {
        r'sinh\s*nhật|birthday': 'birthday',
        r'khai\s*trương|opening': 'grand_opening',
        r'valentine': 'valentine',
        r'tình\s*yêu|romantic?': 'romance',
        r'cưới|wedding': 'wedding',
        r'chia\s*buồn|tang\s*lễ': 'sympathy',
    }
    
    FLOWERS = {
        r'hồng|roses?': 'roses',
        r'tulip': 'tulip',
        r'lan|orchid': 'orchid',
        r'hướng\s*dương|sunflower': 'sunflower',
        r'ly|lilies': 'lily',
        r'cúc|daisy': 'daisy',
    }
    
    COLORS = {
        r'đỏ|red': 'red',
        r'trắng|white': 'white',
        r'hồng|pink': 'pink',
        r'vàng|yellow': 'yellow',
        r'tím|purple': 'purple',
    }
    
    @staticmethod
    def parse(query: str) -> Dict[str, Any]:
        """Main parsing method - delegates to specialized extractors"""
        query_lower = query.lower().strip()
        
        if not query_lower:
            return {}
        
        return {
            **QueryParser._extract_price(query_lower),
            **QueryParser._extract_occasion(query_lower),
            **QueryParser._extract_flower_type(query_lower),
            **QueryParser._extract_color(query_lower),
            **QueryParser._extract_district(query_lower),
            **QueryParser._extract_urgency(query_lower),
            **QueryParser._extract_quality(query_lower),
        }
    
    @staticmethod
    def _extract_price(query: str) -> Dict[str, Any]:
        """Extract price range from query"""
        intent = {}
        
        # Match patterns like: "500k", "300k-500k", "giá 500000"
        price_pattern = r'(?:giá\s*)?(\d+)k?\s*(?:[-đếnto]+\s*(\d+)k?)?'
        match = re.search(price_pattern, query)
        
        if match:
            try:
                min_price = int(match.group(1))
                # Multiply by 1000 if 'k' suffix
                if 'k' in match.group(0):
                    min_price *= 1000
                
                max_price_str = match.group(2)
                if max_price_str:
                    max_price = int(max_price_str)
                    if 'k' in match.group(0):
                        max_price *= 1000
                    intent['price_min'] = min_price
                    intent['price_max'] = max_price
                else:
                    intent['price_max'] = min_price
            except (ValueError, AttributeError) as e:
                logger.debug(f"Price parsing error: {e}")
        
        return intent
    
    @staticmethod
    def _extract_occasion(query: str) -> Dict[str, Any]:
        """Extract occasion from query"""
        for pattern, occasion in QueryParser.OCCASIONS.items():
            if re.search(pattern, query):
                return {'occasion': occasion}
        return {}
    
    @staticmethod
    def _extract_flower_type(query: str) -> Dict[str, Any]:
        """Extract flower type"""
        for pattern, flower in QueryParser.FLOWERS.items():
            if re.search(pattern, query):
                return {'flower_type': flower}
        return {}
    
    @staticmethod
    def _extract_color(query: str) -> Dict[str, Any]:
        """Extract color preference"""
        for pattern, color in QueryParser.COLORS.items():
            if re.search(pattern, query):
                return {'color': color}
        return {}
    
    @staticmethod
    def _extract_district(query: str) -> Dict[str, Any]:
        """Extract delivery district"""
        for pattern, district in QueryParser.DISTRICTS.items():
            match = re.search(pattern, query)
            if match:
                if '{district}' in district:
                    district = district.format(district=match.group(1))
                return {'district': district}
        return {}
    
    @staticmethod
    def _extract_urgency(query: str) -> Dict[str, Any]:
        """Detect urgency"""
        urgent_keywords = ['gấp', 'urgent', 'today', 'hôm nay', 'ngay', 'nhanh']
        if any(word in query for word in urgent_keywords):
            return {'urgent': True}
        return {}
    
    @staticmethod
    def _extract_quality(query: str) -> Dict[str, Any]:
        """Extract quality preference"""
        premium_keywords = ['premium', 'sang', 'đẹp', 'cao cấp', 'luxury']
        budget_keywords = ['rẻ', 'cheap', 'giá rẻ', 'tiết kiệm']
        
        if any(word in query for word in premium_keywords):
            return {'quality': 'premium'}
        elif any(word in query for word in budget_keywords):
            return {'quality': 'budget'}
        return {}


class SmartSearchService:
    """
    Intelligent search with Vietnamese NLP - REFACTORED
    Simplified architecture: Parse → Filter → Execute
    """
    
    def __init__(self):
        self.db = get_db_client()
        self.parser = QueryParser()
    
    async def search(
        self,
        query: str,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Execute intelligent search
        
        Returns:
            Dict with query, intent, results, and count
        """
        # Validate and sanitize input
        query = query.strip()[:500]  # Max 500 chars
        
        # Parse intent
        intent = self.parser.parse(query)
        
        # Build filters
        filters = self._intent_to_filters(intent)
        
        # Execute search
        results = await self._execute_search(query, filters, limit)
        
        # Track asynchronously (don't wait)
        if session_id:
            await self._track_search(user_id, session_id, query, intent, len(results))
        
        return {
            "query": query,
            "intent": intent,
            "results": results,
            "count": len(results)
        }
    
    def _intent_to_filters(self, intent: Dict[str, Any]) -> Dict[str, Any]:
        """Convert parsed intent to database filters - SIMPLIFIED"""
        filters = {}
        
        # Price filters
        if 'price_min' in intent:
            filters['price_gte'] = intent['price_min']
        if 'price_max' in intent:
            filters['price_lte'] = intent['price_max']
        
        # Occasion → Category mapping
        if 'occasion' in intent:
            occasion_map = {
                'birthday': 'sinh-nhat',
                'romance': 'tinh-yeu',
                'valentine': 'tinh-yeu',
                'grand_opening': 'khai-truong',
                'sympathy': 'chia-buon',
                'wedding': 'cuoi',
            }
            filters['category_slug'] = occasion_map.get(intent['occasion'])
        
        # Quality → Featured flag
        if intent.get('quality') == 'premium':
            filters['is_featured'] = True
        
        return filters
    
    async def _execute_search(
        self,
        query: str,
        filters: Dict[str, Any],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Execute database search with filters - OPTIMIZED"""
        try:
            # Base query
            db_query = self.db.table("products")\
                .select("id, slug, name_vi, name_en, price, sale_price, images, category_id, is_featured")\
                .eq("is_published", True)
            
            # Apply price filters
            if 'price_gte' in filters:
                db_query = db_query.gte("price", filters['price_gte'])
            if 'price_lte' in filters:
                db_query = db_query.lte("price", filters['price_lte'])
           
            # Featured filter
            if 'is_featured' in filters:
                db_query = db_query.eq("is_featured", True)
            
            # Category filter (requires lookup)
            if 'category_slug' in filters:
                category = await self.db.table("categories")\
                    .select("id")\
                    .eq("slug", filters['category_slug'])\
                    .limit(1)\
                    .execute()
                
                if category.data:
                    db_query = db_query.eq("category_id", category.data[0]['id'])
            
            # Text search (simple ILIKE, can upgrade to full-text)
            if query:
                search_pattern = f"%{query}%"
                db_query = db_query.or_(
                    f"name_vi.ilike.{search_pattern},"
                    f"name_en.ilike.{search_pattern},"
                    f"description_vi.ilike.{search_pattern}"
                )
            
            # Order and limit
            result = await db_query\
                .order("is_featured", desc=True)\
                .order("price")\
                .limit(limit)\
                .execute()
            
            return result.data if result.data else []
        
        except Exception as e:
            logger.error(f"Search execution error: {e}", exc_info=True)
            return []
    
    async def _track_search(
        self,
        user_id: Optional[str],
        session_id: str,
        query: str,
        intent: Dict[str, Any],
        results_count: int
    ):
        """Track search for analytics"""
        try:
            await self.db.table("search_queries").insert({
                "user_id": user_id,
                "session_id": session_id,
                "query_text": query,
                "parsed_intent": intent,
                "results_count": results_count
            }).execute()
        except Exception as e:
            logger.error(f"Search tracking error: {e}")
    
    async def get_suggestions(self, partial: str, limit: int = 5) -> List[str]:
        """Get autocomplete suggestions - OPTIMIZED"""
        try:
            partial = partial.strip()[:100]  # Limit length
            
            # Use database aggregation if available, else manual
            result = await self.db.table("search_queries")\
                .select("query_text")\
                .ilike("query_text", f"{partial}%")\
                .limit(limit * 2)\
                .execute()
            
            if not result.data:
                return []
            
            # Count and sort by frequency
            frequencies = {}
            for row in result.data:
                text = row["query_text"]
                frequencies[text] = frequencies.get(text, 0) + 1
            
            sorted_suggestions = sorted(
                frequencies.items(),
                key=lambda x: x[1],
                reverse=True
            )
            
            return [s[0] for s in sorted_suggestions[:limit]]
        
        except Exception as e:
            logger.error(f"Suggestions error: {e}")
            return []
