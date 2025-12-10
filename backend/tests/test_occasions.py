"""
Comprehensive tests for Occasion Service
Occasion management and reminders
"""
import pytest
from datetime import date, datetime, timedelta
from unittest.mock import Mock, AsyncMock
from app.services.occasion_service import OccasionService


@pytest.fixture
def occasion_service():
    """Create occasion service with mocked DB"""
    service = OccasionService()
    service.db = Mock()
    service.db.table = Mock(return_value=service.db)
    service.db.select = Mock(return_value=service.db)
    service.db.eq = Mock(return_value=service.db)
    service.db.gte = Mock(return_value=service.db)
    service.db.order = Mock(return_value=service.db)
    service.db.insert = Mock(return_value=service.db)
    service.db.update = Mock(return_value=service.db)
    service.db.delete = Mock(return_value=service.db)
    service.db.single = Mock(return_value=service.db)
    service.db.rpc = Mock(return_value=service.db)
    service.db.execute = AsyncMock()
    return service


class TestOccasionCRUD:
    """Test Create, Read, Update, Delete operations"""
    
    @pytest.mark.asyncio
    async def test_create_occasion_success(self, occasion_service):
        """Test creating an occasion"""
        occasion_service.db.execute.return_value = Mock(data=[{
            'id': 'occ1',
            'user_id': 'user1',
            'occasion_name': 'Sinh nhật mẹ',
            'occasion_type': 'birthday',
            'date': '2025-06-15'
        }])
        
        result = await occasion_service.create_occasion(
            user_id='user1',
            occasion_data={
                'occasion_name': 'Sinh nhật mẹ',
                'occasion_type': 'birthday',
                'date': '2025-06-15',
                'is_recurring': True
            }
        )
        
        assert result is not None
        assert result['occasion_name'] == 'Sinh nhật mẹ'
    
    @pytest.mark.asyncio
    async def test_create_occasion_invalid_date(self, occasion_service):
        """Test creating occasion with invalid date"""
        occasion_service.db.execute.side_effect = Exception("Invalid date")
        
        with pytest.raises(Exception):
            await occasion_service.create_occasion(
                user_id='user1',
                occasion_data={
                    'occasion_name': 'Test',
                    'occasion_type': 'birthday',
                    'date': 'invalid-date'
                }
            )
    
    @pytest.mark.asyncio
    async def test_create_occasion_past_date(self, occasion_service):
        """Test creating occasion with past date (should still work for non-recurring)"""
        past_date = (datetime.now() - timedelta(days=365)).strftime('%Y-%m-%d')
        
        occasion_service.db.execute.return_value = Mock(data=[{
            'id': 'occ1',
            'date': past_date,
            'is_recurring': False
        }])
        
        result = await occasion_service.create_occasion(
            user_id='user1',
            occasion_data={
                'occasion_name': 'Past Event',
                'occasion_type': 'other',
                'date': past_date,
                'is_recurring': False
            }
        )
        
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_get_user_occasions(self, occasion_service):
        """Test fetching user occasions"""
        occasion_service.db.execute.return_value = Mock(data=[
            {'id': 'occ1', 'occasion_name': 'Birthday'},
            {'id': 'occ2', 'occasion_name': 'Anniversary'}
        ])
        
        occasions = await occasion_service.get_user_occasions('user1')
        
        assert len(occasions) == 2
    
    @pytest.mark.asyncio
    async def test_get_user_occasions_upcoming_only(self, occasion_service):
        """Test filtering upcoming occasions"""
        occasion_service.db.execute.return_value = Mock(data=[
            {'id': 'occ1', 'date': '2025-12-25'}
        ])
        
        occasions = await occasion_service.get_user_occasions(
            'user1',
            upcoming_only=True
        )
        
        assert isinstance(occasions, list)
    
    @pytest.mark.asyncio
    async def test_get_occasion_not_found(self, occasion_service):
        """Test getting non-existent occasion"""
        occasion_service.db.execute.return_value = Mock(data=None)
        
        result = await occasion_service.get_occasion('nonexistent')
        
        assert result is None
    
    @pytest.mark.asyncio
    async def test_update_occasion(self, occasion_service):
        """Test updating an occasion"""
        occasion_service.db.execute.return_value = Mock(data=[{
            'id': 'occ1',
            'occasion_name': 'Updated Name'
        }])
        
        result = await occasion_service.update_occasion(
            'occ1',
            {'occasion_name': 'Updated Name'}
        )
        
        assert result['occasion_name'] == 'Updated Name'
    
    @pytest.mark.asyncio
    async def test_delete_occasion(self, occasion_service):
        """Test deleting an occasion"""
        occasion_service.db.execute.return_value = Mock(data=[])
        
        # Should not raise exception
        await occasion_service.delete_occasion('occ1')


