import { useEffect, useState } from 'react';
import { aiApi, getSessionId } from '@/services/ai-api';
import type { Product } from '@/types';

/**
 * Hook to track product view events
 */
export function useTrackProductView(productId: string | undefined, categoryId?: string) {
    useEffect(() => {
        if (productId) {
            const sessionId = getSessionId();
            aiApi.trackInteraction({
                session_id: sessionId,
                event_type: 'view',
                product_id: productId,
                category_id: categoryId,
            }).catch(console.error);
        }
    }, [productId, categoryId]);
}

/**
 * Hook to get product recommendations
 */
export function useRecommendations(
    context: 'homepage' | 'pdp' | 'cart',
    productId?: string,
    limit = 10
) {
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRecommendations() {
            try {
                setLoading(true);
                const result = await aiApi.getRecommendations({
                    context,
                    product_id: productId,
                    limit,
                });
                setRecommendations(result.recommendations);
                setError(null);
            } catch (err) {
                console.error('Error fetching recommendations:', err);
                setError(err instanceof Error ? err.message : 'Failed to load recommendations');
            } finally {
                setLoading(false);
            }
        }

        fetchRecommendations();
    }, [context, productId, limit]);

    return { recommendations, loading, error };
}

/**
 * Hook to track recommendation clicks
 */
export function useTrackRecommendationClick() {
    return async (
        recommendedProducts: string[],
        clickedProductId: string,
        context: string,
        position: number
    ) => {
        const sessionId = getSessionId();
        try {
            await aiApi.trackRecommendationClick({
                session_id: sessionId,
                recommended_products: recommendedProducts,
                clicked_product_id: clickedProductId,
                context,
                algorithm: 'hybrid',
                position,
            });
        } catch (error) {
            console.error('Error tracking recommendation click:', error);
        }
    };
}
