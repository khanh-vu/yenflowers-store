"""
Comprehensive tests for Smart Search Service
Vietnamese NLP and query parsing
"""
import pytest
from unittest.mock import Mock, AsyncMock
from app.services.smart_search import SmartSearchService


@pytest.fixture
def smart_search():
    """Create smart search service"""
    return SmartSearchService()


class TestVietnameseQueryParsing:
    """Test Vietnamese natural language parsing"""
    
    def test_parse_price_range(self, smart_search):
        """Test price extraction"""
        # Single price
        intent = smart_search._parse_query("hoa hồng 500k")
        assert 'price_max' in intent
        assert intent['price_max'] == 500000
        
        # Price range
        intent = smart_search._parse_query("hoa 300k đến 500k")
        assert intent.get('price_min') == 300000
        assert intent.get('price_max') == 500000
        
        # With "giá" keyword
        intent = smart_search._parse_query("giá 500000 đồng")
        assert intent['price_max'] == 500000
    
    def test_parse_price_edge_cases(self, smart_search):
        """Test price parsing edge cases"""
        # No price
        intent = smart_search._parse_query("hoa hồng đỏ")
        assert 'price_min' not in intent
        assert 'price_max' not in intent
        
        # Invalid price
        intent = smart_search._parse_query("giá abc")
        assert 'price_max' not in intent
        
        # Negative price
        intent = smart_search._parse_query("giá -500k")
        assert 'price_max' not in intent or intent['price_max'] >= 0
        
        # Very large price
        intent = smart_search._parse_query("giá 999999999k")
        assert isinstance(intent.get('price_max'), (int, type(None)))
    
    def test_parse_occasion(self, smart_search):
        """Test occasion detection"""
        test_cases = [
            ("hoa sinh nhật", "sinh_nhat"),
            ("hoa tặng mẹ ngày 8/3", "mothers_day"),
            ("hoa valentine", "valentines_day"),
            ("hoa cưới", "wedding"),
            ("hoa chia buồn", "funeral"),
        ]
        
        for query, expected_occasion in test_cases:
            intent = smart_search._parse_query(query)
            assert intent.get('occasion') == expected_occasion, f"Failed for query: {query}"
    
    def test_parse_flower_type(self, smart_search):
        """Test flower type extraction"""
        test_cases = [
            ("hoa hồng đỏ", "roses"),
            ("tulip vàng", "tulips"),
            ("hoa ly trắng", "lilies"),
            ("hoa lan cao cấp", "orchids"),
            ("hướng dương", "sunflowers"),
        ]
        
        for query, expected_flower in test_cases:
            intent = smart_search._parse_query(query)
            assert intent.get('flower_type') == expected_flower, f"Failed for query: {query}"
    
    def test_parse_color(self, smart_search):
        """Test color detection"""
        colors = ['đỏ', 'trắng', 'vàng', 'hồng', 'tím', 'cam']
        
        for color in colors:
            intent = smart_search._parse_query(f"hoa {color}")
            assert intent.get('color') == color
    
    def test_parse_district(self, smart_search):
        """Test district extraction"""
        test_cases = [
            ("hoa quận 1", "1"),
            ("giao hàng quận 10", "10"),
            ("q3", "3"),
            ("quận tân bình", "tan_binh"),
        ]
        
        for query, expected_district in test_cases:
            intent = smart_search._parse_query(query)
            assert expected_district in intent.get('district', '').lower()
    
    def test_parse_urgency(self, smart_search):
        """Test urgency detection"""
        urgent_queries = [
            "hoa giao gấp",
            "cần gấp",
            "hoa giao ngay",
            "giao nhanh"
        ]
        
        for query in urgent_queries:
            intent = smart_search._parse_query(query)
            assert intent.get('urgent') == True
    
    def test_parse_quality(self, smart_search):
        """Test quality level detection"""
        intent = smart_search._parse_query("hoa cao cấp")
        assert intent.get('quality') == 'premium'
        
        intent = smart_search._parse_query("hoa sang trọng")
        assert intent.get('quality') == 'premium'
    
    def test_parse_complex_query(self, smart_search):
        """Test complex multi-intent query"""
        query = "hoa hồng đỏ giá 500k giao quận 1 gấp"
        intent = smart_search._parse_query(query)
        
        assert intent.get('flower_type') == 'roses'
        assert intent.get('color') == 'đỏ'
        assert intent.get('price_max') == 500000
        assert '1' in intent.get('district', '')
        assert intent.get('urgent') == True
    
    def test_parse_empty_query(self, smart_search):
        """Test empty or whitespace queries"""
        assert smart_search._parse_query("") == {}
        assert smart_search._parse_query("   ") == {}
        assert smart_search._parse_query("\n\t") == {}
    
    def test_parse_special_characters(self, smart_search):
        """Test queries with special characters"""
        queries = [
            "hoa@#$%",
            "hoa; DROP TABLE products;",
            "hoa' OR '1'='1",
            "hoa<script>alert('xss')</script>",
        ]
        
        for query in queries:
            intent = smart_search._parse_query(query)
            # Should not crash
            assert isinstance(intent, dict)