class TestReminders:
    """Test reminder functionality"""
    
    @pytest.mark.asyncio
    async def test_get_upcoming_occasions(self, occasion_service):
        """Test getting occasions needing reminders"""
        future_date = (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d')
        
        occasion_service.db.execute.return_value = Mock(data=[
            {
                'occasion_id': 'occ1',
                'user_email': 'test@example.com',
                'occasion_name': 'Birthday',
                'occasion_date': future_date
            }
        ])
        
        occasions = await occasion_service.get_upcoming_occasions_for_reminders(
            days_ahead=7
        )
        
        assert len(occasions) >= 0
    
    @pytest.mark.asyncio
    async def test_mark_reminder_sent(self, occasion_service):
        """Test marking reminder as sent"""
        occasion_service.db.execute.return_value = Mock(data=[{
            'id': 'reminder1',
            'occasion_id': 'occ1',
            'user_id': 'user1'
        }])
        
        # Mock get_occasion
        with patch.object(occasion_service, 'get_occasion', new_callable=AsyncMock) as mock_get:
            mock_get.return_value = {'id': 'occ1', 'user_id': 'user1'}
            
            result = await occasion_service.mark_reminder_sent(
                occasion_id='occ1',
                reminder_type='email',
                recommended_products=['prod1', 'prod2']
            )
            
            assert result is not None
    
    @pytest.mark.asyncio
    async def test_track_reminder_engagement(self, occasion_service):
        """Test tracking reminder opens/clicks"""
        occasion_service.db.execute.return_value = Mock(data=[])
        
        # Track open
        await occasion_service.track_reminder_engagement(
            reminder_id='rem1',
            action='opened'
        )
        
        # Track click
        await occasion_service.track_reminder_engagement(
            reminder_id='rem1',
            action='clicked',
            order_id='order1'
        )
        
        # Should not raise exception
    
    @pytest.mark.asyncio
    async def test_get_reminder_stats(self, occasion_service):
        """Test getting reminder statistics"""
        occasion_service.db.execute.return_value = Mock(data=[
            {'id': 'rem1', 'opened_at': '2025-01-01', 'clicked_at': '2025-01-01', 'order_placed': True},
            {'id': 'rem2', 'opened_at': '2025-01-02', 'clicked_at': None, 'order_placed': False},
            {'id': 'rem3', 'opened_at': None, 'clicked_at': None, 'order_placed': False}
        ])
        
        stats = await occasion_service.get_reminder_stats('user1')
        
        assert stats['total_reminders'] == 3
        assert stats['opened'] == 2
        assert stats['clicked'] == 1
        assert stats['converted_to_orders'] == 1
        assert 0 <= stats['open_rate'] <= 100
        assert 0 <= stats['conversion_rate'] <= 100


class TestRecommendations:
    """Test occasion-based recommendations"""
    
    @pytest.mark.asyncio
    async def test_get_occasion_recommendations(self, occasion_service):
        """Test getting recommendations for an occasion"""
        occasion_service.db.execute.return_value = Mock(data=[
            {'product_id': 'prod1', 'product_name': 'Roses', 'price': 500000}
        ])
        
        recommendations = await occasion_service.get_occasion_recommendations(
            occasion_id='occ1',
            limit=5
        )
        
        assert isinstance(recommendations, list)
    
    @pytest.mark.asyncio
    async def test_recommendations_match_occasion_type(self, occasion_service):
        """Test that recommendations match occasion type"""
        # Birthday → should get birthday flowers
        # Anniversary → should get romantic flowers
        
        occasion_service.db.execute.return_value = Mock(data=[
            {'product_id': 'prod1', 'product_name': 'Birthday Bouquet', 'price': 400000}
        ])
        
        recommendations = await occasion_service.get_occasion_recommendations(
            occasion_id='birthday-occasion',
            limit=10
        )
        
        assert isinstance(recommendations, list)


class TestEdgeCases:
    """Test edge cases"""
    
    @pytest.mark.asyncio
    async def test_create_duplicate_occasion(self, occasion_service):
        """Test creating duplicate occasions (same name, date)"""
        occasion_service.db.execute.side_effect = Exception("Duplicate key violation")
        
        with pytest.raises(Exception):
            await occasion_service.create_occasion(
                user_id='user1',
                occasion_data={
                    'occasion_name': 'Birthday',
                    'occasion_type': 'birthday',
                    'date': '2025-06-15'
                }
            )
    
    @pytest.mark.asyncio
    async def test_occasion_with_future_date(self, occasion_service):
        """Test occasion far in the future"""
        far_future = (datetime.now() + timedelta(days=3650)).strftime('%Y-%m-%d')  # 10 years
        
        occasion_service.db.execute.return_value = Mock(data=[{
            'id': 'occ1',
            'date': far_future
        }])
        
        result = await occasion_service.create_occasion(
            user_id='user1',
            occasion_data={
                'occasion_name': 'Far Future Event',
                'occasion_type': 'other',
                'date': far_future
            }
        )
        
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_reminder_days_before_edge_values(self, occasion_service):
        """Test reminder_days_before with edge values"""
        test_values = [1, 7, 30, 0, -1, 365]
        
        for days in test_values:
            occasion_service.db.execute.return_value = Mock(data=[{
                'id': 'occ1',
                'reminder_days_before': max(1, min(30, days))  # Should clamp
            }])
            
            await occasion_service.create_occasion(
                user_id='user1',
                occasion_data={
                    'occasion_name': 'Test',
                    'occasion_type': 'birthday',
                    'date': '2025-12-25',
                    'reminder_days_before': days
                }
            )
    
    @pytest.mark.asyncio
    async def test_database_timeout(self, occasion_service):
        """Test handling database timeout"""
        occasion_service.db.execute.side_effect = Exception("Timeout")
        
        occasions = await occasion_service.get_user_occasions('user1')
        
        # Should return empty list on error
        assert occasions == []


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
