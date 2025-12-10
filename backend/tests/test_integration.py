"""
Integration tests for AI features with real database
These tests require actual Supabase connection
"""
import pytest
import os
from app.database import get_db_client


# Skip if no DB credentials
pytestmark = pytest.mark.skipif(
    not os.getenv('SUPABASE_URL'),
    reason="Integration tests require SUPABASE_URL environment variable"
)


@pytest.fixture(scope="module")
def db_client():
    """Get real database client"""
    return get_db_client()


@pytest.mark.asyncio
@pytest.mark.integration
async def test_end_to_end_recommendation_flow(db_client):
    """
    Test complete recommendation flow:
    1. User views products
    2. System tracks interactions
    3. Get recommendations
    4. Track recommendation click
    5. Verify analytics
    """
    from app.services.recommendations import RecommendationEngine
    from app.services.interaction_tracker import InteractionTracker
    
    engine = RecommendationEngine()
    tracker = InteractionTracker()
    
    # Step 1: Track some product views
    session_id = "test_session_123"
    await tracker.track_event(
        session_id=session_id,
        event_type="view",
        product_id="test_product_1"
    )
    
    # Step 2: Get recommendations
    recommendations = await engine.get_recommendations(
        context="homepage",
        limit=5
    )
    
    assert isinstance(recommendations, list)
    assert len(recommendations) <= 5
    
    # Step 3: Track recommendation click
    if recommendations:
        await engine.track_recommendation_click(
            session_id=session_id,
            recommended_products=[r['id'] for r in recommendations],
            clicked_product_id=recommendations[0]['id'],
            context="homepage",
            algorithm="hybrid",
            position=0
        )


@pytest.mark.asyncio
@pytest.mark.integration
async def test_end_to_end_search_flow(db_client):
    """
    Test complete search flow:
    1. Search with Vietnamese query
    2. Verify intent parsing
    3. Check results
    4. Track search
    """
    from app.services.smart_search import SmartSearchService
    
    search = SmartSearchService()
    
    # Search for roses under 500k
    result = await search.search(
        query="hoa hồng đỏ giá 500k",
        session_id="test_session_456",
        limit=10
    )
    
    # Verify intent was parsed
    assert 'intent' in result
    assert 'flower_type' in result['intent']
    assert 'price_max' in result['intent']
    
    # Verify results structure
    assert 'results' in result
    assert 'count' in result


@pytest.mark.asyncio
@pytest.mark.integration
async def test_occasion_reminder_workflow(db_client):
    """
    Test occasion creation → recommendation → reminder flow
    """
    from app.services.occasion_service import OccasionService
    from datetime import date, timedelta
    
    service = OccasionService()
    
    # Create test occasion
    future_date = (date.today() + timedelta(days=10)).isoformat()
    
    occasion = await service.create_occasion(
        user_id="test_user_123",
        occasion_data={
            'occasion_name': 'Test Birthday',
            'occasion_type': 'birthday',
            'date': future_date,
            'is_recurring': True,
            'reminder_days_before': 7,
            'reminder_enabled': True
        }
    )
    
    assert occasion is not None
    assert occasion['occasion_name'] == 'Test Birthday'
    
    # Get recommendations for this occasion
    recommendations = await service.get_occasion_recommendations(
        occasion_id=occasion['id'],
        limit=5
    )
    
    assert isinstance(recommendations, list)
    
    # Cleanup
    await service.delete_occasion(occasion['id'])


@pytest.mark.asyncio
@pytest.mark.integration  
async def test_database_migrations_applied():
    """Verify all required tables exist"""
    db = get_db_client()
    
    required_tables = [
        'user_interactions',
        'product_relationships',
        'recommendation_clicks',
        'search_queries',
        'customer_occasions',
        'occasion_reminders'
    ]
    
    for table in required_tables:
        # Try to query table (will fail if doesn't exist)
        result = await db.table(table).select("*").limit(1).execute()
        assert result is not None, f"Table {table} not found"


@pytest.mark.asyncio
@pytest.mark.integration
async def test_performance_recommendations():
    """Test recommendation performance under load"""
    import time
    from app.services.recommendations import RecommendationEngine
    
    engine = RecommendationEngine()
    
    start = time.time()
    
    # Run 10 concurrent recommendation requests
    import asyncio
    tasks = [
        engine.get_recommendations(context="homepage", limit=10)
        for _ in range(10)
    ]
    
    results = await asyncio.gather(*tasks)
    
    elapsed = time.time() - start
    
    # Should complete in reasonable time
    assert elapsed < 5.0, f"Recommendations too slow: {elapsed}s"
    assert all(isinstance(r, list) for r in results)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-m", "integration"])
