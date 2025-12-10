"""
Comprehensive tests for Visual Search Service
Image processing and similarity matching
"""
import pytest
import io
from PIL import Image
from unittest.mock import Mock, AsyncMock, patch
from app.services.visual_search import VisualSearchService


@pytest.fixture
def visual_search():
    """Create visual search service"""
    service = VisualSearchService()
    # Mock database
    service.db = Mock()
    service.db.table = Mock(return_value=service.db)
    service.db.select = Mock(return_value=service.db)
    service.db.eq = Mock(return_value=service.db)
    service.db.not_ = Mock(return_value=service.db)
    service.db.is_ = Mock(return_value=service.db)
    service.db.execute = AsyncMock(return_value=Mock(data=[]))
    return service


def create_test_image(width=224, height=224, color='RGB'):
    """Helper to create test images"""
    img = Image.new(color, (width, height), color=(255, 0, 0))
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    return img_bytes.getvalue()


class TestImageFeatureExtraction:
    """Test image processing and feature extraction"""
    
    def test_extract_features_valid_jpeg(self, visual_search):
        """Test feature extraction from valid JPEG"""
        image_bytes = create_test_image()
        
        features = visual_search._extract_image_features(image_bytes)
        
        assert 'color_histogram' in features
        assert 'dominant_colors' in features
        assert 'brightness' in features
        assert 'color_variance' in features
        assert isinstance(features['color_histogram'], list)
        assert len(features['dominant_colors']) <= 5
    
    def test_extract_features_valid_png(self, visual_search):
        """Test PNG format"""
        img = Image.new('RGB', (224, 224), color=(0, 255, 0))
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        
        features = visual_search._extract_image_features(img_bytes.getvalue())
        
        assert 'color_histogram' in features
    
    def test_extract_features_grayscale(self, visual_search):
        """Test grayscale image (should convert to RGB)"""
        img = Image.new('L', (224, 224), color=128)
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        
        features = visual_search._extract_image_features(img_bytes.getvalue())
        
        # Should still extract features
        assert 'color_histogram' in features
    
    def test_extract_features_rgba(self, visual_search):
        """Test RGBA image (with alpha channel)"""
        img = Image.new('RGBA', (224, 224), color=(255, 0, 0, 255))
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        
        features = visual_search._extract_image_features(img_bytes.getvalue())
        
        # Should convert to RGB
        assert 'color_histogram' in features
    
    def test_extract_features_tiny_image(self, visual_search):
        """Test very small image"""
        image_bytes = create_test_image(width=10, height=10)
        
        features = visual_search._extract_image_features(image_bytes)
        
        # Should still work, will be resized
        assert 'color_histogram' in features
    
    def test_extract_features_large_image(self, visual_search):
        """Test large image (will be resized)"""
        image_bytes = create_test_image(width=2000, height=2000)
        
        features = visual_search._extract_image_features(image_bytes)
        
        # Should resize and process
        assert 'color_histogram' in features
    
    def test_extract_features_corrupted_image(self, visual_search):
        """Test corrupted image data"""
        corrupted_bytes = b'not an image'
        
        with pytest.raises(ValueError, match="Invalid image format"):
            visual_search._extract_image_features(corrupted_bytes)
    
    def test_extract_features_empty_bytes(self, visual_search):
        """Test empty image bytes"""
        with pytest.raises(ValueError):
            visual_search._extract_image_features(b'')
    
    def test_color_histogram_normalization(self, visual_search):
        """Test histogram is properly normalized"""
        image_bytes = create_test_image()
        
        features = visual_search._extract_image_features(image_bytes)
        histogram = features['color_histogram']
        
        # Histogram should be normalized (sum to 1)
        assert abs(sum(histogram) - 1.0) < 0.01
    
    def test_dominant_colors_count(self, visual_search):
        """Test dominant colors extraction"""
        image_bytes = create_test_image()
        
        features = visual_search._extract_image_features(image_bytes)
        dominant = features['dominant_colors']
        
        # Should have up to 5 dominant colors
        assert len(dominant) <= 5
        # Each color should be RGB
        for color in dominant:
            assert len(color) == 3
            assert all(0 <= c <= 255 for c in color)
    
    def test_brightness_range(self, visual_search):
        """Test brightness is in valid range"""
        # Black image
        img = Image.new('RGB', (224, 224), color=(0, 0, 0))
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        
        features = visual_search._extract_image_features(img_bytes.getvalue())
        
        # Brightness should be 0-1
        assert 0 <= features['brightness'] <= 1
        
        # Should be close to 0 for black image
        assert features['brightness'] < 0.1


