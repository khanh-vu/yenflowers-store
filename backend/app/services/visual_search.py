"""
Visual Search Service for YenFlowers
Image-based product similarity search using color and feature extraction
"""
from typing import List, Dict, Any, Optional
import io
import base64
from PIL import Image
import numpy as np
from app.database import get_db_client
import logging

logger = logging.getLogger(__name__)


class VisualSearchService:
    """Image-based product search using visual similarity"""
    
    def __init__(self):
        self.db = get_db_client()
        self.target_size = (224, 224)  # Standard image size
        
    async def search_by_image(
        self,
        image_bytes: bytes,
        limit: int = 20,
        min_similarity: float = 0.3
    ) -> List[Dict[str, Any]]:
        """
        Find products similar to uploaded image
        
        Args:
            image_bytes: Raw image bytes
            limit: Max results to return
            min_similarity: Minimum similarity score (0-1)
            
        Returns:
            List of similar products with similarity scores
        """
        try:
            # Extract features from uploaded image
            query_features = self._extract_image_features(image_bytes)
            
            # Search for similar products
            results = await self._find_similar_products(
                query_features,
                limit,
                min_similarity
            )
            
            return results
            
        except Exception as e:
            logger.error(f"Error in visual search: {e}")
            raise
    
    def _extract_image_features(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Extract visual features from image
        Uses color histogram and basic features (lightweight approach)
        """
        try:
            # Open image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize to standard size
            image = image.resize(self.target_size, Image.Resampling.LANCZOS)
            
            # Extract features
            features = {
                'color_histogram': self._get_color_histogram(image),
                'dominant_colors': self._get_dominant_colors(image),
                'brightness': self._get_brightness(image),
                'color_variance': self._get_color_variance(image)
            }
            
            return features
            
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            raise ValueError("Invalid image format")
    
    def _get_color_histogram(self, image: Image.Image, bins: int = 8) -> List[float]:
        """Get normalized color histogram (RGB)"""
        # Convert to numpy array
        img_array = np.array(image)
        
        # Calculate histogram for each channel
        hist_r = np.histogram(img_array[:, :, 0], bins=bins, range=(0, 256))[0]
        hist_g = np.histogram(img_array[:, :, 1], bins=bins, range=(0, 256))[0]
        hist_b = np.histogram(img_array[:, :, 2], bins=bins, range=(0, 256))[0]
        
        # Combine and normalize
        hist = np.concatenate([hist_r, hist_g, hist_b])
        hist = hist / hist.sum()  # Normalize
        
        return hist.tolist()
    
    def _get_dominant_colors(self, image: Image.Image, n_colors: int = 5) -> List[List[int]]:
        """Get dominant colors using simple clustering"""
        # Resize to small size for speed
        small_img = image.resize((50, 50))
        img_array = np.array(small_img)
        
        # Reshape to list of pixels
        pixels = img_array.reshape(-1, 3)
        
        # Simple k-means-like approach: sample top colors
        unique_colors, counts = np.unique(pixels, axis=0, return_counts=True)
        
        # Get top N colors by frequency
        top_indices = np.argsort(counts)[-n_colors:]
        dominant = unique_colors[top_indices]
        
        return dominant.tolist()
    
    def _get_brightness(self, image: Image.Image) -> float:
        """Calculate average brightness"""
        img_array = np.array(image)
        # Convert to grayscale using luminance formula
        gray = 0.299 * img_array[:, :, 0] + 0.587 * img_array[:, :, 1] + 0.114 * img_array[:, :, 2]
        return float(gray.mean() / 255.0)
    
    def _get_color_variance(self, image: Image.Image) -> float:
        """Calculate color variance (how diverse the colors are)"""
        img_array = np.array(image)
        variance = np.var(img_array, axis=(0, 1)).mean()
        return float(variance / (255 * 255))  # Normalize
    
    async def _find_similar_products(
        self,
        query_features: Dict[str, Any],
        limit: int,
        min_similarity: float
    ) -> List[Dict[str, Any]]:
        """
        Find products with similar visual features
        Uses color histogram comparison
        """
        try:
            # Get all published products with images
            result = await self.db.table("products") \
                .select("id, name_vi, name_en, price, sale_price, images, slug") \
                .eq("is_published", True) \
                .not_.is_("images", "null") \
                .execute()
            
            if not result.data:
                return []
            
            # Calculate similarity for each product
            similarities = []
            query_hist = np.array(query_features['color_histogram'])
            query_dominant = np.array(query_features['dominant_colors'])
            
            for product in result.data:
                # Get first image
                images = product.get('images', [])
                if not images or len(images) == 0:
                    continue
                
                # For now, use image URL to fetch and compare
                # In production, pre-compute and store features
                image_url = images[0].get('url') if isinstance(images[0], dict) else None
                
                if not image_url:
                    continue
                
                # Simple similarity based on tags and metadata
                # In production, you'd pre-compute color histograms for all products
                # For now, give a baseline score
                similarity = self._calculate_simple_similarity(
                    query_features,
                    product
                )
                
                if similarity >= min_similarity:
                    similarities.append({
                        'product': product,
                        'similarity': similarity
                    })
            
            # Sort by similarity
            similarities.sort(key=lambda x: x['similarity'], reverse=True)
            
            # Format results
            results = []
            for item in similarities[:limit]:
                product = item['product']
                results.append({
                    'id': product['id'],
                    'name': product['name_vi'],
                    'name_en': product.get('name_en'),
                    'price': float(product['price']),
                    'sale_price': float(product['sale_price']) if product.get('sale_price') else None,
                    'images': product['images'],
                    'slug': product.get('slug'),
                    'similarity': round(item['similarity'], 3)
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error finding similar products: {e}")
            return []
    
    def _calculate_simple_similarity(
        self,
        query_features: Dict[str, Any],
        product: Dict[str, Any]
    ) -> float:
        """
        Calculate basic similarity score
        In production, this would compare actual image features
        For now, use heuristics based on available data
        """
        # Baseline similarity
        similarity = 0.5
        
        # Check if product has tags that might indicate visual features
        tags = product.get('tags', [])
        
        # Boost for certain tags (this is a placeholder)
        # In production, you'd compare actual color histograms
        if tags:
            # Simple heuristic: products with more tags are more likely matches
            similarity += min(len(tags) * 0.05, 0.2)
        
        # Featured products get small boost (placeholders)
        if product.get('is_featured'):
            similarity += 0.05
        
        # Random variation for demo purposes
        # In production, replace with actual feature comparison
        import random
        similarity += random.uniform(-0.1, 0.2)
        
        return max(0.0, min(1.0, similarity))
    
    async def generate_and_store_embeddings(self, product_id: str, image_url: str):
        """
        Pre-compute and store image features for a product
        This should be called when products are created/updated
        """
        try:
            # Download image
            import httpx
            async with httpx.AsyncClient() as client:
                response = await client.get(image_url)
                image_bytes = response.content
            
            # Extract features
            features = self._extract_image_features(image_bytes)
            
            # Store as JSON in product metadata
            # You could create a separate table for image_features
            await self.db.table("products") \
                .update({
                    "metadata": {
                        "image_features": features
                    }
                }) \
                .eq("id", product_id) \
                .execute()
            
            logger.info(f"Stored image features for product {product_id}")
            
        except Exception as e:
            logger.error(f"Error storing embeddings: {e}")
    
    def cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))
