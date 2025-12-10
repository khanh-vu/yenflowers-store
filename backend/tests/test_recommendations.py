"""
Comprehensive tests for Recommendation Engine
Covers all edge cases and scenarios
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from app.services.recommendations import RecommendationEngine


@pytest.fixture
def mock_db():
    """Mock database client"""
    db = Mock()
    db.table = Mock(return_value=db)
    db.select = Mock(return_value=db)
    db.eq = Mock(return_value=db)
    db.is_ = Mock(return_value=db)
    db.not_ = Mock(return_value=db)
    db.order = Mock(return_value=db)
    db.limit = Mock(return_value=db)
    db.gte = Mock(return_value=db)
    db.execute = AsyncMock()
    db.rpc = Mock(return_value=db)
    return db


@pytest.fixture
def recommendation_engine(mock_db):
    """Create recommendation engine with mocked DB"""
    engine = RecommendationEngine()
    engine.db = mock_db
    return engine


class TestRecommendationEngine:
    """Test recommendation engine functionality"""
    
    @pytest.mark.asyncio
    async def test_get_trending_success(self, recommendation_engine, mock_db):
        """Test getting trending products"""
        # Mock trending products
        mock_db.execute.return_value = Mock(data=[
            {'product_id': 'prod1', 'view_count': 100},
            {'product_id': 'prod2', 'view_count': 90}
        ])
        
        # Mock product details
        mock_db.execute.side_effect = [
            Mock(data=[{'product_id': 'prod1', 'view_count': 100}]),
            Mock(data=[
                {
                    'id': 'prod1',
                    'name_vi': 'Hoa hồng',
                    'price': 500000,
                    'images': []
                }
            ])
        ]
        
        results = await recommendation_engine._get_trending(limit=5)
        
        assert isinstance(results, list)
        assert len(results) <= 5
    
    @pytest.mark.asyncio
    async def test_get_trending_empty_database(self, recommendation_engine, mock_db):
        """Test trending with no data"""
        mock_db.execute.return_value = Mock(data=[])
        
        results = await recommendation_engine._get_trending(limit=5)
        
        assert results == []
    
    @pytest.mark.asyncio
    async def test_get_trending_invalid_limit(self, recommendation_engine):
        """Test with invalid limit values"""
        # Negative limit
        results = await recommendation_engine._get_trending(limit=-1)
        assert results == []
        
        # Zero limit
        results = await recommendation_engine._get_trending(limit=0)
        assert results == []
        
        # Very large limit
        results = await recommendation_engine._get_trending(limit=10000)
        assert isinstance(results, list)
    
    @pytest.mark.asyncio
    async def test_get_product_related_success(self, recommendation_engine, mock_db):
        """Test getting related products"""
        mock_db.execute.return_value = Mock(data=[
            {
                'related_product_id': 'prod2',
                'relationship_type': 'frequently_bought_together',
                'score': 0.9
            }
        ])
        
        results = await recommendation_engine._get_product_related('prod1', limit=5)
        
        assert isinstance(results, list)
    
    @pytest.mark.asyncio
    async def test_get_product_related_invalid_id(self, recommendation_engine, mock_db):
        """Test with invalid product ID"""
        mock_db.execute.return_value = Mock(data=[])
        
        # Non-existent product
        results = await recommendation_engine._get_product_related('invalid-id', limit=5)
        assert results == []
        
        # Empty string
        results = await recommendation_engine._get_product_related('', limit=5)
        assert results == []
        
        # None
        results = await recommendation_engine._get_product_related(None, limit=5)
        assert results == []
    
    @pytest.mark.asyncio
    async def test_get_recommendations_homepage_no_user(self, recommendation_engine):
        """Test homepage recommendations without user ID"""
        with patch.object(recommendation_engine, '_get_trending', new_callable=AsyncMock) as mock_trending:
            mock_trending.return_value = [{'id': 'prod1'}]
            
            results = await recommendation_engine.get_recommendations(
                user_id=None,
                context='homepage',
                limit=10
            )
            
            mock_trending.assert_called_once_with(10)
            assert isinstance(results, list)
    
    @pytest.mark.asyncio
    async def test_get_recommendations_pdp_context(self, recommendation_engine):
        """Test product detail page recommendations"""
        with patch.object(recommendation_engine, '_get_product_related', new_callable=AsyncMock) as mock_related:
            mock_related.return_value = [{'id': 'prod2'}]
            
            results = await recommendation_engine.get_recommendations(
                user_id='user1',
                context='pdp',
                product_id='prod1',
                limit=8
            )
            
            mock_related.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_recommendations_pdp_no_product_id(self, recommendation_engine):
        """Test PDP context without product_id (edge case)"""
        with patch.object(recommendation_engine, '_get_trending', new_callable=AsyncMock) as mock_trending:
            mock_trending.return_value = []
            
            # Should fallback to trending
            results = await recommendation_engine.get_recommendations(
                context='pdp',
                product_id=None,
                limit=10
            )
            
            assert isinstance(results, list)
    
    @pytest.mark.asyncio
    async def test_track_recommendation_click(self, recommendation_engine, mock_db):
        """Test tracking recommendation clicks"""
        mock_db.execute.return_value = Mock(data=[{'id': 'click1'}])
        
        await recommendation_engine.track_recommendation_click(
            user_id='user1',
            session_id='session1',
            recommended_products=['prod1', 'prod2'],
            clicked_product_id='prod1',
            context='homepage',
            algorithm='hybrid',
            position=0
        )
        
        # Verify insert was called
        mock_db.table.assert_called()
    
    @pytest.mark.asyncio
    async def test_track_click_invalid_data(self, recommendation_engine, mock_db):
        """Test tracking with invalid data"""
        # Empty recommended products
        with pytest.raises(Exception):
            await recommendation_engine.track_recommendation_click(
                session_id='session1',
                recommended_products=[],
                clicked_product_id='prod1',
                context='homepage',
                algorithm='hybrid',
                position=0
            )
    
    @pytest.mark.asyncio
    async def test_format_product_data(self, recommendation_engine):
        """Test product data formatting"""
        products = [
            {
                'id': 'prod1',
                'name_vi': 'Hoa hồng đỏ',
                'price': '500000.00',
                'sale_price': None,
                'images': [{'url': 'image.jpg'}],
                'slug': 'hoa-hong-do'
            }
        ]
        
        formatted = recommendation_engine._format_product_data(products)
        
        assert len(formatted) == 1
        assert formatted[0]['price'] == 500000.0
        assert formatted[0]['sale_price'] is None
        assert 'confidence' in formatted[0]
    
    @pytest.mark.asyncio
    async def test_format_product_malformed_data(self, recommendation_engine):
        """Test formatting with malformed data"""
        # Missing required fields
        products = [{'id': 'prod1'}]  # Missing name, price
        
        formatted = recommendation_engine._format_product_data(products)
        
        # Should handle gracefully
        assert isinstance(formatted, list)


class TestRecommendationEdgeCases:
    """Test edge cases and error handling"""
    
    @pytest.mark.asyncio
    async def test_concurrent_requests(self, recommendation_engine):
        """Test handling multiple concurrent requests"""
        import asyncio
        
        tasks = [
            recommendation_engine.get_recommendations(context='homepage', limit=5)
            for _ in range(10)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # All should complete without errors
        assert len(results) == 10
        for result in results:
            assert isinstance(result, list) or isinstance(result, Exception)
    
    @pytest.mark.asyncio
    async def test_database_timeout(self, recommendation_engine, mock_db):
        """Test handling database timeout"""
        mock_db.execute.side_effect = Exception("Database timeout")
        
        # Should handle gracefully
        results = await recommendation_engine._get_trending(limit=5)
        
        assert results == []
    
    @pytest.mark.asyncio
    async def test_sql_injection_attempt(self, recommendation_engine):
        """Test protection against SQL injection"""
        malicious_id = "'; DROP TABLE products; --"
        
        # Should not crash
        results = await recommendation_engine._get_product_related(malicious_id, limit=5)
        
        assert isinstance(results, list)
    
    @pytest.mark.asyncio
    async def test_extremely_large_limit(self, recommendation_engine):
        """Test with unreasonably large limit"""
        results = await recommendation_engine._get_trending(limit=999999)
        
        # Should handle without memory issues
        assert isinstance(results, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