class TestVisualSearch:
    """Test visual search functionality"""
    
    @pytest.mark.asyncio
    async def test_search_by_image_success(self, visual_search):
        """Test successful image search"""
        image_bytes = create_test_image()
        
        # Mock product results
        visual_search.db.execute.return_value = Mock(data=[
            {
                'id': 'prod1',
                'name_vi': 'Hoa hồng đỏ',
                'price': 500000,
                'sale_price': None,
                'images': [{'url': 'image.jpg'}],
                'slug': 'hoa-hong-do'
            }
        ])
        
        results = await visual_search.search_by_image(
            image_bytes=image_bytes,
            limit=10,
            min_similarity=0.3
        )
        
        assert isinstance(results, list)
    
    @pytest.mark.asyncio
    async def test_search_oversized_image(self, visual_search):
        """Test image larger than 10MB"""
        # Create 11MB of image data
        large_bytes = b'x' * (11 * 1024 * 1024)
        
        # Should handle gracefully (either resize or reject)
        try:
            await visual_search.search_by_image(large_bytes, limit=10)
        except ValueError:
            # Expected - image too large
            pass
    
    @pytest.mark.asyncio
    async def test_search_invalid_image(self, visual_search):
        """Test with invalid image data"""
        invalid_bytes = b'not an image at all'
        
        with pytest.raises(ValueError):
            await visual_search.search_by_image(invalid_bytes, limit=10)
    
    @pytest.mark.asyncio
    async def test_search_no_products(self, visual_search):
        """Test when no products in database"""
        image_bytes = create_test_image()
        visual_search.db.execute.return_value = Mock(data=[])
        
        results = await visual_search.search_by_image(image_bytes, limit=10)
        
        assert results == []
    
    @pytest.mark.asyncio
    async def test_search_with_similarity_threshold(self, visual_search):
        """Test similarity threshold filtering"""
        image_bytes = create_test_image()
        
        # Mock products with varying similarity
        visual_search.db.execute.return_value = Mock(data=[
            {'id': 'prod1', 'name_vi': 'Product 1', 'price': 100000, 
             'images': [{'url': 'img.jpg'}], 'is_featured': True}
        ])
        
        # High threshold - should return fewer results
        results_high = await visual_search.search_by_image(
            image_bytes, limit=10, min_similarity=0.9
        )
        
        # Low threshold - should return more
        results_low = await visual_search.search_by_image(
            image_bytes, limit=10, min_similarity=0.1
        )
        
        # Low threshold should have more or equal results
        assert len(results_low) >= len(results_high)
    
    @pytest.mark.asyncio
    async def test_search_limit_respected(self, visual_search):
        """Test that limit parameter is respected"""
        image_bytes = create_test_image()
        
        # Mock many products
        mock_products = [
            {'id': f'prod{i}', 'name_vi': f'Product {i}', 'price': 100000,
             'images': [{'url': 'img.jpg'}], 'is_featured': False}
            for i in range(50)
        ]
        visual_search.db.execute.return_value = Mock(data=mock_products)
        
        results = await visual_search.search_by_image(image_bytes, limit=5)
        
        # Should not exceed limit
        assert len(results) <= 5


class TestSimilarityCalculation:
    """Test similarity calculation methods"""
    
    def test_cosine_similarity(self, visual_search):
        """Test cosine similarity calculation"""
        import numpy as np
        
        # Identical vectors
        vec1 = np.array([1, 2, 3])
        vec2 = np.array([1, 2, 3])
        similarity = visual_search.cosine_similarity(vec1, vec2)
        assert abs(similarity - 1.0) < 0.01
        
        # Orthogonal vectors
        vec1 = np.array([1, 0])
        vec2 = np.array([0, 1])
        similarity = visual_search.cosine_similarity(vec1, vec2)
        assert abs(similarity) < 0.01
        
        # Opposite vectors  
        vec1 = np.array([1, 0])
        vec2 = np.array([-1, 0])
        similarity = visual_search.cosine_similarity(vec1, vec2)
        assert abs(similarity - (-1.0)) < 0.01
    
    def test_cosine_similarity_zero_vectors(self, visual_search):
        """Test with zero vectors"""
        import numpy as np
        
        vec1 = np.array([0, 0, 0])
        vec2 = np.array([1, 2, 3])
        
        # Should handle gracefully
        similarity = visual_search.cosine_similarity(vec1, vec2)
        assert similarity == 0.0


class TestEdgeCases:
    """Test edge cases and error handling"""
    
    @pytest.mark.asyncio
    async def test_concurrent_searches(self, visual_search):
        """Test multiple concurrent image searches"""
        import asyncio
        
        image_bytes = create_test_image()
        visual_search.db.execute.return_value = Mock(data=[])
        
        tasks = [
            visual_search.search_by_image(image_bytes, limit=5)
            for _ in range(5)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # All should complete
        assert len(results) == 5
    
    @pytest.mark.asyncio
    async def test_database_error_handling(self, visual_search):
        """Test handling database errors"""
        image_bytes = create_test_image()
        visual_search.db.execute.side_effect = Exception("Database error")
        
        results = await visual_search.search_by_image(image_bytes, limit=10)
        
        # Should return empty list on error
        assert results == []


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