class TestSearchFunctionality:
    """Test search execution and filtering"""
    
    @pytest.mark.asyncio
    async def test_search_basic(self, smart_search):
        """Test basic search"""
        # Mock database
        smart_search.db = Mock()
        smart_search.db.table = Mock(return_value=smart_search.db)
        smart_search.db.select = Mock(return_value=smart_search.db)
        smart_search.db.eq = Mock(return_value=smart_search.db)
        smart_search.db.gte = Mock(return_value=smart_search.db)
        smart_search.db.lte = Mock(return_value=smart_search.db)
        smart_search.db.ilike = Mock(return_value=smart_search.db)
        smart_search.db.limit = Mock(return_value=smart_search.db)
        smart_search.db.execute = AsyncMock(return_value=Mock(data=[]))
        
        results = await smart_search.search(
            query="hoa hồng",
            session_id="test",
            limit=10
        )
        
        assert 'intent' in results
        assert 'results' in results
        assert 'count' in results
    
    @pytest.mark.asyncio
    async def test_search_with_filters(self, smart_search):
        """Test search with multiple filters"""
        smart_search.db = Mock()
        smart_search.db.table = Mock(return_value=smart_search.db)
        smart_search.db.select = Mock(return_value=smart_search.db)
        smart_search.db.eq = Mock(return_value=smart_search.db)
        smart_search.db.gte = Mock(return_value=smart_search.db)
        smart_search.db.lte = Mock(return_value=smart_search.db)
        smart_search.db.ilike = Mock(return_value=smart_search.db)
        smart_search.db.limit = Mock(return_value=smart_search.db)
        smart_search.db.execute = AsyncMock(return_value=Mock(data=[
            {
                'id': 'prod1',
                'name_vi': 'Hoa hồng đỏ',
                'price': 500000,
                'images': []
            }
        ]))
        
        results = await smart_search.search(
            query="hoa hồng đỏ giá 500k",
            session_id="test",
            limit=20
        )
        
        assert results['count'] == 1
        assert len(results['results']) == 1
    
    @pytest.mark.asyncio
    async def test_search_no_results(self, smart_search):
        """Test search with no matching products"""
        smart_search.db = Mock()
        smart_search.db.table = Mock(return_value=smart_search.db)
        smart_search.db.select = Mock(return_value=smart_search.db)
        smart_search.db.eq = Mock(return_value=smart_search.db)
        smart_search.db.limit = Mock(return_value=smart_search.db)
        smart_search.db.execute = AsyncMock(return_value=Mock(data=[]))
        
        results = await smart_search.search(
            query="hoa không tồn tại xyz123",
            session_id="test",
            limit=10
        )
        
        assert results['count'] == 0
        assert results['results'] == []
    
    @pytest.mark.asyncio
    async def test_search_tracking(self, smart_search):
        """Test that searches are tracked"""
        smart_search.db = Mock()
        smart_search.db.table = Mock(return_value=smart_search.db)
        smart_search.db.select = Mock(return_value=smart_search.db)
        smart_search.db.insert = Mock(return_value=smart_search.db)
        smart_search.db.execute = AsyncMock(return_value=Mock(data=[]))
        
        await smart_search.search(
            query="test query",
            session_id="session1",
            user_id="user1",
            limit=10
        )
        
        # Verify tracking was called
        smart_search.db.insert.assert_called()


class TestSearchEdgeCases:
    """Test edge cases and error scenarios"""
    
    @pytest.mark.asyncio
    async def test_very_long_query(self, smart_search):
        """Test with extremely long query"""
        long_query = "hoa " * 1000
        
        intent = smart_search._parse_query(long_query)
        
        # Should handle without crashing
        assert isinstance(intent, dict)
    
    @pytest.mark.asyncio
    async def test_unicode_characters(self, smart_search):
        """Test Vietnamese unicode"""
        queries = [
            "hoa hồng",
            "hoa đào",
            "hoa cúc",
            "hoa mẫu đơn",
        ]
        
        for query in queries:
            intent = smart_search._parse_query(query)
            assert isinstance(intent, dict)
    
    @pytest.mark.asyncio
    async def test_sql_injection(self, smart_search):
        """Test SQL injection protection"""
        malicious_queries = [
            "'; DROP TABLE products; --",
            "' OR '1'='1",
            "1'; DELETE FROM products WHERE '1'='1",
        ]
        
        for query in malicious_queries:
            intent = smart_search._parse_query(query)
            # Should sanitize and not break
            assert isinstance(intent, dict)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
